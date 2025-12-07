import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de turnos
 */
export const turnosService = {
  /**
   * Obtiene lista paginada de turnos
   */
  getTurnosLista: async (page = 1, pageSize = 10, searchTerm = '') => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    const response = await api.get(`${baseUrl}/api/turno/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene turnos disponibles (para compatibilidad)
   */
  getTurnosDisponibles: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/turno/GetTurnosDisponibles`);
    return response.data;
  },

  /**
   * Crea un nuevo turno
   */
  crearTurno: async (turnoData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/turno/Create`, turnoData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un turno existente
   */
  actualizarTurno: async (turnoData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.put(`${baseUrl}/api/turno/Update`, turnoData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina un turno (baja lógica)
   */
  eliminarTurno: async (turnoId) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/turno/Delete`, { id: turnoId }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },
};

