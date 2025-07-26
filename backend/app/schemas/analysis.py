# schemas/analysis.py
from pydantic import BaseModel
from typing import List, Tuple, Optional

class AnalysisRequest(BaseModel):
    """Schema simple para solicitudes de análisis."""
    texto: str

class EmotionData(BaseModel):
    emotion: str
    emotion_score: float
    emotion_distribution: List[Tuple[str, float]]


class StyleData(BaseModel):
    style: str
    style_score: float
    style_distribution: List[Tuple[str, float]]


class AnalysisCreate(BaseModel):
    """Schema para crear un análisis."""
    mensaje_id: int
    emocion: str
    emocion_score: float
    estilo: str
    estilo_score: float
    prioridad: str
    alerta: bool
    razon_alerta: Optional[str] = None


class AnalysisResult(BaseModel):
    text: str
    emotion: str
    emotion_score: float
    emotion_distribution: List[Tuple[str, float]]
    style: str
    style_score: float
    style_distribution: List[Tuple[str, float]]
    priority: str
    alert: bool
    alert_reason: Optional[str] = None
    context_alert: Optional[bool] = False
    context_risk_level: Optional[str] = "normal"
