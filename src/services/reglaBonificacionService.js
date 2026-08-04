import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de reglas de bonificación (motor genérico de descuentos por pedido).
 * Alineado con la API: api/reglabonificacion/*
 */
export const reglaBonificacionService = {
  /**
   * Obtiene lista paginada de reglas
   */
  getReglasLista: async (page = 1, pageSize = 10, searchTerm = '', mostrarActivos = true) => {
    const baseUrl = getApiBaseUrl();
    const params = { page, pageSize };

    if (mostrarActivos !== undefined) {
      params.activo = mostrarActivos;
    }
    if (searchTerm !== undefined && searchTerm !== null) {
      params.search = searchTerm.trim();
    }

    const response = await api.get(`${baseUrl}/api/reglabonificacion/lista`, { params });
    return response.data;
  },

  /**
   * Obtiene una regla por su ID
   */
  getReglaPorId: async (id) => {
    const baseUrl = getApiBaseUrl();
    const reglaId = Number(id);
    if (!Number.isInteger(reglaId) || reglaId <= 0) {
      throw new Error('ID de regla no válido: ' + JSON.stringify(id));
    }
    const response = await api.get(`${baseUrl}/api/reglabonificacion/${reglaId}`);
    return response.data;
  },

  /**
   * Crea una nueva regla
   * El backend espera ReglaBonificacionCreateDto en PascalCase
   */
  crearRegla: async (reglaData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/reglabonificacion/crear`, reglaData, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza una regla existente
   * El backend espera ReglaBonificacionUpdateDto (incluye Id) en PascalCase
   */
  actualizarRegla: async (reglaData) => {
    const baseUrl = getApiBaseUrl();
    const id = Number(reglaData.Id || reglaData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de regla no válido: ' + JSON.stringify(reglaData.Id || reglaData.id));
    }
    const dataToSend = { ...reglaData, Id: id };
    const response = await api.put(`${baseUrl}/api/reglabonificacion/actualizar`, dataToSend, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina una regla (baja lógica)
   */
  eliminarRegla: async (id) => {
    const baseUrl = getApiBaseUrl();
    const reglaId = Number(id);
    if (!Number.isInteger(reglaId) || reglaId <= 0) {
      throw new Error('ID de regla no válido: ' + JSON.stringify(id));
    }
    const response = await api.post(`${baseUrl}/api/reglabonificacion/eliminar?id=${reglaId}`, null, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Activa una regla (dar de alta)
   */
  activarRegla: async (id) => {
    const baseUrl = getApiBaseUrl();
    const reglaId = Number(id);
    if (!Number.isInteger(reglaId) || reglaId <= 0) {
      throw new Error('ID de regla no válido: ' + JSON.stringify(id));
    }
    const response = await api.post(`${baseUrl}/api/reglabonificacion/activar?id=${reglaId}`, null, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    clearApiCache();
    return response.data;
  },
};
