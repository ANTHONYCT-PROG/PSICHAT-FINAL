# backend/app/api/routes/tutor.py
"""
Rutas específicas para tutores - Panel robusto de gestión de sesiones de chat.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Path, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, desc
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models import Usuario, SesionChat, Mensaje, Analisis, Alerta, Notificacion, Intervencion, RolUsuario
from app.schemas.tutor import (
    TutorDashboardResponse, 
    SessionListResponse, 
    SessionDetailResponse,
    SessionStatsResponse,
    AlertListResponse,
    InterventionCreate,
    InterventionResponse
)
from app.services.tutor_service import (
    get_tutor_dashboard_data,
    get_session_analytics,
    generate_session_report,
    create_intervention
)
from typing import List, Optional
from datetime import datetime, timedelta
import json

router = APIRouter()


@router.get("/dashboard", response_model=TutorDashboardResponse)
def get_tutor_dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Dashboard principal del tutor con estadísticas y sesiones activas.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    return get_tutor_dashboard_data(db, current_user.id)


@router.get("/sessions", response_model=List[SessionListResponse])
def get_tutor_sessions(
    estado: Optional[str] = Query(None, description="Filtrar por estado: activa, cerrada, pausada"),
    estudiante_id: Optional[int] = Query(None, description="Filtrar por estudiante específico"),
    fecha_inicio: Optional[str] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[str] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    limit: int = Query(20, description="Número máximo de sesiones"),
    offset: int = Query(0, description="Offset para paginación"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista de sesiones de chat del tutor con filtros avanzados.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    try:
        query = db.query(SesionChat).filter(SesionChat.tutor_id == current_user.id)
        if estado:
            query = query.filter(SesionChat.estado == estado)
        if estudiante_id:
            query = query.filter(SesionChat.usuario_id == estudiante_id)
        if fecha_inicio:
            query = query.filter(SesionChat.iniciada_en >= fecha_inicio)
        if fecha_fin:
            query = query.filter(SesionChat.iniciada_en <= fecha_fin + " 23:59:59")
        sessions = query.options(
            joinedload(SesionChat.usuario),
            joinedload(SesionChat.mensajes)
        ).order_by(desc(SesionChat.iniciada_en)).offset(offset).limit(limit).all()
        result = []
        for s in sessions:
            result.append({
                "id": s.id,
                "usuario_id": s.usuario_id,
                "estudiante_nombre": s.usuario.nombre if s.usuario else "",
                "estudiante_email": s.usuario.email if s.usuario else "",
                "estado": s.estado,
                "mensajes_count": s.mensajes_count,
                "duracion_total": s.duracion_total,
                "iniciada_en": s.iniciada_en,
                "pausada_en": s.pausada_en,
                "finalizada_en": s.finalizada_en,
                "ultimo_mensaje": s.mensajes[-1].texto if s.mensajes else ""
            })
        return result
    except Exception as e:
        print(f"Error in get_tutor_sessions: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session_detail(
    session_id: int = Path(..., description="ID de la sesión"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Detalles completos de una sesión específica con mensajes y análisis.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).options(
        joinedload(SesionChat.usuario),
        joinedload(SesionChat.mensajes).joinedload(Mensaje.analisis),
        joinedload(SesionChat.intervenciones)
    ).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    # Convertir mensajes a diccionarios
    mensajes = []
    for mensaje in session.mensajes:
        mensaje_dict = {
            "id": mensaje.id,
            "usuario_id": mensaje.usuario_id,
            "sesion_id": mensaje.sesion_id,
            "texto": mensaje.texto,
            "remitente": mensaje.remitente,
            "tipo_mensaje": mensaje.tipo_mensaje,
            "metadatos": mensaje.metadatos,
            "creado_en": mensaje.creado_en
        }
        if mensaje.analisis:
            mensaje_dict["analisis"] = {
                "emocion": mensaje.analisis.emocion,
                "emocion_score": mensaje.analisis.emocion_score,
                "estilo": mensaje.analisis.estilo,
                "estilo_score": mensaje.analisis.estilo_score,
                "prioridad": mensaje.analisis.prioridad,
                "alerta": mensaje.analisis.alerta
            }
        mensajes.append(mensaje_dict)
    
    # Convertir intervenciones a diccionarios
    intervenciones = []
    for intervencion in session.intervenciones:
        intervenciones.append({
            "id": intervencion.id,
            "usuario_id": intervencion.usuario_id,
            "tutor_id": intervencion.tutor_id,
            "alerta_id": intervencion.alerta_id,
            "sesion_id": intervencion.sesion_id,
            "tipo_intervencion": intervencion.tipo_intervencion,
            "mensaje": intervencion.mensaje,
            "metodo": intervencion.metodo,
            "enviada": intervencion.enviada,
            "recibida": intervencion.recibida,
            "efectiva": intervencion.efectiva,
            "creado_en": intervencion.creado_en,
            "enviada_en": intervencion.enviada_en,
            "recibida_en": intervencion.recibida_en,
            "metadatos": intervencion.metadatos
        })
    
    return {
        "id": session.id,
        "usuario_id": session.usuario_id,
        "estudiante_nombre": session.usuario.nombre if session.usuario else "",
        "estudiante_email": session.usuario.email if session.usuario else "",
        "estudiante_institucion": session.usuario.institucion if session.usuario else None,
        "estudiante_grado": session.usuario.grado_academico if session.usuario else None,
        "estado": session.estado,
        "mensajes_count": session.mensajes_count,
        "duracion_total": session.duracion_total,
        "iniciada_en": session.iniciada_en,
        "pausada_en": session.pausada_en,
        "finalizada_en": session.finalizada_en,
        "metadatos": session.metadatos,
        "mensajes": mensajes,
        "intervenciones": intervenciones
    }


@router.get("/sessions/{session_id}/stats", response_model=SessionStatsResponse)
def get_session_statistics(
    session_id: int = Path(..., description="ID de la sesión"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Estadísticas detalladas de una sesión (análisis emocional, patrones, etc.).
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    return get_session_analytics(db, session_id, current_user.id)


@router.post("/sessions/{session_id}/pause")
def pause_session(
    session_id: int = Path(..., description="ID de la sesión"),
    motivo: Optional[str] = Query(None, description="Motivo de la pausa"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Pausar una sesión activa.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    if session.estado != "activa":
        raise HTTPException(status_code=400, detail="Solo se pueden pausar sesiones activas")
    
    session.estado = "pausada"
    session.pausada_en = func.now()
    if motivo:
        metadatos = session.metadatos or {}
        metadatos["motivo_pausa"] = motivo
        session.metadatos = metadatos
    
    db.commit()
    
    # Notificar al estudiante
    notificacion = Notificacion(
        usuario_id=session.usuario_id,
        titulo="Sesión pausada",
        mensaje=f"El tutor ha pausado la sesión. Motivo: {motivo or 'No especificado'}",
        tipo="sesion",
        metadatos={"sesion_id": session.id, "accion": "pausada"}
    )
    db.add(notificacion)
    db.commit()
    
    return {"message": "Sesión pausada exitosamente"}


@router.post("/sessions/{session_id}/resume")
def resume_session(
    session_id: int = Path(..., description="ID de la sesión"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Reanudar una sesión pausada.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    if session.estado != "pausada":
        raise HTTPException(status_code=400, detail="Solo se pueden reanudar sesiones pausadas")
    
    session.estado = "activa"
    session.pausada_en = None
    db.commit()
    
    # Notificar al estudiante
    notificacion = Notificacion(
        usuario_id=session.usuario_id,
        titulo="Sesión reanudada",
        mensaje="El tutor ha reanudado la sesión de chat.",
        tipo="sesion",
        metadatos={"sesion_id": session.id, "accion": "reanudada"}
    )
    db.add(notificacion)
    db.commit()
    
    return {"message": "Sesión reanudada exitosamente"}


@router.post("/sessions/{session_id}/close")
def close_session(
    session_id: int = Path(..., description="ID de la sesión"),
    resumen: Optional[str] = Query(None, description="Resumen de la sesión"),
    recomendaciones: Optional[str] = Query(None, description="Recomendaciones para el estudiante"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Cerrar una sesión y generar reporte automático.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    if session.estado not in ["activa", "pausada"]:
        raise HTTPException(status_code=400, detail="Solo se pueden cerrar sesiones activas o pausadas")
    
    # Actualizar metadatos con resumen y recomendaciones
    metadatos = session.metadatos or {}
    if resumen:
        metadatos["resumen_tutor"] = resumen
    if recomendaciones:
        metadatos["recomendaciones_tutor"] = recomendaciones
    
    session.estado = "cerrada"
    session.finalizada_en = func.now()
    session.metadatos = metadatos
    
    # Calcular duración total
    if session.iniciada_en and session.finalizada_en:
        duracion = (session.finalizada_en - session.iniciada_en).total_seconds()
        if session.pausada_en:
            duracion -= (session.pausada_en - session.iniciada_en).total_seconds()
        session.duracion_total = int(duracion)
    
    db.commit()
    
    # Generar reporte en segundo plano
    if background_tasks:
        background_tasks.add_task(generate_session_report, session_id, db)
    
    # Notificar al estudiante
    notificacion = Notificacion(
        usuario_id=session.usuario_id,
        titulo="Sesión finalizada",
        mensaje="El tutor ha finalizado la sesión. Puedes consultar el reporte.",
        tipo="sesion",
        metadatos={"sesion_id": session.id, "accion": "finalizada"}
    )
    db.add(notificacion)
    db.commit()
    
    return {"message": "Sesión cerrada exitosamente"}


@router.get("/alerts", response_model=List[AlertListResponse])
def get_tutor_alerts(
    nivel_urgencia: Optional[str] = Query(None, description="Filtrar por nivel: crítica, alta, media, baja"),
    revisada: Optional[bool] = Query(None, description="Filtrar por estado de revisión"),
    limit: int = Query(20, description="Número máximo de alertas"),
    offset: int = Query(0, description="Offset para paginación"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista de alertas asignadas al tutor.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    query = db.query(Alerta).filter(Alerta.tutor_asignado == current_user.id)
    
    if nivel_urgencia:
        query = query.filter(Alerta.nivel_urgencia == nivel_urgencia)
    if revisada is not None:
        query = query.filter(Alerta.revisada == revisada)
    
    alerts = query.options(
        joinedload(Alerta.usuario),
        joinedload(Alerta.analisis)
    ).order_by(desc(Alerta.creado_en)).offset(offset).limit(limit).all()
    
    return alerts


@router.post("/alerts/{alert_id}/review")
def review_alert(
    alert_id: int = Path(..., description="ID de la alerta"),
    notas: Optional[str] = Query(None, description="Notas del tutor sobre la alerta"),
    accion: Optional[str] = Query(None, description="Acción tomada"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Marcar una alerta como revisada y agregar notas.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    alert = db.query(Alerta).filter(
        Alerta.id == alert_id,
        Alerta.tutor_asignado == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    
    alert.revisada = True
    alert.revisada_en = func.now()
    if notas:
        alert.notas_tutor = notas
    if accion:
        alert.accion_tomada = accion
    
    db.commit()
    
    return {"message": "Alerta marcada como revisada"}


@router.post("/interventions", response_model=InterventionResponse)
def create_intervention_endpoint(
    intervention: InterventionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crear una nueva intervención.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    return create_intervention(db, intervention, current_user.id)


@router.get("/students", response_model=List[dict])
def get_tutor_students(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Lista de estudiantes asignados al tutor.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    # Obtener estudiantes únicos que han tenido sesiones con este tutor
    students = db.query(Usuario).join(SesionChat, Usuario.id == SesionChat.usuario_id).filter(
        SesionChat.tutor_id == current_user.id,
        Usuario.rol == RolUsuario.ESTUDIANTE
    ).distinct().all()
    
    return [
        {
            "id": student.id,
            "nombre": f"{student.nombre} {student.apellido or ''}",
            "email": student.email,
            "institucion": student.institucion,
            "grado_academico": student.grado_academico,
            "ultimo_acceso": student.ultimo_acceso,
            "sesiones_count": db.query(SesionChat).filter(
                SesionChat.usuario_id == student.id,
                SesionChat.tutor_id == current_user.id
            ).count()
        }
        for student in students
    ]


@router.get("/notifications", response_model=List[dict])
def get_tutor_notifications(
    leida: Optional[bool] = Query(None, description="Filtrar por estado de lectura"),
    limit: int = Query(20, description="Número máximo de notificaciones"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Notificaciones del tutor.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    query = db.query(Notificacion).filter(Notificacion.usuario_id == current_user.id)
    
    if leida is not None:
        query = query.filter(Notificacion.leida == leida)
    
    notifications = query.order_by(desc(Notificacion.creado_en)).limit(limit).all()
    
    return [
        {
            "id": notif.id,
            "titulo": notif.titulo,
            "mensaje": notif.mensaje,
            "tipo": notif.tipo,
            "leida": notif.leida,
            "creado_en": notif.creado_en,
            "metadatos": notif.metadatos
        }
        for notif in notifications
    ]


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int = Path(..., description="ID de la notificación"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Marcar una notificación como leída.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    notification = db.query(Notificacion).filter(
        Notificacion.id == notification_id,
        Notificacion.usuario_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notification.leida = True
    notification.leida_en = func.now()
    db.commit()
    
    return {"message": "Notificación marcada como leída"}


# Nuevos endpoints para completar la funcionalidad del panel del tutor

@router.get("/students/{student_id}")
def get_student_profile(
    student_id: int = Path(..., description="ID del estudiante"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener perfil detallado de un estudiante específico.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    # Verificar que el estudiante haya tenido sesiones con este tutor
    student = db.query(Usuario).join(SesionChat, Usuario.id == SesionChat.usuario_id).filter(
        Usuario.id == student_id,
        SesionChat.tutor_id == current_user.id,
        Usuario.rol == RolUsuario.ESTUDIANTE
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Obtener estadísticas del estudiante
    sesiones = db.query(SesionChat).filter(
        SesionChat.usuario_id == student_id,
        SesionChat.tutor_id == current_user.id
    ).all()
    
    total_mensajes = sum(s.mensajes_count for s in sesiones)
    sesiones_activas = len([s for s in sesiones if s.estado == "activa"])
    alertas_count = db.query(Alerta).filter(
        Alerta.usuario_id == student_id,
        Alerta.tutor_asignado == current_user.id,
        Alerta.revisada == False
    ).count()
    
    return {
        "id": student.id,
        "nombre": f"{student.nombre} {student.apellido or ''}",
        "email": student.email,
        "institucion": student.institucion,
        "grado_academico": student.grado_academico,
        "ultimo_acceso": student.ultimo_acceso,
        "estadisticas": {
            "total_sesiones": len(sesiones),
            "sesiones_activas": sesiones_activas,
            "total_mensajes": total_mensajes,
            "alertas_pendientes": alertas_count,
            "promedio_mensajes_por_sesion": total_mensajes / len(sesiones) if sesiones else 0
        },
        "sesiones_recientes": [
            {
                "id": s.id,
                "estado": s.estado,
                "iniciada_en": s.iniciada_en,
                "mensajes_count": s.mensajes_count,
                "duracion_total": s.duracion_total
            }
            for s in sesiones[:5]  # Últimas 5 sesiones
        ]
    }


@router.get("/sessions/{session_id}/messages")
def get_session_messages(
    session_id: int = Path(..., description="ID de la sesión"),
    limit: int = Query(50, description="Número máximo de mensajes"),
    offset: int = Query(0, description="Offset para paginación"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener mensajes de una sesión específica.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    messages = db.query(Mensaje).filter(
        Mensaje.sesion_id == session_id
    ).options(
        joinedload(Mensaje.analisis)
    ).order_by(desc(Mensaje.creado_en)).offset(offset).limit(limit).all()
    
    return [
        {
            "id": msg.id,
            "texto": msg.texto,
            "remitente": msg.remitente,
            "tipo_mensaje": msg.tipo_mensaje,
            "creado_en": msg.creado_en,
            "analisis": msg.analisis if msg.analisis else None
        }
        for msg in messages
    ]


@router.post("/sessions/{session_id}/messages")
def send_message_to_session(
    session_id: int = Path(..., description="ID de la sesión"),
    message: dict = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Enviar un mensaje a una sesión específica.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    if session.estado != "activa":
        raise HTTPException(status_code=400, detail="No se pueden enviar mensajes a sesiones no activas")
    
    nuevo_mensaje = Mensaje(
        usuario_id=current_user.id,
        sesion_id=session_id,
        texto=message.get("texto", ""),
        remitente="tutor",
        tipo_mensaje=message.get("tipo_mensaje", "texto"),
        metadatos=message.get("metadatos", {})
    )
    
    db.add(nuevo_mensaje)
    session.mensajes_count += 1
    db.commit()
    db.refresh(nuevo_mensaje)
    
    return {
        "id": nuevo_mensaje.id,
        "texto": nuevo_mensaje.texto,
        "remitente": nuevo_mensaje.remitente,
        "tipo_mensaje": nuevo_mensaje.tipo_mensaje,
        "creado_en": nuevo_mensaje.creado_en
    }


@router.put("/sessions/{session_id}/messages/{message_id}/read")
def mark_message_as_read(
    session_id: int = Path(..., description="ID de la sesión"),
    message_id: int = Path(..., description="ID del mensaje"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Marcar un mensaje como leído.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    message = db.query(Mensaje).filter(
        Mensaje.id == message_id,
        Mensaje.sesion_id == session_id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    
    # Actualizar metadatos del mensaje para marcarlo como leído
    metadatos = message.metadatos or {}
    metadatos["leido_por_tutor"] = True
    metadatos["leido_en"] = datetime.now().isoformat()
    message.metadatos = metadatos
    
    db.commit()
    
    return {"message": "Mensaje marcado como leído"}


@router.put("/sessions/{session_id}/priority")
def update_session_priority(
    session_id: int = Path(..., description="ID de la sesión"),
    priority: dict = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Actualizar la prioridad de una sesión.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    nueva_prioridad = priority.get("prioridad", "media")
    if nueva_prioridad not in ["alta", "media", "baja"]:
        raise HTTPException(status_code=400, detail="Prioridad inválida")
    
    metadatos = session.metadatos or {}
    metadatos["prioridad"] = nueva_prioridad
    metadatos["prioridad_actualizada_en"] = datetime.now().isoformat()
    session.metadatos = metadatos
    
    db.commit()
    
    return {"message": f"Prioridad actualizada a {nueva_prioridad}"}


@router.put("/alerts/{alert_id}/read")
def mark_alert_as_read(
    alert_id: int = Path(..., description="ID de la alerta"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Marcar una alerta como leída.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    alert = db.query(Alerta).filter(
        Alerta.id == alert_id,
        Alerta.tutor_asignado == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    
    alert.revisada = True
    alert.revisada_en = func.now()
    db.commit()
    
    return {"message": "Alerta marcada como leída"}


# Endpoints para funcionalidades avanzadas

@router.get("/reports/weekly")
def get_weekly_report(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener reporte semanal del tutor.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    # Calcular fechas para la semana actual
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    # Estadísticas de la semana
    sesiones_semana = db.query(SesionChat).filter(
        SesionChat.tutor_id == current_user.id,
        SesionChat.iniciada_en >= start_of_week,
        SesionChat.iniciada_en <= end_of_week
    ).all()
    
    total_mensajes = sum(s.mensajes_count for s in sesiones_semana)
    sesiones_activas = len([s for s in sesiones_semana if s.estado == "activa"])
    alertas_semana = db.query(Alerta).filter(
        Alerta.tutor_asignado == current_user.id,
        Alerta.creado_en >= start_of_week,
        Alerta.creado_en <= end_of_week
    ).count()
    
    return {
        "periodo": {
            "inicio": start_of_week.isoformat(),
            "fin": end_of_week.isoformat()
        },
        "estadisticas": {
            "total_sesiones": len(sesiones_semana),
            "sesiones_activas": sesiones_activas,
            "total_mensajes": total_mensajes,
            "alertas_generadas": alertas_semana,
            "promedio_mensajes_por_sesion": total_mensajes / len(sesiones_semana) if sesiones_semana else 0
        },
        "sesiones_por_dia": [
            {
                "fecha": (start_of_week + timedelta(days=i)).strftime("%Y-%m-%d"),
                "sesiones": len([s for s in sesiones_semana if s.iniciada_en.date() == (start_of_week + timedelta(days=i)).date()])
            }
            for i in range(7)
        ]
    }


@router.get("/reports/monthly")
def get_monthly_report(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener reporte mensual del tutor.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    # Calcular fechas para el mes actual
    today = datetime.now()
    start_of_month = today.replace(day=1)
    if today.month == 12:
        end_of_month = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        end_of_month = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    
    # Estadísticas del mes
    sesiones_mes = db.query(SesionChat).filter(
        SesionChat.tutor_id == current_user.id,
        SesionChat.iniciada_en >= start_of_month,
        SesionChat.iniciada_en <= end_of_month
    ).all()
    
    total_mensajes = sum(s.mensajes_count for s in sesiones_mes)
    estudiantes_unicos = len(set(s.usuario_id for s in sesiones_mes))
    alertas_mes = db.query(Alerta).filter(
        Alerta.tutor_asignado == current_user.id,
        Alerta.creado_en >= start_of_month,
        Alerta.creado_en <= end_of_month
    ).count()
    
    return {
        "periodo": {
            "inicio": start_of_month.isoformat(),
            "fin": end_of_month.isoformat()
        },
        "estadisticas": {
            "total_sesiones": len(sesiones_mes),
            "estudiantes_atendidos": estudiantes_unicos,
            "total_mensajes": total_mensajes,
            "alertas_generadas": alertas_mes,
            "promedio_mensajes_por_sesion": total_mensajes / len(sesiones_mes) if sesiones_mes else 0,
            "promedio_sesiones_por_estudiante": len(sesiones_mes) / estudiantes_unicos if estudiantes_unicos > 0 else 0
        }
    }


@router.get("/students/{student_id}/progress")
def get_student_progress(
    student_id: int = Path(..., description="ID del estudiante"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener progreso detallado de un estudiante.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    # Verificar que el estudiante haya tenido sesiones con este tutor
    student = db.query(Usuario).join(SesionChat, Usuario.id == SesionChat.usuario_id).filter(
        Usuario.id == student_id,
        SesionChat.tutor_id == current_user.id,
        Usuario.rol == RolUsuario.ESTUDIANTE
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Obtener todas las sesiones del estudiante con este tutor
    sesiones = db.query(SesionChat).filter(
        SesionChat.usuario_id == student_id,
        SesionChat.tutor_id == current_user.id
    ).order_by(SesionChat.iniciada_en).all()
    
    # Calcular progreso
    total_sesiones = len(sesiones)
    sesiones_completadas = len([s for s in sesiones if s.estado == "cerrada"])
    total_mensajes = sum(s.mensajes_count for s in sesiones)
    
    # Análisis de emociones y estilos (si hay análisis disponibles)
    emociones = {}
    estilos = {}
    
    for sesion in sesiones:
        mensajes = db.query(Mensaje).filter(Mensaje.sesion_id == sesion.id).all()
        for mensaje in mensajes:
            if mensaje.analisis:
                # mensaje.analisis es una relación de uno a uno, no una lista
                analisis = mensaje.analisis
                if analisis.emocion:
                    emociones[analisis.emocion] = emociones.get(analisis.emocion, 0) + 1
                if analisis.estilo:
                    estilos[analisis.estilo] = estilos.get(analisis.estilo, 0) + 1
    
    return {
        "estudiante": {
            "id": student.id,
            "nombre": f"{student.nombre} {student.apellido or ''}",
            "email": student.email
        },
        "progreso": {
            "total_sesiones": total_sesiones,
            "sesiones_completadas": sesiones_completadas,
            "porcentaje_completado": (sesiones_completadas / total_sesiones * 100) if total_sesiones > 0 else 0,
            "total_mensajes": total_mensajes,
            "promedio_mensajes_por_sesion": total_mensajes / total_sesiones if total_sesiones > 0 else 0
        },
        "analisis": {
            "emociones_detectadas": emociones,
            "estilos_comunicacion": estilos
        },
        "sesiones": [
            {
                "id": s.id,
                "estado": s.estado,
                "iniciada_en": s.iniciada_en,
                "mensajes_count": s.mensajes_count,
                "duracion_total": s.duracion_total
            }
            for s in sesiones
        ]
    }


@router.put("/students/{student_id}/notes")
def update_student_notes(
    student_id: int = Path(..., description="ID del estudiante"),
    notes: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Actualizar notas del tutor sobre un estudiante.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    # Verificar que el estudiante haya tenido sesiones con este tutor
    student = db.query(Usuario).join(SesionChat, Usuario.id == SesionChat.usuario_id).filter(
        Usuario.id == student_id,
        SesionChat.tutor_id == current_user.id,
        Usuario.rol == RolUsuario.ESTUDIANTE
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Crear o actualizar notas en una tabla de notas del tutor
    # Por simplicidad, usaremos los metadatos del usuario
    metadatos = student.metadatos or {}
    metadatos["notas_tutor"] = notes.get("notas", "")
    metadatos["notas_actualizadas_en"] = datetime.now().isoformat()
    metadatos["tutor_id"] = current_user.id
    student.metadatos = metadatos
    
    db.commit()
    
    return {"message": "Notas actualizadas exitosamente"}


@router.post("/sessions/{session_id}/quick-response")
def send_quick_response(
    session_id: int = Path(..., description="ID de la sesión"),
    response: dict = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Enviar una respuesta rápida predefinida a una sesión.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    if session.estado != "activa":
        raise HTTPException(status_code=400, detail="No se pueden enviar mensajes a sesiones no activas")
    
    # Plantillas de respuestas rápidas
    quick_responses = {
        "saludo": "¡Hola! ¿En qué puedo ayudarte hoy?",
        "despedida": "Ha sido un placer ayudarte. ¡Que tengas un excelente día!",
        "pausa": "Voy a pausar la sesión por un momento. Volveré pronto.",
        "reanudar": "¡Hola de nuevo! Continuemos con nuestra conversación.",
        "personalizada": response.get("texto", "")
    }
    
    tipo_respuesta = response.get("tipo", "personalizada")
    texto = quick_responses.get(tipo_respuesta, response.get("texto", ""))
    
    nuevo_mensaje = Mensaje(
        usuario_id=current_user.id,
        sesion_id=session_id,
        texto=texto,
        remitente="tutor",
        tipo_mensaje="respuesta_rapida",
        metadatos={
            "tipo_respuesta": tipo_respuesta,
            "enviado_en": datetime.now().isoformat()
        }
    )
    
    db.add(nuevo_mensaje)
    session.mensajes_count += 1
    db.commit()
    db.refresh(nuevo_mensaje)
    
    return {
        "id": nuevo_mensaje.id,
        "texto": nuevo_mensaje.texto,
        "tipo_respuesta": tipo_respuesta
    }


@router.get("/session-templates")
def get_session_templates(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener plantillas de sesión disponibles.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    # Plantillas predefinidas
    templates = [
        {
            "id": 1,
            "nombre": "Sesión de Bienvenida",
            "descripcion": "Plantilla para la primera sesión con un estudiante",
            "mensajes": [
                "¡Hola! Soy tu tutor y estoy aquí para ayudarte.",
                "¿Cómo te sientes hoy?",
                "¿Hay algo específico en lo que te gustaría trabajar?"
            ]
        },
        {
            "id": 2,
            "nombre": "Sesión de Seguimiento",
            "descripcion": "Plantilla para sesiones de seguimiento",
            "mensajes": [
                "¡Hola de nuevo! ¿Cómo ha ido tu semana?",
                "¿Has podido trabajar en lo que conversamos la última vez?",
                "¿Hay algo nuevo que te gustaría abordar?"
            ]
        },
        {
            "id": 3,
            "nombre": "Sesión de Cierre",
            "descripcion": "Plantilla para cerrar sesiones",
            "mensajes": [
                "Hemos cubierto mucho terreno hoy.",
                "¿Te sientes satisfecho con lo que hemos trabajado?",
                "¿Hay algo más que te gustaría agregar antes de terminar?"
            ]
        }
    ]
    
    return templates


@router.post("/sessions/{session_id}/apply-template")
def apply_session_template(
    session_id: int = Path(..., description="ID de la sesión"),
    template: dict = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Aplicar una plantilla de sesión.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    if session.estado != "activa":
        raise HTTPException(status_code=400, detail="No se pueden enviar mensajes a sesiones no activas")
    
    template_id = template.get("template_id")
    mensajes_enviados = []
    
    # Obtener plantilla
    templates = {
        1: ["¡Hola! Soy tu tutor y estoy aquí para ayudarte.", "¿Cómo te sientes hoy?", "¿Hay algo específico en lo que te gustaría trabajar?"],
        2: ["¡Hola de nuevo! ¿Cómo ha ido tu semana?", "¿Has podido trabajar en lo que conversamos la última vez?", "¿Hay algo nuevo que te gustaría abordar?"],
        3: ["Hemos cubierto mucho terreno hoy.", "¿Te sientes satisfecho con lo que hemos trabajado?", "¿Hay algo más que te gustaría agregar antes de terminar?"]
    }
    
    mensajes_plantilla = templates.get(template_id, [])
    
    # Enviar mensajes de la plantilla
    for mensaje in mensajes_plantilla:
        nuevo_mensaje = Mensaje(
            usuario_id=current_user.id,
            sesion_id=session_id,
            texto=mensaje,
            remitente="tutor",
            tipo_mensaje="plantilla",
            metadatos={
                "template_id": template_id,
                "enviado_en": datetime.now().isoformat()
            }
        )
        
        db.add(nuevo_mensaje)
        mensajes_enviados.append({
            "id": nuevo_mensaje.id,
            "texto": nuevo_mensaje.texto
        })
    
    session.mensajes_count += len(mensajes_plantilla)
    db.commit()
    
    return {
        "mensajes_enviados": mensajes_enviados,
        "total_mensajes": len(mensajes_plantilla)
    }


@router.post("/sessions/{session_id}/flag")
def flag_session_for_review(
    session_id: int = Path(..., description="ID de la sesión"),
    flag: dict = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Marcar una sesión para revisión.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    motivo = flag.get("motivo", "")
    
    metadatos = session.metadatos or {}
    metadatos["marcada_para_revision"] = True
    metadatos["motivo_revision"] = motivo
    metadatos["marcada_en"] = datetime.now().isoformat()
    metadatos["tutor_id"] = current_user.id
    session.metadatos = metadatos
    
    db.commit()
    
    return {"message": "Sesión marcada para revisión"}


@router.post("/sessions/{session_id}/escalate")
def escalate_session(
    session_id: int = Path(..., description="ID de la sesión"),
    escalation: dict = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Escalar una sesión a otro tutor o supervisor.
    """
    if current_user.rol != RolUsuario.TUTOR:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo para tutores.")
    
    session = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    tipo_escalacion = escalation.get("tipo", "supervisor")
    motivo = escalation.get("motivo", "")
    
    metadatos = session.metadatos or {}
    metadatos["escalada"] = True
    metadatos["tipo_escalacion"] = tipo_escalacion
    metadatos["motivo_escalacion"] = motivo
    metadatos["escalada_en"] = datetime.now().isoformat()
    metadatos["tutor_original"] = current_user.id
    session.metadatos = metadatos
    
    # Cambiar estado de la sesión
    session.estado = "pausada"
    
    db.commit()
    
    return {"message": f"Sesión escalada a {tipo_escalacion}"}

 