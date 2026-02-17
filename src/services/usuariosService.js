import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de usuarios
 */
export const usuariosService = {
  /**
   * Obtiene lista paginada de usuarios
   * @param {number} page - Número de página
   * @param {number} pageSize - Tamaño de página
   * @param {string} searchTerm - Término de búsqueda
   * @param {boolean} mostrarActivos - Si es true, mostrar usuarios activos (envía activo=true). Si es false, mostrar inactivos (envía activo=false)
   */
  getUsuarios: async (page = 1, pageSize = 10, searchTerm = '', mostrarActivos = true) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    
    // El backend espera el parámetro 'activo':
    // - Si queremos mostrar activos: activo = true
    // - Si queremos mostrar inactivos: activo = false
    if (mostrarActivos !== undefined) {
      params.activo = mostrarActivos;
    }
    
    // Siempre enviar el parámetro search, incluso si está vacío (el backend lo maneja)
    if (searchTerm !== undefined && searchTerm !== null) {
      params.search = searchTerm.trim();
    }
    
    const response = await api.get(`${baseUrl}/api/usuario/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene un usuario por su ID
   */
  getUsuarioPorId: async (usuarioId) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const id = Number(usuarioId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de usuario no válido: ' + JSON.stringify(usuarioId));
    }
    const response = await api.get(`${baseUrl}/api/usuario/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo usuario
   */
  crearUsuario: async (usuarioData) => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/usuario/crear`;
    try {
      const response = await api.post(url, usuarioData, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza un usuario existente
   */
  actualizarUsuario: async (usuarioData) => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/usuario/actualizar`;
    try {
      const response = await api.put(url, usuarioData, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cambia la contraseña del usuario autenticado.
   * API: PUT /api/login/cambiar-clave
   * Headers: Authorization: Bearer <token>, Content-Type: application/json
   * El backend valida que el usuario del token coincida con UsuarioId (403 si no).
   * @param {string} passwordActual - Contraseña actual (ClaveActual)
   * @param {string} passwordNueva - Nueva contraseña (NuevaClave)
   * @param {number} usuarioId - ID del usuario logueado (sl_usuario). Debe ser el mismo que viene en el token.
   */
  cambiarContraseña: async (passwordActual, passwordNueva, usuarioId) => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/login/cambiar-clave`;
    const id = usuarioId != null ? Number(usuarioId) : null;
    if (id == null || !Number.isInteger(id) || id <= 0) {
      throw new Error('UsuarioId es obligatorio para cambiar la contraseña.');
    }
    try {
      const response = await api.put(url, {
        UsuarioId: id,
        ClaveActual: passwordActual || '',
        NuevaClave: passwordNueva || '',
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina un usuario (baja lógica)
   */
  eliminarUsuario: async (usuarioId) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const id = Number(usuarioId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de usuario no válido: ' + JSON.stringify(usuarioId));
    }
    const url = `${baseUrl}/api/usuario/baja?id=${id}`;
    try {
      const response = await api.post(url, null, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Activa un usuario (habilitar usuario inactivo)
   */
  activarUsuario: async (usuarioId) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const id = Number(usuarioId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de usuario no válido: ' + JSON.stringify(usuarioId));
    }
    const url = `${baseUrl}/api/usuario/activar?id=${id}`;
    try {
      const response = await api.post(url, null, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Comprueba si el usuario SmartTime ya existe en el sistema.
   * @returns {Promise<boolean>} true si existe, false si no existe o hay error
   */
  existeUsuarioSmartTime: async () => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/usuario/smarttime/existe`;
    try {
      const response = await api.get(url);
      return response.data === true || response.data?.existe === true;
    } catch (error) {
      // Si el endpoint no existe (404) o el usuario no existe, asumimos que no existe
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  },
};

