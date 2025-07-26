import { create } from "zustand";
import { authService } from "../services/api";

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  tabId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  restore: () => void;
  getCurrentUser: () => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
  syncFromStorage: () => void;
  switchSession: (tabId: string) => void;
  getSessionData: (tabId: string) => { token: string | null; user: User | null };
  setSessionData: (tabId: string, token: string | null, user: User | null) => void;
}

// Función para generar un ID único de pestaña
const generateTabId = () => {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Función para obtener el ID de la pestaña actual
const getCurrentTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  tabId: null,
  
  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.login(email, password);
      
      // Asumiendo que el backend devuelve { access_token, user }
      const { access_token, user } = response;
      const tabId = getCurrentTabId();
      
      // Guardar en localStorage con el ID de la pestaña
      const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
      sessions[tabId] = { token: access_token, user };
      localStorage.setItem('sessions', JSON.stringify(sessions));
      
      // Disparar evento personalizado para sincronizar otras pestañas
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { action: 'login', tabId, token: access_token, user } 
      }));
      set({ token: access_token, user, loading: false, error: null, tabId });
      return user; // <-- Retorna el usuario autenticado
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Error al iniciar sesión';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.register(userData);
      
      // Asumiendo que el backend devuelve { access_token, user }
      const { access_token, user } = response;
      const tabId = getCurrentTabId();
      
      // Guardar en localStorage con el ID de la pestaña
      const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
      sessions[tabId] = { token: access_token, user };
      localStorage.setItem('sessions', JSON.stringify(sessions));
      
      // Disparar evento personalizado para sincronizar otras pestañas
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { action: 'login', tabId, token: access_token, user } 
      }));
      set({ token: access_token, user, loading: false, error: null, tabId });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Error al registrarse';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: () => {
    const tabId = getCurrentTabId();
    
    // Eliminar solo la sesión de esta pestaña
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    delete sessions[tabId];
    localStorage.setItem('sessions', JSON.stringify(sessions));
    
    // Disparar evento personalizado para sincronizar otras pestañas
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { action: 'logout', tabId } 
    }));
    set({ token: null, user: null, error: null });
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  restore: () => {
    const tabId = getCurrentTabId();
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    const sessionData = sessions[tabId];
    
    if (sessionData && sessionData.token && sessionData.user) {
      set({ token: sessionData.token, user: sessionData.user, tabId });
    } else {
      set({ token: null, user: null, tabId });
    }
  },

  syncFromStorage: () => {
    const tabId = getCurrentTabId();
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    const sessionData = sessions[tabId];
    
    if (sessionData && sessionData.token && sessionData.user) {
      set({ token: sessionData.token, user: sessionData.user, tabId });
    } else {
      set({ token: null, user: null, tabId });
    }
  },

  switchSession: (newTabId: string) => {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    const sessionData = sessions[newTabId];
    
    if (sessionData && sessionData.token && sessionData.user) {
      set({ token: sessionData.token, user: sessionData.user, tabId: newTabId });
      sessionStorage.setItem('tabId', newTabId);
    }
  },

  getSessionData: (tabId: string) => {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    const sessionData = sessions[tabId] || { token: null, user: null };
    return sessionData;
  },

  setSessionData: (tabId: string, token: string | null, user: User | null) => {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    if (token && user) {
      sessions[tabId] = { token, user };
    } else {
      delete sessions[tabId];
    }
    localStorage.setItem('sessions', JSON.stringify(sessions));
  },

  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const user = await authService.getCurrentUser();
      const tabId = getCurrentTabId();
      
      // Actualizar la sesión de esta pestaña
      const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
      sessions[tabId] = { token, user };
      localStorage.setItem('sessions', JSON.stringify(sessions));
      
      set({ user });
    } catch (error) {
      console.error('Error getting current user:', error);
      // Si hay error, limpiar datos corruptos de esta pestaña
      const tabId = getCurrentTabId();
      const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
      delete sessions[tabId];
      localStorage.setItem('sessions', JSON.stringify(sessions));
      set({ token: null, user: null });
    }
  },

  updateProfile: async (userData: any) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await authService.updateProfile(userData);
      const tabId = getCurrentTabId();
      
      // Actualizar la sesión de esta pestaña
      const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
      if (sessions[tabId]) {
        sessions[tabId].user = updatedUser;
        localStorage.setItem('sessions', JSON.stringify(sessions));
      }
      
      // Disparar evento personalizado para sincronizar otras pestañas
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { action: 'updateProfile', tabId, user: updatedUser } 
      }));
      set({ user: updatedUser, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Error al actualizar perfil';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
})); 

// Configurar listeners para sincronización entre pestañas
if (typeof window !== 'undefined') {
  // Listener para cambios en localStorage (otras pestañas)
  window.addEventListener('storage', (e) => {
    if (e.key === 'sessions') {
      const { syncFromStorage } = useAuthStore.getState();
      syncFromStorage();
    }
  });

  // Listener para eventos personalizados (misma pestaña)
  window.addEventListener('authStateChanged', (e: any) => {
    const { action, tabId, token, user } = e.detail;
    const currentTabId = getCurrentTabId();
    
    // Solo procesar eventos de otras pestañas
    if (tabId !== currentTabId) {
      switch (action) {
        case 'login':
          useAuthStore.getState().setSessionData(tabId, token, user);
          break;
        case 'logout':
          useAuthStore.getState().setSessionData(tabId, null, null);
          break;
        case 'updateProfile':
          const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
          if (sessions[tabId]) {
            sessions[tabId].user = user;
            localStorage.setItem('sessions', JSON.stringify(sessions));
          }
          break;
      }
    }
  });
} 