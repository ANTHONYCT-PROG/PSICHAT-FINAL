#!/bin/bash

echo "🚀 Instalando PsiChatV2..."
echo "================================"

# Verificar Python
echo "📋 Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Por favor instala Python 3.8+"
    exit 1
fi
echo "✅ Python encontrado: $(python3 --version)"

# Verificar Node.js
echo "📋 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi
echo "✅ Node.js encontrado: $(node --version)"

# Verificar npm
echo "📋 Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi
echo "✅ npm encontrado: $(npm --version)"

# Crear archivo .env si no existe
echo "📋 Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Archivo .env creado desde env.example"
    else
        echo "⚠️  No se encontró env.example, creando .env básico..."
        cat > .env << EOF
# Configuración de PsiChatV2
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=tu_clave_secreta_aqui_cambiala_en_produccion
DATABASE_URL=sqlite:///./psichat.db
LOG_LEVEL=INFO
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=10485760
LOG_BACKUP_COUNT=5
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]
EOF
        echo "✅ Archivo .env básico creado"
    fi
else
    echo "✅ Archivo .env ya existe"
fi

# Instalar dependencias del backend
echo "📋 Instalando dependencias del backend..."
cd backend

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📋 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
echo "📋 Activando entorno virtual..."
source venv/bin/activate

# Instalar dependencias
echo "📋 Instalando dependencias de Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Entrenar modelos de ML
echo "📋 Entrenando modelos de Machine Learning..."
cd ml_models/emotion_detection
python train.py
cd ../style_classification
python train.py
cd ../..

# Inicializar base de datos
echo "📋 Inicializando base de datos..."
python init_db.py

# Crear usuarios de prueba
echo "📋 Creando usuarios de prueba..."
python create_test_users.py

cd ..

# Instalar dependencias del frontend
echo "📋 Instalando dependencias del frontend..."
cd frontend
npm install

cd ..

# Crear directorios necesarios
echo "📋 Creando directorios necesarios..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/temp

echo "================================"
echo "✅ Instalación completada!"
echo ""
echo "🚀 Para iniciar el proyecto:"
echo ""
echo "1. Backend:"
echo "   cd backend"
echo "   source venv/bin/activate  # En Linux/Mac"
echo "   # o"
echo "   venv\\Scripts\\activate     # En Windows"
echo "   python -m uvicorn app.main:app --reload"
echo ""
echo "2. Frontend (en otra terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Acceder a:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   Documentación API: http://localhost:8000/docs"
echo ""
echo "👥 Usuarios de prueba creados:"
echo "   Estudiante: estudiante@test.com / password123"
echo "   Tutor: tutor@test.com / password123"
echo "   Admin: admin@test.com / password123"
echo ""
echo "📝 Notas importantes:"
echo "   - Cambia la SECRET_KEY en .env para producción"
echo "   - Los logs se guardan en backend/logs/"
echo "   - La base de datos es SQLite (backend/psichat.db)"
echo "" 