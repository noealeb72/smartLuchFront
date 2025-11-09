// === login.js ===

var app = angular.module('AngujarJS', []);

app.controller('Login', function ($scope, $http, $window, $location) {
    // --- Config ---
    // Usar la variable de configuración global API_BASE_URL
    var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
    $scope.base = apiBaseUrl + '/api/login/';

    // --- Estado UI ---
    $scope.showError = false;
    $scope.errorMsg = '';
    $scope.isLoading = false;

    // --- Helpers ---
    function showError(msg) {
        $scope.errorMsg = msg || 'Ocurrió un error';
        $scope.showError = true;
        // Solo mostrar el mensaje de error en el formulario, sin popup
    }

    function setItemSafe(k, v) {
        if (v !== null && v !== undefined) {
            try { localStorage.setItem(k, String(v).trim()); } catch (e) { }
        }
    }

    // Ocultar error al tipear nuevamente
    $scope.$watchGroup(['view_username', 'view_password'], function () {
        if ($scope.showError) $scope.showError = false;
    });

    // Validación simple
    $scope.isFormValid = function () {
        var u = ($scope.view_username || '').trim();
        var p = ($scope.view_password || '').trim();
        return u.length > 0 && p.length > 0;
    };

    // Limpiar cualquier sesión previa
    $scope.clearLocal = function () {
        try { $window.localStorage.clear(); } catch (e) { }
    };
    $scope.clearLocal();

    // Login (botón o Enter via ng-submit)
    $scope.logIn = function (evt) {
        if (evt && evt.preventDefault) evt.preventDefault();

        var user = ($scope.view_username || '').trim();
        var pass = ($scope.view_password || '').trim();

        if (!user || !pass) {
            showError('Usuario y contraseña son requeridos');
            return;
        }

        // Activar loading
        $scope.isLoading = true;
        $scope.showError = false; // Ocultar error previo

        $http({
            url: $scope.base + 'Authorize',
            method: 'GET',
            params: { user: user, pass: pass }
        })
            .then(function (response) {
                // Caso: HTTP 200, pero sin usuario válido ⇒ mostrar error
                var ok = response && response.status === 200 &&
                    response.data && Array.isArray(response.data.Usuario) &&
                    response.data.Usuario.length > 0;

                if (!ok) {
                    // Desactivar loading
                    $scope.isLoading = false;
                    
                    var messageError = 'Usuario o contraseña incorrectos';
                    showError(messageError);
                    
                    // Mostrar también SweetAlert (modal completamente cerrable)
                    if (window.Swal && typeof window.Swal.fire === 'function') {
                        window.Swal.fire({
                            title: '⚠️ Error en el Login',
                            text: messageError,
                            icon: 'error',
                            iconHtml: '<i class="fas fa-times-circle" style="color: #F34949; font-size: 3rem;"></i>',
                            confirmButtonText: 'Aceptar',
                            confirmButtonColor: '#F34949',
                            width: '400px',
                            padding: '1.5rem',
                            allowOutsideClick: true,
                            allowEscapeKey: true,
                            allowEnterKey: true,
                            showCloseButton: false,
                            focusConfirm: true,
                            backdrop: true,
                            timerProgressBar: false,
                            didOpen: function() {
                                // Forzar remover clases bloqueantes
                                var html = document.documentElement;
                                var body = document.body;
                                
                                html.classList.remove('swal2-shown', 'swal2-height-auto');
                                body.classList.remove('swal2-shown', 'swal2-height-auto');
                                
                                // Forzar estilos no bloqueantes
                                body.style.overflow = 'auto';
                                body.style.position = 'static';
                                html.style.overflow = 'auto';
                                
                                // Asegurar que clic fuera funcione
                                var backdrop = document.querySelector('.swal2-backdrop-show');
                                if (backdrop) {
                                    backdrop.style.cursor = 'pointer';
                                    backdrop.addEventListener('click', function(e) {
                                        if (e.target === backdrop) {
                                            window.Swal.close();
                                        }
                                    });
                                }
                                
                                // Listener adicional para Escape
                                var escapeHandler = function(e) {
                                    if (e.key === 'Escape' || e.keyCode === 27) {
                                        window.Swal.close();
                                        document.removeEventListener('keydown', escapeHandler);
                                    }
                                };
                                document.addEventListener('keydown', escapeHandler);
                            },
                            willClose: function() {
                                // Limpiar todo al cerrar
                                var html = document.documentElement;
                                var body = document.body;
                                
                                html.classList.remove('swal2-shown', 'swal2-height-auto');
                                body.classList.remove('swal2-shown', 'swal2-height-auto');
                                body.style.overflow = '';
                                body.style.position = '';
                                html.style.overflow = '';
                            }
                        }).then(function(result) {
                            // Limpiar después de cerrar
                            var html = document.documentElement;
                            var body = document.body;
                            html.classList.remove('swal2-shown', 'swal2-height-auto');
                            body.classList.remove('swal2-shown', 'swal2-height-auto');
                            body.style.overflow = '';
                            body.style.position = '';
                            html.style.overflow = '';
                        });
                    }
                    return;
                }

                // Éxito
                var usuario = response.data.Usuario[0];
                var smarTime = response.data.smarTime;
                var usuarioSmatTime = response.data.usuarioSmatTime;

                // Verificar si el tipo de usuario está bloqueado
                // Normalizar el tipo de usuario (trim, capitalizar primera letra)
                var tipoUsuarioRaw = (usuario.perfil || '').toString().trim();
                var tipoUsuario = tipoUsuarioRaw.charAt(0).toUpperCase() + tipoUsuarioRaw.slice(1).toLowerCase();
                var estaBloqueado = false;
                
                // Debug: ver qué valor llega
               /* console.log('=== DEBUG BLOQUEO USUARIOS ===');
                console.log('usuario.perfil (raw):', usuario.perfil);
                console.log('tipoUsuarioRaw:', tipoUsuarioRaw);
                console.log('tipoUsuario (normalizado):', tipoUsuario);
                console.log('BLOQUEO_USUARIOS:', typeof BLOQUEO_USUARIOS !== 'undefined' ? BLOQUEO_USUARIOS : 'NO DEFINIDO');
                console.log('BloqueoUsuariosService:', typeof BloqueoUsuariosService !== 'undefined' ? 'DEFINIDO' : 'NO DEFINIDO');*/
                
                // Verificar bloqueo usando el servicio
                if (typeof BloqueoUsuariosService !== 'undefined') {
                    estaBloqueado = BloqueoUsuariosService.estaBloqueado(tipoUsuario);
                    //console.log('Resultado de BloqueoUsuariosService.estaBloqueado:', estaBloqueado);
                } else {
                    // Fallback: verificar en localStorage primero, luego en config.js
                    try {
                        var bloqueos = localStorage.getItem('bloqueo_usuarios');
                        if (bloqueos) {
                            var bloqueosObj = JSON.parse(bloqueos);
                            // Buscar con normalización
                            var encontrado = false;
                            for (var key in bloqueosObj) {
                                var keyNormalizado = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                                if (keyNormalizado === tipoUsuario) {
                                    estaBloqueado = bloqueosObj[key] === true;
                                    encontrado = true;
                                    break;
                                }
                            }
                            if (!encontrado && typeof BLOQUEO_USUARIOS !== 'undefined' && BLOQUEO_USUARIOS) {
                                // Si no está en localStorage, buscar en config.js con normalización
                                for (var key in BLOQUEO_USUARIOS) {
                                    var keyNormalizado = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                                    if (keyNormalizado === tipoUsuario) {
                                        estaBloqueado = BLOQUEO_USUARIOS[key] === true;
                                        break;
                                    }
                                }
                            }
                        } else if (typeof BLOQUEO_USUARIOS !== 'undefined' && BLOQUEO_USUARIOS) {
                            // Si no hay localStorage, buscar en config.js directamente con normalización
                            for (var key in BLOQUEO_USUARIOS) {
                                var keyNormalizado = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                                if (keyNormalizado === tipoUsuario) {
                                    estaBloqueado = BLOQUEO_USUARIOS[key] === true;
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error al verificar bloqueo:', e);
                    }
                }
                
                //console.log('estaBloqueado (final):', estaBloqueado);

                // Si el tipo de usuario está bloqueado, no permitir el login
                if (estaBloqueado) {
                    $scope.isLoading = false;
                    
                    var messageError = 'El acceso para usuarios de tipo "' + tipoUsuario + '" está bloqueado. Por favor, contacte al administrador.';
                    showError(messageError);
                    
                    // Mostrar SweetAlert
                    if (window.Swal && typeof window.Swal.fire === 'function') {
                        window.Swal.fire({
                            title: 'Acceso Bloqueado',
                            text: messageError,
                            icon: 'error',
                            iconHtml: '<i class="fas fa-ban" style="color: #F34949; font-size: 3rem;"></i>',
                            confirmButtonText: 'Aceptar',
                            confirmButtonColor: '#F34949',
                            width: '450px',
                            padding: '1.5rem',
                            allowOutsideClick: true,
                            allowEscapeKey: true,
                            allowEnterKey: true,
                            showCloseButton: false,
                            focusConfirm: true,
                            backdrop: true,
                            timerProgressBar: false,
                            didOpen: function() {
                                var html = document.documentElement;
                                var body = document.body;
                                
                                html.classList.remove('swal2-shown', 'swal2-height-auto');
                                body.classList.remove('swal2-shown', 'swal2-height-auto');
                                
                                body.style.overflow = 'auto';
                                body.style.position = 'static';
                                html.style.overflow = 'auto';
                                
                                var backdrop = document.querySelector('.swal2-backdrop-show');
                                if (backdrop) {
                                    backdrop.style.cursor = 'pointer';
                                    backdrop.addEventListener('click', function(e) {
                                        if (e.target === backdrop) {
                                            window.Swal.close();
                                        }
                                    });
                                }
                                
                                var escapeHandler = function(e) {
                                    if (e.key === 'Escape' || e.keyCode === 27) {
                                        window.Swal.close();
                                        document.removeEventListener('keydown', escapeHandler);
                                    }
                                };
                                document.addEventListener('keydown', escapeHandler);
                            },
                            willClose: function() {
                                var html = document.documentElement;
                                var body = document.body;
                                
                                html.classList.remove('swal2-shown', 'swal2-height-auto');
                                body.classList.remove('swal2-shown', 'swal2-height-auto');
                                body.style.overflow = '';
                                body.style.position = '';
                                html.style.overflow = '';
                            }
                        }).then(function(result) {
                            var html = document.documentElement;
                            var body = document.body;
                            html.classList.remove('swal2-shown', 'swal2-height-auto');
                            body.classList.remove('swal2-shown', 'swal2-height-auto');
                            body.style.overflow = '';
                            body.style.position = '';
                            html.style.overflow = '';
                        });
                    }
                    return;
                }

                setItemSafe('id', usuario.id);
                setItemSafe('nombre', usuario.nombre);
                setItemSafe('apellido', usuario.apellido);
                setItemSafe('legajo', usuario.legajo);
                setItemSafe('role', usuario.perfil);
                setItemSafe('cuil', usuario.cuil);
                setItemSafe('plannutricional', usuario.plannutricional);
                setItemSafe('planta', usuario.planta);
                setItemSafe('dni', usuario.dni);
                setItemSafe('domicilio', usuario.domicilio);
                setItemSafe('fechaingreso', usuario.fechaingreso);
                setItemSafe('contrato', usuario.contrato);
                setItemSafe('foto', usuario.foto);
                setItemSafe('user', usuario.user);
                setItemSafe('password', usuario.password);
                setItemSafe('proyecto', usuario.proyecto);
                setItemSafe('centrodecosto', usuario.centrodecosto);
                setItemSafe('bonificacion', usuario.bonificaciones);
                setItemSafe('bonificacion_invitado', usuario.bonificaciones_invitado);

                try {
                    localStorage.setItem('smarTime', smarTime);
                    localStorage.setItem('usuarioSmatTime', usuarioSmatTime);
                } catch (e) { }

                // Redirección por rol
                // El loading se mantiene hasta que se complete la redirección
                // pero lo desactivamos aquí para que si hay algún delay se vea que terminó
                $scope.isLoading = false;
                
                if (usuario.perfil === 'Cocina') {
                    $window.location.href = 'http://localhost:4200/Views/despacho.html';
                } else {
                    $window.location.href = 'http://localhost:4200/Views/index.html';
                }
            })
            .catch(function (error) {
                // Desactivar loading en caso de error
                $scope.isLoading = false;
                
                // Mensaje por status
                var message = 'Error de comunicación con el servidor';
                var icon = 'error';
                
                if (error) {
                    if (error.status === 400) {
                        message = 'Usuario o contraseña incorrectos';
                        icon = 'warning';
                    } else if (error.status === 401) {
                        message = 'Acceso no autorizado';
                        icon = 'warning';
                    } else if (error.status === 500) {
                        message = 'Error del servidor';
                        icon = 'error';
                    } else if (error.status === 0 || error.status === -1) {
                        // CORS o backend no corriendo
                        message = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
                        icon = 'error';
                    } else if (error.data && error.data.Message) {
                        message = error.data.Message;
                    } else if (error.statusText) {
                        message = error.statusText;
                    }
                }
                
                // Mostrar el error en el formulario
                showError(message);
                
                // Mostrar también SweetAlert (modal completamente cerrable)
                if (window.Swal && typeof window.Swal.fire === 'function') {
                    window.Swal.fire({
                        title: '⚠️ Error en el Login',
                        text: message,
                        icon: icon,
                        iconHtml: '<i class="fas fa-times-circle" style="color: #dc3545; font-size: 3rem;"></i>',
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#343A40',
                        width: '400px',
                        padding: '1.5rem',
                        allowOutsideClick: true,
                        allowEscapeKey: true,
                        allowEnterKey: true,
                        showCloseButton: false,
                        focusConfirm: true,
                        backdrop: true,
                        timerProgressBar: false,
                        didOpen: function() {
                            // Forzar remover clases bloqueantes
                            var html = document.documentElement;
                            var body = document.body;
                            
                            html.classList.remove('swal2-shown', 'swal2-height-auto');
                            body.classList.remove('swal2-shown', 'swal2-height-auto');
                            
                            // Forzar estilos no bloqueantes
                            body.style.overflow = 'auto';
                            body.style.position = 'static';
                            html.style.overflow = 'auto';
                            
                            // Asegurar que clic fuera funcione
                            var backdrop = document.querySelector('.swal2-backdrop-show');
                            if (backdrop) {
                                backdrop.style.cursor = 'pointer';
                                backdrop.addEventListener('click', function(e) {
                                    if (e.target === backdrop) {
                                        window.Swal.close();
                                    }
                                });
                            }
                            
                            // Listener adicional para Escape
                            var escapeHandler = function(e) {
                                if (e.key === 'Escape' || e.keyCode === 27) {
                                    window.Swal.close();
                                    document.removeEventListener('keydown', escapeHandler);
                                }
                            };
                            document.addEventListener('keydown', escapeHandler);
                        },
                        willClose: function() {
                            // Limpiar todo al cerrar
                            var html = document.documentElement;
                            var body = document.body;
                            
                            html.classList.remove('swal2-shown', 'swal2-height-auto');
                            body.classList.remove('swal2-shown', 'swal2-height-auto');
                            body.style.overflow = '';
                            body.style.position = '';
                            html.style.overflow = '';
                        }
                    }).then(function(result) {
                        // Limpiar después de cerrar
                        var html = document.documentElement;
                        var body = document.body;
                        html.classList.remove('swal2-shown', 'swal2-height-auto');
                        body.classList.remove('swal2-shown', 'swal2-height-auto');
                        body.style.overflow = '';
                        body.style.position = '';
                        html.style.overflow = '';
                    });
                } else {
                    // Fallback si SweetAlert2 no está disponible
                    alert('Error: ' + message);
                }
            });
    };
});
