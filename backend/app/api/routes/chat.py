# backend/app/api/routes/chat.py
"""
Rutas para el manejo del chat y análisis emocional del mensaje.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Path
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.chat import ChatMessage, ChatResponse, ChatSessionCreate, ChatSessionResponse
from app.services.chat_service import generate_bot_reply, save_chat_and_analysis, generate_report_for_session
from app.dependencies import get_current_user
from app.db.models import Usuario, SesionChat, Mensaje
from app.db import crud
from app.schemas.message import Message, MessageCreate
from app.schemas.analysis_record import AnalysisRecord
from fastapi import status
from app.services.analysis_service import analyze_text
from pydantic import BaseModel
from typing import List
from sqlalchemy import func
from app.services.chat_service import create_notification

router = APIRouter()


@router.post("/", response_model=ChatResponse)
def chat_endpoint(
    message: ChatMessage,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Endpoint principal de chat: analiza el mensaje del usuario,
    genera respuesta empática, responde al usuario y luego guarda los mensajes y análisis en segundo plano.
    """
    try:
        # Validar que history esté presente
        if message.history is None:
            raise HTTPException(status_code=422, detail="El campo 'history' es requerido.")
        # 1. Generar análisis y respuesta del bot
        result = generate_bot_reply(user_text=message.user_text, user_context={"history": message.history})
        meta = result["meta"]
        # 2. Guardar mensajes y análisis en segundo plano
        background_tasks.add_task(
            save_chat_and_analysis,
            db,
            getattr(current_user, 'id'),
            message.user_text,
            result["reply"],
            meta
        )
        # 3. Responder al usuario inmediatamente
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/history", response_model=list[dict])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Devuelve el historial de mensajes y análisis del usuario autenticado (últimos 20 mensajes).
    """
    mensajes_con_analisis = crud.get_messages_with_analysis_by_user(db, getattr(current_user, 'id'), limit=20)
    return mensajes_con_analisis

@router.get("/session/{session_id}/messages", response_model=List[dict])
def get_session_messages(
    session_id: int = Path(..., description="ID de la sesión"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene todos los mensajes de una sesión específica.
    """
    # Verificar que la sesión existe y el usuario tiene acceso
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    # Verificar permisos: el usuario debe ser el estudiante o el tutor de la sesión
    if session.usuario_id != current_user.id and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a esta sesión")
    
    # Obtener mensajes de la sesión
    messages = db.query(Mensaje).filter(Mensaje.sesion_id == session_id).order_by(Mensaje.creado_en.asc()).all()
    
    # Formatear respuesta
    formatted_messages = []
    for message in messages:
        formatted_message = {
            "id": message.id,
            "contenido": message.texto,
            "timestamp": message.creado_en.isoformat(),
            "es_tutor": message.remitente == "tutor",
            "usuario_id": message.usuario_id,
            "sesion_id": message.sesion_id,
            "remitente": message.remitente
        }
        
        # Agregar información del usuario si está disponible
        if message.usuario:
            formatted_message["usuario_nombre"] = f"{message.usuario.nombre} {message.usuario.apellido or ''}"
            formatted_message["usuario_email"] = message.usuario.email
        
        # Agregar análisis si existe
        if message.analisis:
            formatted_message["analisis"] = {
                "emocion": message.analisis.emocion,
                "emocion_score": message.analisis.emocion_score,
                "estilo": message.analisis.estilo,
                "estilo_score": message.analisis.estilo_score,
                "prioridad": message.analisis.prioridad,
                "alerta": message.analisis.alerta
            }
        
        formatted_messages.append(formatted_message)
    
    return formatted_messages

