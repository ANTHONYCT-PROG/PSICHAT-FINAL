"""
Inicializador del paquete de rutas de la API.
"""

from . import auth, chat, analysis, tutor, tutor_chat, websocket

__all__ = ["auth", "chat", "analysis", "tutor", "tutor_chat", "websocket"]
