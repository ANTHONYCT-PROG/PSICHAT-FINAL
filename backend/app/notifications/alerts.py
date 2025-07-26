# backend/app/notifications/alerts.py

"""
Módulo de evaluación de alertas emocionales.
Basado en principios de psicología educativa y salud mental preventiva.
"""

from typing import Tuple


# Definición de emociones de riesgo y sus umbrales
EMOTION_THRESHOLDS = {
    "frustración": 70,
    "tristeza": 70,
    "ansiedad": 65,
    "desánimo": 60,
}

STYLE_RISKY = {"evasivo", "pasivo-agresivo", "irónico"}
EMOTION_RISKY = set(EMOTION_THRESHOLDS.keys())


def is_emotion_alert(emotion: str, score: float) -> bool:
    """
    Verifica si una emoción supera su umbral de alerta.
    """
    threshold = EMOTION_THRESHOLDS.get(emotion.lower())
    return threshold is not None and score >= threshold


def is_style_alert(style: str, score: float) -> bool:
    """
    Verifica si un estilo es considerado riesgoso con score alto.
    """
    return style.lower() in STYLE_RISKY and score >= 60


def check_emotion_alert(emotion: str, score: float) -> Tuple[bool, str]:
    """
    Evalúa si se debe activar una alerta emocional basada solo en la emoción.
    """
    if is_emotion_alert(emotion, score):
        return True, f"Emoción '{emotion}' detectada con intensidad {score}%."
    return False, ""


def check_combined_alert(emotion: str, emotion_score: float, style: str, style_score: float) -> Tuple[bool, str]:
    """
    Evalúa si se debe activar una alerta considerando la combinación emoción + estilo.
    """
    if is_emotion_alert(emotion, emotion_score) and is_style_alert(style, style_score):
        return True, (
            f"Alerta combinada: emoción '{emotion}' ({emotion_score}%) "
            f"y estilo '{style}' ({style_score}%) indican posible desconexión o riesgo emocional."
        )

    if is_emotion_alert(emotion, emotion_score):
        return True, f"Emoción '{emotion}' con intensidad {emotion_score}% supera el umbral."
    
    if is_style_alert(style, style_score):
        return True, f"Estilo '{style}' detectado con intensidad {style_score}% sugiere evasión o tensión."

    return False, ""
