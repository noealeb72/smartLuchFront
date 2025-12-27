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
    
    console.log('🚀 [dashboardService.getMenuDelDia] Iniciando llamada');
    console.log('📋 [dashboardService.getMenuDelDia] Parámetros:', { turnoId, fecha });
    console.log('🔑 [dashboardService.getMenuDelDia] Token disponible:', token ? '✅ Sí' : '❌ No');
    
    const params = { turnoId };
    if (fecha) {
      params.fecha = fecha;
    }
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ [dashboardService.getMenuDelDia] Header Authorization agregado');
    }
    
    console.log('📤 [dashboardService.getMenuDelDia] URL:', `${baseUrl}/api/dashboard/menu-del-dia`);
    console.log('📤 [dashboardService.getMenuDelDia] Params:', params);
    console.log('📤 [dashboardService.getMenuDelDia] Headers:', headers);
    
    try {
      const response = await api.get(`${baseUrl}/api/dashboard/menu-del-dia`, {
        params,
        headers,
      });
      console.log('✅ [dashboardService.getMenuDelDia] Respuesta recibida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [dashboardService.getMenuDelDia] Error:', error);
      console.error('❌ [dashboardService.getMenuDelDia] Error response:', error.response);
      throw error;
    }
  },
};

