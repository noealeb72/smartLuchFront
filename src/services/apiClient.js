/**
 * Cliente HTTP para la API.
 * - Backend: solo valida el token en cada petición; si está vencido o inválido responde 401 Unauthorized.
 * - Front: ante 401 intenta renovar el token con POST /api/login/Refresh (refresh token). Si obtiene
 *   un nuevo JWT, lo guarda y reintenta la petición; si no hay refresh token o falla, redirige a /login.
 */
import axios from 'axios';
import { getApiBaseUrl } from './configService';

/** Misma clave que authService.REFRESH_TOKEN_KEY para consistencia */
const REFRESH_TOKEN_KEY = 'refreshToken';

function clearSessionAndRedirect() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem('smartlunch_session_started');
  } catch (_) {}
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.replace('/login?session=expired');
  }
}

/** Obtiene el refresh token (sessionStorage primero, localStorage como respaldo) */
function getStoredRefreshToken() {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Guarda el refresh token en ambos storages para mayor persistencia */
function setStoredRefreshToken(value) {
  try {
    if (value) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, value);
      localStorage.setItem(REFRESH_TOKEN_KEY, value);
    } else {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (_) {}
}

/** Promesa única de refresh en curso para no lanzar varias a la vez */
let refreshPromise = null;

async function tryRefreshToken() {
  const stored = getStoredRefreshToken();
  if (!stored) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[apiClient] No hay refresh token. El login debe devolver RefreshToken.');
    }
    throw new Error('No hay refresh token');
  }
  const baseUrl = getApiBaseUrl();
  const refreshUrl = `${baseUrl}/api/login/Refresh`;
  if (typeof console !== 'undefined' && console.info) {
    console.info('[apiClient] Intentando renovar token en', refreshUrl);
  }
  try {
    const response = await axios.post(
      refreshUrl,
      { refreshToken: stored },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const data = response.data || response;
    const token = data.Token ?? data.token;
    const newRefresh = data.RefreshToken ?? data.refreshToken;
    if (!token) {
      throw new Error('No se recibió token');
    }
    localStorage.setItem('token', token);
    if (newRefresh) {
      setStoredRefreshToken(newRefresh);
    }
    if (typeof console !== 'undefined' && console.info) {
      console.info('[apiClient] Token renovado correctamente');
    }
    return token;
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      const msg = err.response?.data?.error || err.response?.data?.Message || err.message;
      const status = err.response?.status;
      const isNetwork = !err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network'));
      console.error('[apiClient] Refresh falló:', {
        mensaje: msg,
        status,
        esErrorRed: isNetwork,
        url: refreshUrl,
      });
    }
    throw err;
  }
}

// Crear instancia de axios con configuración optimizada
const api = axios.create({
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache para requests GET idempotentes
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Interceptor de request
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      // Asegurar que config.headers existe
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar timestamp para cache busting si es necesario
    if (config.method === 'get' && config.params) {
      const cacheKey = `${config.url}?${new URLSearchParams(config.params).toString()}`;
      const cached = requestCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Retornar una promesa resuelta con datos en caché
        return Promise.reject({
          __fromCache: true,
          data: cached.data,
          config,
        });
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response para manejar errores y caché
api.interceptors.response.use(
  (response) => {
    // Guardar en caché si es GET
    if (response.config.method === 'get' && response.config.params) {
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params).toString()}`;
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
      
      // Limpiar caché antiguo si tiene más de 100 entradas
      if (requestCache.size > 100) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
      }
    }
    
    return response;
  },
  (error) => {
    // Manejar respuesta desde caché
    if (error.__fromCache) {
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
      });
    }
    
    // Manejar errores de conexión y CORS
    if (!error.response) {
      let errorMessage = '';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tiempo de espera agotado. El servidor está tardando demasiado en responder. Verifica la conexión y que el backend esté funcionando correctamente.';
      } else if (error.message && error.message.includes('CORS')) {
        errorMessage = 'Error CORS: El backend no permite peticiones desde este origen. Verifica la configuración CORS del servidor.';
      } else {
        errorMessage = 'Error de conexión con el servidor. Verifica que el backend esté corriendo en ' + getApiBaseUrl();
      }
      
      error.message = errorMessage;
      error.redirectToLogin = true; // Marcar para redirigir al login
      
      // NO redirigir automáticamente - dejar que el componente maneje el error
      // El componente Index.js manejará la redirección si es necesario
    } else {
      // Manejar errores HTTP específicos
      const status = error.response.status;
      if (status === 404) {
        error.message = 'Endpoint no encontrado. Verifica que la ruta de la API sea correcta.';
      } else if (status === 400) {
        // Buscar el mensaje de error en diferentes campos posibles
        const responseData = error.response.data;
        let backendMessage = null;
        if (responseData) {
          backendMessage = responseData.error || responseData.Error || responseData.message || responseData.Message;
          if (typeof responseData === 'string') {
            backendMessage = responseData;
          }
        }
        error.message = backendMessage || 'Solicitud incorrecta. Verifica los datos enviados.';
      } else if (status === 409) {
        // Conflict - Ya existe un registro con ese nombre
        error.message = error.response.data?.message || error.response.data?.Message || 'Ya existe un registro con ese nombre.';
      } else if (status === 403) {
        // Forbidden - Usuario autenticado pero sin permiso (rol insuficiente). NO cerrar sesión.
        const responseData = error.response.data;
        let backendMessage = null;
        if (responseData) {
          backendMessage = responseData.message || responseData.Message || responseData.error || responseData.Error;
          if (typeof responseData === 'string') backendMessage = responseData;
        }
        error.message = backendMessage || 'No tiene permiso para realizar esta acción.';
        error.redirectToLogin = false; // Sesión sigue abierta, solo mostrar mensaje
      } else if (status === 401) {
        const responseData = error.response.data;
        let backendMessage = null;
        if (responseData) {
          backendMessage = responseData.message || responseData.Message || responseData.error || responseData.Error;
          if (typeof responseData === 'string') {
            backendMessage = responseData;
          }
        }
        error.message = backendMessage || 'Sesión expirada o no autorizado. Inicie sesión de nuevo.';
        error.redirectToLogin = true;

        const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
        const isRefreshRequest = error.config?.url?.includes('/login/Refresh');
        const hasRefreshToken = !!getStoredRefreshToken();

        if (isLoginPage || isRefreshRequest || !hasRefreshToken) {
          clearSessionAndRedirect();
          return Promise.reject(error);
        }

        // Una sola promesa de refresh para todas las peticiones que fallen con 401 a la vez
        if (!refreshPromise) {
          refreshPromise = tryRefreshToken()
            .finally(() => {
              refreshPromise = null;
            });
        }

        return refreshPromise
          .then(() => api.request(error.config))
          .catch(() => {
            clearSessionAndRedirect();
            return Promise.reject(error);
          });
      } else if (status === 405) {
        error.message = 'Método HTTP no permitido. El endpoint no acepta este tipo de solicitud.';
      } else if (status === 500) {
        error.message = 'Error interno del servidor. Contacta al administrador.';
      }
    }
    return Promise.reject(error);
  }
);

// Función para limpiar caché
export const clearApiCache = () => {
  requestCache.clear();
};

// Exportar la instancia de axios configurada
export default api;

