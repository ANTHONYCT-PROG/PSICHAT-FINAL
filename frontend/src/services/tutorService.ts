import { api } from './api';

// Tipos consolidados del sistema de tutor
export interface DashboardStats {
  sesiones_activas: number;
  sesiones_hoy: number;
  alertas_pendientes: number;
  estudiantes_activos: number;
  mensajes_hoy: number;
  intervenciones_hoy: number;
}

export interface Student {
  id: number;
  nombre: string;
  email: string;
  estado: string;
  ultimo_acceso: string;
  sesiones_count: number;
  alertas_count: number;
}

export interface Tutor {
  id: number;
  nombre: string;
  email: string;
  estado: string;
  institucion?: string;
  grado_academico?: string;
}

export interface ChatSession {
  id: number;
  estudiante_nombre: string;
  estudiante_email: string;
  iniciada_en: string;
  mensajes_count: number;
  estado: string;
  prioridad: string;
  ultima_actividad: string;
}

export interface SessionMessage {
  id: number;
  usuario_id: number;
  sesion_id: number;
  texto: string;
  remitente: 'user' | 'tutor';
  tipo_mensaje: string;
  metadatos: any;
  creado_en: string;
}

export interface TutorSessionMessage {
  id: number;
  texto: string;
  remitente: 'user' | 'tutor' | 'bot';
  tipo_mensaje: string;
  creado_en: string;
  analisis?: {
    emocion?: string;
    emocion_score?: number;
    estilo?: string;
    estilo_score?: number;
    prioridad?: string;
    alerta: boolean;
    recomendaciones?: string[];
  };
}

export interface SessionStats {
  totalMessages: number;
  averageResponseTime: number;
  studentMessages: number;
  tutorMessages: number;
  sessionDuration: number;
  emotionalTrends: any;
  commonTopics: string[];
  engagementScore: number;
}

// Tipos adicionales para compatibilidad
export interface SessionList {
  id: number;
  usuario_id: number;
  estudiante_nombre: string;
  estudiante_email: string;
  estado: 'activa' | 'pausada' | 'cerrada';
  mensajes_count: number;
  duracion_total?: number;
  iniciada_en: string;
  pausada_en?: string;
  finalizada_en?: string;
  ultimo_mensaje?: string;
}

export interface SessionDetail {
  id: number;
  usuario_id: number;
  estudiante_nombre: string;
  estudiante_email: string;
  estudiante_institucion?: string;
  estudiante_grado?: string;
  estado: 'activa' | 'pausada' | 'cerrada';
  mensajes_count: number;
  duracion_total?: number;
  iniciada_en: string;
  pausada_en?: string;
  finalizada_en?: string;
  metadatos?: Record<string, any>;
  mensajes: any[];
  intervenciones: any[];
}

export interface SessionFilters {
  estado?: 'activa' | 'pausada' | 'cerrada';
  estudiante_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  limit?: number;
  offset?: number;
}

export interface InterventionCreate {
  usuario_id: number;
  alerta_id?: number;
  sesion_id?: number;
  tipo_intervencion: 'directa' | 'indirecta' | 'preventiva';
  mensaje: string;
  metodo: string;
  metadatos?: Record<string, any>;
}

export interface Intervention {
  id: number;
  usuario_id: number;
  estudiante_nombre: string;
  alerta_id?: number;
  sesion_id?: number;
  tipo_intervencion: 'directa' | 'indirecta' | 'preventiva';
  mensaje: string;
  metodo: string;
  enviada: boolean;
  recibida: boolean;
  efectiva?: boolean;
  creado_en: string;
  enviada_en?: string;
  recibida_en?: string;
  metadatos?: Record<string, any>;
}

export interface TutorDashboard {
  stats: {
    sesiones_activas: number;
    sesiones_hoy: number;
    alertas_pendientes: number;
    estudiantes_activos: number;
    mensajes_hoy: number;
    intervenciones_hoy: number;
  };
  sesiones_recientes: any[];
  alertas_recientes: any[];
  notificaciones_no_leidas: number;
}

