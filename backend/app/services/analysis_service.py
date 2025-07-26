from typing import List, Dict, Any, Optional
from app.models.emotion import predict_emotion, predict_all_emotions
from app.models.style import predict_style, predict_all_styles
from app.notifications.alerts import check_combined_alert
import json
import re
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models import Usuario, Analisis, Mensaje
from app.schemas.message import MessageCreate


def analyze_emotion(text: str) -> dict:
    dominant_emotion, score = predict_emotion(text)
    all_emotions = predict_all_emotions(text)
    
    return {
        "emotion": dominant_emotion,
        "emotion_score": score,
        "emotion_distribution": all_emotions
    }


def analyze_style(text: str) -> dict:
    dominant_style, score = predict_style(text)
    all_styles = predict_all_styles(text)
    
    return {
        "style": dominant_style,
        "style_score": score,
        "style_distribution": all_styles
    }


def evaluate_priority(emotion: str, emotion_score: float, style: str, style_score: float = 0.0, context_risk: str = "normal") -> str:
    """
    Evalúa la prioridad de atención basada en múltiples criterios:
    - Intensidad de emociones negativas
    - Estilos comunicativos de riesgo
    - Combinación de factores
    - Contexto de riesgo acumulativo
    
    Returns:
        str: "crítica", "alta", "media", "baja", "normal"
    """
    # Definir emociones de alto riesgo con sus umbrales específicos
    high_risk_emotions = {
        "frustración": 75,
        "tristeza": 80,
        "ansiedad": 70,
        "desánimo": 75,
        "ira": 70,
        "desesperación": 60,
        "soledad": 75
    }
    
    # Definir emociones de riesgo medio
    medium_risk_emotions = {
        "preocupación": 65,
        "confusión": 60,
        "inseguridad": 70,
        "nostalgia": 75
    }
    
    # Definir estilos de alto riesgo
    high_risk_styles = {
        "evasivo": 65,
        "pasivo-agresivo": 60,
        "agresivo": 55,
        "defensivo": 70
    }
    
    # Definir estilos de riesgo medio
    medium_risk_styles = {
        "formal": 80,
        "distante": 70,
        "sarcástico": 65
    }
    
    # Calcular puntuación de riesgo emocional
    emotion_risk_score = 0
    style_risk_score = 0
    if emotion.lower() in high_risk_emotions:
        if emotion_score >= high_risk_emotions[emotion.lower()]:
            emotion_risk_score = 3  # Alto riesgo
        elif emotion_score >= high_risk_emotions[emotion.lower()] - 10:
            emotion_risk_score = 2  # Riesgo medio-alto
    elif emotion.lower() in medium_risk_emotions:
        if emotion_score >= medium_risk_emotions[emotion.lower()]:
            emotion_risk_score = 2  # Riesgo medio
        elif emotion_score >= medium_risk_emotions[emotion.lower()] - 15:
            emotion_risk_score = 1  # Riesgo bajo-medio
    
    # Calcular puntuación de riesgo de estilo
    if style.lower() in high_risk_styles:
        if style_score >= high_risk_styles[style.lower()]:
            style_risk_score = 3  # Alto riesgo
        elif style_score >= high_risk_styles[style.lower()] - 10:
            style_risk_score = 2  # Riesgo medio-alto
    elif style.lower() in medium_risk_styles:
        if style_score >= medium_risk_styles[style.lower()]:
            style_risk_score = 2  # Riesgo medio
        elif style_score >= medium_risk_styles[style.lower()]:
            style_risk_score = 1  # Riesgo bajo-medio
    
    # Calcular puntuación total de riesgo
    total_risk_score = emotion_risk_score + style_risk_score
    
    # Ajustar por contexto de riesgo acumulativo
    if context_risk == "alto":
        total_risk_score += 1
    elif context_risk == "medio":
        total_risk_score += 0.5
    
    # Casos especiales que elevan la prioridad
    special_cases = {
        "frustración": emotion_score >= 90,  # Frustración extrema
        "tristeza": emotion_score >= 95,     # Tristeza profunda
        "ansiedad": emotion_score >= 85,     # Ansiedad severa
        "desánimo": emotion_score >= 90,     # Desánimo profundo
    }
    
    # Verificar casos especiales
    for emotion_type, condition in special_cases.items():
        if emotion.lower() == emotion_type and condition:
            total_risk_score = max(total_risk_score, 4)  # Forzar prioridad crítica
    
    # Determinar prioridad final
    if total_risk_score >= 4:
        return "crítica"
    elif total_risk_score >= 3:
        return "alta"
    elif total_risk_score >= 2:
        return "media"
    elif total_risk_score >= 1:
        return "baja"
    else:
        return "normal"


