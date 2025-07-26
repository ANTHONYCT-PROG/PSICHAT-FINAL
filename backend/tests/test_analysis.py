"""
Tests para el sistema de análisis emocional.
"""

import pytest
from fastapi import status

class TestAnalysis:
    """Tests para endpoints de análisis."""
    
    def test_analyze_endpoint_success(self, client, auth_headers_student):
        """Test endpoint de análisis básico exitoso."""
        message_data = {
            "texto": "Me siento muy triste y frustrado"
        }
        
        response = client.post("/analysis/", json=message_data, headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "text" in data
        assert "emotion" in data
        assert "emotion_score" in data
        assert "style" in data
        assert "style_score" in data
        assert "priority" in data
        assert "alert" in data
    
    def test_analyze_endpoint_unauthorized(self, client):
        """Test endpoint de análisis sin autenticación."""
        message_data = {
            "texto": "Test message"
        }
        
        response = client.post("/analysis/", json=message_data)
        
        # Puede devolver 401 o 403 dependiendo de la implementación
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_analyze_complete_endpoint(self, client, auth_headers_student):
        """Test endpoint de análisis completo."""
        message_data = {
            "texto": "No entiendo nada y me siento muy frustrado"
        }
        
        response = client.post("/analysis/complete", json=message_data, headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "recommendations" in data
        assert "summary" in data
        assert "detailed_insights" in data
    
    def test_get_last_analysis_endpoint(self, client, auth_headers_student):
        """Test endpoint para obtener último análisis."""
        response = client.get("/analysis/last", headers=auth_headers_student)
        
        # Puede devolver 200 o 404 si no hay análisis previos
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_get_analysis_history_endpoint(self, client, auth_headers_student):
        """Test endpoint para obtener historial de análisis."""
        response = client.get("/analysis/history", headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "history" in data
        assert isinstance(data["history"], list)
    
    def test_get_analysis_history_with_limit(self, client, auth_headers_student):
        """Test endpoint para obtener historial con límite."""
        response = client.get("/analysis/history?limit=5", headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "history" in data
        assert isinstance(data["history"], list)
    
    def test_deep_analysis_endpoint(self, client, auth_headers_student):
        """Test endpoint de análisis profundo."""
        response = client.get("/analysis/deep", headers=auth_headers_student)
        
        # Puede devolver 200 con datos o 404 si no hay mensajes para analizar
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "detailed_analysis" in data
            assert "risk_assessment" in data
            assert "recommendations" in data
        else:
            # Si es 404, verificar que el mensaje sea apropiado
            data = response.json()
            assert "message" in data
    
    def test_analyze_different_emotions(self, client, auth_headers_student, sample_texts):
        """Test análisis de diferentes emociones."""
        for emotion, text in sample_texts.items():
            message_data = {"texto": text}
            response = client.post("/analysis/", json=message_data, headers=auth_headers_student)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "emotion" in data
            assert "emotion_score" in data
    
    def test_analyze_empty_text(self, client, auth_headers_student):
        """Test análisis de texto vacío."""
        message_data = {"texto": ""}
        
        response = client.post("/analysis/", json=message_data, headers=auth_headers_student)
        
        # Puede devolver 400 o 200 con análisis vacío
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
    
    def test_analyze_special_characters(self, client, auth_headers_student):
        """Test análisis de texto con caracteres especiales."""
        message_data = {
            "texto": "¡Hola! ¿Cómo estás? 😊 😢 😡"
        }
        
        response = client.post("/analysis/", json=message_data, headers=auth_headers_student)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "emotion" in data
    
    def test_analysis_priority_levels(self, client, auth_headers_student):
        """Test diferentes niveles de prioridad en análisis."""
        high_priority_text = "Me siento muy triste y no quiero vivir más"
        low_priority_text = "Hola, ¿cómo estás?"
        
        # Test texto de alta prioridad
        response = client.post("/analysis/", json={"texto": high_priority_text}, headers=auth_headers_student)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "priority" in data
        
        # Test texto de baja prioridad
        response = client.post("/analysis/", json={"texto": low_priority_text}, headers=auth_headers_student)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "priority" in data 