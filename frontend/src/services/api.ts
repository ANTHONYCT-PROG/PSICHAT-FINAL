// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Configuración de axios con interceptores para manejar tokens
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener el token de la pestaña actual
const getCurrentTabToken = () => {
  const tabId = sessionStorage.getItem('tabId');
  
  if (tabId) {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    const sessionData = sessions[tabId];
    const token = sessionData?.token || null;
    
    return token;
  }
  return null;
};

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = getCurrentTabToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const tabId = sessionStorage.getItem('tabId');
      if (tabId) {
        // En lugar de recargar la página, disparar evento para sincronizar estado
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { action: 'logout', tabId } 
        }));
        
        // Eliminar solo la sesión de esta pestaña
        const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
        delete sessions[tabId];
        localStorage.setItem('sessions', JSON.stringify(sessions));
        
        // Redirigir usando React Router en lugar de window.location
        if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
      }
    }
    
    return Promise.reject(error);
  }
);

// Tipos para TypeScript
export interface ChatMessage {
  user_text: string;
  history: Array<{ user: string; bot: string }>;
}

export interface ChatResponse {
  reply: string;
  meta: {
    emotion: string;
    emotion_score: number;
    style: string;
    style_score: number;
    priority: string;
    alert: boolean;
    alert_reason?: string;
    emotion_distribution: Array<{ emotion: string; score: number }>;
    style_distribution: Array<{ style: string; score: number }>;
  };
}

export interface AnalysisRequest {
  texto: string;
}

export interface AnalysisResult {
  emotion: string;
  emotion_score: number;
  style: string;
  style_score: number;
  priority: string;
  alert: boolean;
  alert_reason?: string;
  emotion_distribution: Array<{ emotion: string; score: number }>;
  style_distribution: Array<{ style: string; score: number }>;
}

export interface CompleteAnalysis {
  emotion: string;
  emotion_score: number;
  style: string;
  style_score: number;
  priority: string;
  alert: boolean;
  recommendations: string[];
  summary: string;
  detailed_insights: {
    emotional_state: string;
    communication_style: string;
    risk_assessment: string;
    alert_status: string;
  };
  message_text: string;
  analysis_date: string;
}

export interface AnalysisHistory {
  id: number;
  emotion: string;
  emotion_score: number;
  style: string;
  style_score: number;
  priority: string;
  alert: boolean;
  created_at: string;
  message_text: string;
}

export interface DeepAnalysis {
  total_messages: number;
  average_emotion_score: number;
  average_style_score: number;
  emotion_trend: Array<{ date: string; emotion: string; score: number }>;
  style_trend: Array<{ date: string; style: string; score: number }>;
  risk_assessment: {
    high_risk_messages: number;
    medium_risk_messages: number;
    low_risk_messages: number;
  };
  recommendations: string[];
}

export interface ChatHistory {
  id: number;
  texto: string;
  remitente: string;
  creado_en: string;
  analisis?: {
    emocion: string;
    emocion_score: number;
    estilo: string;
    estilo_score: number;
    prioridad: string;
    alerta: boolean;
  };
}

// Nuevos tipos para sesiones de chat
export interface ChatSession {
  id: number;
  usuario_id: number;
  tutor_id?: number;
  estado: 'activa' | 'cerrada' | 'pausada';
  duracion_total?: number;
  mensajes_count: number;
  metadatos?: any;
  iniciada_en: string;
  pausada_en?: string;
  finalizada_en?: string;
}

export interface SessionMessage {
  id: number;
  usuario_id: number;
  sesion_id: number;
  texto: string;
  remitente: 'user' | 'bot';
  tipo_mensaje: string;
  metadatos?: any;
  creado_en: string;
}

export interface SessionReport {
  session_id: number;
  total_messages: number;
  duration_minutes: number;
  emotion_summary: {
    dominant_emotion: string;
    emotion_distribution: Record<string, number>;
  };
  style_summary: {
    dominant_style: string;
    style_distribution: Record<string, number>;
  };
  risk_assessment: {
    high_risk_messages: number;
    medium_risk_messages: number;
    low_risk_messages: number;
  };
  recommendations: string[];
  created_at: string;
}

