import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

const STORAGE_KEY = 'auth-storage';

// Endpoints que no deben intentar refresh al fallar con 401
const NO_REFRESH_ENDPOINTS = [
  '/auth/login',
  '/auth/admin/login',
  '/auth/refresh-token',
];

class TokenManager {
  getToken(): string | null {
    try {
      if (typeof window !== 'undefined') {
        const localStorageData = localStorage.getItem(STORAGE_KEY);
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          if (parsedData?.state?.token) {
            return parsedData.state.token;
          }
        }
      }

      const authStorage = Cookies.get(STORAGE_KEY);
      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        if (parsedData?.token) {
          return parsedData.token;
        }
      }

      return null;
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      if (typeof window !== 'undefined') {
        const localStorageData = localStorage.getItem(STORAGE_KEY);
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          if (parsedData?.state?.refreshToken) {
            return parsedData.state.refreshToken;
          }
        }
      }

      const authStorage = Cookies.get(STORAGE_KEY);
      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        if (parsedData?.refreshToken) {
          return parsedData.refreshToken;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  updateTokens(token: string, refreshToken: string, tokenExpiresIn: number): void {
    try {
      if (typeof window !== 'undefined') {
        const localStorageData = localStorage.getItem(STORAGE_KEY);
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          if (parsedData?.state) {
            parsedData.state.token = token;
            parsedData.state.refreshToken = refreshToken;
            parsedData.state.tokenExpiresIn = tokenExpiresIn;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
          }
        }
      }

      const cookieData = Cookies.get(STORAGE_KEY);
      if (cookieData) {
        const parsedCookie = JSON.parse(cookieData);
        parsedCookie.token = token;
        parsedCookie.refreshToken = refreshToken;
        parsedCookie.tokenExpiresIn = tokenExpiresIn;
        Cookies.set(STORAGE_KEY, JSON.stringify(parsedCookie));
      }
    } catch (error) {
      console.error('Error al actualizar tokens:', error);
    }
  }

  clearTokens(): void {
    try {
      Cookies.remove(STORAGE_KEY);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error al limpiar tokens:', error);
    }
  }
}

const tokenManager = new TokenManager();

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.198:9090/api/v1',
  timeout: 10000,
});

// Request interceptor - Agrega el token a las peticiones
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Refresh token logic ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Extrae el mensaje de error real del backend
const getBackendErrorMessage = (error: AxiosError): string | null => {
  const data = error.response?.data as any;
  if (!data) return null;
  return data.message || data.error || data.data?.message || null;
};

// Response interceptor - Maneja errores del backend y 401 con refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Manejar errores del backend (excepto 401 que tiene lógica de refresh)
    if (status && status !== 401 && originalRequest) {
      const backendMessage = getBackendErrorMessage(error);
      if (backendMessage) {
        toast.error(backendMessage);
      } else {
        toast.error('Ocurrió un error inesperado. Intente nuevamente.');
      }
      return Promise.reject(error);
    }

    // No interceptar si no es 401 o si no hay config
    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    // No interceptar endpoints de auth que no deben hacer refresh
    const url = originalRequest.url || '';
    if (NO_REFRESH_ENDPOINTS.some((ep) => url.includes(ep))) {
      return Promise.reject(error);
    }

    // No reintentar si ya se intentó
    if (originalRequest._retry) {
      tokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const currentRefreshToken = tokenManager.getRefreshToken();
    if (!currentRefreshToken) {
      tokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar esta petición
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest._retry = true;
            resolve(api(originalRequest));
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }

    // Marcar como refresh en progreso
    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh-token?refreshToken=${encodeURIComponent(currentRefreshToken)}`
      );

      const raw = response.data.data;
      const token: string = raw.accessToken ?? raw.token;
      const refreshToken: string = raw.refreshToken;
      const expiresIn: number = raw.expiresIn ?? raw.tokenExpiresIn ?? 3600;

      // Actualizar tokens en storage
      tokenManager.updateTokens(token, refreshToken, expiresIn);

      // Reintentar petición original con el nuevo token
      originalRequest.headers.Authorization = `Bearer ${token}`;

      // Procesar cola de peticiones que estaban esperando
      processQueue(null, token);

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh falló - limpiar auth y redirigir a login
      processQueue(refreshError, null);
      tokenManager.clearTokens();

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
