import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de dashboard
 */
export const dashboardService = {
  /**
   * Obtiene datos del dashboard de inicio
   * Endpoint: /api/inicio/web/
   * Devuelve: { PlatosPedidos: [], Usuario: {...}, Turnos: [...], MenuDelDia: [...] }
   */
  getDashboardInicio: async () => {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await api.get(`${baseUrl}/api/inicio/web`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene menú del día por turno
   */
  getMenuDelDia: async (turnoId, fecha = null) => {
    const baseUrl = getApiBaseUrl();
    const params = { turnoId };
    if (fecha) {
      params.fecha = fecha;
    }
    const response = await api.get(`${baseUrl}/api/dashboard/menu-del-dia`, {
      params,
    });
    return response.data;
  },
};

