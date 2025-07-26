import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
}

interface AuthSession {
  token: string;
  user: any;
  expiresAt: number;
}

class AuthService {
  private static instance: AuthService;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private authStateListeners: ((isAuthenticated: boolean) => void)[] = [];

  private constructor() {
    this.setupInterceptors();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setupInterceptors() {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && !this.isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  public getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.scheduleTokenRefresh(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private scheduleTokenRefresh(token: string): void {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const expiresIn = decoded.exp * 1000 - Date.now();
      const refreshTime = expiresIn - (5 * 60 * 1000); // Refresh 5 minutes before expiry
      
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
      }
      
      this.refreshTimeout = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      });
      
      const { access_token } = response.data;
      this.setToken(access_token);
      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { access_token, user } = response.data;
      this.setToken(access_token);
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(user));
      
      // Notify listeners
      this.notifyAuthStateChange(true);
      
      return { user, token: access_token };
    } catch (error) {
      throw new Error('Login failed');
    }
  }

  async register(userData: any): Promise<{ user: any; token: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      const { access_token, user } = response.data;
      this.setToken(access_token);
      
      localStorage.setItem('user', JSON.stringify(user));
      
      // Notify listeners
      this.notifyAuthStateChange(true);
      
      return { user, token: access_token };
    } catch (error) {
      throw new Error('Registration failed');
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    // Notify listeners
    this.notifyAuthStateChange(false);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  updateUser(userData: any): void {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // Event listener system for auth state changes
  onAuthStateChange(callback: (isAuthenticated: boolean) => void): void {
    this.authStateListeners.push(callback);
  }

  private notifyAuthStateChange(isAuthenticated: boolean): void {
    this.authStateListeners.forEach(callback => {
      try {
        callback(isAuthenticated);
      } catch (error) {
        console.error('Error in auth state change listener:', error);
      }
    });
  }
}

export const authService = AuthService.getInstance();
export default authService; 