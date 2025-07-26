# backend/app/models/style.py

"""
Cargador y predictor de estilo comunicativo usando un modelo scikit-learn exportado (joblib).
"""

import os
from pathlib import Path
from typing import Tuple, List

import joblib
from app.utils.text_processing import limpiar_texto

# Ruta al modelo entrenado
MODEL_PATH = Path(os.environ.get("STYLE_MODEL_PATH", "backend/ml_models/style_classification/style_model.joblib"))

# Cargar modelo al inicio
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"[WARN] No se pudo cargar el modelo de estilo: {e}")
    model = None

def predict_style(text: str) -> Tuple[str, float]:
    """
    Predice el estilo comunicativo dominante y su score como porcentaje.
    
    Args:
        text (str): Texto de entrada.
    Returns:
        Tuple[str, float]: (estilo_detectado, score%)
    """
    cleaned_text = limpiar_texto(text)
    if not model or not cleaned_text.strip():
        return "neutro", 0.0

    pred = model.predict([cleaned_text])[0]
    proba = round(float(max(model.predict_proba([cleaned_text])[0]) * 100), 2)
    return pred, proba

def predict_all_styles(text: str) -> List[Tuple[str, float]]:
    """
    Retorna todos los estilos posibles con sus scores en porcentaje, ordenados de mayor a menor.
    
    Args:
        text (str): Texto de entrada.
    Returns:
        List[Tuple[str, float]]: Lista de (estilo, score%) ordenada.
    """
    cleaned_text = limpiar_texto(text)
    if not model or not cleaned_text.strip():
        return [("neutro", 0.0)]

    probas = model.predict_proba([cleaned_text])[0]
    styles = model.classes_
    scores = list(zip(styles, [round(float(p) * 100, 2) for p in probas]))
    return sorted(scores, key=lambda x: x[1], reverse=True)

# --- Test manual ---
if __name__ == "__main__":
    textos = [
        "No sé, haz lo que quieras.",
        "Por favor, ¿podría ayudarme con la tarea?",
        "¡Obviamente, claro que sí!",
        "Sí, como tú digas, maestro."
    ]

    for txt in textos:
        dominant, score = predict_style(txt)
        all_probs = predict_all_styles(txt)

        print(f"\nTexto: {txt}")
        print(f"  ➤ Estilo dominante: {dominant} (score={score:.2f}%)")
        print("  ➤ Todos los estilos:")
        for estilo, s in all_probs:
            print(f"     - {estilo}: {s:.2f}%")
