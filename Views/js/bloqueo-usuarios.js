// Controlador para la página de bloqueo de usuarios
var app = angular.module('AngujarJS', []);

app.controller('BloqueoUsuarios', function ($scope, $http, $window) {
    // Usar la variable de configuración global API_BASE_URL
    var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
    
    // Configuración del usuario
    $scope.user_Rol = localStorage.getItem('role');
    $scope.user_Nombre = localStorage.getItem('nombre');
    $scope.user_Apellido = localStorage.getItem('apellido');
    
    // Fecha y hora para el navbar
    $scope.currentDateTime = new Date().toLocaleString('es-AR');
    setInterval(function() {
        $scope.currentDateTime = new Date().toLocaleString('es-AR');
        if (!$scope.$$phase) { $scope.$apply(); }
    }, 1000);
    
    // Estado de carga
    $scope.isLoading = false;
    
    // Tipos de usuarios con sus descripciones
    $scope.tiposUsuarios = [
        {
            tipo: 'Admin',
            descripcion: 'Administradores del sistema',
            bloqueado: false
        },
        {
            tipo: 'Cocina',
            descripcion: 'Personal de cocina',
            bloqueado: false
        },
        {
            tipo: 'Comensal',
            descripcion: 'Usuarios comensales',
            bloqueado: false
        },
        {
            tipo: 'Gerencia',
            descripcion: 'Personal de gerencia',
            bloqueado: false
        }
    ];
    
    // Cargar estados de bloqueo desde config.js o localStorage
    $scope.cargarEstadosBloqueo = function() {
        var estados = {};
        
        if (typeof BloqueoUsuariosService !== 'undefined') {
            estados = BloqueoUsuariosService.getAllEstadosBloqueo();
        } else {
            // Fallback: leer de localStorage primero, luego de config.js
            try {
                var bloqueos = localStorage.getItem('bloqueo_usuarios');
                if (bloqueos) {
                    estados = JSON.parse(bloqueos);
                } else if (typeof BLOQUEO_USUARIOS !== 'undefined' && BLOQUEO_USUARIOS) {
                    // Si no hay localStorage, usar config.js
                    estados = JSON.parse(JSON.stringify(BLOQUEO_USUARIOS));
                }
            } catch (e) {
                console.error('Error al cargar estados de bloqueo:', e);
                // En caso de error, usar config.js si está disponible
                if (typeof BLOQUEO_USUARIOS !== 'undefined' && BLOQUEO_USUARIOS) {
                    estados = JSON.parse(JSON.stringify(BLOQUEO_USUARIOS));
                }
            }
        }
        
        // Actualizar estados en tiposUsuarios
        $scope.tiposUsuarios.forEach(function(tipoUsuario) {
            if (estados.hasOwnProperty(tipoUsuario.tipo)) {
                tipoUsuario.bloqueado = estados[tipoUsuario.tipo] === true;
            } else {
                // Si no está definido, usar false por defecto
                tipoUsuario.bloqueado = false;
            }
        });
    };
    
    // Cambiar estado de bloqueo
    $scope.cambiarEstadoBloqueo = function(tipoUsuario) {
        $scope.isLoading = true;
        
        // Guardar estado en localStorage
        var guardado = false;
        
        if (typeof BloqueoUsuariosService !== 'undefined') {
            guardado = BloqueoUsuariosService.setEstadoBloqueo(tipoUsuario.tipo, tipoUsuario.bloqueado);
        } else {
            // Fallback: guardar directamente en localStorage
            try {
                var bloqueos = localStorage.getItem('bloqueo_usuarios');
                var bloqueosObj = {};
                
                if (bloqueos) {
                    bloqueosObj = JSON.parse(bloqueos);
                }
                
                bloqueosObj[tipoUsuario.tipo] = tipoUsuario.bloqueado === true;
                localStorage.setItem('bloqueo_usuarios', JSON.stringify(bloqueosObj));
                guardado = true;
            } catch (e) {
                console.error('Error al guardar estado de bloqueo:', e);
                guardado = false;
            }
        }
        
        $scope.isLoading = false;
        
        if (guardado) {
            var mensaje = tipoUsuario.bloqueado 
                ? 'El acceso para usuarios de tipo "' + tipoUsuario.tipo + '" ha sido bloqueado.'
                : 'El acceso para usuarios de tipo "' + tipoUsuario.tipo + '" ha sido desbloqueado.';
            
            Swal.fire({
                title: tipoUsuario.bloqueado ? '🚫 Usuario Bloqueado' : '✅ Usuario Desbloqueado',
                text: mensaje,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#343A40',
                timer: 2000,
                timerProgressBar: true
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar el estado de bloqueo. Por favor, intente nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#343A40'
            });
            
            // Revertir cambio
            tipoUsuario.bloqueado = !tipoUsuario.bloqueado;
        }
    };
    
    // Inicializar: cargar estados al iniciar
    $scope.cargarEstadosBloqueo();
});

