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
    
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    console.log('📤 Parámetros enviados al backend:', params);
    
    const response = await api.get(`${baseUrl}/api/usuario/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea un nuevo usuario
   */
  crearUsuario: async (usuarioData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/usuario/Create`, usuarioData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un usuario existente
   */
  actualizarUsuario: async (usuarioData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.put(`${baseUrl}/api/usuario/Update`, usuarioData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina un usuario (baja lógica)
   */
  eliminarUsuario: async (usuarioId) => {
    const baseUrl = getApiBaseUrl();
    
    console.log('🗑️ Intentando dar de baja usuario ID:', usuarioId);
    console.log('🔗 Base URL:', baseUrl);
    
    // El backend espera el ID como query parameter según el patrón del LoginController
    const url = `${baseUrl}/api/usuario/baja?id=${usuarioId}`;
    console.log('🔗 URL completa:', url);
    
    try {
      const response = await api.post(url, null, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      console.log('✅ Usuario dado de baja exitosamente');
      console.log('📥 Respuesta:', response.data);
      clearApiCache();
      return response.data;
    } catch (error) {
      console.error('❌ Error al dar de baja usuario');
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Status Text:', error.response?.statusText);
      console.error('❌ Response Data:', error.response?.data);
      console.error('❌ URL intentada:', url);
      throw error;
    }
  },

  /**
   * Activa un usuario (habilitar usuario inactivo)
   */
  activarUsuario: async (usuarioId) => {
    const baseUrl = getApiBaseUrl();
    
    console.log('✅ Intentando activar usuario ID:', usuarioId);
    console.log('🔗 Base URL:', baseUrl);
    
    // El backend espera el ID como query parameter
    const url = `${baseUrl}/api/usuario/activar?id=${usuarioId}`;
    console.log('🔗 URL completa:', url);
    
    try {
      const response = await api.post(url, null, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      console.log('✅ Usuario activado exitosamente');
      console.log('📥 Respuesta:', response.data);
      clearApiCache();
      return response.data;
    } catch (error) {
      console.error('❌ Error al activar usuario');
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Status Text:', error.response?.statusText);
      console.error('❌ Response Data:', error.response?.data);
      console.error('❌ URL intentada:', url);
      throw error;
    }
  },
};

