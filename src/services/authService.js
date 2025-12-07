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
    
    console.log('🔐 Intentando login en:', loginUrl);
    console.log('📋 Datos enviados:', { Username: user, Password: '***' });
    console.log('📦 Body completo (sin password):', JSON.stringify({ ...requestData, Password: '***' }));
    
    try {
      const response = await api.post(loginUrl, requestData, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        timeout: 60000, // 60 segundos para login (puede tardar más en procesar)
      });
      console.log('✅ Login exitoso');
      console.log('📥 Respuesta recibida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en petición de login');
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Status Text:', error.response?.statusText);
      console.error('❌ Response Data:', error.response?.data);
      console.error('❌ Error completo:', error);
      throw error;
    }
  },
};

