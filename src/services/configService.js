// Servicio de configuración
let appConfig = null;

/**
 * Configuración por defecto
 */
const defaultConfig = {
  apiBaseUrl: 'http://localhost:8000',
  totemId: 'T001',
  bloqueos: {
    Admin: false,
    Cocina: false,
    Comensal: false,
    Gerencia: false
  }
};

/**
 * Genera el archivo config.json con valores por defecto
 * Nota: En el navegador no podemos escribir archivos directamente,
 * pero podemos mostrar un mensaje al usuario
 */
const generateDefaultConfig = () => {
  console.warn('⚠️ Archivo config.json no encontrado. Usando valores por defecto.');
  console.warn('📝 Por favor, crea el archivo public/config.json con la siguiente estructura:');
  console.log(JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
};

/**
 * Valida que la configuración tenga la estructura correcta
 */
const validateConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Validar apiBaseUrl
  if (!config.apiBaseUrl || typeof config.apiBaseUrl !== 'string') {
    return false;
  }

  // Validar totemId
  if (!config.totemId || typeof config.totemId !== 'string') {
    return false;
  }

  // Validar bloqueos
  if (!config.bloqueos || typeof config.bloqueos !== 'object') {
    return false;
  }

  const roles = ['Admin', 'Cocina', 'Comensal', 'Gerencia'];
  for (const role of roles) {
    if (typeof config.bloqueos[role] !== 'boolean') {
      return false;
    }
  }

  return true;
};

/**
 * Normaliza la configuración, completando valores faltantes con los por defecto
 */
const normalizeConfig = (config) => {
  return {
    apiBaseUrl: config.apiBaseUrl || defaultConfig.apiBaseUrl,
    totemId: config.totemId || defaultConfig.totemId,
    bloqueos: {
      Admin: config.bloqueos?.Admin ?? defaultConfig.bloqueos.Admin,
      Cocina: config.bloqueos?.Cocina ?? defaultConfig.bloqueos.Cocina,
      Comensal: config.bloqueos?.Comensal ?? defaultConfig.bloqueos.Comensal,
      Gerencia: config.bloqueos?.Gerencia ?? defaultConfig.bloqueos.Gerencia,
    }
  };
};

/**
 * Carga la configuración desde /config.json
 * SIEMPRE lee del archivo, no usa caché
 * Si el archivo no existe, usa valores por defecto
 * Siempre valida que el archivo exista antes de usarlo
 */
/**
 * Carga la configuración desde /config.json (public/config.json)
 * 
 * IMPORTANTE: Este sistema SIEMPRE lee la configuración del archivo public/config.json
 * No usa localStorage, no usa variables de entorno como prioridad.
 * Si el archivo no existe, usa valores por defecto y muestra un warning.
 * 
 * @param {boolean} forceReload - Si es true, fuerza la recarga del archivo ignorando caché
 * @returns {Promise<Object>} Configuración cargada
 */
export async function loadConfig(forceReload = false) {
  // Si ya está cargada y no se fuerza recarga, retornar la misma instancia
  // PERO: en el primer load siempre lee del archivo
  if (appConfig && !forceReload) {
    return appConfig;
  }

  try {
    // Intentar cargar el archivo config.json
    // Agregar timestamp para evitar caché del navegador
    const timestamp = new Date().getTime();
    const response = await fetch(`/config.json?t=${timestamp}`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      // Si el archivo no existe (404) o hay otro error, usar valores por defecto
      if (response.status === 404) {
        console.error('❌ Archivo /config.json no encontrado (404)');
        console.warn('⚠️ El archivo public/config.json debe existir. Usando valores por defecto.');
        appConfig = generateDefaultConfig();
        return appConfig;
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }

    // Parsear el JSON
    const rawConfig = await response.json();

    // Validar la estructura
    if (!validateConfig(rawConfig)) {
      console.error('❌ El archivo config.json tiene una estructura inválida.');
      console.warn('⚠️ Verifica que tenga: apiBaseUrl, totemId y bloqueos (Admin, Cocina, Comensal, Gerencia)');
      // Intentar normalizar, pero advertir
      appConfig = normalizeConfig(rawConfig);
      console.warn('⚠️ Configuración normalizada con valores por defecto donde faltaban datos.');
    } else {
      // Configuración válida, normalizar para asegurar que todos los campos estén presentes
      appConfig = normalizeConfig(rawConfig);
    }

    console.log('✅ Configuración cargada desde /config.json (public/config.json):', {
      apiBaseUrl: appConfig.apiBaseUrl,
      totemId: appConfig.totemId,
      bloqueos: appConfig.bloqueos,
      fuente: 'public/config.json'
    });

    return appConfig;

  } catch (error) {
    console.error('❌ Error cargando config.json:', error);
    console.error('❌ Detalles del error:', error.message);
    
    // Si hay un error de red o parsing, usar valores por defecto
    console.warn('⚠️ Usando configuración por defecto debido al error');
    console.warn('📝 Asegúrate de que el archivo public/config.json exista y sea válido');
    appConfig = generateDefaultConfig();
    return appConfig;
  }
}

/**
 * Obtiene la configuración actual (sincrónico)
 * Retorna null si aún no se ha cargado
 */
export function getConfig() {
  return appConfig;
}

/**
 * Recarga la configuración desde el archivo
 * Fuerza la lectura del archivo, ignorando cualquier caché
 */
export async function reloadConfig() {
  appConfig = null;
  return await loadConfig(true);
}

/**
 * Obtiene la URL base de la API
 * SIEMPRE usa la configuración del archivo, nunca valores por defecto si el archivo está cargado
 */
export function getApiBaseUrl() {
  if (!appConfig) {
    console.warn('⚠️ Configuración no cargada aún. Usando valor por defecto temporal.');
    return defaultConfig.apiBaseUrl;
  }
  return appConfig.apiBaseUrl;
}

/**
 * Obtiene el ID del totem
 * SIEMPRE usa la configuración del archivo, nunca valores por defecto si el archivo está cargado
 */
export function getTotemId() {
  if (!appConfig) {
    console.warn('⚠️ Configuración no cargada aún. Usando valor por defecto temporal.');
    return defaultConfig.totemId;
  }
  return appConfig.totemId;
}

/**
 * Obtiene los bloqueos de usuarios
 * SIEMPRE usa la configuración del archivo, nunca valores por defecto si el archivo está cargado
 */
export function getBloqueos() {
  if (!appConfig) {
    console.warn('⚠️ Configuración no cargada aún. Usando valores por defecto temporales.');
    return defaultConfig.bloqueos;
  }
  return appConfig.bloqueos;
}

/**
 * Verifica si un rol está bloqueado
 */
export function isRolBloqueado(rol) {
  const bloqueos = getBloqueos();
  return bloqueos[rol] === true;
}
