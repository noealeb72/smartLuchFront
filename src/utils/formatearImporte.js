/**
 * Formatea importes con separador de miles (.) y decimales (,) para mostrar en reportes y listados.
 * Ejemplo: 28200.20 → "28.200,20" o "$28.200,20"
 * @param {number|string} valor - Valor numérico a formatear
 * @param {boolean} conSimbolo - Si true, agrega el símbolo $ al inicio (default: true)
 * @returns {string} Valor formateado o '-' si no es válido
 */
export function formatearImporte(valor, conSimbolo = true) {
  const num = parseFloat(valor);
  if (isNaN(num) && valor !== 0 && valor !== '0') return '-';
  const numSafe = isNaN(num) ? 0 : num;
  const formatted = numSafe.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return conSimbolo ? `$${formatted}` : formatted;
}
