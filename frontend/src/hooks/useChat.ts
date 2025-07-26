import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketService } from '../services/websocket';
import { tutorChatService } from '../services/api';
import type { SessionMessage } from '../services/api';
import toast from 'react-hot-toast';

interface UseChatProps {
  sessionId: number;
  userId: number;
  token: string;
}

interface MessageStatus {
  [key: number]: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export const useChat = ({ sessionId, userId, token }: UseChatProps) => {
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [messageStatus, setMessageStatus] = useState<MessageStatus>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Conectar WebSocket
  const connectWebSocket = useCallback(async () => {
    try {
      await websocketService.connectToTutorChat(sessionId, userId, token);
      setWsConnected(true);
      
      // Configurar listeners
      websocketService.on('tutor_chat_message', handleWebSocketMessage);
      websocketService.on('typing_indicator', handleTypingIndicator);
      websocketService.on('tutor_chat_connected', () => setWsConnected(true));
      websocketService.on('tutor_chat_disconnected', () => setWsConnected(false));
      
    } catch (error) {
      console.error('Error conectando WebSocket:', error);
      setWsConnected(false);
      
      // Intentar reconectar después de 5 segundos
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    }
  }, [sessionId, userId, token]);

  // Desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    websocketService.disconnect();
    setWsConnected(false);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  // Manejar mensajes WebSocket
  const handleWebSocketMessage = useCallback((data: any) => {
    const { message } = data;
    
    const newMessage: SessionMessage = {
      id: message.id,
      usuario_id: message.user_id,
      sesion_id: data.session_id,
      texto: message.text,
      remitente: message.remitente,
      tipo_mensaje: 'texto',
      metadatos: message.analysis || {},
      creado_en: message.timestamp
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Marcar como leído si es del tutor
    if (message.remitente === 'tutor') {
      websocketService.sendReadReceipt(data.session_id, message.id);
    }
  }, []);

  // Manejar indicadores de escritura
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

  // Enviar mensaje
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const tempId = Date.now();
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      setLoading(true);
      
      if (wsConnected && websocketService.isConnected()) {
        // Enviar por WebSocket
        websocketService.sendTutorChatMessage(sessionId, text, 'user');
        
        // Mensaje optimista
        const optimisticMessage: SessionMessage = {
          id: tempId,
          usuario_id: userId,
          sesion_id: sessionId,
          texto: text,
          remitente: 'user',
          tipo_mensaje: 'texto',
          metadatos: {},
          creado_en: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Simular estados de envío
        setTimeout(() => {
          setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
        }, 500);
        
        setTimeout(() => {
          setMessageStatus(prev => ({ ...prev, [tempId]: 'delivered' }));
        }, 1000);
        
      } else {
        // Fallback a API REST
        const newMessage = await tutorChatService.sendMessageToTutorSession(sessionId, text);
        setMessages(prev => [...prev, newMessage]);
        setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
      setMessageStatus(prev => ({ ...prev, [tempId]: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [sessionId, userId, wsConnected]);

  // Enviar indicador de escritura
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (wsConnected && websocketService.isConnected()) {
      websocketService.sendTypingIndicator(sessionId, isTyping);
    }
  }, [sessionId, wsConnected]);

  // Cargar mensajes
  const loadMessages = useCallback(async () => {
    try {
      const sessionMessages = await tutorChatService.getTutorSessionMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar mensajes');
    }
  }, [sessionId]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    messages,
    loading,
    wsConnected,
    typingUsers,
    messageStatus,
    sendMessage,
    sendTypingIndicator,
    loadMessages,
    connectWebSocket,
    disconnectWebSocket
  };
}; 