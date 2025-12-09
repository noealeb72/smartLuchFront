import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de platos
 */
export const platosService = {
  /**
   * Obtiene lista paginada de platos
   */
  getPlatosLista: async (page = 1, pageSize = 10, search = '', activo = true) => {
    const baseUrl = getApiBaseUrl();
    const params = { page, pageSize, activo };
    if (search && search.trim()) {
      params.search = search.trim();
    }

    const response = await api.get(`${baseUrl}/api/plato/lista`, { params });
    return response.data; // { page, pageSize, totalItems, totalPages, items }
  },

  /**
   * Obtiene un plato por su ID
   */
  getPlatoPorId: async (id) => {
    const baseUrl = getApiBaseUrl();
    const platoId = Number(id);
    if (!Number.isInteger(platoId) || platoId <= 0) {
      throw new Error('ID de plato no válido: ' + JSON.stringify(id));
    }
    const response = await api.get(`${baseUrl}/api/plato/${platoId}`);
    return response.data;
  },

  /**
   * Busca platos por término de búsqueda
   */
  buscarPlatos: async (searchTerm = '', activo = true) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      activo: activo,
    };
    
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    const response = await api.get(`${baseUrl}/api/plato/buscar`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea un nuevo plato
   */
  crearPlato: async (platoData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/plato/crear`, platoData, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un plato existente
   */
  actualizarPlato: async (platoData) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const id = Number(platoData.Id || platoData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de plato no válido: ' + JSON.stringify(platoData.Id || platoData.id));
    }
    // El ID va como query parameter, los datos en el body
    const url = `${baseUrl}/api/plato/actualizar?id=${id}`;
    const response = await api.put(url, platoData, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina un plato (baja lógica)
   */
  eliminarPlato: async (id) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const platoId = Number(id);
    if (!Number.isInteger(platoId) || platoId <= 0) {
      throw new Error('ID de plato no válido: ' + JSON.stringify(id));
    }
    // El ID va como query parameter
    const url = `${baseUrl}/api/plato/baja?id=${platoId}`;
    const response = await api.post(url, null, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Activa un plato
   */
  activarPlato: async (id, updateUser = null) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const platoId = Number(id);
    if (!Number.isInteger(platoId) || platoId <= 0) {
      throw new Error('ID de plato no válido: ' + JSON.stringify(id));
    }
    // El ID va como query parameter
    const url = `${baseUrl}/api/plato/activar?id=${platoId}`;
    const response = await api.post(url, null, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },
};