def generate_recommendations(emotion: str, emotion_score: float, style: str, style_score: float, priority: str) -> Dict[str, List[str]]:
    """
    Genera recomendaciones personalizadas basadas en el análisis emocional y de estilo.
    """
    recommendations = {
        "immediate_actions": [],
        "emotional_support": [],
        "communication_tips": [],
        "long_term_suggestions": []
    }
    
    # Recomendaciones basadas en emoción
    if emotion == "tristeza":
        recommendations["immediate_actions"].append("Ofrecer empatía y validación emocional")
        recommendations["emotional_support"].append("Sugerir actividades que generen bienestar")
        recommendations["long_term_suggestions"].append("Considerar apoyo profesional si persiste")
    elif emotion == "ansiedad":
        recommendations["immediate_actions"].append("Ayudar con técnicas de respiración")
        recommendations["emotional_support"].append("Enfocarse en el momento presente")
        recommendations["communication_tips"].append("Usar un tono calmado y tranquilizador")
    elif emotion == "frustración":
        recommendations["immediate_actions"].append("Validar la frustración sin minimizarla")
        recommendations["emotional_support"].append("Ayudar a identificar soluciones")
        recommendations["communication_tips"].append("Mantener un enfoque constructivo")
    elif emotion == "alegría":
        recommendations["immediate_actions"].append("Celebrar y reforzar el estado positivo")
        recommendations["emotional_support"].append("Aprovechar el momento para establecer metas")
        recommendations["long_term_suggestions"].append("Documentar qué generó esta alegría")
    
    # Recomendaciones basadas en estilo
    if style == "evasivo":
        recommendations["communication_tips"].append("Crear un ambiente seguro para la expresión")
        recommendations["emotional_support"].append("Ser paciente y no presionar")
        recommendations["long_term_suggestions"].append("Trabajar en la confianza gradualmente")
    elif style == "agresivo":
        recommendations["immediate_actions"].append("Mantener calma y no responder con agresividad")
        recommendations["communication_tips"].append("Establecer límites claros y respetuosos")
        recommendations["emotional_support"].append("Ayudar a identificar las causas subyacentes")
    elif style == "formal":
        recommendations["communication_tips"].append("Mantener un tono profesional pero cálido")
        recommendations["emotional_support"].append("Respetar la preferencia por la formalidad")
    
    # Recomendaciones basadas en prioridad
    if priority == "crítica":
        recommendations["immediate_actions"].insert(0, "🚨 INTERVENCIÓN CRÍTICA REQUERIDA")
        recommendations["immediate_actions"].append("Contactar inmediatamente al tutor o profesional")
        recommendations["immediate_actions"].append("Evaluar necesidad de intervención de emergencia")
        recommendations["emotional_support"].append("Mantener presencia constante y apoyo inmediato")
        recommendations["long_term_suggestions"].append("Coordinar con servicios de salud mental")
    elif priority == "alta":
        recommendations["immediate_actions"].insert(0, "⚠️ ATENCIÓN INMEDIATA REQUERIDA")
        recommendations["immediate_actions"].append("Evaluar necesidad de intervención profesional")
        recommendations["emotional_support"].append("Mantener contacto frecuente y apoyo constante")
    elif priority == "media":
        recommendations["immediate_actions"].append("Monitorear cambios en el estado emocional")
        recommendations["emotional_support"].append("Ofrecer recursos de apoyo adicionales")
    elif priority == "baja":
        recommendations["immediate_actions"].append("Observar tendencias en el estado emocional")
        recommendations["emotional_support"].append("Ofrecer apoyo preventivo")
    
    return recommendations


