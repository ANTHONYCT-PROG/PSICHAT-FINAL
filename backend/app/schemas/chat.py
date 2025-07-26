"""
Esquemas Pydantic para el sistema de chat.
"""

from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    """Esquema para mensajes de chat."""
    user_text: str
    history: List[Dict[str, str]]  # obligatorio
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    """Esquema para respuestas del chat."""
    reply: str
    meta: Dict[str, Any]
    history: List[Dict[str, str]]  # [{"user": "msg", "bot": "reply"}]
    message_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

class ChatHistoryRequest(BaseModel):
    """Esquema para solicitar historial de chat."""
    user_id: int
    limit: Optional[int] = 50
    offset: Optional[int] = 0

class ChatHistoryResponse(BaseModel):
    """Esquema para respuesta del historial de chat."""
    messages: List[Dict[str, Any]]
    total: int
    has_more: bool
    
    model_config = ConfigDict(from_attributes=True)

class ChatAnalysisRequest(BaseModel):
    """Esquema para solicitar análisis de chat."""
    user_id: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ChatAnalysisResponse(BaseModel):
    """Esquema para respuesta de análisis de chat."""
    total_messages: int
    emotion_distribution: Dict[str, int]
    style_distribution: Dict[str, int]
    average_emotion_score: float
    most_common_emotion: Optional[str] = None
    most_common_style: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class ChatSessionCreate(BaseModel):
    tutor_id: Optional[int] = None

class ChatSessionResponse(BaseModel):
    id: int
    usuario_id: int
    tutor_id: Optional[int]
    estado: str
    iniciada_en: datetime
    pausada_en: Optional[datetime]
    finalizada_en: Optional[datetime]
    metadatos: Optional[dict]

    model_config = ConfigDict(from_attributes=True)
