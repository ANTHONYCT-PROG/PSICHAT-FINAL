# 🛠️ STACK TECNOLÓGICO Y DEPENDENCIAS - PSICHAT V2

## 📦 Dependencias Principales

### **Framework Web - FastAPI**
```python
fastapi==0.104.1
uvicorn[standard]==0.24.0
```

**Propósito**: Framework web moderno y rápido para APIs REST
- **FastAPI**: Framework principal con soporte nativo para async/await
- **Uvicorn**: Servidor ASGI de alto rendimiento
- **Características**: Auto-documentación OpenAPI, validación automática, type hints

### **Validación y Serialización - Pydantic**
```python
pydantic>=2.5.0
pydantic-settings>=2.1.0
```

**Propósito**: Validación de datos y configuración
- **Pydantic**: Validación automática de tipos y serialización JSON
- **Pydantic-settings**: Gestión de configuración desde variables de entorno
- **Características**: Type safety, validación automática, serialización eficiente

## 🗄️ Base de Datos y ORM

### **SQLAlchemy 2.0+**
```python
sqlalchemy>=2.0.23
alembic>=1.13.1
psycopg2-binary>=2.9.9
```

**Propósito**: ORM moderno y sistema de migraciones
- **SQLAlchemy**: ORM type-safe con soporte para async
- **Alembic**: Sistema de migraciones de base de datos
- **psycopg2**: Driver para PostgreSQL (opcional)

### **Caché y Sesiones**
```python
redis>=5.0.1
aioredis>=2.0.1
cachetools>=5.3.2
```

**Propósito**: Caché distribuido y gestión de sesiones
- **Redis**: Base de datos en memoria para caché
- **aioredis**: Cliente async para Redis
- **cachetools**: Caché en memoria para Python

## 🔐 Autenticación y Seguridad

### **JWT y Criptografía**
```python
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
cryptography>=41.0.8
```

**Propósito**: Autenticación segura y hashing de contraseñas
- **python-jose**: Implementación de JWT
- **passlib**: Hashing seguro de contraseñas con bcrypt
- **cryptography**: Operaciones criptográficas

### **Validación de Entrada**
```python
python-multipart>=0.0.6
email-validator>=2.1.0
validators>=0.22.0
```

**Propósito**: Validación de datos de entrada
- **python-multipart**: Manejo de formularios multipart
- **email-validator**: Validación de emails
- **validators**: Validadores adicionales

## 🧠 Machine Learning

### **Scikit-learn y Procesamiento**
```python
scikit-learn>=1.3.2
joblib>=1.3.2
numpy>=1.24.3
pandas>=2.0.3
```

**Propósito**: Modelos de ML y procesamiento de datos
- **scikit-learn**: Algoritmos de machine learning
- **joblib**: Serialización eficiente de modelos
- **numpy**: Computación numérica
- **pandas**: Manipulación de datos

### **Procesamiento de Lenguaje Natural**
```python
nltk>=3.8.1
textblob>=0.17.1
spacy>=3.7.2
```

**Propósito**: Análisis de texto y NLP
- **NLTK**: Toolkit de procesamiento de lenguaje natural
- **TextBlob**: Procesamiento de texto simplificado
- **spaCy**: NLP industrial

## 🌐 Servicios Externos y HTTP

### **Clientes HTTP**
```python
httpx>=0.25.2
aiohttp>=3.9.1
requests>=2.31.0
```

**Propósito**: Comunicación con APIs externas
- **httpx**: Cliente HTTP async moderno
- **aiohttp**: Cliente HTTP async
- **requests**: Cliente HTTP síncrono (legacy)

## 📊 Logging y Monitoreo

### **Logging Estructurado**
```python
structlog>=23.2.0
python-json-logger>=2.0.7
```

**Propósito**: Logging estructurado y JSON
- **structlog**: Logging estructurado avanzado
- **python-json-logger**: Formato JSON para logs

### **Métricas y Monitoreo**
```python
prometheus-client>=0.19.0
psutil>=5.9.0
slowapi>=0.1.9
```

**Propósito**: Métricas de sistema y rendimiento
- **prometheus-client**: Métricas para Prometheus
- **psutil**: Información del sistema
- **slowapi**: Rate limiting

## 🔄 Tareas Asíncronas

### **Celery y Flower**
```python
celery>=5.3.4
flower>=2.0.1
```

**Propósito**: Tareas en segundo plano y monitoreo
- **Celery**: Sistema de tareas distribuidas
- **Flower**: Monitoreo web para Celery

## 🛠️ Utilidades y Herramientas

### **Configuración y Entorno**
```python
python-dotenv>=1.0.0
dynaconf>=3.2.4
```