def generate_summary(analysis: Dict[str, Any]) -> Dict[str, str]:
    """
    Genera un resumen ejecutivo del análisis.
    """
    emotion = analysis["emotion"]
    emotion_score = analysis["emotion_score"]
    style = analysis["style"]
    priority = analysis["priority"]
    alert = analysis["alert"]
    
    # Resumen ejecutivo
    if priority == "crítica":
        executive_summary = f"🚨 SITUACIÓN CRÍTICA: El usuario presenta {emotion} con intensidad del {emotion_score:.1f}% y estilo {style}. INTERVENCIÓN INMEDIATA REQUERIDA."
    elif priority == "alta":
        executive_summary = f"⚠️ SITUACIÓN DE ALTA PRIORIDAD: El usuario presenta {emotion} con intensidad del {emotion_score:.1f}% y estilo {style}. Requiere atención inmediata."
    elif priority == "media":
        executive_summary = f"📊 SITUACIÓN MODERADA: Estado emocional de {emotion} ({emotion_score:.1f}%) con estilo {style}. Monitoreo recomendado."
    elif priority == "baja":
        executive_summary = f"📈 SITUACIÓN DE BAJA PRIORIDAD: Estado emocional de {emotion} ({emotion_score:.1f}%) con estilo {style}. Observación preventiva."
    else:
        executive_summary = f"✅ ESTADO NORMAL: Emoción predominante {emotion} ({emotion_score:.1f}%) con estilo {style}. Continúa el apoyo regular."
    
    # Resumen técnico
    technical_summary = f"Análisis técnico: Emoción dominante '{emotion}' (confianza: {emotion_score:.1f}%), estilo comunicativo '{style}' (confianza: {analysis['style_score']:.1f}%). Prioridad: {priority}. Alerta: {'SÍ' if alert else 'NO'}."
    
    # Resumen para el usuario
    user_summary = f"Tu mensaje refleja principalmente {emotion} y un estilo de comunicación {style}. "
    if priority == "crítica":
        user_summary += "Es muy importante que sepas que estamos aquí para ayudarte. No dudes en buscar apoyo profesional si lo necesitas."
    elif priority == "alta":
        user_summary += "Es importante que sepas que estamos aquí para apoyarte."
    elif priority == "media":
        user_summary += "Recuerda que es normal tener altibajos emocionales."
    elif priority == "baja":
        user_summary += "Es bueno que mantengas esta comunicación abierta."
    else:
        user_summary += "Mantén esta comunicación abierta."
    
    return {
        "executive": executive_summary,
        "technical": technical_summary,
        "user_friendly": user_summary
    }


def analyze_chat_context(history: List[str]) -> Dict[str, Any]:
    """
    Analiza el historial completo del chat para detectar patrones acumulativos de riesgo.
    Returns:
        dict con resumen de emociones y estilos repetidos.
    """
    emotion_counter = {}
    style_counter = {}
    high_risk_count = 0

    for msg in history:
        emo, emo_score = predict_emotion(msg)
        style, style_score = predict_style(msg)

        emotion_counter[emo] = emotion_counter.get(emo, 0) + 1
        style_counter[style] = style_counter.get(style, 0) + 1

        if emo in ["frustración", "tristeza", "desánimo"] and emo_score >= 70:
            high_risk_count += 1

    context_flag = high_risk_count >= 2
    return {
        "emotion_frequency": emotion_counter,
        "style_frequency": style_counter,
        "context_alert": context_flag,
        "context_risk_level": "alto" if context_flag else "normal"
    }


def analyze_text(text: str, history: Optional[List[str]] = None) -> dict:
    """
    Analiza el texto individualmente, y opcionalmente el contexto (historial).
    """
    emotion_result = analyze_emotion(text)
    style_result = analyze_style(text)

    # Obtener contexto de riesgo si hay historial
    context_risk = "normal"
    if history:
        context_info = analyze_chat_context(history)
        context_risk = context_info.get("context_risk_level", "normal")
    
    # Calcular prioridad
    priority = evaluate_priority(
        emotion_result["emotion"],
        emotion_result["emotion_score"],
        style_result["style"],
        style_result["style_score"],
        context_risk
    )
    # Calcular alerta y razón de alerta
    alert_flag, alert_reason = check_combined_alert(
        emotion_result["emotion"],
        emotion_result["emotion_score"],
        style_result["style"],
        style_result["style_score"]
    )

    result = {
        "text": text,
        **emotion_result,
        **style_result,
        "priority": priority,
        "alert": alert_flag,
        "alert_reason": alert_reason if alert_flag else None,
    }

    if history:
        context_info = analyze_chat_context(history)
        result.update(context_info)

    return result


