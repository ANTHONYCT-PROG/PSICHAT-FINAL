# Sistema de Sesiones Múltiples por Pestaña

## Características Principales

### 🎯 **Sesiones Independientes**
- Cada pestaña puede tener su propia sesión de usuario
- Permite usar diferentes roles en diferentes pestañas (ej: tutor en una, estudiante en otra)
- Las sesiones se mantienen independientes hasta que el usuario decida cambiarlas

### 🔄 **Sincronización Inteligente**
- Las pestañas se comunican entre sí para mantener información actualizada
- Cambios en una pestaña se reflejan en otras (cuando es apropiado)
- Notificaciones informativas sobre cambios de sesión

### 🛡️ **Seguridad Mejorada**
- Verificación automática de validez de tokens
- Limpieza automática de sesiones expiradas
- Aislamiento de sesiones por pestaña

## Cómo Funciona

### 1. **Identificación de Pestañas**
- Cada pestaña recibe un ID único al cargar
- El ID se almacena en `sessionStorage` para persistir durante la sesión
- Los datos de sesión se almacenan en `localStorage` con el ID de pestaña como clave

### 2. **Almacenamiento de Sesiones**
```javascript
// Estructura en localStorage
{
  "sessions": {
    "tab_1234567890_abc123": {
      "token": "jwt_token_here",
      "user": { "id": 1, "nombre": "Juan", "rol": "estudiante" }
    },
    "tab_1234567891_def456": {
      "token": "jwt_token_here",
      "user": { "id": 2, "nombre": "María", "rol": "tutor" }
    }
  }
}
```

### 3. **Gestión de Sesiones**
- **Login**: Se crea una nueva sesión para la pestaña actual
- **Logout**: Se elimina solo la sesión de la pestaña actual
- **Cambio de sesión**: Se puede cambiar a otra sesión existente
- **Verificación**: Se verifica periódicamente la validez de tokens

## Casos de Uso

### 📚 **Escenario Educativo**
1. **Pestaña 1**: Usuario inicia sesión como estudiante
2. **Pestaña 2**: Usuario inicia sesión como tutor (mismo o diferente usuario)
3. **Pestaña 3**: Usuario inicia sesión como otro estudiante
4. **Gestión**: Usuario puede cambiar entre sesiones usando el SessionManager

### 🏢 **Escenario Empresarial**
1. **Pestaña 1**: Cuenta personal del usuario
2. **Pestaña 2**: Cuenta de trabajo/empresa
3. **Pestaña 3**: Cuenta de administrador (si tiene permisos)

## Componentes Principales

### 1. **SessionManager** (`components/SessionManager.tsx`)
- Interfaz visual para gestionar sesiones
- Muestra todas las sesiones activas
- Permite cambiar entre sesiones
- Botón para abrir nueva sesión

### 2. **AuthStore Mejorado** (`stores/authStore.ts`)
- Manejo de sesiones múltiples
- Funciones para cambiar entre sesiones
- Sincronización automática

### 3. **Hook de Sincronización** (`hooks/useSessionSync.ts`)
- Verificación de validez de tokens
- Notificaciones de cambios
- Limpieza automática

## API del Store

### Funciones Principales
```typescript
// Cambiar a otra sesión
switchSession(tabId: string)

// Obtener datos de una sesión
getSessionData(tabId: string)

// Establecer datos de una sesión
setSessionData(tabId: string, token: string | null, user: User | null)

// Sincronizar desde localStorage
syncFromStorage()
```

### Estado del Store
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  tabId: string | null;  // ID de la pestaña actual
}
```

## Flujo de Trabajo

### 1. **Inicio de Sesión**
```
Usuario inicia sesión → Se genera tabId → Se guarda sesión → Se notifica a otras pestañas
```

### 2. **Cambio de Sesión**
```
Usuario hace clic en SessionManager → Se cambia a otra sesión → Se actualiza estado → Se redirige según rol
```

### 3. **Cierre de Sesión**
```
Usuario cierra sesión → Se elimina sesión de esta pestaña → Se notifica a otras pestañas → Se redirige a login
```

### 4. **Verificación de Validez**
```
Cada 5 minutos → Se verifica token → Si es inválido → Se elimina sesión → Se notifica al usuario
```

## Beneficios

✅ **Flexibilidad**: Usar diferentes roles en diferentes pestañas
✅ **Productividad**: No perder contexto al cambiar entre cuentas
✅ **Seguridad**: Aislamiento de sesiones y verificación automática
✅ **UX**: Interfaz intuitiva para gestionar sesiones
✅ **Escalabilidad**: Fácil agregar más funcionalidades

## Configuración

### Variables de Entorno
```env
# Tiempo de verificación de tokens (en minutos)
SESSION_CHECK_INTERVAL=5

# URL del backend para verificación
API_BASE_URL=http://localhost:8000
```

### Personalización
- Modificar intervalos de verificación
- Cambiar estilos del SessionManager
- Agregar más tipos de notificaciones
- Implementar persistencia adicional

## Limitaciones

⚠️ **Navegador**: Requiere soporte para `localStorage` y `sessionStorage`
⚠️ **Dominio**: Las sesiones están limitadas al mismo dominio
⚠️ **Memoria**: Múltiples sesiones consumen más memoria
⚠️ **Complejidad**: Mayor complejidad en el manejo de estado

## Próximas Mejoras

🚀 **Sincronización en tiempo real** con WebSockets
🚀 **Persistencia en la nube** de sesiones
🚀 **Gestión avanzada de permisos** por sesión
🚀 **Analytics** de uso de sesiones
🚀 **Backup automático** de sesiones importantes 