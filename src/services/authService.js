import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Autentica un usuario con username y password
   * @param {string} user - Nombre de usuario
   * @param {string} pass - Contraseña
   * @returns {Promise<Object>} Token y datos del usuario
   */
  login: async (user, pass) => {
    const baseUrl = getApiBaseUrl();
    const loginUrl = `${baseUrl}/api/login/Autentificar`;
    const requestData = {
      Username: user,
      Password: pass,
    };
    
    try {
      const response = await api.post(loginUrl, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        timeout: 60000, // 60 segundos para login (puede tardar más en procesar)
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

