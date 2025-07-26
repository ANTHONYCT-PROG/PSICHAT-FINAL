import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, 
  FaRobot, 
  FaEye, 
  FaEyeSlash, 
  FaSmile, 
  FaSadTear, 
  FaAngry, 
  FaSurprise, 
  FaMeh, 
  FaPaperPlane, 
  FaSpinner, 
  FaUserCircle,
  FaBrain,
  FaHeart,
  FaComments,
  FaChartLine,
  FaLightbulb,
  FaShieldAlt,
  FaClock,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { chatService, analysisService } from '../../services/api';

interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  emotion?: string;
  emotion_score?: number;
  style?: string;
  style_score?: number;
  analysis?: any;
  isTyping?: boolean;
  isRead?: boolean;
}

interface ChatInterfaceProps {
  sessionId?: number;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

// Animaciones
const bubbleVariants = {
  initial: { opacity: 0, y: 20, scale: 0.8 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.8 }
};

const typingVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  }
};

const dotVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      ease: "easeInOut"
    }
  }
};

// Función para obtener icono de emoción
const getEmotionIcon = (emotion: string) => {
  const emotionIcons: { [key: string]: React.ReactNode } = {
    alegria: <FaSmile className="text-yellow-500" />,
    tristeza: <FaSadTear className="text-blue-500" />,
    enojo: <FaAngry className="text-red-500" />,
    sorpresa: <FaSurprise className="text-purple-500" />,
    miedo: <FaSurprise className="text-orange-500" />,
    disgusto: <FaMeh className="text-green-500" />,
    neutral: <FaMeh className="text-gray-500" />
  };
  return emotionIcons[emotion?.toLowerCase()] || <FaMeh className="text-gray-500" />;
};

