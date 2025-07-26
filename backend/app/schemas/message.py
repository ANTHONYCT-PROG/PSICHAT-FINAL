"""
Schemas de Pydantic para mensajes.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MessageBase(BaseModel):
    """Schema base para mensajes."""
    texto: str
    tipo_mensaje: str = "texto"
    metadata: Optional[Dict[str, Any]] = None


class MessageCreate(MessageBase):
    """Schema para crear un mensaje."""
    usuario_id: int
    sesion_id: Optional[int] = None
    remitente: str = "user"


class MessageInDB(MessageBase):
    """Schema para mensaje en base de datos."""
    id: int
    usuario_id: int
    remitente: str
    creado_en: datetime
    
    model_config = ConfigDict(from_attributes=True)


class Message(MessageInDB):
    """Schema para respuesta de mensaje."""
    pass


class MessageResponse(BaseModel):
    """Schema para respuesta de mensaje con análisis."""
    id: int
    texto: str
    remitente: str
    creado_en: datetime
    analisis: Optional[Dict[str, Any]] = None
