"""
Schemas para reportes de sesiones de tutor.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ReporteBase(BaseModel):
    """Schema base para reportes."""
    titulo: str = Field(..., description="Título del reporte")
    contenido: str = Field(..., description="Contenido del reporte generado por Gemini")
    resumen_ejecutivo: Optional[str] = Field(None, description="Resumen ejecutivo del reporte")
    emociones_detectadas: Optional[List[str]] = Field(None, description="Lista de emociones principales detectadas")
    alertas_generadas: Optional[List[Dict[str, Any]]] = Field(None, description="Lista de alertas generadas durante la sesión")
    recomendaciones: Optional[List[str]] = Field(None, description="Recomendaciones para el estudiante")
    estado: str = Field(default="generado", description="Estado del reporte")
    visible_estudiante: bool = Field(default=False, description="Si el reporte es visible para el estudiante")
    metadatos: Optional[Dict[str, Any]] = Field(None, description="Metadatos adicionales del reporte")


class ReporteCreate(ReporteBase):
    """Schema para crear un reporte."""
    sesion_id: int = Field(..., description="ID de la sesión de chat")
    tutor_id: int = Field(..., description="ID del tutor")
    estudiante_id: int = Field(..., description="ID del estudiante")


class ReporteUpdate(BaseModel):
    """Schema para actualizar un reporte."""
    titulo: Optional[str] = None
    contenido: Optional[str] = None
    resumen_ejecutivo: Optional[str] = None
    emociones_detectadas: Optional[List[str]] = None
    alertas_generadas: Optional[List[Dict[str, Any]]] = None
    recomendaciones: Optional[List[str]] = None
    estado: Optional[str] = None
    visible_estudiante: Optional[bool] = None
    metadatos: Optional[Dict[str, Any]] = None


class ReporteResponse(ReporteBase):
    """Schema para respuesta de reporte."""
    id: int
    sesion_id: int
    tutor_id: int
    estudiante_id: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class ReporteListResponse(BaseModel):
    """Schema para lista de reportes."""
    reportes: List[ReporteResponse]
    total: int
    pagina: int
    por_pagina: int


class GenerarReporteRequest(BaseModel):
    """Schema para solicitar generación de reporte."""
    sesion_id: int = Field(..., description="ID de la sesión de chat")
    notas_tutor: Optional[str] = Field(None, description="Notas adicionales del tutor")
    motivo_finalizacion: Optional[str] = Field(None, description="Motivo de finalización de la sesión") 