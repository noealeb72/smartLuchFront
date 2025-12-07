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
      const storedUser = {
        // Campos principales del DTO
        id: localStorage.getItem('id'),
        nombre: localStorage.getItem('nombre'),
        apellido: localStorage.getItem('apellido'),
        legajo: localStorage.getItem('legajo'),
        dni: localStorage.getItem('dni'),
        cuil: localStorage.getItem('cuil'),
        plannutricional_id: localStorage.getItem('plannutricional_id'),
        plannutricional_nombre: localStorage.getItem('plannutricional_nombre'),
        planta_id: localStorage.getItem('planta_id'),
        planta_nombre: localStorage.getItem('planta_nombre'),
        centrodecosto_id: localStorage.getItem('centrodecosto_id'),
        centrodecosto_nombre: localStorage.getItem('centrodecosto_nombre'),
        proyecto_id: localStorage.getItem('proyecto_id'),
        proyecto_nombre: localStorage.getItem('proyecto_nombre'),
        jerarquia_id: localStorage.getItem('jerarquia_id'),
        jerarquia_nombre: localStorage.getItem('jerarquia_nombre'),
        pedidos: localStorage.getItem('pedidos'),
        bonificaciones_invitado: localStorage.getItem('bonificaciones_invitado'),
        bonificaciones: localStorage.getItem('bonificaciones'),
        // Campos adicionales para compatibilidad
        role: localStorage.getItem('role') || localStorage.getItem('jerarquia_nombre'),
        plannutricional: localStorage.getItem('plannutricional') || localStorage.getItem('plannutricional_id'),
        planta: localStorage.getItem('planta') || localStorage.getItem('planta_id'),
        centrodecosto: localStorage.getItem('centrodecosto') || localStorage.getItem('centrodecosto_id'),
        proyecto: localStorage.getItem('proyecto') || localStorage.getItem('proyecto_id'),
        jerarquia: localStorage.getItem('jerarquia') || localStorage.getItem('jerarquia_id'),
        bonificacion: localStorage.getItem('bonificacion') || localStorage.getItem('bonificaciones'),
        bonificacion_invitado: localStorage.getItem('bonificacion_invitado') || localStorage.getItem('bonificaciones_invitado'),
        // Configuración adicional
        smarTime: localStorage.getItem('smarTime'),
        usuarioSmatTime: localStorage.getItem('usuarioSmatTime'),
        tipoVisualizacionCodigo: localStorage.getItem('tipoVisualizacionCodigo') || 'QR',
      };

      // Validar que los datos necesarios estén presentes
      const hasRequiredData =
        (storedUser.planta_id || storedUser.planta) &&
        storedUser.planta_id !== 'null' &&
        storedUser.planta_id !== 'undefined' &&
        (storedUser.centrodecosto_id || storedUser.centrodecosto) &&
        storedUser.centrodecosto_id !== 'null' &&
        storedUser.centrodecosto_id !== 'undefined' &&
        (storedUser.proyecto_id || storedUser.proyecto) &&
        storedUser.proyecto_id !== 'null' &&
        storedUser.proyecto_id !== 'undefined' &&
        (storedUser.jerarquia_id || storedUser.jerarquia) &&
        storedUser.jerarquia_id !== 'null' &&
        storedUser.jerarquia_id !== 'undefined' &&
        (storedUser.plannutricional_id || storedUser.plannutricional) &&
        storedUser.plannutricional_id !== 'null' &&
        storedUser.plannutricional_id !== 'undefined';

      if (hasRequiredData) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error cargando usuario desde localStorage:', error);
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

      // Debug: ver qué devuelve el backend
      console.log('🔐 Respuesta completa del backend:', JSON.stringify(response, null, 2));

      // El backend devuelve { token: string, UsuarioDto: {...} } o { token: string, usuario: {...} }
      // Intentar diferentes nombres posibles para el DTO
      if (!response) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      // Buscar el token (puede venir como token, Token, etc.)
      const token = response.token || response.Token || response.data?.token;
      if (!token) {
        console.error('❌ No se encontró token en la respuesta. Estructura recibida:', Object.keys(response));
        console.error('❌ Respuesta completa:', response);
        throw new Error('No se recibió token del servidor. Verifica la configuración del backend.');
      }

      console.log('✅ Token recibido:', token.substring(0, 20) + '...');

      // Buscar el usuario (puede venir como UsuarioDto, usuarioDto, Usuario, usuario, etc.)
      const usuario = response.UsuarioDto || response.usuarioDto || response.Usuario || response.usuario || response.data?.UsuarioDto || response.data?.usuario;
      
      if (!usuario || !usuario.id) {
        console.error('No se encontró usuario en la respuesta:', response);
        throw new Error('Usuario o contraseña incorrectos');
      }

      // Guardar token
      localStorage.setItem('token', token);
      console.log('✅ Token guardado en localStorage');

      // Verificar bloqueo de usuarios (si existe jerarquia_nombre, usarla como perfil)
      if (config && config.bloqueos) {
        const tipoUsuario = usuario.jerarquia_nombre
          ? usuario.jerarquia_nombre.charAt(0).toUpperCase() + usuario.jerarquia_nombre.slice(1).toLowerCase()
          : '';
        const estaBloqueado = config.bloqueos[tipoUsuario] === true;

        if (estaBloqueado) {
          throw new Error(
            `El acceso para usuarios de tipo "${tipoUsuario}" está bloqueado. Por favor, contacte al administrador.`
          );
        }
      }

      // Guardar datos en localStorage de forma optimizada
      // Solo guardar los campos que vienen en el DTO
      const userData = {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        legajo: usuario.legajo,
        dni: usuario.dni,
        cuil: usuario.cuil,
        plannutricional_id: usuario.plannutricional_id,
        plannutricional_nombre: usuario.plannutricional_nombre,
        planta_id: usuario.planta_id,
        planta_nombre: usuario.planta_nombre,
        centrodecosto_id: usuario.centrodecosto_id,
        centrodecosto_nombre: usuario.centrodecosto_nombre,
        proyecto_id: usuario.proyecto_id,
        proyecto_nombre: usuario.proyecto_nombre,
        jerarquia_id: usuario.jerarquia_id,
        jerarquia_nombre: usuario.jerarquia_nombre,
        pedidos: usuario.pedidos,
        bonificaciones_invitado: usuario.bonificaciones_invitado,
        bonificaciones: usuario.bonificaciones,
        // Campos adicionales para compatibilidad
        role: usuario.jerarquia_nombre || '', // Usar jerarquia_nombre como role
        plannutricional: usuario.plannutricional_id, // Alias para compatibilidad
        planta: usuario.planta_id, // Alias para compatibilidad
        centrodecosto: usuario.centrodecosto_id, // Alias para compatibilidad
        proyecto: usuario.proyecto_id, // Alias para compatibilidad
        jerarquia: usuario.jerarquia_id, // Alias para compatibilidad
        bonificacion: usuario.bonificaciones, // Alias para compatibilidad
        bonificacion_invitado: usuario.bonificaciones_invitado, // Alias para compatibilidad
      };

      // Batch update de localStorage para mejor performance
      Object.keys(userData).forEach((key) => {
        if (userData[key] !== null && userData[key] !== undefined) {
          localStorage.setItem(key, String(userData[key]).trim());
        }
      });

      if (config && config.smarTime !== undefined) {
        localStorage.setItem('smarTime', String(config.smarTime));
      }
      if (config && config.usuarioSmatTime) {
        localStorage.setItem('usuarioSmatTime', config.usuarioSmatTime);
      }

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('❌ Error en login:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      
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
          console.error('❌ 401 Unauthorized - El servidor rechazó las credenciales');
          console.error('❌ Respuesta del servidor:', responseData);
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
    localStorage.clear();
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
    }),
    [user, loading, login, logout, isAuthenticated, hasRole, hasAnyRole]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
