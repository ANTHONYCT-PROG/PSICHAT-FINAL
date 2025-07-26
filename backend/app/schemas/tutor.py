# backend/app/schemas/tutor.py
"""
Schemas para el panel del tutor - Gestión robusta de sesiones de chat.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class SessionStatus(str, Enum):
    ACTIVA = "activa"
    PAUSADA = "pausada"
    CERRADA = "cerrada"


class AlertLevel(str, Enum):
    CRITICA = "crítica"
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"


class InterventionType(str, Enum):
    DIRECTA = "directa"
    INDIRECTA = "indirecta"
    PREVENTIVA = "preventiva"


# Dashboard y estadísticas
class DashboardStats(BaseModel):
    sesiones_activas: int
    sesiones_hoy: int
    alertas_pendientes: int
    estudiantes_activos: int
    mensajes_hoy: int
    intervenciones_hoy: int


class RecentSession(BaseModel):
    id: int
    estudiante_nombre: str
    estudiante_email: str
    estado: SessionStatus
    mensajes_count: int
    iniciada_en: datetime
    ultimo_mensaje: Optional[datetime] = None


class RecentAlert(BaseModel):
    id: int
    estudiante_nombre: str
    tipo_alerta: str
    nivel_urgencia: AlertLevel
    descripcion: str
    creado_en: datetime
    revisada: bool


class TutorDashboardResponse(BaseModel):
    stats: DashboardStats
    sesiones_recientes: List[RecentSession]
    alertas_recientes: List[RecentAlert]
    notificaciones_no_leidas: int


# Sesiones de chat
class SessionListResponse(BaseModel):
    id: int
    usuario_id: int
    estudiante_nombre: str
    estudiante_email: str
    estado: SessionStatus
    mensajes_count: int
    duracion_total: Optional[int] = None
    iniciada_en: datetime
    pausada_en: Optional[datetime] = None
    finalizada_en: Optional[datetime] = None
    ultimo_mensaje: Optional[str] = None


class SessionDetailResponse(BaseModel):
    id: int
    usuario_id: int
    estudiante_nombre: str
    estudiante_email: str
    estudiante_institucion: Optional[str] = None
    estudiante_grado: Optional[str] = None
    estado: SessionStatus
    mensajes_count: int
    duracion_total: Optional[int] = None
    iniciada_en: datetime
    pausada_en: Optional[datetime] = None
    finalizada_en: Optional[datetime] = None
    metadatos: Optional[Dict[str, Any]] = None
    mensajes: List[Dict[str, Any]] = []
    intervenciones: List[Dict[str, Any]] = []


class SessionStatsResponse(BaseModel):
    sesion_id: int
    total_mensajes: int
    mensajes_estudiante: int
    mensajes_tutor: int
    duracion_total: Optional[int] = None
    emociones_detectadas: Dict[str, int]
    estilos_comunicacion: Dict[str, int]
    alertas_generadas: int
    prioridades: Dict[str, int]
    recomendaciones: List[str]
    insights: Dict[str, Any]


# Alertas
class AlertListResponse(BaseModel):
    id: int
    usuario_id: int
    estudiante_nombre: str
    estudiante_email: str
    tipo_alerta: str
    nivel_urgencia: AlertLevel
    descripcion: str
    revisada: bool
    atendida: bool
    creado_en: datetime
    revisada_en: Optional[datetime] = None
    notas_tutor: Optional[str] = None
    accion_tomada: Optional[str] = None


# Intervenciones
class InterventionCreate(BaseModel):
    usuario_id: int = Field(..., description="ID del estudiante")
    alerta_id: Optional[int] = Field(None, description="ID de la alerta relacionada")
    sesion_id: Optional[int] = Field(None, description="ID de la sesión relacionada")
    tipo_intervencion: InterventionType
    mensaje: str = Field(..., min_length=1, max_length=2000)
    metodo: str = Field(..., description="Método de intervención: chat, email, llamada, etc.")
    metadatos: Optional[Dict[str, Any]] = None


class InterventionResponse(BaseModel):
    id: int
    usuario_id: int
    estudiante_nombre: str
    alerta_id: Optional[int] = None
    sesion_id: Optional[int] = None
    tipo_intervencion: InterventionType
    mensaje: str
    metodo: str
    enviada: bool
    recibida: bool
    efectiva: Optional[bool] = None
    creado_en: datetime
    enviada_en: Optional[datetime] = None
    recibida_en: Optional[datetime] = None
    metadatos: Optional[Dict[str, Any]] = None


# Notificaciones
class NotificationResponse(BaseModel):
    id: int
    titulo: str
    mensaje: str
    tipo: str
    leida: bool
    creado_en: datetime
    leida_en: Optional[datetime] = None
    metadatos: Optional[Dict[str, Any]] = None


# Filtros y paginación
class SessionFilters(BaseModel):
    estado: Optional[SessionStatus] = None
    estudiante_id: Optional[int] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    limit: int = 20
    offset: int = 0


class AlertFilters(BaseModel):
    nivel_urgencia: Optional[AlertLevel] = None
    revisada: Optional[bool] = None
    limit: int = 20
    offset: int = 0 