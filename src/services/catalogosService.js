import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de catálogos (listas simples para dropdowns, etc.)
 */
export const catalogosService = {
  /**
   * Obtiene todas las jerarquías
   */
  getJerarquias: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/catalogos/jerarquias`);
    return response.data;
  },

  /**
   * Obtiene todas las plantas
   */
  getPlantas: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/catalogos/plantas`);
    return response.data;
  },

  /**
   * Obtiene todos los centros de costo
   */
  getCentrosDeCosto: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/catalogos/centrosdecosto`);
    return response.data;
  },

  /**
   * Obtiene todos los proyectos
   */
  getProyectos: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/catalogos/proyectos`);
    return response.data;
  },

  /**
   * Obtiene todos los planes nutricionales
   */
  getPlanesNutricionales: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/catalogos/planesnutricionales`);
    return response.data;
  },
};

