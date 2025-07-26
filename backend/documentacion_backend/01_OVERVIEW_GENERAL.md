# 🎯 VISIÓN GENERAL DEL SISTEMA - PSICHAT V2 BACKEND

## 📋 Descripción General

PsiChat V2 es una plataforma de **chatbot educativo con análisis emocional y soporte tutorial** que utiliza inteligencia artificial para proporcionar apoyo emocional y académico a estudiantes. El backend está construido con **FastAPI** y proporciona una API REST robusta con capacidades de WebSocket para comunicación en tiempo real.

## 🎯 Objetivos del Sistema

### Objetivos Principales
1. **Análisis Emocional en Tiempo Real**: Detectar y analizar el estado emocional de los estudiantes durante las conversaciones
2. **Soporte Tutorial Inteligente**: Proporcionar respuestas contextuales y empáticas usando Gemini AI
3. **Sistema de Alertas**: Generar alertas automáticas cuando se detecten estados emocionales críticos
4. **Intervención Tutorial**: Permitir a los tutores intervenir cuando sea necesario
5. **Análisis y Reportes**: Generar reportes detallados de las sesiones de chat

### Objetivos Técnicos
- **Alta Disponibilidad**: Sistema robusto con manejo de errores y recuperación automática
- **Escalabilidad**: Arquitectura modular que permite escalar componentes individualmente
- **Seguridad**: Autenticación JWT, autorización por roles, y validación de datos
- **Monitoreo**: Logging estructurado, métricas de rendimiento y alertas del sistema

## 🏗️ Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   WebSocket     │    │   ML Models     │
│   (React/Vite)  │◄──►│   Connection    │◄──►│   (Emotion/Style)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Auth API  │ │   Chat API  │ │ Analysis API│ │  Tutor API  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ WebSocket   │ │  Services   │ │   ML        │ │  Monitoring │ │
│  │   Service   │ │   Layer     │ │ Integration │ │   & Logging │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Users     │ │  Messages   │ │  Analysis   │ │   Reports   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  Sessions   │ │   Alerts    │ │Interventions│ │  Metrics    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Componentes Principales

### 1. **API REST (FastAPI)**
- **Autenticación**: JWT tokens con refresh automático
- **Chat**: Gestión de mensajes y sesiones
- **Análisis**: Procesamiento de emociones y estilos comunicativos
- **Tutor**: Dashboard y herramientas para tutores
- **Reportes**: Generación de reportes automáticos

### 2. **WebSocket Service**
- **Comunicación en tiempo real** entre frontend y backend
- **Notificaciones push** para alertas y actualizaciones
- **Sincronización de estado** entre múltiples sesiones

### 3. **Machine Learning Integration**
- **Detección de emociones**: Modelo entrenado con scikit-learn
- **Clasificación de estilos**: Análisis del estilo comunicativo
- **Integración con Gemini AI**: Para respuestas contextuales

### 4. **Base de Datos (SQLite/PostgreSQL)**
- **Modelos relacionales** para usuarios, mensajes, análisis
- **Sistema de migraciones** con Alembic
- **Índices optimizados** para consultas frecuentes

### 5. **Sistema de Monitoreo**
- **Logging estructurado** con structlog
- **Métricas de rendimiento** con Prometheus
- **Alertas automáticas** para errores críticos

## 🔄 Flujo de Datos Principal

### 1. **Flujo de Chat**
```
Usuario → Frontend → API Chat → Análisis ML → Gemini AI → Respuesta → Frontend
```

### 2. **Flujo de Análisis**
```
Mensaje → Preprocesamiento → Modelo Emociones → Modelo Estilos → Almacenamiento
```

### 3. **Flujo de Alertas**
```
Análisis → Evaluación Prioridad → Generación Alerta → Notificación Tutor
```

### 4. **Flujo de Intervención**
```
Tutor → Dashboard → Intervención → Notificación Estudiante → Seguimiento
```

## 🎨 Características Destacadas

### 🤖 **Inteligencia Artificial**
- **Gemini 2.0 Flash**: Para respuestas contextuales y empáticas
- **Análisis emocional**: Detección de 7 emociones principales
- **Clasificación de estilos**: 5 estilos comunicativos diferentes
- **Generación de reportes**: Resúmenes automáticos de sesiones

### 🔒 **Seguridad**
- **Autenticación JWT**: Tokens seguros con expiración
- **Autorización por roles**: Estudiante, Tutor, Admin
- **Validación de datos**: Pydantic para validación automática
- **Rate limiting**: Protección contra abuso de la API

### 📊 **Monitoreo y Analytics**
- **Logging estructurado**: Para debugging y auditoría
- **Métricas de rendimiento**: Tiempo de respuesta, uso de recursos
- **Alertas automáticas**: Para problemas críticos del sistema
- **Dashboard de métricas**: Para análisis de uso

### 🔄 **Escalabilidad**
- **Arquitectura modular**: Servicios independientes
- **Caché distribuido**: Con Redis (opcional)
- **Pool de conexiones**: Para base de datos
- **Async/await**: Para operaciones no bloqueantes

## 🚀 Tecnologías Utilizadas

### **Framework Principal**
- **FastAPI 0.104.1**: Framework web moderno y rápido
- **Uvicorn**: Servidor ASGI de alto rendimiento
- **Pydantic**: Validación de datos y serialización

### **Base de Datos**
- **SQLAlchemy 2.0+**: ORM moderno y type-safe
- **Alembic**: Sistema de migraciones
- **SQLite/PostgreSQL**: Bases de datos soportadas

### **Machine Learning**
- **scikit-learn**: Modelos de ML
- **joblib**: Serialización de modelos
- **NLTK**: Procesamiento de lenguaje natural

### **Monitoreo y Logging**
- **structlog**: Logging estructurado
- **prometheus-client**: Métricas de sistema
- **celery**: Tareas asíncronas (opcional)

## 📈 Métricas de Rendimiento

### **Objetivos de Rendimiento**
- **Tiempo de respuesta API**: < 200ms para endpoints críticos
- **Throughput**: 1000+ requests/segundo
- **Disponibilidad**: 99.9% uptime
- **Latencia WebSocket**: < 50ms

### **Métricas Monitoreadas**
- **Request/Response times**: Por endpoint
- **Error rates**: Porcentaje de errores
- **Memory usage**: Uso de memoria del sistema
- **CPU usage**: Utilización de CPU
- **Database connections**: Pool de conexiones

## 🔮 Roadmap y Futuras Mejoras

### **Corto Plazo (1-3 meses)**
- [ ] Optimización de consultas de base de datos
- [ ] Implementación de caché Redis
- [ ] Mejora del sistema de alertas
- [ ] Tests de integración completos

### **Mediano Plazo (3-6 meses)**
- [ ] Microservicios para escalabilidad
- [ ] Sistema de notificaciones push
- [ ] Analytics avanzados
- [ ] API GraphQL

### **Largo Plazo (6+ meses)**
- [ ] Machine Learning en tiempo real
- [ ] Integración con más servicios AI
- [ ] Sistema de recomendaciones
- [ ] Multi-tenancy

---

**Versión**: 2.0.0  
**Última actualización**: Julio 2024  
**Estado**: En desarrollo activo 