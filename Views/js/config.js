// === Configuración centralizada del sistema ===
// Configuración con valores por defecto (se actualizarán desde el servidor)

// Detectar URL base automáticamente
function getBaseUrl() {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    var port = window.location.port;
    
    // Si hay puerto, incluirlo; si no, usar el puerto por defecto según el protocolo
    if (port) {
        return protocol + '//' + hostname + ':' + port;
    } else {
        return protocol + '//' + hostname;
    }
}

// Valores de configuración por defecto (se actualizarán desde el servidor)
var API_BASE_URL = getBaseUrl();
var API_BASE = API_BASE_URL + '/api/';
var BLOQUEO_USUARIOS = {
    'Admin': false,
    'Cocina': false,
    'Comensal': false,
    'Gerencia': false
};

// Cargar configuración desde el servidor (asíncrono para evitar bloqueos)
(function() {
    // No cargar configuración desde el servidor, usar valores por defecto
    // Esto evita el warning de XMLHttpRequest síncrono y bloqueos
    // Los controladores usarán directamente la URL detectada o el puerto 8000
})();

