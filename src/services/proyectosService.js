import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de proyectos
 */
export const proyectosService = {
  /**
   * Obtiene lista paginada de proyectos
   */
  getProyectosLista: async (page = 1, pageSize = 10, searchTerm = '') => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    const response = await api.get(`${baseUrl}/api/proyecto/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea un nuevo proyecto
   */
  crearProyecto: async (proyectoData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/proyecto/Create`, proyectoData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un proyecto existente
   */
  actualizarProyecto: async (proyectoData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.put(`${baseUrl}/api/proyecto/Update`, proyectoData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina un proyecto (baja lógica)
   */
  eliminarProyecto: async (proyectoId) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/proyecto/Delete`, { id: proyectoId }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },
};

