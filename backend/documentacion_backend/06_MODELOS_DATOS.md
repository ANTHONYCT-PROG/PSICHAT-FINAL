# 🗄️ MODELOS DE DATOS - PSICHAT V2 BACKEND

## 📋 Visión General

Los modelos de datos de PsiChat V2 están diseñados siguiendo principios de **Domain-Driven Design** y utilizan **SQLAlchemy 2.0+** como ORM. La estructura de la base de datos está optimizada para el análisis emocional, la gestión de chat y el sistema tutorial.

## 🏗️ Arquitectura de Modelos

### **Jerarquía de Modelos**

```
Base (SQLAlchemy)
├── Usuario (Entidad Principal)
├── Mensaje (Entidad de Comunicación)
├── Analisis (Entidad de Análisis)
├── SesionChat (Entidad de Sesión)
├── Alerta (Entidad de Monitoreo)
├── Intervencion (Entidad de Acción)
├── Notificacion (Entidad de Comunicación)
├── Reporte (Entidad de Documentación)
└── Metricas (Entidad de Monitoreo)
```

## 👤 Modelo Usuario

### **Definición del Modelo**
```python
class Usuario(Base):
    """Tabla de usuarios registrados con información completa."""
    __tablename__ = "usuarios"

    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    apellido = Column(String(255), nullable=True)
    
    # Autenticación
    hashed_password = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario), default=RolUsuario.ESTUDIANTE, nullable=False)
    estado = Column(Enum(EstadoUsuario), default=EstadoUsuario.ACTIVO, nullable=False)
    
    # Información personal
    telefono = Column(String(20), nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=True)
    genero = Column(String(20), nullable=True)
    institucion = Column(String(255), nullable=True)
    grado_academico = Column(String(100), nullable=True)
    
    # Configuraciones
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
```

### **Enums Relacionados**
```python
class RolUsuario(enum.Enum):
    ESTUDIANTE = "estudiante"
    TUTOR = "tutor"
    ADMIN = "admin"

class EstadoUsuario(enum.Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"
```

### **Índices y Optimización**
```python
__table_args__ = (
    Index('idx_usuario_email', 'email'),
    Index('idx_usuario_rol', 'rol'),
    Index('idx_usuario_estado', 'estado'),
)
```

## 💬 Modelo Mensaje

### **Definición del Modelo**
```python
class Mensaje(Base):
    """Tabla de mensajes enviados por usuarios y bot."""
    __tablename__ = "mensajes"

    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    sesion_id = Column(Integer, ForeignKey("sesiones_chat.id"), nullable=True)
    
    # Contenido
    texto = Column(Text, nullable=False)
    remitente = Column(String(50), nullable=False, default="user")  # 'user' o 'bot'
    
    # Metadatos
    tipo_mensaje = Column(String(50), default="texto")  # texto, imagen, archivo
    metadatos = Column(JSON, nullable=True)  # Información adicional del mensaje
    
    # Timestamps
    creado_en = Column(DateTime, default=func.now(), nullable=False)

    # Relaciones
    usuario = relationship("Usuario", back_populates="mensajes")
    analisis = relationship("Analisis", back_populates="mensaje", uselist=False, cascade="all, delete-orphan")
```

### **Tipos de Mensaje**
- **texto**: Mensaje de texto normal
- **imagen**: Mensaje con imagen adjunta
- **archivo**: Mensaje con archivo adjunto
- **sistema**: Mensaje del sistema

### **Metadatos del Mensaje**
```python
# Ejemplo de metadatos JSON
{
    "longitud_texto": 150,
    "idioma": "es",
    "sentimiento_detectado": "positivo",
    "palabras_clave": ["ayuda", "problema", "estudio"],
    "archivo_adjunto": {
        "nombre": "documento.pdf",
        "tamaño": 1024000,
        "tipo": "application/pdf"
    }
}
```

## 🧠 Modelo Análisis

### **Definición del Modelo**
```python
class Analisis(Base):
    """Tabla con el análisis emocional y estilístico de cada mensaje."""
    __tablename__ = "analisis"

    # Identificación
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
```

### **Distribución de Emociones**
```python
# Ejemplo de distribucion_emociones JSON
{
    "alegria": 0.15,
    "tristeza": 0.05,
    "enojo": 0.10,
    "miedo": 0.02,
    "sorpresa": 0.08,
    "disgusto": 0.01,
    "neutral": 0.59
}
```

