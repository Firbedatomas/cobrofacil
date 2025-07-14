import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = '/api'; // Usamos el proxy de Vite

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Estado global de autenticación
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

// Procesar cola de peticiones fallidas
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas - VERSION INTELIGENTE
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    
    // Manejar error 401 (token expirado) - LÓGICA INTELIGENTE
    if (response?.status === 401) {
      const token = localStorage.getItem('authToken');
      
      // Si no hay token, no hacer nada (usuario no logueado)
      if (!token) {
        return Promise.reject(error);
      }
      
      // Si es la ruta de verify, manejar de forma especial
      if (config.url?.includes('/auth/verify')) {
        console.log('🔍 Token verification failed - token may be expired');
        return Promise.reject(error);
      }
      
      // Si ya estamos refrescando, agregar a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(config);
        });
      }
      
      // Intentar refrescar la sesión
      isRefreshing = true;
      
      try {
        // Intentar verificar el token una vez más
        const verifyResponse = await axios.get('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (verifyResponse.status === 200) {
          processQueue(null, token);
          return api(config);
        }
      } catch (refreshError) {
        // Solo limpiar si realmente falló la verificación
        console.log('🔒 Token definitivamente expirado, limpiando sesión...');
        authService.clearAuth();
        processQueue(refreshError, null);
        
        // Solo redirigir si no estamos ya en login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Manejar error 429 (rate limiting) - OPTIMIZADO
    if (response?.status === 429) {
      if (!config._retryCount) {
        config._retryCount = 0;
      }
      
      if (config._retryCount < 2) { // Reducir intentos de 3 a 2
        config._retryCount++;
        const delay = 1500 * Math.pow(2, config._retryCount); // Delay más largo
        
        console.log(`⏳ Rate limit hit, retrying in ${delay}ms (attempt ${config._retryCount}/2)`);
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(api(config));
          }, delay);
        });
      } else {
        console.warn('❌ Rate limit exceeded after 2 retries');
        // Retornar error real en lugar de resolución falsa
        return Promise.reject(new Error('Rate limit exceeded - servidor sobrecargado'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Tipos para las respuestas
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'CAJERO';
  activo: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: User;
  message: string;
}

// Servicios de autenticación MEJORADOS
export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
      localStorage.setItem('authTimestamp', Date.now().toString());
      
      console.log('✅ Login exitoso, sesión guardada');
    }
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('⚠️ Error al hacer logout en el servidor:', error);
    } finally {
      this.clearAuth();
    }
  },

  async getProfile(): Promise<User> {
    const response = await api.get<{ usuario: User }>('/auth/perfil');
    return response.data.usuario;
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  clearAuth(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authTimestamp');
    console.log('🧹 Sesión limpiada');
  },

  // Verificar si el token está próximo a expirar
  isTokenExpiringSoon(): boolean {
    const timestamp = localStorage.getItem('authTimestamp');
    if (!timestamp) return true;
    
    const loginTime = parseInt(timestamp);
    const now = Date.now();
    const eightHours = 8 * 60 * 60 * 1000; // 8 horas en ms
    
    return (now - loginTime) > eightHours;
  }
};

// Función para verificar si el token es válido - VERSIÓN INTELIGENTE
export const verifyToken = async (silent = false): Promise<boolean> => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    // Verificar con el servidor
    const response = await api.get('/auth/verify');
    
    if (response.status === 200) {
      if (!silent) console.log('✅ Token válido');
      return true;
    }
    
    return false;
  } catch (error: any) {
    // Solo limpiar si es un error definitivo de token
    if (error.response?.status === 401) {
      if (!silent) console.log('🔒 Token inválido confirmado');
      return false;
    }
    
    // Para otros errores (red, servidor), asumir que el token puede ser válido
    if (!silent) console.log('⚠️ Error verificando token, asumiendo válido:', error.message);
    return true;
  }
};

// Función para inicializar la autenticación al cargar la app - VERSIÓN INTELIGENTE
export const initializeAuth = async (silent = false): Promise<{
  isValid: boolean;
  reason?: string;
}> => {
  try {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return { isValid: false, reason: 'no_credentials' };
    }
    
    // Verificar si el token sigue siendo válido
    const isValid = await verifyToken(silent);
    
    if (isValid) {
      if (!silent) console.log('🎉 Sesión inicializada correctamente');
      return { isValid: true };
    } else {
      return { isValid: false, reason: 'invalid_token' };
    }
  } catch (error: any) {
    if (!silent) console.error('❌ Error inicializando autenticación:', error);
    return { isValid: false, reason: 'initialization_error' };
  }
};

// Función para verificar el estado del servidor
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await axios.get('/api/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('❌ Health check falló:', error);
    return false;
  }
};

// Función para refrescar la sesión silenciosamente
export const refreshSession = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    const response = await api.get('/auth/verify');
    
    if (response.status === 200) {
      // Actualizar timestamp de la sesión
      localStorage.setItem('authTimestamp', Date.now().toString());
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

export default api; 