# backend/app/api/routes/analysis.py
"""
Rutas para análisis emocional y comunicativo del texto.
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.analysis import AnalysisResult, AnalysisRequest
from app.schemas.message import MessageCreate
from app.dependencies import get_current_user
from app.db.models import Usuario, Analisis, Mensaje
from sqlalchemy import desc
from app.services.analysis_service import analyze_text, process_complete_analysis, generate_recommendations, generate_summary, perform_deep_analysis

router = APIRouter()


@router.post("/", response_model=AnalysisResult)
def analyze_endpoint(
    message: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Endpoint que analiza un mensaje de texto:
    - Detecta emoción dominante y distribución
    - Detecta estilo dominante y distribución
    - Evalúa prioridad y alerta emocional
    """
    try:
        result = analyze_text(message.texto)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")


@router.post("/complete")
def analyze_complete_endpoint(
    message: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Endpoint para análisis completo del último mensaje:
    - Análisis emocional y de estilo detallado
    - Recomendaciones personalizadas
    - Resumen ejecutivo
    - Evaluación de riesgo
    """
    try:
        complete_analysis = process_complete_analysis(db, getattr(current_user, 'id'), message.texto)
        return complete_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis completo: {str(e)}")


@router.get("/last")
def get_last_analysis(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Endpoint para obtener el último análisis realizado por el usuario actual.
    Retorna el análisis completo con recomendaciones y resumen.
    """
    try:
        # Buscar el último mensaje del usuario que tenga un análisis asociado
        last_message_with_analysis = db.query(Mensaje).join(Analisis).filter(
            Mensaje.usuario_id == getattr(current_user, 'id'),
            Mensaje.remitente == "user"  # Solo mensajes del usuario, no del bot
        ).order_by(desc(Mensaje.creado_en)).first()
        
        if not last_message_with_analysis:
            raise HTTPException(status_code=404, detail="No se encontraron análisis previos del usuario")
        
        # Obtener el análisis asociado
        last_analysis = last_message_with_analysis.analisis
        
        if not last_analysis:
            raise HTTPException(status_code=404, detail="No se encontró análisis para el último mensaje")
        
        # Reconstruir el análisis completo
        basic_analysis = {
            "emotion": last_analysis.emocion,
            "emotion_score": last_analysis.emocion_score,
            "style": last_analysis.estilo,
            "style_score": last_analysis.estilo_score,
            "priority": last_analysis.prioridad,
            "alert": last_analysis.alerta,
            "alert_reason": last_analysis.razon_alerta,
            "emotion_distribution": json.loads(last_analysis.distribucion_emociones) if last_analysis.distribucion_emociones else [],
            "style_distribution": json.loads(last_analysis.distribucion_estilos) if last_analysis.distribucion_estilos else [],
            "text": last_message_with_analysis.texto  # <-- Aseguramos que el texto del mensaje esté presente
        }
        
        # Generar recomendaciones
        recommendations = generate_recommendations(
            basic_analysis["emotion"],
            basic_analysis["emotion_score"],
            basic_analysis["style"],
            basic_analysis["style_score"],
            basic_analysis["priority"]
        )
        
        # Generar resumen
        summary = generate_summary(basic_analysis)
        
        # Análisis completo
        complete_analysis = {
            **basic_analysis,
            "recommendations": recommendations,
            "summary": summary,
            "detailed_insights": {
                "emotional_state": f"El usuario muestra un estado emocional de {basic_analysis['emotion']} con una intensidad del {basic_analysis['emotion_score']:.1f}%",
                "communication_style": f"Su estilo de comunicación es {basic_analysis['style']} con una confianza del {basic_analysis['style_score']:.1f}%",
                "risk_assessment": f"Nivel de prioridad: {basic_analysis['priority']}",
                "alert_status": "Requiere atención inmediata" if basic_analysis['alert'] else "Estado normal"
            },
            "message_text": last_message_with_analysis.texto,
            "analysis_date": last_analysis.creado_en.isoformat()
        }
        
        return complete_analysis
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el último análisis: {str(e)}")


@router.get("/history")
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    limit: int = 10
):
    """
    Endpoint para obtener el historial de análisis del usuario actual.
    """
    try:
        # Buscar los últimos análisis del usuario (solo mensajes del usuario, no del bot)
        analyses = db.query(Analisis).join(Mensaje).filter(
            Mensaje.usuario_id == getattr(current_user, 'id'),
            Mensaje.remitente == "user"  # Solo mensajes del usuario
        ).order_by(desc(Analisis.creado_en)).limit(limit).all()
        
        history = []
        for analysis in analyses:
            history.append({
                "id": analysis.id,
                "emotion": analysis.emocion,
                "emotion_score": analysis.emocion_score,
                "style": analysis.estilo,
                "style_score": analysis.estilo_score,
                "priority": analysis.prioridad,
                "alert": analysis.alerta,
                "created_at": analysis.creado_en.isoformat(),
                "message_text": analysis.mensaje.texto[:100] + "..." if len(analysis.mensaje.texto) > 100 else analysis.mensaje.texto
            })
        
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el historial: {str(e)}")


@router.get("/deep")
def deep_analysis(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Endpoint para análisis profundo de los últimos 10 mensajes del usuario.
    - Limpieza completa de texto
    - Análisis individual y promedio
    - Datos para gráficos (radar, barras, tabla)
    """
    try:
        result = perform_deep_analysis(db, getattr(current_user, 'id'))
        
        # Si no hay mensajes para analizar, devolver 404
        if "status_code" in result and result["status_code"] == 404:
            raise HTTPException(status_code=404, detail=result["message"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis profundo: {str(e)}")