### **Distribución de Estilos**
```python
# Ejemplo de distribucion_estilos JSON
{
    "analitico": 0.25,
    "intuitivo": 0.15,
    "pragmatico": 0.30,
    "reflexivo": 0.20,
    "activo": 0.10
}
```

### **Recomendaciones**
```python
# Ejemplo de recomendaciones JSON
{
    "inmediatas": [
        "Ofrecer apoyo emocional",
        "Sugerir técnicas de relajación"
    ],
    "a_medio_plazo": [
        "Programar sesión con tutor",
        "Revisar estrategias de estudio"
    ],
    "especializadas": [
        "Consultar con psicólogo",
        "Evaluar carga académica"
    ]
}
```

## 🚨 Modelo Alerta

### **Definición del Modelo**
```python
class Alerta(Base):
    """Tabla de alertas emocionales para tutores."""
    __tablename__ = "alertas"

    # Identificación
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
```

### **Tipos de Alerta**
- **emocional**: Estados emocionales críticos
- **conductual**: Cambios en el comportamiento
- **academica**: Problemas académicos
- **social**: Problemas de interacción social
- **tecnica**: Problemas técnicos del sistema

### **Niveles de Urgencia**
- **crítica**: Requiere atención inmediata
- **alta**: Requiere atención en las próximas horas
- **media**: Requiere atención en el día
- **baja**: Requiere seguimiento

## 🤝 Modelo Intervención

### **Definición del Modelo**
```python
class Intervencion(Base):
    """Tabla de intervenciones realizadas por tutores."""
    __tablename__ = "intervenciones"

    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)  # Estudiante
    tutor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)  # Tutor
    alerta_id = Column(Integer, ForeignKey("alertas.id"), nullable=True)
    sesion_id = Column(Integer, ForeignKey("sesiones_chat.id"), nullable=True)
    
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
```

### **Tipos de Intervención**
- **directa**: Intervención inmediata en el chat
- **indirecta**: Intervención a través de otros medios
- **preventiva**: Intervención antes de que surja un problema
- **correctiva**: Intervención para resolver un problema existente

### **Métodos de Intervención**
- **chat**: Intervención a través del chat
- **email**: Intervención por correo electrónico
- **llamada**: Intervención por llamada telefónica
- **reunion**: Intervención en reunión presencial
- **notificacion**: Intervención por notificación push

## 💬 Modelo Sesión de Chat

### **Definición del Modelo**
```python
class SesionChat(Base):
    """Tabla de sesiones de chat para seguimiento entre estudiante y tutor."""
    __tablename__ = "sesiones_chat"

    # Identificación
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
```

### **Estados de Sesión**
- **activa**: Sesión en curso
- **pausada**: Sesión temporalmente suspendida
- **cerrada**: Sesión finalizada
- **archivada**: Sesión archivada para consulta

### **Metadatos de Sesión**
```python
# Ejemplo de metadatos JSON
{
    "motivo_sesion": "Problemas académicos",
    "tema_principal": "Matemáticas",
    "nivel_urgencia": "media",
    "emociones_detectadas": ["frustración", "ansiedad"],
    "resumen_sesion": "El estudiante mostró dificultades con álgebra...",
    "recomendaciones": [
        "Practicar ejercicios básicos",
        "Consultar material adicional"
    ]
}
```

## 📢 Modelo Notificación

### **Definición del Modelo**
```python
class Notificacion(Base):
    """Tabla de notificaciones del sistema."""
    __tablename__ = "notificaciones"

    # Identificación
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
```

### **Tipos de Notificación**
- **alerta**: Notificación de alerta del sistema
- **sistema**: Notificación del sistema
- **intervencion**: Notificación de intervención
- **recordatorio**: Notificación de recordatorio
- **actualizacion**: Notificación de actualización

## 📊 Modelo Reporte

### **Definición del Modelo**
```python
class Reporte(Base):
    """Tabla de reportes generados por tutores al finalizar sesiones."""
    __tablename__ = "reportes"

    # Identificación
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
```

### **Estados de Reporte**
- **generado**: Reporte generado automáticamente
- **revisado**: Reporte revisado por tutor
- **aprobado**: Reporte aprobado y finalizado
- **archivado**: Reporte archivado

## 📈 Modelo Métricas

### **Definición del Modelo**
```python
class Metricas(Base):
    """Tabla de métricas del sistema para análisis y monitoreo."""
    __tablename__ = "metricas"

    # Identificación
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
```

### **Tipos de Métricas**
- **rendimiento**: Métricas de rendimiento del sistema
- **uso**: Métricas de uso de la aplicación
- **errores**: Métricas de errores y excepciones
- **usuarios**: Métricas relacionadas con usuarios
- **analisis**: Métricas de análisis de ML

