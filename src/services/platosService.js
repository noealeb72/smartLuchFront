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

    const response = await api.get(`${baseUrl}/api/plato/Lista`, { params });
    return response.data; // { page, pageSize, totalItems, totalPages, items }
  },

  /**
   * Obtiene un plato por su ID
   */
  getPlatoPorId: async (id) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/plato/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo plato
   */
  crearPlato: async (platoData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/plato/Create`, platoData, {
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
    const response = await api.put(`${baseUrl}/api/plato/Update`, platoData, {
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
    const response = await api.post(`${baseUrl}/api/plato/Delete`, { Id: id }, {
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
    const payload = updateUser
      ? { Id: id, UpdateUser: updateUser }
      : { Id: id };
  
    const response = await api.post(`${baseUrl}/api/plato/Activar`, payload, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },
};

