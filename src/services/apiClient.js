import axios from 'axios';
import { getApiBaseUrl } from './configService';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Log solo en desarrollo para no saturar la consola
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Token agregado al header Authorization para:', config.url);
      }
    } else {
      // Solo loguear si no hay token y la petición requiere autenticación
      if (config.url && !config.url.includes('/login')) {
        console.warn('⚠️ No hay token disponible para la petición:', config.url);
      }
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
      
      // Redirigir automáticamente al login si no estamos ya en la página de login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Limpiar localStorage y redirigir al login
        localStorage.clear();
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else {
      // Manejar errores HTTP específicos
      const status = error.response.status;
      if (status === 404) {
        error.message = 'Endpoint no encontrado. Verifica que la ruta de la API sea correcta.';
      } else if (status === 400) {
        error.message = error.response.data?.message || 'Solicitud incorrecta. Verifica los datos enviados.';
      } else if (status === 409) {
        // Conflict - Ya existe un registro con ese nombre
        error.message = error.response.data?.message || error.response.data?.Message || 'Ya existe un registro con ese nombre.';
      } else if (status === 401) {
        // Intentar obtener el mensaje del backend
        const responseData = error.response.data;
        let backendMessage = null;
        if (responseData) {
          backendMessage = responseData.message || responseData.Message || responseData.error || responseData.Error;
          if (typeof responseData === 'string') {
            backendMessage = responseData;
          }
        }
        error.message = backendMessage || 'No autorizado. Verifica tus credenciales.';
        error.redirectToLogin = true; // Redirigir al login si no está autorizado
        // NO redirigir automáticamente si ya estamos en login (para mostrar el error)
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          localStorage.clear();
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
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

