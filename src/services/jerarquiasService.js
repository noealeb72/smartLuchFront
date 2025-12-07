import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de jerarquías
 */
export const jerarquiasService = {
  /**
   * Obtiene lista paginada de jerarquías
   */
  getJerarquiasLista: async (page = 1, pageSize = 10, searchTerm = '') => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    const response = await api.get(`${baseUrl}/api/jerarquia/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea una nueva jerarquía
   */
  crearJerarquia: async (jerarquiaData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/jerarquia/Create`, jerarquiaData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza una jerarquía existente
   */
  actualizarJerarquia: async (jerarquiaData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.put(`${baseUrl}/api/jerarquia/Update`, jerarquiaData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina una jerarquía (baja lógica)
   */
  eliminarJerarquia: async (jerarquiaId) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/jerarquia/Delete`, { id: jerarquiaId }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },
};

