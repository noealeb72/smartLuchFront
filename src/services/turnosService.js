import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';

/**
 * Servicio de turnos
 */
export const turnosService = {
  /**
   * Obtiene lista paginada de turnos
   * @param {number} page - Número de página
   * @param {number} pageSize - Tamaño de página
   * @param {string} searchTerm - Término de búsqueda
   * @param {boolean} mostrarActivos - Si es true, mostrar turnos activos (envía activo=true). Si es false, mostrar inactivos (envía activo=false)
   */
  getTurnosLista: async (page = 1, pageSize = 10, searchTerm = '', mostrarActivos = true) => {
    const baseUrl = getApiBaseUrl();
    const params = {
      page,
      pageSize,
    };
    
    // El backend espera el parámetro 'activo':
    // - Si queremos mostrar activos: activo = true
    // - Si queremos mostrar inactivos: activo = false
    if (mostrarActivos !== undefined) {
      params.activo = mostrarActivos;
    }
    
    // Siempre enviar el parámetro search, incluso si está vacío (el backend lo maneja)
    if (searchTerm !== undefined && searchTerm !== null) {
      params.search = searchTerm.trim();
    }
    const response = await api.get(`${baseUrl}/api/turno/lista`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtiene turnos disponibles (para compatibilidad)
   */
  getTurnosDisponibles: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/turno/GetTurnosDisponibles`);
    return response.data;
  },

  /**
   * Crea un nuevo turno
   * El backend espera: { Nombre, HoraDesde, HoraHasta } en PascalCase
   */
  crearTurno: async (turnoData) => {
    const baseUrl = getApiBaseUrl();
    
    // Asegurar que los datos estén en el formato correcto para el backend (PascalCase)
    // La página ya envía los datos en PascalCase: Nombre, HoraDesde, HoraHasta
    const dataToSend = {
      Nombre: turnoData.Nombre || turnoData.nombre || '',
      HoraDesde: turnoData.HoraDesde || turnoData.hora_desde || turnoData.Hora_Desde || '',
      HoraHasta: turnoData.HoraHasta || turnoData.hora_hasta || turnoData.Hora_Hasta || '',
    };
    
    // Validar que el nombre esté presente
    if (!dataToSend.Nombre || dataToSend.Nombre.trim() === '') {
      throw new Error('El nombre del turno es obligatorio');
    }
    
    // Validar que las horas estén presentes y no estén vacías
    if (!dataToSend.HoraDesde || dataToSend.HoraDesde.trim() === '') {
      throw new Error('HoraDesde es obligatoria');
    }
    if (!dataToSend.HoraHasta || dataToSend.HoraHasta.trim() === '') {
      throw new Error('HoraHasta es obligatoria');
    }
    
    // Log para debug: mostrar los parámetros que se envían
    console.log('=== CREAR TURNO - Parámetros enviados ===');
    console.log('Endpoint:', `${baseUrl}/api/turno/crear`);
    console.log('Datos originales recibidos:', turnoData);
    console.log('Datos a enviar (dataToSend):', dataToSend);
    console.log('JSON stringificado:', JSON.stringify(dataToSend));
    console.log('==========================================');
    
    // Llamar al endpoint /api/turno/crear con solo los campos requeridos
    const response = await api.post(`${baseUrl}/api/turno/crear`, dataToSend, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Actualiza un turno existente
   */
  actualizarTurno: async (turnoData) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que el ID sea número entero (puede venir como Id o id)
    const id = Number(turnoData.Id || turnoData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de turno no válido: ' + JSON.stringify(turnoData.Id || turnoData.id));
    }
    // El ID va como query parameter, los datos en el body
    const url = `${baseUrl}/api/turno/actualizar?id=${id}`;
    
    // Asegurar que los datos estén en el formato correcto para el backend (PascalCase)
    // La página ya envía los datos en PascalCase con las horas formateadas
    const dataToSend = {
      Id: id,
      Nombre: turnoData.Nombre || turnoData.nombre || '',
      HoraDesde: turnoData.HoraDesde || turnoData.hora_desde || turnoData.Hora_Desde || '',
      HoraHasta: turnoData.HoraHasta || turnoData.hora_hasta || turnoData.Hora_Hasta || '',
    };
    
    // Validar que las horas estén presentes y no estén vacías
    if (!dataToSend.HoraDesde || dataToSend.HoraDesde.trim() === '') {
      throw new Error('HoraDesde es obligatoria');
    }
    if (!dataToSend.HoraHasta || dataToSend.HoraHasta.trim() === '') {
      throw new Error('HoraHasta es obligatoria');
    }
    
    // Validar que el nombre esté presente
    if (!dataToSend.Nombre || dataToSend.Nombre.trim() === '') {
      throw new Error('El nombre del turno es obligatorio');
    }
    
    const response = await api.put(url, dataToSend, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    clearApiCache();
    return response.data;
  },

  /**
   * Elimina un turno (baja lógica)
   */
  eliminarTurno: async (turnoId) => {
    const baseUrl = getApiBaseUrl();
    // Aseguramos que sea número entero
    const id = Number(turnoId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID de turno no válido: ' + JSON.stringify(turnoId));
    }
    // Igual que en usuario: id por query string
    const url = `${baseUrl}/api/turno/baja?id=${id}`;
    try {
      const response = await api.post(url, null, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Activa un turno (dar de alta)
   */
  activarTurno: async (turnoId) => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/turno/activar?id=${turnoId}`;
    try {
      const response = await api.post(url, null, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      clearApiCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

