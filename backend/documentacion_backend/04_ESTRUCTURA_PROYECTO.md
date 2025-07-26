# 📁 ESTRUCTURA DEL PROYECTO - PSICHAT V2 BACKEND

## 🗂️ Estructura General

```
backend/
├── 📄 Archivos de Configuración
│   ├── requirements.txt          # Dependencias principales
│   ├── requirements-dev.txt      # Dependencias de desarrollo
│   ├── pytest.ini              # Configuración de tests
│   ├── env.example              # Variables de entorno de ejemplo
│   └── init_db.py               # Script de inicialización de BD
│
├── 📁 app/                      # Código principal de la aplicación
│   ├── __init__.py
│   ├── main.py                  # Punto de entrada de FastAPI
│   ├── dependencies.py          # Inyección de dependencias
│   │
│   ├── 📁 api/                  # Capa de presentación (API)
│   │   ├── __init__.py
│   │   └── 📁 routes/           # Endpoints de la API
│   │       ├── __init__.py
│   │       ├── auth.py          # Autenticación
│   │       ├── chat.py          # Chat principal
│   │       ├── analysis.py      # Análisis emocional
│   │       ├── tutor.py         # Funcionalidades de tutor
│   │       ├── tutor_chat.py    # Chat tutor-estudiante
│   │       ├── websocket.py     # WebSocket handlers
│   │       └── reportes.py      # Generación de reportes
│   │
│   ├── 📁 core/                 # Configuración y utilidades core
│   │   ├── config.py            # Configuración central
│   │   ├── exceptions.py        # Excepciones personalizadas
│   │   ├── logging.py           # Configuración de logging
│   │   ├── monitoring.py        # Métricas y monitoreo
│   │   └── security.py          # Utilidades de seguridad
│   │
│   ├── 📁 db/                   # Capa de persistencia
│   │   ├── __init__.py
│   │   ├── session.py           # Configuración de sesiones BD
│   │   ├── models.py            # Modelos ORM
│   │   ├── crud.py              # Operaciones CRUD
│   │   └── update_sesionchat_schema.py
│   │
│   ├── 📁 models/               # Modelos de dominio
│   │   ├── emotion.py           # Modelos de emociones
│   │   └── style.py             # Modelos de estilos
│   │
│   ├── 📁 schemas/              # Esquemas Pydantic (DTOs)
│   │   ├── user.py              # Esquemas de usuario
│   │   ├── chat.py              # Esquemas de chat
│   │   ├── analysis.py          # Esquemas de análisis
│   │   ├── tutor.py             # Esquemas de tutor
│   │   ├── message.py           # Esquemas de mensajes
│   │   ├── reporte.py           # Esquemas de reportes
│   │   └── analysis_record.py   # Esquemas de registros de análisis
│   │
│   ├── 📁 services/             # Lógica de negocio
│   │   ├── chat_service.py      # Servicio de chat
│   │   ├── analysis_service.py  # Servicio de análisis
│   │   ├── tutor_service.py     # Servicio de tutor
│   │   ├── websocket_service.py # Servicio WebSocket
│   │   ├── reporte_service.py   # Servicio de reportes
│   │   └── user_service.py      # Servicio de usuarios
│   │
│   ├── 📁 notifications/        # Sistema de notificaciones
│   │   └── alerts.py            # Alertas del sistema
│   │
│   ├── 📁 utils/                # Utilidades generales
│   │   ├── logger.py            # Utilidades de logging
│   │   └── text_processing.py   # Procesamiento de texto
│   │
│   ├── 📁 types/                # Tipos personalizados
│   └── create_test_users.py     # Script para crear usuarios de prueba
│
├── 📁 migrations/               # Migraciones de base de datos
│   ├── env.py
│   ├── README
│   ├── script.py.mako
│   └── 📁 versions/             # Archivos de migración
│       └── 004_add_reportes_table.py
│
├── 📁 ml_models/                # Modelos de Machine Learning
│   ├── train_model.py           # Script de entrenamiento
│   ├── 📁 emotion_detection/    # Modelos de detección de emociones
│   │   ├── dataset_emocion.csv
│   │   ├── emotion_model.joblib
│   │   └── train.py
│   └── 📁 style_classification/ # Modelos de clasificación de estilos
│       ├── dataset_estilo.csv
│       ├── style_model.joblib
│       └── train.py
│
├── 📁 tests/                    # Tests automatizados
│   ├── __init__.py
│   ├── conftest.py              # Configuración de pytest
│   ├── README.md
│   ├── test_analysis.py         # Tests de análisis
│   ├── test_auth.py             # Tests de autenticación
│   ├── test_chat.py             # Tests de chat
│   ├── test_database.py         # Tests de base de datos
│   ├── test_integration.py      # Tests de integración
│   ├── test_main.py             # Tests del módulo principal
│   ├── test_services.py         # Tests de servicios
│   └── test_tutor.py            # Tests de tutor
│
├── 📁 logs/                     # Archivos de log
│   ├── access.log               # Logs de acceso
│   ├── debug.log                # Logs de debug
│   ├── debug.log.5              # Logs rotados
│   ├── errors.log               # Logs de errores
│   └── performance.log          # Logs de rendimiento
│
├── 📁 uploads/                  # Archivos subidos por usuarios
├── 📁 temp/                     # Archivos temporales
├── 📄 psichat.db               # Base de datos SQLite (desarrollo)
└── 📁 documentacion_backend/    # Documentación del backend
```

