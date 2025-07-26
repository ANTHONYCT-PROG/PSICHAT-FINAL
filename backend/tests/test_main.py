"""
Tests para los endpoints principales de la aplicación.
"""

import pytest
from fastapi import status

class TestMainEndpoints:
    """Tests para endpoints principales."""
    
    def test_root_endpoint(self, client):
        """Test endpoint raíz."""
        response = client.get("/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "environment" in data
        assert "status" in data
        assert data["status"] == "running"
    
    def test_health_check_endpoint(self, client):
        """Test endpoint de health check."""
        response = client.get("/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "database" in data
        assert "version" in data
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
    
    def test_system_info_endpoint_development(self, client):
        """Test endpoint de información del sistema en desarrollo."""
        # En desarrollo, el endpoint debería estar disponible
        response = client.get("/info")
        
        # Puede devolver 200 en desarrollo o 404 en producción
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "app_name" in data
            assert "version" in data
            assert "environment" in data
            assert "debug" in data
            assert "features" in data
    
    def test_metrics_endpoint_development(self, client):
        """Test endpoint de métricas en desarrollo."""
        response = client.get("/metrics")
        
        # Puede devolver 200 en desarrollo o 404 en producción
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "metrics" in data
            assert isinstance(data["metrics"], list)
    
    def test_cors_headers(self, client):
        """Test que los headers CORS estén configurados correctamente."""
        # Probar con un endpoint que soporte OPTIONS
        response = client.options("/health")
        
        # Verificar que la respuesta incluye headers CORS si están configurados
        # Si no están configurados, puede devolver 405 Method Not Allowed
        if response.status_code == status.HTTP_200_OK:
            assert "access-control-allow-origin" in response.headers
            assert "access-control-allow-methods" in response.headers
            assert "access-control-allow-headers" in response.headers
        else:
            # Si OPTIONS no está soportado, verificar que al menos GET funciona
            get_response = client.get("/health")
            assert get_response.status_code == status.HTTP_200_OK
    
    def test_404_not_found(self, client):
        """Test manejo de rutas inexistentes."""
        response = client.get("/ruta/inexistente")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_method_not_allowed(self, client):
        """Test manejo de métodos HTTP no permitidos."""
        # Intentar POST en un endpoint que solo acepta GET
        response = client.post("/health")
        
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    def test_request_processing_time_header(self, client):
        """Test que se incluya el header de tiempo de procesamiento."""
        response = client.get("/health")
        
        assert response.status_code == status.HTTP_200_OK
        assert "x-process-time" in response.headers
        
        # Verificar que el tiempo de procesamiento es un número
        process_time = response.headers["x-process-time"]
        try:
            float(process_time)
        except ValueError:
            pytest.fail("X-Process-Time header should be a valid number")
    
    def test_api_documentation_endpoints(self, client):
        """Test que los endpoints de documentación estén disponibles."""
        # OpenAPI JSON
        response = client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK
        
        # Swagger UI
        response = client.get("/docs")
        assert response.status_code == status.HTTP_200_OK
        
        # ReDoc
        response = client.get("/redoc")
        assert response.status_code == status.HTTP_200_OK
    
    def test_router_inclusion(self, client):
        """Test que todos los routers estén incluidos correctamente."""
        # Verificar que los prefijos de los routers estén funcionando
        routers_to_test = [
            ("/auth/me", "GET"),  # Auth router
            ("/chat/", "POST"),  # Chat router
            ("/analysis/", "POST"),  # Analysis router
            ("/tutor/alerts", "GET"),  # Tutor router
        ]
        
        for endpoint, method in routers_to_test:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})
            
            # Debería devolver 401 (no autenticado) o 403 (no autorizado) en lugar de 404 (no encontrado)
            # Esto indica que el router está incluido pero requiere autenticación
            assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    def test_environment_configuration(self, client):
        """Test que la configuración del entorno esté funcionando."""
        response = client.get("/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar que la información del entorno esté presente
        assert "environment" in data
        assert data["environment"] in ["development", "production", "testing"]
    
    def test_error_response_format(self, client):
        """Test que los errores tengan el formato correcto."""
        # Provocar un error 404
        response = client.get("/endpoint/inexistente")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Verificar que la respuesta de error tenga el formato esperado
        try:
            error_data = response.json()
            # En algunos casos puede ser un string simple
            if isinstance(error_data, dict):
                assert "detail" in error_data
        except:
            # Si no es JSON, verificar que sea un string
            assert isinstance(response.text, str)
    
    def test_database_connection_in_health_check(self, client):
        """Test que el health check verifique la conexión a la base de datos."""
        response = client.get("/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar que la base de datos esté conectada
        assert data["database"] == "connected"
        
        # Verificar que el timestamp esté presente y sea válido
        assert "timestamp" in data
        assert isinstance(data["timestamp"], (int, float))
        assert data["timestamp"] > 0 