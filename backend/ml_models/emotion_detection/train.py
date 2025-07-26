import argparse
from pathlib import Path
from ml_models.train_model import train_and_save_model

# Rutas
BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset_emocion.csv"
OUTPUT_DIR = BASE_DIR

def main():
    train_and_save_model(
        dataset_path=str(DATASET_PATH),
        output_dir=str(OUTPUT_DIR),
        target_column="emocion",
        model_name="emotion_model"
    )

if __name__ == "__main__":
    main()