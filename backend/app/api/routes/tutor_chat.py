# backend/app/api/routes/tutor_chat.py
"""
Rutas para el chat entre estudiantes y tutores.
"""

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.chat import ChatSessionCreate, ChatSessionResponse
from app.dependencies import get_current_user
from app.db.models import Usuario, SesionChat, Mensaje, RolUsuario
from app.db import crud
from app.schemas.message import Message, MessageCreate
from sqlalchemy import func
from typing import List

router = APIRouter()

@router.post("/session", response_model=ChatSessionResponse)
def create_or_get_tutor_session(
    data: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea o obtiene una sesión de chat con tutor.
    Solo para estudiantes.
    """
    if current_user.rol != RolUsuario.ESTUDIANTE:
        raise HTTPException(status_code=403, detail="Solo los estudiantes pueden crear sesiones con tutores")
    
    # Buscar sesión activa existente
    session = db.query(SesionChat).filter(
        SesionChat.usuario_id == current_user.id,
        SesionChat.estado == "activa",
        SesionChat.tutor_id.isnot(None)  # Solo sesiones con tutor
    ).first()
    
    if session:
        return session

    # Si se especifica tutor_id, usarlo aunque no esté activo
    tutor = None
    if data.tutor_id:
        tutor = db.query(Usuario).filter(Usuario.id == data.tutor_id, Usuario.rol == RolUsuario.TUTOR).first()
        if not tutor:
            raise HTTPException(status_code=404, detail="Tutor no encontrado")
    else:
        tutor = db.query(Usuario).filter(Usuario.rol == RolUsuario.TUTOR).first()
        if not tutor:
            raise HTTPException(status_code=404, detail="No hay tutores disponibles en este momento")

    # Crear nueva sesión
    new_session = SesionChat(
        usuario_id=current_user.id,
        tutor_id=tutor.id,
        estado="activa",
        mensajes_count=0
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session

@router.get("/session/active", response_model=ChatSessionResponse)
def get_active_tutor_session(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene la sesión activa con tutor del usuario actual.
    """
    if current_user.rol != RolUsuario.ESTUDIANTE:
        raise HTTPException(status_code=403, detail="Solo los estudiantes pueden acceder a sesiones con tutores")
    
    session = db.query(SesionChat).filter(
        SesionChat.usuario_id == current_user.id,
        SesionChat.estado == "activa",
        SesionChat.tutor_id.isnot(None)
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="No hay sesión activa con tutor")
    
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_tutor_sessions(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista todas las sesiones con tutores del usuario actual.
    """
    if current_user.rol != RolUsuario.ESTUDIANTE:
        raise HTTPException(status_code=403, detail="Solo los estudiantes pueden ver sesiones con tutores")
    
    sessions = db.query(SesionChat).filter(
        SesionChat.usuario_id == current_user.id,
        SesionChat.tutor_id.isnot(None)
    ).order_by(SesionChat.iniciada_en.desc()).all()
    
    return sessions

@router.post("/session/{session_id}/close", response_model=ChatSessionResponse)
def close_tutor_session(
    session_id: int = Path(..., description="ID de la sesión a cerrar"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Cierra una sesión de chat con tutor.
    Solo el tutor asignado puede cerrar la sesión.
    """
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

    return session

@router.post("/session/{session_id}/message", response_model=Message)
def send_message_to_tutor_session(
    session_id: int = Path(..., description="ID de la sesión"),
    message: MessageCreate = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Envía un mensaje a una sesión de chat con tutor.
    """
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    if session.estado != "activa":
        raise HTTPException(status_code=400, detail="La sesión no está activa")
    
    # Verificar que el usuario sea el estudiante o el tutor de la sesión
    if session.usuario_id != current_user.id and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para enviar mensajes en esta sesión")

    nuevo_mensaje = Mensaje(
        usuario_id=current_user.id,
        sesion_id=session_id,
        texto=message.texto,
        remitente=message.remitente,
        tipo_mensaje=message.tipo_mensaje or "texto",
        metadatos=getattr(message, 'metadatos', None)
    )
    db.add(nuevo_mensaje)
    session.mensajes_count += 1
    db.commit()
    db.refresh(nuevo_mensaje)
    
    # Asegurar que metadatos sea un dict válido
    metadatos = nuevo_mensaje.metadatos if isinstance(nuevo_mensaje.metadatos, dict) or nuevo_mensaje.metadatos is None else {}
    
    return {
        "id": nuevo_mensaje.id,
        "usuario_id": nuevo_mensaje.usuario_id,
        "sesion_id": nuevo_mensaje.sesion_id,
        "texto": nuevo_mensaje.texto,
        "remitente": nuevo_mensaje.remitente,
        "tipo_mensaje": nuevo_mensaje.tipo_mensaje,
        "metadatos": metadatos,
        "creado_en": nuevo_mensaje.creado_en
    }

@router.get("/session/{session_id}/messages", response_model=List[Message])
def get_tutor_session_messages(
    session_id: int = Path(..., description="ID de la sesión"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene todos los mensajes de una sesión de chat con tutor.
    """
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    # Verificar que el usuario sea el estudiante o el tutor de la sesión
    if session.usuario_id != current_user.id and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver mensajes de esta sesión")
    mensajes = db.query(Mensaje).filter(
        Mensaje.sesion_id == session_id
    ).order_by(Mensaje.creado_en.asc()).all()
    # Asegurar que metadatos sea un dict
    mensajes_response = []
    for m in mensajes:
        metadatos = m.metadatos if isinstance(m.metadatos, dict) or m.metadatos is None else {}
        mensajes_response.append({
            "id": m.id,
            "usuario_id": m.usuario_id,
            "sesion_id": m.sesion_id,
            "texto": m.texto,
            "remitente": m.remitente,
            "tipo_mensaje": m.tipo_mensaje,
            "metadatos": metadatos,
            "creado_en": m.creado_en
        })
    return mensajes_response

@router.get("/session/{session_id}/report", response_model=dict)
def get_tutor_session_report(
    session_id: int = Path(..., description="ID de la sesión"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene el reporte de una sesión de chat con tutor.
    """
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    # Verificar que el usuario sea el estudiante o el tutor de la sesión
    if session.usuario_id != current_user.id and session.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver el reporte de esta sesión")
    
    reporte = (session.metadatos or {}).get("reporte")
    if not reporte:
        raise HTTPException(status_code=404, detail="No hay reporte generado para esta sesión")
    
    return reporte 

@router.get("/tutors", response_model=List[dict])
def list_all_tutors(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Devuelve la lista de todos los tutores (sin filtrar por estado).
    """
    tutores = db.query(Usuario).filter(Usuario.rol == RolUsuario.TUTOR).all()
    return [
        {
            "id": t.id,
            "nombre": f"{t.nombre} {t.apellido or ''}",
            "email": t.email,
            "estado": t.estado.value if hasattr(t.estado, 'value') else t.estado,
            "institucion": t.institucion,
            "grado_academico": t.grado_academico
        }
        for t in tutores
    ] 