import axios from 'axios';
import api from './apiClient';
import { getApiBaseUrl } from './configService';

/** Clave para guardar el refresh token en sessionStorage */
export const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Autentica un usuario con username y password
   * @param {string} user - Nombre de usuario
   * @param {string} pass - Contraseña
   * @returns {Promise<Object>} Token, RefreshToken (si el back lo envía) y datos del usuario
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

  /**
   * Obtiene un nuevo JWT usando el refresh token (sin pasar por el interceptor de api).
   * Usado por apiClient ante 401 para renovar el token automáticamente.
   * @returns {Promise<{ token: string, refreshToken?: string }>}
   */
  refreshToken: async () => {
    const baseUrl = getApiBaseUrl();
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(REFRESH_TOKEN_KEY) : null;
    if (!stored) {
      throw new Error('No hay refresh token');
    }
    const response = await axios.post(
      `${baseUrl}/api/login/Refresh`,
      { refreshToken: stored },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    const data = response.data || response;
    const token = data.Token ?? data.token;
    const newRefreshToken = data.RefreshToken ?? data.refreshToken;
    if (!token) {
      throw new Error('El servidor no devolvió un nuevo token');
    }
    return { token, refreshToken: newRefreshToken };
  },
};

