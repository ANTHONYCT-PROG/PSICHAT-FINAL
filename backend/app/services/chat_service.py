# backend/app/services/chat_service.py

from typing import Optional, Dict, Any, List
from datetime import datetime
import requests
import traceback
from sqlalchemy.orm import Session

from app.services.analysis_service import analyze_text
from app.db import crud
from app.schemas.message import MessageCreate
from app.schemas.analysis_record import AnalysisCreate, AnalysisRecord

from app.core.config import settings

def generate_bot_reply(user_text: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Genera una respuesta empática con análisis emocional y contexto del historial usando Gemini.
    """
    # --- 1. Preparar historial ---
    history = user_context.get("history", []) if user_context else []
    # Cambiado: ahora history es una lista de objetos {user, bot}
    history_texts = [msg["user"] for msg in history[-3:] if "user" in msg]

    # --- 2. Análisis emocional y de estilo con historial ---
    analysis = analyze_text(user_text, history=history_texts)

    # --- 3. Construir prompt personalizado ---
    system_prompt = (
        "Eres EmotiProfe, un tutor emocional para estudiantes. "
        "Tu objetivo es brindar respuestas empáticas, útiles y breves. "
        f"Actualmente, el usuario muestra la emoción '{analysis['emotion']}' con intensidad {analysis['emotion_score']}%, "
        f"y estilo '{analysis['style']}' ({analysis['style_score']}%).\n"
        "También se ha detectado un posible patrón de riesgo acumulado." if analysis.get("context_alert")
        else "Responde siempre en español, con amabilidad, comprensión y brevedad."
    )

    # --- 4. Generar respuesta con Gemini ---
    try:
        bot_reply = generate_gemini_response(user_text, history, system_prompt)
        provider_name = f"Gemini ({settings.GEMINI_MODEL})"
    except Exception as e:
        # Fallback a respuesta mock en caso de error
        bot_reply = generate_mock_response(user_text, analysis)
        provider_name = "Mock AI (fallback)"

    # --- 5. Preparar metadatos ---
    meta = {
        "timestamp": datetime.utcnow(),
        "detected_emotion": analysis["emotion"],
        "emotion_score": round(analysis["emotion_score"], 2),
        "detected_style": analysis["style"],
        "style_score": round(analysis["style_score"], 2),
        "priority": analysis["priority"],
        "alert": analysis["alert"],
        "alert_reason": analysis["alert_reason"],
        "context_alert": analysis.get("context_alert", False),
        "context_risk_level": analysis.get("context_risk_level", "normal"),
        "info": f"Generado con {provider_name} + análisis emocional"
    }

    # --- 6. Preparar historial actualizado ---
    updated_history = []
    for msg in history:
        if isinstance(msg, dict) and "role" in msg and "content" in msg:
            updated_history.append(msg)
        elif isinstance(msg, dict) and "user" in msg and "bot" in msg:
            updated_history.append({"role": "user", "content": msg["user"]})
            updated_history.append({"role": "assistant", "content": msg["bot"]})
        elif isinstance(msg, (list, tuple)) and len(msg) == 2:
            updated_history.append({"role": "user", "content": msg[0]})
            updated_history.append({"role": "assistant", "content": msg[1]})
        else:
            # Si es un dict con solo 'user', lo convertimos
            if isinstance(msg, dict) and "user" in msg:
                updated_history.append({"role": "user", "content": msg["user"]})
            if isinstance(msg, dict) and "bot" in msg:
                updated_history.append({"role": "assistant", "content": msg["bot"]})
    updated_history.append({"role": "user", "content": user_text})
    updated_history.append({"role": "assistant", "content": bot_reply})

    return {
        "reply": bot_reply,
        "meta": meta,
        "history": updated_history
    }

def generate_mock_response(user_text: str, analysis: Dict[str, Any]) -> str:
    """Genera una respuesta simulada para testing o fallback."""
    emotion = analysis.get("emotion", "neutral")
    responses = {
        "tristeza": [
            "Entiendo que te sientes triste. Es completamente normal tener estos momentos. ¿Te gustaría hablar más sobre lo que te está pasando?",
            "Veo que estás pasando por un momento difícil. Estoy aquí para escucharte y apoyarte. ¿Qué te está causando esta tristeza?"
        ],
        "ansiedad": [
            "Veo que estás sintiendo ansiedad. Respira profundo, estás a salvo aquí. ¿Qué te está preocupando?",
            "La ansiedad puede ser muy abrumadora. Intenta tomar respiraciones profundas y recuerda que estoy aquí para ayudarte."
        ],
        "frustración": [
            "La frustración puede ser muy difícil de manejar. ¿Qué te está frustrando específicamente?",
            "Entiendo tu frustración. A veces las cosas no salen como esperamos. ¿Quieres que exploremos juntos una solución?"
        ],
        "alegría": [
            "¡Me alegra ver que estás de buen humor! ¿Qué te está haciendo sentir así?",
            "Es maravilloso ver tu alegría. ¡Que bueno que estés teniendo un buen día!"
        ]
    }
    import random
    if emotion in responses:
        return random.choice(responses[emotion])
    else:
        return "Respuesta simulada del bot."

def generate_gemini_response(user_text: str, history: List, system_prompt: str) -> str:
    """Genera respuesta usando Gemini."""
    try:
        # Construir el contexto completo para Gemini
        full_prompt = system_prompt + "\n\n"
        
        # Agregar historial de conversación
        for user_msg, bot_msg in history[-3:]:  # Últimos 3 intercambios
            full_prompt += f"Usuario: {user_msg}\n"
            full_prompt += f"Asistente: {bot_msg}\n\n"
        
        # Agregar el mensaje actual
        full_prompt += f"Usuario: {user_text}\n"
        full_prompt += "Asistente: "

        # Preparar payload para Gemini
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": full_prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }

        # Realizar petición a Gemini
        headers = {
            "Content-Type": "application/json",
        }
        
        # Construir URL con API key
        url = f"{settings.GEMINI_API_BASE_URL}?key={settings.GEMINI_API_KEY}"
        
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if "candidates" in data and len(data["candidates"]) > 0:
                content = data["candidates"][0]["content"]["parts"][0]["text"]
                return content.strip()
            else:
                return "Lo siento, no pude generar una respuesta en este momento."
        else:
            error_msg = f"Error en Gemini API: {response.status_code}"
            if response.text:
                error_msg += f" - {response.text}"
            raise Exception(error_msg)
            
    except Exception as e:
        raise Exception(f"Error al conectar con Gemini: {str(e)}")

def save_chat_and_analysis(
    db: Session,
    user_id: int,
    user_text: str,
    bot_reply: str,
    meta: Dict[str, Any]
):
    """
    Guarda el mensaje del usuario, la respuesta del bot y el análisis en la base de datos.
    """
    try:
        # Obtener o crear sesión activa para el usuario
        from app.db.models import SesionChat
        session = db.query(SesionChat).filter(
            SesionChat.usuario_id == user_id,
            SesionChat.estado == "activa",
            SesionChat.tutor_id.is_(None)  # Solo sesiones sin tutor (chat con bot)
        ).first()
        
        if not session:
            # Crear nueva sesión si no existe
            session = SesionChat(
                usuario_id=user_id,
                estado="activa",
                mensajes_count=0,
                iniciada_en=datetime.utcnow()
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Crear mensaje del usuario
        user_message = MessageCreate(
            usuario_id=user_id,
            sesion_id=session.id,
            texto=user_text,
            tipo_mensaje="texto",
            remitente="user"
        )
        user_msg_db = crud.create_message(db, user_message)
        
        # Crear mensaje del bot
        bot_message = MessageCreate(
            usuario_id=user_id,
            sesion_id=session.id,
            texto=bot_reply,
            tipo_mensaje="texto",
            remitente="bot"
        )
        bot_msg_db = crud.create_message(db, bot_message)
        
        # Actualizar contador de mensajes en la sesión
        session.mensajes_count += 2
        db.commit()
        
        # Crear el análisis asociado al mensaje del usuario
        from app.db.models import Analisis
        import json
        
        # Obtener el análisis completo del texto
        complete_analysis = analyze_text(user_text)
        
        # Generar recomendaciones y resumen
        from app.services.analysis_service import generate_recommendations, generate_summary
        recommendations = generate_recommendations(
            complete_analysis["emotion"],
            complete_analysis["emotion_score"],
            complete_analysis["style"],
            complete_analysis["style_score"],
            complete_analysis["priority"]
        )
        
        summary = generate_summary(complete_analysis)
        
        # Crear insights detallados
        detailed_insights = {
            "emotional_state": f"El usuario muestra un estado emocional de {complete_analysis['emotion']} con una intensidad del {complete_analysis['emotion_score']:.1f}%",
            "communication_style": f"Su estilo de comunicación es {complete_analysis['style']} con una confianza del {complete_analysis['style_score']:.1f}%",
            "risk_assessment": f"Nivel de prioridad: {complete_analysis['priority']}",
            "alert_status": "Requiere atención inmediata" if complete_analysis['alert'] else "Estado normal",
            "context_analysis": f"Análisis de contexto: {complete_analysis.get('context_risk_level', 'normal')}"
        }
        
        db_analysis = Analisis(
            usuario_id=user_id,
            mensaje_id=user_msg_db.id,
            emocion=meta["detected_emotion"],
            emocion_score=meta["emotion_score"],
            distribucion_emociones=json.dumps(complete_analysis.get("emotion_distribution", [])),
            estilo=meta["detected_style"],
            estilo_score=meta["style_score"],
            distribucion_estilos=json.dumps(complete_analysis.get("style_distribution", [])),
            prioridad=meta["priority"],
            alerta=meta["alert"],
            razon_alerta=meta["alert_reason"],
            recomendaciones=json.dumps(recommendations),
            resumen=json.dumps(summary),
            insights_detallados=json.dumps(detailed_insights),
            modelo_utilizado="emotion_style_analysis_v2",
            confianza_analisis=0.85,
            tiempo_procesamiento=0.5
        )
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        return {
            "user_message_id": user_msg_db.id,
            "bot_message_id": bot_msg_db.id,
            "analysis_id": db_analysis.id,
            "session_id": session.id
        }
        
    except Exception as e:
        # Log del error pero no fallar la operación
        print(f"Error al guardar chat y análisis: {str(e)}")
        traceback.print_exc()
        return None

def generate_report_for_session(session_id: int, db: Session):
    """
    Analiza todos los mensajes de la sesión y guarda un reporte en metadatos de la sesión.
    """
    from app.db.models import SesionChat, Mensaje
    session = db.query(SesionChat).filter(SesionChat.id == session_id).first()
    if not session:
        raise Exception("Sesión no encontrada")
    mensajes = db.query(Mensaje).filter(Mensaje.sesion_id == session_id).order_by(Mensaje.creado_en.asc()).all()
    textos = [m.texto for m in mensajes]
    if not textos:
        resumen = "No hay mensajes en la sesión."
    else:
        # Usa el análisis existente para generar un resumen global
        resumen = analyze_text("\n".join(textos))
    # Guardar el reporte en metadatos
    session.metadatos = session.metadatos or {}
    session.metadatos["reporte"] = {
        "resumen": resumen,
        "total_mensajes": len(mensajes),
        "fecha_generado": datetime.utcnow().isoformat()
    }
    db.commit()
    return session.metadatos["reporte"]

def create_notification(db: Session, usuario_id: int, titulo: str, mensaje: str, tipo: str = "sistema", metadatos: dict = None):
    from app.db.models import Notificacion
    noti = Notificacion(
        usuario_id=usuario_id,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        metadatos=metadatos or {},
        enviada=True
    )
    db.add(noti)
    db.commit()
    return noti

def notify_intervention(db: Session, intervencion):
    # Notificar al estudiante y al tutor sobre la intervención
    create_notification(
        db,
        usuario_id=intervencion.usuario_id,
        titulo="Nueva intervención del tutor",
        mensaje=f"El tutor ha realizado una intervención: {intervencion.mensaje[:50]}...",
        tipo="intervencion",
        metadatos={"intervencion_id": intervencion.id}
    )
    create_notification(
        db,
        usuario_id=intervencion.tutor_id,
        titulo="Intervención registrada",
        mensaje=f"Has realizado una intervención para el estudiante {intervencion.usuario_id}.",
        tipo="intervencion",
        metadatos={"intervencion_id": intervencion.id}
    )

def notify_alert(db: Session, alerta):
    # Notificar al tutor asignado y al estudiante sobre la alerta
    if alerta.tutor_asignado:
        create_notification(
            db,
            usuario_id=alerta.tutor_asignado,
            titulo="Nueva alerta emocional",
            mensaje=f"Se ha generado una alerta para el estudiante {alerta.usuario_id}.",
            tipo="alerta",
            metadatos={"alerta_id": alerta.id}
        )
    create_notification(
        db,
        usuario_id=alerta.usuario_id,
        titulo="Alerta generada",
        mensaje="Se ha generado una alerta emocional en tu sesión.",
        tipo="alerta",
        metadatos={"alerta_id": alerta.id}
    )

if __name__ == "__main__":
    # Mensaje actual del usuario
    user_text = "No entiendo nada, estoy muy frustrado y quiero rendirme."

    # Historial de interacciones previas (solo textos del usuario y respuestas del bot)
    history = [
        {"user": "Estoy cansado de no avanzar con mis tareas.", "bot": "Entiendo cómo te sientes. ¿Quieres que revisemos juntas la tarea?"},
        {"user": "No tengo motivación para seguir hoy.", "bot": "Es válido sentirse así a veces. ¿Quieres que intentemos algo paso a paso?"}
    ]

    user_context = {"history": history}

    # Llamar al chatbot con contexto
    result = generate_bot_reply(user_text, user_context)

    # Mostrar resultados
    print("=== Respuesta del chatbot ===")
    print("BOT:", result["reply"])
    print("\n=== Análisis emocional ===")
    for k, v in result["meta"].items():
        print(f"{k}: {v}")