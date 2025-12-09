import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de centros de costo
 */
export const centrosDeCostoService = {
  /**
   * Obtiene lista paginada de centros de costo
   * @param {number} page - Número de página
   * @param {number} pageSize - Tamaño de página
   * @param {string} searchTerm - Término de búsqueda
   * @param {boolean} mostrarActivos - Si es true, mostrar centros activos (envía activo=true). Si es false, mostrar inactivos (envía activo=false)
   */
  getCentrosDeCostoLista: async (page = 1, pageSize = 10, searchTerm = '', mostrarActivos = true) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    
    // El backend espera el parámetro 'activo':
    // - Si queremos mostrar activos: activo = true
    // - Si queremos mostrar inactivos: activo = false
    // Siempre enviar el parámetro activo (true o false)
    params.activo = mostrarActivos === true;
    
    // Siempre enviar el parámetro search, incluso si está vacío (el backend lo maneja)
    if (searchTerm !== undefined && searchTerm !== null) {
      params.search = searchTerm.trim();
    } else {
      params.search = '';
    }
    
    // Agregar timestamp para evitar caché del navegador
    params._t = Date.now();
    
    const response = await api.get(`${baseUrl}/api/centrodecosto/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea un nuevo centro de costo
   */
  crearCentroDeCosto: async (centroData) => {
    const baseUrl = getApiBaseUrl();
    // El backend espera los datos en PascalCase: Nombre, Descripcion, PlantaId
    const dataToSend = {
      Nombre: centroData.nombre || centroData.Nombre || '',
      Descripcion: centroData.descripcion || centroData.Descripcion || null,
      PlantaId: centroData.planta_id ? parseInt(centroData.planta_id) : (centroData.PlantaId ? parseInt(centroData.PlantaId) : 0),
    };
    
    // Validar que PlantaId sea un número válido
    if (!dataToSend.PlantaId || dataToSend.PlantaId <= 0) {
      throw new Error('PlantaId es requerido y debe ser un número válido');
    }
    
    const response = await api.post(`${baseUrl}/api/centrodecosto/crear`, dataToSend, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un centro de costo existente
   */
  actualizarCentroDeCosto: async (centroData) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que el ID sea número entero
    const id = Number(centroData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de centro de costo no válido: ' + JSON.stringify(centroData.id));
    }
    // El ID va como query parameter, los datos en el body
    const url = `${baseUrl}/api/centrodecosto/actualizar?id=${id}`;
    // El backend espera los datos en PascalCase
    const dataToSend = {
      Id: id,
      PlantaId: centroData.planta_id ? parseInt(centroData.planta_id) : 0,
      Nombre: centroData.nombre || '',
      Descripcion: centroData.descripcion || null,
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
   * Elimina un centro de costo (baja lógica)
   */
  eliminarCentroDeCosto: async (centroId) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que sea número entero
    const id = Number(centroId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de centro de costo no válido: ' + JSON.stringify(centroId));
    }
    // Igual que en usuario: id por query string
    const url = `${baseUrl}/api/centrodecosto/baja?id=${id}`;
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
   * Activa un centro de costo (dar de alta)
   */
  activarCentroDeCosto: async (centroId) => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/centrodecosto/activar?id=${centroId}`;
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

