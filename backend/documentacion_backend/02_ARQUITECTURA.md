# 🏗️ ARQUITECTURA DEL BACKEND - PSICHAT V2

## 📐 Arquitectura General

PsiChat V2 utiliza una **arquitectura en capas** con separación clara de responsabilidades, siguiendo principios de **Clean Architecture** y **Domain-Driven Design**. La arquitectura está diseñada para ser **escalable**, **mantenible** y **testeable**.

## 🏛️ Patrón Arquitectónico

### **Arquitectura en Capas**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   FastAPI   │ │  WebSocket  │ │   Middleware│ │  CORS   │ │
│  │   Routes    │ │   Handlers  │ │   & Auth    │ │  & CORS │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Services  │ │   Handlers  │ │  Validators │ │Schemas  │ │
│  │   (Business │ │  (Request   │ │  (Data      │ │(DTOs)   │ │
│  │    Logic)   │ │   Flow)     │ │ Validation) │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Models    │ │  Entities   │ │  Value      │ │Business │ │
│  │   (ORM)     │ │  (Domain    │ │  Objects    │ │ Rules   │ │
│  │             │ │  Objects)   │ │             │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │  Database   │ │   External  │ │   File      │ │ Logging │ │
│  │  (SQLAlchemy│ │   APIs      │ │   System    │ │ & Cache │ │
│  │   & CRUD)   │ │  (Gemini)   │ │   (Uploads) │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Componentes Arquitectónicos

### 1. **Presentation Layer (Capa de Presentación)**

#### **FastAPI Application**
```python
# main.py - Punto de entrada principal
app = FastAPI(
    title=settings.APP_NAME,
    description="API de análisis emocional y chatbot educativo",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)
```

#### **Middleware Stack**
```python
# Middleware de seguridad y logging
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS)
```

#### **Route Organization**
```
app/api/routes/
├── auth.py          # Autenticación y autorización
├── chat.py          # Endpoints de chat
├── analysis.py      # Análisis emocional
├── tutor.py         # Funcionalidades de tutor
├── tutor_chat.py    # Chat entre tutor y estudiante
├── websocket.py     # WebSocket handlers
└── reportes.py      # Generación de reportes
```

### 2. **Application Layer (Capa de Aplicación)**

#### **Services (Lógica de Negocio)**
```python
# app/services/
├── chat_service.py      # Lógica de chat y mensajes
├── analysis_service.py  # Análisis emocional y estilos
├── tutor_service.py     # Funcionalidades de tutor
├── websocket_service.py # Gestión de WebSockets
├── reporte_service.py   # Generación de reportes
└── user_service.py      # Gestión de usuarios
```

#### **Dependencies (Inyección de Dependencias)**
```python
# app/dependencies.py
def get_current_user(token: str = Depends(oauth2_scheme)) -> Usuario:
    """Obtiene el usuario actual desde el token JWT"""
    pass

def get_db() -> Session:
    """Proporciona una sesión de base de datos"""
    pass
```

#### **Schemas (DTOs)**
```python
# app/schemas/
├── user.py         # Esquemas de usuario
├── chat.py         # Esquemas de chat
├── analysis.py     # Esquemas de análisis
├── tutor.py        # Esquemas de tutor
├── message.py      # Esquemas de mensajes
└── reporte.py      # Esquemas de reportes
```

### 3. **Domain Layer (Capa de Dominio)**

#### **Models (Entidades de Dominio)**
```python
# app/db/models.py
class Usuario(Base):
    """Entidad principal de usuario"""
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    nombre = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario), default=RolUsuario.ESTUDIANTE)
    # ... más campos

class Mensaje(Base):
    """Entidad de mensaje"""
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    texto = Column(Text, nullable=False)
    remitente = Column(String(50), default="user")
    # ... más campos
```

#### **Enums y Value Objects**
```python
class RolUsuario(enum.Enum):
    ESTUDIANTE = "estudiante"
    TUTOR = "tutor"
    ADMIN = "admin"

class EstadoUsuario(enum.Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"
```

### 4. **Infrastructure Layer (Capa de Infraestructura)**

#### **Database (Persistencia)**
```python
# app/db/
├── session.py      # Configuración de sesiones
├── models.py       # Modelos ORM
├── crud.py         # Operaciones CRUD
└── __init__.py     # Inicialización
```

#### **External Services (Servicios Externos)**
```python
# Integración con Gemini AI
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
```

#### **File System (Sistema de Archivos)**
```python
# Directorios de la aplicación
directories = [
    Path("logs"),
    Path("ml_models/emotion_detection"),
    Path("ml_models/style_classification"),
    Path("uploads"),
    Path("temp")
]
```

## 🔄 Flujo de Datos Arquitectónico

### **Flujo de Request HTTP**

```
1. Request HTTP → FastAPI Router
2. Middleware (CORS, Auth, Logging)
3. Route Handler → Service Layer
4. Service → Domain Logic
5. Domain → Infrastructure (DB, External APIs)
6. Response ← Infrastructure ← Domain ← Service ← Handler
```

### **Flujo de WebSocket**

