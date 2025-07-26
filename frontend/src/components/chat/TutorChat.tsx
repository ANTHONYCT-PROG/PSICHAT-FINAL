// frontend/src/components/chat/TutorChat.tsx
/**
 * Chat entre tutor y estudiante - Componente robusto y moderno
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { 
  FaPaperPlane, 
  FaSmile, 
  FaPaperclip, 
  FaMicrophone, 
  FaPhone,
  FaVideo,
  FaEllipsisV,
  FaUser,
  FaUserGraduate,
  FaClock,
  FaCheck,
  FaCheckDouble,
  FaExclamationTriangle,
  FaTimes,
  FaPlay,
  FaPause,
  FaStop,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
  FaChartBar,
  FaDownload,
  FaFileAlt
} from 'react-icons/fa';
import { tutorService } from '../../services/tutorService';
import type { SessionDetail, TutorSessionMessage } from '../../services/tutorService';
import TerminateSessionButton from '../TerminateSessionButton';

interface TutorChatProps {
  sessionId: number;
  onSessionUpdate?: () => void;
}

const TutorChat: React.FC<TutorChatProps> = ({ sessionId, onSessionUpdate }) => {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<TutorSessionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [terminatingSession, setTerminatingSession] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateNotes, setTerminateNotes] = useState('');
  const [terminateReason, setTerminateReason] = useState('');

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionData = await tutorService.getSessionDetail(sessionId);
      setSession(sessionData);
      setMessages(sessionData.mensajes || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar la sesión');
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    try {
      setSending(true);
      
      // Enviar mensaje
      await tutorService.createIntervention({
        usuario_id: session.usuario_id,
        sesion_id: sessionId,
        tipo_intervencion: 'directa',
        mensaje: newMessage,
        metodo: 'chat'
      });

      setNewMessage('');
      
      // Recargar sesión para obtener mensajes actualizados
      await loadSession();
      onSessionUpdate?.();
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTerminateSession = async () => {
    if (!session) return;

    try {
      setTerminatingSession(true);
      
      // Llamar al endpoint para generar reporte y terminar sesión
      const response = await fetch(`/api/reportes/generar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sesion_id: sessionId,
          notas_tutor: terminateNotes,
          motivo_finalizacion: terminateReason
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Sesión terminada exitosamente. Se ha generado un reporte automático.');
        setShowTerminateModal(false);
        setTerminateNotes('');
        setTerminateReason('');
        
        // Recargar sesión para mostrar el nuevo estado
        await loadSession();
        onSessionUpdate?.();
      } else {
        const errorData = await response.json();
        alert(`Error al terminar la sesión: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error terminating session:', err);
      alert('Error al terminar la sesión');
    } finally {
      setTerminatingSession(false);
    }
  };

  const getMessageStatus = (message: TutorSessionMessage) => {
    if (message.remitente === 'tutor') {
      return <FaCheckDouble className="text-blue-500 text-xs" />;
    }
    return null;
  };

  const getEmotionIcon = (emotion?: string) => {
    if (!emotion) return null;
    return (
      <span className="ml-2 text-sm" title={`Emoción: ${emotion}`}>
        {tutorService.getEmotionIcon(emotion)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600">{error || 'Sesión no encontrada'}</p>
          <button
            onClick={loadSession}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUserGraduate className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{session.estudiante_nombre}</h3>
            <p className="text-sm text-gray-600">{session.estudiante_email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${tutorService.getStatusColor(session.estado)}`}>
            {session.estado}
          </span>
          
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Análisis de la conversación"
          >
            <FaChartBar />
          </button>
          
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Descargar conversación"
          >
            <FaDownload />
          </button>

          {/* Botón de terminar sesión - solo visible si la sesión está activa */}
          {session.estado === 'activa' && (
            <TerminateSessionButton
              sessionId={sessionId}
              sessionStatus={session.estado}
              onSessionTerminated={loadSession}
            />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FaUser className="text-4xl mx-auto mb-4 text-gray-300" />
                <p>No hay mensajes en esta sesión</p>
                <p className="text-sm">Comienza la conversación enviando un mensaje</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.remitente === 'tutor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.remitente === 'tutor'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <p className="text-sm">{message.texto}</p>
                        
                        {/* Análisis del mensaje */}
                        {message.analisis && message.remitente === 'user' && (
                          <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-20">
                            <div className="flex items-center justify-between text-xs opacity-75">
                              <span className="flex items-center">
                                {getEmotionIcon(message.analisis.emocion)}
                                {message.analisis.emocion && (
                                  <span className="ml-1">
                                    {Math.round(message.analisis.emocion_score || 0)}%
                                  </span>
                                )}
                              </span>
                              {message.analisis.alerta && (
                                <FaExclamationTriangle className="text-yellow-400" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {getMessageStatus(message)}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1 text-xs opacity-75">
                      <span>{tutorService.formatDateTime(message.creado_en)}</span>
                      {message.remitente === 'tutor' && (
                        <span className="flex items-center">
                          <FaUser className="mr-1" />
                          Tú
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <FaPaperclip />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <FaSmile />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={1}
                  disabled={sending || session.estado !== 'activa'}
                />
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <FaMicrophone />
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || session.estado !== 'activa'}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </div>
            
            {session.estado !== 'activa' && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Esta sesión está {session.estado}. No se pueden enviar más mensajes.
              </p>
            )}
          </div>
        </div>

        {/* Analysis Panel */}
        {showAnalysis && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Análisis de la Conversación</h4>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2">Estadísticas</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total mensajes:</span>
                    <span className="font-medium">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mensajes estudiante:</span>
                    <span className="font-medium">
                      {messages.filter(m => m.remitente === 'user').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mensajes tutor:</span>
                    <span className="font-medium">
                      {messages.filter(m => m.remitente === 'tutor').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2">Emociones Detectadas</h5>
                <div className="space-y-1 text-sm">
                  {(() => {
                    const emotions = messages
                      .filter(m => m.analisis?.emocion)
                      .reduce((acc, m) => {
                        const emotion = m.analisis!.emocion!;
                        acc[emotion] = (acc[emotion] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                    
                    return Object.entries(emotions).map(([emotion, count]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <span className="flex items-center">
                          {tutorService.getEmotionIcon(emotion)}
                          <span className="ml-1">{emotion}</span>
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2">Alertas</h5>
                <div className="space-y-1 text-sm">
                  {(() => {
                    const alerts = messages.filter(m => m.analisis?.alerta);
                    return alerts.length > 0 ? (
                      alerts.map((message, index) => (
                        <div key={index} className="flex items-center text-yellow-600">
                          <FaExclamationTriangle className="mr-2" />
                          <span className="truncate">{message.texto.substring(0, 50)}...</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">No hay alertas</span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de terminar sesión */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaFileAlt className="mr-2 text-red-600" />
                Terminar Sesión
              </h3>
              <button
                onClick={() => setShowTerminateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Al terminar la sesión se generará automáticamente un reporte usando Gemini con el análisis completo de la conversación.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de finalización
                </label>
                <select
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar motivo...</option>
                  <option value="Sesión completada exitosamente">Sesión completada exitosamente</option>
                  <option value="Estudiante solicitó finalizar">Estudiante solicitó finalizar</option>
                  <option value="Problema técnico">Problema técnico</option>
                  <option value="Intervención requerida">Intervención requerida</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={terminateNotes}
                  onChange={(e) => setTerminateNotes(e.target.value)}
                  placeholder="Observaciones adicionales para el reporte..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTerminateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={terminatingSession}
              >
                Cancelar
              </button>
              <button
                onClick={handleTerminateSession}
                disabled={terminatingSession || !terminateReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {terminatingSession ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando reporte...
                  </>
                ) : (
                  <>
                    <FaStop className="mr-2" />
                    Terminar y Generar Reporte
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorChat;