"""
Configuración de pytest y fixtures comunes para todos los tests.
"""

import pytest
import os
import sys
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Configurar entorno para tests antes de importar la aplicación
os.environ["ENVIRONMENT"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-32-chars-long"
os.environ["GEMINI_API_KEY"] = "test-key"

# Agregar el directorio raíz al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.models import Base
from app.db.session import get_db
from app.core.config import settings
from app.db.models import Usuario, RolUsuario, EstadoUsuario
from app.core.security import get_password_hash

# Configurar base de datos de test
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override de la dependencia de base de datos para tests."""
    db = None
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        if db:
            db.close()

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Configurar la base de datos de test al inicio de la sesión."""
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    yield
    # Limpiar al final
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Sesión de base de datos para cada test."""
    session = TestingSessionLocal()
    
    yield session
    
    session.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Cliente de test para FastAPI."""
    # Importar la aplicación aquí para evitar problemas con el lifespan
    from app.main import app
    
    # Override de la dependencia de base de datos
    app.dependency_overrides[get_db] = lambda: db_session
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Limpiar overrides
    app.dependency_overrides.clear()

@pytest.fixture
def test_student(db_session):
    """Usuario estudiante de prueba."""
    import uuid
    unique_email = f"estudiante_{uuid.uuid4().hex[:8]}@test.com"
    user = Usuario(
        email=unique_email,
        nombre="Estudiante Test",
        hashed_password=get_password_hash("test123"),
        rol=RolUsuario.ESTUDIANTE,
        estado=EstadoUsuario.ACTIVO
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_tutor(db_session):
    """Usuario tutor de prueba."""
    user = Usuario(
        email="tutor@test.com",
        nombre="Tutor Test",
        hashed_password=get_password_hash("test123"),
        rol=RolUsuario.TUTOR,
        estado=EstadoUsuario.ACTIVO
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_admin(db_session):
    """Usuario administrador de prueba."""
    user = Usuario(
        email="admin@test.com",
        nombre="Admin Test",
        hashed_password=get_password_hash("test123"),
        rol=RolUsuario.ADMIN,
        estado=EstadoUsuario.ACTIVO
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers_student(client, db_session):
    """Headers de autenticación para estudiante."""
    # Usar un email único basado en el ID del test
    import uuid
    unique_email = f"estudiante_{uuid.uuid4().hex[:8]}@test.com"
    
    # Crear el usuario en la misma sesión que usa el client
    user = Usuario(
        email=unique_email,
        nombre="Estudiante Test",
        hashed_password=get_password_hash("test123"),
        rol=RolUsuario.ESTUDIANTE,
        estado=EstadoUsuario.ACTIVO
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    response = client.post("/auth/login", data={
        "username": user.email,
        "password": "test123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_tutor(client, db_session):
    """Headers de autenticación para tutor."""
    # Usar un email único basado en el ID del test
    import uuid
    unique_email = f"tutor_{uuid.uuid4().hex[:8]}@test.com"
    
    # Crear el usuario en la misma sesión que usa el client
    user = Usuario(
        email=unique_email,
        nombre="Tutor Test",
        hashed_password=get_password_hash("test123"),
        rol=RolUsuario.TUTOR,
        estado=EstadoUsuario.ACTIVO
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    response = client.post("/auth/login", data={
        "username": user.email,
        "password": "test123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_admin(client, db_session):
    """Headers de autenticación para administrador."""
    # Usar un email único basado en el ID del test
    import uuid
    unique_email = f"admin_{uuid.uuid4().hex[:8]}@test.com"
    
    # Crear el usuario en la misma sesión que usa el client
    user = Usuario(
        email=unique_email,
        nombre="Admin Test",
        hashed_password=get_password_hash("test123"),
        rol=RolUsuario.ADMIN,
        estado=EstadoUsuario.ACTIVO
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    response = client.post("/auth/login", data={
        "username": user.email,
        "password": "test123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_texts():
    """Textos de muestra para testing."""
    return {
        "triste": "Me siento muy triste y no tengo ganas de hacer nada",
        "frustrado": "Estoy frustrado porque no entiendo la materia",
        "alegre": "¡Hoy me siento muy feliz y motivado!",
        "ansioso": "Me siento ansioso por el examen de mañana",
        "neutral": "Hola, ¿cómo estás?"
    } 