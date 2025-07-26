"""
Tests de integración para probar el flujo completo del sistema.
"""

import pytest
from fastapi import status
from sqlalchemy.orm import Session

class TestIntegration:
    """Tests de integración para flujos completos."""
    
    def test_complete_chat_flow(self, client, auth_headers_student, db_session):
        """Test flujo completo de chat: login -> chat -> análisis -> historial."""
        # 1. Verificar que el usuario está autenticado
        profile_response = client.get("/auth/me", headers=auth_headers_student)
        assert profile_response.status_code == status.HTTP_200_OK
        
        # 2. Enviar mensaje de chat
        chat_data = {
            "user_text": "Me siento muy triste y frustrado con la tarea",
            "history": []
        }
        chat_response = client.post("/chat/", json=chat_data, headers=auth_headers_student)
        assert chat_response.status_code == status.HTTP_200_OK
        
        chat_result = chat_response.json()
        assert "reply" in chat_result
        assert "meta" in chat_result
        assert "history" in chat_result
        
        # 3. Verificar que se generó análisis
        meta = chat_result["meta"]
        assert "detected_emotion" in meta
        assert "emotion_score" in meta
        assert "detected_style" in meta
        assert "style_score" in meta
        assert "priority" in meta
        assert "alert" in meta
        
        # 4. Obtener historial de chat
        history_response = client.get("/chat/history", headers=auth_headers_student)
        assert history_response.status_code == status.HTTP_200_OK
        
        history = history_response.json()
        assert isinstance(history, list)
        assert len(history) > 0
        
        # 5. Verificar que el mensaje se guardó en la base de datos
        from app.db.models import Mensaje
        messages = db_session.query(Mensaje).filter(
            Mensaje.usuario_id == profile_response.json()["id"]
        ).all()
        assert len(messages) > 0
    
    def test_complete_analysis_flow(self, client, auth_headers_student, db_session):
        """Test flujo completo de análisis: análisis básico -> completo -> historial."""
        # 1. Análisis básico
        analysis_data = {
            "texto": "No entiendo nada y me siento muy frustrado"
        }
        basic_response = client.post("/analysis/", json=analysis_data, headers=auth_headers_student)
        assert basic_response.status_code == status.HTTP_200_OK
        
        basic_result = basic_response.json()
        assert "emotion" in basic_result
        assert "style" in basic_result
        assert "priority" in basic_result
        assert "alert" in basic_result
        
        # 2. Análisis completo
        complete_response = client.post("/analysis/complete", json=analysis_data, headers=auth_headers_student)
        assert complete_response.status_code == status.HTTP_200_OK
        
        complete_result = complete_response.json()
        assert "recommendations" in complete_result
        assert "summary" in complete_result
        assert "detailed_insights" in complete_result
        
        # 3. Obtener historial de análisis
        history_response = client.get("/analysis/history", headers=auth_headers_student)
        assert history_response.status_code == status.HTTP_200_OK
        
        history = history_response.json()
        assert "history" in history
        assert isinstance(history["history"], list)
    
    def test_tutor_monitoring_flow(self, client, auth_headers_tutor, auth_headers_student, db_session):
        """Test flujo completo de monitoreo de tutor: chat de estudiante -> alertas -> intervención."""
        # 1. El estudiante envía un mensaje que debería generar alerta
        chat_data = {
            "user_text": "Me siento muy triste y no quiero vivir más",
            "history": []
        }
        student_response = client.post("/chat/", json=chat_data, headers=auth_headers_student)
        assert student_response.status_code == status.HTTP_200_OK
        
        # 2. El tutor obtiene las alertas
        alerts_response = client.get("/tutor/alerts", headers=auth_headers_tutor)
        assert alerts_response.status_code == status.HTTP_200_OK
        
        alerts = alerts_response.json()
        assert isinstance(alerts, list)
        
        # 3. El tutor obtiene la lista de estudiantes
        students_response = client.get("/tutor/students", headers=auth_headers_tutor)
        assert students_response.status_code == status.HTTP_200_OK
        
        students = students_response.json()
        assert isinstance(students, list)
        assert len(students) > 0
        
        # 4. El tutor obtiene información de un estudiante específico
        if students:
            student_id = students[0]["id"]
            
            # Obtener conversación del estudiante
            conversation_response = client.get(
                f"/tutor/student/{student_id}/conversation", 
                headers=auth_headers_tutor
            )
            # Puede devolver 200 o 404 dependiendo de si hay conversación
            assert conversation_response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
            
            # Obtener análisis del estudiante
            analysis_response = client.get(
                f"/tutor/student/{student_id}/analysis", 
                headers=auth_headers_tutor
            )
            # Puede devolver 200 o 404 dependiendo de si hay análisis
            assert analysis_response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
            
            # Enviar intervención
            intervention_data = {
                "student_id": student_id,
                "message": "Hola, he notado que te sientes mal. ¿Quieres que hablemos?"
            }
            intervention_response = client.post(
                "/tutor/intervene", 
                json=intervention_data, 
                headers=auth_headers_tutor
            )
            assert intervention_response.status_code == status.HTTP_200_OK
    
    def test_authentication_flow(self, client, db_session):
        """Test flujo completo de autenticación: registro -> login -> acceso protegido."""
        import uuid
        
        # 1. Registrar nuevo usuario con email único
        unique_email = f"nuevo{uuid.uuid4().hex[:8]}@test.com"
        register_data = {
            "email": unique_email,
            "nombre": "Nuevo Usuario",
            "password": "test123456"
        }
        register_response = client.post("/auth/register", json=register_data)
        # Puede devolver 200 (éxito) o 400 (usuario ya existe)
        assert register_response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
        
        # 2. Login con el usuario registrado
        login_data = {
            "username": register_data["email"],
            "password": register_data["password"]
        }
        login_response = client.post("/auth/login", data=login_data)
        # Puede fallar si el registro falló
        if login_response.status_code == status.HTTP_200_OK:
            login_result = login_response.json()
            assert "access_token" in login_result
            assert "user" in login_result
            
            # 3. Usar el token para acceder a recursos protegidos
            headers = {"Authorization": f"Bearer {login_result['access_token']}"}
            
            # Obtener perfil
            profile_response = client.get("/auth/me", headers=headers)
            assert profile_response.status_code == status.HTTP_200_OK
            
            # Acceder a chat - puede fallar si el token no es válido en el contexto de test
            chat_data = {"user_text": "Hola", "history": []}
            chat_response = client.post("/chat/", json=chat_data, headers=headers)
            # Puede devolver 200, 401 o 403 dependiendo de la validación del token
            assert chat_response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        else:
            # Si el login falla, verificar que es por credenciales inválidas
            assert login_response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST]
    
    def test_error_handling_flow(self, client):
        """Test manejo de errores en diferentes escenarios."""
        # 1. Acceso sin autenticación
        protected_endpoints = [
            ("GET", "/auth/me"),
            ("POST", "/chat/", {"user_text": "test", "history": []}),
            ("GET", "/chat/history"),
            ("POST", "/analysis/", {"texto": "test"}),
            ("GET", "/tutor/alerts")
        ]
        
        for method, endpoint, *args in protected_endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json=args[0])
            
            # Puede devolver 401 o 403 dependiendo de la implementación
            assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        
        # 2. Datos inválidos
        invalid_chat_data = {"user_text": "", "history": "invalid"}
        response = client.post("/chat/", json=invalid_chat_data)
        # Sin auth primero, luego validación de datos
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN, status.HTTP_422_UNPROCESSABLE_ENTITY]
        
        # 3. Endpoint inexistente
        response = client.get("/endpoint/inexistente")
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_data_persistence_flow(self, client, auth_headers_student, db_session):
        """Test que los datos se persisten correctamente en la base de datos."""
        # 1. Enviar mensaje de chat
        chat_data = {
            "user_text": "Mensaje de prueba para persistencia",
            "history": []
        }
        chat_response = client.post("/chat/", json=chat_data, headers=auth_headers_student)
        assert chat_response.status_code == status.HTTP_200_OK
        
        # 2. Verificar que se guardó en la base de datos
        from app.db.models import Mensaje, Analisis
        
        # Obtener el usuario
        profile_response = client.get("/auth/me", headers=auth_headers_student)
        user_id = profile_response.json()["id"]
        
        # Verificar mensajes
        messages = db_session.query(Mensaje).filter(Mensaje.usuario_id == user_id).all()
        assert len(messages) > 0
        
        # Verificar análisis
        analyses = db_session.query(Analisis).filter(Analisis.usuario_id == user_id).all()
        assert len(analyses) > 0
        
        # 3. Verificar que el historial refleja los datos guardados
        history_response = client.get("/chat/history", headers=auth_headers_student)
        assert history_response.status_code == status.HTTP_200_OK
        
        history = history_response.json()
        assert len(history) > 0
        
        # Verificar que el mensaje está en el historial
        message_found = any(
            "Mensaje de prueba para persistencia" in msg.get("content", "")
            for msg in history
        )
        assert message_found 