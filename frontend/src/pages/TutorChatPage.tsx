import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, 
  FaUser,
  FaUserCircle, 
  FaPaperPlane, 
  FaSpinner, 
  FaSmile, 
  FaSadTear, 
  FaAngry, 
  FaSurprise, 
  FaMeh,
  FaEye,
  FaEyeSlash,
  FaComments, 
  FaHeart,
  FaHandsHelping,
  FaClock,
  FaCheck,
  FaTimes,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperclip,
  FaImage,
  FaFile,
  FaVideo,
  FaMapMarkerAlt,
  FaPhone,
  FaEllipsisH,
  FaSearch,
  FaFilter,
  FaSort,
  FaDownload,
  FaShare,
  FaBookmark,
  FaFlag,
  FaBan,
  FaCrown,
  FaStar,
  FaAward,
  FaTrophy,
  FaMedal,
  FaCertificate,
  FaGraduationCap,
  FaUniversity,
  FaSchool,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUserTie,
  FaUserShield,
  FaUserCheck,
  FaUserClock,
  FaUserEdit,
  FaUserCog,
  FaUserLock,
  FaUserSecret,
  FaUserNinja,
  FaUserAstronaut,
  FaUserInjured,
  FaUserNurse,
  FaUserMd,
  FaUserPlus,
  FaUserMinus,
  FaUserTimes,
  FaUserSlash,
  FaUserTag,
  FaUserFriends,
  FaUsers,
  FaChartLine,
  FaCheckDouble,
  FaExclamationTriangle,
  FaLightbulb
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { tutorChatService, tutorService } from '../services/api';

