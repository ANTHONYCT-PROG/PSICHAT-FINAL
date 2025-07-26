# 📚 DOCUMENTACIÓN DEL BACKEND - PSICHAT V2

## 🎯 Resumen Ejecutivo

Esta documentación proporciona un análisis completo y detallado del backend de PsiChat V2, una plataforma de chatbot educativo con análisis emocional y soporte tutorial. El sistema está construido con **FastAPI** y utiliza **Machine Learning** para proporcionar apoyo emocional y académico a estudiantes.

## 📋 Documentos Disponibles

### ✅ **Documentos Completados**

1. **[00_INDICE_GENERAL.md](./00_INDICE_GENERAL.md)** - Índice completo de toda la documentación
2. **[01_OVERVIEW_GENERAL.md](./01_OVERVIEW_GENERAL.md)** - Visión general del sistema
3. **[02_ARQUITECTURA.md](./02_ARQUITECTURA.md)** - Arquitectura del backend
4. **[03_TECNOLOGIAS.md](./03_TECNOLOGIAS.md)** - Stack tecnológico y dependencias
5. **[04_ESTRUCTURA_PROYECTO.md](./04_ESTRUCTURA_PROYECTO.md)** - Organización de carpetas y archivos
6. **[05_CONFIGURACION.md](./05_CONFIGURACION.md)** - Configuración y variables de entorno
7. **[06_MODELOS_DATOS.md](./06_MODELOS_DATOS.md)** - Modelos de datos y esquemas

### 🔄 **Documentos en Progreso**

8. **[07_MIGRACIONES.md](./07_MIGRACIONES.md)** - Sistema de migraciones
9. **[08_CRUD_OPERACIONES.md](./08_CRUD_OPERACIONES.md)** - Operaciones de base de datos
10. **[09_API_OVERVIEW.md](./09_API_OVERVIEW.md)** - Visión general de la API
11. **[10_ENDPOINTS_AUTH.md](./10_ENDPOINTS_AUTH.md)** - Endpoints de autenticación
12. **[11_ENDPOINTS_CHAT.md](./11_ENDPOINTS_CHAT.md)** - Endpoints de chat
13. **[12_ENDPOINTS_ANALISIS.md](./12_ENDPOINTS_ANALISIS.md)** - Endpoints de análisis
14. **[13_ENDPOINTS_TUTOR.md](./13_ENDPOINTS_TUTOR.md)** - Endpoints de tutor
15. **[14_ENDPOINTS_WEBSOCKET.md](./14_ENDPOINTS_WEBSOCKET.md)** - WebSockets

### 📝 **Documentos Pendientes**

16. **[15_SERVICIOS_OVERVIEW.md](./15_SERVICIOS_OVERVIEW.md)** - Visión general de servicios
17. **[16_SERVICIO_CHAT.md](./16_SERVICIO_CHAT.md)** - Servicio de chat
18. **[17_SERVICIO_ANALISIS.md](./17_SERVICIO_ANALISIS.md)** - Servicio de análisis
19. **[18_SERVICIO_TUTOR.md](./18_SERVICIO_TUTOR.md)** - Servicio de tutor
20. **[19_SERVICIO_WEBSOCKET.md](./19_SERVICIO_WEBSOCKET.md)** - Servicio WebSocket
21. **[20_ML_OVERVIEW.md](./20_ML_OVERVIEW.md)** - Visión general de ML
22. **[21_MODELO_EMOCIONES.md](./21_MODELO_EMOCIONES.md)** - Modelo de detección de emociones
23. **[22_MODELO_ESTILOS.md](./22_MODELO_ESTILOS.md)** - Modelo de clasificación de estilos
24. **[23_INTEGRACION_GEMINI.md](./23_INTEGRACION_GEMINI.md)** - Integración con Gemini AI
25. **[24_SEGURIDAD.md](./24_SEGURIDAD.md)** - Medidas de seguridad
26. **[25_AUTENTICACION.md](./25_AUTENTICACION.md)** - Sistema de autenticación
27. **[26_AUTORIZACION.md](./26_AUTORIZACION.md)** - Control de acceso
28. **[27_LOGGING.md](./27_LOGGING.md)** - Sistema de logging
29. **[28_METRICAS.md](./28_METRICAS.md)** - Métricas y monitoreo
30. **[29_PERFORMANCE.md](./29_PERFORMANCE.md)** - Optimización de rendimiento
31. **[30_TESTING.md](./30_TESTING.md)** - Estrategia de testing
32. **[31_TESTS_UNITARIOS.md](./31_TESTS_UNITARIOS.md)** - Tests unitarios
33. **[32_TESTS_INTEGRACION.md](./32_TESTS_INTEGRACION.md)** - Tests de integración
34. **[33_DESPLIEGUE.md](./33_DESPLIEGUE.md)** - Guía de despliegue
35. **[34_PRODUCCION.md](./34_PRODUCCION.md)** - Configuración de producción
36. **[35_MANTENIMIENTO.md](./35_MANTENIMIENTO.md)** - Mantenimiento del sistema
37. **[36_GUIA_DESARROLLO.md](./36_GUIA_DESARROLLO.md)** - Guía para desarrolladores
38. **[37_CONVENCIONES.md](./37_CONVENCIONES.md)** - Convenciones de código
39. **[38_TROUBLESHOOTING.md](./38_TROUBLESHOOTING.md)** - Solución de problemas

## 🏗️ Arquitectura Resumida

