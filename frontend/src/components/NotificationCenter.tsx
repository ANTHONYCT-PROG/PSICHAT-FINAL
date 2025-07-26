import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaUserCircle } from 'react-icons/fa';
import { useAuthStore } from '../stores/authStore';
import { websocketService } from '../services/websocket';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // WebSocket notification handlers
  useEffect(() => {
    const handleSystemNotification = (data: any) => {
      const newNotification: Notification = {
        id: `system_${Date.now()}`,
        type: 'info',
        title: data.notification.title || 'Notificación del Sistema',
        message: data.notification.message || 'Nueva notificación',
        timestamp: new Date(),
        read: false,
        data: data.notification
      };
      
      addNotification(newNotification);
    };

    const handleAlertNotification = (data: any) => {
      const priority = data.analysis?.priority || 'normal';
      const emotion = data.analysis?.emotion || 'emoción detectada';
      
      const newNotification: Notification = {
        id: `alert_${Date.now()}`,
        type: priority === 'crítica' || priority === 'alta' ? 'error' : 'warning',
        title: `Alerta ${priority.toUpperCase()}`,
        message: `Detección de ${emotion} con prioridad ${priority}`,
        timestamp: new Date(),
        read: false,
        data: data.analysis
      };
      
      addNotification(newNotification);
      
      // Show toast for critical alerts
      if (priority === 'crítica') {
        toast.error(`🚨 ALERTA CRÍTICA: ${emotion}`, {
          duration: 10000,
          icon: '🚨'
        });
      } else if (priority === 'alta') {
        toast.error(`⚠️ ALERTA ALTA: ${emotion}`, {
          duration: 8000,
          icon: '⚠️'
        });
      }
    };

    const handleAnalysisResponse = (data: any) => {
      const newNotification: Notification = {
        id: `analysis_${Date.now()}`,
        type: 'success',
        title: 'Análisis Completado',
        message: 'El análisis emocional se ha completado exitosamente',
        timestamp: new Date(),
        read: false,
        data: data.analysis
      };
      
      addNotification(newNotification);
    };

    // Setup WebSocket listeners
    websocketService.on('system_notification', handleSystemNotification);
    websocketService.on('alert_notification', handleAlertNotification);
    websocketService.on('analysis_response', handleAnalysisResponse);

    return () => {
      websocketService.off('system_notification', handleSystemNotification);
      websocketService.off('alert_notification', handleAlertNotification);
      websocketService.off('analysis_response', handleAnalysisResponse);
    };
  }, []);

  // Auth state change notifications
  useEffect(() => {
    const handleAuthStateChange = (isAuthenticated: boolean) => {
      if (isAuthenticated) {
        const welcomeNotification: Notification = {
          id: `welcome_${Date.now()}`,
          type: 'success',
          title: '¡Bienvenido de vuelta!',
          message: 'Has iniciado sesión exitosamente',
          timestamp: new Date(),
          read: false
        };
        addNotification(welcomeNotification);
      } else {
        const logoutNotification: Notification = {
          id: `logout_${Date.now()}`,
          type: 'info',
          title: 'Sesión cerrada',
          message: 'Has cerrado sesión exitosamente',
          timestamp: new Date(),
          read: false
        };
        addNotification(logoutNotification);
      }
    };

    authService.onAuthStateChange(handleAuthStateChange);

    return () => {
      // Note: We can't easily remove the listener without modifying the auth service
      // This is a limitation of the current implementation
    };
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep max 50 notifications
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error':
      case 'alert':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
      case 'alert':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
        aria-label="Notificaciones"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Panel */}
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Notificaciones</h3>
                <div className="flex gap-2">
                {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Marcar como leídas
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <FaBell size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium text-gray-800 truncate">
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 ml-2"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Limpiar todas
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 