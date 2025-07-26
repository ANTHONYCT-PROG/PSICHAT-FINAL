import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/api';
import type { ChatSession, SessionReport } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { FaEye, FaFileAlt, FaClock, FaComments, FaUser, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';

export default function SessionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await chatService.getUserSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionReport = async (sessionId: number) => {
    try {
      setLoading(true);
      const report = await chatService.getSessionReport(sessionId);
      setSessionReport(report);
      setShowReport(true);
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800';
      case 'cerrada':
        return 'bg-red-100 text-red-800';
      case 'pausada':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      {/* Header Mejorado */}
      <Header 
        title="Mis Sesiones"
        subtitle="Historial de Sesiones de Chat"
        showBackButton={true}
        onBack={() => navigate('/dashboard')}
      />

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando sesiones...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <FaComments className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay sesiones</h3>
            <p className="text-gray-600 mb-6">Aún no has tenido sesiones de chat.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/chat')}
              className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Iniciar nueva sesión
            </motion.button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sesiones */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Historial de Sesiones</h2>
                <p className="text-gray-600 mt-1">
                  {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} encontrada{sessions.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            Sesión #{session.id}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.estado)}`}>
                            {session.estado.charAt(0).toUpperCase() + session.estado.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FaClock className="text-gray-400" />
                            <span>Iniciada: {formatDate(session.iniciada_en)}</span>
                          </div>
                          {session.finalizada_en && (
                            <div className="flex items-center gap-2">
                              <FaClock className="text-gray-400" />
                              <span>Finalizada: {formatDate(session.finalizada_en)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FaComments className="text-gray-400" />
                            <span>{session.mensajes_count} mensajes</span>
                          </div>
                          {session.duracion_total && (
                            <div className="flex items-center gap-2">
                              <FaClock className="text-gray-400" />
                              <span>Duración: {formatDuration(session.duracion_total)}</span>
                            </div>
                          )}
                          {session.tutor_id && (
                            <div className="flex items-center gap-2">
                              <FaUser className="text-gray-400" />
                              <span>Tutor asignado</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                            onClick={() => loadSessionReport(session.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver reporte"
                        >
                          <FaFileAlt size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/chat?session=${session.id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Continuar sesión"
                        >
                          <FaEye size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
      </div>

            {/* Reporte de Sesión */}
      {showReport && sessionReport && (
          <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Reporte de Sesión #{selectedSession?.id}
                  </h3>
                <button
                  onClick={() => setShowReport(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FaTimes size={16} />
                </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Emoción Promedio</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {sessionReport.average_emotion || 'N/A'}
                    </p>
                </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Estilo Promedio</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {sessionReport.average_style || 'N/A'}
                    </p>
                </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">Total Mensajes</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {sessionReport.total_messages || 0}
                    </p>
                </div>
              </div>

                {sessionReport.recommendations && sessionReport.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Recomendaciones</h4>
                    <ul className="space-y-2">
                    {sessionReport.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-indigo-500 mt-1">•</span>
                          {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </motion.div>
            )}
        </div>
      )}
      </main>
    </div>
  );
} 