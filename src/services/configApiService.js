import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de configuración del servidor
 */
export const configApiService = {
  /**
   * Obtiene configuración del servidor
   */
  getConfig: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/config/get`);
    return response.data;
  },
};

