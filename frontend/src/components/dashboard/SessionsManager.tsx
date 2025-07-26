// frontend/src/components/dashboard/SessionsManager.tsx
/**
 * Gestor de sesiones del tutor - Componente robusto y completo
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  FaUserTie, 
  FaComments, 
  FaClock, 
  FaEye,
  FaPlay,
  FaPause,
  FaStop,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaArchive,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight
} from 'react-icons/fa';
import { tutorService } from '../../services/tutorService';
import type { SessionList, SessionDetail, SessionStats } from '../../services/tutorService';
import TutorChat from '../chat/TutorChat';

interface SessionsManagerProps {
  onSessionSelect?: (session: SessionDetail) => void;
}

const SessionsManager: React.FC<SessionsManagerProps> = ({ onSessionSelect }) => {
  const [sessions, setSessions] = useState<SessionList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [filters, setFilters] = useState({
    estado: '',
    estudiante_id: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getSessions(filters);
      setSessions(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las sesiones');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = async (session: SessionList) => {
    try {
      const detail = await tutorService.getSessionDetail(session.id);
      const stats = await tutorService.getSessionStats(session.id);
      setSelectedSession(detail);
      setSessionStats(stats);
      onSessionSelect?.(detail);
    } catch (err) {
      console.error('Error loading session detail:', err);
    }
  };

  const handleOpenChat = () => {
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  const handleSessionAction = async (sessionId: number, action: 'pause' | 'resume' | 'close') => {
    try {
      switch (action) {
        case 'pause':
          await tutorService.pauseSession(sessionId);
          break;
        case 'resume':
          await tutorService.resumeSession(sessionId);
          break;
        case 'close':
          await tutorService.closeSession(sessionId);
          break;
      }
      loadSessions(); // Recargar sesiones
      if (selectedSession?.id === sessionId) {
        const detail = await tutorService.getSessionDetail(sessionId);
        setSelectedSession(detail);
      }
    } catch (err) {
      console.error(`Error performing ${action} on session:`, err);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.estudiante_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.estudiante_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'activa':
        return <FaPlay className="text-green-500" />;
      case 'pausada':
        return <FaPause className="text-yellow-500" />;
      case 'cerrada':
        return <FaStop className="text-gray-500" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  // Si se está mostrando el chat, mostrar solo el chat
  if (showChat && selectedSession) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCloseChat}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowRight />
              </button>
              <div>
                <h3 className="font-semibold text-gray-900">Chat con {selectedSession.estudiante_nombre}</h3>
                <p className="text-sm text-gray-600">{selectedSession.estudiante_email}</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${tutorService.getStatusColor(selectedSession.estado)}`}>
              {selectedSession.estado}
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <TutorChat 
            sessionId={selectedSession.id} 
            onSessionUpdate={loadSessions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Sesiones</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaFilter />
              <span>Filtros</span>
            </button>
            <button
              onClick={loadSessions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtros expandibles */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="activa">Activa</option>
              <option value="pausada">Pausada</option>
              <option value="cerrada">Cerrada</option>
            </select>

            <input
              type="date"
              value={filters.fecha_inicio}
              onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Fecha inicio"
            />

            <input
              type="date"
              value={filters.fecha_fin}
              onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Fecha fin"
            />

            <button
              onClick={() => setFilters({ estado: '', estudiante_id: '', fecha_inicio: '', fecha_fin: '' })}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Sesiones */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Sesiones ({filteredSessions.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadSessions}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No se encontraron sesiones
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedSession?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(session.estado)}
                          <div>
                            <h4 className="font-medium text-gray-900">{session.estudiante_nombre}</h4>
                            <p className="text-sm text-gray-600">{session.estudiante_email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full ${tutorService.getStatusColor(session.estado)}`}>
                            {session.estado}
                          </span>
                          <span className="flex items-center">
                            <FaComments className="mr-1" />
                            {session.mensajes_count} mensajes
                          </span>
                          {session.duracion_total && (
                            <span className="flex items-center">
                              <FaClock className="mr-1" />
                              {tutorService.formatDuration(session.duracion_total)}
                            </span>
                          )}
                          <span>{tutorService.formatRelativeTime(session.iniciada_en)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {session.estado === 'activa' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionAction(session.id, 'pause');
                              }}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Pausar sesión"
                            >
                              <FaPause />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionAction(session.id, 'close');
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cerrar sesión"
                            >
                              <FaStop />
                            </button>
                          </>
                        )}
                        {session.estado === 'pausada' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionAction(session.id, 'resume');
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Reanudar sesión"
                            >
                              <FaPlay />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionAction(session.id, 'close');
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cerrar sesión"
                            >
                              <FaStop />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionClick(session);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Detalles */}
        <div className="lg:col-span-1">
          {selectedSession ? (
            <div className="space-y-6">
              {/* Detalles de la Sesión */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Detalles de Sesión</h3>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimesCircle />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedSession.estudiante_nombre}</h4>
                    <p className="text-sm text-gray-600">{selectedSession.estudiante_email}</p>
                    {selectedSession.estudiante_institucion && (
                      <p className="text-sm text-gray-500">{selectedSession.estudiante_institucion}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${tutorService.getStatusColor(selectedSession.estado)}`}>
                        {selectedSession.estado}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mensajes:</span>
                      <span className="ml-2 font-medium">{selectedSession.mensajes_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Iniciada:</span>
                      <span className="ml-2">{tutorService.formatDateTime(selectedSession.iniciada_en)}</span>
                    </div>
                    {selectedSession.duracion_total && (
                      <div>
                        <span className="text-gray-500">Duración:</span>
                        <span className="ml-2">{tutorService.formatDuration(selectedSession.duracion_total)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={handleOpenChat}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Abrir Chat
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <FaArrowRight />
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas de la Sesión */}
              {sessionStats && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaCheckCircle className="mr-2 text-green-500" />
                    Estadísticas
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{sessionStats.total_mensajes}</div>
                        <div className="text-blue-600">Total Mensajes</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{sessionStats.alertas_generadas}</div>
                        <div className="text-green-600">Alertas</div>
                      </div>
                    </div>

                    {Object.keys(sessionStats.emociones_detectadas).length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Emociones Detectadas</h4>
                        <div className="space-y-2">
                          {Object.entries(sessionStats.emociones_detectadas).map(([emotion, count]) => (
                            <div key={emotion} className="flex items-center justify-between text-sm">
                              <span className="flex items-center">
                                <span className="mr-2">{tutorService.getEmotionIcon(emotion)}</span>
                                {emotion}
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sessionStats.recomendaciones.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recomendaciones</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {sessionStats.recomendaciones.slice(0, 3).map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-yellow-500 mr-2 mt-0.5">💡</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
              <FaEye className="text-4xl mx-auto mb-4 text-gray-300" />
              <p>Selecciona una sesión para ver los detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionsManager; 