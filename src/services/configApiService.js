import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de configuración del servidor
 */
export const configApiService = {
  /**
   * Obtiene configuración del servidor
   */
  getConfig: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/config/get`);
    return response.data;
  },

  /**
   * Obtiene si SmartTime está habilitado para mostrar en el menú.
   * GET /api/smartime/config/smarTime
   * @returns {Promise<boolean>} true si debe mostrarse "Habilitar SmartTime", false si no
   */
  getSmartTimeConfig: async () => {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await api.get(`${baseUrl}/api/smartime/config/smarTime`);
      const data = response.data || response;
      return data.smarTime === true || data.smartTime === true;
    } catch (err) {
      if (err.response?.status === 404) return false;
      throw err;
    }
  },

  /**
   * Verifica si el usuario SmartTime ya existe en el sistema.
   * GET /api/smartime/config/usuario-existe
   * @returns {Promise<boolean>} true si existe, false si no existe
   */
  getSmartTimeUsuarioExiste: async () => {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await api.get(`${baseUrl}/api/smartime/config/usuario-existe`);
      const data = response.data || response;
      return data.existe === true || data.usuarioExiste === true;
    } catch (err) {
      if (err.response?.status === 404) return false;
      throw err;
    }
  },

  /**
   * Crea el usuario SmartTime con la contraseña indicada.
   * POST /api/smartime/config/crear-usuario
   * @param {string} contraseña - Contraseña para el usuario smartTime
   * @returns {Promise<{ creado: boolean, mensaje: string }>}
   * - 201: { creado: true, mensaje: "Usuario smarTime creado correctamente." }
   * - 200: { creado: false, mensaje: "El usuario smarTime ya existía." }
   * - 400: smarTime no está en true en config, o contraseña inválida
   */
  crearUsuarioSmartTime: async (contraseña) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/smartime/config/crear-usuario`, {
      contraseña: contraseña || '',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data || response;
  },
};