## 🔍 Análisis Detallado por Capa

### 📁 **Capa de Presentación (`app/api/`)**

#### **Estructura de Routes**
```python
# app/api/routes/__init__.py
from . import auth, chat, analysis, tutor, tutor_chat, websocket, reportes

# Organización por funcionalidad
routes = {
    "auth": auth.router,           # Autenticación y autorización
    "chat": chat.router,           # Chat principal con bot
    "analysis": analysis.router,   # Análisis emocional
    "tutor": tutor.router,         # Dashboard y herramientas de tutor
    "tutor_chat": tutor_chat.router, # Chat entre tutor y estudiante
    "websocket": websocket.router, # WebSocket para tiempo real
    "reportes": reportes.router    # Generación de reportes
}
```

#### **Patrón de Endpoints**
```python
# Ejemplo: app/api/routes/auth.py
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Endpoint de autenticación"""
    pass

@router.post("/register")
async def register(user: UserCreate):
    """Endpoint de registro"""
    pass

@router.get("/me")
async def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    pass
```

### 📁 **Capa de Aplicación (`app/services/`)**

#### **Organización de Servicios**
```python
# app/services/chat_service.py
class ChatService:
    """Servicio principal de chat"""
    
    def __init__(self, db: Session):
        self.db = db
        self.analysis_service = AnalysisService(db)
        self.websocket_manager = WebSocketManager()
    
    async def send_message(self, user: Usuario, message: MessageCreate) -> Message:
        """Envía un mensaje y procesa análisis"""
        pass
    
    async def get_chat_history(self, user: Usuario, limit: int = 50) -> List[Message]:
        """Obtiene historial de chat"""
        pass
```

#### **Patrón de Servicios**
- **Inyección de dependencias**: Cada servicio recibe sus dependencias
- **Separación de responsabilidades**: Un servicio por dominio
- **Async/await**: Para operaciones no bloqueantes
- **Manejo de errores**: Excepciones personalizadas

### 📁 **Capa de Dominio (`app/db/models.py`)**

#### **Modelos de Entidad**
```python
# app/db/models.py
class Usuario(Base):
    """Entidad principal de usuario"""
    __tablename__ = "usuarios"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario), default=RolUsuario.ESTUDIANTE)
    
    # Relaciones
    mensajes = relationship("Mensaje", back_populates="usuario")
    analisis = relationship("Analisis", back_populates="usuario")
    
    # Índices para optimización
    __table_args__ = (
        Index('idx_usuario_email', 'email'),
        Index('idx_usuario_rol', 'rol'),
    )
```

#### **Relaciones entre Modelos**
```
Usuario (1) ←→ (N) Mensaje
Mensaje (1) ←→ (1) Analisis
Usuario (1) ←→ (N) Alerta
Usuario (1) ←→ (N) Intervencion
SesionChat (1) ←→ (N) Mensaje
```

### 📁 **Capa de Infraestructura**

#### **Configuración (`app/core/`)**
```python
# app/core/config.py
class Settings(BaseSettings):
    """Configuración centralizada"""
    
    # Configuración de aplicación
    APP_NAME: str = "PsiChat Backend"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Configuración de base de datos
    DATABASE_URL: str = "sqlite:///./psichat.db"
    
    # Configuración de seguridad
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    
    # Configuración de ML
    EMOTION_MODEL_PATH: str = "ml_models/emotion_detection/emotion_model.joblib"
    STYLE_MODEL_PATH: str = "ml_models/style_classification/style_model.joblib"
```

#### **Logging (`app/core/logging.py`)**
```python
# app/core/logging.py
import structlog

# Configuración de logging estructurado
logger = structlog.get_logger()
performance_logger = structlog.get_logger("performance")

def setup_logging():
    """Configura el sistema de logging"""
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
```

## 🔧 Archivos de Configuración

