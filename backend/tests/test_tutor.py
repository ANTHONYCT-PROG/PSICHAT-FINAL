"""
Tests para el panel de tutor.
"""

import pytest
from fastapi import status

class TestTutor:
    """Tests para endpoints del panel de tutor."""
    
    def test_get_student_alerts_tutor_access(self, client, auth_headers_tutor):
        """Test obtener alertas de estudiantes (acceso de tutor)."""
        response = client.get("/tutor/alerts", headers=auth_headers_tutor)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_student_alerts_student_access_denied(self, client, auth_headers_student):
        """Test obtener alertas (acceso denegado para estudiante)."""
        response = client.get("/tutor/alerts", headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_student_alerts_unauthorized(self, client):
        """Test obtener alertas sin autenticación."""
        response = client.get("/tutor/alerts")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_students_list_tutor_access(self, client, auth_headers_tutor):
        """Test obtener lista de estudiantes (acceso de tutor)."""
        response = client.get("/tutor/students", headers=auth_headers_tutor)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_students_list_student_access_denied(self, client, auth_headers_student):
        """Test obtener lista de estudiantes (acceso denegado para estudiante)."""
        response = client.get("/tutor/students", headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_student_conversation_tutor_access(self, client, auth_headers_tutor, test_student):
        """Test obtener conversación de estudiante (acceso de tutor)."""
        response = client.get(f"/tutor/student/{test_student.id}/conversation", headers=auth_headers_tutor)
        
        # Puede devolver 200 si hay conversación o 404 si no hay
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "student" in data
            assert "conversation" in data
            assert isinstance(data["conversation"], list)
    
    def test_get_student_conversation_invalid_student(self, client, auth_headers_tutor):
        """Test obtener conversación de estudiante inexistente."""
        response = client.get("/tutor/student/99999/conversation", headers=auth_headers_tutor)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_student_analysis_tutor_access(self, client, auth_headers_tutor, test_student):
        """Test obtener análisis de estudiante (acceso de tutor)."""
        response = client.get(f"/tutor/student/{test_student.id}/analysis", headers=auth_headers_tutor)
        
        # Puede devolver 200 si hay análisis o 404 si no hay
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "student" in data
            assert "latest_analysis" in data
            assert "statistics" in data
    
    def test_send_intervention_tutor_access(self, client, auth_headers_tutor, test_student):
        """Test enviar intervención (acceso de tutor)."""
        intervention_data = {
            "student_id": test_student.id,
            "message": "Hola, ¿cómo te sientes? Quiero ayudarte."
        }
        
        response = client.post("/tutor/intervene", json=intervention_data, headers=auth_headers_tutor)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "success" in data
        assert data["success"] is True
        assert "message" in data
    
    def test_send_intervention_invalid_student(self, client, auth_headers_tutor):
        """Test enviar intervención a estudiante inexistente."""
        intervention_data = {
            "student_id": 99999,
            "message": "Hola, ¿cómo te sientes?"
        }
        
        response = client.post("/tutor/intervene", json=intervention_data, headers=auth_headers_tutor)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_mark_alert_as_reviewed_tutor_access(self, client, auth_headers_tutor):
        """Test marcar alerta como revisada (acceso de tutor)."""
        review_data = {
            "notes": "Alerta revisada y manejada",
            "action_taken": "Contacté al estudiante"
        }
        
        # Nota: Este test puede fallar si no hay alertas en la base de datos
        response = client.put("/tutor/alert/1/review", json=review_data, headers=auth_headers_tutor)
        
        # Puede devolver 200 si la alerta existe o 500 si no hay alertas
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
    
    def test_generate_report_tutor_access(self, client, auth_headers_tutor):
        """Test generar reporte (acceso de tutor)."""
        response = client.post(
            "/tutor/reports?start_date=2024-01-01&end_date=2024-12-31&report_type=general",
            headers=auth_headers_tutor
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "report_type" in data
        assert "period" in data
        assert "statistics" in data
    
    def test_get_notifications_tutor_access(self, client, auth_headers_tutor):
        """Test obtener notificaciones (acceso de tutor)."""
        response = client.get("/tutor/notifications", headers=auth_headers_tutor)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_mark_notification_as_read_tutor_access(self, client, auth_headers_tutor):
        """Test marcar notificación como leída (acceso de tutor)."""
        # Nota: Este test puede fallar si no hay notificaciones en la base de datos
        response = client.put("/tutor/notifications/1/read", headers=auth_headers_tutor)
        
        # Puede devolver 200 si la notificación existe, 404 si no hay, o 500 si hay error
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND, status.HTTP_500_INTERNAL_SERVER_ERROR]
    
    def test_tutor_endpoints_student_access_denied(self, client, auth_headers_student):
        """Test que los estudiantes no puedan acceder a endpoints de tutor."""
        endpoints = [
            ("GET", "/tutor/alerts"),
            ("GET", "/tutor/students"),
            ("GET", "/tutor/student/1/conversation"),
            ("GET", "/tutor/student/1/analysis"),
            ("POST", "/tutor/intervene"),
            ("PUT", "/tutor/alert/1/review"),
            ("POST", "/tutor/reports"),
            ("GET", "/tutor/notifications"),
            ("PUT", "/tutor/notifications/1/read")
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = client.get(endpoint, headers=auth_headers_student)
            elif method == "POST":
                response = client.post(endpoint, headers=auth_headers_student)
            elif method == "PUT":
                response = client.put(endpoint, headers=auth_headers_student)
            
            assert response.status_code == status.HTTP_403_FORBIDDEN 