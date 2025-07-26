"""
Sistema de manejo de excepciones personalizadas para PsiChat.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from enum import Enum


class ErrorCode(Enum):
    """Códigos de error estandarizados."""
    # Errores de autenticación
    INVALID_CREDENTIALS = "AUTH_001"
    TOKEN_EXPIRED = "AUTH_002"
    INVALID_TOKEN = "AUTH_003"
    INSUFFICIENT_PERMISSIONS = "AUTH_004"
    
    # Errores de validación
    VALIDATION_ERROR = "VAL_001"
    INVALID_EMAIL = "VAL_002"
    INVALID_PASSWORD = "VAL_003"
    REQUIRED_FIELD_MISSING = "VAL_004"
    
    # Errores de base de datos
    DATABASE_ERROR = "DB_001"
    RECORD_NOT_FOUND = "DB_002"
    DUPLICATE_RECORD = "DB_003"
    CONSTRAINT_VIOLATION = "DB_004"
    
    # Errores de análisis
    ANALYSIS_ERROR = "ANALYSIS_001"
    MODEL_NOT_LOADED = "ANALYSIS_002"
    INVALID_TEXT_INPUT = "ANALYSIS_003"
    PROCESSING_TIMEOUT = "ANALYSIS_004"
    
    # Errores de chat
    CHAT_ERROR = "CHAT_001"
    SESSION_NOT_FOUND = "CHAT_002"
    MESSAGE_TOO_LONG = "CHAT_003"
    RATE_LIMIT_EXCEEDED = "CHAT_004"
    
    # Errores de sistema
    INTERNAL_ERROR = "SYS_001"
    EXTERNAL_SERVICE_ERROR = "SYS_002"
    CONFIGURATION_ERROR = "SYS_003"
    RESOURCE_UNAVAILABLE = "SYS_004"


class PsiChatException(Exception):
    """Excepción base personalizada para PsiChat."""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        self.context = context or {}
        super().__init__(self.message)


class AuthenticationError(PsiChatException):
    """Error de autenticación."""
    
    def __init__(self, message: str = "Error de autenticación", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.INVALID_CREDENTIALS,
            status_code=status.HTTP_401_UNAUTHORIZED,
            **kwargs
        )


class AuthorizationError(PsiChatException):
    """Error de autorización."""
    
    def __init__(self, message: str = "No tienes permisos para realizar esta acción", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            status_code=status.HTTP_403_FORBIDDEN,
            **kwargs
        )


class ValidationError(PsiChatException):
    """Error de validación."""
    
    def __init__(self, message: str = "Error de validación", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.VALIDATION_ERROR,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            **kwargs
        )


class DatabaseError(PsiChatException):
    """Error de base de datos."""
    
    def __init__(self, message: str = "Error de base de datos", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.DATABASE_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            **kwargs
        )


class NotFoundError(PsiChatException):
    """Error de recurso no encontrado."""
    
    def __init__(self, message: str = "Recurso no encontrado", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.RECORD_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
            **kwargs
        )


class AnalysisError(PsiChatException):
    """Error de análisis."""
    
    def __init__(self, message: str = "Error en el análisis", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.ANALYSIS_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            **kwargs
        )


class ChatError(PsiChatException):
    """Error de chat."""
    
    def __init__(self, message: str = "Error en el chat", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.CHAT_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            **kwargs
        )


class RateLimitError(PsiChatException):
    """Error de límite de tasa."""
    
    def __init__(self, message: str = "Límite de tasa excedido", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.RATE_LIMIT_EXCEEDED,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            **kwargs
        )


def handle_psichat_exception(exc: PsiChatException) -> HTTPException:
    """Convierte una excepción PsiChat en HTTPException."""
    return HTTPException(
        status_code=exc.status_code,
        detail={
            "error": exc.error_code.value,
            "message": exc.message,
            "details": exc.details,
            "context": exc.context
        }
    )


def handle_generic_exception(exc: Exception) -> HTTPException:
    """Maneja excepciones genéricas."""
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={
            "error": ErrorCode.INTERNAL_ERROR.value,
            "message": "Error interno del servidor",
            "details": {"type": type(exc).__name__},
            "context": {"original_message": str(exc)}
        }
    )


# Funciones de utilidad para crear excepciones comunes
def create_validation_error(field: str, message: str, **kwargs) -> ValidationError:
    """Crea un error de validación para un campo específico."""
    return ValidationError(
        message=f"Error de validación en {field}: {message}",
        details={"field": field, "message": message},
        **kwargs
    )


def create_not_found_error(resource: str, resource_id: Any, **kwargs) -> NotFoundError:
    """Crea un error de recurso no encontrado."""
    return NotFoundError(
        message=f"{resource} con ID {resource_id} no encontrado",
        details={"resource": resource, "resource_id": resource_id},
        **kwargs
    )


def create_analysis_error(operation: str, reason: str, **kwargs) -> AnalysisError:
    """Crea un error de análisis."""
    return AnalysisError(
        message=f"Error en análisis durante {operation}: {reason}",
        details={"operation": operation, "reason": reason},
        **kwargs
    ) 