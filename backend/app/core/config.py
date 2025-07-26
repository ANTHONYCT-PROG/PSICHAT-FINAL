"""
Configuración central de PsiChat Backend.
Lee variables de entorno desde `.env` usando `python-dotenv`.
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
from pathlib import Path
from dotenv import load_dotenv

# La carga de .env se manejará en main.py


class Settings(BaseSettings):
    """Configuración de la aplicación usando Pydantic para validación."""
    
    model_config = ConfigDict(case_sensitive=True)
    
    # Configuración de la aplicación
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
    SECRET_KEY: str = "psichat-2024-<algún_valor_aleatorio>"
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

    # Configuración de Gemini (único servicio AI)
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
    
    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v):
        if not v:
            raise ValueError("DATABASE_URL no puede estar vacía")
        return v
    
    @field_validator("GEMINI_API_KEY")
    @classmethod
    def validate_gemini_api_key(cls, v):
        if not v:
            raise ValueError("GEMINI_API_KEY es requerida para el funcionamiento del chat")
        return v


# Instancia global de configuración
settings = Settings()

# Configuración específica por entorno
if settings.ENVIRONMENT == "development":
    settings.DEBUG = True
    settings.LOG_LEVEL = "INFO"  # Changed from "DEBUG" to "INFO"
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

elif settings.ENVIRONMENT == "testing":
    settings.DEBUG = True
    settings.DATABASE_URL = "sqlite:///./test.db"
    settings.LOG_LEVEL = "WARNING"
    settings.CACHE_ENABLED = False
    settings.NOTIFICATIONS_ENABLED = False
    # En testing, permitir API key vacía para usar mock
    settings.GEMINI_API_KEY = "test-key"


