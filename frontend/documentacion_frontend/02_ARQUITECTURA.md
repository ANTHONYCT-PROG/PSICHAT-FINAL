# 🏗️ ARQUITECTURA DEL FRONTEND - PSICHAT V2

## 📐 Arquitectura General

El frontend de PsiChat V2 utiliza una **arquitectura en capas** con **Component-Based Architecture** y **State Management** centralizado. La arquitectura está diseñada para ser **escalable**, **mantenible** y **testeable**, siguiendo principios de **Clean Architecture** y **Separation of Concerns**.

## 🏛️ Patrón Arquitectónico

### **Arquitectura en Capas Frontend**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Pages     │ │ Components  │ │   Layouts   │ │  Routes │ │
│  │ (Containers)│ │ (Reusable)  │ │ (Structure) │ │ (React  │ │
│  │             │ │             │ │             │ │ Router) │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Hooks     │ │   Services  │ │   Stores    │ │  Utils  │ │
│  │ (Custom)    │ │ (API Calls) │ │ (State Mgmt)│ │ (Helpers)│ │
│  │             │ │             │ │             │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Vite      │ │  TypeScript │ │  Tailwind   │ │  React  │ │
│  │ (Build Tool)│ │  (Type Safe)│ │   (CSS)     │ │ (UI Lib)│ │
│  │             │ │             │ │             │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Componentes Arquitectónicos

### 1. **Presentation Layer (Capa de Presentación)**

#### **Pages (Containers)**
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
    <div className="login-container">
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
};
```

#### **Components (Reutilizables)**
```typescript
// src/components/ChatInterface.tsx
import React from 'react';
import { useChat } from '../hooks/useChat';

interface ChatInterfaceProps {
  sessionId: string;
  onMessageSend: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sessionId, 
  onMessageSend 
}) => {
  const { messages, sendMessage, isLoading } = useChat(sessionId);
  
  return (
    <div className="chat-interface">
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
};
```

#### **Layouts (Estructura)**
```typescript
// src/components/layout/Header.tsx
import React from 'react';
import { useAuthStore } from '../../stores/authStore';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  
  return (
    <header className="header">
      <div className="logo">PsiChat</div>
      <nav className="navigation">
        <UserMenu user={user} onLogout={logout} />
      </nav>
    </header>
  );
};
```

### 2. **Application Layer (Capa de Aplicación)**

#### **Custom Hooks**
```typescript
// src/hooks/useAuth.ts
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';

export const useAuth = () => {
  const { user, token, login, logout } = useAuthStore();
  
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const result = await authService.login(credentials);
      login(result);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    logout();
  };
  
  return {
    user,
    token,
    isAuthenticated: !!token,
    login: handleLogin,
    logout: handleLogout
  };
};
```

#### **Services (Lógica de Negocio)**
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
}
```

#### **Stores (Gestión de Estado)**
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (authData: AuthData) => void;
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

### 3. **Infrastructure Layer (Capa de Infraestructura)**

#### **Vite Configuration**
```typescript
// vite.config.ts
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
        },
      },
    },
  },
});
```

#### **TypeScript Configuration**
```json
// tsconfig.json
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

## 🔄 Flujo de Datos Arquitectónico

### **Flujo de Autenticación**
```
1. User Input → LoginPage
2. LoginPage → useAuth Hook
3. useAuth Hook → AuthService
4. AuthService → API Backend
5. Response → AuthStore (Zustand)
6. AuthStore → UI Update
7. Redirect → Protected Route
```

### **Flujo de Chat**
```
1. User Message → ChatInterface
2. ChatInterface → useChat Hook
3. useChat Hook → ChatService
4. ChatService → WebSocket
5. WebSocket → Backend
6. Backend Response → WebSocket
7. WebSocket → UI Update
8. Message Display → ChatInterface
```

### **Flujo de Estado Global**
```
1. Component Action → Custom Hook
2. Custom Hook → Service
3. Service → API/WebSocket
4. Response → Store Update
5. Store Update → Component Re-render
6. UI Update → User Feedback
```

## 🏗️ Patrones de Diseño Utilizados

### **1. Component-Based Architecture**
```typescript
// Composición de componentes
const DashboardPage: React.FC = () => {
  return (
    <Layout>
      <Header />
      <Sidebar />
      <MainContent>
        <MetricCards />
        <InteractiveCharts />
        <RealTimeStats />
      </MainContent>
    </Layout>
  );
};
```

### **2. Custom Hooks Pattern**
```typescript
// Encapsulación de lógica reutilizable
export const useWebSocket = (url: string) => {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };
    setConnection(ws);
  }, [url]);
  
  const disconnect = useCallback(() => {
    if (connection) {
      connection.close();
      setIsConnected(false);
    }
  }, [connection]);
  
  return { connect, disconnect, isConnected, messages };
};
```

### **3. Service Layer Pattern**
```typescript
// Abstracción de lógica de negocio
class ChatService {
  private api: ApiService;
  private ws: WebSocketService;
  
