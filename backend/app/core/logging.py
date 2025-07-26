"""
Sistema de logging optimizado para PsiChat Backend.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
import json
from functools import wraps
import traceback
from app.core.config import settings
import os


class PsiChatLogger:
    """Logger optimizado para PsiChat con niveles apropiados para producción."""
    
    def __init__(self, name: str = "psichat"):
        self.logger = logging.getLogger(name)
        # Usar INFO como nivel por defecto para reducir ruido
        log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
        self.logger.setLevel(log_level)
        
        # Evitar duplicación de handlers
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Configura los handlers optimizados para diferentes niveles de logging."""
        
        from logging.handlers import RotatingFileHandler

        log_dir = Path(settings.LOG_FILE_PATH)
        log_dir.mkdir(parents=True, exist_ok=True)

        # Formatter simplificado para mejor rendimiento
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        detailed_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )

        # NO configurar handler para consola - solo archivos
        # Esto permite que solo Uvicorn muestre logs en consola

        # Handler para archivo de errores
        try:
            error_handler = RotatingFileHandler(
                log_dir / "errors.log",
                maxBytes=settings.LOG_MAX_SIZE,
                backupCount=settings.LOG_BACKUP_COUNT,
                delay=True
            )
            error_handler.setLevel(logging.ERROR)
            error_handler.setFormatter(detailed_formatter)
            self.logger.addHandler(error_handler)
        except Exception as e:
            print(f"Warning: No se pudo configurar error log file: {e}")
        
        # Handler para archivo de debug - solo si LOG_LEVEL es DEBUG
        if settings.LOG_LEVEL.upper() == "DEBUG":
            try:
                debug_handler = RotatingFileHandler(
                    log_dir / "debug.log",
                    maxBytes=settings.LOG_MAX_SIZE,
                    backupCount=settings.LOG_BACKUP_COUNT,
                    delay=True
                )
                debug_handler.setLevel(logging.DEBUG)
                debug_handler.setFormatter(detailed_formatter)
                self.logger.addHandler(debug_handler)
            except Exception as e:
                print(f"Warning: No se pudo configurar debug log file: {e}")

        # Handler para archivo de acceso - solo requests importantes
        try:
            access_handler = RotatingFileHandler(
                log_dir / "access.log",
                maxBytes=settings.LOG_MAX_SIZE,
                backupCount=settings.LOG_BACKUP_COUNT,
                delay=True
            )
            access_handler.setLevel(logging.INFO)
            access_handler.setFormatter(formatter)
            self.logger.addHandler(access_handler)
        except Exception as e:
            print(f"Warning: No se pudo configurar access log file: {e}")
    
    def debug(self, message: str, data: Optional[dict] = None):
        """Log de debug - solo si está habilitado."""
        if self.logger.isEnabledFor(logging.DEBUG):
            if data:
                message = f"{message} | Data: {json.dumps(data, default=str)}"
            self.logger.debug(message)
    
    def info(self, message: str, data: Optional[dict] = None):
        """Log de información - optimizado."""
        if data:
            # Solo incluir datos importantes, no todo
            filtered_data = {k: v for k, v in data.items() 
                           if k not in ['args', 'kwargs', 'traceback']}
            if filtered_data:
                message = f"{message} | Data: {json.dumps(filtered_data, default=str)}"
        self.logger.info(message)
    
    def warning(self, message: str, data: Optional[dict] = None):
        """Log de advertencia."""
        if data:
            message = f"{message} | Data: {json.dumps(data, default=str)}"
        self.logger.warning(message)
    
    def error(self, message: str, error: Optional[Exception] = None, data: Optional[dict] = None):
        """Log de error - con información completa."""
        if error:
            message = f"{message} | Error: {str(error)}"
            if settings.DEBUG:
                message = f"{message} | Traceback: {traceback.format_exc()}"
        if data:
            message = f"{message} | Data: {json.dumps(data, default=str)}"
        self.logger.error(message)
    
    def critical(self, message: str, error: Optional[Exception] = None, data: Optional[dict] = None):
        """Log crítico - siempre con traceback completo."""
        if error:
            message = f"{message} | Error: {str(error)} | Traceback: {traceback.format_exc()}"
        if data:
            message = f"{message} | Data: {json.dumps(data, default=str)}"
        self.logger.critical(message)
    
    # Métodos específicos por categoría - optimizados
    def auth(self, message: str, data: Optional[dict] = None):
        """Log específico para autenticación - solo eventos importantes."""
        if "login" in message.lower() or "logout" in message.lower() or "failed" in message.lower():
            self.info(f"[AUTH] {message}", data)
    
    def api(self, message: str, data: Optional[dict] = None):
        """Log específico para API - solo requests importantes."""
        # Solo loggear requests que no sean OPTIONS o health checks
        if data and 'method' in data:
            if data['method'] not in ['OPTIONS'] and 'health' not in str(data).lower():
                self.info(f"[API] {message}", data)
        else:
            self.info(f"[API] {message}", data)
    
    def db(self, message: str, data: Optional[dict] = None):
        """Log específico para base de datos - solo operaciones críticas."""
        if "error" in message.lower() or "failed" in message.lower():
            self.error(f"[DB] {message}", data=data)
        elif "connection" in message.lower():
            self.info(f"[DB] {message}", data)
    
    def analysis(self, message: str, data: Optional[dict] = None):
        """Log específico para análisis - solo resultados importantes."""
        if "completed" in message.lower() or "error" in message.lower():
            self.info(f"[ANALYSIS] {message}", data)
    
    def chat(self, message: str, data: Optional[dict] = None):
        """Log específico para chat - solo eventos importantes."""
        if "session" in message.lower() or "error" in message.lower():
            self.info(f"[CHAT] {message}", data)
    
    def security(self, message: str, data: Optional[dict] = None):
        """Log específico para seguridad - siempre importante."""
        self.warning(f"[SECURITY] {message}", data)


