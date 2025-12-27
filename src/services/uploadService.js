import axios from 'axios';
import { getApiBaseUrl } from './configService';

/**
 * Servicio para subir archivos al servidor
 */
export const uploadService = {
  /**
   * Sube una imagen de plato al servidor
   * El backend guardará el archivo en public/uploads/platos/ del frontend
   * @param {File} file - Archivo de imagen a subir
   * @param {string} folder - Carpeta donde guardar (default: 'platos')
   * @param {string} codigoPlato - Código del plato para generar nombre único (opcional)
   * @returns {Promise<string>} - Ruta relativa del archivo guardado (ej: '/uploads/platos/ALM01_20251124211549.jpg')
   */
  uploadPlatoFoto: async (file, folder = 'platos', codigoPlato = null) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');

    if (!file || !(file instanceof File)) {
      throw new Error('El archivo no es válido');
    }

    // Generar nombre único para el archivo si se proporciona código del plato
    let nombreArchivo = file.name;
    if (codigoPlato) {
      const extension = file.name.split('.').pop() || 'jpg';
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '');
      const codigo = codigoPlato.trim() || 'PLATO';
      nombreArchivo = `${codigo}_${timestamp}.${extension}`;
      console.log('📝 [uploadService] Nombre de archivo generado:', nombreArchivo);
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file, nombreArchivo); // Enviar con el nombre generado
    formData.append('folder', folder);
    if (codigoPlato) {
      formData.append('codigoPlato', codigoPlato);
    }

    // Crear instancia de axios específica para uploads sin headers por defecto
    // Esto permite que el navegador establezca automáticamente el Content-Type con boundary
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // NO establecer Content-Type - el navegador lo hace automáticamente para FormData

    console.log('🚀 [uploadService.uploadPlatoFoto] Subiendo imagen:', {
      nombre: file.name,
      tamaño: file.size,
      tipo: file.type,
      carpeta: folder
    });

    try {
      // Usar axios directamente para evitar interferencia del apiClient
      const response = await axios.post(`${baseUrl}/api/upload/plato`, formData, {
        headers,
        // Axios detecta FormData y NO establece Content-Type, dejando que el navegador lo haga
        timeout: 60000, // 60 segundos para archivos grandes
      });

      const rutaArchivo = response.data?.ruta || response.data?.path || response.data?.url || response.data;
      
      console.log('✅ [uploadService.uploadPlatoFoto] Imagen subida exitosamente:', rutaArchivo);
      
      // Asegurar que la ruta comience con /uploads/platos/
      if (typeof rutaArchivo === 'string') {
        // Si la ruta ya es completa, devolverla tal cual
        if (rutaArchivo.startsWith('/uploads/') || rutaArchivo.startsWith('uploads/')) {
          return rutaArchivo.startsWith('/') ? rutaArchivo : `/${rutaArchivo}`;
        }
        // Si es solo el nombre del archivo, construir la ruta completa
        return `/uploads/${folder}/${rutaArchivo}`;
      }

      throw new Error('El servidor no devolvió una ruta válida');
    } catch (error) {
      console.error('❌ [uploadService.uploadPlatoFoto] Error al subir imagen:', error);
      
      if (error.response) {
        console.error('❌ [uploadService.uploadPlatoFoto] Status:', error.response.status);
        console.error('❌ [uploadService.uploadPlatoFoto] Datos de error:', error.response.data);
        
        // Crear un error más descriptivo
        const errorMessage = error.response.data?.message || 
                            error.response.data?.Message || 
                            `Error del servidor (${error.response.status})`;
        const customError = new Error(errorMessage);
        customError.response = error.response;
        throw customError;
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
        // Error de CORS o conexión
        const customError = new Error(
          'Error CORS: El backend no permite peticiones desde este origen. ' +
          'Verifica que el endpoint /api/upload/plato exista y tenga CORS configurado correctamente.'
        );
        customError.code = error.code;
        customError.isCorsError = true;
        throw customError;
      }
      
      throw error;
    }
  },

  /**
   * Elimina una imagen del servidor
   * @param {string} ruta - Ruta del archivo a eliminar
   * @returns {Promise<void>}
   */
  deletePlatoFoto: async (ruta) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');

    if (!ruta) {
      throw new Error('La ruta del archivo es requerida');
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('🗑️ [uploadService.deletePlatoFoto] Eliminando imagen:', ruta);

    try {
      // Usar axios directamente para mantener consistencia
      await axios.delete(`${baseUrl}/api/upload/plato`, {
        headers,
        data: { ruta },
        timeout: 30000,
      });

      console.log('✅ [uploadService.deletePlatoFoto] Imagen eliminada exitosamente');
    } catch (error) {
      console.error('❌ [uploadService.deletePlatoFoto] Error al eliminar imagen:', error);
      throw error;
    }
  },
};

