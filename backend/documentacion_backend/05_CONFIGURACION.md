# ⚙️ CONFIGURACIÓN DEL BACKEND - PSICHAT V2

## 📋 Configuración General

La configuración de PsiChat V2 se maneja a través de **Pydantic Settings** y variables de entorno, proporcionando flexibilidad para diferentes entornos (desarrollo, testing, producción).

## 🔧 Sistema de Configuración

### **Clase Settings Principal**

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    """Configuración centralizada de la aplicación"""
    
    model_config = ConfigDict(case_sensitive=True)
    
    # Configuración básica de la aplicación
    APP_NAME: str = "PsiChat Backend"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Configuración de base de datos
    DATABASE_URL: str = "sqlite:///./psichat.db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    
    # Configuración de seguridad
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Configuración de CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
    
    # Configuración de modelos ML
    EMOTION_MODEL_PATH: str = "ml_models/emotion_detection/emotion_model.joblib"
    STYLE_MODEL_PATH: str = "ml_models/style_classification/style_model.joblib"
    
    # Configuración de Gemini AI
    GEMINI_API_KEY: str = "AIzaSyCMbhh8Prtt9Dn3wh8RBcV8dI5NZP3hjfs"
    GEMINI_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    # Configuración de rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Configuración de logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE_PATH: str = "logs"
    LOG_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT: int = 5
    
    # Configuración de caché
    CACHE_ENABLED: bool = True
    CACHE_TTL: int = 300  # 5 minutos
    REDIS_URL: str = ""
    
    # Configuración de notificaciones
    NOTIFICATIONS_ENABLED: bool = True
    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # Configuración de análisis
    ANALYSIS_BATCH_SIZE: int = 10
    ANALYSIS_TIMEOUT: int = 30
    ENABLE_DEEP_ANALYSIS: bool = True
    
    # Configuración de monitoreo
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
```

## 🔍 Validadores de Configuración

### **Validación de SECRET_KEY**
```python
@field_validator("SECRET_KEY")
@classmethod
def validate_secret_key(cls, v):
    # Permitir el valor por defecto en desarrollo
    if v == "your-secret-key-change-in-production":
        # Verificar si estamos en desarrollo
        env = os.getenv("ENVIRONMENT", "production")
        if env == "development":
            return v
        else:
            raise ValueError("SECRET_KEY debe ser cambiada en producción")
    if len(v) < 32:
        raise ValueError("SECRET_KEY debe tener al menos 32 caracteres")
    return v
```

### **Validación de DATABASE_URL**
```python
@field_validator("DATABASE_URL")
@classmethod
def validate_database_url(cls, v):
    if not v:
        raise ValueError("DATABASE_URL no puede estar vacía")
    return v
```

### **Validación de GEMINI_API_KEY**
```python
@field_validator("GEMINI_API_KEY")
@classmethod
def validate_gemini_api_key(cls, v):
    if not v:
        raise ValueError("GEMINI_API_KEY es requerida para el funcionamiento del chat")
    return v
```

## 🌍 Configuración por Entorno

### **Entorno de Desarrollo**
```python
# Configuración específica para desarrollo
if settings.ENVIRONMENT == "development":
    settings.DEBUG = True
    settings.LOG_LEVEL = "INFO"
    
    # Agregar orígenes adicionales para desarrollo
    additional_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
    for origin in additional_origins:
        if origin not in settings.ALLOWED_ORIGINS:
            settings.ALLOWED_ORIGINS.append(origin)
```

### **Entorno de Testing**
```python
# Configuración específica para testing
elif settings.ENVIRONMENT == "testing":
    settings.DEBUG = True
    settings.DATABASE_URL = "sqlite:///./test.db"
    settings.LOG_LEVEL = "WARNING"
    settings.CACHE_ENABLED = False
    settings.NOTIFICATIONS_ENABLED = False
    # En testing, permitir API key vacía para usar mock
    settings.GEMINI_API_KEY = "test-key"
```

### **Entorno de Producción**
```python
# Configuración específica para producción
elif settings.ENVIRONMENT == "production":
    settings.DEBUG = False
    settings.LOG_LEVEL = "WARNING"
    settings.CACHE_ENABLED = True
    settings.NOTIFICATIONS_ENABLED = True
    # Validar que SECRET_KEY sea segura
    if settings.SECRET_KEY == "your-secret-key-change-in-production":
        raise ValueError("SECRET_KEY debe ser cambiada en producción")
