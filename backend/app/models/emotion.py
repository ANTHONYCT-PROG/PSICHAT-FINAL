# backend/app/models/emotion.py

"""
Cargador y predictor de emociones desde texto, usando un modelo scikit-learn exportado (joblib).
"""

import os
from pathlib import Path
from typing import Tuple, Dict, List
from datetime import datetime

import joblib
from app.utils.text_processing import limpiar_texto

# Ruta al modelo entrenado
MODEL_PATH = Path(os.environ.get("EMOTION_MODEL_PATH", "backend/ml_models/emotion_detection/emotion_model.joblib"))

# Cargar modelo al inicio
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"[WARN] No se pudo cargar el modelo de emoción: {e}")
    model = None

def predict_emotion(text: str) -> Tuple[str, float]:
    """
    Predice la emoción dominante y su score como porcentaje.
    
    Args:
        text (str): Texto de entrada.
    Returns:
        Tuple[str, float]: (emoción_predicha, score en porcentaje)
    """
    cleaned_text = limpiar_texto(text)
    if not model or not cleaned_text.strip():
        return "neutro", 0.0

    pred = model.predict([cleaned_text])[0]
    proba = round(float(max(model.predict_proba([cleaned_text])[0]) * 100), 2)
    return pred, proba

def predict_all_emotions(text: str) -> List[Tuple[str, float]]:
    """
    Retorna todas las emociones posibles con sus probabilidades en porcentaje, ordenadas de mayor a menor.
    
    Args:
        text (str): Texto de entrada.
    Returns:
        List[Tuple[str, float]]: Lista de (emoción, score%) ordenada.
    """
    cleaned_text = limpiar_texto(text)
    if not model or not cleaned_text.strip():
        return [("neutro", 0.0)]

    probas = model.predict_proba([cleaned_text])[0]
    emotions = model.classes_
    scores = list(zip(emotions, [round(float(p) * 100, 2) for p in probas]))
    return sorted(scores, key=lambda x: x[1], reverse=True)

def generate_reply(user_text: str) -> Dict:
    """
    Genera una respuesta automatizada con análisis emocional del texto del usuario.
    
    Args:
        user_text: Texto de entrada del usuario
    Returns:
        Diccionario con la respuesta y metadatos emocionales
    """
    emotion, score = predict_emotion(user_text)
    all_emotions = predict_all_emotions(user_text)

    reply = "Gracias por compartir cómo te sientes. Estoy aquí para ayudarte."  # Placeholder empático

    return {
        "reply": reply,
        "meta": {
            "timestamp": datetime.utcnow().isoformat(),
            "dominant_emotion": emotion,
            "emotion_score_percent": score,
            "all_emotions_percent": all_emotions,
            "info": "Respuesta generada con análisis emocional automático."
        }
    }

# --- Test manual ---
if __name__ == "__main__":
    textos = [
        "No entiendo nada de la clase y me frustra mucho.",
        "Hoy estoy muy feliz y motivado.",
        "Me siento triste y desconectado de todo.",
        "No tengo ganas de hacer nada."
    ]

    for txt in textos:
        dominant, score = predict_emotion(txt)
        all_probs = predict_all_emotions(txt)

        print(f"\nTexto: {txt}")
        print(f"  ➤ Emoción dominante: {dominant} (score={score:.2f}%)")
        print("  ➤ Todas las emociones:")
        for emo, s in all_probs:
            print(f"     - {emo}: {s:.2f}%")
