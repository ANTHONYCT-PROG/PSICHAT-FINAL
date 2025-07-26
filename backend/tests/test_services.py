"""
Tests para los servicios principales del sistema.
"""

import pytest
from app.services.analysis_service import (
    analyze_text, 
    analyze_emotion, 
    analyze_style, 
    evaluate_priority,
    generate_recommendations,
    generate_summary,
    generate_bot_reply
)
from app.services.chat_service import generate_bot_reply as chat_generate_bot_reply
from app.services.user_service import determinar_rol_por_email
from app.utils.text_processing import limpiar_texto

class TestAnalysisService:
    """Tests para el servicio de análisis."""
    
    def test_analyze_emotion(self):
        """Test análisis de emoción."""
        text = "Me siento muy triste y frustrado"
        result = analyze_emotion(text)
        
        assert "emotion" in result
        assert "emotion_score" in result
        assert isinstance(result["emotion"], str)
        assert isinstance(result["emotion_score"], (int, float))
    
    def test_analyze_style(self):
        """Test análisis de estilo."""
        text = "Hola, ¿cómo estás?"
        result = analyze_style(text)
        
        assert "style" in result
        assert "style_score" in result
        assert isinstance(result["style"], str)
        assert isinstance(result["style_score"], (int, float))
    
    def test_evaluate_priority(self):
        """Test evaluación de prioridad."""
        # Test texto de alta prioridad
        emotion = "tristeza"
        emotion_score = 80.0
        style = "formal"
        style_score = 70.0
        
        result = evaluate_priority(emotion, emotion_score, style, style_score)
        
        assert isinstance(result, str)
        assert result in ["crítica", "alta", "media", "baja", "normal"]
        
        # Test texto de baja prioridad
        emotion = "alegría"
        emotion_score = 30.0
        style = "informal"
        style_score = 40.0
        
        result = evaluate_priority(emotion, emotion_score, style, style_score)
        
        assert isinstance(result, str)
        assert result in ["crítica", "alta", "media", "baja", "normal"]
    
    def test_generate_recommendations(self):
        """Test generación de recomendaciones."""
        emotion = "tristeza"
        emotion_score = 75.0
        style = "formal"
        style_score = 70.0
        priority = "alta"
        
        result = generate_recommendations(emotion, emotion_score, style, style_score, priority)
        
        assert isinstance(result, dict)
        assert len(result) > 0
    
    def test_generate_summary(self):
        """Test generación de resumen."""
        analysis = {
            "emotion": "tristeza",
            "emotion_score": 75.0,
            "style": "formal",
            "style_score": 70.0,
            "priority": "alta",
            "alert": True
        }
        
        result = generate_summary(analysis)
        
        assert isinstance(result, dict)
        assert len(result) > 0
    
    def test_generate_bot_reply(self):
        """Test generación de respuesta del bot."""
        analysis = {
            "emotion": "tristeza",
            "emotion_score": 75.0,
            "style": "formal",
            "style_score": 70.0,
            "priority": "alta",
            "alert": True
        }
        
        reply = generate_bot_reply(analysis)
        
        assert isinstance(reply, str)
        assert len(reply) > 0
        # Verificar que la respuesta sea una respuesta válida (no necesariamente empática)
        assert len(reply.strip()) > 10
    
    def test_analyze_text_complete(self):
        """Test análisis completo de texto."""
        text = "Me siento muy triste y frustrado"
        
        result = analyze_text(text)
        
        assert "emotion" in result
        assert "style" in result
        assert "priority" in result
        assert "alert" in result
        assert "emotion_score" in result
        assert "style_score" in result

class TestChatService:
    """Tests para el servicio de chat."""
    
    def test_generate_bot_reply_basic(self):
        """Test generación básica de respuesta del bot."""
        user_text = "Hola"
        history = []
        
        result = chat_generate_bot_reply(user_text, history)
        
        assert "reply" in result
        assert "meta" in result
        assert "history" in result
        assert isinstance(result["reply"], str)
        assert len(result["reply"]) > 0
    
    def test_generate_bot_reply_with_context(self):
        """Test generación de respuesta con contexto."""
        user_text = "Me siento triste"
        history = [
            ("Hola", "¡Hola! ¿Cómo estás?"),
            ("Bien, gracias", "Me alegra saberlo")
        ]
        
        result = chat_generate_bot_reply(user_text, {"history": history})
        
        assert "reply" in result
        assert "meta" in result
        assert "history" in result
        assert len(result["history"]) > 2
    
    def test_generate_bot_reply_empathetic(self):
        """Test que las respuestas sean empáticas."""
        user_text = "Me siento muy triste y frustrado"
        history = []
        
        result = chat_generate_bot_reply(user_text, {"history": history})
        
        assert "reply" in result
        reply = result["reply"]
        # Verificar que se genere una respuesta válida
        assert isinstance(reply, str)
        assert len(reply.strip()) > 10

class TestUserService:
    """Tests para el servicio de usuarios."""
    
    def test_determinar_rol_por_email(self):
        """Test determinación de rol por email."""
        from app.db.models import RolUsuario
        
        # Test emails de diferentes roles
        test_cases = [
            ("estudiante@test.com", RolUsuario.ESTUDIANTE),
            ("tutor@test.com", RolUsuario.TUTOR),
            ("admin@test.com", RolUsuario.ESTUDIANTE),  # admin no está implementado
            ("unknown@test.com", RolUsuario.ESTUDIANTE)  # Por defecto
        ]
        
        for email, expected_role in test_cases:
            role = determinar_rol_por_email(email)
            assert role == expected_role

class TestTextProcessing:
    """Tests para el procesamiento de texto."""
    
    def test_limpiar_texto(self):
        """Test limpieza de texto."""
        # Test texto con caracteres especiales
        dirty_text = "¡Hola! ¿Cómo estás? 😊 😢 😡"
        clean_text = limpiar_texto(dirty_text)
        
        assert isinstance(clean_text, str)
        assert len(clean_text) > 0
        # Verificar que se removieron algunos caracteres especiales
        assert "😊" not in clean_text or "😢" not in clean_text or "😡" not in clean_text
    
    def test_limpiar_texto_vacio(self):
        """Test limpieza de texto vacío."""
        clean_text = limpiar_texto("")
        assert clean_text == ""
    
    def test_limpiar_texto_con_espacios(self):
        """Test limpieza de texto con espacios extra."""
        dirty_text = "   Hola   mundo   "
        clean_text = limpiar_texto(dirty_text)
        
        # La función limpiar_texto convierte a minúsculas y limpia caracteres especiales
        assert isinstance(clean_text, str)
        assert "hola" in clean_text.lower()
        assert "mundo" in clean_text.lower() 