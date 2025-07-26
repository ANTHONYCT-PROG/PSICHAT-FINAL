"""
Schemas de Pydantic para usuarios.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from app.db.models import RolUsuario, EstadoUsuario


class UserBase(BaseModel):
    """Schema base para usuarios."""
    email: EmailStr
    nombre: str
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[datetime] = None
    genero: Optional[str] = None
    institucion: Optional[str] = None
    grado_academico: Optional[str] = None
    configuraciones: Optional[Dict[str, Any]] = None


class UserCreate(UserBase):
    """Schema para crear un usuario."""
    password: str
    rol: RolUsuario = RolUsuario.ESTUDIANTE

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v


class UserUpdate(BaseModel):
    """Schema para actualizar un usuario."""
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[datetime] = None
    genero: Optional[str] = None
    institucion: Optional[str] = None
    grado_academico: Optional[str] = None
    configuraciones: Optional[Dict[str, Any]] = None


class UserInDB(UserBase):
    """Schema para usuario en base de datos."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    rol: RolUsuario
    estado: EstadoUsuario
    creado_en: datetime
    actualizado_en: datetime
    ultimo_acceso: Optional[datetime] = None


class User(UserInDB):
    """Schema para respuesta de usuario (sin información sensible)."""
    pass


class UserLogin(BaseModel):
    """Schema para login de usuario."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema para token de autenticación."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Schema para datos del token."""
    email: Optional[str] = None
    user_id: Optional[int] = None
    rol: Optional[str] = None


class UserOut(User):
    """Schema para respuesta de usuario (alias de User para compatibilidad)."""
    pass


class UserLoginResponse(BaseModel):
    """Schema para respuesta de login."""
    model_config = ConfigDict()
    
    access_token: str
    token_type: str = "bearer"
    user: User
