"""
Dependencias compartidas para FastAPI.
"""

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, WebSocket, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import Usuario, RolUsuario, EstadoUsuario
from app.core.security import decode_access_token
from app.core.logging import logger
from app.core import security
from app.db import crud
from jose import JWTError

# Security scheme
security = HTTPBearer()

def get_db() -> Generator:
    """Dependencia para obtener la sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """Dependencia para obtener el usuario actual autenticado."""
    try:
        payload = decode_access_token(credentials.credentials)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Convertir a int de forma segura
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido - ID de usuario malformado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if user.estado != EstadoUsuario.ACTIVO:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario inactivo",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en autenticación: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error de autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_student(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependencia para obtener el estudiante actual."""
    if getattr(current_user, 'rol', None) != RolUsuario.ESTUDIANTE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo estudiantes pueden acceder a este recurso."
        )
    return current_user

def get_current_tutor(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependencia para obtener el tutor actual."""
    user_rol = getattr(current_user, 'rol', None)
    if user_rol not in [RolUsuario.TUTOR, RolUsuario.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo tutores y administradores pueden acceder a este recurso."
        )
    return current_user

def get_current_admin(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependencia para obtener el administrador actual."""
    if getattr(current_user, 'rol', None) != RolUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo administradores pueden acceder a este recurso."
        )
    return current_user

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[Usuario]:
    """Dependencia opcional para obtener el usuario actual (no lanza excepción si no hay token)."""
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None

def get_current_user_ws(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Dependencia para obtener el usuario actual en WebSocket."""
    if not token:
        logger.warning("WebSocket: Token no proporcionado")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token requerido para WebSocket"
        )
    
    try:
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            logger.warning("WebSocket: Token inválido - payload vacío o sin sub")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        user_id = int(payload["sub"])
        user = crud.get_user(db, user_id)
        
        if user is None:
            logger.warning(f"WebSocket: Usuario no encontrado: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )
        
        if user.estado != EstadoUsuario.ACTIVO:
            logger.warning(f"WebSocket: Usuario inactivo: {user_id} (estado: {user.estado})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario inactivo"
            )
        
        logger.info(f"WebSocket: Usuario autenticado correctamente: {user_id}")
        return user
        
    except (JWTError, ValueError) as e:
        logger.warning(f"WebSocket: Error decodificando token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    except Exception as e:
        logger.error(f"WebSocket: Error inesperado en autenticación: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error de autenticación"
        )

__all__ = [
    "get_db",
    "get_current_user", 
    "get_current_student",
    "get_current_tutor",
    "get_current_admin",
    "get_optional_user",
    "get_current_user_ws"
]
