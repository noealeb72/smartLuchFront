import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de comandas/pedidos
 */
export const comandasService = {
  /**
   * Obtiene pedidos vigentes de un usuario
   */
  getPedidosVigentes: async (userId) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/comanda/GetPedidosVigentes`, {
      params: { 'user_id': userId },
    });
    return response.data;
  },

  /**
   * Obtiene pedidos pendientes para cocina
   */
  getPedidosPendientes: async (fecha = null, turnoId = null) => {
    const baseUrl = getApiBaseUrl();
    const params = {};
    if (fecha) params.fecha = fecha;
    if (turnoId) params.turnoId = turnoId;
    const response = await api.get(`${baseUrl}/api/comanda/GetPedidosPendientes`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene lista de pedidos para despacho
   * GET /api/comanda/lista
   */
  getLista: async (page = 1, pageSize = 10, fechaDesde = null, fechaHasta = null) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
      activo: true,
    };
    
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;
    
    const response = await api.get(`${baseUrl}/api/comanda/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Crea un nuevo pedido
   * POST /api/comanda/crear?usuarioId={usuarioId}
   * Usa el DTO ComandaCreateDto en el body y usuarioId como query parameter
   */
  crearPedido: async (pedidoData, usuarioId) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };
    
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Extraer usuarioId del DTO si no se pasó como parámetro separado
    const userId = usuarioId || pedidoData.UsuarioId;
    
    // Remover UsuarioId del DTO ya que se envía como parámetro separado
    const { UsuarioId, ...dtoSinUsuarioId } = pedidoData;
    
    const params = {
      usuarioId: parseInt(userId),
    };
    
    console.log('[comandasService.crearPedido] 📤 Enviando a POST /api/comanda/crear:');
    console.log('[comandasService.crearPedido] Query Param usuarioId:', params.usuarioId);
    console.log('[comandasService.crearPedido] DTO (sin UsuarioId):', JSON.stringify(dtoSinUsuarioId, null, 2));
    console.log('[comandasService.crearPedido] URL:', `${baseUrl}/api/comanda/crear?usuarioId=${params.usuarioId}`);
    
    const response = await api.post(`${baseUrl}/api/comanda/crear`, dtoSinUsuarioId, {
      params,
      headers,
    });
    
    console.log('[comandasService.crearPedido] 📥 Respuesta de la API:');
    console.log('[comandasService.crearPedido] Status:', response.status);
    console.log('[comandasService.crearPedido] Data:', JSON.stringify(response.data, null, 2));
    
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un pedido (estado, calificación, comentario)
   */
  actualizarPedido: async (pedidoId, estado, calificacion, comentario) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/comanda/Update`, {
      id: pedidoId,
      estado: estado,
      calificacion: calificacion,
      comentario: comentario,
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Marca un pedido como despachado
   */
  despacharPedido: async (pedidoId) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/comanda/Update`, {
      id: pedidoId,
      estado: 'D', // D = Despachado
      calificacion: null,
      comentario: null,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Cancela un pedido
   * PUT /api/comanda/cancelar
   * Usa el DTO ComandaAccionDto con Npedido
   */
  cancelarPedido: async (npedido) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };
    
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const dto = {
      Npedido: parseInt(npedido),
    };
    
    console.log('[comandasService.cancelarPedido] 📤 Enviando a PUT /api/comanda/cancelar:');
    console.log('[comandasService.cancelarPedido] DTO:', JSON.stringify(dto, null, 2));
    console.log('[comandasService.cancelarPedido] URL:', `${baseUrl}/api/comanda/cancelar`);
    
    const response = await api.put(`${baseUrl}/api/comanda/cancelar`, dto, {
      headers,
    });
    
    console.log('[comandasService.cancelarPedido] 📥 Respuesta de la API:');
    console.log('[comandasService.cancelarPedido] Status:', response.status);
    console.log('[comandasService.cancelarPedido] Data:', JSON.stringify(response.data, null, 2));
    
    clearApiCache();
    return response.data;
  },

  /**
   * Despacha un pedido
   * PUT /api/comanda/despachar
   * Usa el DTO ComandaAccionDto con Npedido
   */
  despacharPedidoPorNpedido: async (npedido) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };
    
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const dto = {
      Npedido: parseInt(npedido),
    };
    
    const response = await api.put(`${baseUrl}/api/comanda/despachar`, dto, {
      headers,
    });
    
    clearApiCache();
    return response.data;
  },

  /**
   * Devuelve un pedido
   * POST /api/comanda/devolver
   * Usa el DTO ComandaAccionDto con Npedido
   */
  devolverPedido: async (npedido) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };
    
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const dto = {
      Npedido: parseInt(npedido),
    };
    
    const response = await api.post(`${baseUrl}/api/comanda/devolver`, dto, {
      headers,
    });
    
    clearApiCache();
    return response.data;
  },

  /**
   * Recibe un pedido
   * PUT /api/comanda/recibir
   * Usa el DTO ComandaAccionDto con Npedido
   */
  recibirPedido: async (npedido) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };
    
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const dto = {
      Npedido: parseInt(npedido),
    };
    
    const response = await api.put(`${baseUrl}/api/comanda/recibir`, dto, {
      headers,
    });
    
    clearApiCache();
    return response.data;
  },

  /**
   * Obtiene pedidos reservados del usuario para un turno específico
   * GET /api/comanda/reservado
   * @param {Object} datos - DTO con UsuarioId, TurnoId, PlantaId, CentroDeCostoId, ProyectoId, JerarquiaId
   */
  getPedidoReservado: async (datos) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };
    
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Para GET, enviar los parámetros como query params
    const params = {
      UsuarioId: datos.UsuarioId,
      TurnoId: datos.TurnoId,
      PlantaId: datos.PlantaId,
      CentroDeCostoId: datos.CentroDeCostoId,
      ProyectoId: datos.ProyectoId,
      JerarquiaId: datos.JerarquiaId,
    };
    
    const response = await api.get(`${baseUrl}/api/comanda/reservado`, {
      params,
      headers,
    });
    
    return response.data;
  },
};

