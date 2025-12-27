/**
 * Utilidades para guardar archivos físicamente en public/uploads/platos/ del proyecto frontend
 * Usa File System Access API para guardar directamente en el sistema de archivos
 */

// Variable para guardar el handle del directorio (persistencia entre sesiones)
let directoryHandle = null;
const STORAGE_KEY = 'platos_directory_handle';

/**
 * Guarda un archivo en la carpeta public/uploads/platos/ del proyecto
 * @param {File} file - Archivo a guardar
 * @param {string} nombreArchivo - Nombre del archivo (ej: "ALM01_20251124211549.jpg")
 * @returns {Promise<string>} - Ruta relativa del archivo guardado (ej: "/uploads/platos/ALM01_20251124211549.jpg")
 */
export const guardarArchivoEnCarpeta = async (file, nombreArchivo) => {
  const rutaEsperada = `/uploads/platos/${nombreArchivo}`;
  
  // Verificar si el navegador soporta File System Access API
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Tu navegador no soporta guardar archivos directamente. Usa Chrome o Edge (versión 86+) para esta funcionalidad.');
  }

  try {
    // Intentar recuperar el handle guardado del localStorage
    const savedHandle = localStorage.getItem(STORAGE_KEY);
    if (savedHandle) {
      try {
        // Intentar usar el handle guardado (puede fallar si el usuario revocó permisos)
        const handleData = JSON.parse(savedHandle);
        // Nota: No podemos serializar directamente el handle, así que pediremos la carpeta cada vez
        // pero guardaremos la ruta para referencia
        console.log('📁 [fileSaveUtils] Intentando usar carpeta previamente seleccionada');
      } catch (e) {
        console.log('⚠️ [fileSaveUtils] No se pudo recuperar handle guardado, se pedirá nuevamente');
      }
    }

    // Si no tenemos un handle válido, pedirle al usuario que seleccione la carpeta
    if (!directoryHandle) {
      console.log('📂 [fileSaveUtils] Solicitando selección de carpeta del proyecto');
      
      // Pedirle al usuario que seleccione la carpeta raíz del proyecto
      directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      console.log('✅ [fileSaveUtils] Carpeta seleccionada, navegando a public/uploads/platos/');
      
      // Navegar a public/uploads/platos/ creando las carpetas si no existen
      try {
        // Buscar/crear la carpeta 'public' (si no existe, se crea)
        let publicHandle;
        try {
          publicHandle = await directoryHandle.getDirectoryHandle('public', { create: false });
          console.log('✅ [fileSaveUtils] Carpeta "public" encontrada');
        } catch {
          // Si no existe 'public', crearla
          console.log('📁 [fileSaveUtils] Carpeta "public" no existe, creándola...');
          publicHandle = await directoryHandle.getDirectoryHandle('public', { create: true });
          console.log('✅ [fileSaveUtils] Carpeta "public" creada exitosamente');
        }
        
        // Buscar/crear la carpeta 'uploads' dentro de 'public' (si no existe, se crea)
        let uploadsHandle;
        try {
          uploadsHandle = await publicHandle.getDirectoryHandle('uploads', { create: false });
          console.log('✅ [fileSaveUtils] Carpeta "uploads" encontrada');
        } catch {
          console.log('📁 [fileSaveUtils] Carpeta "uploads" no existe, creándola...');
          uploadsHandle = await publicHandle.getDirectoryHandle('uploads', { create: true });
          console.log('✅ [fileSaveUtils] Carpeta "uploads" creada exitosamente');
        }
        
        // Buscar/crear la carpeta 'platos' dentro de 'uploads' (si no existe, se crea)
        try {
          directoryHandle = await uploadsHandle.getDirectoryHandle('platos', { create: false });
          console.log('✅ [fileSaveUtils] Carpeta "platos" encontrada');
        } catch {
          console.log('📁 [fileSaveUtils] Carpeta "platos" no existe, creándola...');
          directoryHandle = await uploadsHandle.getDirectoryHandle('platos', { create: true });
          console.log('✅ [fileSaveUtils] Carpeta "platos" creada exitosamente');
        }
        
        console.log('✅ [fileSaveUtils] Estructura completa de carpetas public/uploads/platos/ lista y lista para usar');
      } catch (error) {
        console.error('❌ [fileSaveUtils] Error al navegar/crear carpetas:', error);
        throw new Error(`No se pudo crear/acceder a la carpeta public/uploads/platos/. Error: ${error.message}. Asegúrate de seleccionar la carpeta raíz del proyecto (donde debe estar o crearse la carpeta "public").`);
      }
    }
    
    // Guardar el archivo en el directorio
    console.log('💾 [fileSaveUtils] Guardando archivo:', nombreArchivo);
    const fileHandle = await directoryHandle.getFileHandle(nombreArchivo, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    
    console.log('✅ [fileSaveUtils] Archivo guardado físicamente en public/uploads/platos/', nombreArchivo);
    
    // Retornar la ruta relativa
    return rutaEsperada;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⚠️ [fileSaveUtils] Usuario canceló la selección de carpeta');
      throw new Error('Debes seleccionar la carpeta del proyecto para guardar la imagen. Selecciona la carpeta que contiene la carpeta "public".');
    } else {
      console.error('❌ [fileSaveUtils] Error al guardar archivo:', error);
      directoryHandle = null; // Resetear para volver a pedir
      throw error;
    }
  }
};

/**
 * Genera un nombre único para el archivo basado en el código del plato y timestamp
 * @param {string} codigoPlato - Código del plato (ej: "ALM01")
 * @param {string} nombreOriginal - Nombre original del archivo
 * @returns {string} - Nombre único del archivo (ej: "ALM01_20251124211549.jpg")
 */
export const generarNombreArchivo = (codigoPlato, nombreOriginal) => {
  const extension = nombreOriginal.split('.').pop() || 'jpg';
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '');
  const codigo = codigoPlato || 'PLATO';
  return `${codigo}_${timestamp}.${extension}`;
};