interface MessageStatus {
  [key: number]: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export default function TutorChatPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [session, setSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [messageStatus, setMessageStatus] = useState<MessageStatus>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<number | null>(null);
  const [showTutorSelector, setShowTutorSelector] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  // Set para trackear mensajes ya marcados como leídos
  const readMessages = useRef<Set<number>>(new Set());
  // Timeout para debounce de read receipts
  const readReceiptTimeout = useRef<NodeJS.Timeout | null>(null);

  // Use WebSocket hook - debe ir primero para que sendMessage esté disponible
  const { isConnected, isConnecting, error: wsError, sendMessage } = useWebSocket({
    type: 'tutor',
    sessionId: session?.id,
    onMessage: (data: any) => {
      const { message } = data;
      
      // Verificar si ya existe un mensaje optimista con el mismo contenido
      setMessages(prev => {
        // Buscar si ya existe un mensaje optimista con el mismo texto y remitente
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
          const newMessageObj = {
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
      
      // Marcar mensaje como leído si es del tutor (con debounce para evitar duplicados)
      if (message.remitente === 'tutor' && !readMessages.current.has(message.id)) {
        // Marcar como leído inmediatamente para evitar duplicados
        readMessages.current.add(message.id);
        
        // Limpiar timeout anterior si existe
        if (readReceiptTimeout.current) {
          clearTimeout(readReceiptTimeout.current);
        }
        
        // Enviar read receipt con debounce de 500ms
        readReceiptTimeout.current = setTimeout(() => {
          if (session) {
            sendMessage({
              type: 'tutor_read_receipt',
              session_id: data.session_id,
              message_id: message.id
            });
          }
        }, 500);
      }
    },
    onConnect: () => {
      // WebSocket de tutor conectado exitosamente
    },
    onDisconnect: (data) => {
      toast.error('Desconectado del chat con tutor. Reconectando...');
    },
    onError: (error) => {
      console.error('Error de WebSocket:', error);
      toast.error('Error de conexión con tutor');
    }
  });

  // Handle WebSocket messages - ahora puede usar sendMessage
  const handleWebSocketMessage = useCallback((data: any) => {
    const { message } = data;
    
    // Verificar si ya existe un mensaje optimista con el mismo contenido
    setMessages(prev => {
      // Buscar si ya existe un mensaje optimista con el mismo texto y remitente
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
        const newMessageObj = {
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
    
    // Marcar mensaje como leído si es del tutor (con debounce para evitar duplicados)
    if (message.remitente === 'tutor' && !readMessages.current.has(message.id)) {
      // Marcar como leído inmediatamente para evitar duplicados
      readMessages.current.add(message.id);
      
      // Limpiar timeout anterior si existe
      if (readReceiptTimeout.current) {
        clearTimeout(readReceiptTimeout.current);
      }
      
      // Enviar read receipt con debounce de 500ms
      readReceiptTimeout.current = setTimeout(() => {
        if (session) {
          sendMessage({
            type: 'tutor_read_receipt',
            session_id: data.session_id,
            message_id: message.id
          });
        }
      }, 500);
    }
  }, [session, sendMessage]);

  const handleTypingIndicator = useCallback((data: any) => {
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
  }, []);

  // Manejar cambios en el input para enviar indicadores de escritura
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Enviar indicador de escritura si WebSocket está conectado
    if (isConnected && session) {
      sendMessage({
        type: 'typing_indicator',
        session_id: session.id,
        is_typing: value.length > 0
      });
    }
  }, [isConnected, session, sendMessage]);

  // Enviar indicador de que dejó de escribir cuando el input se vacía
  useEffect(() => {
    if (isConnected && session && newMessage.length === 0) {
      sendMessage({
        type: 'typing_indicator',
        session_id: session.id,
        is_typing: false
      });
    }
  }, [newMessage, isConnected, session, sendMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeTutorSession = async () => {
    try {
      setSessionLoading(true);
      
      // Intentar obtener sesión activa
      try {
        const activeSession = await tutorChatService.getActiveTutorSession();
        setSession(activeSession);
        await loadSessionMessages(activeSession.id);
        await loadSessionStats(activeSession.id);
      } catch (error: any) {
        // Si no hay sesión activa, mostrar selector de tutores
        setShowTutorSelector(true);
        const tutorsList = await tutorService.getTutors();
        setTutors(tutorsList);
      }
    } catch (error) {
      console.error('Error initializing tutor session:', error);
      toast.error('Error al conectar con el tutor');
    } finally {
      setSessionLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const sessionMessages = await tutorChatService.getTutorSessionMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar mensajes');
    }
  };

  const loadSessionStats = async (sessionId: number) => {
    try {
      // Aquí podrías cargar estadísticas de la sesión
      setSessionStats({
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.remitente === 'user').length,
        tutorMessages: messages.filter(m => m.remitente === 'tutor').length,
        sessionDuration: '2h 15m',
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  const sendTutorMessage = async (text: string) => {
    if (!session || !text.trim()) return;

    const tempId = Date.now();
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      setLoading(true);
      
      // Enviar mensaje a través de WebSocket si está conectado
      if (isConnected) {
        sendMessage({
          type: 'tutor_chat_message',
          session_id: session.id,
          text,
          remitente: 'user'
        });
        
        // Agregar mensaje optimista a la UI solo si no existe ya
        setMessages(prev => {
          // Verificar si ya existe un mensaje con el mismo texto recién enviado
          const existingMessage = prev.find(m => 
            m.texto === text && 
            m.remitente === 'user' && 
            Math.abs(Date.now() - new Date(m.creado_en).getTime()) < 5000 // Últimos 5 segundos
          );
          
          if (existingMessage) {
            return prev; // No agregar duplicado
          }
          
          const optimisticMessage = {
          id: tempId,
          usuario_id: user!.id,
          sesion_id: session.id,
          texto: text,
          remitente: 'user',
          tipo_mensaje: 'texto',
          metadatos: {},
          creado_en: new Date().toISOString()
        };
        
          return [...prev, optimisticMessage];
        });
        
          setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
      } else {
        // Si no está conectado, enviar por API
        const response = await tutorChatService.sendTutorMessage(session.id, text);
        
        const newMessage = {
          id: response.id,
          usuario_id: user!.id,
          sesion_id: session.id,
          texto: text,
          remitente: 'user',
          tipo_mensaje: 'texto',
          metadatos: response.analysis || {},
          creado_en: response.timestamp
        };
        
        setMessages(prev => [...prev, newMessage]);
        setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remover mensaje optimista si falló
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageStatus(prev => ({ ...prev, [tempId]: 'error' }));
      
      toast.error('Error al enviar mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !loading) {
      sendTutorMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleStartChat = async () => {
    if (!selectedTutor) {
      toast.error('Por favor selecciona un tutor');
      return;
    }
    setSessionLoading(true);
    try {
      const newSession = await tutorChatService.createOrGetTutorSession({ tutor_id: selectedTutor });
      setSession(newSession);
      setShowTutorSelector(false);
      await loadSessionMessages(newSession.id);
    } catch (error) {
      toast.error('Error al crear la sesión con el tutor');
    } finally {
      setSessionLoading(false);
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.rol !== 'estudiante') {
      navigate('/dashboard');
      return;
    }

    initializeTutorSession();
  }, [user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Limpiar timeout de read receipt al desmontar
    return () => {
      if (readReceiptTimeout.current) {
        clearTimeout(readReceiptTimeout.current);
      }
    };
  }, []);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 font-sans">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Conectando con tutor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showTutorSelector && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 font-sans">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
            <div className="mb-6">
              <FaGraduationCap className="text-4xl text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Selecciona un tutor</h2>
              <p className="text-gray-600">Elige el tutor con quien quieres iniciar el chat</p>
            </div>
            
            <select
              value={selectedTutor ?? ''}
              onChange={e => setSelectedTutor(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">-- Selecciona un tutor --</option>
              {tutors.map((tutor: any) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.nombre} ({tutor.email}) - {tutor.estado}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleStartChat}
              disabled={!selectedTutor || sessionLoading}
              className="w-full bg-emerald-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {sessionLoading ? 'Conectando...' : 'Iniciar chat'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 font-sans">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <FaUserTie className="text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    Chat con Tutor
                  </h1>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className={isConnected ? 'text-emerald-600' : 'text-red-600'}>
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {session && (
                <>
                  <button
                    onClick={() => setShowSessionInfo(!showSessionInfo)}
                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <FaChartLine />
                  </button>
                  <div className="text-sm text-gray-500">
                    <FaClock className="inline mr-1" />
                    {session.mensajes_count} mensajes
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Session Info Panel */}
      <AnimatePresence>
        {showSessionInfo && sessionStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{sessionStats.totalMessages}</div>
                  <div className="text-sm text-gray-600">Total mensajes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sessionStats.userMessages}</div>
                  <div className="text-sm text-gray-600">Tus mensajes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{sessionStats.tutorMessages}</div>
                  <div className="text-sm text-gray-600">Respuestas tutor</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{sessionStats.sessionDuration}</div>
                  <div className="text-sm text-gray-600">Duración</div>
                </div>
              </div>
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
                  <FaUserTie className="text-2xl text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  ¡Bienvenido al chat con tu tutor!
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Tu tutor está listo para ayudarte. Escribe tu primer mensaje para comenzar la conversación.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={`${message.id}-${message.creado_en}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.remitente === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg ${
                    message.remitente === 'user' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  } rounded-2xl px-4 py-3 shadow-sm`}>
                    
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {message.remitente === 'user' ? (
                        <FaUser className="text-xs opacity-80" />
                      ) : (
                        <FaUserTie className="text-xs text-emerald-600" />
                      )}
                      <span className="text-xs opacity-80">
                        {message.remitente === 'user' ? 'Tú' : 'Tutor'}
                      </span>
                      <span className="text-xs opacity-60">
                        {formatTime(message.creado_en)}
                      </span>
                    </div>

                    {/* Message Content */}
                    <p className="text-sm leading-relaxed mb-2">{message.texto}</p>

                    {/* Message Footer */}
                    <div className="flex items-center justify-between">
                      {message.remitente === 'user' && (
                        <div className="flex items-center gap-1">
                          {getMessageStatusIcon(messageStatus[message.id])}
                        </div>
                      )}
                      
                      {message.metadatos && Object.keys(message.metadatos).length > 0 && (
                        <div className="flex items-center gap-1">
                          <FaLightbulb className="text-xs text-yellow-500" />
                          <span className="text-xs opacity-60">
                            Análisis emocional disponible
                          </span>
                        </div>
                      )}
                    </div>
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
                      <span className="text-sm text-gray-600">Tutor escribiendo...</span>
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
                    if (isConnected && session) {
                      sendMessage({
                        type: 'typing_indicator',
                        session_id: session.id,
                        is_typing: false
                      });
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
    </div>
  );
} 