class TutorService {
  // Dashboard
  async getDashboard(): Promise<TutorDashboard> {
    try {
      const response = await api.get('/tutor/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Return mock data for development
      return {
        stats: {
          sesiones_activas: 3,
          sesiones_hoy: 5,
          alertas_pendientes: 2,
          estudiantes_activos: 12,
          mensajes_hoy: 45,
          intervenciones_hoy: 8
        },
        sesiones_recientes: [],
        alertas_recientes: [],
        notificaciones_no_leidas: 2
      };
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/tutor/dashboard');
      const dashboard = response.data;
      return {
        sesiones_activas: dashboard.stats.sesiones_activas,
        sesiones_hoy: dashboard.stats.sesiones_hoy,
        alertas_pendientes: dashboard.stats.alertas_pendientes,
        estudiantes_activos: dashboard.stats.estudiantes_activos,
        mensajes_hoy: dashboard.stats.mensajes_hoy,
        intervenciones_hoy: dashboard.stats.intervenciones_hoy
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data for development
      return {
        sesiones_activas: 3,
        sesiones_hoy: 5,
        alertas_pendientes: 2,
        estudiantes_activos: 12,
        mensajes_hoy: 45,
        intervenciones_hoy: 8
      };
    }
  }

  // Students
  async getStudents(): Promise<Student[]> {
    try {
      const response = await api.get('/tutor/students');
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      // Return mock data for development
      return [
        {
          id: 1,
          nombre: 'María González',
          email: 'maria.gonzalez@email.com',
          estado: 'activo',
          ultimo_acceso: new Date().toISOString(),
          sesiones_count: 5,
          alertas_count: 0
        },
        {
          id: 2,
          nombre: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@email.com',
          estado: 'activo',
          ultimo_acceso: new Date(Date.now() - 3600000).toISOString(),
          sesiones_count: 3,
          alertas_count: 1
        },
        {
          id: 3,
          nombre: 'Ana Martínez',
          email: 'ana.martinez@email.com',
          estado: 'inactivo',
          ultimo_acceso: new Date(Date.now() - 86400000).toISOString(),
          sesiones_count: 2,
          alertas_count: 0
        }
      ];
    }
  }

  async getStudentProfile(studentId: number): Promise<any> {
    try {
      const response = await api.get(`/tutor/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  }

  // Sessions
  async getSessions(filters?: SessionFilters): Promise<SessionList[]> {
    try {
      const response = await api.get('/tutor/sessions', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Return mock data for development
      return [
        {
          id: 1,
          usuario_id: 1,
          estudiante_nombre: 'María González',
          estudiante_email: 'maria.gonzalez@email.com',
          estado: 'activa',
          mensajes_count: 15,
          duracion_total: 1800,
          iniciada_en: new Date(Date.now() - 1800000).toISOString(),
          ultimo_mensaje: 'Hace 2 horas'
        },
        {
          id: 2,
          usuario_id: 2,
          estudiante_nombre: 'Carlos Rodríguez',
          estudiante_email: 'carlos.rodriguez@email.com',
          estado: 'pausada',
          mensajes_count: 8,
          duracion_total: 1200,
          iniciada_en: new Date(Date.now() - 3600000).toISOString(),
          ultimo_mensaje: 'Hace 1 hora'
        }
      ];
    }
  }

  async getSession(sessionId: number): Promise<ChatSession> {
    try {
      const response = await api.get(`/tutor/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  async getSessionDetail(sessionId: number): Promise<SessionDetail> {
    try {
      const response = await api.get(`/tutor/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session detail:', error);
      throw error;
    }
  }

  async getSessionMessages(sessionId: number): Promise<SessionMessage[]> {
    try {
      const response = await api.get(`/tutor/sessions/${sessionId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session messages:', error);
      throw error;
    }
  }

  async getSessionStats(sessionId: number): Promise<SessionStats> {
    try {
      const response = await api.get(`/tutor/sessions/${sessionId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session stats:', error);
      // Return mock data for development
      return {
        totalMessages: 25,
        averageResponseTime: 5.2,
        studentMessages: 15,
        tutorMessages: 10,
        sessionDuration: 1800,
        emotionalTrends: {
          positive: 60,
          neutral: 30,
          negative: 10
        },
        commonTopics: ['ansiedad', 'estrés', 'académico'],
        engagementScore: 85
      };
    }
  }

  async sendMessageToSession(sessionId: number, text: string): Promise<SessionMessage> {
    try {
      const response = await api.post(`/tutor/sessions/${sessionId}/messages`, {
        texto: text,
        tipo_mensaje: 'texto'
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markMessageAsRead(sessionId: number, messageId: number): Promise<void> {
    try {
      await api.put(`/tutor/sessions/${sessionId}/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async pauseSession(sessionId: number, motivo?: string): Promise<void> {
    try {
      const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
      await api.post(`/tutor/sessions/${sessionId}/pause${params}`);
    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  }

  async resumeSession(sessionId: number): Promise<void> {
    try {
      await api.post(`/tutor/sessions/${sessionId}/resume`);
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  }

  async closeSession(sessionId: number, resumen?: string, recomendaciones?: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (resumen) params.append('resumen', resumen);
      if (recomendaciones) params.append('recomendaciones', recomendaciones);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      await api.post(`/tutor/sessions/${sessionId}/close${queryString}`);
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }

  async updateSessionPriority(sessionId: number, priority: string): Promise<void> {
    try {
      await api.put(`/tutor/sessions/${sessionId}/priority`, {
        prioridad: priority
      });
    } catch (error) {
      console.error('Error updating session priority:', error);
      throw error;
    }
  }

  // Alerts
  async getAlerts(): Promise<any[]> {
    try {
      const response = await api.get('/tutor/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  async markAlertAsRead(alertId: number): Promise<void> {
    try {
      await api.put(`/tutor/alerts/${alertId}/read`);
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }

  async reviewAlert(alertId: number, notas?: string, accion?: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (notas) params.append('notas', notas);
      if (accion) params.append('accion', accion);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      await api.post(`/tutor/alerts/${alertId}/review${queryString}`);
    } catch (error) {
      console.error('Error reviewing alert:', error);
      throw error;
    }
  }

  // Interventions
  async createIntervention(intervention: InterventionCreate): Promise<Intervention> {
    try {
      const response = await api.post('/tutor/interventions', intervention);
      return response.data;
    } catch (error) {
      console.error('Error creating intervention:', error);
      throw error;
    }
  }

  // Utility methods
  formatDuration(seconds?: number): string {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    return date.toLocaleDateString('es-ES');
  }

  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'crítica':
        return 'text-red-600 bg-red-100';
      case 'alta':
        return 'text-orange-600 bg-orange-100';
      case 'media':
        return 'text-yellow-600 bg-yellow-100';
      case 'baja':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'activa':
        return 'text-green-600 bg-green-100';
      case 'pausada':
        return 'text-yellow-600 bg-yellow-100';
      case 'cerrada':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getEmotionIcon(emotion?: string): string {
    switch (emotion) {
      case 'feliz':
        return '😊';
      case 'triste':
        return '😢';
      case 'enojado':
        return '😠';
      case 'ansioso':
        return '😰';
      case 'neutral':
        return '😐';
      default:
        return '😊';
    }
  }

  // Advanced features
  async getWeeklyReport(): Promise<any> {
    try {
      const response = await api.get('/tutor/reports/weekly');
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly report:', error);
      throw error;
    }
  }

  async getMonthlyReport(): Promise<any> {
    try {
      const response = await api.get('/tutor/reports/monthly');
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      throw error;
    }
  }

  async getStudentProgress(studentId: number): Promise<any> {
    try {
      const response = await api.get(`/tutor/students/${studentId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student progress:', error);
      throw error;
    }
  }

  async updateStudentNotes(studentId: number, notes: string): Promise<void> {
    try {
      await api.put(`/tutor/students/${studentId}/notes`, {
        notas: notes
      });
    } catch (error) {
      console.error('Error updating student notes:', error);
      throw error;
    }
  }

  async sendQuickResponse(sessionId: number, responseType: string, customText?: string): Promise<void> {
    try {
      await api.post(`/tutor/sessions/${sessionId}/quick-response`, {
        tipo: responseType,
        texto_personalizado: customText
      });
    } catch (error) {
      console.error('Error sending quick response:', error);
      throw error;
    }
  }

  async getSessionTemplates(): Promise<any[]> {
    try {
      const response = await api.get('/tutor/session-templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching session templates:', error);
      throw error;
    }
  }

  async applySessionTemplate(sessionId: number, templateId: number): Promise<void> {
    try {
      await api.post(`/tutor/sessions/${sessionId}/apply-template`, {
        template_id: templateId
      });
    } catch (error) {
      console.error('Error applying session template:', error);
      throw error;
    }
  }

  async flagSessionForReview(sessionId: number, reason: string): Promise<void> {
    try {
      await api.post(`/tutor/sessions/${sessionId}/flag`, {
        motivo: reason
      });
    } catch (error) {
      console.error('Error flagging session for review:', error);
      throw error;
    }
  }

  async escalateSession(sessionId: number, escalationType: string): Promise<void> {
    try {
      await api.post(`/tutor/sessions/${sessionId}/escalate`, {
        tipo: escalationType,
        motivo: 'Escalación requerida'
      });
    } catch (error) {
      console.error('Error escalating session:', error);
      throw error;
    }
  }

  async getTutors(): Promise<Tutor[]> {
    try {
      const response = await api.get('/tutor-chat/tutors');
      return response.data;
    } catch (error) {
      console.error('Error fetching tutors:', error);
      return [];
    }
  }
}

export const tutorService = new TutorService(); 