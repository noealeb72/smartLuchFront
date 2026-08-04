import api from './apiClient';
import { getApiBaseUrl } from './configService';

/** El backend no fuerza camelCase en las respuestas: normalizamos acá (igual que platosService) */
function normalizarScript(s) {
  return {
    nombreScript: s.NombreScript ?? s.nombreScript,
    descripcion: s.Descripcion ?? s.descripcion,
    ejecutado: s.Ejecutado ?? s.ejecutado ?? false,
    fechaEjecucion: s.FechaEjecucion ?? s.fechaEjecucion ?? null,
    ultimoResultado: s.UltimoResultado ?? s.ultimoResultado ?? null,
    ultimoMensaje: s.UltimoMensaje ?? s.ultimoMensaje ?? null,
  };
}

function normalizarResultado(r) {
  return {
    nombreScript: r.NombreScript ?? r.nombreScript,
    exito: r.Exito ?? r.exito ?? false,
    mensaje: r.Mensaje ?? r.mensaje ?? '',
  };
}

/**
 * Servicio del panel de scripts SQL pendientes (Scripts/nuevos_scripts en el backend).
 * El usuario ya está logueado como Admin, así que no hace falta mandar ninguna clave:
 * el backend acepta el JWT (rol Admin) como alternativa a la clave del panel.
 */
export const dbScriptsService = {
  /**
   * Lista los scripts pendientes/ejecutados.
   * GET /api/DbScripts/Pendientes
   */
  listar: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/DbScripts/Pendientes`);
    const data = response.data || response;
    const scripts = data.scripts || data.Scripts || [];
    return scripts.map(normalizarScript);
  },

  /**
   * Ejecuta los scripts seleccionados.
   * POST /api/DbScripts/Ejecutar
   * @param {string[]} nombresScripts
   * @returns {Promise<{ok: boolean, resultados: Array<{nombreScript: string, exito: boolean, mensaje: string}>}>}
   */
  ejecutar: async (nombresScripts) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/DbScripts/Ejecutar`, {
      Scripts: nombresScripts,
    });
    const data = response.data || response;
    const resultados = data.resultados || data.Resultados || [];
    return {
      ok: data.ok ?? data.Ok ?? false,
      resultados: resultados.map(normalizarResultado),
    };
  },
};
