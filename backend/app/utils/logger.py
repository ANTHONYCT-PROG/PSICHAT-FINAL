"""
Utilidades de logging personalizadas para PsiChat.
"""

import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path

class PsiChatLogger:
    """Logger personalizado para PsiChat con diferentes niveles y formatos."""
    
    def __init__(self, name: str = "psichat", log_file: Optional[str] = None):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)  # Changed from DEBUG to INFO
        
        # Evitar duplicar handlers
        if not self.logger.handlers:
            self._setup_handlers(log_file)
    
    def _setup_handlers(self, log_file: Optional[str] = None):
        """Configura los handlers para el logger."""
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Handler para consola
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # Handler para archivo si se especifica
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(logging.DEBUG)
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
    
    def debug(self, message: str, **kwargs):
        """Log de nivel debug."""
        self.logger.debug(self._format_message(message, **kwargs))
    
    def info(self, message: str, **kwargs):
        """Log de nivel info."""
        self.logger.info(self._format_message(message, **kwargs))
    
    def warning(self, message: str, **kwargs):
        """Log de nivel warning."""
        self.logger.warning(self._format_message(message, **kwargs))
    
    def error(self, message: str, **kwargs):
        """Log de nivel error."""
        self.logger.error(self._format_message(message, **kwargs))
    
    def critical(self, message: str, **kwargs):
        """Log de nivel critical."""
        self.logger.critical(self._format_message(message, **kwargs))
    
    def _format_message(self, message: str, **kwargs) -> str:
        """Formatea el mensaje con datos adicionales."""
        if kwargs:
            extra_data = " | ".join([f"{k}={v}" for k, v in kwargs.items()])
            return f"{message} | {extra_data}"
        return message

class PerformanceLogger:
    """Logger especializado para métricas de rendimiento."""
    
    def __init__(self, log_file: Optional[str] = None):
        self.logger = PsiChatLogger("performance", log_file)
    
    def log_request_time(self, endpoint: str, method: str, duration: float, status_code: int):
        """Registra el tiempo de respuesta de una request."""
        self.logger.info(
            "Request performance",
            endpoint=endpoint,
            method=method,
            duration_ms=round(duration * 1000, 2),
            status_code=status_code
        )
    
    def log_database_query(self, query: str, duration: float):
        """Registra el tiempo de ejecución de una consulta de base de datos."""
        self.logger.info(
            "Database query",
            query=query[:100] + "..." if len(query) > 100 else query,
            duration_ms=round(duration * 1000, 2)
        )
    
    def log_ml_prediction(self, model: str, duration: float, accuracy: Optional[float] = None):
        """Registra el tiempo de predicción de un modelo de ML."""
        data = {
            "model": model,
            "duration_ms": round(duration * 1000, 2)
        }
        if accuracy is not None:
            data["accuracy"] = round(accuracy, 4)
        
        self.logger.info("ML prediction", **data)

# Instancias globales
def get_logger(name: str = "psichat") -> PsiChatLogger:
    """Obtiene una instancia del logger."""
    return PsiChatLogger(name)

def get_performance_logger() -> PerformanceLogger:
    """Obtiene una instancia del logger de rendimiento."""
    return PerformanceLogger()

# Logger principal de la aplicación
app_logger = get_logger("psichat")
performance_logger = get_performance_logger()