export interface UserNotification {
  id: number;
  usuario_id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  enviada: boolean;
  metadatos?: any;
  creado_en: string;
  leida_en?: string;
}

// Servicios de Autenticación
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (userData: Partial<any>) => {
    const response = await api.patch('/auth/me', userData);
    return response.data;
  },
};

// Servicios de Chat
export const chatService = {
  sendMessage: async (message: ChatMessage): Promise<ChatResponse> => {
    const response = await api.post('/chat/', message);
    return response.data;
  },

  getHistory: async (): Promise<ChatHistory[]> => {
    const response = await api.get('/chat/history');
    return response.data;
  },

  getUnreadMessages: async () => {
    try {
      const response = await api.get('/chat/unread');
      return response.data;
    } catch (error) {
      console.error('Error getting unread messages:', error);
      // Return empty array as fallback
      return [];
    }
  },

  analyzeMessage: async (text: string): Promise<AnalysisResult> => {
    const response = await api.post('/chat/analysis', { user_text: text });
    return response.data;
  },

  // Nuevos servicios de sesiones
  createOrGetActiveSession: async () => {
    const response = await api.post('/chat/session');
    return response.data;
  },

  getActiveSession: async () => {
    const response = await api.get('/chat/session/active');
    return response.data;
  },

  getUserSessions: async () => {
    const response = await api.get('/chat/sessions');
    return response.data;
  },

  closeSession: async (sessionId: number) => {
    const response = await api.post(`/chat/session/${sessionId}/close`);
    return response.data;
  },

  sendMessageToSession: async (sessionId: number, texto: string) => {
    const response = await api.post(`/chat/session/${sessionId}/message`, { texto });
    return response.data;
  },

  getSessionMessages: async (sessionId: number) => {
    const response = await api.get(`/chat/session/${sessionId}/messages`);
    return response.data;
  },

  getSessionReport: async (sessionId: number) => {
    const response = await api.get(`/chat/session/${sessionId}/report`);
    return response.data;
  },
};

// Servicios específicos para chat con tutor
export const tutorChatService = {
  createOrGetTutorSession: async () => {
    const response = await api.post('/tutor-chat/session', {});
    return response.data;
  },

  getActiveTutorSession: async () => {
    const response = await api.get('/tutor-chat/session/active');
    return response.data;
  },

  getTutorSessions: async () => {
    const response = await api.get('/tutor-chat/sessions');
    return response.data;
  },

  closeTutorSession: async (sessionId: number) => {
    const response = await api.post(`/tutor-chat/session/${sessionId}/close`);
    return response.data;
  },

  sendMessageToTutorSession: async (sessionId: number, texto: string) => {
    const response = await api.post(`/tutor-chat/session/${sessionId}/message`, { texto });
    return response.data;
  },

  getTutorSessionMessages: async (sessionId: number) => {
    const response = await api.get(`/tutor-chat/session/${sessionId}/messages`);
    return response.data;
  },

  getTutorSessionReport: async (sessionId: number) => {
    const response = await api.get(`/tutor-chat/session/${sessionId}/report`);
    return response.data;
  },
};

// Servicios de Análisis
export const analysisService = {
  analyzeText: async (text: string): Promise<AnalysisResult> => {
    const response = await api.post('/analysis/', { texto: text });
    return response.data;
  },

  completeAnalysis: async (text: string) => {
    const response = await api.post('/analysis/complete', { texto: text });
    return response.data;
  },

  getLastAnalysis: async (): Promise<CompleteAnalysis> => {
    const response = await api.get('/analysis/last');
    return response.data;
  },

  getAnalysisHistory: async (limit: number = 10): Promise<{ history: AnalysisHistory[] }> => {
    const response = await api.get(`/analysis/history?limit=${limit}`);
    return response.data;
  },

  getDeepAnalysis: async (): Promise<DeepAnalysis> => {
    const response = await api.get('/analysis/deep');
    return response.data;
  },
};

