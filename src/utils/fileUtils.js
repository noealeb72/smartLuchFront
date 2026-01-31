/**
 * Utilidades para manejo de archivos en el frontend
 */

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

/**
 * Guarda un archivo en IndexedDB (almacenamiento del navegador)
 * @param {File} file - Archivo a guardar
 * @param {string} ruta - Ruta donde se guardará (ej: "/uploads/platos/imagen.jpg")
 * @returns {Promise<string>} - Ruta del archivo guardado
 */
export const guardarArchivoEnIndexedDB = async (file, ruta) => {
  return new Promise((resolve, reject) => {
    // Abrir IndexedDB
    const request = indexedDB.open('SmartLunchFiles', 1);
    
    request.onerror = () => {
      reject(new Error('Error al abrir IndexedDB'));
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          ruta: ruta,
          data: e.target.result, // base64
          tipo: file.type,
          nombre: file.name,
          fecha: new Date().toISOString()
        };
        
        const putRequest = store.put(fileData);
        putRequest.onsuccess = () => {
          resolve(ruta);
        };
        putRequest.onerror = () => {
          reject(new Error('Error al guardar archivo en IndexedDB'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsDataURL(file);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'ruta' });
      }
    };
  });
};

/**
 * Obtiene un archivo de IndexedDB
 * @param {string} ruta - Ruta del archivo
 * @returns {Promise<string|null>} - URL del archivo (base64) o null si no existe
 */
export const obtenerArchivoDeIndexedDB = async (ruta) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SmartLunchFiles', 1);
    
    request.onerror = () => {
      reject(new Error('Error al abrir IndexedDB'));
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const getRequest = store.get(ruta);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result.data); // base64
        } else {
          resolve(null);
        }
      };
      
      getRequest.onerror = () => {
        reject(new Error('Error al obtener archivo de IndexedDB'));
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'ruta' });
      }
    };
  });
};

/**
 * Elimina un archivo de IndexedDB
 * @param {string} ruta - Ruta del archivo a eliminar
 * @returns {Promise<void>}
 */
export const eliminarArchivoDeIndexedDB = async (ruta) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SmartLunchFiles', 1);
    
    request.onerror = () => {
      reject(new Error('Error al abrir IndexedDB'));
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const deleteRequest = store.delete(ruta);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(new Error('Error al eliminar archivo de IndexedDB'));
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'ruta' });
      }
    };
  });
};

