import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de dashboard
 */
export const dashboardService = {
  /**
   * Obtiene datos del dashboard de inicio
   */
  getDashboardInicio: async () => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    console.log('Llamando a dashboard/inicio:', `${baseUrl}/api/dashboard/inicio`);
    console.log('Token disponible:', token ? 'Sí' : 'No');
    try {
      const response = await api.get(`${baseUrl}/api/dashboard/inicio`);
      console.log('Respuesta dashboard/inicio:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en getDashboardInicio:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
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