  constructor() {
    this.api = new ApiService();
    this.ws = new WebSocketService();
  }
  
  async sendMessage(message: Message): Promise<void> {
    try {
      await this.api.post('/chat/messages', message);
      this.ws.send('message', message);
    } catch (error) {
      throw new Error('Error sending message');
    }
  }
  
  async getChatHistory(sessionId: string): Promise<Message[]> {
    return this.api.get(`/chat/sessions/${sessionId}/messages`);
  }
}
```

### **4. State Management Pattern (Zustand)**
```typescript
// Gestión de estado global
interface AppState {
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'es' | 'en') => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  language: 'es',
  notifications: [],
  
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  addNotification: (notification) => 
    set((state) => ({ 
      notifications: [...state.notifications, notification] 
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),
}));
```

### **5. Error Boundary Pattern**
```typescript
// Manejo de errores en componentes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

## 🔒 Patrones de Seguridad

### **1. Route Protection**
```typescript
// Protección de rutas por roles
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuthStore();
  const location = useLocation();
  
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

const TutorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuthStore();
  const location = useLocation();
  
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (user.rol !== 'tutor' && user.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};
```

### **2. Input Validation**
```typescript
// Validación con Zod
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });
  
  const onSubmit = (data: LoginFormData) => {
    // Procesar formulario
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
};
```

### **3. Token Management**
```typescript
// Gestión automática de tokens
class TokenManager {
  private static instance: TokenManager;
  private refreshTimeout?: NodeJS.Timeout;
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  setToken(token: string, expiresIn: number) {
    localStorage.setItem('token', token);
    
    // Configurar refresh automático
    const refreshTime = (expiresIn - 60) * 1000; // 1 minuto antes
    this.refreshTimeout = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }
  
  async refreshToken() {
    try {
      const response = await authService.refresh();
      this.setToken(response.token, response.expiresIn);
    } catch (error) {
      useAuthStore.getState().logout();
    }
  }
  
  clearToken() {
    localStorage.removeItem('token');
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }
}
```

## 📊 Patrones de Rendimiento

### **1. Code Splitting**
```typescript
// Lazy loading de componentes
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const TutorPage = lazy(() => import('./pages/TutorPage'));

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/tutor" element={<TutorPage />} />
      </Routes>
    </Suspense>
  );
};
```

### **2. Memoization**
```typescript
// Optimización de re-renders
const ExpensiveComponent: React.FC<{ data: ComplexData[] }> = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      calculated: complexCalculation(item)
    }));
  }, [data]);
  
  return (
    <div>
      {processedData.map(item => (
        <DataItem key={item.id} item={item} />
      ))}
    </div>
  );
});
```

### **3. Virtual Scrolling**
```typescript
// Para listas largas
const VirtualizedMessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
  return (
    <FixedSizeList
      height={400}
      itemCount={messages.length}
      itemSize={80}
      itemData={messages}
    >
      {({ index, style, data }) => (
        <div style={style}>
          <MessageItem message={data[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

## 🎯 Principios de Diseño Aplicados

### **1. Single Responsibility Principle**
- Cada componente tiene una responsabilidad única
- Los hooks encapsulan lógica específica
- Los servicios manejan un dominio específico

### **2. Open/Closed Principle**
- Componentes extensibles sin modificación
- Sistema de plugins para funcionalidades
- Configuración flexible

### **3. Dependency Inversion**
- Dependencias de abstracciones, no implementaciones
- Inyección de dependencias en servicios
- Interfaces bien definidas

### **4. DRY (Don't Repeat Yourself)**
- Componentes reutilizables
- Hooks compartidos
- Utilidades comunes

### **5. KISS (Keep It Simple, Stupid)**
- Componentes simples y enfocados
- Lógica clara y directa
- Estructura intuitiva

---

**Versión**: 0.0.0  
**Última actualización**: Julio 2024  
**Arquitecto**: Sistema de documentación automática 