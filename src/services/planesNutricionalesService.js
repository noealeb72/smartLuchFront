import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de planes nutricionales
 */
export const planesNutricionalesService = {
  /**
   * Obtiene lista paginada de planes nutricionales
   * @param {number} page - Número de página
   * @param {number} pageSize - Tamaño de página
   * @param {string} searchTerm - Término de búsqueda
   * @param {boolean} mostrarActivos - Si es true, mostrar planes activos (envía activo=true). Si es false, mostrar inactivos (envía activo=false)
   */
  getPlanesNutricionalesLista: async (page = 1, pageSize = 10, searchTerm = '', mostrarActivos = true) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    
    // El backend espera el parámetro 'activo':
    // - Si queremos mostrar activos: activo = true
    // - Si queremos mostrar inactivos: activo = false
    if (mostrarActivos !== undefined) {
      params.activo = mostrarActivos;
    }
    
    // Siempre enviar el parámetro search, incluso si está vacío (el backend lo maneja)
    if (searchTerm !== undefined && searchTerm !== null) {
      params.search = searchTerm.trim();
    }
    const response = await api.get(`${baseUrl}/api/plannutricional/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene un plan nutricional por su ID
   */
  getPlanNutricionalPorId: async (planId) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const id = Number(planId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de plan nutricional no válido: ' + JSON.stringify(planId));
    }
    const response = await api.get(`${baseUrl}/api/plannutricional/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo plan nutricional
   */
  crearPlanNutricional: async (planData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/plannutricional/crear`, planData, {
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
    // Aseguramos que el ID sea número entero
    const id = Number(planData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de plan nutricional no válido: ' + JSON.stringify(planData.id));
    }
    // El ID va como query parameter, los datos en el body
    const url = `${baseUrl}/api/plannutricional/actualizar?id=${id}`;
    const dataToSend = {
      id: id,
      nombre: planData.nombre || '',
      descripcion: planData.descripcion || null,
    };
    const response = await api.put(url, dataToSend, {
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
    // Aseguramos que sea número entero
    const id = Number(planId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de plan nutricional no válido: ' + JSON.stringify(planId));
    }
    // Igual que en usuario: id por query string
    const url = `${baseUrl}/api/plannutricional/baja?id=${id}`;
    try {
      const response = await api.post(url, null, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Activa un plan nutricional (dar de alta)
   */
  activarPlanNutricional: async (planId) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const id = Number(planId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de plan nutricional no válido: ' + JSON.stringify(planId));
    }
    const url = `${baseUrl}/api/plannutricional/activar?id=${id}`;
    try {
      const response = await api.post(url, null, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

