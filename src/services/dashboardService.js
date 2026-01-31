import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de dashboard
 * @deprecated getDashboardInicio ha sido eliminado - usar inicioService.getInicioWeb en su lugar
 */
export const dashboardService = {
  /**
   * Obtiene menú del día por turno
   */
  getMenuDelDia: async (turnoId, fecha = null) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const params = { turnoId };
    if (fecha) {
      params.fecha = fecha;
    }
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await api.get(`${baseUrl}/api/dashboard/menu-del-dia`, {
        params,
        headers,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

