/**
 * Modelo de Comanda/Pedido
 * Define la estructura de datos de una comanda
 */
export const ComandaModel = {
  id: null,
  usuario_id: null,
  plato_id: null,
  turno_id: null,
  fecha: '',
  estado: '', // P = Pendiente, D = Despachado, C = Cancelado
  calificacion: null,
  comentario: '',
  fecha_pedido: '',
  fecha_despacho: null,
};

/**
 * Crea un objeto Comanda con valores por defecto
 */
export const createComanda = (data = {}) => {
  return { ...ComandaModel, ...data };
};

