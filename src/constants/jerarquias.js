/**
 * Nombres canónicos de jerarquías (roles) que vienen del backend.
 * Estructura en API: { id, nombre } con id 1-4 y nombres exactos:
 * - Admin
 * - Cocina
 * - Comensal
 * - Gerencia
 */
export const JERARQUIAS_NOMBRES = ['Admin', 'Cocina', 'Comensal', 'Gerencia'];

/** Nombre de la jerarquía administrador (no editable/eliminable en listado de usuarios) */
export const JERARQUIA_ADMIN = 'Admin';

/** Indica si un nombre de jerarquía (string) corresponde al administrador */
export const esJerarquiaAdmin = (nombre) => {
  if (!nombre || typeof nombre !== 'string') return false;
  const n = nombre.trim().toLowerCase();
  return n === 'admin' || n === 'administrador';
};