```
1. WebSocket Connection → WebSocket Handler
2. Authentication → Service Layer
3. Real-time Processing → Domain Logic
4. Database Operations → Infrastructure
5. Broadcast → Other Connected Clients
```

### **Flujo de Análisis ML**

```
1. Message Input → Chat Service
2. Preprocessing → Analysis Service
3. ML Models → Emotion/Style Detection
4. Gemini AI → Response Generation
5. Storage → Database
6. Alerts → Notification System
```

## 🏗️ Patrones de Diseño Utilizados

### **1. Dependency Injection**
```python
def get_chat_service(db: Session = Depends(get_db)) -> ChatService:
    return ChatService(db)

@router.post("/chat")
async def send_message(
    message: MessageCreate,
    current_user: Usuario = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    return await chat_service.send_message(current_user, message)
```

### **2. Repository Pattern**
```python
# app/db/crud.py
class UserRepository:
    def get_by_email(self, db: Session, email: str) -> Optional[Usuario]:
        return db.query(Usuario).filter(Usuario.email == email).first()
    
    def create(self, db: Session, user: UsuarioCreate) -> Usuario:
        db_user = Usuario(**user.dict())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
```

### **3. Service Layer Pattern**
```python
# app/services/chat_service.py
class ChatService:
    def __init__(self, db: Session):
        self.db = db
    
    async def send_message(self, user: Usuario, message: MessageCreate) -> Message:
        # Lógica de negocio para enviar mensaje
        pass
    
    async def get_chat_history(self, user: Usuario, limit: int = 50) -> List[Message]:
        # Lógica para obtener historial
        pass
```

### **4. Observer Pattern (WebSocket)**
```python
# app/services/websocket_service.py
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
```

### **5. Factory Pattern (ML Models)**
```python
# app/services/analysis_service.py
class MLModelFactory:
    @staticmethod
    def get_emotion_model() -> EmotionModel:
        return joblib.load(settings.EMOTION_MODEL_PATH)
    
    @staticmethod
    def get_style_model() -> StyleModel:
        return joblib.load(settings.STYLE_MODEL_PATH)
```

## 🔒 Patrones de Seguridad

### **1. JWT Authentication**
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

### **2. Role-Based Authorization**
```python
def require_role(required_role: RolUsuario):
    def role_checker(current_user: Usuario = Depends(get_current_user)):
        if current_user.rol != required_role:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para acceder a este recurso"
            )
        return current_user
    return role_checker
```

### **3. Input Validation**
```python
# app/schemas/user.py
class UserCreate(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v
```

## 📊 Patrones de Monitoreo

### **1. Structured Logging**
```python
# app/core/logging.py
logger = structlog.get_logger()

def log_request(request: Request, response: Response, duration: float):
    logger.info("Request processed", {
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "duration_ms": round(duration * 1000, 2)
    })
```

### **2. Metrics Collection**
```python
# app/core/monitoring.py
class PerformanceLogger:
    def log_request_time(self, endpoint: str, method: str, duration: float, status_code: int):
        # Registrar métricas de rendimiento
        pass
```

### **3. Error Handling**
```python
@app.exception_handler(PsiChatException)
async def psichat_exception_handler(request: Request, exc: PsiChatException):
    logger.error("PsiChat exception", error=exc, data={
        "method": request.method,
        "url": str(request.url),
        "error_code": exc.error_code
    })
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail
    )
```

## 🔄 Patrones de Concurrencia

### **1. Async/Await Pattern**
```python
@router.post("/chat")
async def send_message(message: MessageCreate, current_user: Usuario = Depends(get_current_user)):
    # Operación asíncrona para procesar mensaje
    result = await chat_service.process_message_async(current_user, message)
    return result
```

### **2. Background Tasks**
```python
@router.post("/analysis")
async def analyze_message(
    message_id: int,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(get_current_user)
):
    # Tarea en segundo plano para análisis
    background_tasks.add_task(analysis_service.analyze_message_async, message_id)
    return {"message": "Análisis iniciado en segundo plano"}
```

## 🎯 Principios de Diseño Aplicados

### **1. SOLID Principles**
- **Single Responsibility**: Cada clase tiene una responsabilidad única
- **Open/Closed**: Extensible sin modificar código existente
- **Liskov Substitution**: Interfaces intercambiables
- **Interface Segregation**: Interfaces específicas y pequeñas
- **Dependency Inversion**: Dependencias de abstracciones, no implementaciones

### **2. DRY (Don't Repeat Yourself)**
- Código reutilizable en servicios y utilidades
- Schemas compartidos para validación
- Middleware común para funcionalidades repetitivas

### **3. KISS (Keep It Simple, Stupid)**
- APIs simples y intuitivas
- Lógica de negocio clara y directa
- Estructura de archivos organizada

### **4. YAGNI (You Aren't Gonna Need It)**
- Solo implementar funcionalidades necesarias
- Evitar over-engineering
- Mantener el código simple y mantenible

---

**Versión**: 2.0.0  
**Última actualización**: Julio 2024  
**Arquitecto**: Sistema de documentación automática 