# 📁 ESTRUCTURA DEL PROYECTO FRONTEND - PSICHAT V2

## 🗂️ Estructura General

```
frontend/
├── 📄 Archivos de Configuración
│   ├── package.json              # Dependencias y scripts
│   ├── package-lock.json         # Lock file de dependencias
│   ├── vite.config.ts            # Configuración de Vite
│   ├── tsconfig.json             # Configuración TypeScript
│   ├── tsconfig.app.json         # Configuración TS para app
│   ├── tsconfig.node.json        # Configuración TS para Node
│   ├── tailwind.config.js        # Configuración Tailwind CSS
│   ├── postcss.config.js         # Configuración PostCSS
│   ├── eslint.config.js          # Configuración ESLint
│   ├── index.html                # Página HTML principal
│   └── .gitignore                # Archivos ignorados por Git
│
├── 📁 public/                    # Archivos públicos estáticos
│   └── vite.svg                  # Logo de Vite
│
├── 📁 src/                       # Código fuente principal
│   ├── main.tsx                  # Punto de entrada de React
│   ├── App.tsx                   # Componente raíz de la aplicación
│   ├── App.css                   # Estilos del componente App
│   ├── index.css                 # Estilos globales
│   ├── vite-env.d.ts             # Tipos de Vite
│   │
│   ├── 📁 components/            # Componentes reutilizables
│   │   ├── 📁 auth/              # Componentes de autenticación
│   │   ├── 📁 chat/              # Componentes de chat
│   │   ├── 📁 dashboard/         # Componentes de dashboard
│   │   ├── 📁 layout/            # Componentes de layout
│   │   ├── 📁 analysis/          # Componentes de análisis
│   │   ├── 📁 tutor/             # Componentes de tutor
│   │   ├── AccessibilityMenu.tsx # Menú de accesibilidad
│   │   ├── ChatStats.tsx         # Estadísticas de chat
│   │   ├── ConnectionStatus.tsx  # Estado de conexión
│   │   ├── EmotionAnalysis.tsx   # Análisis de emociones
│   │   ├── ErrorBoundary.tsx     # Manejo de errores
│   │   ├── LoadingSpinner.tsx    # Spinner de carga
│   │   ├── NotificationCenter.tsx # Centro de notificaciones
│   │   ├── QuickReplies.tsx      # Respuestas rápidas
│   │   ├── SessionHistory.tsx    # Historial de sesiones
│   │   ├── SessionManager.tsx    # Gestor de sesiones
│   │   ├── SessionNotification.tsx # Notificaciones de sesión
│   │   ├── SmartRedirect.tsx     # Redirección inteligente
│   │   ├── TerminateSessionButton.tsx # Botón terminar sesión
│   │   ├── TutorLayout.tsx       # Layout de tutor
│   │   ├── TutorNavigation.tsx   # Navegación de tutor
│   │   ├── UserDebugInfo.tsx     # Información de debug
│   │   └── WebSocketTest.tsx     # Test de WebSocket
│   │
│   ├── 📁 pages/                 # Páginas principales
│   │   ├── LoginPage.tsx         # Página de login
│   │   ├── RegisterPage.tsx      # Página de registro
│   │   ├── ChatPage.tsx          # Página de chat
│   │   ├── ChatBotPage.tsx       # Página de chatbot
│   │   ├── DashboardPage.tsx     # Página de dashboard
│   │   ├── AnalysisPage.tsx      # Página de análisis
│   │   ├── LastAnalysisPage.tsx  # Página de último análisis
│   │   ├── SessionsPage.tsx      # Página de sesiones
│   │   ├── ProfilePage.tsx       # Página de perfil
│   │   ├── SearchPage.tsx        # Página de búsqueda
│   │   ├── AlertsPage.tsx        # Página de alertas
│   │   ├── ReportsPage.tsx       # Página de reportes
│   │   ├── ReportesPage.tsx      # Página de reportes (alternativa)
│   │   ├── TutorPage.tsx         # Página principal de tutor
│   │   ├── TutorDashboardPage.tsx # Dashboard de tutor
│   │   ├── TutorChatPage.tsx     # Chat de tutor
│   │   ├── TutorChatSessionPage.tsx # Sesión de chat de tutor
│   │   ├── TutorStudentProfilePage.tsx # Perfil de estudiante
│   │   └── NotFoundPage.tsx      # Página 404
│   │
│   ├── 📁 services/              # Servicios de API y lógica
│   │   ├── api.ts                # Servicio principal de API
│   │   ├── auth.ts               # Servicio de autenticación
│   │   ├── chat.ts               # Servicio de chat
│   │   ├── chatService.ts        # Servicio de chat (alternativo)
│   │   ├── tutorService.ts       # Servicio de tutor
│   │   ├── reportes.ts           # Servicio de reportes
│   │   └── websocket.ts          # Servicio de WebSocket
│   │
│   ├── 📁 hooks/                 # Hooks personalizados
│   │   ├── useApiCache.ts        # Hook de caché de API
│   │   ├── useAppState.ts        # Hook de estado de app
│   │   ├── useChat.ts            # Hook de chat
│   │   ├── useSessionSync.ts     # Hook de sincronización
│   │   └── useWebSocket.ts       # Hook de WebSocket
│   │
│   ├── 📁 stores/                # Gestión de estado global
│   │   └── authStore.ts          # Store de autenticación
│   │
│   ├── 📁 styles/                # Estilos adicionales
│   │   └── chat.css              # Estilos específicos de chat
│   │
│   ├── 📁 types/                 # Definiciones de tipos TypeScript
│   │
│   ├── 📁 utils/                 # Utilidades y helpers
│   │
│   └── 📁 assets/                # Recursos estáticos
│       └── react.svg             # Logo de React
│
├── 📁 node_modules/              # Dependencias instaladas
├── 📁 dist/                      # Build de producción (generado)
└── 📁 documentacion_frontend/    # Documentación del frontend
```

