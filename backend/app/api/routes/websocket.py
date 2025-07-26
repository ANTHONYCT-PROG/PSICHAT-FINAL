"""
Rutas WebSocket para chat en tiempo real.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from app.services.websocket_service import websocket_service
from app.dependencies import get_current_user_ws
from app.core.logging import logger
from jose import JWTError, jwt
from app.core.security import decode_access_token
from app.db import crud
from app.db.models import EstadoUsuario
from app.db.session import SessionLocal
import traceback
import json
from datetime import datetime
import asyncio
from app.core.config import settings

router = APIRouter()


@router.websocket("/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """
    Endpoint WebSocket principal con validación mejorada.
    """
    logger.info(f"WebSocket endpoint: usuario {user_id}")
    
    try:
        # Validar user_id
        if not isinstance(user_id, int) or user_id <= 0:
            logger.error(f"user_id inválido: {user_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Extraer y validar token
        token = websocket.query_params.get("token")
        if not token:
            logger.warning(f"WebSocket sin token para usuario {user_id}")
            # En desarrollo, permitir conexión sin token
            if settings.ENVIRONMENT == "development":
                logger.info(f"Permitiendo conexión sin token en desarrollo para usuario {user_id}")
            else:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        
        # Aceptar conexión
        await websocket.accept()
        logger.info(f"WebSocket conectado para usuario {user_id}")
        
        # Enviar mensaje de confirmación
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        # Manejar WebSocket
        try:
            await websocket_service.handle_websocket(websocket, user_id)
        except WebSocketDisconnect:
            logger.info(f"WebSocket desconectado para usuario {user_id}")
        except Exception as e:
            logger.error(f"Error en WebSocket service para usuario {user_id}: {e}")
            
    except Exception as e:
        logger.error(f"Error general en WebSocket endpoint para usuario {user_id}: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass


@router.websocket("/tutor-chat/{session_id}")
async def tutor_chat_websocket(
    websocket: WebSocket,
    session_id: int
):
    """
    Endpoint WebSocket específico para chat tutor-estudiante con validación mejorada.
    """
    logger.info(f"Tutor Chat WebSocket: sesión {session_id}")
    
    try:
        # Validar session_id
        if not isinstance(session_id, int) or session_id <= 0:
            logger.error(f"session_id inválido: {session_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Extraer token
        token = websocket.query_params.get("token")
        user_id = None
        
        if token:
            try:
                # Decodificar token para obtener user_id
                payload = decode_access_token(token)
                user_id = int(payload.get("sub"))
            except Exception as e:
                logger.warning(f"Token inválido para sesión {session_id}: {e}")
                if settings.ENVIRONMENT != "development":
                    await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                    return
        
        # En desarrollo, usar user_id=1 como fallback
        if not user_id and settings.ENVIRONMENT == "development":
            user_id = 1
            logger.info(f"Usando user_id=1 como fallback en desarrollo para sesión {session_id}")
        
        if not user_id:
            logger.error(f"No se pudo determinar user_id para sesión {session_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verificar que la sesión existe y el usuario tiene permisos
        db = SessionLocal()
        try:
            session = crud.get_chat_session(db, session_id)
            if not session:
                logger.error(f"Sesión {session_id} no encontrada")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            
            if session.usuario_id != user_id and session.tutor_id != user_id:
                logger.error(f"Usuario {user_id} no tiene permisos para sesión {session_id}")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        finally:
            db.close()
        
        # Aceptar conexión
        await websocket.accept()
        logger.info(f"Tutor Chat WebSocket conectado para sesión {session_id}, usuario {user_id}")
        
        # Enviar mensaje de confirmación
        await websocket.send_text(json.dumps({
            "type": "tutor_chat_connected",
            "session_id": session_id,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        # Manejar WebSocket
        try:
            await websocket_service.handle_tutor_chat_websocket(websocket, session_id, user_id)
        except WebSocketDisconnect:
            logger.info(f"Tutor Chat WebSocket desconectado para sesión {session_id}")
        except Exception as e:
            logger.error(f"Error en Tutor Chat WebSocket service para sesión {session_id}: {e}")
            
    except Exception as e:
        logger.error(f"Error general en Tutor Chat WebSocket endpoint para sesión {session_id}: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass


@router.websocket("/test")
async def websocket_test(websocket: WebSocket):
    """
    Endpoint WebSocket de prueba para debug.
    """
    logger.info("WebSocket test endpoint")
    
    try:
        await websocket.accept()
        logger.info("WebSocket test: conexión aceptada")
        
        await websocket.send_text(json.dumps({
            "type": "test_response",
            "message": "WebSocket test: conexión exitosa",
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        # Mantener conexión por 5 segundos para pruebas
        await asyncio.sleep(5)
        await websocket.close()
        
    except Exception as e:
        logger.error(f"Error en WebSocket test: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass


@router.get("/ws/stats")
async def get_websocket_stats():
    """
    Obtiene estadísticas de conexiones WebSocket.
    """
    return websocket_service.get_connection_stats()


@router.get("/ws/connected-users")
async def get_connected_users():
    """
    Obtiene lista de usuarios conectados.
    """
    return {
        "connected_users": websocket_service.manager.get_connected_users(),
        "count": websocket_service.manager.get_user_count()
    } 