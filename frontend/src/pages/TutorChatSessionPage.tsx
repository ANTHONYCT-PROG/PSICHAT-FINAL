import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { tutorService } from '../services/tutorService';
import { websocketService } from '../services/websocket';
import TutorLayout from '../components/TutorLayout';
import { 
  FaArrowLeft, 
  FaPaperPlane, 
  FaUser, 
  FaUserTie, 
  FaClock, 
  FaComments,
  FaSmile,
  FaPaperclip,
  FaMicrophone,
  FaEllipsisV,
  FaHeart,
  FaRegHeart,
  FaCheck,
  FaCheckDouble,
  FaExclamationTriangle,
  FaLightbulb,
  FaGraduationCap,
  FaChartLine,
  FaBrain,
  FaEye,
  FaPause,
  FaPlay,
  FaStop,
  FaVolumeUp,
  FaVolumeMute,
  FaCog,
  FaInfoCircle,
  FaHistory,
  FaBookmark,
  FaShare,
  FaFlag,
  FaThumbsUp,
  FaThumbsDown
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmotionAnalysis from '../components/EmotionAnalysis';
import ChatStats from '../components/ChatStats';

interface SessionMessage {
  id: number;
  usuario_id: number;
  sesion_id: number;
  texto: string;
  remitente: 'user' | 'tutor';
  tipo_mensaje: string;
  metadatos: any;
  creado_en: string;
}

interface ChatSession {
  id: number;
  estudiante_nombre: string;
  estudiante_email: string;
  iniciada_en: string;
  mensajes_count: number;
  estado: string;
  prioridad: string;
  ultima_actividad: string;
}

interface MessageStatus {
  [key: number]: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export default function TutorChatSessionPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [messageStatus, setMessageStatus] = useState<MessageStatus>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEmotionAnalysis, setShowEmotionAnalysis] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !sessionId) {
      navigate('/tutor/dashboard');
      return;
    }
    
    if (user.rol !== 'tutor') {
      navigate('/dashboard');
      return;
    }

    loadSessionData();
  }, [user, sessionId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session && token) {
      setupWebSocket();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [session, token]);

  const loadSessionData = async () => {
    try {
      setSessionLoading(true);
      
      const [sessionData, messagesData, statsData] = await Promise.all([
        tutorService.getSession(parseInt(sessionId!)),
        tutorService.getSessionMessages(parseInt(sessionId!)),
        tutorService.getSessionStats(parseInt(sessionId!))
      ]);
      
      setSession(sessionData);
      setMessages(messagesData);
      setSessionStats(statsData);
      
    } catch (error) {
      console.error('Error loading session data:', error);
      toast.error('Error al cargar la sesión');
      navigate('/tutor/dashboard');
    } finally {
      setSessionLoading(false);
    }
  };

  const setupWebSocket = async () => {
    if (!session || !token) return;

    try {
      await websocketService.connectToTutorChat(session.id, user!.id, token);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setWsConnected(true);

      websocketService.on('tutor_chat_message', handleWebSocketMessage);
      websocketService.on('typing_indicator', handleTypingIndicator);
      websocketService.on('tutor_chat_connected', () => setWsConnected(true));
      websocketService.on('tutor_chat_disconnected', () => setWsConnected(false));

    } catch (error) {
      console.error('Error conectando WebSocket:', error);
      toast.error('Error conectando chat en tiempo real');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    const { message } = data;
    
    // Verificar si ya existe un mensaje optimista con el mismo contenido
    setMessages(prev => {
      const existingOptimisticIndex = prev.findIndex(m => 
        m.texto === message.text && 
        m.remitente === message.remitente && 
        m.id > 1000000000000 // Los IDs optimistas son timestamps (muy grandes)
      );
      
      if (existingOptimisticIndex !== -1) {
        // Reemplazar el mensaje optimista con el real
        const updatedMessages = [...prev];
        updatedMessages[existingOptimisticIndex] = {
          id: message.id,
          usuario_id: message.user_id,
          sesion_id: data.session_id,
          texto: message.text,
          remitente: message.remitente,
          tipo_mensaje: 'texto',
          metadatos: message.analysis || {},
          creado_en: message.timestamp
        };
        return updatedMessages;
      } else {
        // Agregar el nuevo mensaje si no existe un optimista
        const newMessageObj: SessionMessage = {
          id: message.id,
          usuario_id: message.user_id,
          sesion_id: data.session_id,
          texto: message.text,
          remitente: message.remitente,
          tipo_mensaje: 'texto',
          metadatos: message.analysis || {},
          creado_en: message.timestamp
        };
        return [...prev, newMessageObj];
      }
    });
    
    if (message.remitente === 'user') {
      websocketService.sendReadReceipt(data.session_id, message.id);
    }
  };

  const handleTypingIndicator = (data: any) => {
    const { user_id, is_typing } = data;
    
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (is_typing) {
        newSet.add(user_id);
      } else {
        newSet.delete(user_id);
      }
      return newSet;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (wsConnected && session && websocketService.isConnected()) {
      // Usar el tipo correcto para indicadores de escritura del tutor
      websocketService.send({
        type: 'tutor_typing',
        session_id: session.id,
        is_typing: value.length > 0
      });
    }
  };

  useEffect(() => {
    if (wsConnected && session && newMessage.length === 0 && websocketService.isConnected()) {
      websocketService.send({
        type: 'tutor_typing',
        session_id: session.id,
        is_typing: false
      });
    }
  }, [newMessage, wsConnected, session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (text: string) => {
    if (!session || !text.trim()) return;

    const tempId = Date.now();
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      setLoading(true);
      
      if (wsConnected) {
        // Enviar mensaje a través de WebSocket
        websocketService.sendTutorChatMessage(session.id, text, 'tutor');
        
        // Agregar mensaje optimista solo si no existe ya
        setMessages(prev => {
          const existingMessage = prev.find(m => 
            m.texto === text && 
            m.remitente === 'tutor' && 
            Math.abs(Date.now() - new Date(m.creado_en).getTime()) < 5000 // Últimos 5 segundos
          );
          
          if (existingMessage) {
            return prev; // No agregar duplicado
          }
          
          const optimisticMessage: SessionMessage = {
            id: tempId,
            usuario_id: user!.id,
            sesion_id: session.id,
            texto: text,
            remitente: 'tutor',
            tipo_mensaje: 'texto',
            metadatos: {},
            creado_en: new Date().toISOString()
          };
          
          return [...prev, optimisticMessage];
        });
        
        setNewMessage('');
        
        setTimeout(() => {
          setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
        }, 500);
        
        setTimeout(() => {
          setMessageStatus(prev => ({ ...prev, [tempId]: 'delivered' }));
        }, 1000);
        
      } else {
        const newMessage = await tutorService.sendMessageToSession(session.id, text);
        setMessages(prev => [...prev, newMessage]);
        setNewMessage('');
        setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
      setMessageStatus(prev => ({ ...prev, [tempId]: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !loading) {
      sendMessage(newMessage);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <div className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />;
      case 'sent':
        return <FaCheck className="text-gray-400 text-xs" />;
      case 'delivered':
        return <FaCheckDouble className="text-gray-400 text-xs" />;
      case 'read':
        return <FaCheckDouble className="text-blue-500 text-xs" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500 text-xs" />;
      default:
        return null;
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast.success(isRecording ? 'Grabación detenida' : 'Grabación iniciada');
  };

  const togglePause = async () => {
    try {
      if (isPaused) {
        await tutorService.resumeSession(session!.id);
        setIsPaused(false);
        toast.success('Sesión reanudada');
      } else {
        await tutorService.pauseSession(session!.id);
        setIsPaused(true);
        toast.success('Sesión pausada');
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast.error('Error al cambiar estado de la sesión');
    }
  };

  const sendQuickResponse = (response: string) => {
    sendMessage(response);
    setShowQuickActions(false);
  };

  if (sessionLoading) {
    return (
      <TutorLayout showNavigation={false}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando sesión...</p>
          </div>
        </div>
      </TutorLayout>
    );
  }

  if (!session) {
    return (
      <TutorLayout showNavigation={false}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Sesión no encontrada</p>
            <button
              onClick={() => navigate('/tutor/dashboard')}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Volver al dashboard
            </button>
          </div>
        </div>
      </TutorLayout>
    );
  }

  return (
    <TutorLayout showNavigation={false}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/tutor/dashboard')}
                className="text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaGraduationCap className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    Chat con {session.estudiante_nombre}
                  </h1>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className={wsConnected ? 'text-emerald-600' : 'text-red-600'}>
                      {wsConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                      session.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {session.prioridad}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStats(true)}
                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <FaChartLine />
              </button>
              
              <button
                onClick={togglePause}
                className={`p-2 rounded-lg transition-colors ${
                  isPaused 
                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                    : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                }`}
              >
                {isPaused ? <FaPlay /> : <FaPause />}
              </button>
              
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <FaEllipsisV />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
          >
            <div className="space-y-1">
              <button
                onClick={() => sendQuickResponse('Entiendo tu situación. ¿Te gustaría que profundicemos en esto?')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
              >
                💬 Respuesta empática
              </button>
              <button
                onClick={() => sendQuickResponse('¿Podrías contarme más sobre esto?')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
              >
                ❓ Pregunta exploratoria
              </button>
              <button
                onClick={() => sendQuickResponse('Te sugiero que consideres las siguientes opciones...')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
              >
                💡 Sugerencia
              </button>
              <button
                onClick={() => sendQuickResponse('¿Te sientes mejor ahora?')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
              >
                ❤️ Verificación emocional
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-4rem)]">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaComments className="text-2xl text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Iniciando conversación con {session.estudiante_nombre}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  El estudiante está listo para comenzar. Escribe tu primer mensaje para iniciar la sesión de tutoría.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.remitente === 'tutor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg ${
                    message.remitente === 'tutor' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  } rounded-2xl px-4 py-3 shadow-sm`}>
                    
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {message.remitente === 'tutor' ? (
                        <FaUserTie className="text-xs opacity-80" />
                      ) : (
                        <FaUser className="text-xs opacity-80" />
                      )}
                      <span className="text-xs opacity-80">
                        {message.remitente === 'tutor' ? 'Tú' : session.estudiante_nombre}
                      </span>
                      <span className="text-xs opacity-60">
                        {formatTime(message.creado_en)}
                      </span>
                    </div>

                    {/* Message Content */}
                    <p className="text-sm leading-relaxed mb-2">{message.texto}</p>

                    {/* Message Footer */}
                    <div className="flex items-center justify-between">
                      {message.remitente === 'tutor' && (
                        <div className="flex items-center gap-1">
                          {getMessageStatusIcon(messageStatus[message.id])}
                        </div>
                      )}
                      
                      {message.metadatos && Object.keys(message.metadatos).length > 0 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setShowEmotionAnalysis(showEmotionAnalysis === message.id ? null : message.id)}
                            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <FaLightbulb className="inline mr-1" />
                            Análisis
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Emotion Analysis */}
                    {showEmotionAnalysis === message.id && message.metadatos && (
                      <EmotionAnalysis
                        analysis={message.metadatos}
                        isVisible={true}
                        onToggle={() => setShowEmotionAnalysis(null)}
                      />
                    )}
                  </div>
                </motion.div>
              ))
            )}
            
            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-sm text-gray-600">{session.estudiante_nombre} escribiendo...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              {/* Attachment Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className="p-3 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                >
                  <FaPaperclip />
                </button>
                
                <AnimatePresence>
                  {showAttachmentMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
                    >
                      <button
                        type="button"
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                      >
                        📷 Foto
                      </button>
                      <button
                        type="button"
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                      >
                        📄 Documento
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-3 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
              >
                <FaSmile />
              </button>

              {/* Voice Recording Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-full transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <FaMicrophone />
              </button>

              {/* Input Field */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Escribe tu mensaje..."
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    if (wsConnected && session) {
                      websocketService.sendTypingIndicator(session.id, false);
                    }
                  }}
                />
                
                {/* Emoji Picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 grid grid-cols-6 gap-1"
                    >
                      {['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '😢', '😡', '👏', '🙏'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className="p-2 hover:bg-gray-50 rounded text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="p-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Chat Stats Modal */}
      {sessionStats && (
        <ChatStats
          stats={sessionStats}
          visible={showStats}
          onClose={() => setShowStats(false)}
        />
      )}
    </TutorLayout>
  );
} 