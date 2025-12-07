/**
 * Modelo de Usuario
 * Define la estructura de datos de un usuario
 */
export const UsuarioModel = {
  id: null,
  nombre: '',
  apellido: '',
  legajo: '',
  dni: '',
  cuil: '',
  email: '',
  telefono: '',
  planta_id: null,
  planta_nombre: '',
  centrodecosto_id: null,
  centrodecosto_nombre: '',
  proyecto_id: null,
  proyecto_nombre: '',
  jerarquia_id: null,
  jerarquia_nombre: '',
  plannutricional_id: null,
  plannutricional_nombre: '',
  pedidos: 0,
  bonificaciones: 0,
  bonificaciones_invitado: 0,
  fecha_ingreso: '',
  contrato: '',
  role: '', // Alias de jerarquia_nombre
};

/**
 * Crea un objeto Usuario con valores por defecto
 */
export const createUsuario = (data = {}) => {
  return { ...UsuarioModel, ...data };
};

