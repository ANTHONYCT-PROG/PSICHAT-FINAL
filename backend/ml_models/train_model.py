import argparse
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# Rutas
BASE_DIR = Path(__file__).resolve().parent

def train_and_save_model(dataset_path: str, output_dir: str, target_column: str, model_name: str):
    # 1. Verificar dataset
    dataset_file = Path(dataset_path)
    if not dataset_file.exists():
        raise FileNotFoundError(f"❌ Dataset no encontrado en {dataset_file.resolve()}")

    # 2. Cargar datos
    df = pd.read_csv(dataset_file)
    if "texto" not in df.columns or target_column not in df.columns:
        raise ValueError(f"El CSV debe tener columnas 'texto' y '{target_column}'.")

    df = df.dropna(subset=["texto", target_column])

    X = df["texto"]
    y = df[target_column]

    # 3. Separar train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # 4. Crear pipeline
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer()),
        ("clf", LogisticRegression(max_iter=300))
    ])

    # 5. Entrenar modelo
    pipeline.fit(X_train, y_train)

    # 6. Evaluar modelo
    y_pred = pipeline.predict(X_test)
    print(f"\n🎯 Reporte de clasificación para {model_name}:")
    print(classification_report(y_test, y_pred))
    print(f"📊 Matriz de confusión para {model_name}:")
    print(confusion_matrix(y_test, y_pred))

    # 7. Guardar modelo
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    model_file = output_path / f"{model_name}.joblib"
    joblib.dump(pipeline, model_file)
    print(f"\n✅ Modelo {model_name} guardado en: {model_file.resolve()}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entrena y guarda un modelo de ML.")
    parser.add_argument("--dataset", type=str, required=True, help="Ruta al CSV de entrenamiento")
    parser.add_argument("--output", type=str, required=True, help="Directorio de salida del modelo")
    parser.add_argument("--target", type=str, required=True, help="Nombre de la columna objetivo (e.g., 'emocion', 'estilo')")
    parser.add_argument("--name", type=str, required=True, help="Nombre del modelo (e.g., 'emotion_model', 'style_model')")
    args = parser.parse_args()
    train_and_save_model(args.dataset, args.output, args.target, args.name)
