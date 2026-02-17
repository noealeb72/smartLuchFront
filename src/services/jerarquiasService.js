import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de jerarquías
 */
export const jerarquiasService = {
  /**
   * Obtiene lista paginada de jerarquías
   * @param {number} page - Número de página
   * @param {number} pageSize - Tamaño de página
   * @param {string} searchTerm - Término de búsqueda
   * @param {boolean} mostrarActivos - Si es true, mostrar jerarquías activas (envía activo=true). Si es false, mostrar inactivas (envía activo=false)
   */
  getJerarquiasLista: async (page = 1, pageSize = 10, searchTerm = '', mostrarActivos = true) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    
    // El backend espera el parámetro 'activo':
    // - Si queremos mostrar activos: activo = true
    // - Si queremos mostrar inactivos: activo = false
    // Usar la misma lógica que en Turnos
    if (mostrarActivos !== undefined) {
      params.activo = mostrarActivos;
    }
    
    // Siempre enviar el parámetro search, incluso si está vacío (el backend lo maneja)
    if (searchTerm !== undefined && searchTerm !== null) {
      params.search = searchTerm.trim();
    }
    const response = await api.get(`${baseUrl}/api/jerarquia/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene una jerarquía por su ID
   */
  getJerarquiaPorId: async (jerarquiaId) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que el ID sea número entero
    const id = Number(jerarquiaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de jerarquía no válido: ' + JSON.stringify(jerarquiaId));
    }
    const response = await api.get(`${baseUrl}/api/jerarquia/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva jerarquía
   * @param {object} jerarquiaData - Datos de la jerarquía (nombre, descripcion, bonificacion)
   * El backend espera JerarquiaCreateDto: { Nombre, Descripcion, Bonificacion }
   */
  crearJerarquia: async (jerarquiaData) => {
    const baseUrl = getApiBaseUrl();
    // El backend espera PascalCase y Bonificacion como decimal (no null)
    const dataToSend = {
      Nombre: jerarquiaData.nombre || jerarquiaData.Nombre || '',
      Descripcion: jerarquiaData.descripcion || jerarquiaData.Descripcion || null,
      Bonificacion: jerarquiaData.bonificacion !== undefined && jerarquiaData.bonificacion !== null 
        ? parseFloat(jerarquiaData.bonificacion) || 0 
        : (jerarquiaData.Bonificacion !== undefined && jerarquiaData.Bonificacion !== null 
            ? parseFloat(jerarquiaData.Bonificacion) || 0 
            : 0),
    };
    const response = await api.post(`${baseUrl}/api/jerarquia/crear`, dataToSend, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza una jerarquía existente
   * @param {object} jerarquiaData - Datos de la jerarquía (id, nombre, descripcion, bonificacion)
   * El backend espera JerarquiaUpdateDto: { Id, Nombre, Descripcion, Bonificacion }
   */
  actualizarJerarquia: async (jerarquiaData) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que el ID sea número entero
    const id = Number(jerarquiaData.id || jerarquiaData.Id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de jerarquía no válido: ' + JSON.stringify(jerarquiaData.id || jerarquiaData.Id));
    }
    // El backend espera PascalCase y Bonificacion como decimal (no null)
    // El ID va como query parameter según la documentación, pero también en el body
    const url = `${baseUrl}/api/jerarquia/actualizar?id=${id}`;
    const dataToSend = {
      Id: id,
      Nombre: jerarquiaData.nombre || jerarquiaData.Nombre || '',
      Descripcion: jerarquiaData.descripcion || jerarquiaData.Descripcion || null,
      Bonificacion: jerarquiaData.bonificacion !== undefined && jerarquiaData.bonificacion !== null 
        ? parseFloat(jerarquiaData.bonificacion) || 0 
        : (jerarquiaData.Bonificacion !== undefined && jerarquiaData.Bonificacion !== null 
            ? parseFloat(jerarquiaData.Bonificacion) || 0 
            : 0),
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
   * Elimina una jerarquía (baja lógica)
   */
  eliminarJerarquia: async (jerarquiaId) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que sea número entero
    const id = Number(jerarquiaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de jerarquía no válido: ' + JSON.stringify(jerarquiaId));
    }
    // El endpoint correcto es /api/jerarquia/eliminar según la documentación
    const url = `${baseUrl}/api/jerarquia/eliminar?id=${id}`;
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
   * Establece una jerarquía como por defecto
   */
  establecerPorDefecto: async (jerarquiaId) => {
    const baseUrl = getApiBaseUrl();
    const id = Number(jerarquiaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de jerarquía no válido: ' + JSON.stringify(jerarquiaId));
    }
    const url = `${baseUrl}/api/jerarquia/establecer-por-defecto?id=${id}`;
    const response = await api.post(url, null, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Activa una jerarquía (dar de alta)
   */
  activarJerarquia: async (jerarquiaId) => {
    const baseUrl = getApiBaseUrl();
    // Asegurar que el ID sea número entero
    const id = Number(jerarquiaId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de jerarquía no válido: ' + JSON.stringify(jerarquiaId));
    }
    const url = `${baseUrl}/api/jerarquia/activar?id=${id}`;
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

