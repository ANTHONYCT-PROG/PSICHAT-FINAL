"""
Tests para operaciones de base de datos CRUD.
"""

import pytest
from app.db import crud
from app.schemas.user import UserCreate
from app.schemas.message import MessageCreate
from app.schemas.analysis_record import AnalysisCreate
from app.db.models import RolUsuario, EstadoUsuario


class TestDatabaseCRUD:
    """Tests para operaciones CRUD de base de datos."""
    
    def test_create_user(self, db_session):
        """Test creación de usuario."""
        user_data = UserCreate(
            email="test@example.com",
            nombre="Test User",
            password="test123456",
            rol=RolUsuario.ESTUDIANTE
        )
        
        user = crud.create_user(db_session, user_data)
        
        assert user is not None
        assert user.email == user_data.email
        assert user.nombre == user_data.nombre
        assert user.rol == user_data.rol
        assert user.estado == EstadoUsuario.ACTIVO
        assert user.id is not None
        assert user.creado_en is not None
    
    def test_get_user_by_email(self, db_session, test_student):
        """Test obtener usuario por email."""
        user = crud.get_user_by_email(db_session, test_student.email)
        
        assert user is not None
        assert user.email == test_student.email
        assert user.id == test_student.id
    
    def test_get_user_by_email_not_found(self, db_session):
        """Test obtener usuario por email inexistente."""
        user = crud.get_user_by_email(db_session, "nonexistent@example.com")
        
        assert user is None
    
    def test_get_user(self, db_session, test_student):
        """Test obtener usuario por ID."""
        user = crud.get_user(db_session, test_student.id)
        
        assert user is not None
        assert user.id == test_student.id
        assert user.email == test_student.email
    
    def test_get_user_not_found(self, db_session):
        """Test obtener usuario por ID inexistente."""
        user = crud.get_user(db_session, 99999)
        
        assert user is None
    
    def test_get_users_by_role(self, db_session, test_student, test_tutor):
        """Test obtener usuarios por rol."""
        students = crud.get_users_by_role(db_session, RolUsuario.ESTUDIANTE)
        tutors = crud.get_users_by_role(db_session, RolUsuario.TUTOR)
        
        assert isinstance(students, list)
        assert isinstance(tutors, list)
        assert len(students) >= 1
        assert len(tutors) >= 1
        
        # Verificar que los usuarios tienen el rol correcto
        for student in students:
            assert student.rol == RolUsuario.ESTUDIANTE
        for tutor in tutors:
            assert tutor.rol == RolUsuario.TUTOR
    
    def test_create_message(self, db_session, test_student):
        """Test creación de mensaje."""
        message_data = MessageCreate(
            usuario_id=test_student.id,
            texto="Hola, este es un mensaje de prueba",
            remitente="user"
        )
        
        message = crud.create_message(db_session, message_data)
        
        assert message is not None
        assert message.texto == message_data.texto
        assert message.usuario_id == message_data.usuario_id
        assert message.remitente == message_data.remitente
        assert message.id is not None
        assert message.creado_en is not None
    
    def test_get_messages_by_user(self, db_session, test_student):
        """Test obtener mensajes de un usuario."""
        # Crear algunos mensajes de prueba
        messages_data = [
            MessageCreate(usuario_id=test_student.id, texto="Mensaje 1", remitente="user"),
            MessageCreate(usuario_id=test_student.id, texto="Mensaje 2", remitente="bot"),
            MessageCreate(usuario_id=test_student.id, texto="Mensaje 3", remitente="user")
        ]
        
        for msg_data in messages_data:
            crud.create_message(db_session, msg_data)
        
        messages = crud.get_messages_by_user(db_session, test_student.id)
        
        assert isinstance(messages, list)
        assert len(messages) >= 3
        
        # Verificar que todos los mensajes pertenecen al usuario correcto
        for message in messages:
            assert message.usuario_id == test_student.id
    
    def test_get_chat_history(self, db_session, test_student):
        """Test obtener historial de chat."""
        # Crear mensajes de chat
        messages_data = [
            MessageCreate(usuario_id=test_student.id, texto="Hola", remitente="user"),
            MessageCreate(usuario_id=test_student.id, texto="¡Hola! ¿Cómo estás?", remitente="bot"),
            MessageCreate(usuario_id=test_student.id, texto="Bien, gracias", remitente="user")
        ]
        
        for msg_data in messages_data:
            crud.create_message(db_session, msg_data)
        
        history = crud.get_chat_history(db_session, test_student.id)
        
        assert isinstance(history, list)
        assert len(history) >= 3
    
    def test_get_message_count_by_user(self, db_session, test_student):
        """Test contar mensajes de un usuario."""
        # Crear algunos mensajes
        messages_data = [
            MessageCreate(usuario_id=test_student.id, texto="Mensaje 1", remitente="user"),
            MessageCreate(usuario_id=test_student.id, texto="Mensaje 2", remitente="bot")
        ]
        
        for msg_data in messages_data:
            crud.create_message(db_session, msg_data)
        
        count = crud.get_message_count_by_user(db_session, test_student.id)
        
        assert isinstance(count, int)
        assert count >= 2
    
    def test_create_analysis(self, db_session, test_student):
        """Test creación de análisis."""
        # Primero crear un mensaje
        message_data = MessageCreate(
            usuario_id=test_student.id,
            texto="Me siento triste",
            remitente="user"
        )
        message = crud.create_message(db_session, message_data)
        
        # Luego crear el análisis
        analysis_data = AnalysisCreate(
            mensaje_id=message.id,
            usuario_id=test_student.id,
            emocion="tristeza",
            emocion_score=75.0,
            estilo="evasivo",
            estilo_score=65.0,
            prioridad="alta",
            alerta=True,
            razon_alerta="Emoción de alto riesgo detectada"
        )
        
        analysis = crud.create_analysis(db_session, analysis_data)
        
        assert analysis is not None
        assert analysis.mensaje_id == message.id
        assert analysis.usuario_id == test_student.id
        assert analysis.emocion == "tristeza"
        assert analysis.emocion_score == 75.0
        assert analysis.alerta is True
    
    def test_get_analysis_by_message(self, db_session, test_student):
        """Test obtener análisis por mensaje."""
        # Crear mensaje y análisis
        message_data = MessageCreate(
            usuario_id=test_student.id,
            texto="Test message",
            remitente="user"
        )
        message = crud.create_message(db_session, message_data)
        
        analysis_data = AnalysisCreate(
            mensaje_id=message.id,
            usuario_id=test_student.id,
            emocion="neutral",
            emocion_score=50.0,
            estilo="formal",
            estilo_score=60.0,
            prioridad="normal",
            alerta=False
        )
        analysis = crud.create_analysis(db_session, analysis_data)
        
        # Obtener el análisis
        retrieved_analysis = crud.get_analysis_by_message(db_session, message.id)
        
        assert retrieved_analysis is not None
        assert retrieved_analysis.id == analysis.id
        assert retrieved_analysis.emocion == "neutral"
    
    def test_get_last_analysis_by_user(self, db_session, test_student):
        """Test obtener último análisis de un usuario."""
        # Crear mensajes y análisis
        for i in range(3):
            message_data = MessageCreate(
                usuario_id=test_student.id,
                texto=f"Mensaje {i}",
                remitente="user"
            )
            message = crud.create_message(db_session, message_data)
            
            analysis_data = AnalysisCreate(
                mensaje_id=message.id,
                usuario_id=test_student.id,
                emocion=f"emotion_{i}",
                emocion_score=50.0 + i * 10,
                estilo="formal",
                estilo_score=60.0,
                prioridad="normal",
                alerta=False
            )
            crud.create_analysis(db_session, analysis_data)
        
        last_analysis = crud.get_last_analysis_by_user(db_session, test_student.id)
        
        assert last_analysis is not None
        assert last_analysis.emocion == "emotion_2"  # El último creado
    
    def test_get_analysis_history(self, db_session, test_student):
        """Test obtener historial de análisis."""
        # Crear varios análisis
        for i in range(5):
            message_data = MessageCreate(
                usuario_id=test_student.id,
                texto=f"Mensaje {i}",
                remitente="user"
            )
            message = crud.create_message(db_session, message_data)
            
            analysis_data = AnalysisCreate(
                mensaje_id=message.id,
                usuario_id=test_student.id,
                emocion=f"emotion_{i}",
                emocion_score=50.0,
                estilo="formal",
                estilo_score=60.0,
                prioridad="normal",
                alerta=False
            )
            crud.create_analysis(db_session, analysis_data)
        
        history = crud.get_analysis_history(db_session, test_student.id, limit=3)
        
        assert isinstance(history, list)
        assert len(history) <= 3  # Respeta el límite
        assert len(history) > 0
    
    def test_verify_password(self, db_session):
        """Test verificación de contraseña."""
        from app.core.security import get_password_hash, verify_password
        
        password = "test123456"
        hashed = get_password_hash(password)
        
        # Verificar contraseña correcta
        assert verify_password(password, hashed) == True
        
        # Verificar contraseña incorrecta
        assert verify_password("wrong_password", hashed) == False
        
        # Verificar con hash inválido - debería lanzar una excepción
        import pytest
        from passlib.exc import UnknownHashError
        
        with pytest.raises(UnknownHashError):
            verify_password(password, "invalid_hash") 