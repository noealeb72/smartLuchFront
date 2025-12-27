import api, { clearApiCache } from './apiClient';
import { getApiBaseUrl } from './configService';
import axios from 'axios';

/**
 * Servicio de platos
 */
export const platosService = {
  /**
   * Obtiene lista paginada de platos
   * (ANTES: getPlatosLista)
   */
  obtenerPlatosLista: async (
    pagina = 1,
    tamanioPagina = 10,
    textoBusqueda = '',
    soloActivos = true
  ) => {
    const baseUrl = getApiBaseUrl();

    const params = {
      page: pagina,
      pageSize: tamanioPagina,
      activo: soloActivos,
    };

    if (textoBusqueda && textoBusqueda.trim()) {
      params.search = textoBusqueda.trim();
    }

    const response = await api.get(`${baseUrl}/api/plato/lista`, { params });
    // Estructura esperada: { page, pageSize, totalItems, totalPages, items }
    return response.data;
  },

  /**
   * Obtiene un plato por su ID
   */
  obtenerPlatoPorId: async (id) => {
    const baseUrl = getApiBaseUrl();
    const platoId = Number(id);

    if (!Number.isInteger(platoId) || platoId <= 0) {
      throw new Error('ID de plato no válido: ' + JSON.stringify(id));
    }

    const response = await api.get(`${baseUrl}/api/plato/${platoId}`);
    return response.data;
  },

  /**
   * Busca platos por término de búsqueda (para autocompletes, etc.)
   */
  buscarPlatos: async (textoBusqueda = '', soloActivos = true) => {
    const baseUrl = getApiBaseUrl();

    const params = {
      activo: soloActivos,
    };

    if (textoBusqueda && textoBusqueda.trim()) {
      params.search = textoBusqueda.trim();
    }

    const response = await api.get(`${baseUrl}/api/plato/buscar`, { params });
    return response.data;
  },

  /**
   * Crea un nuevo plato
   * POST api/plato/crear
   */
  crearPlato: async (platoData) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };

    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('🚀 [platosService.crearPlato] Creando plato:', platoData);

    const response = await api.post(`${baseUrl}/api/plato/crear`, platoData, {
      headers,
    });

    clearApiCache();
    console.log('✅ [platosService.crearPlato] Plato creado correctamente');

    return response.data;
  },

  /**
   * Actualiza un plato existente
   * PUT api/plato/actualizar
   * El backend espera el DTO completo en el body, incluyendo Id.
   */
  actualizarPlato: async (platoData) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');

    // Asegurar que el ID sea número entero y esté en el DTO
    const id = Number(platoData.Id || platoData.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(
        'ID de plato no válido: ' + JSON.stringify(platoData.Id || platoData.id)
      );
    }

    // Asegurar que el Id esté en el body con la propiedad correcta
    const dtoToSend = {
      ...platoData,
      Id: id,
    };

    const url = `${baseUrl}/api/plato/actualizar`;

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };

    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ [platosService.actualizarPlato] Header Authorization agregado');
    } else {
      console.log(
        '⚠️ [platosService.actualizarPlato] No hay token válido para agregar'
      );
    }

    console.log(
      '📤 [platosService.actualizarPlato] DTO que se envía:',
      dtoToSend
    );
    console.log(
      '📤 [platosService.actualizarPlato] Headers finales:',
      headers
    );

    try {
      const response = await api.put(url, dtoToSend, { headers });

      clearApiCache();
      console.log(
        '✅ [platosService.actualizarPlato] Plato actualizado correctamente'
      );

      return response.data;
    } catch (error) {
      console.error('❌ [platosService.actualizarPlato] Error:', error);

      // Intentar extraer mensaje del backend en castellano
      if (error.response) {
        let errorMessage = error.message || 'Error desconocido';

        if (error.response.data) {
          const data = error.response.data;

          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.Message) {
            errorMessage = data.Message;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.Error) {
            errorMessage = data.Error;
          }
        }

        console.error(
          '❌ [platosService.actualizarPlato] Mensaje de error del backend:',
          errorMessage
        );

        // Adjuntar el mensaje al error para que el componente lo pueda mostrar
        error.backendMessage = errorMessage;
      } else if (error.request) {
        console.error(
          '❌ [platosService.actualizarPlato] No se recibió respuesta del servidor'
        );
        error.backendMessage =
          'No se recibió respuesta del servidor al actualizar el plato.';
      } else {
        console.error(
          '❌ [platosService.actualizarPlato] Error al configurar la petición:',
          error.message
        );
        error.backendMessage =
          'Error al preparar la petición de actualización del plato.';
      }

      throw error;
    }
  },

  /**
   * Da de baja (elimina lógicamente) un plato
   * POST api/plato/baja?id={id}
   */
  eliminarPlato: async (id) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');

    const platoId = Number(id);
    if (!Number.isInteger(platoId) || platoId <= 0) {
      throw new Error('ID de plato no válido: ' + JSON.stringify(id));
    }

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${baseUrl}/api/plato/baja?id=${platoId}`;
    const response = await api.post(url, null, { headers });

    clearApiCache();
    console.log('🗑️ [platosService.eliminarPlato] Plato dado de baja:', platoId);

    return response.data;
  },

  /**
   * Activa un plato dado de baja
   * POST api/plato/activar?id={id}
   */
  activarPlato: async (id) => {
    const baseUrl = getApiBaseUrl();

    const platoId = Number(id);
    if (!Number.isInteger(platoId) || platoId <= 0) {
      throw new Error('ID de plato no válido: ' + JSON.stringify(id));
    }

    const url = `${baseUrl}/api/plato/activar?id=${platoId}`;
    const response = await api.post(url, null, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

    clearApiCache();
    console.log('✅ [platosService.activarPlato] Plato activado:', platoId);

    return response.data;
  },

  /**
   * Sube una foto de plato al servidor
   * El backend guarda el archivo y retorna la ruta relativa
   * POST api/plato/subir-foto
   * @param {File} file - Archivo de imagen a subir
   * @returns {Promise<string>} - Ruta relativa del archivo guardado (ej: "/uploads/platos/ALM01_20251124211549.jpg")
   */
  subirFotoPlato: async (file) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');

    if (!file || !(file instanceof File)) {
      throw new Error('El archivo no es válido');
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file);

    // Preparar headers (NO incluir Content-Type para FormData, el navegador lo hace automáticamente)
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('🚀 [platosService.subirFotoPlato] Subiendo imagen:', {
      nombre: file.name,
      tamaño: file.size,
      tipo: file.type
    });
    console.log('🔑 [platosService.subirFotoPlato] Token disponible:', token ? '✅ Sí' : '❌ No');

    try {
      // Usar axios directamente para FormData (no usar apiClient que podría interferir con Content-Type)
      const response = await axios.post(`${baseUrl}/api/plato/subir-foto`, formData, {
        headers,
        // NO establecer Content-Type - el navegador lo hace automáticamente para FormData con boundary
        timeout: 60000, // 60 segundos para archivos grandes
      });

      console.log('📋 [platosService.subirFotoPlato] Respuesta completa del backend:', response.data);
      console.log('📋 [platosService.subirFotoPlato] Tipo de respuesta:', typeof response.data);
      console.log('📋 [platosService.subirFotoPlato] Claves de response.data:', response.data ? Object.keys(response.data) : 'No hay data');
      
      // El backend puede retornar diferentes formatos:
      // { path: "/uploads/platos/...", url: "..." }
      // { ruta: "/uploads/platos/..." }
      // { Path: "/uploads/platos/...", Url: "..." }
      // O directamente la ruta como string
      let rutaArchivo = null;
      
      if (typeof response.data === 'string') {
        // Si la respuesta es directamente un string (la ruta)
        rutaArchivo = response.data;
        console.log('✅ [platosService.subirFotoPlato] Respuesta es string directo:', rutaArchivo);
      } else if (response.data && typeof response.data === 'object') {
        // Buscar la ruta en diferentes campos posibles
        rutaArchivo = response.data.path || 
                     response.data.Path || 
                     response.data.ruta || 
                     response.data.Ruta ||
                     response.data.url || 
                     response.data.Url ||
                     response.data.rutaArchivo ||
                     response.data.RutaArchivo ||
                     null;
        
        console.log('✅ [platosService.subirFotoPlato] Ruta encontrada en objeto:', rutaArchivo);
      }
      
      if (!rutaArchivo || (typeof rutaArchivo === 'string' && rutaArchivo.trim() === '')) {
        console.error('❌ [platosService.subirFotoPlato] No se encontró ruta válida en la respuesta');
        console.error('❌ [platosService.subirFotoPlato] Respuesta completa:', JSON.stringify(response.data, null, 2));
        throw new Error('El servidor no devolvió una ruta válida. Respuesta recibida: ' + JSON.stringify(response.data));
      }

      console.log('✅ [platosService.subirFotoPlato] Imagen subida exitosamente, ruta original:', rutaArchivo);
      
      // Asegurar que la ruta comience con /uploads/platos/
      if (typeof rutaArchivo === 'string') {
        // Si la ruta ya es completa, devolverla tal cual
        if (rutaArchivo.startsWith('/uploads/platos/') || rutaArchivo.startsWith('uploads/platos/')) {
          const rutaFinal = rutaArchivo.startsWith('/') ? rutaArchivo : `/${rutaArchivo}`;
          console.log('✅ [platosService.subirFotoPlato] Ruta final (uploads/platos):', rutaFinal);
          return rutaFinal;
        }
        // Si es solo el nombre del archivo, construir la ruta completa
        if (!rutaArchivo.includes('/')) {
          const rutaFinal = `/uploads/platos/${rutaArchivo}`;
          console.log('✅ [platosService.subirFotoPlato] Ruta final (solo nombre archivo):', rutaFinal);
          return rutaFinal;
        }
        // Si es otra ruta, normalizarla
        const rutaFinal = rutaArchivo.startsWith('/') ? rutaArchivo : `/${rutaArchivo}`;
        console.log('✅ [platosService.subirFotoPlato] Ruta final (normalizada):', rutaFinal);
        return rutaFinal;
      }

      console.error('❌ [platosService.subirFotoPlato] La ruta no es un string válido:', rutaArchivo);
      throw new Error('La ruta devuelta por el servidor no es válida: ' + JSON.stringify(rutaArchivo));
    } catch (error) {
      console.error('❌ [platosService.subirFotoPlato] Error al subir imagen:', error);
      
      if (error.response) {
        console.error('❌ [platosService.subirFotoPlato] Status:', error.response.status);
        console.error('❌ [platosService.subirFotoPlato] Datos de error:', error.response.data);
        
        const errorMessage = error.response.data?.message || 
                            error.response.data?.Message || 
                            `Error del servidor (${error.response.status})`;
        const customError = new Error(errorMessage);
        customError.response = error.response;
        throw customError;
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
        const customError = new Error(
          'Error CORS: El backend no permite peticiones desde este origen. ' +
          'Verifica que el endpoint /api/plato/subir-foto exista y tenga CORS configurado correctamente.'
        );
        customError.code = error.code;
        customError.isCorsError = true;
        throw customError;
      }
      
      throw error;
    }
  },

  /**
   * Elimina una foto de plato del servidor
   * DELETE api/plato/eliminar-foto
   * @param {string} rutaFoto - Ruta relativa de la foto a eliminar (ej: "/uploads/platos/imagen.jpg")
   * @returns {Promise<void>}
   */
  eliminarFotoPlato: async (rutaFoto) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');

    if (!rutaFoto || typeof rutaFoto !== 'string' || rutaFoto.trim() === '') {
      console.warn('⚠️ [platosService.eliminarFotoPlato] Ruta de foto no válida:', rutaFoto);
      return;
    }

    // Normalizar la ruta: extraer solo el nombre del archivo o la ruta relativa
    let rutaNormalizada = rutaFoto.trim();
    
    // Si es una URL completa, extraer la ruta relativa
    if (rutaNormalizada.startsWith('http://') || rutaNormalizada.startsWith('https://')) {
      const baseUrlMatch = rutaNormalizada.indexOf(baseUrl);
      if (baseUrlMatch !== -1) {
        rutaNormalizada = rutaNormalizada.substring(baseUrlMatch + baseUrl.length);
      } else {
        console.warn('⚠️ [platosService.eliminarFotoPlato] URL no corresponde al backend:', rutaNormalizada);
        return;
      }
    }

    // Si contiene 'uploads/platos/', extraer la parte relativa
    if (rutaNormalizada.includes('uploads/platos/')) {
      const indiceUploads = rutaNormalizada.indexOf('uploads/platos/');
      rutaNormalizada = rutaNormalizada.substring(indiceUploads);
      if (!rutaNormalizada.startsWith('/')) {
        rutaNormalizada = `/${rutaNormalizada}`;
      }
    }

    // Si es una ruta absoluta del sistema, extraer solo el nombre del archivo
    if (rutaNormalizada.includes('\\') || (rutaNormalizada.includes('/') && (rutaNormalizada.includes('C:') || rutaNormalizada.includes('D:')))) {
      const nombreArchivo = rutaNormalizada.split('\\').pop().split('/').pop();
      rutaNormalizada = `/uploads/platos/${nombreArchivo}`;
    }

    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('🗑️ [platosService.eliminarFotoPlato] Eliminando foto:', rutaNormalizada);

    try {
      const response = await api.delete(`${baseUrl}/api/plato/eliminar-foto`, {
        headers,
        data: { ruta: rutaNormalizada },
      });

      console.log('✅ [platosService.eliminarFotoPlato] Foto eliminada exitosamente:', rutaNormalizada);
      return response.data;
    } catch (error) {
      console.error('❌ [platosService.eliminarFotoPlato] Error al eliminar foto:', error);
      
      // No lanzar error si el archivo no existe (404) o ya fue eliminado
      if (error.response && error.response.status === 404) {
        console.warn('⚠️ [platosService.eliminarFotoPlato] El archivo no existe o ya fue eliminado');
        return;
      }
      
      // Para otros errores, solo loguear pero no bloquear el flujo
      console.warn('⚠️ [platosService.eliminarFotoPlato] No se pudo eliminar el archivo, pero se continúa con el proceso');
    }
  },
};