// Servicios de Dashboard (estadísticas y métricas)
export const dashboardService = {
  getStats: async () => {
    try {
      // Obtener historial de chat para estadísticas básicas
      const chatHistory = await chatService.getHistory();
      const analysisHistory = await analysisService.getAnalysisHistory(20);
      
      // Calcular estadísticas
      const totalChats = chatHistory.length;
      const totalMessages = chatHistory.filter(msg => msg.remitente === 'user').length;
      
      // Usar analysisHistory para todos los cálculos de emociones y estilos
      const analysisData = analysisHistory.history || [];
      
      // Calcular emoción promedio y más común desde analysisHistory
      const avgEmotionScore = analysisData.length > 0 
        ? analysisData.reduce((sum, item) => sum + (item.emotion_score || 0), 0) / analysisData.length
        : 0;
      
      // Calcular emoción más común
      const emotionCounts = analysisData.reduce((acc, item) => {
        const emotion = item.emotion || 'desconocida';
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonEmotion = Object.keys(emotionCounts).length > 0 
        ? Object.entries(emotionCounts).reduce((a, b) => emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b)[0]
        : 'Neutral';
      
      // Calcular estilo más común y promedio
      const styleCounts = analysisData.reduce((acc, item) => {
        const style = item.style || 'desconocido';
        acc[style] = (acc[style] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonStyle = Object.keys(styleCounts).length > 0 
        ? Object.entries(styleCounts).reduce((a, b) => styleCounts[a[0]] > styleCounts[b[0]] ? a : b)[0]
        : 'Neutral';
      
      // Calcular puntuación promedio de estilo
      const avgStyleScore = analysisData.length > 0 
        ? analysisData.reduce((sum, item) => sum + (item.style_score || 0), 0) / analysisData.length
        : 0;
      
      // Formatear emoción promedio con más detalle
      const avgEmotion = analysisData.length > 0 
        ? `${mostCommonEmotion} (${avgEmotionScore.toFixed(1)}%)`
        : 'Sin datos (0.0%)';
      
      // Calcular progreso emocional usando el mismo algoritmo que AnalysisPage
      const calculateEmotionalProgress = (analysisHistory: any[]) => {
        if (!analysisHistory || analysisHistory.length === 0) return 0;
        
        // Si hay muy pocos mensajes, usar un cálculo más simple
        if (analysisHistory.length < 4) {
          const avgEmotion = analysisHistory.reduce((sum, msg) => sum + msg.emotion_score, 0) / analysisHistory.length;
          return Math.round(Math.min(100, Math.max(0, avgEmotion)));
        }
        
        // Dividir el historial en dos períodos para comparar
        const midPoint = Math.floor(analysisHistory.length / 2);
        const recentMessages = analysisHistory.slice(midPoint);
        const olderMessages = analysisHistory.slice(0, midPoint);
        
        if (olderMessages.length === 0) return 50;
        
        // Calcular puntuaciones promedio por período
        const recentAvgEmotion = recentMessages.reduce((sum, msg) => sum + msg.emotion_score, 0) / recentMessages.length;
        const olderAvgEmotion = olderMessages.reduce((sum, msg) => sum + msg.emotion_score, 0) / olderMessages.length;
        
        // Calcular mejora en emociones positivas (normalizada a 0-100)
        const emotionImprovement = Math.max(0, recentAvgEmotion - olderAvgEmotion);
        const normalizedEmotionImprovement = Math.min(100, emotionImprovement * 2);
        
        // Analizar distribución de emociones
        const recentEmotions = recentMessages.map(msg => msg.emotion.toLowerCase());
        const olderEmotions = olderMessages.map(msg => msg.emotion.toLowerCase());
        
        // Contar emociones positivas vs negativas
        const positiveEmotions = ['alegría', 'felicidad', 'contento', 'tranquilo', 'optimista', 'satisfecho'];
        const negativeEmotions = ['tristeza', 'desánimo', 'ansiedad', 'preocupación', 'frustración', 'ira', 'agresivo', 'estresado'];
        
        const recentPositive = recentEmotions.filter(e => positiveEmotions.includes(e)).length;
        const recentNegative = recentEmotions.filter(e => negativeEmotions.includes(e)).length;
        const olderPositive = olderEmotions.filter(e => positiveEmotions.includes(e)).length;
        const olderNegative = olderEmotions.filter(e => negativeEmotions.includes(e)).length;
        
        // Calcular ratio de emociones positivas
        const recentPositiveRatio = recentPositive / (recentPositive + recentNegative) || 0;
        const olderPositiveRatio = olderPositive / (olderPositive + olderNegative) || 0;
        const positiveRatioImprovement = (recentPositiveRatio - olderPositiveRatio) * 100;
        
        // Calcular estabilidad emocional
        const recentVariance = recentMessages.reduce((sum, msg) => {
          return sum + Math.pow(msg.emotion_score - recentAvgEmotion, 2);
        }, 0) / recentMessages.length;
        
        const olderVariance = olderMessages.reduce((sum, msg) => {
          return sum + Math.pow(msg.emotion_score - olderAvgEmotion, 2);
        }, 0) / olderMessages.length;
        
        const stabilityImprovement = Math.max(0, (olderVariance - recentVariance) / Math.max(olderVariance, 1)) * 100;
        
        // Calcular progreso final (0-100) con pesos ajustados
        const progress = Math.min(100, Math.max(0, 
          (normalizedEmotionImprovement * 0.4) + // 40% peso a mejora emocional
          (Math.max(0, positiveRatioImprovement) * 0.3) + // 30% peso a ratio de emociones positivas
          (stabilityImprovement * 0.3) // 30% peso a estabilidad
        ));
        
        return Math.round(progress);
      };
      
      const learningProgress = calculateEmotionalProgress(analysisHistory.history);
      
      // Formatear estilo promedio con manejo de casos sin datos
      const avgStyle = (analysisHistory.history && analysisHistory.history.length > 0)
        ? `${mostCommonStyle} (${avgStyleScore.toFixed(1)}%)`
        : 'Sin datos (0.0%)';
      
      return {
        totalChats,
        totalMessages,
        avgEmotion,
        avgStyle,
        learningProgress: Math.round(learningProgress),
        recentActivity: chatHistory.slice(-5).reverse(),
        emotionTrend: analysisHistory.history.slice(-7),
        alerts: analysisHistory.history.filter(a => a.alert).length
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalChats: 0,
        totalMessages: 0,
        avgEmotion: 'Neutral',
        avgStyle: 'Neutral',
        learningProgress: 0,
        recentActivity: [],
        emotionTrend: [],
        alerts: 0
      };
    }
  },

  getEmotionTrend: async () => {
    try {
      const analysisHistory = await analysisService.getAnalysisHistory(30);
      return analysisHistory.history.map(item => ({
        date: new Date(item.created_at).toLocaleDateString(),
        emotion: item.emotion,
        score: item.emotion_score
      }));
    } catch (error) {
      console.error('Error getting emotion trend:', error);
      return [];
    }
  },

  getRecentActivity: async () => {
    try {
      const chatHistory = await chatService.getHistory();
      return chatHistory.slice(-10).reverse().map(msg => ({
        id: msg.id,
        type: msg.remitente === 'user' ? 'message' : 'response',
        text: msg.texto.substring(0, 50) + (msg.texto.length > 50 ? '...' : ''),
        date: new Date(msg.creado_en).toLocaleString(),
        emotion: msg.analisis?.emocion || 'N/A',
        priority: msg.analisis?.prioridad || 'Normal'
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }
};

// Tipos para el panel de tutor
export interface StudentAlert {
  id: string | number;
  student_id?: number;
  student_name?: string;
  student_email?: string;
  student?: {
    id: number;
    name: string;
    email: string;
  };
  emotion?: string | {
    name: string;
    score: number;
  };
  emotion_score?: number;
  style?: string;
  style_score?: number;
  priority?: string;
  alert?: boolean;
  urgency?: string;
  message_text?: string;
  lastMessage?: string;
  timestamp?: string;
  reviewed?: boolean;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface StudentInfo {
  id: number;
  name: string;
  email: string;
  avatar: string;
  last_message: string;
  last_message_time: string;
  status: string;
  emotion_status?: string;
  alert_count?: number;
}

export interface StudentConversation {
  student: {
    id: number;
    name: string;
    email: string;
    avatar: string;
  };
  conversation: Array<{
    id: number;
    sender: string;
    text: string;
    emotion: string;
    timestamp: string;
  }>;
}

export interface StudentAnalysis {
  student: {
    id: number;
    name: string;
    email: string;
  };
  latest_analysis: {
    emotion: string;
    emotion_score: number;
    style: string;
    style_score: number;
    priority: string;
    alert: boolean;
    created_at: string;
  };
  statistics: {
    total_analyses: number;
    emotion_distribution: Record<string, number>;
    style_distribution: Record<string, number>;
    most_common_emotion: string;
    most_common_style: string;
  };
}

export interface InterventionRequest {
  student_id: number;
  message: string;
}

export interface TutorNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Servicios de Tutor
export const tutorService = {
  // Obtener alertas de estudiantes
  getStudentAlerts: async (): Promise<StudentAlert[]> => {
    const response = await api.get('/tutor/alerts');
    return response.data;
  },

  // Obtener lista de estudiantes
  getStudents: async (): Promise<StudentInfo[]> => {
    const response = await api.get('/tutor/students');
    return response.data;
  },

  // Obtener lista de tutores
  getTutors: async () => {
    try {
      const response = await api.get('/tutor-chat/tutors');
      return response.data;
    } catch (error) {
      console.error('Error fetching tutors:', error);
      return [];
    }
  },

  // Obtener conversación de un estudiante
  getStudentConversation: async (studentId: number): Promise<StudentConversation> => {
    const response = await api.get(`/tutor/student/${studentId}/conversation`);
    return response.data;
  },

  // Obtener análisis de un estudiante
  getStudentAnalysis: async (studentId: number): Promise<StudentAnalysis> => {
    const response = await api.get(`/tutor/student/${studentId}/analysis`);
    return response.data;
  },

  // Enviar intervención a un estudiante
  sendIntervention: async (intervention: InterventionRequest) => {
    const response = await api.post('/tutor/intervene', intervention);
    return response.data;
  },

  // Marcar alerta como revisada
  reviewAlert: async (alertId: number, notes: string, actionTaken: string) => {
    const response = await api.put(`/tutor/alert/${alertId}/review`, {
      notes,
      action_taken: actionTaken
    });
    return response.data;
  },

  // Generar reporte
  generateReport: async (startDate: string, endDate: string, reportType: string = "general") => {
    const response = await api.post('/tutor/reports', null, {
      params: {
        start_date: startDate,
        end_date: endDate,
        report_type: reportType
      }
    });
    return response.data;
  },

  // Obtener notificaciones del tutor
  getNotifications: async (): Promise<TutorNotification[]> => {
    const response = await api.get('/tutor/notifications');
    return response.data;
  },

  // Marcar notificación como leída
  markNotificationAsRead: async (notificationId: number) => {
    const response = await api.put(`/tutor/notifications/${notificationId}/read`);
    return response.data;
  }
};

// Servicios de Notificaciones
export const notificationService = {
  getUserNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
};

// Dashboard: Endpoints reales para el estudiante
export const studentDashboardService = {
  getLastAnalysis: async () => {
    const response = await api.get('/analysis/last');
    return response.data;
  },
  getAnalysisHistory: async (limit = 10) => {
    const response = await api.get(`/analysis/history?limit=${limit}`);
    return response.data;
  },
  getDeepAnalysis: async () => {
    const response = await api.get('/analysis/deep');
    return response.data;
  },
  getCompleteAnalysis: async (texto: string) => {
    const response = await api.post('/analysis/complete', { texto });
    return response.data;
  },
  getChatHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data;
  },
};

export default api; 