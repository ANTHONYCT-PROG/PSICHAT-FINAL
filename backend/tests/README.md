# Tests de PsiChat Backend

Este directorio contiene todos los tests para el sistema PsiChat Backend.

## Estructura de Tests

```
tests/
├── __init__.py
├── conftest.py              # Configuración y fixtures de pytest
├── test_auth.py             # Tests de autenticación
├── test_chat.py             # Tests del sistema de chat
├── test_analysis.py         # Tests del análisis emocional
├── test_tutor.py            # Tests del panel de tutor
├── test_services.py         # Tests de servicios
├── test_database.py         # Tests de base de datos
├── test_integration.py      # Tests de integración
├── test_main.py             # Tests de endpoints principales
└── README.md                # Este archivo
```

## Tipos de Tests

### 1. Tests Unitarios
- **test_services.py**: Prueban funciones individuales de los servicios
- **test_database.py**: Prueban operaciones CRUD de la base de datos
- **test_auth.py**: Prueban funcionalidades de autenticación

### 2. Tests de Integración
- **test_integration.py**: Prueban flujos completos del sistema
- **test_chat.py**: Prueban el sistema de chat completo
- **test_analysis.py**: Prueban el sistema de análisis completo
- **test_tutor.py**: Prueban el panel de tutor completo

### 3. Tests de API
- **test_main.py**: Prueban endpoints principales
- **test_auth.py**: Prueban endpoints de autenticación

## Ejecutar Tests

### Instalar dependencias de test
```bash
pip install -r requirements-test.txt
```

### Ejecutar todos los tests
```bash
# Desde el directorio backend
python run_tests.py

# O directamente con pytest
python -m pytest tests/ -v
```

### Ejecutar tests específicos
```bash
# Solo tests unitarios
python -m pytest tests/ -v -k "not integration"

# Solo tests de integración
python -m pytest tests/ -v -k "integration"

# Solo tests de autenticación
python -m pytest tests/test_auth.py -v

# Solo tests de chat
python -m pytest tests/test_chat.py -v

# Solo tests de análisis
python -m pytest tests/test_analysis.py -v

# Solo tests de tutor
python -m pytest tests/test_tutor.py -v
```

### Ejecutar con coverage
```bash
python -m pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
```

### Opciones adicionales
```bash
# Modo verbose
python -m pytest tests/ -v

# Detener en el primer fallo
python -m pytest tests/ -x

# Mostrar las 10 pruebas más lentas
python -m pytest tests/ --durations=10

# Ejecutar tests marcados como lentos
python -m pytest tests/ -m "slow"
```

## Configuración

### Variables de Entorno para Tests
Los tests usan automáticamente:
- `ENVIRONMENT=testing`
- `DATABASE_URL=sqlite:///:memory:`
- Base de datos en memoria para tests

### Fixtures Disponibles

#### Usuarios de Prueba
- `test_student`: Usuario estudiante
- `test_tutor`: Usuario tutor  
- `test_admin`: Usuario administrador

#### Autenticación
- `auth_headers_student`: Headers autenticados para estudiante
- `auth_headers_tutor`: Headers autenticados para tutor
- `auth_headers_admin`: Headers autenticados para administrador

#### Base de Datos
- `db_session`: Sesión de base de datos para cada test
- `client`: Cliente de test para FastAPI

#### Datos de Prueba
- `sample_texts`: Textos de muestra para testing

## Marcadores de Test

```python
@pytest.mark.unit          # Tests unitarios
@pytest.mark.integration   # Tests de integración
@pytest.mark.slow          # Tests lentos
@pytest.mark.auth          # Tests de autenticación
@pytest.mark.chat          # Tests de chat
@pytest.mark.analysis      # Tests de análisis
@pytest.mark.tutor         # Tests de tutor
@pytest.mark.database      # Tests de base de datos
@pytest.mark.services      # Tests de servicios
```

## Cobertura de Tests

Los tests cubren:

### ✅ Funcionalidades Principales
- [x] Autenticación y autorización
- [x] Sistema de chat
- [x] Análisis emocional
- [x] Panel de tutor
- [x] Operaciones de base de datos
- [x] Servicios principales

### ✅ Casos de Uso
- [x] Registro y login de usuarios
- [x] Envío y recepción de mensajes
- [x] Análisis de texto
- [x] Generación de alertas
- [x] Intervenciones de tutor
- [x] Reportes y métricas

### ✅ Manejo de Errores
- [x] Credenciales inválidas
- [x] Acceso no autorizado
- [x] Datos inválidos
- [x] Recursos no encontrados
- [x] Errores de base de datos

## Debugging Tests

### Ver logs detallados
```bash
python -m pytest tests/ -v -s --log-cli-level=DEBUG
```

### Ejecutar un test específico
```bash
python -m pytest tests/test_auth.py::TestAuth::test_login_success -v -s
```

### Usar pdb para debugging
```bash
python -m pytest tests/ --pdb
```

## Mejores Prácticas

1. **Nombres descriptivos**: Usar nombres claros para tests y funciones
2. **Arrange-Act-Assert**: Estructurar tests en 3 secciones
3. **Tests independientes**: Cada test debe poder ejecutarse solo
4. **Cleanup**: Usar fixtures para limpiar datos después de tests
5. **Mocks**: Usar mocks para servicios externos
6. **Cobertura**: Mantener cobertura de código alta

## Troubleshooting

### Error: "No module named 'app'"
```bash
# Asegúrate de estar en el directorio backend
cd backend
export PYTHONPATH=$PYTHONPATH:$(pwd)
```

### Error: "Database is locked"
```bash
# Los tests usan base de datos en memoria, no debería ocurrir
# Si ocurre, reinicia los tests
python -m pytest tests/ --tb=short
```

### Error: "Connection refused"
```bash
# Los tests no necesitan servicios externos
# Verifica que no haya configuraciones incorrectas
```

## Contribuir

Al agregar nuevos tests:

1. Seguir la convención de nombres `test_*.py`
2. Usar fixtures existentes cuando sea posible
3. Agregar marcadores apropiados
4. Documentar casos de prueba complejos
5. Mantener tests rápidos y confiables 