### **Stack Tecnológico Principal**
- **Framework**: FastAPI 0.104.1
- **ORM**: SQLAlchemy 2.0+
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Autenticación**: JWT con python-jose
- **Machine Learning**: scikit-learn, joblib
- **AI**: Gemini 2.0 Flash API
- **Logging**: structlog
- **Testing**: pytest

### **Arquitectura en Capas**
```
┌─────────────────┐
│  Presentation   │ ← FastAPI Routes, WebSocket
├─────────────────┤
│  Application    │ ← Services, DTOs, Validation
├─────────────────┤
│     Domain      │ ← Models, Entities, Business Rules
├─────────────────┤
│ Infrastructure  │ ← Database, External APIs, File System
└─────────────────┘
```

### **Componentes Principales**
1. **API REST**: Endpoints para chat, análisis, tutor, autenticación
2. **WebSocket**: Comunicación en tiempo real
3. **Machine Learning**: Análisis emocional y clasificación de estilos
4. **Sistema de Alertas**: Monitoreo automático de estados críticos
5. **Dashboard de Tutor**: Herramientas para intervención tutorial
6. **Sistema de Reportes**: Generación automática de reportes

## 📊 Estadísticas del Sistema

### **Modelos de Datos**
- **8 entidades principales**: Usuario, Mensaje, Análisis, Alerta, Intervención, Sesión, Notificación, Reporte
- **3 enums**: RolUsuario, EstadoUsuario, tipos de alerta
- **15+ relaciones**: Entre entidades con cascade apropiado
- **20+ índices**: Para optimización de consultas

### **Endpoints API**
- **6 módulos de rutas**: auth, chat, analysis, tutor, websocket, reportes
- **30+ endpoints**: Cubriendo todas las funcionalidades
- **WebSocket**: Para comunicación en tiempo real
- **Documentación automática**: OpenAPI/Swagger

### **Servicios**
- **6 servicios principales**: chat, analysis, tutor, websocket, reporte, user
- **Integración ML**: 2 modelos (emociones y estilos)
- **Integración AI**: Gemini 2.0 Flash para respuestas
- **Sistema de caché**: Redis (opcional)

## 🔍 Análisis Realizado

### **Código Analizado**
- ✅ **main.py**: Punto de entrada y configuración FastAPI
- ✅ **config.py**: Sistema de configuración centralizado
- ✅ **models.py**: Modelos de datos completos
- ✅ **requirements.txt**: Dependencias y versiones
- ✅ **Estructura de carpetas**: Organización del proyecto
- ✅ **Archivos de configuración**: pytest.ini, env.example

### **Patrones Identificados**
- **Clean Architecture**: Separación clara de responsabilidades
- **Dependency Injection**: Inyección de dependencias con FastAPI
- **Repository Pattern**: Operaciones CRUD centralizadas
- **Service Layer**: Lógica de negocio en servicios
- **Observer Pattern**: WebSocket para notificaciones
- **Factory Pattern**: Gestión de modelos ML

### **Características Destacadas**
- **Async/Await**: Operaciones no bloqueantes
- **Type Safety**: Pydantic para validación
- **Structured Logging**: Logs JSON estructurados
- **Error Handling**: Manejo centralizado de excepciones
- **Security**: JWT, CORS, rate limiting
- **Monitoring**: Métricas y alertas automáticas

## 🚀 Próximos Pasos

### **Documentación Pendiente**
1. **Análisis de endpoints**: Revisar cada módulo de rutas
2. **Análisis de servicios**: Documentar lógica de negocio
3. **Análisis de ML**: Documentar modelos y entrenamiento
4. **Análisis de seguridad**: Documentar medidas de seguridad
5. **Análisis de testing**: Documentar estrategia de tests
6. **Análisis de despliegue**: Documentar configuración de producción

### **Mejoras Identificadas**
- [ ] Optimización de consultas de base de datos
- [ ] Implementación de caché Redis
- [ ] Mejora del sistema de alertas
- [ ] Tests de integración completos
- [ ] Documentación de API más detallada
- [ ] Configuración de monitoreo avanzado

## 📖 Cómo Usar Esta Documentación

### **Para Nuevos Desarrolladores**
1. Comenzar con `01_OVERVIEW_GENERAL.md`
2. Revisar `02_ARQUITECTURA.md` para entender la estructura
3. Consultar `03_TECNOLOGIAS.md` para el stack tecnológico
4. Explorar `06_MODELOS_DATOS.md` para entender los datos

### **Para Entender la API**
1. Revisar `09_API_OVERVIEW.md` (cuando esté disponible)
2. Consultar los documentos de endpoints específicos
3. Revisar `15_SERVICIOS_OVERVIEW.md` (cuando esté disponible)

### **Para Trabajar con ML**
1. Consultar `20_ML_OVERVIEW.md` (cuando esté disponible)
2. Revisar los documentos de modelos específicos
3. Explorar la integración con Gemini AI

### **Para Problemas**
1. Ir directamente a `38_TROUBLESHOOTING.md` (cuando esté disponible)
2. Revisar logs y métricas
3. Consultar la documentación de configuración

## 🔄 Mantenimiento de la Documentación

### **Actualización Automática**
Esta documentación se actualiza automáticamente cuando se realizan cambios significativos en el código. Para mantenerla actualizada:

1. Actualizar los archivos correspondientes cuando modifiques código
2. Ejecutar el script de generación de documentación si existe
3. Revisar que los ejemplos de código estén actualizados

### **Versiones**
- **Versión actual**: 2.0.0
- **Última actualización**: Julio 2024
- **Estado**: En desarrollo activo

---

**Autor**: Sistema de documentación automática  
**Contacto**: Para preguntas sobre la documentación, consultar el equipo de desarrollo 