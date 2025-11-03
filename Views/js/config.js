// === Configuración centralizada del sistema ===
// URL base del backend API
var API_BASE_URL = 'http://localhost:8000';

// URL completa para las APIs
var API_BASE = API_BASE_URL + '/api/';

// === Configuración de Bloqueo de Usuarios ===
// Define qué tipos de usuarios están bloqueados (no pueden acceder al sistema)
// Valores posibles: true (bloqueado) o false (desbloqueado)
var BLOQUEO_USUARIOS = {
    'Admin': false,      // Administradores
    'Cocina': false,     // Personal de cocina
    'Comensal': true,    // Usuarios comensales ← BLOQUEADO
    'Gerencia': false    // Personal de gerencia
};