## 🔍 Análisis Detallado por Capa

### 📁 **Capa de Presentación (`src/pages/`)**

#### **Páginas de Autenticación**
```typescript
// src/pages/LoginPage.tsx
import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';

const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const result = await authService.login(credentials);
      login(result);
    } catch (error) {
      // Manejo de errores
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
};
```

#### **Páginas de Estudiante**
```typescript
// src/pages/DashboardPage.tsx
import React from 'react';
import { MetricCards } from '../components/dashboard/MetricCards';
import { InteractiveCharts } from '../components/dashboard/InteractiveCharts';
import { RealTimeStats } from '../components/dashboard/RealTimeStats';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-container">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <MetricCards />
      <InteractiveCharts />
      <RealTimeStats />
    </div>
  );
};
```

#### **Páginas de Tutor**
```typescript
// src/pages/TutorDashboardPage.tsx
import React from 'react';
import { TutorLayout } from '../components/TutorLayout';
import { StudentCard } from '../components/tutor/StudentCard';
import { AlertCard } from '../components/tutor/AlertCard';

const TutorDashboardPage: React.FC = () => {
  return (
    <TutorLayout>
      <div className="tutor-dashboard">
        <h1 className="text-2xl font-bold mb-6">Panel de Tutor</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StudentCard />
          <AlertCard />
        </div>
      </div>
    </TutorLayout>
  );
};
```

### 📁 **Capa de Aplicación (`src/services/`)**

#### **Servicio Principal de API**
```typescript
// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/authStore';

class ApiService {
  private api: AxiosInstance;
  
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Interceptor para agregar token
    this.api.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
  }
  
  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url);
    return response.data;
  }
  
  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data);
    return response.data;
  }
  
  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data);
    return response.data;
  }
  
  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url);
    return response.data;
  }
}

export const apiService = new ApiService();
```

#### **Servicio de WebSocket**
```typescript
// src/services/websocket.ts
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  connect(userId: string) {
    const wsUrl = `${import.meta.env.VITE_WS_URL}?user_id=${userId}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket conectado');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket desconectado');
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('Error de WebSocket:', error);
    };
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(useAuthStore.getState().user?.id || '');
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
  
  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const websocketService = new WebSocketService();
```

### 📁 **Capa de Estado (`src/stores/`)**

#### **Store de Autenticación**
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  nombre: string;
  rol: 'estudiante' | 'tutor' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (authData: { user: User; token: string }) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (authData) => set({
        user: authData.user,
        token: authData.token,
        isAuthenticated: true,
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
      
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);
```

