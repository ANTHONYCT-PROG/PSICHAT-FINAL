"""
Servicio WebSocket para chat en tiempo real.
"""

import json
import asyncio
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime, timedelta
from app.core.logging import logger
from app.db.session import SessionLocal
from app.db import crud
from app.services.analysis_service import analyze_text
import traceback
import weakref


class ConnectionManager:
    """Gestor de conexiones WebSocket."""
    
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.user_sessions: Dict[int, Dict[str, Any]] = {}
        self.typing_users: Dict[int, Set[int]] = {}  # session_id -> set of user_ids
        self.tutor_chat_connections: Dict[int, Dict[int, WebSocket]] = {}  # session_id -> {user_id: websocket}
        self.connection_timeouts: Dict[int, asyncio.Task] = {}  # user_id -> timeout task
        self.cleanup_task: Optional[asyncio.Task] = None
        self.connection_states: Dict[int, bool] = {}  # user_id -> is_connected
        
        # Configuración de timeouts
        self.connection_timeout = 300  # 5 minutos
        self.cleanup_interval = 60  # 1 minuto
        
        # Iniciar tarea de limpieza
        self._start_cleanup_task()
    
    def _start_cleanup_task(self):
        """Inicia la tarea de limpieza periódica."""
        if self.cleanup_task is None or self.cleanup_task.done():
            self.cleanup_task = asyncio.create_task(self._cleanup_loop())
    
    async def _cleanup_loop(self):
        """Loop de limpieza periódica de conexiones inactivas."""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self._cleanup_inactive_connections()
            except Exception as e:
                logger.error(f"Error en cleanup loop: {e}")
    
    async def _cleanup_inactive_connections(self):
        """Limpia conexiones inactivas."""
        current_time = datetime.utcnow()
        inactive_users = []
        
        for user_id, session_data in self.user_sessions.items():
            last_activity = session_data.get("last_activity")
            if last_activity and (current_time - last_activity).total_seconds() > self.connection_timeout:
                inactive_users.append(user_id)
        
        for user_id in inactive_users:
            logger.info(f"Limpiando conexión inactiva para usuario {user_id}")
            self.disconnect(user_id)
    
    def is_connected(self, user_id: int) -> bool:
        """Verifica si un usuario está conectado."""
        return user_id in self.active_connections and self.connection_states.get(user_id, False)
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Conecta un usuario al WebSocket."""
        # Limpiar conexión anterior si existe
        if user_id in self.active_connections:
            logger.warning(f"Usuario {user_id} ya tiene una conexión activa, limpiando...")
            self.disconnect(user_id)
        
        self.active_connections[user_id] = websocket
        self.connection_states[user_id] = True
        self.user_sessions[user_id] = {
            "connected_at": datetime.utcnow(),
            "last_activity": datetime.utcnow()
        }
        
        # Cancelar timeout anterior si existe
        if user_id in self.connection_timeouts:
            self.connection_timeouts[user_id].cancel()
        
        # Crear nuevo timeout
        self.connection_timeouts[user_id] = asyncio.create_task(
            self._connection_timeout(user_id)
        )
        
        logger.info(f"Usuario {user_id} conectado al WebSocket")
    
    async def _connection_timeout(self, user_id: int):
        """Timeout para conexiones inactivas."""
        try:
            await asyncio.sleep(self.connection_timeout)
            if user_id in self.active_connections and self.is_connected(user_id):
                logger.info(f"Timeout de conexión para usuario {user_id}")
                self.disconnect(user_id)
        except asyncio.CancelledError:
            # Timeout cancelado, conexión activa
            pass
    
    def disconnect(self, user_id: int):
        """Desconecta un usuario."""
        # Marcar como desconectado
        self.connection_states[user_id] = False
        
        # Cancelar timeout
        if user_id in self.connection_timeouts:
            self.connection_timeouts[user_id].cancel()
            del self.connection_timeouts[user_id]
        
        # Limpiar conexión principal
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_sessions:
            del self.user_sessions[user_id]
        if user_id in self.connection_states:
            del self.connection_states[user_id]
        
        # Limpiar de tutor-chat connections
        for session_id in list(self.tutor_chat_connections.keys()):
            if user_id in self.tutor_chat_connections[session_id]:
                del self.tutor_chat_connections[session_id][user_id]
                if not self.tutor_chat_connections[session_id]:
                    del self.tutor_chat_connections[session_id]
        
        # Limpiar de typing indicators
        for session_id in list(self.typing_users.keys()):
            if user_id in self.typing_users[session_id]:
                self.typing_users[session_id].discard(user_id)
                if not self.typing_users[session_id]:
                    del self.typing_users[session_id]
        
        logger.info(f"Usuario {user_id} desconectado del WebSocket")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Envía un mensaje personal a un usuario específico."""
        if not self.is_connected(user_id):
            logger.warning(f"Intentando enviar mensaje a usuario {user_id} no conectado")
            return
            
        try:
            await self.active_connections[user_id].send_text(json.dumps(message))
            # Actualizar actividad
            if user_id in self.user_sessions:
                self.user_sessions[user_id]["last_activity"] = datetime.utcnow()
        except Exception as e:
            logger.error(f"Error enviando mensaje a usuario {user_id}: {e}")
            self.disconnect(user_id)
    
    async def broadcast_to_session(self, message: dict, session_id: int, exclude_user: Optional[int] = None):
        """Envía un mensaje a todos los usuarios en una sesión."""
        db = SessionLocal()
        try:
            # Obtener usuarios de la sesión
            session = crud.get_chat_session(db, session_id)
            if not session:
                return
            
            users_to_notify = [session.usuario_id]
            if session.tutor_id:
                users_to_notify.append(session.tutor_id)
            
            for user_id in users_to_notify:
                if user_id != exclude_user and self.is_connected(user_id):
                    await self.send_personal_message(message, user_id)
        except Exception as e:
            logger.error(f"Error en broadcast_to_session: {e}")
        finally:
            db.close()
    
    async def send_typing_indicator(self, session_id: int, user_id: int, is_typing: bool):
        """Envía indicador de escritura."""
        if is_typing:
            if session_id not in self.typing_users:
                self.typing_users[session_id] = set()
            self.typing_users[session_id].add(user_id)
        else:
            if session_id in self.typing_users:
                self.typing_users[session_id].discard(user_id)
        
        message = {
            "type": "typing_indicator",
            "session_id": session_id,
            "user_id": user_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_session(message, session_id, exclude_user=user_id)
    
    def get_connected_users(self) -> list:
        """Obtiene lista de usuarios conectados."""
        return [user_id for user_id in self.active_connections.keys() if self.is_connected(user_id)]
    
    def get_user_count(self) -> int:
        """Obtiene número de usuarios conectados."""
        return len(self.get_connected_users())
    
    async def connect_to_tutor_chat(self, websocket: WebSocket, session_id: int, user_id: int):
        """Conecta un usuario a una sesión específica de tutor-chat."""
        # Limpiar conexión anterior si existe
        if session_id in self.tutor_chat_connections and user_id in self.tutor_chat_connections[session_id]:
            logger.warning(f"Usuario {user_id} ya tiene conexión tutor-chat en sesión {session_id}, limpiando...")
            self.disconnect_from_tutor_chat(session_id, user_id)
        
        if session_id not in self.tutor_chat_connections:
            self.tutor_chat_connections[session_id] = {}
        
        self.tutor_chat_connections[session_id][user_id] = websocket
        logger.info(f"Usuario {user_id} conectado a tutor-chat sesión {session_id}")
    
    def disconnect_from_tutor_chat(self, session_id: int, user_id: int):
        """Desconecta un usuario de una sesión de tutor-chat."""
        if session_id in self.tutor_chat_connections and user_id in self.tutor_chat_connections[session_id]:
            del self.tutor_chat_connections[session_id][user_id]
            
            # Si no hay más usuarios en la sesión, eliminar la sesión
            if not self.tutor_chat_connections[session_id]:
                del self.tutor_chat_connections[session_id]
            
            logger.info(f"Usuario {user_id} desconectado de tutor-chat sesión {session_id}")
    
    def is_tutor_chat_connected(self, session_id: int, user_id: int) -> bool:
        """Verifica si un usuario está conectado a una sesión de tutor-chat."""
        return (session_id in self.tutor_chat_connections and 
                user_id in self.tutor_chat_connections[session_id])
    
    async def send_tutor_chat_message(self, session_id: int, message: dict, exclude_user: Optional[int] = None):
        """Envía un mensaje a todos los usuarios en una sesión de tutor-chat."""
        if session_id not in self.tutor_chat_connections:
            return
        
        for user_id, websocket in self.tutor_chat_connections[session_id].items():
            if user_id != exclude_user:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error enviando mensaje tutor-chat a usuario {user_id}: {e}")
                    self.disconnect_from_tutor_chat(session_id, user_id)
    
    async def send_tutor_chat_typing(self, session_id: int, user_id: int, is_typing: bool):
        """Envía indicador de escritura en tutor-chat."""
        message = {
            "type": "tutor_typing",
            "session_id": session_id,
            "user_id": user_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.send_tutor_chat_message(session_id, message, exclude_user=user_id)
    
    async def shutdown(self):
        """Cierra todas las conexiones."""
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Cancelar todos los timeouts
        for task in self.connection_timeouts.values():
            task.cancel()
        
        # Limpiar todas las conexiones
        for user_id in list(self.active_connections.keys()):
            self.disconnect(user_id)
        
        logger.info("ConnectionManager cerrado")


class WebSocketService:
    """Servicio principal de WebSocket."""
    
    def __init__(self):
        self.manager = ConnectionManager()
    
    async def handle_websocket(self, websocket: WebSocket, user_id: int):
        """Maneja la conexión WebSocket de un usuario."""
        await self.manager.connect(websocket, user_id)
        
        try:
            while self.manager.is_connected(user_id):
                # Recibir mensaje del cliente con timeout
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    message_data = json.loads(data)
                    
                    # Procesar mensaje según tipo
                    await self.process_message(user_id, message_data)
                    
                except asyncio.TimeoutError:
                    # Timeout - enviar ping para mantener conexión
                    try:
                        await websocket.send_text(json.dumps({"type": "ping", "timestamp": datetime.utcnow().isoformat()}))
                    except:
                        break
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing JSON para usuario {user_id}: {e}")
                except Exception as e:
                    logger.error(f"Error procesando mensaje para usuario {user_id}: {e}")
                    # Si hay un error crítico, salir del loop
                    if "disconnect" in str(e).lower():
                        break
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket desconectado para usuario {user_id}")
        except Exception as e:
            logger.error(f"Error en WebSocket para usuario {user_id}: {e}")
        finally:
            self.manager.disconnect(user_id)
    
    async def handle_tutor_chat_websocket(self, websocket: WebSocket, session_id: int, user_id: int):
        """Maneja la conexión WebSocket específica para tutor-chat."""
        logger.info(f"INICIANDO: handle_tutor_chat_websocket para sesión {session_id}, usuario {user_id}")
        await self.manager.connect_to_tutor_chat(websocket, session_id, user_id)
        
        try:
            while self.manager.is_tutor_chat_connected(session_id, user_id):
                # Recibir mensaje del cliente con timeout
                try:
                    logger.info(f"ESPERANDO mensaje de usuario {user_id} en sesión {session_id}")
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    logger.info(f"RECIBIDO mensaje de usuario {user_id}: {data[:100]}...")
                    
                    try:
                        message_data = json.loads(data)
                        logger.info(f"PROCESANDO mensaje tipo: {message_data.get('type')}")
                        
                        # Procesar mensaje según tipo
                        await self.process_tutor_chat_message(session_id, user_id, message_data)
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"ERROR parsing JSON: {e}, data: {data}")
                    except Exception as e:
                        logger.error(f"ERROR procesando mensaje: {e}")
                        # Si hay un error crítico, salir del loop
                        if "disconnect" in str(e).lower():
                            break
                        
                except asyncio.TimeoutError:
                    # Timeout - enviar ping para mantener conexión
                    try:
                        await websocket.send_text(json.dumps({"type": "ping", "timestamp": datetime.utcnow().isoformat()}))
                    except:
                        break
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket desconectado para sesión {session_id}, usuario {user_id}")
        except Exception as e:
            logger.error(f"ERROR en Tutor chat WebSocket para sesión {session_id}, usuario {user_id}: {e}")
        finally:
            self.manager.disconnect_from_tutor_chat(session_id, user_id)
    
    async def process_message(self, user_id: int, message_data: dict):
        """Procesa un mensaje recibido por WebSocket."""
        message_type = message_data.get("type")
        
        if message_type == "chat_message":
            await self.handle_chat_message(user_id, message_data)
        elif message_type == "typing":
            await self.handle_typing(user_id, message_data)
        elif message_type == "read_receipt":
            await self.handle_read_receipt(user_id, message_data)
        elif message_type == "analysis_request":
            await self.handle_analysis_request(user_id, message_data)
        elif message_type == "ping":
            # Responder a ping
            await self.manager.send_personal_message({
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            }, user_id)
        else:
            logger.warning(f"Tipo de mensaje desconocido: {message_type}")
    
    async def process_tutor_chat_message(self, session_id: int, user_id: int, message_data: dict):
        """Procesa un mensaje recibido por WebSocket de tutor-chat."""
        message_type = message_data.get("type")
        logger.info(f"PROCESANDO mensaje tipo '{message_type}' para sesión {session_id}, usuario {user_id}")
        
        if message_type == "tutor_chat_message":
            logger.info(f"MANEJANDO tutor_chat_message")
            await self.handle_tutor_chat_message(session_id, user_id, message_data)
        elif message_type == "tutor_typing":
            logger.info(f"MANEJANDO tutor_typing")
            await self.handle_tutor_typing(session_id, user_id, message_data)
        elif message_type == "typing_indicator":
            logger.info(f"MANEJANDO typing_indicator (compatibilidad)")
            await self.handle_tutor_typing(session_id, user_id, message_data)
        elif message_type == "tutor_read_receipt":
            logger.info(f"MANEJANDO tutor_read_receipt")
            await self.handle_tutor_read_receipt(session_id, user_id, message_data)
        elif message_type == "session_status":
            logger.info(f"MANEJANDO session_status")
            await self.handle_session_status(session_id, user_id, message_data)
        elif message_type == "ping":
            # Responder a ping
            await self.manager.send_tutor_chat_message(session_id, {
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            logger.warning(f"Tipo de mensaje tutor-chat desconocido: {message_type}")
            logger.warning(f"Mensaje completo: {message_data}")
    
    async def handle_chat_message(self, user_id: int, message_data: dict):
        """Maneja un mensaje de chat."""
        session_id = message_data.get("session_id")
        text = message_data.get("text")
        
        if not session_id or not text:
            return
        
        db = SessionLocal()
        try:
            # Guardar mensaje en base de datos
            message = crud.create_message(db, {
                "usuario_id": user_id,
                "sesion_id": session_id,
                "texto": text,
                "remitente": "user"
            })
            
            # Analizar mensaje
            analysis = analyze_text(text)
            
            # Guardar análisis
            crud.create_analysis(db, {
                "mensaje_id": message.id,
                "usuario_id": user_id,
                "emocion": analysis.get("emotion"),
                "emocion_score": analysis.get("emotion_score"),
                "estilo": analysis.get("style"),
                "estilo_score": analysis.get("style_score"),
                "prioridad": analysis.get("priority"),
                "alerta": analysis.get("alert", False)
            })
            
            # Preparar mensaje para broadcast
            broadcast_message = {
                "type": "chat_message",
                "session_id": session_id,
                "message": {
                    "id": message.id,
                    "user_id": user_id,
                    "text": text,
                    "timestamp": message.creado_en.isoformat(),
                    "analysis": analysis
                }
            }
            
            # Enviar a todos los usuarios de la sesión
            await self.manager.broadcast_to_session(broadcast_message, session_id)
            
            # Si hay alerta, notificar a tutores
            if analysis.get("alert"):
                await self.notify_tutors_alert(user_id, session_id, analysis)
                
        finally:
            db.close()
    
    async def handle_typing(self, user_id: int, message_data: dict):
        """Maneja indicador de escritura."""
        session_id = message_data.get("session_id")
        is_typing = message_data.get("is_typing", False)
        
        if session_id:
            await self.manager.send_typing_indicator(session_id, user_id, is_typing)
    
    async def handle_read_receipt(self, user_id: int, message_data: dict):
        """Maneja confirmación de lectura."""
        session_id = message_data.get("session_id")
        message_id = message_data.get("message_id")
        
        if session_id and message_id:
            receipt_message = {
                "type": "read_receipt",
                "session_id": session_id,
                "message_id": message_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.manager.broadcast_to_session(receipt_message, session_id)
    
    async def handle_analysis_request(self, user_id: int, message_data: dict):
        """Maneja solicitud de análisis en tiempo real."""
        text = message_data.get("text")
        
        if text:
            try:
                analysis = analyze_text(text)
                
                response = {
                    "type": "analysis_response",
                    "request_id": message_data.get("request_id"),
                    "analysis": analysis,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                await self.manager.send_personal_message(response, user_id)
                
            except Exception as e:
                logger.error(f"Error en análisis en tiempo real: {e}")
                error_response = {
                    "type": "analysis_error",
                    "request_id": message_data.get("request_id"),
                    "error": "Error en el análisis",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await self.manager.send_personal_message(error_response, user_id)
    
    async def notify_tutors_alert(self, user_id: int, session_id: int, analysis: dict):
        """Notifica a tutores sobre una alerta."""
        db = SessionLocal()
        try:
            # Obtener tutores disponibles
            tutors = crud.get_users_by_role(db, "tutor")
            
            alert_message = {
                "type": "alert_notification",
                "session_id": session_id,
                "user_id": user_id,
                "analysis": analysis,
                "priority": analysis.get("priority", "normal"),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Enviar notificación a tutores conectados
            for tutor in tutors:
                if tutor.id in self.manager.active_connections:
                    await self.manager.send_personal_message(alert_message, tutor.id)
                    
        finally:
            db.close()
    
    async def send_system_notification(self, user_id: int, notification: dict):
        """Envía una notificación del sistema."""
        system_message = {
            "type": "system_notification",
            "notification": notification,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.manager.send_personal_message(system_message, user_id)
    
    async def handle_tutor_chat_message(self, session_id: int, user_id: int, message_data: dict):
        """Maneja un mensaje de tutor-chat."""
        text = message_data.get("text")
        remitente = message_data.get("remitente", "user")
        
        logger.info(f"MANEJANDO mensaje de tutor-chat: sesión {session_id}, usuario {user_id}, remitente {remitente}, texto: {text[:50]}...")
        
        if not text:
            logger.warning("Mensaje sin texto, ignorando")
            return
        
        db = SessionLocal()
        try:
            # Verificar que el usuario tiene permisos para esta sesión
            session = crud.get_chat_session(db, session_id)
            if not session:
                logger.error(f"Sesión {session_id} no encontrada")
                return
            
            if session.usuario_id != user_id and session.tutor_id != user_id:
                logger.error(f"Usuario {user_id} no tiene permisos para sesión {session_id}")
                return
            
            logger.info(f"Guardando mensaje en base de datos...")
            
            # Crear objeto MessageCreate correctamente
            from app.schemas.message import MessageCreate
            message_create = MessageCreate(
                usuario_id=user_id,
                sesion_id=session_id,
                texto=text,
                remitente=remitente,
                tipo_mensaje="texto"
            )
            
            # Guardar mensaje en base de datos
            message = crud.create_message(db, message_create)
            logger.info(f"Mensaje guardado con ID: {message.id}")
            
            # Si es mensaje del estudiante, analizar
            analysis = None
            if remitente == "user":
                try:
                    logger.info("Analizando mensaje del estudiante...")
                    analysis = analyze_text(text)
                    
                    # Crear objeto AnalysisCreate correctamente
                    from app.schemas.analysis_record import AnalysisCreate
                    analysis_create = AnalysisCreate(
                        mensaje_id=message.id,
                        usuario_id=user_id,
                        emocion=analysis.get("emotion"),
                        emocion_score=analysis.get("emotion_score"),
                        estilo=analysis.get("style"),
                        estilo_score=analysis.get("style_score"),
                        prioridad=analysis.get("priority"),
                        alerta=analysis.get("alert", False),
                        razon_alerta=analysis.get("alert_reason")
                    )
                    
                    # Guardar análisis
                    crud.create_analysis(db, analysis_create)
                    logger.info(f"Análisis guardado: emoción={analysis.get('emotion')}, alerta={analysis.get('alert')}")
                except Exception as e:
                    logger.error(f"Error analizando mensaje: {e}")
                    analysis = None
            
            # Preparar mensaje para broadcast
            broadcast_message = {
                "type": "tutor_chat_message",
                "session_id": session_id,
                "message": {
                    "id": message.id,
                    "user_id": user_id,
                    "text": text,
                    "remitente": remitente,
                    "timestamp": message.creado_en.isoformat(),
                    "analysis": analysis
                }
            }
            
            logger.info(f"Enviando mensaje broadcast a sesión {session_id}")
            # Enviar a todos los usuarios de la sesión
            await self.manager.send_tutor_chat_message(session_id, broadcast_message)
            logger.info(f"Mensaje broadcast enviado exitosamente")
            
            # Si hay alerta, notificar al tutor
            if analysis and analysis.get("alert") and session.tutor_id:
                logger.info(f"Enviando alerta al tutor {session.tutor_id}")
                await self.notify_tutor_alert(session.tutor_id, session_id, analysis)
                
        except Exception as e:
            logger.error(f"ERROR en handle_tutor_chat_message: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Enviar mensaje de error al usuario
            error_message = {
                "type": "error",
                "session_id": session_id,
                "error": "Error procesando mensaje",
                "timestamp": datetime.utcnow().isoformat()
            }
            await self.manager.send_tutor_chat_message(session_id, error_message)
        finally:
            db.close()
    
    async def handle_tutor_typing(self, session_id: int, user_id: int, message_data: dict):
        """Maneja indicador de escritura en tutor-chat."""
        is_typing = message_data.get("is_typing", False)
        logger.info(f"MANEJANDO indicador de escritura: sesión {session_id}, usuario {user_id}, escribiendo: {is_typing}")
        await self.manager.send_tutor_chat_typing(session_id, user_id, is_typing)
        logger.info(f"Indicador de escritura enviado")
    
    async def handle_tutor_read_receipt(self, session_id: int, user_id: int, message_data: dict):
        """Maneja confirmación de lectura en tutor-chat."""
        message_id = message_data.get("message_id")
        
        if message_id:
            receipt_message = {
                "type": "tutor_read_receipt",
                "session_id": session_id,
                "message_id": message_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.manager.send_tutor_chat_message(session_id, receipt_message)
    
    async def handle_session_status(self, session_id: int, user_id: int, message_data: dict):
        """Maneja cambios de estado de sesión."""
        status = message_data.get("status")
        
        if status:
            status_message = {
                "type": "session_status",
                "session_id": session_id,
                "status": status,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.manager.send_tutor_chat_message(session_id, status_message)
    
    async def notify_tutor_alert(self, tutor_id: int, session_id: int, analysis: dict):
        """Notifica al tutor sobre una alerta en tiempo real."""
        alert_message = {
            "type": "tutor_alert",
            "session_id": session_id,
            "analysis": analysis,
            "priority": analysis.get("priority", "normal"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Enviar al tutor si está conectado
        if tutor_id in self.manager.active_connections:
            await self.manager.send_personal_message(alert_message, tutor_id)

    def get_connection_stats(self) -> dict:
        """Obtiene estadísticas de conexiones."""
        return {
            "connected_users": self.manager.get_user_count(),
            "active_sessions": len(self.manager.typing_users),
            "total_connections": len(self.manager.active_connections),
            "tutor_chat_sessions": len(self.manager.tutor_chat_connections)
        }
    
    async def shutdown(self):
        """Cierra el servicio WebSocket."""
        await self.manager.shutdown()
        logger.info("WebSocketService shutdown completado")


# Instancia global del servicio WebSocket
websocket_service = WebSocketService() 