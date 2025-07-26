"""
Schemas de Pydantic para análisis.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AnalysisBase(BaseModel):
    """Schema base para análisis."""
    mensaje_id: int
    usuario_id: int
    emocion: Optional[str] = None
    emocion_score: Optional[float] = None
    distribucion_emociones: Optional[Dict[str, float]] = None
    estilo: Optional[str] = None
    estilo_score: Optional[float] = None
    distribucion_estilos: Optional[Dict[str, float]] = None
    prioridad: Optional[str] = None
    alerta: bool = False
    razon_alerta: Optional[str] = None
    recomendaciones: Optional[Dict[str, Any]] = None
    resumen: Optional[Dict[str, Any]] = None
    insights_detallados: Optional[Dict[str, Any]] = None
    modelo_utilizado: Optional[str] = None
    confianza_analisis: Optional[float] = None
    tiempo_procesamiento: Optional[float] = None


class AnalysisCreate(AnalysisBase):
    """Schema para crear un análisis."""
    pass


class AnalysisInDB(AnalysisBase):
    """Schema para análisis en base de datos."""
    id: int
    creado_en: datetime
    
    model_config = ConfigDict(from_attributes=True)


class Analysis(AnalysisInDB):
    """Schema para respuesta de análisis."""
    pass

# Alias para compatibilidad con imports existentes
AnalysisRecord = AnalysisInDB


class AnalysisRequest(BaseModel):
    """Schema para solicitud de análisis."""
    texto: str
    usuario_id: int


class AnalysisResponse(BaseModel):
    """Schema para respuesta de análisis."""
    id: int
    emocion: Optional[str] = None
    emocion_score: Optional[float] = None
    distribucion_emociones: Optional[Dict[str, float]] = None
    estilo: Optional[str] = None
    estilo_score: Optional[float] = None
    distribucion_estilos: Optional[Dict[str, float]] = None
    prioridad: Optional[str] = None
    alerta: bool = False
    razon_alerta: Optional[str] = None
    recomendaciones: Optional[Dict[str, Any]] = None
    resumen: Optional[Dict[str, Any]] = None
    insights_detallados: Optional[Dict[str, Any]] = None
    confianza_analisis: Optional[float] = None
    tiempo_procesamiento: Optional[float] = None
    creado_en: datetime
