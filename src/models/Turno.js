/**
 * Modelo de Turno
 * Define la estructura de datos de un turno
 */
export const TurnoModel = {
  id: null,
  nombre: '',
  hora_inicio: '',
  hora_fin: '',
  activo: true,
};

/**
 * Crea un objeto Turno con valores por defecto
 */
export const createTurno = (data = {}) => {
  return { ...TurnoModel, ...data };
};

