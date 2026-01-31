import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de menú del día (Menudd)
 * Alineado con la API: api/menudd/*
 */
export const menuService = {
  /**
   * GET api/menudd/lista - Obtiene lista paginada de menú del día
   */
  getLista: async (page = 1, pageSize = 10, filtros = {}) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    // Solo pasar los parámetros que acepta el endpoint según la firma del método:
    // int page = 1, int pageSize = 10, DateTime? fechaDesde = null, DateTime? fechaHasta = null,
    // string search = null, bool activo = true
    const params = {
      page,
      pageSize,
      activo: filtros.activo !== undefined ? filtros.activo : true,
    };
    
    if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
    if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
    if (filtros.search && filtros.search.trim()) {
      params.search = filtros.search.trim();
    }
    // No se envían: plantaId, centroCostoId, proyectoId, jerarquiaId, turnoId, platoId
    
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await api.get(`${baseUrl}/api/menudd/lista`, {
      params,
      headers,
    });
    return response.data;
  },

  /**
   * GET api/menudd/{id} - Obtiene un menú del día por ID
   */
  getPorId: async (id) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await api.get(`${baseUrl}/api/menudd/${id}`, {
      headers,
    });
    
    return response.data;
  },

  /**
   * POST api/menudd/crear - Crea un nuevo menú del día
   */
  crearMenu: async (menuData) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await api.post(`${baseUrl}/api/menudd/crear`, menuData, {
      headers,
    });
    clearApiCache();
    return response.data;
  },

  /**
   * PUT api/menudd/actualizar - Actualiza un menú del día existente
   */
  actualizarMenu: async (menuData) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    // Asegurar que el ID esté en el DTO
    const id = Number(menuData.Id || menuData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de menú no válido: ' + JSON.stringify(menuData.Id || menuData.id));
    }
    
    const dtoToSend = {
      ...menuData,
      Id: id,
    };
    
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await api.put(`${baseUrl}/api/menudd/actualizar`, dtoToSend, {
      headers,
    });
    clearApiCache();
    return response.data;
  },

  /**
   * POST api/menudd/baja - Elimina un menú del día (baja lógica)
   * El backend espera: POST api/menudd/baja?id={id}
   */
  eliminarMenu: async (id) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const menuId = Number(id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      throw new Error('ID de menú no válido: ' + JSON.stringify(id));
    }
    
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await api.post(`${baseUrl}/api/menudd/baja`, null, {
      params: { id: menuId },
      headers,
    });
    clearApiCache();
    return response.data;
  },

  /**
   * POST api/menudd/activar - Activa un menú del día
   * El backend espera: POST api/menudd/activar?id={id}
   */
  activarMenu: async (id) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const menuId = Number(id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      throw new Error('ID de menú no válido: ' + JSON.stringify(id));
    }
    
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await api.post(`${baseUrl}/api/menudd/activar`, null, {
      params: { id: menuId },
      headers,
    });
    clearApiCache();
    return response.data;
  },

  /**
   * GET api/menudd/por-turno - Obtiene menú filtrado por turno con parámetros
   * Parámetros según la API: fecha, plantaId, turnoId, centroCostoId, proyectoId, jerarquiaId, nutricionalId, soloConStock
   */
  getMenuByTurno: async (planta, centro, jerarquia, proyecto, turno, fecha) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    // Convertir fecha a formato DateTime si es string
    let fechaParam = fecha;
    if (fecha instanceof Date) {
      fechaParam = fecha.toISOString();
    } else if (typeof fecha === 'string') {
      // Si es string, asegurar formato correcto
      fechaParam = fecha;
    } else {
      // Si no hay fecha, usar la fecha actual
      fechaParam = new Date().toISOString();
    }
    
    // Convertir turno a número si es necesario
    let turnoIdParam = null;
    if (turno !== null && turno !== undefined) {
      const turnoIdParsed = parseInt(turno);
      if (!isNaN(turnoIdParsed) && turnoIdParsed > 0) {
        turnoIdParam = turnoIdParsed;
      }
    }
    
    const params = {
      fecha: fechaParam,
      plantaId: planta ? parseInt(planta) : null,
      turnoId: turnoIdParam,
      centroCostoId: centro ? parseInt(centro) : null,
      proyectoId: proyecto ? parseInt(proyecto) : null,
      jerarquiaId: jerarquia ? parseInt(jerarquia) : null,
      soloConStock: true,
    };
    
    // Eliminar parámetros null/undefined, excepto turnoId que es requerido
    Object.keys(params).forEach(key => {
      if (key !== 'turnoId' && (params[key] === null || params[key] === undefined)) {
        delete params[key];
      }
    });
    
    // Validar que turnoId esté presente y sea un número válido
    if (!params.turnoId || isNaN(params.turnoId) || params.turnoId <= 0) {
      throw new Error('turnoId es requerido y debe ser un número válido mayor a 0');
    }
    
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await api.get(`${baseUrl}/api/menudd/por-turno`, {
        params,
        headers,
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * GET api/menudd/turno - Obtiene menú por turno usando datos del usuario del token
   * El backend obtiene los datos del usuario (planta, centro, proyecto, jerarquía) del token
   * @param {number} turnoId - ID del turno (requerido)
   * @param {boolean} soloConStock - Solo mostrar items con stock disponible (default: true)
   */
  getMenuByTurnoId: async (turnoId, soloConStock = true) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    if (!turnoId || turnoId <= 0) {
      throw new Error('turnoId es requerido y debe ser un número válido');
    }
    
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      throw new Error('Token de autenticación requerido');
    }
    
    try {
      const response = await api.get(`${baseUrl}/api/menudd/turno`, {
        params: { turnoId, soloConStock },
        headers,
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST api/menudd/impresion - Obtiene datos de menús para impresión con columnas y filtros seleccionados
   * @param {Object} params - Objeto con columnas a incluir y filtros
   */
  getImpresion: async (params) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await api.post(`${baseUrl}/api/menudd/impresion`, params, {
      headers,
    });
    
    return response.data;
  },
};