### **requirements.txt**
```txt
# Framework principal
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic>=2.5.0
pydantic-settings>=2.1.0

# Base de datos
sqlalchemy>=2.0.23
alembic>=1.13.1
psycopg2-binary>=2.9.9
redis>=5.0.1

# Autenticación y seguridad
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6

# Machine Learning
scikit-learn>=1.3.2
joblib>=1.3.2
numpy>=1.24.3
pandas>=2.0.3
nltk>=3.8.1

# ... más dependencias
```

### **pytest.ini**
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
    --disable-warnings
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

### **env.example**
```bash
# Configuración de la aplicación
APP_NAME=PsiChat Backend
APP_VERSION=2.0.0
DEBUG=False
ENVIRONMENT=production

# Base de datos
DATABASE_URL=sqlite:///./psichat.db
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Seguridad
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# ... más variables
```

## 🧪 Estructura de Tests

### **Organización de Tests**
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def client():
    """Cliente de prueba para FastAPI"""
    from app.main import app
    return TestClient(app)

@pytest.fixture
def db_session():
    """Sesión de base de datos para tests"""
    engine = create_engine("sqlite:///./test.db")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
```

### **Tipos de Tests**
- **Unit Tests**: Pruebas de funciones individuales
- **Integration Tests**: Pruebas de integración entre componentes
- **API Tests**: Pruebas de endpoints HTTP
- **Database Tests**: Pruebas de operaciones de base de datos

## 📊 Estructura de Logs

### **Tipos de Logs**
```
logs/
├── access.log       # Logs de acceso HTTP
├── debug.log        # Logs de debug y desarrollo
├── errors.log       # Logs de errores y excepciones
├── performance.log  # Logs de rendimiento
└── debug.log.5      # Logs rotados (máximo 5 archivos)
```

### **Configuración de Rotación**
```python
# Rotación automática de logs
LOG_MAX_SIZE = 10 * 1024 * 1024  # 10MB
LOG_BACKUP_COUNT = 5              # Mantener 5 archivos de backup
```

## 🔄 Migraciones de Base de Datos

### **Estructura de Migraciones**
```python
# migrations/versions/004_add_reportes_table.py
"""Add reportes table

Revision ID: 004
Revises: 003
Create Date: 2024-07-13 19:22:00.000000

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    """Crear tabla de reportes"""
    op.create_table(
        'reportes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sesion_id', sa.Integer(), nullable=False),
        sa.Column('tutor_id', sa.Integer(), nullable=False),
        # ... más columnas
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    """Eliminar tabla de reportes"""
    op.drop_table('reportes')
```

## 🧠 Modelos de Machine Learning

### **Estructura de Modelos**
```
ml_models/
├── train_model.py                    # Script principal de entrenamiento
├── emotion_detection/                # Modelos de emociones
│   ├── dataset_emocion.csv          # Dataset de entrenamiento
│   ├── emotion_model.joblib         # Modelo entrenado
│   └── train.py                     # Script de entrenamiento específico
└── style_classification/             # Modelos de estilos
    ├── dataset_estilo.csv           # Dataset de entrenamiento
    ├── style_model.joblib           # Modelo entrenado
    └── train.py                     # Script de entrenamiento específico
```

## 📝 Convenciones de Nomenclatura

### **Archivos y Carpetas**
- **snake_case**: Para archivos Python (`chat_service.py`)
- **kebab-case**: Para carpetas (`ml-models/`)
- **PascalCase**: Para clases (`ChatService`)
- **camelCase**: Para variables y funciones (`sendMessage`)

### **Base de Datos**
- **snake_case**: Para tablas y columnas (`usuarios`, `fecha_creacion`)
- **PascalCase**: Para modelos ORM (`Usuario`, `Mensaje`)
- **UPPER_CASE**: Para constantes (`RolUsuario.ESTUDIANTE`)

### **API Endpoints**
- **kebab-case**: Para rutas (`/api/v1/chat-messages`)
- **snake_case**: Para parámetros (`user_id`, `message_text`)

## 🔒 Consideraciones de Seguridad

### **Archivos Sensibles**
- `.env`: Variables de entorno (no versionado)
- `psichat.db`: Base de datos (no versionado en producción)
- `*.joblib`: Modelos ML (pueden ser grandes)
- `logs/`: Archivos de log (no versionados)

### **Archivos de Configuración**
- `requirements.txt`: Dependencias (versionado)
- `pytest.ini`: Configuración de tests (versionado)
- `env.example`: Ejemplo de variables (versionado)

---

**Versión**: 2.0.0  
**Última actualización**: Julio 2024  
**Organización**: Arquitectura en capas con separación de responsabilidades 