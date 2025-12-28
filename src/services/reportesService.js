import api from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de reportes
 */
export const reportesService = {
  /**
   * Obtiene el reporte por comensal
   * @param {string|number} legajo - Legajo del usuario/comensal (numérico)
   * @param {string} fechaDesde - Fecha desde (formato YYYY-MM-DD)
   * @param {string} fechaHasta - Fecha hasta (formato YYYY-MM-DD)
   * @param {number} plantaId - ID de la planta (opcional)
   */
  getReportePorComensal: async (legajo, fechaDesde, fechaHasta, plantaId = null) => {
    const baseUrl = getApiBaseUrl();
    
    // Asegurar que las fechas estén en formato correcto (YYYY-MM-DD)
    // El backend espera DateTime, pero acepta formato de fecha ISO
    let desdeFormateado = fechaDesde;
    let hastaFormateado = fechaHasta;
    
    // Si las fechas son strings en formato YYYY-MM-DD, mantenerlas así
    // Si son Date objects, convertirlas a formato ISO
    if (fechaDesde instanceof Date) {
      desdeFormateado = fechaDesde.toISOString().split('T')[0];
    } else if (typeof fechaDesde === 'string') {
      // Validar formato YYYY-MM-DD
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fechaDesde)) {
        throw new Error('Formato de fecha desde inválido. Debe ser YYYY-MM-DD');
      }
    }
    
    if (fechaHasta instanceof Date) {
      hastaFormateado = fechaHasta.toISOString().split('T')[0];
    } else if (typeof fechaHasta === 'string') {
      // Validar formato YYYY-MM-DD
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fechaHasta)) {
        throw new Error('Formato de fecha hasta inválido. Debe ser YYYY-MM-DD');
      }
    }
    
    const params = {
      user: legajo.toString(), // El backend espera el legajo como string
      desde: desdeFormateado,
      hasta: hastaFormateado,
    };
    
    // Agregar plantaId solo si está definido y es un número válido
    if (plantaId !== null && plantaId !== undefined && !isNaN(parseInt(plantaId))) {
      params.plantaId = parseInt(plantaId);
    }
    
    console.log('📤 [reportesService] Llamando a /api/reporte/User con parámetros:', params);
    
    try {
      const response = await api.get(`${baseUrl}/api/reporte/User`, {
        params,
      });
      console.log('✅ [reportesService] Respuesta recibida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [reportesService] Error al obtener reporte:', error);
      
      // Mejorar mensaje de error para CORS
      if (!error.response) {
        if (error.message && error.message.includes('CORS')) {
          throw new Error('Error CORS: El backend no permite peticiones desde este origen. Verifica la configuración CORS del servidor en el backend.');
        }
        throw new Error('Error de conexión con el servidor. Verifica que el backend esté corriendo y que CORS esté configurado correctamente.');
      }
      
      // Si hay respuesta del servidor, lanzar el error con el mensaje del backend
      throw error;
    }
  },
};

