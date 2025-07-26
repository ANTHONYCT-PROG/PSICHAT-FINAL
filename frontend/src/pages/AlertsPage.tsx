import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { chatService } from '../services/api';
import Header from '../components/layout/Header';
import { 
  FaBell, 
  FaExclamationTriangle, 
  FaCheck, 
  FaClock, 
  FaUser, 
  FaComments,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

interface Alert {
  id: number;
  contenido: string;
  timestamp: string;
  es_tutor: boolean;
  usuario_id: number;
  sesion_id: number;
  usuario_nombre?: string;
  usuario_email?: string;
  analisis?: {
    emocion: string;
    emocion_score: number;
    estilo: string;
    estilo_score: number;
    prioridad: string;
    alerta: boolean;
  };
}

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high-priority'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAlerts();
  }, [user, navigate]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const unreadMessages = await chatService.getUnreadMessages();
      setAlerts(unreadMessages);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (sessionId: number) => {
    try {
      await chatService.markMessagesAsRead(sessionId);
      // Recargar alertas después de marcar como leído
      loadAlerts();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion?.toLowerCase()) {
      case 'tristeza':
        return 'text-blue-600';
      case 'alegría':
        return 'text-yellow-600';
      case 'ansiedad':
        return 'text-red-600';
      case 'frustración':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') {
      return true; // Todos los mensajes no leídos
    }
    if (filter === 'high-priority') {
      return alert.analisis?.prioridad === 'alta';
    }
    return true; // Todos
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      <Header 
        title="Alertas y Notificaciones" 
        subtitle="Mensajes importantes y notificaciones"
        showBackButton={true}
        onBack={() => navigate('/dashboard')}
      />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'unread' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  No leídas
                </button>
                <button
                  onClick={() => setFilter('high-priority')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'high-priority' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alta prioridad
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaBell />
              <span>{filteredAlerts.length} alertas</span>
            </div>
          </div>
        </motion.div>

        {/* Lista de alertas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando alertas...</p>
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg border-l-4 border-red-500 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        alert.es_tutor ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        {alert.es_tutor ? (
                          <FaUser className="text-orange-600" />
                        ) : (
                          <FaComments className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {alert.es_tutor ? 'Mensaje del Tutor' : 'Mensaje No Leído'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Sesión #{alert.sesion_id} • {formatDate(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {alert.analisis?.alerta && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
                          <FaExclamationTriangle />
                          Alerta
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        getPriorityColor(alert.analisis?.prioridad || 'normal')
                      }`}>
                        {alert.analisis?.prioridad || 'Normal'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{alert.contenido}</p>
                  </div>
                  
                  {alert.analisis && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Análisis Emocional</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Emoción:</span>
                          <p className={`font-medium ${getEmotionColor(alert.analisis.emocion)}`}>
                            {alert.analisis.emocion} ({alert.analisis.emocion_score.toFixed(1)}%)
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Estilo:</span>
                          <p className="font-medium text-gray-900">
                            {alert.analisis.estilo} ({alert.analisis.estilo_score.toFixed(1)}%)
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Prioridad:</span>
                          <p className="font-medium text-gray-900">{alert.analisis.prioridad}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Alerta:</span>
                          <p className="font-medium text-gray-900">
                            {alert.analisis.alerta ? 'Sí' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => navigate(`/chat?session=${alert.sesion_id}`)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                      >
                        <FaComments />
                        Ver conversación
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => markAsRead(alert.sesion_id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        <FaCheck />
                        Marcar como leído
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-lg p-8 text-center"
            >
              <FaBell className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No tienes mensajes no leídos en este momento.'
                  : filter === 'high-priority'
                  ? 'No hay mensajes de alta prioridad.'
                  : 'No hay mensajes no leídos.'
                }
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AlertsPage; 