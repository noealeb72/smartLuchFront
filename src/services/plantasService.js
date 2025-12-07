import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de plantas
 */
export const plantasService = {
  /**
   * Obtiene lista de plantas
   */
  getPlantasLista: async (page = 1, pageSize = 10, searchTerm = '') => {
    const baseUrl = getApiBaseUrl();
    // El endpoint devuelve todo el listado, no usa paginación en el backend
    const response = await api.get(`${baseUrl}/api/planta/lista`);
    return response.data;
  },

  /**
   * Crea una nueva planta
   */
  crearPlanta: async (plantaData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/planta/Create`, plantaData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza una planta existente
   */
  actualizarPlanta: async (plantaData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.put(`${baseUrl}/api/planta/Update`, plantaData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina una planta (baja lógica)
   */
  eliminarPlanta: async (plantaId) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/planta/Delete`, { id: plantaId }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },
};