// Función para obtener color de emoción
const getEmotionColor = (emotion: string) => {
  const colors: { [key: string]: string } = {
    alegria: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    tristeza: 'bg-blue-100 text-blue-800 border-blue-200',
    enojo: 'bg-red-100 text-red-800 border-red-200',
    sorpresa: 'bg-purple-100 text-purple-800 border-purple-200',
    miedo: 'bg-orange-100 text-orange-800 border-orange-200',
    disgusto: 'bg-green-100 text-green-800 border-green-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[emotion?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Función para obtener color de estilo
const getStyleColor = (style: string) => {
  const colors: { [key: string]: string } = {
    asertivo: 'bg-green-100 text-green-800 border-green-200',
    pasivo: 'bg-blue-100 text-blue-800 border-blue-200',
    agresivo: 'bg-red-100 text-red-800 border-red-200',
    manipulador: 'bg-purple-100 text-purple-800 border-purple-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[style?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function ChatInterface({ 
  sessionId = 1, 
  onBack, 
  title = "PsiChat Bot",
  subtitle = "Tu asistente emocional inteligente"
}: ChatInterfaceProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [botSessionId, setBotSessionId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeoutRef, setTypingTimeoutRef] = useState<NodeJS.Timeout | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'chat_message' && data.message) {
      const newMessage: ChatMessage = {
        id: data.message.id,
        content: data.message.text,
        sender: (data.message.remitente === 'bot' || data.message.remitente === 'tutor') ? 'bot' : 'user',
        timestamp: data.message.timestamp,
        emotion: data.message.analysis?.emotion,
        emotion_score: data.message.analysis?.emotion_score,
        style: data.message.analysis?.style,
        style_score: data.message.analysis?.style_score,
        analysis: data.message.analysis
      };
      
      setMessages(prev => [...prev, newMessage]);
      toast.success('Análisis completado en tiempo real');
    } else if (data.type === 'alert_notification') {
      toast.error(`Alerta: ${data.analysis?.priority || 'normal'} - ${data.analysis?.emotion || 'emoción detectada'}`);
    }
  }, []);

  // Use WebSocket hook
  const { isConnected, isConnecting, error: wsError, sendMessage } = useWebSocket({
    type: 'user',
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      // WebSocket conectado
    },
    onDisconnect: (data) => {
      toast.error('Desconectado del chat. Reconectando...');
    },
    onError: (error) => {
      console.error('Error de WebSocket:', error);
      toast.error('Error de conexión');
    }
  });

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id) return;
      
      try {
        // Get or create bot session
        const sessionResponse = await chatService.createOrGetActiveSession();
        
        setBotSessionId(sessionResponse.id);
        
        // Load messages from this session
        const messagesResponse = await chatService.getSessionMessages(sessionResponse.id);
        
        const formattedMessages: ChatMessage[] = messagesResponse.map((msg: any) => ({
          id: msg.id,
          content: msg.contenido,
          sender: (msg.remitente === 'bot' || msg.remitente === 'tutor') ? 'bot' : 'user',
          timestamp: msg.timestamp,
          emotion: msg.analisis?.emocion,
          emotion_score: msg.analisis?.emocion_score,
          style: msg.analisis?.estilo,
          style_score: msg.analisis?.estilo_score,
          analysis: msg.analisis
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
        toast.error('Error al cargar el historial del chat');
      }
    };

    loadChatHistory();
  }, [user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // Send typing indicator
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
    }
    
    if (botSessionId && isConnected) {
      sendMessage({
        type: 'typing_indicator',
        session_id: botSessionId,
        is_typing: true
      });
    }
    
    const timeout = setTimeout(() => {
      if (botSessionId && isConnected) {
        sendMessage({
          type: 'typing_indicator',
          session_id: botSessionId,
          is_typing: false
        });
      }
    }, 1000);
    
    setTypingTimeoutRef(timeout);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.id || !botSessionId) return;
    
    setLoading(true);
    setError(null);
    setIsTyping(true);
    
    // Clear typing indicator
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
    }
    if (botSessionId) {
      sendMessage({
        type: 'typing_indicator',
        message: {
          session_id: botSessionId,
          is_typing: false
        }
      });
    }

    try {
      // Add user message to local state immediately
      const userMessage: ChatMessage = {
        id: Date.now(),
        content: input,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      const currentInput = input;
      setInput("");
      
      // Convert messages to the format expected by the backend
      const history = messages.map(msg => ({
        user: msg.sender === 'user' ? msg.content : '',
        bot: msg.sender === 'bot' ? msg.content : ''
      })).filter(msg => msg.user || msg.bot);
      
      // Send message to bot via API
      const chatResponse = await chatService.sendMessage({
        user_text: currentInput,
        history: history
      });
      
      // Add bot response with analysis
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        content: chatResponse.reply,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        emotion: chatResponse.meta?.detected_emotion,
        emotion_score: chatResponse.meta?.emotion_score,
        style: chatResponse.meta?.detected_style,
        style_score: chatResponse.meta?.style_score,
        analysis: chatResponse.meta
      };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (err: any) {
      setError(err.message || "Error al enviar mensaje");
      toast.error("Error al enviar mensaje");
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  const getConnectionStatusColor = () => {
    switch (isConnected) {
      case true: return 'text-green-500';
      case false: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (isConnected) {
      case true: return 'Conectado';
      case false: return 'Desconectado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Enhanced Chat Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <FaArrowLeft />
              <span>Volver</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <FaRobot className="text-white text-xl" />
                </div>
                {isConnected && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-600 flex items-center space-x-2">
                  <span>{subtitle}</span>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`text-xs font-medium ${getConnectionStatusColor()}`}>
                    {getConnectionStatusText()}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Analysis Toggle */}
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {showAnalysis ? <FaEye /> : <FaEyeSlash />}
              <span className="text-sm font-medium">Análisis</span>
            </button>
            
            {/* Stats Button */}
            <button className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
              <FaChartLine />
              <span className="text-sm font-medium">Estadísticas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              variants={bubbleVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                {/* Message Bubble */}
                <div className={`relative p-4 rounded-2xl shadow-lg ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-white text-gray-800 border border-purple-200'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  
                  {/* Timestamp */}
                  <div className={`text-xs mt-2 flex items-center space-x-2 ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                    <FaClock className="text-xs" />
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.isRead && <FaCheck className="text-xs" />}
                  </div>
                  
                  {/* Enhanced Analysis Info */}
                  {showAnalysis && message.analysis && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-white/20"
                    >
                      {/* Título del análisis */}
                      <div className="mb-2">
                        <span className="block text-xs font-bold text-purple-500 uppercase tracking-wider">Análisis del mensaje</span>
                      </div>
                      <div className="space-y-2">
                        {/* Emotion Analysis */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getEmotionIcon(message.emotion || 'neutral')}
                            <span className={`text-xs font-medium ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-600'}`}>
                              {message.emotion || 'Neutral'}
                            </span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getEmotionColor(message.emotion || 'neutral')}`}> 
                            {message.emotion_score || 0}%
                          </div>
                        </div>
                        {/* Style Analysis */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FaBrain className="text-xs text-purple-500" />
                            <span className={`text-xs font-medium ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-600'}`}>
                              {message.style || 'Neutral'}
                            </span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStyleColor(message.style || 'neutral')}`}> 
                            {message.style_score || 0}%
                          </div>
                        </div>
                        {/* Priority and Alert */}
                        {message.analysis?.priority && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FaLightbulb className="text-xs text-yellow-500" />
                              <span className={`text-xs font-medium ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-600'}`}>
                                Prioridad: {message.analysis.priority}
                              </span>
                            </div>
                            {message.analysis?.alerta && (
                              <div className="flex items-center space-x-1">
                                <FaShieldAlt className="text-xs text-red-500" />
                                <span className="text-xs text-red-500 font-medium">Alerta</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Avatar and Name */}
                <div className={`mt-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-flex items-center space-x-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.sender === 'bot' && (
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <FaRobot className="text-white text-xs" />
                      </div>
                    )}
                    <span className="text-xs text-gray-500 font-medium">
                      {message.sender === 'user' ? user?.nombre || 'Tú' : 'PsiChat Bot'}
                    </span>
                    {message.sender === 'user' && (
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <FaUserCircle className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-xs lg:max-w-md xl:max-w-lg">
              <div className="bg-white border border-purple-200 rounded-2xl shadow-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <FaRobot className="text-white text-xs" />
                  </div>
                  <div className="flex space-x-1">
                    <motion.div
                      variants={dotVariants}
                      animate="animate"
                      className="w-2 h-2 bg-purple-500 rounded-full"
                    />
                    <motion.div
                      variants={dotVariants}
                      animate="animate"
                      className="w-2 h-2 bg-purple-500 rounded-full"
                    />
                    <motion.div
                      variants={dotVariants}
                      animate="animate"
                      className="w-2 h-2 bg-purple-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-gray-500">PsiChat está escribiendo...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-white/95 backdrop-blur-md border-t border-purple-200 p-4 shadow-lg">
        <form onSubmit={handleSend} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe tu mensaje aquí... ¿Cómo te sientes hoy?"
              className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-gray-800 placeholder-gray-400"
              disabled={loading}
            />
            {input.length > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {input.length}/500
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {loading ? (
              <FaSpinner className="text-white text-lg animate-spin" />
            ) : (
              <FaPaperPlane className="text-white text-lg" />
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center justify-center space-x-2 text-red-500 text-sm"
          >
            <FaTimes />
            <span>{error}</span>
          </motion.div>
        )}
        
        {/* Quick Actions */}
        <div className="mt-3 flex items-center justify-center space-x-4">
          <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-purple-500 transition-colors">
            <FaHeart />
            <span>Emociones</span>
          </button>
          <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-purple-500 transition-colors">
            <FaComments />
            <span>Historial</span>
          </button>
          <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-purple-500 transition-colors">
            <FaChartLine />
            <span>Progreso</span>
          </button>
        </div>
      </div>
    </div>
  );
} 