```

## 📄 Variables de Entorno

### **Archivo .env de Ejemplo**
```bash
# ==================== CONFIGURACIÓN DE LA APLICACIÓN ====================
APP_NAME=PsiChat Backend
APP_VERSION=2.0.0
DEBUG=False
ENVIRONMENT=production

# ==================== BASE DE DATOS ====================
DATABASE_URL=sqlite:///./psichat.db
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_TIMEOUT=30

# ==================== SEGURIDAD ====================
SECRET_KEY=your-super-secret-key-with-at-least-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ==================== CORS ====================
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173", "https://yourdomain.com"]

# ==================== MACHINE LEARNING ====================
EMOTION_MODEL_PATH=ml_models/emotion_detection/emotion_model.joblib
STYLE_MODEL_PATH=ml_models/style_classification/style_model.joblib

# ==================== GEMINI AI ====================
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
GEMINI_MODEL=gemini-2.0-flash

# ==================== RATE LIMITING ====================
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# ==================== LOGGING ====================
LOG_LEVEL=INFO
LOG_FILE_PATH=logs
LOG_MAX_SIZE=10485760
LOG_BACKUP_COUNT=5

# ==================== CACHÉ ====================
CACHE_ENABLED=True
CACHE_TTL=300
REDIS_URL=redis://localhost:6379

# ==================== NOTIFICACIONES ====================
NOTIFICATIONS_ENABLED=True
EMAIL_ENABLED=False
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# ==================== ANÁLISIS ====================
ANALYSIS_BATCH_SIZE=10
ANALYSIS_TIMEOUT=30
ENABLE_DEEP_ANALYSIS=True

# ==================== MONITOREO ====================
ENABLE_METRICS=True
METRICS_PORT=9090
```

## 🔧 Configuración de Base de Datos

### **Configuración de SQLAlchemy**
```python
# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Crear engine de base de datos
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    echo=settings.DEBUG  # Mostrar SQL en debug
)

# Crear sesión local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency para obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### **Configuración de Alembic**
```python
# migrations/env.py
from app.core.config import settings

def get_url():
    """Obtener URL de base de datos para migraciones"""
    return settings.DATABASE_URL

def run_migrations_online() -> None:
    """Ejecutar migraciones online"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()
```

## 🔐 Configuración de Seguridad

### **Configuración de JWT**
```python
# app/core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Contexto para hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crear token de acceso JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generar hash de contraseña"""
    return pwd_context.hash(password)
```

### **Configuración de CORS**
```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

# Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS + ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

## 📊 Configuración de Logging

### **Configuración de Structlog**
```python
# app/core/logging.py
import structlog
from app.core.config import settings

def setup_logging():
    """Configurar sistema de logging"""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

# Configurar nivel de logging
import logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Crear loggers
logger = structlog.get_logger()
performance_logger = structlog.get_logger("performance")
```

## 🧠 Configuración de Machine Learning

### **Configuración de Modelos**
```python
# app/services/analysis_service.py
import joblib
from app.core.config import settings

class MLModelManager:
    """Gestor de modelos de machine learning"""
    
    def __init__(self):
        self.emotion_model = None
        self.style_model = None
        self._load_models()
    
    def _load_models(self):
        """Cargar modelos desde archivos"""
        try:
            self.emotion_model = joblib.load(settings.EMOTION_MODEL_PATH)
            self.style_model = joblib.load(settings.STYLE_MODEL_PATH)
        except Exception as e:
            logger.error(f"Error cargando modelos ML: {e}")
            raise
    
    def predict_emotion(self, text: str) -> dict:
        """Predecir emoción del texto"""
        if not self.emotion_model:
            raise ValueError("Modelo de emociones no cargado")
        
        # Preprocesamiento del texto
        processed_text = self._preprocess_text(text)
        
        # Predicción
        prediction = self.emotion_model.predict([processed_text])[0]
        probabilities = self.emotion_model.predict_proba([processed_text])[0]
        
        return {
            "emotion": prediction,
            "confidence": max(probabilities),
            "probabilities": dict(zip(self.emotion_model.classes_, probabilities))
        }
