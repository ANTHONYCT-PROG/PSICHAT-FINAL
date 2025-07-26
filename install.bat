@echo off
echo 🚀 Instalando PsiChatV2...
echo ================================

REM Verificar Python
echo 📋 Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado. Por favor instala Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python encontrado:
python --version

REM Verificar Node.js
echo 📋 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js 18+
    pause
    exit /b 1
)
echo ✅ Node.js encontrado:
node --version

REM Verificar npm
echo 📋 Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm no está instalado
    pause
    exit /b 1
)
echo ✅ npm encontrado:
npm --version

REM Crear archivo .env si no existe
echo 📋 Configurando variables de entorno...
if not exist ".env" (
    if exist "env.example" (
        copy env.example .env >nul
        echo ✅ Archivo .env creado desde env.example
    ) else (
        echo ⚠️  No se encontró env.example, creando .env básico...
        (
            echo # Configuración de PsiChatV2
            echo ENVIRONMENT=development
            echo DEBUG=true
            echo SECRET_KEY=tu_clave_secreta_aqui_cambiala_en_produccion
            echo DATABASE_URL=sqlite:///./psichat.db
            echo LOG_LEVEL=INFO
            echo LOG_FILE_PATH=./logs
            echo LOG_MAX_SIZE=10485760
            echo LOG_BACKUP_COUNT=5
            echo ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]
        ) > .env
        echo ✅ Archivo .env básico creado
    )
) else (
    echo ✅ Archivo .env ya existe
)

REM Instalar dependencias del backend
echo 📋 Instalando dependencias del backend...
cd backend

REM Crear entorno virtual si no existe
if not exist "venv" (
    echo 📋 Creando entorno virtual...
    python -m venv venv
)

REM Activar entorno virtual
echo 📋 Activando entorno virtual...
call venv\Scripts\activate.bat

REM Instalar dependencias
echo 📋 Instalando dependencias de Python...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Entrenar modelos de ML
echo 📋 Entrenando modelos de Machine Learning...
cd ml_models\emotion_detection
python train.py
cd ..\style_classification
python train.py
cd ..\..

REM Inicializar base de datos
echo 📋 Inicializando base de datos...
python init_db.py

REM Crear usuarios de prueba
echo 📋 Creando usuarios de prueba...
python create_test_users.py

cd ..

REM Instalar dependencias del frontend
echo 📋 Instalando dependencias del frontend...
cd frontend
npm install

cd ..

REM Crear directorios necesarios
echo 📋 Creando directorios necesarios...
if not exist "backend\logs" mkdir backend\logs
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\temp" mkdir backend\temp

echo ================================
echo ✅ Instalación completada!
echo.
echo 🚀 Para iniciar el proyecto:
echo.
echo 1. Backend:
echo    cd backend
echo    venv\Scripts\activate
echo    python -m uvicorn app.main:app --reload
echo.
echo 2. Frontend (en otra terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 3. Acceder a:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000
echo    Documentación API: http://localhost:8000/docs
echo.
echo 👥 Usuarios de prueba creados:
echo    Estudiante: estudiante@test.com / password123
echo    Tutor: tutor@test.com / password123
echo    Admin: admin@test.com / password123
echo.
echo 📝 Notas importantes:
echo    - Cambia la SECRET_KEY en .env para producción
echo    - Los logs se guardan en backend/logs/
echo    - La base de datos es SQLite (backend/psichat.db)
echo.
pause 