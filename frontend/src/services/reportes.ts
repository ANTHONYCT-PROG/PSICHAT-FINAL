/**
 * Servicio para manejo de reportes de sesiones
 */

import { api } from './api';

export interface Reporte {
  id: number;
  sesion_id: number;
  tutor_id: number;
  estudiante_id: number;
  titulo: string;
  contenido: string;
  resumen_ejecutivo?: string;
  emociones_detectadas?: string[];
  alertas_generadas?: any[];
  recomendaciones?: string[];
  estado: string;
  visible_estudiante: boolean;
  metadatos?: any;
  creado_en: string;
  actualizado_en: string;
}

export interface GenerarReporteRequest {
  sesion_id: number;
  notas_tutor?: string;
  motivo_finalizacion?: string;
}

export interface ReporteListResponse {
  reportes: Reporte[];
  total: number;
  pagina: number;
  por_pagina: number;
}

class ReportesService {
  /**
   * Genera un reporte de sesión usando Gemini
   */
  async generarReporte(data: GenerarReporteRequest): Promise<Reporte> {
    const response = await api.post('/reportes/generar', data);
    return response.data;
  }

  /**
   * Obtiene la lista de reportes del usuario actual
   */
  async getReportes(pagina: number = 1, por_pagina: number = 20): Promise<ReporteListResponse> {
    const response = await api.get('/reportes', {
      params: { pagina, por_pagina }
    });
    return response.data;
  }

  /**
   * Obtiene un reporte específico por ID
   */
  async getReporte(reporteId: number): Promise<Reporte> {
    const response = await api.get(`/reportes/${reporteId}`);
    return response.data;
  }

  /**
   * Actualiza un reporte
   */
  async actualizarReporte(reporteId: number, data: Partial<Reporte>): Promise<Reporte> {
    const response = await api.put(`/reportes/${reporteId}`, data);
    return response.data;
  }

  /**
   * Elimina un reporte
   */
  async eliminarReporte(reporteId: number): Promise<void> {
    await api.delete(`/reportes/${reporteId}`);
  }

  /**
   * Obtiene reportes por sesión
   */
  async getReportesPorSesion(sesionId: number): Promise<Reporte[]> {
    const response = await api.get(`/reportes`, {
      params: { sesion_id: sesionId }
    });
    return response.data.reportes || [];
  }

  /**
   * Formatea la fecha del reporte
   */
  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el color del estado del reporte
   */
  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'generado':
        return 'bg-blue-100 text-blue-800';
      case 'revisado':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtiene el texto del estado del reporte
   */
  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'generado':
        return 'Generado';
      case 'revisado':
        return 'Revisado';
      case 'aprobado':
        return 'Aprobado';
      default:
        return estado;
    }
  }
}

export const reportesService = new ReportesService(); 