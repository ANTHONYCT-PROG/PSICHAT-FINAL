import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useSessionSync = () => {
  const syncFromStorage = useAuthStore((s) => s.syncFromStorage);
  const restore = useAuthStore((s) => s.restore);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  useEffect(() => {
    // Restaurar estado inicial
    restore();

    // Función para manejar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sessions') {
        try {
          const newSessions = JSON.parse(e.newValue || '{}');
          const currentTabId = sessionStorage.getItem('tabId');
          
          if (currentTabId && newSessions[currentTabId]) {
            const newToken = newSessions[currentTabId].token;
            if (newToken) {
              // Assuming token is managed by useAuthStore or similar
              // This part needs to be adapted to your actual token management
              // For now, we'll just set the token if it's different
              // setToken(newToken); 
            }
          }
        } catch (error) {
          console.error('Error parsing sessions from storage:', error);
        }
      }
    };

    // Función para manejar eventos personalizados de cambio de estado
    const handleAuthStateChange = (e: CustomEvent) => {
      if (e.detail.action === 'logout') {
        // Assuming logout is managed by useAuthStore or similar
        // This part needs to be adapted to your actual logout logic
        // logout(); 
      }
    };

    // Función para verificar si la sesión sigue siendo válida
    const checkSessionValidity = async () => {
      const tabId = sessionStorage.getItem('tabId');
      if (tabId) {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
        const sessionData = sessions[tabId];
        
        if (sessionData && sessionData.token) {
          try {
            // Intentar hacer una petición para verificar si el token sigue siendo válido
            const response = await fetch('http://localhost:8000/auth/me', {
              headers: {
                'Authorization': `Bearer ${sessionData.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              setNotification({
                message: 'Sesión expirada, por favor inicie sesión nuevamente',
                type: 'error'
              });
              window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { action: 'logout', tabId } 
              }));
              
              // Eliminar solo la sesión de esta pestaña
              delete sessions[tabId];
              localStorage.setItem('sessions', JSON.stringify(sessions));
            }
          } catch (error) {
            console.error('Error verificando sesión:', error);
          }
        }
      }
    };

    // Configurar listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    
    // Verificar validez de sesión cada 5 minutos
    const sessionCheckInterval = setInterval(checkSessionValidity, 5 * 60 * 1000);
    
    // Verificar validez inicial
    checkSessionValidity();

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      clearInterval(sessionCheckInterval);
    };
  }, [syncFromStorage, restore]);

  return { notification, setNotification };
}; 