import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { websocketService } from '../services/websocket';

interface AppState {
  isOnline: boolean;
  isConnected: boolean;
  notifications: number;
  lastActivity: Date;
  theme: 'light' | 'dark';
  language: string;
}

interface UseAppStateReturn {
  state: AppState;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  updateLastActivity: () => void;
  clearNotifications: () => void;
}

export function useAppState(): UseAppStateReturn {
  const { user } = useAuthStore();
  const [state, setState] = useState<AppState>({
    isOnline: navigator.onLine,
    isConnected: false,
    notifications: 0,
    lastActivity: new Date(),
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    language: localStorage.getItem('language') || 'es'
  });

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitorear WebSocket
  useEffect(() => {
    const handleConnect = () => setState(prev => ({ ...prev, isConnected: true }));
    const handleDisconnect = () => setState(prev => ({ ...prev, isConnected: false }));

    websocketService.on('connected', handleConnect);
    websocketService.on('disconnected', handleDisconnect);

    return () => {
      websocketService.off('connected', handleConnect);
      websocketService.off('disconnected', handleDisconnect);
    };
  }, []);

  // Monitorear actividad del usuario
  useEffect(() => {
    const updateActivity = () => {
      setState(prev => ({ ...prev, lastActivity: new Date() }));
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Aplicar tema
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

  // Aplicar idioma
  useEffect(() => {
    document.documentElement.lang = state.language;
    localStorage.setItem('language', state.language);
  }, [state.language]);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }));
  }, []);

  const setLanguage = useCallback((language: string) => {
    setState(prev => ({ ...prev, language }));
  }, []);

  const updateLastActivity = useCallback(() => {
    setState(prev => ({ ...prev, lastActivity: new Date() }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: 0 }));
  }, []);

  return {
    state,
    setTheme,
    setLanguage,
    updateLastActivity,
    clearNotifications
  };
}

// Hook para detectar inactividad
export function useInactivity(duration: number = 5 * 60 * 1000) {
  const { state, updateLastActivity } = useAppState();
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - state.lastActivity.getTime();
      setIsInactive(timeSinceLastActivity > duration);
    };

    const interval = setInterval(checkInactivity, 1000);
    return () => clearInterval(interval);
  }, [state.lastActivity, duration]);

  return { isInactive, updateLastActivity };
} 