# Instancia global del logger
logger = PsiChatLogger()


def log_function_call(func):
    """Decorador para loggear llamadas a funciones - solo en DEBUG."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        if settings.LOG_LEVEL.upper() == "DEBUG":
            logger.debug(f"Calling {func.__name__}")
        try:
            result = func(*args, **kwargs)
            if settings.LOG_LEVEL.upper() == "DEBUG":
                logger.debug(f"Function {func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"Function {func.__name__} failed", error=e)
            raise
    return wrapper


def log_api_request(func):
    """Decorador para loggear requests de API - optimizado."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Solo loggear requests importantes
        if settings.LOG_LEVEL.upper() == "DEBUG":
            logger.api(f"API Request: {func.__name__}")
        try:
            result = await func(*args, **kwargs)
            if settings.LOG_LEVEL.upper() == "DEBUG":
                logger.api(f"API Response: {func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"API Error: {func.__name__} failed", error=e)
            raise
    return wrapper


def log_database_operation(func):
    """Decorador para loggear operaciones de base de datos - solo errores."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            logger.error(f"Database Error: {func.__name__} failed", error=e)
            raise
    return wrapper


class PerformanceLogger:
    """Logger optimizado para métricas de rendimiento."""
    
    def __init__(self):
        self.logger = logging.getLogger("performance")
        self.logger.setLevel(logging.INFO)
        
        # NO configurar handler para consola - solo archivos
        # Esto permite que solo Uvicorn muestre logs en consola
        
        # Configurar handler para archivo de performance
        try:
            from logging.handlers import RotatingFileHandler
            log_dir = Path(settings.LOG_FILE_PATH)
            log_dir.mkdir(parents=True, exist_ok=True)
            
            performance_handler = RotatingFileHandler(
                log_dir / "performance.log",
                maxBytes=settings.LOG_MAX_SIZE,
                backupCount=settings.LOG_BACKUP_COUNT,
                delay=True
            )
            performance_handler.setLevel(logging.INFO)
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            performance_handler.setFormatter(formatter)
            self.logger.addHandler(performance_handler)
        except Exception as e:
            print(f"Warning: No se pudo configurar performance log file: {e}")
    
    def log_request_time(self, endpoint: str, method: str, duration: float, status_code: int):
        """Log de tiempo de request - solo si es lento o error."""
        if duration > 1000 or status_code >= 400:  # Solo requests lentos o errores
            self.logger.info(f"Request Performance | Data: {{\"endpoint\": \"{endpoint}\", \"method\": \"{method}\", \"duration_ms\": {duration:.2f}, \"status_code\": {status_code}}}")
    
    def log_database_query_time(self, query: str, duration: float):
        """Log de tiempo de query - solo si es lento."""
        if duration > 100:  # Solo queries lentas
            self.logger.info(f"Database Query Performance | Data: {{\"query\": \"{query[:50]}...\", \"duration_ms\": {duration:.2f}}}")
    
    def log_analysis_time(self, analysis_type: str, duration: float):
        """Log de tiempo de análisis - solo si es lento."""
        if duration > 500:  # Solo análisis lentos
            self.logger.info(f"Analysis Performance | Data: {{\"type\": \"{analysis_type}\", \"duration_ms\": {duration:.2f}}}")

# Instancia global del performance logger
performance_logger = PerformanceLogger() 