import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de planes nutricionales
 */
export const planesNutricionalesService = {
  /**
   * Obtiene lista paginada de planes nutricionales
   */
  getPlanesNutricionalesLista: async (page = 1, pageSize = 10, searchTerm = '') => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    const response = await api.get(`${baseUrl}/api/Plannutricional/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea un nuevo plan nutricional
   */
  crearPlanNutricional: async (planData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/Plannutricional/Create`, planData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un plan nutricional existente
   */
  actualizarPlanNutricional: async (planData) => {
    const baseUrl = getApiBaseUrl();
    console.log('Actualizando plan nutricional - Datos:', planData, 'URL:', `${baseUrl}/api/Plannutricional/Update`);
    const response = await api.put(`${baseUrl}/api/Plannutricional/Update`, planData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina un plan nutricional (baja lógica)
   */
  eliminarPlanNutricional: async (planId) => {
    const baseUrl = getApiBaseUrl();
    console.log('Eliminando plan nutricional - ID:', planId, 'URL:', `${baseUrl}/api/Plannutricional/Delete`);
    const response = await api.post(`${baseUrl}/api/Plannutricional/Delete`, { id: planId }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },
};