**Propósito**: Gestión de configuración
- **python-dotenv**: Carga de variables de entorno
- **dynaconf**: Configuración dinámica

### **Manejo de Fechas y Validación**
```python
python-dateutil>=2.8.2
arrow>=1.3.0
marshmallow>=3.20.1
```

**Propósito**: Utilidades de fecha y validación
- **python-dateutil**: Utilidades para fechas
- **arrow**: Manejo de fechas más simple
- **marshmallow**: Serialización y validación

### **Procesamiento de Archivos**
```python
Pillow>=10.1.0
python-magic-bin
```

**Propósito**: Procesamiento de imágenes y archivos
- **Pillow**: Procesamiento de imágenes
- **python-magic-bin**: Detección de tipos de archivo

## 🚀 Producción y Despliegue

### **Servidor de Producción**
```python
gunicorn>=21.2.0
```

**Propósito**: Servidor WSGI para producción
- **Gunicorn**: Servidor WSGI robusto

### **Monitoreo de Errores**
```python
sentry-sdk[fastapi]>=1.38.0
```

**Propósito**: Monitoreo de errores en producción
- **Sentry**: Plataforma de monitoreo de errores

## 📋 Dependencias de Desarrollo

### **Testing**
```python
pytest>=7.0.0
pytest-asyncio>=0.21.0
httpx>=0.25.2
```

**Propósito**: Framework de testing
- **pytest**: Framework de testing principal
- **pytest-asyncio**: Soporte para testing async
- **httpx**: Cliente HTTP para testing

### **Linting y Formateo**
```python
black>=23.0.0
flake8>=6.0.0
mypy>=1.0.0
```

**Propósito**: Calidad de código
- **black**: Formateador de código
- **flake8**: Linter de Python
- **mypy**: Type checker

## 🔧 Configuración de Entorno

### **Variables de Entorno Principales**

```bash
# Configuración de la aplicación
APP_NAME=PsiChat Backend
APP_VERSION=2.0.0
DEBUG=False
ENVIRONMENT=production

# Base de datos
DATABASE_URL=sqlite:///./psichat.db
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Seguridad
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# Logging
LOG_LEVEL=INFO
LOG_FILE_PATH=logs

# Caché
CACHE_ENABLED=True
CACHE_TTL=300
REDIS_URL=redis://localhost:6379
```

## 📊 Compatibilidad de Versiones

### **Python**
- **Versión mínima**: Python 3.8
- **Versión recomendada**: Python 3.11+
- **Características requeridas**: Async/await, type hints, dataclasses

### **Sistemas Operativos**
- **Windows**: 10/11 (desarrollo y producción)
- **Linux**: Ubuntu 20.04+, CentOS 8+ (producción)
- **macOS**: 10.15+ (desarrollo)

### **Base de Datos**
- **SQLite**: 3.35+ (desarrollo)
- **PostgreSQL**: 12+ (producción recomendada)
- **Redis**: 6.0+ (opcional, para caché)

## 🔄 Gestión de Dependencias

### **Archivos de Dependencias**

```bash
# Dependencias principales
requirements.txt

# Dependencias de desarrollo
requirements-dev.txt

# Instalación
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Para desarrollo
```

### **Actualización de Dependencias**

```bash
# Verificar dependencias obsoletas
pip list --outdated

# Actualizar dependencias específicas
pip install --upgrade fastapi uvicorn

# Generar requirements.txt actualizado
pip freeze > requirements.txt
```

## 🚨 Consideraciones de Seguridad

### **Dependencias Críticas**
- **cryptography**: Para operaciones criptográficas
- **passlib**: Para hashing seguro de contraseñas
- **python-jose**: Para JWT seguros

### **Actualizaciones de Seguridad**
- Mantener todas las dependencias actualizadas
- Revisar regularmente vulnerabilidades conocidas
- Usar `pip-audit` para verificar vulnerabilidades

### **Configuración de Seguridad**
- Cambiar `SECRET_KEY` en producción
- Configurar `ALLOWED_ORIGINS` correctamente
- Usar HTTPS en producción
- Implementar rate limiting

## 📈 Rendimiento y Optimización

### **Dependencias Críticas para Rendimiento**
- **uvicorn**: Servidor ASGI de alto rendimiento
- **aioredis**: Cliente Redis async
- **httpx**: Cliente HTTP async
- **joblib**: Serialización eficiente de modelos ML

### **Optimizaciones Recomendadas**
- Usar `uvicorn` con workers múltiples
- Implementar caché Redis para consultas frecuentes
- Optimizar consultas de base de datos
- Usar async/await para operaciones I/O

---

**Versión**: 2.0.0  
**Última actualización**: Julio 2024  
**Gestor de dependencias**: pip 