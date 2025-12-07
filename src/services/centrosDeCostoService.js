import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de centros de costo
 */
export const centrosDeCostoService = {
  /**
   * Obtiene lista paginada de centros de costo
   */
  getCentrosDeCostoLista: async (page = 1, pageSize = 10, searchTerm = '') => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    const response = await api.get(`${baseUrl}/api/centrodecosto/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea un nuevo centro de costo
   */
  crearCentroDeCosto: async (centroData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/centrodecosto/Create`, centroData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un centro de costo existente
   */
  actualizarCentroDeCosto: async (centroData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/centrodecosto/Update`, centroData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina un centro de costo (baja lógica)
   */
  eliminarCentroDeCosto: async (centroId) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/centrodecosto/Delete`, { id: centroId }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },
};

