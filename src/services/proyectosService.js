import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de proyectos
 */
export const proyectosService = {
  /**
   * Obtiene lista paginada de proyectos
   * @param {number} page - Número de página
   * @param {number} pageSize - Tamaño de página
   * @param {string} searchTerm - Término de búsqueda
   * @param {boolean} mostrarActivos - Si es true, mostrar proyectos activos (envía activo=true). Si es false, mostrar inactivos (envía activo=false)
   */
  getProyectosLista: async (page = 1, pageSize = 10, searchTerm = '', mostrarActivos = true) => {
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
    const response = await api.get(`${baseUrl}/api/proyecto/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene un proyecto por su ID
   */
  getProyectoPorId: async (proyectoId) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que el ID sea número entero
    const id = Number(proyectoId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de proyecto no válido: ' + JSON.stringify(proyectoId));
    }
    const response = await api.get(`${baseUrl}/api/proyecto/${id}`);
    return response.data;
  },

  /**
   * Obtiene proyectos activos para combo/dropdown
   */
  getProyectosActivosCombo: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/proyecto/activos-combo`);
    return response.data;
  },

  /**
   * Crea un nuevo proyecto
   */
  crearProyecto: async (proyectoData) => {
    const baseUrl = getApiBaseUrl();
    // El backend espera los datos en PascalCase: Nombre, Descripcion, PlantaId, CentroCostoId
    const dataToSend = {
      Nombre: proyectoData.nombre || proyectoData.Nombre || '',
      Descripcion: proyectoData.descripcion || proyectoData.Descripcion || null,
      PlantaId: proyectoData.planta_id ? parseInt(proyectoData.planta_id) : (proyectoData.PlantaId ? parseInt(proyectoData.PlantaId) : 0),
      CentroCostoId: proyectoData.centrodecosto_id ? parseInt(proyectoData.centrodecosto_id) : (proyectoData.CentroCostoId ? parseInt(proyectoData.CentroCostoId) : 0),
    };
    
    // Validar que los IDs sean números válidos
    if (!dataToSend.PlantaId || dataToSend.PlantaId <= 0) {
      throw new Error('PlantaId es requerido y debe ser un número válido');
    }
    if (!dataToSend.CentroCostoId || dataToSend.CentroCostoId <= 0) {
      throw new Error('CentroCostoId es requerido y debe ser un número válido');
    }
    
    const response = await api.post(`${baseUrl}/api/proyecto/crear`, dataToSend, {
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
    // Aseguramos que el ID sea número entero
    const id = Number(proyectoData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de proyecto no válido: ' + JSON.stringify(proyectoData.id));
    }
    // El ID va como query parameter, los datos en el body
    const url = `${baseUrl}/api/proyecto/actualizar?id=${id}`;
    // El backend espera los datos en PascalCase: Id, Nombre, Descripcion, PlantaId, CentroCostoId
    const dataToSend = {
      Id: id,
      Nombre: proyectoData.nombre || proyectoData.Nombre || '',
      Descripcion: proyectoData.descripcion || proyectoData.Descripcion || null,
      PlantaId: proyectoData.planta_id ? parseInt(proyectoData.planta_id) : (proyectoData.PlantaId ? parseInt(proyectoData.PlantaId) : 0),
      CentroCostoId: proyectoData.centrodecosto_id ? parseInt(proyectoData.centrodecosto_id) : (proyectoData.CentroCostoId ? parseInt(proyectoData.CentroCostoId) : 0),
    };
    
    // Validar que los IDs sean números válidos
    if (!dataToSend.PlantaId || dataToSend.PlantaId <= 0) {
      throw new Error('PlantaId es requerido y debe ser un número válido');
    }
    if (!dataToSend.CentroCostoId || dataToSend.CentroCostoId <= 0) {
      throw new Error('CentroCostoId es requerido y debe ser un número válido');
    }
    
    const response = await api.put(url, dataToSend, {
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
    // Aseguramos que sea número entero
    const id = Number(proyectoId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de proyecto no válido: ' + JSON.stringify(proyectoId));
    }
    // Igual que en usuario: id por query string
    const url = `${baseUrl}/api/proyecto/baja?id=${id}`;
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
   * Establece un proyecto como por defecto
   */
  establecerPorDefecto: async (proyectoId) => {
    const baseUrl = getApiBaseUrl();
    const id = Number(proyectoId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de proyecto no válido: ' + JSON.stringify(proyectoId));
    }
    const url = `${baseUrl}/api/proyecto/establecer-por-defecto?id=${id}`;
    const response = await api.post(url, null, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Activa un proyecto (dar de alta)
   */
  activarProyecto: async (proyectoId) => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/proyecto/activar?id=${proyectoId}`;
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

