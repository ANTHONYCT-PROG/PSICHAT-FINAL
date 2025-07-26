"""
Archivo principal de arranque para la API de PsiChat.
Incluye configuración de CORS, middleware, manejo de errores y logging.
"""

import time
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

# Cargar el archivo .env
load_dotenv()

def create_directories():
    """Crea los directorios necesarios para la aplicación."""
    directories = [
        Path("logs"),
        Path("ml_models/emotion_detection"),
        Path("ml_models/style_classification"),
        Path("uploads"),
        Path("temp")
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

from fastapi import FastAPI, Request, HTTPException
from fastapi import WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import auth, chat, analysis, tutor, tutor_chat, websocket, reportes
from app.core.config import settings
from app.core.logging import logger, performance_logger
from app.core.exceptions import PsiChatException, handle_psichat_exception, handle_generic_exception

from sqlalchemy import text


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación."""
    # Startup
    logger.info("Iniciando PsiChat Backend...")
    logger.info(f"Entorno: {settings.ENVIRONMENT}")
    logger.info(f"Debug: {settings.DEBUG}")
    logger.info(f"Base de datos: {settings.DATABASE_URL}")
    
    # Crear métricas de inicio solo si no estamos en testing
    if settings.ENVIRONMENT != "testing":
        try:
            from app.db.session import SessionLocal
            from app.db import crud
            
            db = SessionLocal()
            crud.create_metric(
                db, 
                "sistema", 
                "aplicacion_iniciada", 
                1.0, 
                "evento",
                {"timestamp": time.time()}
            )
            db.close()
        except Exception as e:
            logger.error("Error creando métrica de inicio", error=e)
    
    yield
    
    # Shutdown
    logger.info("Cerrando PsiChat Backend...")


# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="API de análisis emocional, estilo comunicativo y chatbot educativo con empatía.",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Middleware de hosts confiables
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configurar hosts específicos en producción
    )

# Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS + ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Middleware para logging de requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware para loggear todas las requests."""
    start_time = time.time()
    
    # Log de la request
    logger.api(f"Request iniciada", {
        "method": request.method,
        "url": str(request.url),
        "client_ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    })
    
    try:
        response = await call_next(request)
        
        # Calcular tiempo de respuesta
        process_time = time.time() - start_time
        
        # Log de la respuesta
        logger.api(f"Request completada", {
            "method": request.method,
            "url": str(request.url),
            "status_code": response.status_code,
            "duration_ms": round(process_time * 1000, 2)
        })
        
        # Crear métrica de rendimiento
        performance_logger.log_request_time(
            str(request.url.path),
            request.method,
            process_time,
            response.status_code
        )
        
        # Agregar header de tiempo de respuesta
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
        
    except Exception as e:
        # Log de error
        process_time = time.time() - start_time
        logger.error(f"Request falló", error=e, data={
            "method": request.method,
            "url": str(request.url),
            "duration_ms": round(process_time * 1000, 2)
        })
        raise


# Middleware para manejo de errores
@app.exception_handler(PsiChatException)
async def psichat_exception_handler(request: Request, exc: PsiChatException):
    """Maneja excepciones personalizadas de PsiChat."""
    logger.error(f"Excepción PsiChat capturada", error=exc, data={
        "method": request.method,
        "url": str(request.url),
        "error_code": exc.error_code
    })
    
    http_exception = handle_psichat_exception(exc)
    return JSONResponse(
        status_code=http_exception.status_code,
        content=http_exception.detail
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Maneja excepciones HTTP de Starlette."""
    logger.error(f"Excepción HTTP capturada", error=exc, data={
        "method": request.method,
        "url": str(request.url),
        "status_code": exc.status_code
    })
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": exc.detail,
            "details": {"status_code": exc.status_code}
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Maneja errores de validación de requests."""
    logger.error(f"Error de validación capturado", error=exc, data={
        "method": request.method,
        "url": str(request.url),
        "errors": exc.errors()
    })
    
    # Limpiar los errores para que sean JSON serializables
    clean_errors = []
    for error in exc.errors():
        clean_error = {
            "type": error["type"],
            "loc": error["loc"],
            "msg": error["msg"],
            "input": error["input"]
        }
        # Convertir el contexto de error a string si contiene objetos no serializables
        if "ctx" in error:
            if isinstance(error["ctx"], dict):
                clean_ctx = {}
                for key, value in error["ctx"].items():
                    if isinstance(value, Exception):
                        clean_ctx[key] = str(value)
                    else:
                        clean_ctx[key] = value
                clean_error["ctx"] = clean_ctx
            else:
                clean_error["ctx"] = str(error["ctx"])
        
        clean_errors.append(clean_error)
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Error de validación en los datos de entrada",
            "details": {
                "errors": clean_errors,
                "body": exc.body
            }
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Maneja excepciones genéricas no capturadas."""
    logger.critical(f"Excepción no manejada capturada", error=exc, data={
        "method": request.method,
        "url": str(request.url),
        "exception_type": type(exc).__name__
    })
    
    http_exception = handle_generic_exception(exc)
    return JSONResponse(
        status_code=http_exception.status_code,
        content=http_exception.detail
    )


# Incluir rutas principales
app.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(analysis.router, prefix="/analysis", tags=["Análisis"])
app.include_router(tutor.router, prefix="/tutor", tags=["Tutor"])
app.include_router(tutor_chat.router, prefix="/tutor-chat", tags=["Chat con Tutor"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
app.include_router(reportes.router, prefix="/reportes", tags=["Reportes"])


# Endpoint WebSocket de prueba directo en main.py
@app.websocket("/ws-main-test")
async def websocket_main_test(websocket: WebSocket):
    """Endpoint WebSocket de prueba directo en main.py para debug."""
    print("=== WebSocket main test endpoint hit ===")
    logger.info("=== WebSocket main test endpoint hit ===")
    
    try:
        await websocket.accept()
        print("=== WebSocket main test: conexión aceptada ===")
        logger.info("=== WebSocket main test: conexión aceptada ===")
        
        await websocket.send_text("WebSocket main test: conexión exitosa")
        await websocket.close()
        
    except Exception as e:
        print(f"ERROR en WebSocket main test: {e}")
        logger.error(f"ERROR en WebSocket main test: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        try:
            await websocket.close(code=1001)
        except:
            pass


# Ruta raíz
@app.get("/")
async def root():
    """Ruta raíz de la API."""
    return {
        "message": f"Bienvenido a {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "running"
    }


# Ruta de health check
@app.get("/health")
async def health_check():
    """Endpoint de health check para monitoreo."""
    try:
        # Verificar conexión a base de datos
        from app.db.session import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "database": "connected",
            "version": settings.APP_VERSION
        }
    except Exception as e:
        logger.error("Health check falló", error=e)
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": time.time(),
                "database": "disconnected",
                "error": str(e)
            }
        )


# Ruta de información del sistema
@app.get("/info")
async def system_info():
    """Información del sistema para debugging."""
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "database_url": settings.DATABASE_URL.split("://")[0] + "://***",  # Ocultar detalles sensibles
        "allowed_origins": settings.ALLOWED_ORIGINS,
        "features": {
            "analysis_enabled": True,
            "chat_enabled": True,
            "notifications_enabled": settings.NOTIFICATIONS_ENABLED,
            "cache_enabled": settings.CACHE_ENABLED,
            "metrics_enabled": settings.ENABLE_METRICS
        }
    }


# Ruta de métricas (solo en desarrollo)
@app.get("/metrics")
async def get_metrics():
    """Endpoint para obtener métricas del sistema."""
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    
    try:
        from app.db.session import SessionLocal
        from app.db.models import Metricas
        
        db = SessionLocal()
        metrics = db.query(Metricas).order_by(Metricas.creado_en.desc()).limit(50).all()
        db.close()
        
        return {
            "metrics": [
                {
                    "id": m.id,
                    "tipo": m.tipo_metrica,
                    "nombre": m.nombre,
                    "valor": m.valor,
                    "unidad": m.unidad,
                    "creado_en": m.creado_en.isoformat()
                }
                for m in metrics
            ]
        }
    except Exception as e:
        logger.error("Error obteniendo métricas", error=e)
        raise HTTPException(status_code=500, detail="Error obteniendo métricas")


def start_uvicorn():
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )

if __name__ == "__main__":
    start_uvicorn()

