# backend/init_db.py
"""
Script para crear las tablas de la base de datos.
Debe ejecutarse una sola vez (o cada vez que se modifiquen los modelos).
"""

from app.db.models import Base
from app.db.session import engine

def init():
    print("🛠️  Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas exitosamente.")

if __name__ == "__main__":
    init()
