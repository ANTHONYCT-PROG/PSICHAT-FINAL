import { useState, useEffect, useRef, useCallback } from 'react';
import { websocketService } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';

interface UseWebSocketOptions {
  type: 'user' | 'tutor';
  sessionId?: number;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useWebSocket({
  type,
  sessionId,
  onMessage,
  onConnect,
  onDisconnect,
  onError
}: UseWebSocketOptions) {
  const { user, token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usar refs para evitar re-renders y trackear estado
  const connectionRef = useRef<{ type: string; sessionId?: number } | null>(null);
  const listenersRegistered = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const connect = useCallback(async () => {
    if (!user?.id || !token) {
      setError('Usuario no autenticado');
      return;
    }

    // Verificar si ya estamos conectados al mismo tipo de conexión
    if (connectionRef.current && 
        connectionRef.current.type === type && 
        connectionRef.current.sessionId === sessionId &&
        websocketService.isConnected()) {
      return;
    }

    if (isConnecting) {
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Limpiar conexión anterior si es diferente
      if (connectionRef.current && 
          (connectionRef.current.type !== type || connectionRef.current.sessionId !== sessionId)) {
        websocketService.disconnect();
      }

      if (type === 'user') {
        await websocketService.connect(user.id, token);
      } else if (type === 'tutor' && sessionId) {
        await websocketService.connectToTutorChat(sessionId, user.id, token);
      }

      connectionRef.current = { type, sessionId };
      setIsConnected(true);
      onConnect?.();

    } catch (err: any) {
      console.error('Error conectando WebSocket:', err);
      setError(err.message || 'Error de conexión');
      onError?.(err);
    } finally {
      setIsConnecting(false);
    }
  }, [user?.id, token, type, sessionId, onConnect, onError]);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    connectionRef.current = null;
    listenersRegistered.current = false;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (isConnected) {
      websocketService.send(message);
    } else {
      console.warn('WebSocket no conectado, mensaje no enviado');
    }
  }, [isConnected]);

  // Setup connection and listeners
  useEffect(() => {
    if (!user?.id || !token) return;

    const setupConnection = async () => {
      await connect();

      // Register listeners only once
      if (!listenersRegistered.current) {
        const cleanupFunctions: (() => void)[] = [];

        if (type === 'user') {
          const handleConnected = () => {
            setIsConnected(true);
            onConnect?.();
          };

          const handleDisconnected = (data: any) => {
            setIsConnected(false);
            onDisconnect?.(data);
          };

          websocketService.on('connected', handleConnected);
          websocketService.on('disconnected', handleDisconnected);
          
          cleanupFunctions.push(() => {
            websocketService.off('connected', handleConnected);
            websocketService.off('disconnected', handleDisconnected);
          });

          if (onMessage) {
            websocketService.on('chat_message', onMessage);
            cleanupFunctions.push(() => {
              websocketService.off('chat_message', onMessage);
            });
          }
        } else if (type === 'tutor') {
          const handleConnected = () => {
            setIsConnected(true);
            onConnect?.();
          };

          const handleDisconnected = (data: any) => {
            setIsConnected(false);
            onDisconnect?.(data);
          };

          websocketService.on('tutor_chat_connected', handleConnected);
          websocketService.on('tutor_chat_disconnected', handleDisconnected);
          
          cleanupFunctions.push(() => {
            websocketService.off('tutor_chat_connected', handleConnected);
            websocketService.off('tutor_chat_disconnected', handleDisconnected);
          });

          if (onMessage) {
            websocketService.on('tutor_chat_message', onMessage);
            cleanupFunctions.push(() => {
              websocketService.off('tutor_chat_message', onMessage);
            });
          }
        }

        listenersRegistered.current = true;
        
        // Guardar función de cleanup
        cleanupRef.current = () => {
          cleanupFunctions.forEach(cleanup => cleanup());
        };
      }
    };

    setupConnection();

    return () => {
      // Solo desconectar si el componente se desmonta completamente
      // o si cambian los parámetros de conexión
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      listenersRegistered.current = false;
    };
  }, [user?.id, token, type, sessionId]); // Dependencias mínimas

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage
  };
} 