@router.post("/message", response_model=dict)
def send_message(
    message_data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Envía un mensaje a una sesión específica.
    """
    session_id = message_data.get("sesion_id")
    contenido = message_data.get("contenido")
    es_tutor = message_data.get("es_tutor", False)
    
    if not session_id or not contenido:
        raise HTTPException(status_code=422, detail="sesion_id y contenido son requeridos")
    
    # Verificar que la sesión existe y el usuario tiene acceso
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    # Verificar permisos
    if session.usuario_id != current_user.id and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para enviar mensajes en esta sesión")
    
    # Crear el mensaje
    remitente = "tutor" if es_tutor else "user"
    new_message = Mensaje(
        usuario_id=current_user.id,
        sesion_id=session_id,
        texto=contenido,
        remitente=remitente,
        tipo_mensaje="texto"
    )
    
    db.add(new_message)
    session.mensajes_count += 1
    db.commit()
    db.refresh(new_message)
    
    # Formatear respuesta
    response = {
        "id": new_message.id,
        "contenido": new_message.texto,
        "timestamp": new_message.creado_en.isoformat(),
        "es_tutor": new_message.remitente == "tutor",
        "usuario_id": new_message.usuario_id,
        "sesion_id": new_message.sesion_id,
        "remitente": new_message.remitente
    }
    
    # Agregar información del usuario
    if new_message.usuario:
        response["usuario_nombre"] = f"{new_message.usuario.nombre} {new_message.usuario.apellido or ''}"
        response["usuario_email"] = new_message.usuario.email
    
    return response

class SimpleChatMessage(BaseModel):
    user_text: str

@router.post("/analysis", response_model=dict)
def analyze_message_endpoint(
    message: SimpleChatMessage,
    current_user: Usuario = Depends(get_current_user)
):
    """
    Analiza un mensaje individual y retorna el análisis emocional y de estilo detallado.
    """
    try:
        analysis = analyze_text(message.user_text)
        # Alias para compatibilidad con tests
        if "emocion_score" in analysis:
            analysis["intensidad"] = analysis["emocion_score"]
        if "estilo" in analysis:
            analysis["estilo_comunicacion"] = analysis["estilo"]
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")

@router.post("/session", response_model=ChatSessionResponse)
def create_or_get_chat_session(
    data: ChatSessionCreate = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea o obtiene una sesión de chat para el bot.
    Para el chat con el bot, no se asigna tutor.
    """
    # Buscar sesión activa existente sin tutor (chat con bot)
    session = db.query(SesionChat).filter(
        SesionChat.usuario_id == current_user.id,
        SesionChat.estado == "activa",
        SesionChat.tutor_id.is_(None)  # Solo sesiones sin tutor (chat con bot)
    ).first()
    
    if session:
        return session

    # Crear nueva sesión sin tutor (para chat con bot)
    new_session = SesionChat(
        usuario_id=current_user.id,
        tutor_id=None,  # Sin tutor para chat con bot
        estado="activa",
        mensajes_count=0
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session

@router.get("/session/active", response_model=ChatSessionResponse)
def get_active_chat_session(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene la sesión activa del chat con bot (sin tutor).
    """
    session = db.query(SesionChat).filter(
        SesionChat.usuario_id == current_user.id,
        SesionChat.estado == "activa",
        SesionChat.tutor_id.is_(None)  # Solo sesiones sin tutor (chat con bot)
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="No hay sesión activa")
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_chat_sessions(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Buscar sesiones donde el usuario es estudiante o tutor
    sessions = db.query(SesionChat).filter(
        (SesionChat.usuario_id == current_user.id) | (SesionChat.tutor_id == current_user.id)
    ).order_by(SesionChat.iniciada_en.desc()).all()
    return sessions

@router.get("/session/{session_id}", response_model=ChatSessionResponse)
def get_session(
    session_id: int = Path(..., description="ID de la sesión"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    if session.usuario_id != current_user.id and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta sesión")
    return session

@router.put("/session/{session_id}/end", response_model=ChatSessionResponse)
def end_session(
    session_id: int = Path(..., description="ID de la sesión a cerrar"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    if session.estado != "activa":
        raise HTTPException(status_code=400, detail="La sesión ya está cerrada o no está activa")
    if session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el tutor asignado puede cerrar la sesión")

    session.estado = "cerrada"
    session.finalizada_en = func.now()
    db.commit()
    db.refresh(session)

    # Generar y guardar reporte automático
    try:
        generate_report_for_session(session_id, db)
    except Exception as e:
        print(f"Error generando reporte automático: {e}")

    # Notificar al estudiante
    create_notification(
        db,
        usuario_id=session.usuario_id,
        titulo="Sesión de chat cerrada",
        mensaje="El tutor ha cerrado la sesión. Puedes consultar el reporte.",
        tipo="chat",
        metadatos={"sesion_id": session.id}
    )
    # Notificar al tutor sobre el reporte
    create_notification(
        db,
        usuario_id=session.tutor_id,
        titulo="Reporte generado",
        mensaje=f"Se ha generado un reporte para la sesión con el estudiante {session.usuario_id}.",
        tipo="reporte",
        metadatos={"sesion_id": session.id}
    )
    return session

@router.get("/stats", response_model=dict)
def get_chat_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene estadísticas de chat para el usuario actual.
    """
    # Sesiones donde el usuario es estudiante o tutor
    total_sessions = db.query(SesionChat).filter(
        (SesionChat.usuario_id == current_user.id) | (SesionChat.tutor_id == current_user.id)
    ).count()
    
    active_sessions = db.query(SesionChat).filter(
        (SesionChat.usuario_id == current_user.id) | (SesionChat.tutor_id == current_user.id),
        SesionChat.estado == "activa"
    ).count()
    
    total_messages = db.query(Mensaje).join(SesionChat).filter(
        (SesionChat.usuario_id == current_user.id) | (SesionChat.tutor_id == current_user.id)
    ).count()
    
    return {
        "total_sessions": total_sessions,
        "active_sessions": active_sessions,
        "total_messages": total_messages
    }

@router.get("/recent-messages", response_model=List[dict])
def get_recent_messages(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene los mensajes más recientes de las sesiones del usuario.
    """
    mensajes = db.query(Mensaje).join(SesionChat).filter(
        (SesionChat.usuario_id == current_user.id) | (SesionChat.tutor_id == current_user.id)
    ).order_by(Mensaje.creado_en.desc()).limit(limit).all()
    
    formatted_messages = []
    for message in mensajes:
        formatted_message = {
            "id": message.id,
            "contenido": message.texto,
            "timestamp": message.creado_en.isoformat(),
            "es_tutor": message.remitente == "tutor",
            "usuario_id": message.usuario_id,
            "sesion_id": message.sesion_id,
            "remitente": message.remitente
        }
        
        if message.usuario:
            formatted_message["usuario_nombre"] = f"{message.usuario.nombre} {message.usuario.apellido or ''}"
            formatted_message["usuario_email"] = message.usuario.email
        
        formatted_messages.append(formatted_message)
    
    return formatted_messages

@router.put("/session/{session_id}/mark-read")
def mark_messages_as_read(
    session_id: int = Path(..., description="ID de la sesión"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Marca todos los mensajes de una sesión como leídos.
    """
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    # Verificar que el usuario tenga acceso a esta sesión
    if session.usuario_id != current_user.id and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta sesión")
    
    # Aquí podrías implementar la lógica para marcar mensajes como leídos
    # Por ahora solo retornamos éxito
    return {"message": "Mensajes marcados como leídos"}

@router.get("/unread", response_model=List[dict])
def get_unread_messages_short(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Alias para /unread-messages - mantiene compatibilidad con el frontend.
    """
    return get_unread_messages(db, current_user)

@router.get("/unread-messages", response_model=List[dict])
def get_unread_messages(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene mensajes no leídos del usuario.
    """
    # Por ahora retornamos mensajes recientes
    # En una implementación completa, tendrías un campo para marcar mensajes como leídos
    mensajes = db.query(Mensaje).join(SesionChat).filter(
        (SesionChat.usuario_id == current_user.id) | (SesionChat.tutor_id == current_user.id),
        Mensaje.remitente != ("tutor" if current_user.rol == "tutor" else "estudiante")
    ).order_by(Mensaje.creado_en.desc()).limit(20).all()
    
    formatted_messages = []
    for message in mensajes:
        formatted_message = {
            "id": message.id,
            "contenido": message.texto,
            "timestamp": message.creado_en.isoformat(),
            "es_tutor": message.remitente == "tutor",
            "usuario_id": message.usuario_id,
            "sesion_id": message.sesion_id,
            "remitente": message.remitente
        }
        
        if message.usuario:
            formatted_message["usuario_nombre"] = f"{message.usuario.nombre} {message.usuario.apellido or ''}"
            formatted_message["usuario_email"] = message.usuario.email
        
        formatted_messages.append(formatted_message)
    
    return formatted_messages

@router.get("/search", response_model=List[dict])
def search_messages(
    q: str,
    session_id: int = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Busca mensajes por contenido.
    """
    query = db.query(Mensaje).join(SesionChat).filter(
        (SesionChat.usuario_id == current_user.id) | (SesionChat.tutor_id == current_user.id),
        Mensaje.texto.contains(q)
    )
    
    if session_id:
        query = query.filter(Mensaje.sesion_id == session_id)
    
    mensajes = query.order_by(Mensaje.creado_en.desc()).limit(50).all()
    
    formatted_messages = []
    for message in mensajes:
        formatted_message = {
            "id": message.id,
            "contenido": message.texto,
            "timestamp": message.creado_en.isoformat(),
            "es_tutor": message.remitente == "tutor",
            "usuario_id": message.usuario_id,
            "sesion_id": message.sesion_id,
            "remitente": message.remitente
        }
        
        if message.usuario:
            formatted_message["usuario_nombre"] = f"{message.usuario.nombre} {message.usuario.apellido or ''}"
            formatted_message["usuario_email"] = message.usuario.email
        
        formatted_messages.append(formatted_message)
    
    return formatted_messages

@router.post("/test-analysis", response_model=dict)
def test_chat_analysis(
    message: SimpleChatMessage,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Endpoint de prueba para verificar que el análisis se guarde correctamente.
    """
    try:
        # 1. Generar análisis y respuesta del bot
        result = generate_bot_reply(user_text=message.user_text, user_context={"history": []})
        meta = result["meta"]
        
        # 2. Guardar mensajes y análisis inmediatamente (no en background)
        save_result = save_chat_and_analysis(
            db,
            getattr(current_user, 'id'),
            message.user_text,
            result["reply"],
            meta
        )
        
        # 3. Verificar que se guardó correctamente
        if save_result:
            # Obtener el mensaje guardado para verificar el análisis
            from app.db.models import Mensaje, Analisis
            user_message = db.query(Mensaje).filter(Mensaje.id == save_result["user_message_id"]).first()
            analysis = db.query(Analisis).filter(Analisis.mensaje_id == save_result["user_message_id"]).first()
            
            return {
                "success": True,
                "message": "Análisis guardado correctamente",
                "chat_response": result,
                "saved_data": {
                    "user_message_id": save_result["user_message_id"],
                    "bot_message_id": save_result["bot_message_id"],
                    "analysis_id": save_result["analysis_id"],
                    "session_id": save_result["session_id"],
                    "analysis_data": {
                        "emocion": analysis.emocion if analysis else None,
                        "emocion_score": analysis.emocion_score if analysis else None,
                        "estilo": analysis.estilo if analysis else None,
                        "estilo_score": analysis.estilo_score if analysis else None,
                        "prioridad": analysis.prioridad if analysis else None,
                        "alerta": analysis.alerta if analysis else None
                    } if analysis else None
                }
            }
        else:
            return {
                "success": False,
                "message": "Error al guardar el análisis",
                "chat_response": result
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")
