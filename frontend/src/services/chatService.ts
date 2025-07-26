import { api } from './api';

export interface ChatMessage {
  id: number;
  texto: string;
  remitente: string;
  creado_en: string;
  leido: boolean;
}

export interface UnreadMessage {
  id: number;
  texto: string;
  remitente: string;
  creado_en: string;
  sesion_id: number;
}

class ChatService {
  async sendMessage(user_text: string, history: {user: string, bot: string}[]) {
    try {
      const response = await api.post('/chat/', { user_text, history });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getChatHistory() {
    try {
      const response = await api.get('/chat/history');
      return response.data;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async getUnreadMessages() {
    try {
      const response = await api.get('/chat/unread');
      return response.data;
    } catch (error) {
      console.error('Error getting unread messages:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async markMessageAsRead(messageId: number) {
    try {
      await api.put(`/chat/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async getSessionMessages(sessionId: number) {
    try {
      const response = await api.get(`/chat/session/${sessionId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error getting session messages:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService(); 