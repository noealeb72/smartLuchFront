/**
 * Utilidades para mapear datos del backend al formato esperado por el frontend
 */

/**
 * Mapea un usuario del backend al formato esperado
 * Maneja diferentes variaciones de nombres de campos
 */
export const mapUsuario = (usuario) => {
  if (!usuario || typeof usuario !== 'object') {
    return usuario;
  }

  // Crear objeto normalizado
  const mapped = { ...usuario };

  // Mapear campos comunes (case-insensitive y variaciones)
  const fieldMappings = {
    // Username
    'username': ['username', 'Username', 'USERNAME', 'user_name', 'userName'],
    // Nombre
    'nombre': ['nombre', 'Nombre', 'NOMBRE', 'name', 'Name', 'NAME'],
    // Apellido
    'apellido': ['apellido', 'Apellido', 'APELLIDO', 'lastname', 'lastName', 'LastName', 'LASTNAME'],
    // Legajo
    'legajo': ['legajo', 'Legajo', 'LEGAJO', 'legajo_num', 'legajoNum'],
    // DNI
    'dni': ['dni', 'Dni', 'DNI', 'dni_num', 'dniNum'],
    // CUIL
    'cuil': ['cuil', 'Cuil', 'CUIL', 'cuil_num', 'cuilNum'],
    // Jerarquía
    'jerarquia_nombre': ['jerarquia_nombre', 'jerarquiaNombre', 'JerarquiaNombre', 'jerarquia', 'Jerarquia', 'JERARQUIA'],
    'jerarquia_id': ['jerarquia_id', 'jerarquiaId', 'JerarquiaId', 'jerarquia_id'],
    // Plan Nutricional
    'plannutricional_nombre': ['plannutricional_nombre', 'planNutricionalNombre', 'PlanNutricionalNombre', 'plannutricional', 'PlanNutricional'],
    'plannutricional_id': ['plannutricional_id', 'planNutricionalId', 'PlanNutricionalId', 'plannutricional_id'],
    // Planta
    'planta_nombre': ['planta_nombre', 'plantaNombre', 'PlantaNombre', 'planta', 'Planta'],
    'planta_id': ['planta_id', 'plantaId', 'PlantaId', 'planta_id'],
    // Centro de Costo
    'centrodecosto_nombre': ['centrodecosto_nombre', 'centroDeCostoNombre', 'CentroDeCostoNombre', 'centrodecosto', 'CentroDeCosto'],
    'centrodecosto_id': ['centrodecosto_id', 'centroDeCostoId', 'CentroDeCostoId', 'centrodecosto_id'],
    // Proyecto
    'proyecto_nombre': ['proyecto_nombre', 'proyectoNombre', 'ProyectoNombre', 'proyecto', 'Proyecto'],
    'proyecto_id': ['proyecto_id', 'proyectoId', 'ProyectoId', 'proyecto_id'],
  };

  // Aplicar mapeos
  Object.keys(fieldMappings).forEach(targetField => {
    if (!mapped[targetField]) {
      const variations = fieldMappings[targetField];
      for (const variation of variations) {
        if (usuario[variation] !== undefined && usuario[variation] !== null) {
          const val = usuario[variation];
          mapped[targetField] = typeof val === 'object' && val !== null && !Array.isArray(val)
            ? (val.nombre || val.Nombre || val.descripcion || val.Descripcion || val)
            : val;
          break;
        }
      }
    }
  });

  // Jerarquía: si viene como objeto anidado (Jerarquia: { nombre, descripcion }), extraer el nombre
  if (!mapped.jerarquia_nombre && (usuario.Jerarquia || usuario.jerarquia)) {
    const jer = usuario.Jerarquia || usuario.jerarquia;
    if (typeof jer === 'object' && jer !== null) {
      mapped.jerarquia_nombre = jer.nombre || jer.Nombre || jer.descripcion || jer.Descripcion || '';
    }
  }

  // También crear versiones en minúsculas de todos los campos para compatibilidad
  Object.keys(usuario).forEach(key => {
    const keyLower = key.toLowerCase();
    if (!mapped[keyLower]) {
      mapped[keyLower] = usuario[key];
    }
  });

  return mapped;
};

/**
 * Mapea un array de usuarios
 */
export const mapUsuarios = (usuarios) => {
  if (!Array.isArray(usuarios)) {
    return usuarios;
  }
  return usuarios.map(mapUsuario);
};

