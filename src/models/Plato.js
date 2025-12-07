/**
 * Modelo de Plato
 * Define la estructura de datos de un plato
 */
export const PlatoModel = {
  id: null,
  nombre: '',
  descripcion: '',
  precio: 0,
  activo: true,
  imagen: null,
  categoria: '',
};

/**
 * Crea un objeto Plato con valores por defecto
 */
export const createPlato = (data = {}) => {
  return { ...PlatoModel, ...data };
};