## 🔗 Relaciones entre Modelos

### **Diagrama de Relaciones**
```
Usuario (1) ←→ (N) Mensaje
Usuario (1) ←→ (N) Analisis
Usuario (1) ←→ (N) Alerta
Usuario (1) ←→ (N) Intervencion
Usuario (1) ←→ (N) Notificacion
Usuario (1) ←→ (N) SesionChat
Usuario (1) ←→ (N) Reporte

Mensaje (1) ←→ (1) Analisis
Analisis (1) ←→ (N) Alerta
Alerta (1) ←→ (N) Intervencion

SesionChat (1) ←→ (N) Mensaje
SesionChat (1) ←→ (N) Intervencion
SesionChat (1) ←→ (1) Reporte
```

### **Cascade Options**
```python
# Ejemplos de cascade
cascade="all, delete-orphan"  # Eliminar registros relacionados
cascade="save-update"         # Guardar/actualizar registros relacionados
cascade="merge"              # Fusionar registros relacionados
```

## 📊 Índices y Optimización

### **Índices Principales**
```python
# Índices para consultas frecuentes
Index('idx_usuario_email', 'email')
Index('idx_mensaje_usuario', 'usuario_id')
Index('idx_mensaje_creado', 'creado_en')
Index('idx_analisis_mensaje', 'mensaje_id')
Index('idx_analisis_emocion', 'emocion')
Index('idx_alerta_usuario', 'usuario_id')
Index('idx_alerta_urgencia', 'nivel_urgencia')
Index('idx_sesion_usuario', 'usuario_id')
Index('idx_sesion_estado', 'estado')
```

### **Optimizaciones de Consulta**
```python
# Ejemplo de consulta optimizada
def get_user_messages_with_analysis(user_id: int, limit: int = 50):
    """Obtener mensajes con análisis en una sola consulta"""
    return db.query(Mensaje).options(
        joinedload(Mensaje.analisis),
        joinedload(Mensaje.usuario)
    ).filter(
        Mensaje.usuario_id == user_id
    ).order_by(
        Mensaje.creado_en.desc()
    ).limit(limit).all()
```

## 🔄 Migraciones y Versionado

### **Sistema de Migraciones**
```python
# migrations/versions/004_add_reportes_table.py
"""Add reportes table

Revision ID: 004
Revises: 003
Create Date: 2024-07-13 19:22:00.000000

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    """Crear tabla de reportes"""
    op.create_table(
        'reportes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sesion_id', sa.Integer(), nullable=False),
        sa.Column('tutor_id', sa.Integer(), nullable=False),
        sa.Column('estudiante_id', sa.Integer(), nullable=False),
        sa.Column('titulo', sa.String(255), nullable=False),
        sa.Column('contenido', sa.Text(), nullable=False),
        sa.Column('resumen_ejecutivo', sa.Text(), nullable=True),
        sa.Column('emociones_detectadas', sa.JSON(), nullable=True),
        sa.Column('alertas_generadas', sa.JSON(), nullable=True),
        sa.Column('recomendaciones', sa.JSON(), nullable=True),
        sa.Column('estado', sa.String(50), default='generado', nullable=False),
        sa.Column('visible_estudiante', sa.Boolean(), default=False, nullable=False),
        sa.Column('metadatos', sa.JSON(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), default=sa.func.now(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['sesion_id'], ['sesiones_chat.id'], ),
        sa.ForeignKeyConstraint(['tutor_id'], ['usuarios.id'], ),
        sa.ForeignKeyConstraint(['estudiante_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    """Eliminar tabla de reportes"""
    op.drop_table('reportes')
```

## 🧪 Testing de Modelos

### **Tests de Modelos**
```python
# tests/test_database.py
def test_create_user():
    """Test crear usuario"""
    user = Usuario(
        email="test@example.com",
        nombre="Test User",
        hashed_password="hashed_password",
        rol=RolUsuario.ESTUDIANTE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.rol == RolUsuario.ESTUDIANTE

def test_user_relationships():
    """Test relaciones de usuario"""
    user = create_test_user()
    message = Mensaje(
        usuario_id=user.id,
        texto="Test message",
        remitente="user"
    )
    db.add(message)
    db.commit()
    
    assert len(user.mensajes) == 1
    assert user.mensajes[0].texto == "Test message"
```

---

**Versión**: 2.0.0  
**Última actualización**: Julio 2024  
**ORM**: SQLAlchemy 2.0+ con soporte para async 