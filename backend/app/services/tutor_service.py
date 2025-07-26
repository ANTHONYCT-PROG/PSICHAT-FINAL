# backend/app/services/tutor_service.py
"""
Servicios para el panel del tutor - Lógica de negocio robusta.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, desc, case
from app.db.models import Usuario, SesionChat, Mensaje, Analisis, Alerta, Notificacion, Intervencion
from app.schemas.tutor import (
    TutorDashboardResponse, 
    DashboardStats, 
    RecentSession, 
    RecentAlert,
    SessionStatsResponse,
    InterventionCreate,
    InterventionResponse
)
from datetime import datetime, timedelta
from typing import Dict, List, Any
import json


def get_tutor_dashboard_data(db: Session, tutor_id: int) -> TutorDashboardResponse:
    """
    Obtiene datos completos para el dashboard del tutor.
    """
    # Estadísticas generales
    hoy = datetime.now().date()
    
    # Sesiones activas
    sesiones_activas = db.query(SesionChat).filter(
        SesionChat.tutor_id == tutor_id,
        SesionChat.estado == "activa"
    ).count()
    
    # Sesiones de hoy
    sesiones_hoy = db.query(SesionChat).filter(
        SesionChat.tutor_id == tutor_id,
        func.date(SesionChat.iniciada_en) == hoy
    ).count()
    
    # Alertas pendientes
    alertas_pendientes = db.query(Alerta).filter(
        Alerta.tutor_asignado == tutor_id,
        Alerta.revisada == False
    ).count()
    
    # Estudiantes activos (con sesiones en los últimos 7 días)
    fecha_limite = datetime.now() - timedelta(days=7)
    estudiantes_activos = db.query(SesionChat.usuario_id).filter(
        SesionChat.tutor_id == tutor_id,
        SesionChat.iniciada_en >= fecha_limite
    ).distinct().count()
    
    # Mensajes de hoy
    mensajes_hoy = db.query(Mensaje).join(SesionChat).filter(
        SesionChat.tutor_id == tutor_id,
        func.date(Mensaje.creado_en) == hoy
    ).count()
    
    # Intervenciones de hoy
    intervenciones_hoy = db.query(Intervencion).filter(
        Intervencion.tutor_id == tutor_id,
        func.date(Intervencion.creado_en) == hoy
    ).count()
    
    stats = DashboardStats(
        sesiones_activas=sesiones_activas,
        sesiones_hoy=sesiones_hoy,
        alertas_pendientes=alertas_pendientes,
        estudiantes_activos=estudiantes_activos,
        mensajes_hoy=mensajes_hoy,
        intervenciones_hoy=intervenciones_hoy
    )
    
    # Sesiones recientes (últimas 5)
    sesiones_recientes = db.query(SesionChat).options(
        joinedload(SesionChat.usuario)
    ).filter(
        SesionChat.tutor_id == tutor_id
    ).order_by(desc(SesionChat.iniciada_en)).limit(5).all()
    
    recent_sessions = []
    for sesion in sesiones_recientes:
        # Obtener último mensaje
        ultimo_mensaje = db.query(Mensaje).filter(
            Mensaje.sesion_id == sesion.id
        ).order_by(desc(Mensaje.creado_en)).first()
        
        recent_sessions.append(RecentSession(
            id=sesion.id,
            estudiante_nombre=f"{sesion.usuario.nombre} {sesion.usuario.apellido or ''}",
            estudiante_email=sesion.usuario.email,
            estado=sesion.estado,
            mensajes_count=sesion.mensajes_count,
            iniciada_en=sesion.iniciada_en,
            ultimo_mensaje=ultimo_mensaje.creado_en if ultimo_mensaje else None
        ))
    
    # Alertas recientes (últimas 5)
    alertas_recientes = db.query(Alerta).options(
        joinedload(Alerta.usuario)
    ).filter(
        Alerta.tutor_asignado == tutor_id
    ).order_by(desc(Alerta.creado_en)).limit(5).all()
    
    recent_alerts = []
    for alerta in alertas_recientes:
        recent_alerts.append(RecentAlert(
            id=alerta.id,
            estudiante_nombre=f"{alerta.usuario.nombre} {alerta.usuario.apellido or ''}",
            tipo_alerta=alerta.tipo_alerta,
            nivel_urgencia=alerta.nivel_urgencia,
            descripcion=alerta.descripcion,
            creado_en=alerta.creado_en,
            revisada=alerta.revisada
        ))
    
    # Notificaciones no leídas
    notificaciones_no_leidas = db.query(Notificacion).filter(
        Notificacion.usuario_id == tutor_id,
        Notificacion.leida == False
    ).count()
    
    return TutorDashboardResponse(
        stats=stats,
        sesiones_recientes=recent_sessions,
        alertas_recientes=recent_alerts,
        notificaciones_no_leidas=notificaciones_no_leidas
    )


def get_session_analytics(db: Session, session_id: int, tutor_id: int) -> SessionStatsResponse:
    """
    Obtiene análisis detallado de una sesión específica.
    """
    # Verificar que la sesión pertenece al tutor
    sesion = db.query(SesionChat).filter(
        SesionChat.id == session_id,
        SesionChat.tutor_id == tutor_id
    ).first()
    
    if not sesion:
        raise ValueError("Sesión no encontrada o no autorizada")
    
    # Obtener todos los mensajes de la sesión con análisis
    mensajes = db.query(Mensaje).options(
        joinedload(Mensaje.analisis)
    ).filter(Mensaje.sesion_id == session_id).all()
    
    # Estadísticas básicas
    total_mensajes = len(mensajes)
    mensajes_estudiante = len([m for m in mensajes if m.remitente == "user"])
    mensajes_tutor = len([m for m in mensajes if m.remitente == "tutor"])
    
    # Análisis de emociones
    emociones_detectadas = {}
    estilos_comunicacion = {}
    prioridades = {}
    alertas_generadas = 0
    recomendaciones = []
    
    for mensaje in mensajes:
        if mensaje.analisis:
            # Emociones
            if mensaje.analisis.emocion:
                emociones_detectadas[mensaje.analisis.emocion] = \
                    emociones_detectadas.get(mensaje.analisis.emocion, 0) + 1
            
            # Estilos
            if mensaje.analisis.estilo:
                estilos_comunicacion[mensaje.analisis.estilo] = \
                    estilos_comunicacion.get(mensaje.analisis.estilo, 0) + 1
            
            # Prioridades
            if mensaje.analisis.prioridad:
                prioridades[mensaje.analisis.prioridad] = \
                    prioridades.get(mensaje.analisis.prioridad, 0) + 1
            
            # Alertas
            if mensaje.analisis.alerta:
                alertas_generadas += 1
            
            # Recomendaciones
            if mensaje.analisis.recomendaciones:
                if isinstance(mensaje.analisis.recomendaciones, list):
                    recomendaciones.extend(mensaje.analisis.recomendaciones)
                elif isinstance(mensaje.analisis.recomendaciones, dict):
                    for rec in mensaje.analisis.recomendaciones.values():
                        if isinstance(rec, str):
                            recomendaciones.append(rec)
    
    # Insights adicionales
    insights = {
        "emocion_dominante": max(emociones_detectadas.items(), key=lambda x: x[1])[0] if emociones_detectadas else None,
        "estilo_dominante": max(estilos_comunicacion.items(), key=lambda x: x[1])[0] if estilos_comunicacion else None,
        "prioridad_maxima": max(prioridades.items(), key=lambda x: x[1])[0] if prioridades else None,
        "tasa_alertas": (alertas_generadas / total_mensajes * 100) if total_mensajes > 0 else 0,
        "promedio_mensajes_por_hora": calcular_promedio_mensajes_por_hora(mensajes),
        "patrones_temporales": analizar_patrones_temporales(mensajes)
    }
    
    return SessionStatsResponse(
        sesion_id=session_id,
        total_mensajes=total_mensajes,
        mensajes_estudiante=mensajes_estudiante,
        mensajes_tutor=mensajes_tutor,
        duracion_total=sesion.duracion_total,
        emociones_detectadas=emociones_detectadas,
        estilos_comunicacion=estilos_comunicacion,
        alertas_generadas=alertas_generadas,
        prioridades=prioridades,
        recomendaciones=list(set(recomendaciones))[:10],  # Máximo 10 recomendaciones únicas
        insights=insights
    )


def generate_session_report(session_id: int, db: Session) -> Dict[str, Any]:
    """
    Genera un reporte completo de una sesión.
    """
    sesion = db.query(SesionChat).options(
        joinedload(SesionChat.usuario),
        joinedload(SesionChat.mensajes).joinedload(Mensaje.analisis)
    ).filter(SesionChat.id == session_id).first()
    
    if not sesion:
        raise ValueError("Sesión no encontrada")
    
    # Obtener estadísticas
    stats = get_session_analytics(db, session_id, sesion.tutor_id)
    
    # Generar reporte
    reporte = {
        "sesion_id": session_id,
        "estudiante": {
            "id": sesion.usuario.id,
            "nombre": f"{sesion.usuario.nombre} {sesion.usuario.apellido or ''}",
            "email": sesion.usuario.email,
            "institucion": sesion.usuario.institucion,
            "grado_academico": sesion.usuario.grado_academico
        },
        "fechas": {
            "inicio": sesion.iniciada_en.isoformat(),
            "fin": sesion.finalizada_en.isoformat() if sesion.finalizada_en else None,
            "duracion_minutos": (sesion.duracion_total // 60) if sesion.duracion_total else None
        },
        "estadisticas": {
            "total_mensajes": stats.total_mensajes,
            "mensajes_estudiante": stats.mensajes_estudiante,
            "mensajes_tutor": stats.mensajes_tutor,
            "alertas_generadas": stats.alertas_generadas,
            "tasa_alertas": stats.insights["tasa_alertas"]
        },
        "analisis_emocional": {
            "emociones_detectadas": stats.emociones_detectadas,
            "emocion_dominante": stats.insights["emocion_dominante"],
            "distribucion_emociones": calcular_distribucion_porcentual(stats.emociones_detectadas)
        },
        "analisis_estilo": {
            "estilos_detectados": stats.estilos_comunicacion,
            "estilo_dominante": stats.insights["estilo_dominante"],
            "distribucion_estilos": calcular_distribucion_porcentual(stats.estilos_comunicacion)
        },
        "prioridades": {
            "distribucion": stats.prioridades,
            "prioridad_maxima": stats.insights["prioridad_maxima"]
        },
        "recomendaciones": stats.recomendaciones,
        "insights": stats.insights,
        "metadatos": sesion.metadatos or {}
    }
    
    # Guardar reporte en metadatos de la sesión
    metadatos = sesion.metadatos or {}
    metadatos["reporte"] = reporte
    sesion.metadatos = metadatos
    db.commit()
    
    return reporte


def create_intervention(db: Session, intervention_data: InterventionCreate, tutor_id: int) -> InterventionResponse:
    """
    Crea una nueva intervención.
    """
    # Verificar que el estudiante existe
    estudiante = db.query(Usuario).filter(
        Usuario.id == intervention_data.usuario_id,
        Usuario.rol == "estudiante"
    ).first()
    
    if not estudiante:
        raise ValueError("Estudiante no encontrado")
    
    # Crear la intervención
    intervencion = Intervencion(
        usuario_id=intervention_data.usuario_id,
        tutor_id=tutor_id,
        alerta_id=intervention_data.alerta_id,
        sesion_id=intervention_data.sesion_id,
        tipo_intervencion=intervention_data.tipo_intervencion,
        mensaje=intervention_data.mensaje,
        metodo=intervention_data.metodo,
        metadatos=intervention_data.metadatos,
        enviada=True,
        enviada_en=func.now()
    )
    
    db.add(intervencion)
    db.commit()
    db.refresh(intervencion)
    
    # Crear notificación para el estudiante
    notificacion = Notificacion(
        usuario_id=intervention_data.usuario_id,
        titulo="Nueva intervención del tutor",
        mensaje=f"El tutor ha realizado una intervención: {intervention_data.mensaje[:100]}...",
        tipo="intervencion",
        metadatos={
            "intervencion_id": intervencion.id,
            "tipo": intervention_data.tipo_intervencion,
            "metodo": intervention_data.metodo
        }
    )
    db.add(notificacion)
    db.commit()
    
    return InterventionResponse(
        id=intervencion.id,
        usuario_id=intervencion.usuario_id,
        estudiante_nombre=f"{estudiante.nombre} {estudiante.apellido or ''}",
        alerta_id=intervencion.alerta_id,
        sesion_id=intervencion.sesion_id,
        tipo_intervencion=intervencion.tipo_intervencion,
        mensaje=intervencion.mensaje,
        metodo=intervencion.metodo,
        enviada=intervencion.enviada,
        recibida=intervencion.recibida,
        efectiva=intervencion.efectiva,
        creado_en=intervencion.creado_en,
        enviada_en=intervencion.enviada_en,
        recibida_en=intervencion.recibida_en,
        metadatos=intervencion.metadatos
    )


# Funciones auxiliares
def calcular_promedio_mensajes_por_hora(mensajes: List[Mensaje]) -> float:
    """Calcula el promedio de mensajes por hora en la sesión."""
    if not mensajes:
        return 0.0
    
    if len(mensajes) < 2:
        return 1.0
    
    tiempo_total = (mensajes[-1].creado_en - mensajes[0].creado_en).total_seconds() / 3600
    return len(mensajes) / tiempo_total if tiempo_total > 0 else 0.0


def analizar_patrones_temporales(mensajes: List[Mensaje]) -> Dict[str, Any]:
    """Analiza patrones temporales en los mensajes."""
    if not mensajes:
        return {}
    
    # Agrupar mensajes por hora del día
    mensajes_por_hora = {}
    for mensaje in mensajes:
        hora = mensaje.creado_en.hour
        mensajes_por_hora[hora] = mensajes_por_hora.get(hora, 0) + 1
    
    # Encontrar horas pico
    hora_pico = max(mensajes_por_hora.items(), key=lambda x: x[1])[0] if mensajes_por_hora else None
    
    return {
        "mensajes_por_hora": mensajes_por_hora,
        "hora_pico": hora_pico,
        "total_horas_activas": len(mensajes_por_hora)
    }


def calcular_distribucion_porcentual(dict_data: Dict[str, int]) -> Dict[str, float]:
    """Calcula la distribución porcentual de un diccionario de conteos."""
    total = sum(dict_data.values())
    if total == 0:
        return {}
    
    return {k: (v / total * 100) for k, v in dict_data.items()}
