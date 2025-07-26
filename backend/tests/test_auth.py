"""
Tests para el sistema de autenticación.
"""

import pytest
from fastapi import status
from app.db.models import RolUsuario

class TestAuth:
    """Tests para endpoints de autenticación."""
    
    def test_register_user_success(self, client):
        """Test registro exitoso de usuario."""
        user_data = {
            "email": "nuevo@test.com",
            "nombre": "Nuevo Usuario",
            "password": "test123456"
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["nombre"] == user_data["nombre"]
        assert "id" in data
        assert "password" not in data  # No debe devolver la contraseña
    
    def test_register_user_duplicate_email(self, client, test_student):
        """Test registro con email duplicado."""
        user_data = {
            "email": test_student.email,  # Email ya existente
            "nombre": "Otro Usuario",
            "password": "test123456"
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "message" in data
        assert "ya está registrado" in data["message"]
    
    def test_register_user_invalid_password(self, client):
        """Test registro con contraseña inválida."""
        user_data = {
            "email": "nuevo@test.com",
            "nombre": "Nuevo Usuario",
            "password": "123"  # Contraseña muy corta
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert "error" in data
        assert data["error"] == "VALIDATION_ERROR"
    
    def test_login_success(self, client, test_student):
        """Test login exitoso."""
        login_data = {
            "username": test_student.email,
            "password": "test123"
        }
        
        response = client.post("/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == test_student.email
    
    def test_login_invalid_credentials(self, client):
        """Test login con credenciales inválidas."""
        login_data = {
            "username": "noexiste@test.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "message" in data
        assert "incorrectas" in data["message"]
    
    def test_get_current_user_profile(self, client, auth_headers_student):
        """Test obtener perfil del usuario actual."""
        response = client.get("/auth/me", headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "email" in data
        assert "nombre" in data
        assert "id" in data
    
    def test_get_current_user_invalid_token(self, client):
        """Test obtener perfil con token inválido."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_users_by_role_tutor_access(self, client, auth_headers_tutor):
        """Test obtener usuarios por rol (acceso de tutor)."""
        response = client.get("/auth/users/estudiante", headers=auth_headers_tutor)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_users_by_role_student_access_denied(self, client, auth_headers_student):
        """Test obtener usuarios por rol (acceso denegado para estudiante)."""
        response = client.get("/auth/users/estudiante", headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_all_students_tutor_access(self, client, auth_headers_tutor):
        """Test obtener todos los estudiantes (acceso de tutor)."""
        response = client.get("/auth/students", headers=auth_headers_tutor)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_all_students_student_access_denied(self, client, auth_headers_student):
        """Test obtener todos los estudiantes (acceso denegado para estudiante)."""
        response = client.get("/auth/students", headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN 