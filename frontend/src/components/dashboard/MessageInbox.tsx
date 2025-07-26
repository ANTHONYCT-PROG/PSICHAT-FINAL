// frontend/src/components/dashboard/MessageInbox.tsx
/**
 * Bandeja de Mensajes para el Panel del Tutor
 * Permite ver y responder mensajes de todas las sesiones activas
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FaComments, 
  FaUser, 
  FaClock, 
  FaPaperPlane, 
  FaSearch,
  FaFilter,
  FaEye,
  FaEyeSlash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { chatService } from '../../services/chatService';
import { tutorService } from '../../services/tutorService';

interface Message {
  id: number;
  contenido: string;
  timestamp: string;
  es_tutor: boolean;
  usuario_id: number;
  sesion_id: number;
  usuario_nombre?: string;
  usuario_email?: string;
}

interface Session {
  id: number;
  estudiante_nombre: string;
  estudiante_email: string;
  fecha_inicio: string;
  estado: string;
  mensajes_count: number;
  ultimo_mensaje?: string;
  ultimo_mensaje_timestamp?: string;
}

interface MessageInboxProps {
  onClose?: () => void;
}

const MessageInbox: React.FC<MessageInboxProps> = ({ onClose }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'messages'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const dashboard = await tutorService.getDashboard();
      setSessions(dashboard.sesiones_recientes || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const sessionMessages = await chatService.getSessionMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    try {
      setSending(true);
      await chatService.sendMessage({
        sesion_id: selectedSession.id,
        contenido: newMessage,
        es_tutor: true
      });
      
      setNewMessage('');
      // Recargar mensajes
      await loadMessages(selectedSession.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.estudiante_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.estudiante_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && session.estado === 'activa') ||
                         (filterStatus === 'recent' && new Date(session.fecha_inicio) > new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
        break;
      case 'name':
        comparison = a.estudiante_nombre.localeCompare(b.estudiante_nombre);
        break;
      case 'messages':
        comparison = (b.mensajes_count || 0) - (a.mensajes_count || 0);
        break;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Ahora';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'activa':
        return 'bg-green-100 text-green-800';
      case 'pausada':
        return 'bg-yellow-100 text-yellow-800';
      case 'finalizada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FaComments className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bandeja de Mensajes</h2>
              <p className="text-sm text-gray-600">
                {sessions.length} sesiones • {sessions.reduce((acc, s) => acc + (s.mensajes_count || 0), 0)} mensajes
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lista de sesiones */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Filtros y búsqueda */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="space-y-3">
              {/* Búsqueda */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar estudiante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtros */}
              <div className="flex space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas</option>
                  <option value="active">Activas</option>
                  <option value="recent">Recientes</option>
                </select>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setSortBy(sort as any);
                    setSortOrder(order as any);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date-desc">Más recientes</option>
                  <option value="date-asc">Más antiguas</option>
                  <option value="name-asc">A-Z</option>
                  <option value="name-desc">Z-A</option>
                  <option value="messages-desc">Más mensajes</option>
                  <option value="messages-asc">Menos mensajes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de sesiones */}
          <div className="flex-1 overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FaComments className="text-4xl mx-auto mb-3 text-gray-300" />
                <p>No hay sesiones disponibles</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedSession?.id === session.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {session.estudiante_nombre}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getSessionStatusColor(session.estado)}`}>
                            {session.estado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{session.estudiante_email}</p>
                        {session.ultimo_mensaje && (
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {session.ultimo_mensaje}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>{formatTimestamp(session.fecha_inicio)}</div>
                        {session.mensajes_count > 0 && (
                          <div className="mt-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {session.mensajes_count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel principal - Mensajes */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Header de la sesión */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedSession.estudiante_nombre}</h3>
                    <p className="text-sm text-gray-600">{selectedSession.estudiante_email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-sm rounded-full ${getSessionStatusColor(selectedSession.estado)}`}>
                      {selectedSession.estado}
                    </span>
                    <button
                      onClick={() => loadMessages(selectedSession.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FaEye className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FaComments className="text-4xl mx-auto mb-3 text-gray-300" />
                    <p>No hay mensajes en esta sesión</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.es_tutor ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.es_tutor
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <FaUser className={`text-xs ${message.es_tutor ? 'text-blue-200' : 'text-gray-400'}`} />
                            <span className="text-xs opacity-75">
                              {message.es_tutor ? 'Tú' : message.usuario_nombre || 'Estudiante'}
                            </span>
                          </div>
                          <p className="text-sm">{message.contenido}</p>
                          <div className="flex items-center justify-end space-x-1 mt-2">
                            <FaClock className="text-xs opacity-50" />
                            <span className="text-xs opacity-50">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input para enviar mensaje */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FaPaperPlane className="text-sm" />
                    )}
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FaComments className="text-6xl mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Selecciona una sesión</h3>
                <p className="text-sm">Elige una sesión del panel izquierdo para ver los mensajes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInbox; 