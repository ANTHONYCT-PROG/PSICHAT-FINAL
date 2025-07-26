# 🚀 PsiChatV2 - Guía de Instalación Completa

## 📋 Requisitos del Sistema

### Software Necesario:
- **Python 3.8+** (recomendado 3.9 o 3.10)
- **Node.js 18+** (recomendado 18.20.8)
- **Git** (opcional, para clonar/actualizar)

### Sistema Operativo:
- ✅ **Windows 10/11**
- ✅ **macOS 10.15+**
- ✅ **Ubuntu 20.04+ / Debian 11+**

## 🎯 Instalación Automática

### Windows:
```bash
# Ejecutar el script de instalación
install.bat
```

### Linux/macOS:
```bash
# Dar permisos de ejecución
chmod +x install.sh

# Ejecutar el script de instalación
./install.sh
```

## 🔧 Instalación Manual

### 1. Verificar Prerrequisitos

**Python:**
```bash
python --version  # Debe ser 3.8+
```

**Node.js:**
```bash
node --version   # Debe ser 18+
npm --version    # Debe estar instalado
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar configuración (opcional)
nano .env  # o notepad .env en Windows
```

### 3. Instalar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Entrenar modelos de ML
cd ml_models/emotion_detection
python train.py
cd ../style_classification
python train.py
cd ../..

# Inicializar base de datos
python init_db.py

# Crear usuarios de prueba
python create_test_users.py

cd ..
```

### 4. Instalar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

cd ..
```

### 5. Crear Directorios Necesarios

```bash
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/temp
```

## 🚀 Iniciar la Aplicación

### Terminal 1 - Backend:
```bash
cd backend

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Iniciar servidor
python -m uvicorn app.main:app --reload
```

### Terminal 2 - Frontend:
```bash
cd frontend

# Iniciar servidor de desarrollo
npm run dev
```

## 🌐 Acceso a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

## 👥 Usuarios de Prueba

Se crean automáticamente estos usuarios:

usa esto 

tutor.pedro@academia.edu.bo
12345678

anthonycondori860@gmail.com
acuerdatepes1



| Rol | Email | Contraseña |
|-----|-------|------------|
| Estudiante | estudiante@test.com | password123 |
| Tutor | tutor@test.com | password123 |
| Admin | admin@test.com | password123 |

## 📁 Estructura de Archivos Importantes

```
PsiChatV2/
├── .env                    # Variables de entorno
├── backend/
│   ├── venv/              # Entorno virtual Python
│   ├── psichat.db         # Base de datos SQLite
│   ├── logs/              # Archivos de log
│   ├── ml_models/         # Modelos de Machine Learning
│   └── requirements.txt   # Dependencias Python
├── frontend/
│   ├── node_modules/      # Dependencias Node.js
│   ├── package.json       # Configuración npm
│   └── src/               # Código fuente React
├── install.sh             # Script de instalación Linux/macOS
├── install.bat            # Script de instalación Windows
└── README_INSTALACION.md  # Este archivo
```

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)

```bash
# Entorno
ENVIRONMENT=development
DEBUG=true

# Seguridad
SECRET_KEY=tu_clave_secreta_aqui_cambiala_en_produccion

# Base de datos
DATABASE_URL=sqlite:///./psichat.db

# Logging
LOG_LEVEL=INFO
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=10485760
LOG_BACKUP_COUNT=5

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]
```

### Base de Datos

**SQLite (por defecto):**
- Archivo: `backend/psichat.db`
- No requiere configuración adicional

**PostgreSQL (opcional):**
```bash
# Cambiar en .env:
DATABASE_URL=postgresql://usuario:password@localhost/psichat
```

## 🐛 Solución de Problemas

### Error: "Python no encontrado"
```bash
# Instalar Python desde python.org
# Asegurarse de marcar "Add to PATH" durante la instalación
```

### Error: "Node.js no encontrado"
```bash
# Instalar Node.js desde nodejs.org
# O usar nvm (Node Version Manager)
```

### Error: "pip no encontrado"
```bash
# En Windows, usar:
python -m pip install --upgrade pip
```

### Error: "npm no encontrado"
```bash
# Reinstalar Node.js (incluye npm)
```

### Error: "Puerto en uso"
```bash
# Cambiar puertos en los comandos de inicio:
# Backend: --port 8001
# Frontend: --port 5174
```

### Error: "Base de datos no encontrada"
```bash
cd backend
python init_db.py
```

### Error: "Modelos ML no encontrados"
```bash
cd backend/ml_models/emotion_detection
python train.py
cd ../style_classification
python train.py
```

## 📊 Monitoreo y Logs

### Logs del Backend:
- **Errores**: `backend/logs/errors.log`
- **Acceso**: `backend/logs/access.log`
- **Debug**: `backend/logs/debug.log` (solo si LOG_LEVEL=DEBUG)
- **Performance**: `backend/logs/performance.log`

### Logs del Frontend:
- **Consola del navegador**: F12 → Console
- **Terminal**: Donde ejecutas `npm run dev`

## 🔒 Seguridad para Producción

1. **Cambiar SECRET_KEY**:
   ```bash
   # Generar clave segura
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Configurar HTTPS**:
   ```bash
   # Usar proxy reverso (nginx/apache)
   # O configurar SSL en uvicorn
   ```

3. **Restringir CORS**:
   ```bash
   # En .env, cambiar ALLOWED_ORIGINS
   ALLOWED_ORIGINS=["https://tudominio.com"]
   ```

4. **Configurar base de datos externa**:
   ```bash
   # PostgreSQL o MySQL en lugar de SQLite
   DATABASE_URL=postgresql://usuario:password@servidor/psichat
   ```

## 📞 Soporte

Si encuentras problemas:

1. **Verificar logs**: `backend/logs/`
2. **Revisar configuración**: archivo `.env`
3. **Verificar puertos**: 8000 (backend) y 5173 (frontend)
4. **Reinstalar dependencias**: `pip install -r requirements.txt` y `npm install`

## 🎉 ¡Listo!

Tu aplicación PsiChatV2 está lista para usar. 

**Recuerda:**
- Los logs personalizados solo aparecen en archivos, no en consola
- Solo verás logs de Uvicorn estándar en la terminal
- La aplicación es completamente funcional con SQLite
- Puedes personalizar la configuración según tus necesidades 