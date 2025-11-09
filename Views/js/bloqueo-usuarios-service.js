// Servicio para manejar el bloqueo de usuarios por tipo
var BloqueoUsuariosService = {
    // Obtener estado de bloqueo de un tipo de usuario
    // Prioridad: 1) localStorage (cambios dinámicos), 2) config.js (configuración inicial)
    getEstadoBloqueo: function(tipoUsuario) {
        try {
            // Normalizar el tipo de usuario (trim, capitalizar primera letra)
            var tipoUsuarioNormalizado = (tipoUsuario || '').toString().trim();
            tipoUsuarioNormalizado = tipoUsuarioNormalizado.charAt(0).toUpperCase() + tipoUsuarioNormalizado.slice(1).toLowerCase();
            
            console.log('BloqueoUsuariosService.getEstadoBloqueo - tipoUsuario:', tipoUsuario);
            console.log('BloqueoUsuariosService.getEstadoBloqueo - tipoUsuarioNormalizado:', tipoUsuarioNormalizado);
            
            // Primero verificar localStorage (cambios dinámicos)
            var bloqueos = localStorage.getItem('bloqueo_usuarios');
            if (bloqueos) {
                var bloqueosObj = JSON.parse(bloqueos);
                console.log('BloqueoUsuariosService - bloqueos en localStorage:', bloqueosObj);
                // Buscar con normalización
                for (var key in bloqueosObj) {
                    var keyNormalizado = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                    if (keyNormalizado === tipoUsuarioNormalizado) {
                        var resultado = bloqueosObj[key] === true;
                        console.log('BloqueoUsuariosService - encontrado en localStorage:', key, '=', resultado);
                        return resultado;
                    }
                }
            }
            
            // Si no hay en localStorage, usar configuración de config.js con normalización
            if (typeof BLOQUEO_USUARIOS !== 'undefined' && BLOQUEO_USUARIOS) {
                console.log('BloqueoUsuariosService - BLOQUEO_USUARIOS de config.js:', BLOQUEO_USUARIOS);
                for (var key in BLOQUEO_USUARIOS) {
                    var keyNormalizado = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                    if (keyNormalizado === tipoUsuarioNormalizado) {
                        var resultado = BLOQUEO_USUARIOS[key] === true;
                        console.log('BloqueoUsuariosService - encontrado en config.js:', key, '=', resultado);
                        return resultado;
                    }
                }
            }
            
            console.log('BloqueoUsuariosService - no encontrado, retornando false');
            return false; // Por defecto, no está bloqueado
        } catch (e) {
            console.error('Error al obtener estado de bloqueo:', e);
            return false;
        }
    },

    // Establecer estado de bloqueo de un tipo de usuario
    setEstadoBloqueo: function(tipoUsuario, bloqueado) {
        try {
            // Normalizar el tipo de usuario (trim, capitalizar primera letra)
            var tipoUsuarioNormalizado = (tipoUsuario || '').toString().trim();
            tipoUsuarioNormalizado = tipoUsuarioNormalizado.charAt(0).toUpperCase() + tipoUsuarioNormalizado.slice(1).toLowerCase();
            
            var bloqueos = localStorage.getItem('bloqueo_usuarios');
            var bloqueosObj = {};
            
            if (bloqueos) {
                bloqueosObj = JSON.parse(bloqueos);
            }
            
            // Buscar si ya existe una clave con el mismo valor normalizado
            var claveExistente = null;
            for (var key in bloqueosObj) {
                var keyNormalizado = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                if (keyNormalizado === tipoUsuarioNormalizado) {
                    claveExistente = key;
                    break;
                }
            }
            
            // Si existe, usar esa clave; si no, usar la normalizada
            var claveAGuardar = claveExistente || tipoUsuarioNormalizado;
            bloqueosObj[claveAGuardar] = bloqueado === true;
            localStorage.setItem('bloqueo_usuarios', JSON.stringify(bloqueosObj));
            return true;
        } catch (e) {
            console.error('Error al establecer estado de bloqueo:', e);
            return false;
        }
    },

    // Obtener todos los estados de bloqueo
    // Prioridad: 1) localStorage (cambios dinámicos), 2) config.js (configuración inicial)
    getAllEstadosBloqueo: function() {
        try {
            var bloqueos = {};
            var bloqueosLocalStorage = null;
            
            // Primero intentar leer de localStorage (cambios dinámicos)
            try {
                var bloqueosStr = localStorage.getItem('bloqueo_usuarios');
                if (bloqueosStr) {
                    bloqueosLocalStorage = JSON.parse(bloqueosStr);
                }
            } catch (e) {
                console.warn('Error al leer localStorage:', e);
            }
            
            // Usar configuración de config.js como base
            if (typeof BLOQUEO_USUARIOS !== 'undefined' && BLOQUEO_USUARIOS) {
                bloqueos = JSON.parse(JSON.stringify(BLOQUEO_USUARIOS)); // Copia profunda
            } else {
                // Si no hay config.js, usar valores por defecto
                bloqueos = {
                    'Admin': false,
                    'Cocina': false,
                    'Comensal': false,
                    'Gerencia': false
                };
            }
            
            // Sobrescribir con valores de localStorage si existen (cambios dinámicos tienen prioridad)
            if (bloqueosLocalStorage) {
                Object.keys(bloqueosLocalStorage).forEach(function(key) {
                    bloqueos[key] = bloqueosLocalStorage[key];
                });
            }
            
            return bloqueos;
        } catch (e) {
            console.error('Error al obtener todos los estados de bloqueo:', e);
            return {
                'Admin': false,
                'Cocina': false,
                'Comensal': false,
                'Gerencia': false
            };
        }
    },

    // Verificar si un tipo de usuario está bloqueado
    estaBloqueado: function(tipoUsuario) {
        return this.getEstadoBloqueo(tipoUsuario);
    }
};

