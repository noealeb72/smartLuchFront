import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { REFRESH_TOKEN_KEY } from '../services/authService';
import { useConfig } from './ConfigContext';

const AuthContext = createContext();

/**
 * Intenta obtener el ID de usuario desde un JWT (solo si tiene 3 partes).
 * @param {string} token - Token JWT
 * @returns {number|null} ID del usuario o null
 */
function getUserIdFromToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    const id = payload.usuario ?? payload.usuarioId ?? payload.userId ?? payload.id ?? payload.sub ?? payload.nameid ?? payload.uid ?? payload.user_id ?? null;
    if (id !== null && id !== undefined && id !== '') {
      const num = Number(id);
      return Number.isInteger(num) && num > 0 ? num : id;
    }
    return null;
  } catch {
    return null;
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { config } = useConfig();

  // Memoizar la función de carga de usuario
  const loadUserFromStorage = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      
      // Solo validar que exista el token
      if (token && token !== 'null' && token !== 'undefined') {
        let userId = getUserIdFromToken(token);
        if (userId == null) {
          try {
            const saved = localStorage.getItem('userId');
            if (saved) {
              const n = Number(saved);
              if (Number.isInteger(n) && n > 0) userId = n;
            }
          } catch (_) {}
        }
        setUser((prevUser) => {
          if (prevUser && prevUser.token === token) {
            return prevUser;
          }
          const storedUser = {
            token,
            ...(userId != null && { id: userId }),
          };
          return storedUser;
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      // Error silencioso al cargar usuario desde localStorage
    } finally {
      setLoading(false);
    }
  }, []);

  // Al recargar la página (F5): cerrar sesión y volver al login
  const RELOAD_FLAG = 'smartlunch_session_started';

  useEffect(() => {
    if (!config) return;

    try {
      if (sessionStorage.getItem(RELOAD_FLAG) === '1') {
        // Es una recarga: limpiar sesión y volver al login
        sessionStorage.removeItem(RELOAD_FLAG);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setUser(null);
        setLoading(false);
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
        return;
      }
      // Primera carga en esta pestaña: restaurar sesión si hay token y marcar para detectar recarga
      loadUserFromStorage();
      const token = localStorage.getItem('token');
      if (token && token !== 'null' && token !== 'undefined') {
        sessionStorage.setItem(RELOAD_FLAG, '1');
      }
    } catch (_) {
      setLoading(false);
    }
  }, [config, loadUserFromStorage]);

  const login = useCallback(async (username, password) => {
    try {
      const response = await apiService.login(username, password);

      // Log: datos que devuelve el endpoint después de loguearse
      console.log('=== ENDPOINT LOGIN: datos que devuelve el backend ===');
      console.log('Respuesta completa (response):', response);
      console.log('Respuesta en JSON:', JSON.stringify(response, null, 2));

      if (!response) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      // Validar el campo Ok (debe ser true para continuar)
      const ok = response.Ok || response.ok || response.success;
      if (ok !== true) {
        const mensaje = response.Mensaje || response.mensaje || response.message || 'Usuario o contraseña incorrectos';
        throw new Error(mensaje);
      }

      // Obtener el token
      const token = response.Token || response.token;
      if (!token) {
        throw new Error('No se recibió token del servidor. Verifica la configuración del backend.');
      }

      // Obtener el ID del usuario
      const usuarioId = response.UsuarioId || response.usuarioId || response.id;
      if (!usuarioId) {
        throw new Error('No se recibió el ID del usuario del servidor.');
      }

      // Obtener la jerarquía para la redirección
      const jerarquia = response.Jerarquia || response.jerarquia || response.JerarquiaNombre || '';

      // Verificar bloqueo de usuarios
      if (config && config.bloqueos && jerarquia) {
        const tipoUsuario = jerarquia.charAt(0).toUpperCase() + jerarquia.slice(1).toLowerCase();
        const estaBloqueado = config.bloqueos[tipoUsuario] === true;

        if (estaBloqueado) {
          throw new Error(
            `El acceso para usuarios de tipo "${tipoUsuario}" está bloqueado. Por favor, contacte al administrador.`
          );
        }
      }

      // Guardar token e id en localStorage
      localStorage.setItem('token', token);
      if (usuarioId != null) {
        try {
          localStorage.setItem('userId', String(usuarioId));
        } catch (_) {}
      }
      // Guardar refresh token si el backend lo envía (en ambos storages para persistencia)
      const refreshToken = response.RefreshToken ?? response.refreshToken;
      if (refreshToken) {
        try {
          sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } catch (_) {}
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[Auth] El backend no devolvió RefreshToken. Las peticiones con token expirado redirigirán a login.');
      }
      try {
        sessionStorage.setItem(RELOAD_FLAG, '1');
      } catch (_) {}

      // Crear objeto userData con la información del usuario (sin guardar en localStorage)
      const nombre = response.Nombre || response.nombre || '';
      const apellido = response.Apellido || response.apellido || '';
      const nombreCompleto = response.NombreCompleto || response.nombreCompleto || (nombre || apellido ? `${nombre} ${apellido}`.trim() : '');
      const requiereCambioClave = response.RequiereCambioClave === true || response.requiereCambioClave === true;
      const userData = {
        id: usuarioId,
        username: response.Username || response.username || '',
        jerarquia: jerarquia,
        jerarquia_nombre: jerarquia, // Asegurar que jerarquia_nombre esté presente
        nombre,
        apellido,
        nombreCompleto,
        activo: response.Activo || response.activo || true,
        role: jerarquia, // Para compatibilidad con código existente
        requiereCambioClave,
      };

      // Al loguearse: mostrar en consola los datos del usuario cargados
      console.log('=== LOGIN: datos del usuario cargados ===');
      console.log('Respuesta del backend (login):', response);
      console.log('Usuario en la app (userData):', userData);

      setUser(userData);
      return userData;
    } catch (error) {
      // Mejorar mensaje de error para el usuario
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        // Intentar obtener el mensaje del backend
        let backendMessage = null;
        if (responseData) {
          backendMessage = responseData.mensaje || responseData.Mensaje || responseData.message || responseData.Message || responseData.error || responseData.Error;
          if (typeof responseData === 'string') {
            backendMessage = responseData;
          }
        }
        
        if (status === 400) {
          error.message = backendMessage || 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
        } else if (status === 401) {
          error.message = backendMessage || 'Credenciales inválidas. Verifica tu usuario y contraseña.';
        } else if (status === 404) {
          const baseUrl = config?.apiBaseUrl || 'http://localhost:8000';
          error.message = backendMessage || `Servicio no encontrado (404). Verifica que el backend esté corriendo en ${baseUrl} y que el endpoint /api/login/Autentificar exista.`;
        } else if (status === 500) {
          error.message = backendMessage || 'Error interno del servidor. Contacta al administrador.';
        } else {
          error.message = backendMessage || `Error del servidor (${status}). Intenta nuevamente.`;
        }
      } else if (error.message && error.message.includes('CORS')) {
        error.message = 'Error de conexión: El backend no permite peticiones desde este origen. Verifica la configuración CORS.';
      } else if (error.message && error.message.includes('conexión')) {
        error.message = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en ' + (config?.apiBaseUrl || 'http://localhost:8000');
      }
      throw error;
    }
  }, [config]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    try {
      localStorage.removeItem('userId');
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (_) {}
    setUser(null);
    window.location.href = '/login';
  }, []);

  const isAuthenticated = useCallback(() => {
    return user !== null;
  }, [user]);

  const hasRole = useCallback((role) => {
    return user && user.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    return user && roles.includes(user.role);
  }, [user]);

  // Función centralizada para obtener el rol actual del usuario
  // Prioridad: user.role > user.jerarquia_nombre > usuarioData.jerarquiaNombre
  // Esta función debe ser usada en toda la aplicación para obtener el rol de forma consistente
  const getCurrentRole = useCallback((usuarioData = null) => {
    // Si se pasa usuarioData como parámetro, usarlo como fallback
    // Esto permite que PrivateRoute y otros componentes lo usen sin depender directamente de DashboardContext
    return user?.role || user?.jerarquia_nombre || usuarioData?.jerarquiaNombre || null;
  }, [user]);

  // Función para actualizar el usuario (usada por DashboardContext)
  const updateUser = useCallback((userData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...userData,
    }));
  }, []);

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated,
      hasRole,
      hasAnyRole,
      getCurrentRole,
      setUser: updateUser,
    }),
    [user, loading, login, logout, isAuthenticated, hasRole, hasAnyRole, getCurrentRole, updateUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
