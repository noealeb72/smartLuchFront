import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de plantas
 */
export const plantasService = {
  /**
   * Obtiene una planta por su ID
   */
  getPlantaPorId: async (plantaId) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que el ID sea número entero
    const id = Number(plantaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de planta no válido: ' + JSON.stringify(plantaId));
    }
    const response = await api.get(`${baseUrl}/api/planta/${id}`);
    return response.data;
  },

  /**
   * Busca plantas por término de búsqueda
   * @param {string} searchTerm - Término de búsqueda
   * @param {boolean} activo - Si es true, buscar plantas activas. Si es false, buscar inactivas
   */
  buscarPlantas: async (searchTerm = '', activo = true) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      activo: activo,
    };
    
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    const response = await api.get(`${baseUrl}/api/planta/buscar`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene lista de plantas
   * @param {number} page - Número de página
   * @param {number} pageSize - Tamaño de página
   * @param {string} searchTerm - Término de búsqueda
   * @param {boolean} mostrarActivos - Si es true, mostrar plantas activas (envía activo=true). Si es false, mostrar inactivas (envía activo=false)
   */
  getPlantasLista: async (page = 1, pageSize = 10, searchTerm = '', mostrarActivos = true) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    
    // El backend espera el parámetro 'activo':
    // - Si queremos mostrar activas: activo = true
    // - Si queremos mostrar inactivas: activo = false
    // Siempre enviar el parámetro activo (true o false)
    params.activo = mostrarActivos === true;
    
    // Solo enviar el parámetro search si tiene un valor
    if (searchTerm !== undefined && searchTerm !== null && searchTerm.trim() !== '') {
      params.search = searchTerm.trim();
    }
    
    const response = await api.get(`${baseUrl}/api/planta/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea una nueva planta
   */
  crearPlanta: async (plantaData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/planta/crear`, plantaData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza una planta existente
   */
  actualizarPlanta: async (plantaData) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que el ID sea número entero
    const id = Number(plantaData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de planta no válido: ' + JSON.stringify(plantaData.id));
    }
    // El ID va como query parameter, los datos en el body
    const url = `${baseUrl}/api/planta/actualizar?id=${id}`;
    const dataToSend = {
      id: id,
      nombre: plantaData.nombre || '',
      descripcion: plantaData.descripcion || null,
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
   * Elimina una planta (baja lógica)
   */
  eliminarPlanta: async (plantaId) => {
    const baseUrl = getApiBaseUrl();
    
    // Aseguramos que sea número entero
    const id = Number(plantaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de planta no válido: ' + JSON.stringify(plantaId));
    }
    
    // Igual que en usuario: id por query string
    const url = `${baseUrl}/api/planta/baja?id=${id}`;
    
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
   * Establece una planta como por defecto
   */
  establecerPorDefecto: async (plantaId) => {
    const baseUrl = getApiBaseUrl();
    const id = Number(plantaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de planta no válido: ' + JSON.stringify(plantaId));
    }
    const url = `${baseUrl}/api/planta/establecer-por-defecto?id=${id}`;
    const response = await api.post(url, null, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Activa una planta (habilitar planta inactiva)
   */
  activarPlanta: async (plantaId) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const id = Number(plantaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de planta no válido: ' + JSON.stringify(plantaId));
    }
    const url = `${baseUrl}/api/planta/activar?id=${id}`;
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