def process_complete_analysis(db: Session, user_id: int, message_text: str) -> Dict[str, Any]:
    """
    Realiza un análisis completo de un mensaje, genera recomendaciones y resumen,
    y guarda el análisis en la base de datos.
    """
    # Análisis básico
    basic_analysis = analyze_text(message_text)
    
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
        }
    }
    
    # Guardar el análisis en la base de datos con las distribuciones
    # Primero buscar o crear el mensaje
    mensaje = db.query(Mensaje).filter(
        Mensaje.usuario_id == user_id,
        Mensaje.texto == message_text,
        Mensaje.remitente == "user"
    ).order_by(desc(Mensaje.creado_en)).first()
    
    if mensaje:
        # Crear o actualizar el análisis
        analisis = db.query(Analisis).filter(Analisis.mensaje_id == mensaje.id).first()
        if not analisis:
            analisis = Analisis(mensaje_id=mensaje.id, usuario_id=user_id)
        
        # Actualizar datos del análisis usando setattr
        setattr(analisis, 'emocion', basic_analysis["emotion"])
        setattr(analisis, 'emocion_score', basic_analysis["emotion_score"])
        setattr(analisis, 'estilo', basic_analysis["style"])
        setattr(analisis, 'estilo_score', basic_analysis["style_score"])
        setattr(analisis, 'prioridad', basic_analysis["priority"])
        setattr(analisis, 'alerta', basic_analysis["alert"])
        setattr(analisis, 'razon_alerta', basic_analysis.get("alert_reason"))
        
        # Guardar distribuciones como JSON
        setattr(analisis, 'distribucion_emociones', json.dumps(basic_analysis.get("emotion_distribution", [])))
        setattr(analisis, 'distribucion_estilos', json.dumps(basic_analysis.get("style_distribution", [])))
        
        # Guardar recomendaciones y resumen
        setattr(analisis, 'recomendaciones', json.dumps(recommendations))
        setattr(analisis, 'resumen', json.dumps(summary))
        
        db.add(analisis)
        db.commit()
    
    return complete_analysis

