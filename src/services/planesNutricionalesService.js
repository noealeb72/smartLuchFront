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
    
    // SIEMPRE enviar el parámetro activo explícitamente
    // No usar el valor por defecto de la función, usar el valor que se pasa
    const params = {
      page,
      pageSize,
      activo: mostrarActivos, // Asignar directamente el valor recibido (true o false)
    };
    
    // Siempre enviar el parámetro search, incluso si está vacío (el backend lo maneja)
    if (searchTerm !== undefined && searchTerm !== null) {
      params.search = searchTerm.trim();
    }
    
    // Log temporal para debug
    console.log('🔍 Plan Nutricional Service - Parámetros:', {
      mostrarActivos,
      tipo: typeof mostrarActivos,
      params_activo: params.activo,
      tipo_params_activo: typeof params.activo,
      url: `${baseUrl}/api/plannutricional/lista`,
      todos_los_params: params
    });
    
    // Agregar timestamp para evitar caché
    params._t = Date.now();
    
    const response = await api.get(`${baseUrl}/api/plannutricional/lista`, {
      params,
    });
    
    console.log('🔍 Plan Nutricional Service - Respuesta recibida:', {
      status: response.status,
      data_keys: Object.keys(response.data),
      items_count: response.data.items ? response.data.items.length : 0,
      totalItems: response.data.totalItems,
      primer_item: response.data.items && response.data.items.length > 0 ? response.data.items[0] : null
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

