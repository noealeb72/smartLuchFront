import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useConfig } from './ConfigContext';

const AuthContext = createContext();

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
      console.log('🔍 Cargando usuario desde localStorage, token existe:', !!token);
      
      // Solo validar que exista el token
      if (token && token !== 'null' && token !== 'undefined') {
        // Solo guardar el token si no existe un usuario ya cargado (evitar bucles)
        setUser((prevUser) => {
          if (prevUser && prevUser.token === token) {
            console.log('⏭️ [AuthContext] Usuario ya tiene el mismo token, no actualizar');
            return prevUser;
          }
          const storedUser = {
            token: token,
          };
          console.log('👤 [AuthContext] Token cargado desde localStorage');
          return storedUser;
        });
      } else {
        console.log('⚠️ [AuthContext] No hay token válido en localStorage');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario desde localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    if (config) {
      loadUserFromStorage();
    }
  }, [config, loadUserFromStorage]);

  const login = useCallback(async (username, password) => {
    try {
      const response = await apiService.login(username, password);

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

      // Guardar SOLO el token en localStorage
      localStorage.setItem('token', token);
      console.log('🔑 Token guardado en localStorage');

      // Crear objeto userData con la información del usuario (sin guardar en localStorage)
      const userData = {
        id: usuarioId,
        username: response.Username || response.username || '',
        jerarquia: jerarquia,
        jerarquia_nombre: jerarquia, // Asegurar que jerarquia_nombre esté presente
        nombreCompleto: response.NombreCompleto || response.nombreCompleto || '',
        activo: response.Activo || response.activo || true,
        role: jerarquia, // Para compatibilidad con código existente
      };

      console.log('👤 Usuario autenticado y guardado:', userData);
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
          backendMessage = responseData.message || responseData.Message || responseData.error || responseData.Error;
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
    // Eliminar solo el token
    localStorage.removeItem('token');
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
      setUser: updateUser,
    }),
    [user, loading, login, logout, isAuthenticated, hasRole, hasAnyRole, updateUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
