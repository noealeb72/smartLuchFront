// Servicio para manejar el bloqueo de usuarios por tipo
var BloqueoUsuariosService = {
    // Obtener estado de bloqueo de un tipo de usuario
    // Prioridad: 1) localStorage (cambios dinámicos), 2) config.js (configuración inicial)
    getEstadoBloqueo: function(tipoUsuario) {
        try {
            // Primero verificar localStorage (cambios dinámicos)
            var bloqueos = localStorage.getItem('bloqueo_usuarios');
            if (bloqueos) {
                var bloqueosObj = JSON.parse(bloqueos);
                if (bloqueosObj.hasOwnProperty(tipoUsuario)) {
                    return bloqueosObj[tipoUsuario] === true;
                }
            }
            
            // Si no hay en localStorage, usar configuración de config.js
            if (typeof BLOQUEO_USUARIOS !== 'undefined' && BLOQUEO_USUARIOS) {
                return BLOQUEO_USUARIOS[tipoUsuario] === true;
            }
            
            return false; // Por defecto, no está bloqueado
        } catch (e) {
            console.error('Error al obtener estado de bloqueo:', e);
            return false;
        }
    },

    // Establecer estado de bloqueo de un tipo de usuario
    setEstadoBloqueo: function(tipoUsuario, bloqueado) {
        try {
            var bloqueos = localStorage.getItem('bloqueo_usuarios');
            var bloqueosObj = {};
            
            if (bloqueos) {
                bloqueosObj = JSON.parse(bloqueos);
            }
            
            bloqueosObj[tipoUsuario] = bloqueado === true;
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