### 📁 **Capa de Hooks (`src/hooks/`)**

#### **Hook de Chat**
```typescript
// src/hooks/useChat.ts
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { websocketService } from '../services/websocket';

interface Message {
  id: number;
  texto: string;
  remitente: 'user' | 'bot';
  creado_en: string;
}

export const useChat = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.get<Message[]>(`/chat/sessions/${sessionId}/messages`);
      setMessages(data);
    } catch (err) {
      setError('Error cargando mensajes');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);
  
  const sendMessage = useCallback(async (texto: string) => {
    try {
      const message = await apiService.post<Message>('/chat/messages', {
        session_id: sessionId,
        texto,
        remitente: 'user'
      });
      
      setMessages(prev => [...prev, message]);
      websocketService.send('message', message);
    } catch (err) {
      setError('Error enviando mensaje');
    }
  }, [sessionId]);
  
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);
  
  return {
    messages,
    isLoading,
    error,
    sendMessage,
    loadMessages
  };
};
```

## 🔧 Archivos de Configuración

### **package.json**
```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src"
  },
  "dependencies": {
    "@fontsource/poppins": "^5.0.14",
    "@headlessui/react": "^1.7.18",
    "@heroicons/react": "^2.1.1",
    "axios": "^1.6.7",
    "chart.js": "^4.5.0",
    "framer-motion": "^10.16.4",
    "jwt-decode": "^4.0.0",
    "lucide-react": "^0.525.0",
    "react": "^18.3.1",
    "react-chartjs-2": "^5.3.0",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.49.2",
    "react-hot-toast": "^2.4.1",
    "react-icons": "^4.10.1",
    "react-router-dom": "^6.22.3",
    "recharts": "^2.7.2",
    "zod": "^3.22.4",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.30.1",
    "@types/node": "^20.10.0",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.3.0",
    "postcss": "^8.4.38",
    "prettier": "^3.2.5",
    "tailwindcss": "^3.4.3",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.35.1",
    "vite": "^7.0.4"
  }
}
```

### **vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          charts: ['chart.js', 'react-chartjs-2', 'recharts'],
        },
      },
    },
  },
});
```

### **tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### **tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@stores/*": ["src/stores/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 📊 Estadísticas del Proyecto

### **Código y Estructura**
- **20 páginas** principales
- **30+ componentes** reutilizables
- **7 servicios** de API y comunicación
- **5 hooks** personalizados
- **1 store** de estado global

### **Dependencias**
- **18 dependencias** principales
- **19 dependencias** de desarrollo
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **React Router** para navegación

### **Características**
- **Chat en tiempo real** con WebSocket
- **Análisis emocional** integrado
- **Dashboard interactivo** con gráficos
- **Sistema de roles** completo
- **Responsividad** total

## 📝 Convenciones de Nomenclatura

### **Archivos y Carpetas**
- **PascalCase**: Para componentes React (`LoginPage.tsx`)
- **camelCase**: Para archivos de utilidades (`useAuth.ts`)
- **kebab-case**: Para carpetas (`documentacion-frontend/`)
- **snake_case**: Para archivos de configuración (`vite.config.ts`)

### **Componentes**
- **PascalCase**: Para nombres de componentes (`ChatInterface`)
- **camelCase**: Para props y variables (`onMessageSend`)
- **UPPER_CASE**: Para constantes (`API_BASE_URL`)

### **Tipos TypeScript**
- **PascalCase**: Para interfaces y tipos (`User`, `Message`)
- **camelCase**: Para propiedades (`userName`, `createdAt`)
- **UPPER_CASE**: Para enums (`UserRole.ADMIN`)

## 🔒 Consideraciones de Seguridad

### **Archivos Sensibles**
- `.env`: Variables de entorno (no versionado)
- `dist/`: Build de producción (no versionado)
- `node_modules/`: Dependencias (no versionado)

### **Archivos de Configuración**
- `package.json`: Dependencias (versionado)
- `vite.config.ts`: Configuración de build (versionado)
- `tailwind.config.js`: Configuración de estilos (versionado)
- `tsconfig.json`: Configuración TypeScript (versionado)

---

**Versión**: 0.0.0  
**Última actualización**: Julio 2024  
**Organización**: Arquitectura en capas con separación de responsabilidades 