```

## 🔄 Configuración de Caché

### **Configuración de Redis**
```python
# app/core/cache.py
import aioredis
from app.core.config import settings

class CacheManager:
    """Gestor de caché con Redis"""
    
    def __init__(self):
        self.redis = None
        self.enabled = settings.CACHE_ENABLED
    
    async def connect(self):
        """Conectar a Redis"""
        if self.enabled and settings.REDIS_URL:
            try:
                self.redis = await aioredis.from_url(settings.REDIS_URL)
                logger.info("Conectado a Redis")
            except Exception as e:
                logger.error(f"Error conectando a Redis: {e}")
                self.enabled = False
    
    async def get(self, key: str) -> Optional[str]:
        """Obtener valor del caché"""
        if not self.enabled or not self.redis:
            return None
        
        try:
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Error obteniendo de caché: {e}")
            return None
    
    async def set(self, key: str, value: str, ttl: int = None) -> bool:
        """Establecer valor en caché"""
        if not self.enabled or not self.redis:
            return False
        
        try:
            await self.redis.set(key, value, ex=ttl or settings.CACHE_TTL)
            return True
        except Exception as e:
            logger.error(f"Error estableciendo en caché: {e}")
            return False
```

## 📈 Configuración de Monitoreo

### **Configuración de Métricas**
```python
# app/core/monitoring.py
from prometheus_client import Counter, Histogram, Gauge
from app.core.config import settings

# Métricas de Prometheus
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_CONNECTIONS = Gauge('websocket_active_connections', 'Active WebSocket connections')
MODEL_PREDICTIONS = Counter('ml_predictions_total', 'Total ML predictions', ['model_type'])

class PerformanceLogger:
    """Logger de rendimiento"""
    
    @staticmethod
    def log_request_time(endpoint: str, method: str, duration: float, status_code: int):
        """Registrar tiempo de request"""
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status_code).inc()
        REQUEST_DURATION.observe(duration)
    
    @staticmethod
    def log_model_prediction(model_type: str):
        """Registrar predicción de modelo"""
        MODEL_PREDICTIONS.labels(model_type=model_type).inc()
    
    @staticmethod
    def update_websocket_connections(count: int):
        """Actualizar contador de conexiones WebSocket"""
        ACTIVE_CONNECTIONS.set(count)
```

## 🚀 Configuración de Producción

### **Configuración de Gunicorn**
```python
# gunicorn.conf.py
import multiprocessing
from app.core.config import settings

# Configuración de workers
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"

# Configuración de binding
bind = "0.0.0.0:8000"

# Configuración de logging
accesslog = "logs/access.log"
errorlog = "logs/error.log"
loglevel = "info"

# Configuración de timeouts
timeout = 120
keepalive = 2

# Configuración de seguridad
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
```

### **Configuración de Nginx**
```nginx
# nginx.conf
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 🔧 Scripts de Configuración

### **Script de Inicialización**
```python
# init_db.py
from app.db.session import engine
from app.db.models import Base
from app.core.config import settings

def init_database():
    """Inicializar base de datos"""
    print(f"Inicializando base de datos: {settings.DATABASE_URL}")
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    
    print("Base de datos inicializada correctamente")

if __name__ == "__main__":
    init_database()
```

### **Script de Creación de Usuarios de Prueba**
```python
# app/create_test_users.py
from app.db.session import SessionLocal
from app.db.crud import create_user
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def create_test_users():
    """Crear usuarios de prueba"""
    db = SessionLocal()
    
    # Usuario estudiante
    student = UserCreate(
        email="estudiante@test.com",
        nombre="Estudiante Test",
        password="password123"
    )
    create_user(db, student)
    
    # Usuario tutor
    tutor = UserCreate(
        email="tutor@test.com",
        nombre="Tutor Test",
        password="password123"
    )
    create_user(db, tutor)
    
    db.close()
    print("Usuarios de prueba creados")

if __name__ == "__main__":
    create_test_users()
```

---

**Versión**: 2.0.0  
**Última actualización**: Julio 2024  
**Sistema de configuración**: Pydantic Settings con variables de entorno 