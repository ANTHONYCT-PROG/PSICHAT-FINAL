import React, { useEffect, useState } from 'react';
import { websocketService } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';

export default function WebSocketTest() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<number>(3); // Sesión de prueba

  useEffect(() => {
    if (user && token) {
      setupWebSocket();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user, token]);

  const setupWebSocket = async () => {
    try {
      await websocketService.connectToTutorChat(sessionId, user!.id, token);
      setConnected(true);

      // Configurar listeners
      websocketService.on('tutor_chat_message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      websocketService.on('tutor_typing_indicator', (data) => {
        // setTypingIndicator(data); // This line was removed from the new_code, so it's removed here.
      });

      websocketService.on('tutor_chat_connected', () => {
        setConnected(true);
      });

      websocketService.on('tutor_chat_disconnected', () => {
        setConnected(false);
      });

    } catch (error) {
      console.error('Error conectando WebSocket:', error);
    }
  };

  const sendTestMessage = () => {
    if (connected) {
      websocketService.sendTutorChatMessage(sessionId, 'Mensaje de prueba desde WebSocket', 'user');
    }
  };

  const sendTypingIndicator = (isTyping: boolean) => {
    if (connected) {
      websocketService.sendTypingIndicator(sessionId, isTyping);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Prueba de WebSocket - Tutor Chat</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Estado: <span style={{ color: connected ? 'green' : 'red' }}>
          {connected ? 'Conectado' : 'Desconectado'}
        </span></p>
        <p>Sesión ID: {sessionId}</p>
        <p>Usuario: {user?.nombre} (ID: {user?.id})</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={sendTestMessage}
          disabled={!connected}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            background: connected ? '#10b981' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: connected ? 'pointer' : 'not-allowed'
          }}
        >
          Enviar Mensaje de Prueba
        </button>
        
        <button 
          onClick={() => sendTypingIndicator(true)}
          disabled={!connected}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            background: connected ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: connected ? 'pointer' : 'not-allowed'
          }}
        >
          Escribiendo...
        </button>
        
        <button 
          onClick={() => sendTypingIndicator(false)}
          disabled={!connected}
          style={{ 
            padding: '10px 20px',
            background: connected ? '#ef4444' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: connected ? 'pointer' : 'not-allowed'
          }}
        >
          Dejar de Escribir
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Mensajes Recibidos:</h3>
        <div style={{ 
          height: '300px', 
          overflowY: 'auto', 
          border: '1px solid #e5e7eb', 
          padding: '10px',
          background: '#f9fafb'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No hay mensajes recibidos</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{ 
                marginBottom: '10px', 
                padding: '10px', 
                background: 'white', 
                borderRadius: '5px',
                border: '1px solid #e5e7eb'
              }}>
                <strong>Tipo:</strong> {msg.type}<br />
                <strong>Datos:</strong> <pre style={{ fontSize: '12px' }}>{JSON.stringify(msg, null, 2)}</pre>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3>Logs de Consola:</h3>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>
          Abre la consola del navegador (F12) para ver los logs detallados del WebSocket.
        </p>
      </div>
    </div>
  );
} 