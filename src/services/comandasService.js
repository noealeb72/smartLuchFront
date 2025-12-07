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
   * Crea un nuevo pedido
   */
  crearPedido: async (pedidoData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/comanda/Create`, pedidoData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
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
};

