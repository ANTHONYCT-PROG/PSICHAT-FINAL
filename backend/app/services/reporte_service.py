"""
Servicio para generar reportes de sesiones usando Gemini.
"""

import json
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.core.config import settings
from app.core.logging import logger
from app.db.session import SessionLocal
from app.db import crud
from app.schemas.reporte import ReporteCreate


class ReporteService:
    """Servicio para generar reportes de sesiones."""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.api_url = settings.GEMINI_API_BASE_URL
        self.model = settings.GEMINI_MODEL
    
    async def generar_reporte_sesion(self, sesion_id: int, tutor_id: int, notas_tutor: Optional[str] = None, motivo_finalizacion: Optional[str] = None) -> Dict[str, Any]:
        """Genera un reporte completo de una sesión usando Gemini."""
        db = SessionLocal()
        try:
            # Obtener información de la sesión
            sesion = crud.get_chat_session(db, sesion_id)
            if not sesion:
                raise ValueError(f"Sesión {sesion_id} no encontrada")
            
            # Obtener mensajes con análisis
            mensajes = crud.get_mensajes_sesion_para_reporte(db, sesion_id)
            
            # Obtener información del tutor y estudiante
            tutor = crud.get_user(db, tutor_id)
            estudiante = crud.get_user(db, sesion.usuario_id)
            
            if not tutor or not estudiante:
                raise ValueError("Tutor o estudiante no encontrado")
            
            # Generar reporte con Gemini
            reporte_content = await self._generar_contenido_reporte(
                mensajes=mensajes,
                tutor=tutor,
                estudiante=estudiante,
                sesion=sesion,
                notas_tutor=notas_tutor,
                motivo_finalizacion=motivo_finalizacion
            )
            
            # Extraer información estructurada del reporte
            emociones_detectadas = self._extraer_emociones(mensajes)
            alertas_generadas = self._extraer_alertas(mensajes)
            recomendaciones = self._extraer_recomendaciones(reporte_content)
            
            # Crear el reporte en la base de datos
            reporte_data = {
                "sesion_id": sesion_id,
                "tutor_id": tutor_id,
                "estudiante_id": sesion.usuario_id,
                "titulo": f"Reporte de Sesión - {estudiante.nombre} {estudiante.apellido}",
                "contenido": reporte_content,
                "resumen_ejecutivo": self._generar_resumen_ejecutivo(reporte_content),
                "emociones_detectadas": emociones_detectadas,
                "alertas_generadas": alertas_generadas,
                "recomendaciones": recomendaciones,
                "estado": "generado",
                "visible_estudiante": False,
                "metadatos": {
                    "duracion_sesion": sesion.duracion_total,
                    "mensajes_count": sesion.mensajes_count,
                    "motivo_finalizacion": motivo_finalizacion,
                    "notas_tutor": notas_tutor
                }
            }
            
            reporte = crud.create_reporte(db, reporte_data)
            
            # Actualizar estado de la sesión
            crud.update_chat_session(db, sesion_id, {
                "estado": "cerrada",
                "finalizada_en": datetime.utcnow()
            })
            
            logger.info(f"Reporte generado exitosamente para sesión {sesion_id}")
            
            return {
                "reporte_id": reporte.id,
                "titulo": reporte.titulo,
                "contenido": reporte.contenido,
                "resumen_ejecutivo": reporte.resumen_ejecutivo,
                "recomendaciones": reporte.recomendaciones,
                "sesion_cerrada": True
            }
            
        except Exception as e:
            logger.error(f"Error generando reporte para sesión {sesion_id}: {e}")
            raise
        finally:
            db.close()
    
    async def _generar_contenido_reporte(self, mensajes: List[Dict], tutor: Any, estudiante: Any, sesion: Any, notas_tutor: Optional[str], motivo_finalizacion: Optional[str]) -> str:
        """Genera el contenido del reporte usando Gemini."""
        
        # Preparar el contexto para Gemini
        contexto = self._preparar_contexto_reporte(mensajes, tutor, estudiante, sesion, notas_tutor, motivo_finalizacion)
        
        # Prompt para Gemini
        prompt = f"""
        Eres un asistente especializado en análisis psicológico y educativo. Necesito que generes un reporte profesional de una sesión de tutoría.

        CONTEXTO DE LA SESIÓN:
        {contexto}

        INSTRUCCIONES:
        1. Genera un reporte estructurado y profesional
        2. Incluye análisis emocional basado en los datos proporcionados
        3. Identifica patrones de comportamiento y comunicación
        4. Proporciona recomendaciones específicas y accionables
        5. Mantén un tono profesional pero empático
        6. Estructura el reporte en secciones claras

        ESTRUCTURA SUGERIDA:
        - Resumen Ejecutivo
        - Análisis de la Comunicación
        - Análisis Emocional
        - Patrones Identificados
        - Alertas y Preocupaciones
        - Fortalezas del Estudiante
        - Áreas de Mejora
        - Recomendaciones Específicas
        - Plan de Seguimiento

        Genera el reporte completo:
        """
        
        try:
            # Llamada a Gemini API
            response = requests.post(
                self.api_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                },
                json={
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "topK": 40,
                        "topP": 0.95,
                        "maxOutputTokens": 2048,
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if "candidates" in result and len(result["candidates"]) > 0:
                    content = result["candidates"][0]["content"]["parts"][0]["text"]
                    return content
                else:
                    raise Exception("Respuesta de Gemini sin contenido válido")
            else:
                raise Exception(f"Error en API de Gemini: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error llamando a Gemini: {e}")
            # Fallback: generar reporte básico
            return self._generar_reporte_fallback(mensajes, estudiante, sesion)
    
    def _preparar_contexto_reporte(self, mensajes: List[Dict], tutor: Any, estudiante: Any, sesion: Any, notas_tutor: Optional[str], motivo_finalizacion: Optional[str]) -> str:
        """Prepara el contexto para el reporte."""
        
        # Información básica
        contexto = f"""
        ESTUDIANTE: {estudiante.nombre} {estudiante.apellido}
        TUTOR: {tutor.nombre} {tutor.apellido}
        FECHA DE SESIÓN: {sesion.iniciada_en.strftime('%d/%m/%Y %H:%M')}
        DURACIÓN: {sesion.duracion_total or 0} segundos
        TOTAL MENSAJES: {len(mensajes)}
        """
        
        if motivo_finalizacion:
            contexto += f"\nMOTIVO DE FINALIZACIÓN: {motivo_finalizacion}"
        
        if notas_tutor:
            contexto += f"\nNOTAS DEL TUTOR: {notas_tutor}"
        
        # Análisis de mensajes
        contexto += "\n\nANÁLISIS DE MENSAJES:\n"
        
        emociones_principales = {}
        alertas_count = 0
        
        for mensaje in mensajes:
            contexto += f"\n- {mensaje['remitente'].upper()}: {mensaje['texto'][:100]}..."
            
            if mensaje['analisis']:
                analisis = mensaje['analisis']
                contexto += f"\n  Emoción: {analisis['emocion']} (confianza: {analisis['emocion_score']:.2f})"
                contexto += f"\n  Estilo: {analisis['estilo']} (confianza: {analisis['estilo_score']:.2f})"
                
                if analisis['alerta']:
                    alertas_count += 1
                    contexto += f"\n  ⚠️ ALERTA: {analisis['razon_alerta']}"
                
                # Contar emociones
                if analisis['emocion']:
                    emociones_principales[analisis['emocion']] = emociones_principales.get(analisis['emocion'], 0) + 1
        
        contexto += f"\n\nRESUMEN ESTADÍSTICO:"
        contexto += f"\n- Emociones principales: {', '.join([f'{k} ({v})' for k, v in sorted(emociones_principales.items(), key=lambda x: x[1], reverse=True)])}"
        contexto += f"\n- Total de alertas: {alertas_count}"
        
        return contexto
    
    def _extraer_emociones(self, mensajes: List[Dict]) -> List[str]:
        """Extrae las emociones principales de los mensajes."""
        emociones = {}
        for mensaje in mensajes:
            if mensaje['analisis'] and mensaje['analisis']['emocion']:
                emocion = mensaje['analisis']['emocion']
                emociones[emocion] = emociones.get(emocion, 0) + 1
        
        # Retornar las 3 emociones más frecuentes
        return [k for k, v in sorted(emociones.items(), key=lambda x: x[1], reverse=True)[:3]]
    
    def _extraer_alertas(self, mensajes: List[Dict]) -> List[Dict[str, Any]]:
        """Extrae las alertas generadas durante la sesión."""
        alertas = []
        for mensaje in mensajes:
            if mensaje['analisis'] and mensaje['analisis']['alerta']:
                alertas.append({
                    "mensaje_id": mensaje['id'],
                    "texto": mensaje['texto'][:100] + "...",
                    "razon": mensaje['analisis']['razon_alerta'],
                    "prioridad": mensaje['analisis']['prioridad'],
                    "timestamp": mensaje['creado_en']
                })
        return alertas
    
    def _extraer_recomendaciones(self, contenido_reporte: str) -> List[str]:
        """Extrae recomendaciones del contenido del reporte."""
        # Buscar sección de recomendaciones
        if "RECOMENDACIONES" in contenido_reporte.upper():
            seccion = contenido_reporte.split("RECOMENDACIONES")[1]
            if "PLAN DE SEGUIMIENTO" in seccion.upper():
                seccion = seccion.split("PLAN DE SEGUIMIENTO")[0]
            
            # Extraer líneas que parezcan recomendaciones
            recomendaciones = []
            for linea in seccion.split('\n'):
                linea = linea.strip()
                if linea and (linea.startswith('-') or linea.startswith('•') or linea.startswith('*')):
                    recomendaciones.append(linea[1:].strip())
            
            return recomendaciones[:5]  # Máximo 5 recomendaciones
        
        return []
    
    def _generar_resumen_ejecutivo(self, contenido: str) -> str:
        """Genera un resumen ejecutivo del reporte."""
        # Buscar la sección de resumen ejecutivo
        if "RESUMEN EJECUTIVO" in contenido.upper():
            seccion = contenido.split("RESUMEN EJECUTIVO")[1]
            if "ANÁLISIS" in seccion.upper():
                seccion = seccion.split("ANÁLISIS")[0]
            
            # Limpiar y retornar
            return seccion.strip()[:500] + "..." if len(seccion.strip()) > 500 else seccion.strip()
        
        # Si no hay sección específica, tomar las primeras líneas
        return contenido[:300] + "..." if len(contenido) > 300 else contenido
    
    def _generar_reporte_fallback(self, mensajes: List[Dict], estudiante: Any, sesion: Any) -> str:
        """Genera un reporte básico cuando Gemini no está disponible."""
        return f"""
        REPORTE DE SESIÓN - {estudiante.nombre} {estudiante.apellido}
        
        RESUMEN EJECUTIVO:
        Sesión realizada el {sesion.iniciada_en.strftime('%d/%m/%Y')} con una duración de {sesion.duracion_total or 0} segundos.
        Se intercambiaron {len(mensajes)} mensajes durante la sesión.
        
        ANÁLISIS DE LA COMUNICACIÓN:
        - Total de mensajes: {len(mensajes)}
        - Mensajes del estudiante: {len([m for m in mensajes if m['remitente'] == 'user'])}
        - Mensajes del tutor: {len([m for m in mensajes if m['remitente'] == 'tutor'])}
        
        ANÁLISIS EMOCIONAL:
        Se detectaron {len([m for m in mensajes if m['analisis'] and m['analisis']['alerta']])} alertas durante la sesión.
        
        RECOMENDACIONES:
        - Continuar con el seguimiento regular
        - Monitorear el progreso del estudiante
        - Mantener comunicación abierta
        
        Este es un reporte básico generado automáticamente.
        """


# Instancia global del servicio
reporte_service = ReporteService() 