def perform_deep_analysis(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Realiza un análisis profundo de los últimos 10 mensajes del usuario.
    - Usa los datos ya guardados en la base de datos
    - Análisis individual y promedio
    - Datos para gráficos (radar, barras, tabla)
    """
    # 1. Recuperar los últimos 10 mensajes del usuario con sus análisis ya guardados
    mensajes_con_analisis = db.query(Mensaje, Analisis).join(
        Analisis, Mensaje.id == Analisis.mensaje_id, isouter=True
    ).filter(
        Mensaje.usuario_id == user_id,
        Mensaje.remitente == "user"
    ).order_by(desc(Mensaje.creado_en)).limit(10).all()

    if not mensajes_con_analisis:
        return {"message": "No hay mensajes para analizar.", "status_code": 404}

    # 2. Procesar los datos guardados en la base de datos
    analisis_individual = []
    mensajes = []
    
    for mensaje, analisis in mensajes_con_analisis:
        mensajes.append(mensaje)
        
        if analisis and analisis.distribucion_emociones and analisis.distribucion_estilos:
            # Usar datos guardados en la base de datos
            try:
                emotion_distribution = json.loads(analisis.distribucion_emociones) if isinstance(analisis.distribucion_emociones, str) else analisis.distribucion_emociones
                style_distribution = json.loads(analisis.distribucion_estilos) if isinstance(analisis.distribucion_estilos, str) else analisis.distribucion_estilos
                
                analisis_individual.append({
                    "emotion": analisis.emocion or "neutro",
                    "emotion_score": analisis.emocion_score or 0.0,
                    "style": analisis.estilo or "neutro",
                    "style_score": analisis.estilo_score or 0.0,
                    "emotion_distribution": emotion_distribution,
                    "style_distribution": style_distribution,
                    "priority": analisis.prioridad or "normal",
                    "alert": analisis.alerta or False
                })
            except (json.JSONDecodeError, TypeError):
                # Si hay error al parsear JSON, re-analizar el mensaje
                basic_analysis = analyze_text(mensaje.texto)
                analisis_individual.append(basic_analysis)
        else:
            # Si no hay análisis guardado, crear uno nuevo
            basic_analysis = analyze_text(mensaje.texto)
            analisis_individual.append(basic_analysis)

    # 3. Calcular promedios de scores para emociones y estilos
    # Obtener todas las emociones y estilos posibles
    all_emotions = set()
    all_styles = set()
    for a in analisis_individual:
        if "emotion_distribution" in a and a["emotion_distribution"]:
            for emo, _ in a["emotion_distribution"]:
                all_emotions.add(emo)
        if "style_distribution" in a and a["style_distribution"]:
            for sty, _ in a["style_distribution"]:
                all_styles.add(sty)
    
    # Si no hay distribuciones, usar las emociones y estilos principales
    if not all_emotions:
        all_emotions = set(a["emotion"] for a in analisis_individual if a["emotion"])
    if not all_styles:
        all_styles = set(a["style"] for a in analisis_individual if a["style"])
    
    all_emotions = sorted(list(all_emotions))
    all_styles = sorted(list(all_styles))

    # Promedio de scores
    avg_emotions = {emo: 0.0 for emo in all_emotions}
    avg_styles = {sty: 0.0 for sty in all_styles}
    
    for a in analisis_individual:
        if "emotion_distribution" in a and a["emotion_distribution"]:
            emo_dict = dict(a["emotion_distribution"])
            for emo in all_emotions:
                avg_emotions[emo] += emo_dict.get(emo, 0)
        else:
            # Si no hay distribución, usar la emoción principal
            emo = a.get("emotion", "neutro")
            if emo in avg_emotions:
                avg_emotions[emo] += a.get("emotion_score", 0)
        
        if "style_distribution" in a and a["style_distribution"]:
            sty_dict = dict(a["style_distribution"])
            for sty in all_styles:
                avg_styles[sty] += sty_dict.get(sty, 0)
        else:
            # Si no hay distribución, usar el estilo principal
            sty = a.get("style", "neutro")
            if sty in avg_styles:
                avg_styles[sty] += a.get("style_score", 0)
    
    # Calcular promedios
    for emo in avg_emotions:
        avg_emotions[emo] = round(avg_emotions[emo] / len(analisis_individual), 2)
    for sty in avg_styles:
        avg_styles[sty] = round(avg_styles[sty] / len(analisis_individual), 2)

    # 4. Preparar datos para gráficos
    # Radar: promedios
    radar_data = {
        "emotions": avg_emotions,
        "styles": avg_styles
    }
    
    # Barras: evolución por mensaje
    barras_emociones = []
    barras_estilos = []
    for idx, a in enumerate(analisis_individual):
        emo_data = {"mensaje": f"M{idx+1}"}
        sty_data = {"mensaje": f"M{idx+1}"}
        
        if "emotion_distribution" in a and a["emotion_distribution"]:
            emo_data.update(dict(a["emotion_distribution"]))
        else:
            emo_data[a.get("emotion", "neutro")] = a.get("emotion_score", 0)
        
        if "style_distribution" in a and a["style_distribution"]:
            sty_data.update(dict(a["style_distribution"]))
        else:
            sty_data[a.get("style", "neutro")] = a.get("style_score", 0)
        
        barras_emociones.append(emo_data)
        barras_estilos.append(sty_data)

    # Tabla: detalle por mensaje
    tabla = []
    for idx, (m, a) in enumerate(zip(mensajes, analisis_individual)):
        tabla.append({
            "mensaje": m.texto,
            "emocion": a.get("emotion", "neutro"),
            "emocion_score": a.get("emotion_score", 0),
            "estilo": a.get("style", "neutro"),
            "estilo_score": a.get("style_score", 0),
            "distribucion_emociones": a.get("emotion_distribution", []),
            "distribucion_estilos": a.get("style_distribution", [])
        })

    # Insights automáticos
    insights = {}
    if avg_emotions:
        insights["emocion_mas_frecuente"] = max(avg_emotions.items(), key=lambda x: x[1])[0]
    if avg_styles:
        insights["estilo_mas_frecuente"] = max(avg_styles.items(), key=lambda x: x[1])[0]
    if tabla:
        insights["emocion_mas_alta"] = max(tabla, key=lambda x: x["emocion_score"])["emocion"]
        insights["estilo_mas_alto"] = max(tabla, key=lambda x: x["estilo_score"])["estilo"]

    # Preparar datos para el frontend - mantener como porcentajes
    average_emotion_distribution = [{"emotion": emo, "score": score} for emo, score in avg_emotions.items()]
    average_style_distribution = [{"style": sty, "score": score} for sty, score in avg_styles.items()]
    
    # Generar tendencias emocionales
    emotion_trends = []
    emotion_counts = {}
    for a in analisis_individual:
        emotion = a.get("emotion", "neutro")
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    for emotion, count in emotion_counts.items():
        emotion_trends.append({
            "emotion": emotion,
            "count": count,
            "percentage": round((count / len(analisis_individual)) * 100, 1)
        })
    
    # Convertir el resultado al formato esperado por el frontend
    return {
        "total_messages": len(analisis_individual),
        "average_emotion_score": sum(a.get("emotion_score", 0) for a in analisis_individual) / len(analisis_individual) if analisis_individual else 0,
        "average_style_score": sum(a.get("style_score", 0) for a in analisis_individual) / len(analisis_individual) if analisis_individual else 0,
        "emotion_trend": [
            {
                "date": mensajes[i].creado_en.strftime("%Y-%m-%d"),
                "emotion": a.get("emotion", "neutro"),
                "score": a.get("emotion_score", 0)
            }
            for i, a in enumerate(analisis_individual)
        ],
        "style_trend": [
            {
                "date": mensajes[i].creado_en.strftime("%Y-%m-%d"),
                "style": a.get("style", "neutro"),
                "score": a.get("style_score", 0)
            }
            for i, a in enumerate(analisis_individual)
        ],
        "risk_assessment": {
            "high_risk_messages": len([a for a in analisis_individual if a.get("priority") == "alta" or a.get("priority") == "crítica"]),
            "medium_risk_messages": len([a for a in analisis_individual if a.get("priority") == "media"]),
            "low_risk_messages": len([a for a in analisis_individual if a.get("priority") == "baja" or a.get("priority") == "normal"])
        },
        "recommendations": generate_recommendations(
            insights.get("emocion_mas_frecuente", "neutro"),
            avg_emotions.get(insights.get("emocion_mas_frecuente", "neutro"), 0),
            insights.get("estilo_mas_frecuente", "neutro"),
            avg_styles.get(insights.get("estilo_mas_frecuente", "neutro"), 0),
            "media"  # Prioridad promedio
        ).get("immediate_actions", [])
    }


def generate_bot_reply(analysis: Dict[str, Any]) -> str:
    """
    Genera una respuesta del bot basada en el análisis emocional.
    """
    emotion = analysis.get("emotion", "")
    emotion_score = analysis.get("emotion_score", 0)
    style = analysis.get("style", "")
    priority = analysis.get("priority", "normal")
    
    # Respuestas basadas en emoción
    if emotion == "tristeza" and emotion_score > 70:
        return "Entiendo que te sientes triste. Es completamente normal tener estos momentos. ¿Te gustaría hablar más sobre lo que te está pasando?"
    elif emotion == "ansiedad" and emotion_score > 65:
        return "Veo que estás sintiendo ansiedad. Respira profundo, estás a salvo aquí. ¿Qué te está preocupando?"
    elif emotion == "frustración" and emotion_score > 70:
        return "La frustración puede ser muy difícil de manejar. ¿Qué te está frustrando específicamente?"
    elif emotion == "alegría" and emotion_score > 60:
        return "¡Me alegra ver que estás de buen humor! ¿Qué te está haciendo sentir así?"
    else:
        return "Gracias por compartir eso conmigo. ¿Cómo te sientes ahora?"