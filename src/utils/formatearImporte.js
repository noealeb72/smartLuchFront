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
  // Formateo manual (no toLocaleString) para no depender de que el entorno tenga
  // datos completos de la locale es-ES: separador de miles "." y decimales ",".
  const [entero, decimales] = numSafe.toFixed(2).split('.');
  const signo = entero.startsWith('-') ? '-' : '';
  const enteroSinSigno = signo ? entero.slice(1) : entero;
  const enteroConPuntos = enteroSinSigno.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = `${signo}${enteroConPuntos},${decimales}`;
  return conSimbolo ? `$${formatted}` : formatted;
}
