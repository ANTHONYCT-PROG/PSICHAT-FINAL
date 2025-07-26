"""
Definición de modelos ORM para la base de datos usando SQLAlchemy.
Incluye todos los modelos necesarios para PsiChat.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, Enum, JSON, Index
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

Base = declarative_base()


class RolUsuario(enum.Enum):
    ESTUDIANTE = "estudiante"
    TUTOR = "tutor"
    ADMIN = "admin"


class EstadoUsuario(enum.Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"


class Usuario(Base):
    """
    Tabla de usuarios registrados con información completa.
    """
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    apellido = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario), default=RolUsuario.ESTUDIANTE, nullable=False)
    estado = Column(Enum(EstadoUsuario), default=EstadoUsuario.ACTIVO, nullable=False)
    
    # Información adicional
    telefono = Column(String(20), nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=True)
    genero = Column(String(20), nullable=True)
    institucion = Column(String(255), nullable=True)
    grado_academico = Column(String(100), nullable=True)
    
    # Configuraciones del usuario
    configuraciones = Column(JSON, nullable=True)  # Preferencias del usuario
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)
    actualizado_en = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    ultimo_acceso = Column(DateTime, nullable=True)

    # Relaciones
    mensajes = relationship("Mensaje", back_populates="usuario", cascade="all, delete-orphan")
    analisis = relationship("Analisis", back_populates="usuario", cascade="all, delete-orphan")
    notificaciones = relationship("Notificacion", back_populates="usuario", cascade="all, delete-orphan")
    alertas = relationship("Alerta", back_populates="usuario", cascade="all, delete-orphan", foreign_keys="Alerta.usuario_id")
    intervenciones = relationship("Intervencion", back_populates="usuario", cascade="all, delete-orphan", foreign_keys="Intervencion.usuario_id")
    
    # Índices
    __table_args__ = (
        Index('idx_usuario_email', 'email'),
        Index('idx_usuario_rol', 'rol'),
        Index('idx_usuario_estado', 'estado'),
    )


class Mensaje(Base):
    """
    Tabla de mensajes enviados por usuarios y bot.
    """
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    sesion_id = Column(Integer, ForeignKey("sesiones_chat.id"), nullable=True)
    texto = Column(Text, nullable=False)
    remitente = Column(String(50), nullable=False, default="user")  # 'user' o 'bot'
    
    # Información adicional del mensaje
    tipo_mensaje = Column(String(50), default="texto")  # texto, imagen, archivo
    metadatos = Column(JSON, nullable=True)  # Información adicional del mensaje
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)

    # Relaciones
    usuario = relationship("Usuario", back_populates="mensajes")
    analisis = relationship("Analisis", back_populates="mensaje", uselist=False, cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_mensaje_usuario', 'usuario_id'),
        Index('idx_mensaje_creado', 'creado_en'),
        Index('idx_mensaje_remitente', 'remitente'),
    )


class Analisis(Base):
    """
    Tabla con el análisis emocional y estilístico de cada mensaje.
    """
    __tablename__ = "analisis"

    id = Column(Integer, primary_key=True, index=True)
    mensaje_id = Column(Integer, ForeignKey("mensajes.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    # Análisis emocional
    emocion = Column(String(100), nullable=True)
    emocion_score = Column(Float, nullable=True)
    distribucion_emociones = Column(JSON, nullable=True)  # Distribución completa de emociones
    
    # Análisis de estilo
    estilo = Column(String(100), nullable=True)
    estilo_score = Column(Float, nullable=True)
    distribucion_estilos = Column(JSON, nullable=True)  # Distribución completa de estilos
    
    # Evaluación de prioridad
    prioridad = Column(String(50), nullable=True)  # crítica, alta, media, baja, normal
    alerta = Column(Boolean, default=False, nullable=False)
    razon_alerta = Column(Text, nullable=True)
    
    # Análisis profundo
    recomendaciones = Column(JSON, nullable=True)  # Recomendaciones generadas
    resumen = Column(JSON, nullable=True)  # Resumen ejecutivo
    insights_detallados = Column(JSON, nullable=True)  # Insights detallados
    
    # Metadatos del análisis
    modelo_utilizado = Column(String(100), nullable=True)
    confianza_analisis = Column(Float, nullable=True)
    tiempo_procesamiento = Column(Float, nullable=True)  # en segundos
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)
    
    # Relaciones
    mensaje = relationship("Mensaje", back_populates="analisis")
    usuario = relationship("Usuario", back_populates="analisis")
    
    # Índices
    __table_args__ = (
        Index('idx_analisis_mensaje', 'mensaje_id'),
        Index('idx_analisis_usuario', 'usuario_id'),
        Index('idx_analisis_emocion', 'emocion'),
        Index('idx_analisis_prioridad', 'prioridad'),
        Index('idx_analisis_alerta', 'alerta'),
        Index('idx_analisis_creado', 'creado_en'),
    )


class Notificacion(Base):
    """
    Tabla de notificaciones del sistema.
    """
    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Información de la notificación
    titulo = Column(String(255), nullable=False)
    mensaje = Column(Text, nullable=False)
    tipo = Column(String(50), nullable=False)  # alerta, sistema, intervencion, etc.
    
    # Estado de la notificación
    leida = Column(Boolean, default=False, nullable=False)
    enviada = Column(Boolean, default=False, nullable=False)
    
    # Metadatos
    metadatos = Column(JSON, nullable=True)
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)
    leida_en = Column(DateTime, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="notificaciones")
    
    # Índices
    __table_args__ = (
        Index('idx_notificacion_usuario', 'usuario_id'),
        Index('idx_notificacion_tipo', 'tipo'),
        Index('idx_notificacion_leida', 'leida'),
        Index('idx_notificacion_creado', 'creado_en'),
    )


class Alerta(Base):
    """
    Tabla de alertas emocionales para tutores.
    """
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    analisis_id = Column(Integer, ForeignKey("analisis.id"), nullable=False)
    
    # Información de la alerta
    tipo_alerta = Column(String(50), nullable=False)  # emocional, conductual, etc.
    nivel_urgencia = Column(String(50), nullable=False)  # crítica, alta, media, baja
    descripcion = Column(Text, nullable=False)
    
    # Estado de la alerta
    revisada = Column(Boolean, default=False, nullable=False)
    atendida = Column(Boolean, default=False, nullable=False)
    cerrada = Column(Boolean, default=False, nullable=False)
    
    # Información de atención
    tutor_asignado = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    notas_tutor = Column(Text, nullable=True)
    accion_tomada = Column(Text, nullable=True)
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)
    revisada_en = Column(DateTime, nullable=True)
    atendida_en = Column(DateTime, nullable=True)
    cerrada_en = Column(DateTime, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="alertas", foreign_keys=[usuario_id])
    analisis = relationship("Analisis")
    tutor = relationship("Usuario", foreign_keys=[tutor_asignado])
    intervenciones = relationship("Intervencion", back_populates="alerta", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_alerta_usuario', 'usuario_id'),
        Index('idx_alerta_urgencia', 'nivel_urgencia'),
        Index('idx_alerta_revisada', 'revisada'),
        Index('idx_alerta_tutor', 'tutor_asignado'),
        Index('idx_alerta_creado', 'creado_en'),
    )


class Intervencion(Base):
    """
    Tabla de intervenciones realizadas por tutores.
    """
    __tablename__ = "intervenciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)  # Estudiante
    tutor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)  # Tutor
    alerta_id = Column(Integer, ForeignKey("alertas.id"), nullable=True)
    sesion_id = Column(Integer, ForeignKey("sesiones_chat.id"), nullable=True)  # Sesión de chat relacionada
    
    # Información de la intervención
    tipo_intervencion = Column(String(50), nullable=False)  # directa, indirecta, etc.
    mensaje = Column(Text, nullable=False)
    metodo = Column(String(100), nullable=True)  # chat, email, llamada, etc.
    
    # Estado de la intervención
    enviada = Column(Boolean, default=False, nullable=False)
    recibida = Column(Boolean, default=False, nullable=False)
    efectiva = Column(Boolean, nullable=True)
    
    # Metadatos
    metadatos = Column(JSON, nullable=True)
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)
    enviada_en = Column(DateTime, nullable=True)
    recibida_en = Column(DateTime, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="intervenciones", foreign_keys=[usuario_id])
    tutor = relationship("Usuario", foreign_keys=[tutor_id])
    alerta = relationship("Alerta", back_populates="intervenciones")
    sesion = relationship("SesionChat", back_populates="intervenciones")
    
    # Índices
    __table_args__ = (
        Index('idx_intervencion_usuario', 'usuario_id'),
        Index('idx_intervencion_tutor', 'tutor_id'),
        Index('idx_intervencion_alerta', 'alerta_id'),
        Index('idx_intervencion_sesion', 'sesion_id'),
        Index('idx_intervencion_tipo', 'tipo_intervencion'),
        Index('idx_intervencion_creado', 'creado_en'),
    )


class SesionChat(Base):
    """
    Tabla de sesiones de chat para seguimiento entre estudiante y tutor.
    """
    __tablename__ = "sesiones_chat"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)  # Estudiante
    tutor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)     # Tutor asignado
    
    # Información de la sesión
    estado = Column(String(50), default="activa", nullable=False)  # activa, cerrada, pausada
    duracion_total = Column(Integer, nullable=True)  # en segundos
    mensajes_count = Column(Integer, default=0, nullable=False)
    metadatos = Column(JSON, nullable=True)  # Para reportes, resumen, motivo, etc.
    
    # Timestamps
    iniciada_en = Column(DateTime, default=func.now(), nullable=False)
    pausada_en = Column(DateTime, nullable=True)
    finalizada_en = Column(DateTime, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    tutor = relationship("Usuario", foreign_keys=[tutor_id])
    mensajes = relationship("Mensaje")
    intervenciones = relationship("Intervencion", back_populates="sesion", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_sesion_usuario', 'usuario_id'),
        Index('idx_sesion_tutor', 'tutor_id'),
        Index('idx_sesion_estado', 'estado'),
        Index('idx_sesion_iniciada', 'iniciada_en'),
    )


class Reporte(Base):
    """
    Tabla de reportes generados por tutores al finalizar sesiones.
    """
    __tablename__ = "reportes"

    id = Column(Integer, primary_key=True, index=True)
    sesion_id = Column(Integer, ForeignKey("sesiones_chat.id"), nullable=False)
    tutor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    estudiante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Información del reporte
    titulo = Column(String(255), nullable=False)
    contenido = Column(Text, nullable=False)  # Reporte generado por Gemini
    resumen_ejecutivo = Column(Text, nullable=True)
    
    # Análisis del reporte
    emociones_detectadas = Column(JSON, nullable=True)  # Lista de emociones principales
    alertas_generadas = Column(JSON, nullable=True)  # Lista de alertas durante la sesión
    recomendaciones = Column(JSON, nullable=True)  # Recomendaciones para el estudiante
    
    # Estado del reporte
    estado = Column(String(50), default="generado", nullable=False)  # generado, revisado, aprobado
    visible_estudiante = Column(Boolean, default=False, nullable=False)
    
    # Metadatos
    metadatos = Column(JSON, nullable=True)  # Información adicional del reporte
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)
    actualizado_en = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    sesion = relationship("SesionChat")
    tutor = relationship("Usuario", foreign_keys=[tutor_id])
    estudiante = relationship("Usuario", foreign_keys=[estudiante_id])
    
    # Índices
    __table_args__ = (
        Index('idx_reporte_sesion', 'sesion_id'),
        Index('idx_reporte_tutor', 'tutor_id'),
        Index('idx_reporte_estudiante', 'estudiante_id'),
        Index('idx_reporte_estado', 'estado'),
        Index('idx_reporte_creado', 'creado_en'),
    )


class Metricas(Base):
    """
    Tabla de métricas del sistema para análisis y monitoreo.
    """
    __tablename__ = "metricas"

    id = Column(Integer, primary_key=True, index=True)
    
    # Información de la métrica
    tipo_metrica = Column(String(100), nullable=False)  # rendimiento, uso, errores, etc.
    nombre = Column(String(255), nullable=False)
    valor = Column(Float, nullable=False)
    unidad = Column(String(50), nullable=True)
    
    # Contexto
    contexto = Column(JSON, nullable=True)
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)
    
    # Índices
    __table_args__ = (
        Index('idx_metrica_tipo', 'tipo_metrica'),
        Index('idx_metrica_nombre', 'nombre'),
        Index('idx_metrica_creado', 'creado_en'),
    )
