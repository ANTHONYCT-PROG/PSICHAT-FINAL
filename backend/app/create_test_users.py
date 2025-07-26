"""
Script para crear usuarios de prueba en la base de datos.
"""

from app.db.session import SessionLocal
from app.db.models import Usuario, RolUsuario
from app.core.security import get_password_hash
from app.core.logging import logger

def create_test_users():
    """Crea usuarios de prueba en la base de datos."""
    db = SessionLocal()
    
    try:
        # Verificar si ya existen usuarios de prueba
        existing_users = db.query(Usuario).filter(
            Usuario.email.like("%@test.com")
        ).count()
        
        if existing_users > 0:
            logger.info(f"Ya existen {existing_users} usuarios de prueba")
            return
        
        # Crear estudiantes de prueba
        estudiantes = [
            {
                "nombre": "Ana García",
                "email": "ana.garcia@test.com",
                "password": "test123",
                "rol": RolUsuario.ESTUDIANTE
            },
            {
                "nombre": "Carlos López",
                "email": "carlos.lopez@test.com", 
                "password": "test123",
                "rol": RolUsuario.ESTUDIANTE
            },
            {
                "nombre": "María Rodríguez",
                "email": "maria.rodriguez@test.com",
                "password": "test123", 
                "rol": RolUsuario.ESTUDIANTE
            },
            {
                "nombre": "Juan Pérez",
                "email": "juan.perez@test.com",
                "password": "test123",
                "rol": RolUsuario.ESTUDIANTE
            }
        ]
        
        # Crear tutores de prueba
        tutores = [
            {
                "nombre": "Dr. Roberto Silva",
                "email": "roberto.silva@test.com",
                "password": "tutor123",
                "rol": RolUsuario.TUTOR
            },
            {
                "nombre": "Dra. Laura Martínez",
                "email": "laura.martinez@test.com", 
                "password": "tutor123",
                "rol": RolUsuario.TUTOR
            }
        ]
        
        # Crear administrador de prueba
        admin = {
            "nombre": "Admin Sistema",
            "email": "admin@test.com",
            "password": "admin123",
            "rol": RolUsuario.ADMIN
        }
        
        # Insertar todos los usuarios
        all_users = estudiantes + tutores + [admin]
        
        for user_data in all_users:
            hashed_password = get_password_hash(user_data["password"])
            user = Usuario(
                nombre=user_data["nombre"],
                email=user_data["email"],
                password_hash=hashed_password,
                rol=user_data["rol"],
                activo=True
            )
            db.add(user)
        
        db.commit()
        logger.info(f"Se crearon {len(all_users)} usuarios de prueba")
        
        # Mostrar información de los usuarios creados
        logger.info("Usuarios de prueba creados:")
        for user_data in all_users:
            logger.info(f"- {user_data['nombre']} ({user_data['email']}) - {user_data['rol'].value}")
            
    except Exception as e:
        logger.error(f"Error creando usuarios de prueba: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
