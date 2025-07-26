/**
 * Servicio WebSocket para chat en tiempo real
 */

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface TutorChatMessage {
  id: number;
  user_id: number;
  text: string;
  remitente: 'user' | 'tutor';
  timestamp: string;
  analysis?: any;
}

export interface TypingIndicator {
  session_id: number;
  user_id: number;
  is_typing: boolean;
  timestamp: string;
}

export interface ReadReceipt {
  session_id: number;
  message_id: number;
  user_id: number;
  timestamp: string;
}

// Obtener token del store de autenticación (igual que en chatService)
function getTokenFromStore() {
  const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
  const tabId = sessionStorage.getItem('tabId');
  if (tabId && sessions[tabId] && sessions[tabId].token) {
    return sessions[tabId].token;
  }
  return localStorage.getItem('token');
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private isConnecting = false;
  private currentConnectionType: 'user' | 'tutor' | null = null;
  private currentSessionId: number | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  // Registrar event handler
  on(event: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  // Remover event handler
  off(event: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Emitir evento
  private emit(event: string, data: any) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error en handler de evento ${event}:`, error);
        }
      });
    }
  }

  // Conectar al WebSocket del usuario (chat con bot)
  connect(userId: number, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Si ya hay una conexión activa del mismo tipo, no conectar de nuevo
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentConnectionType === 'user') {
        resolve();
        return;
      }

      // Si se está intentando conectar, esperar
      if (this.isConnecting) {
        setTimeout(() => {
          this.connect(userId, token)
            .then(resolve)
            .catch(reject);
        }, 100);
        return;
      }

      // Cerrar conexión anterior si existe
      this.disconnect();

      this.isConnecting = true;
      this.currentConnectionType = 'user';

      try {
        const realToken = token || getTokenFromStore();
        if (!realToken || realToken === 'undefined' || realToken === 'null') {
          console.error('WebSocket: Token de autenticación inválido o ausente');
          this.isConnecting = false;
          reject(new Error('Token de autenticación inválido o ausente'));
          return;
        }

        const wsUrl = `ws://localhost:8000/ws/${userId}?token=${realToken}`;
        
        this.ws = new WebSocket(wsUrl);

        // Timeout para la conexión
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.error('Timeout de conexión WebSocket');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Timeout de conexión'));
          }
        }, 10000);

        this.ws.onopen = () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.emit('connected', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.emit(message.type, message);
          } catch (error) {
            this.emit('text_message', { content: event.data });
          }
        };

        this.ws.onclose = (event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.isConnecting = false;
          this.emit('disconnected', { code: event.code, reason: event.reason });

          if (event.code === 1008) {
            console.error('WebSocket: Conexión rechazada por autenticación.');
            reject(new Error('WebSocket: Conexión rechazada por autenticación.'));
            return;
          }

          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connect(userId, token).catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket de usuario error:', error);
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Conectar al WebSocket específico de tutor-chat
  connectToTutorChat(sessionId: number, userId: number, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Si ya hay una conexión activa para la misma sesión, no hacer nada
      if (this.ws && this.ws.readyState === WebSocket.OPEN && 
          this.currentConnectionType === 'tutor' && 
          this.currentSessionId === sessionId) {
        resolve();
        return;
      }

      // Si se está intentando conectar, esperar un poco y reintentar
      if (this.isConnecting) {
        setTimeout(() => {
          this.connectToTutorChat(sessionId, userId, token)
            .then(resolve)
            .catch(reject);
        }, 100);
        return;
      }

      // Cerrar conexión anterior si existe
      this.disconnect();

      this.isConnecting = true;
      this.currentConnectionType = 'tutor';
      this.currentSessionId = sessionId;
      
      try {
        const realToken = token || getTokenFromStore();
        const wsUrl = `ws://localhost:8000/ws/tutor-chat/${sessionId}?token=${realToken}`;
        
        this.ws = new WebSocket(wsUrl);

        // Timeout para la conexión
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.error('Timeout de conexión WebSocket de tutor');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Timeout de conexión'));
          }
        }, 10000);
        
        this.ws.onopen = () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.emit('tutor_chat_connected', { sessionId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.emit(message.type, message);
          } catch (error) {
            this.emit('text_message', { content: event.data });
          }
        };

        this.ws.onclose = (event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.isConnecting = false;
          
          if (event.code !== 1000) {
            this.emit('tutor_chat_disconnected', { sessionId, code: event.code, reason: event.reason });
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connectToTutorChat(sessionId, userId, token).catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket de tutor error:', error);
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Enviar mensaje
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
    // No mostrar error, simplemente no enviar si no está conectado
  }

  // Enviar mensaje de chat
  sendMessage(message: { session_id: number; text: string }): void {
    this.send({
      type: 'chat_message',
      session_id: message.session_id,
      text: message.text,
      remitente: 'user'
    });
  }

  // Solicitar análisis
  requestAnalysis(request: { text: string; request_id: string }): void {
    this.send({
      type: 'analysis_request',
      text: request.text,
      request_id: request.request_id
    });
  }

  // Enviar mensaje de tutor-chat
  sendTutorChatMessage(sessionId: number, text: string, remitente: 'user' | 'tutor' = 'user'): void {
    this.send({
      type: 'tutor_chat_message',
      session_id: sessionId,
      text,
      remitente
    });
  }

  // Enviar indicador de escritura
  sendTypingIndicator(sessionId: number, isTyping: boolean): void {
    this.send({
      type: 'tutor_typing',
      session_id: sessionId,
      is_typing: isTyping
    });
  }

  // Enviar confirmación de lectura
  sendReadReceipt(sessionId: number, messageId: number): void {
    this.send({
      type: 'tutor_read_receipt',
      session_id: sessionId,
      message_id: messageId
    });
  }

  // Enviar indicador de escritura para tutor
  sendTutorTypingIndicator(sessionId: number, isTyping: boolean): void {
    this.send({
      type: 'tutor_typing_indicator',
      session_id: sessionId,
      is_typing: isTyping
    });
  }

  // Enviar mensaje de tutor con análisis emocional
  sendTutorMessageWithAnalysis(sessionId: number, text: string, analysis?: any): void {
    this.send({
      type: 'tutor_message_with_analysis',
      session_id: sessionId,
      text,
      analysis
    });
  }

  // Enviar acción rápida del tutor
  sendTutorQuickAction(sessionId: number, actionType: string, data?: any): void {
    this.send({
      type: 'tutor_quick_action',
      session_id: sessionId,
      action_type: actionType,
      data
    });
  }

  // Enviar cambio de estado de sesión
  sendSessionStateChange(sessionId: number, newState: string): void {
    this.send({
      type: 'session_state_change',
      session_id: sessionId,
      new_state: newState
    });
  }

  // Enviar cambio de prioridad
  sendPriorityChange(sessionId: number, newPriority: string): void {
    this.send({
      type: 'priority_change',
      session_id: sessionId,
      new_priority: newPriority
    });
  }

  // Enviar alerta de emergencia
  sendEmergencyAlert(sessionId: number, alertType: string, description: string): void {
    this.send({
      type: 'emergency_alert',
      session_id: sessionId,
      alert_type: alertType,
      description
    });
  }

  // Desconectar
  disconnect(): void {
    if (this.ws) {
      // Solo cerrar si no está ya cerrado
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close(1000, 'Desconexión intencional');
      }
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.currentConnectionType = null;
    this.currentSessionId = null;
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Limpiar todos los event handlers
    this.messageHandlers.clear();
  }

  // Verificar si está conectado
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Obtener estado de la conexión
  getConnectionState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  // Obtener estado de la conexión como string
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.ws) {
      return 'disconnected';
    }
    
    switch (this.ws.readyState) {
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.CLOSED:
      case WebSocket.CLOSING:
      default:
        return 'disconnected';
    }
  }
}

// Instancia global del servicio WebSocket
export const websocketService = new WebSocketService();