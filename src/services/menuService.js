import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de menú del día
 */
export const menuService = {
  /**
   * Obtiene menú filtrado por turno
   */
  getMenuByTurno: async (planta, centro, jerarquia, proyecto, turno, fecha) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/menudd/filtrarPorTurno`, {
      params: { planta, centro, jerarquia, proyecto, turno, fecha },
    });
    return response.data;
  },
};

