// === login.js ===

var app = angular.module('AngujarJS', []);

app.controller('Login', function ($scope, $http, $window, $location) {
    // --- Config ---
    $scope.base = 'http://localhost:8000/api/login/';

    // --- Estado UI ---
    $scope.showError = false;
    $scope.errorMsg = '';

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
                    showError('Usuario o contraseña incorrectos');
                    return;
                }

                // Éxito
                var usuario = response.data.Usuario[0];
                var smarTime = response.data.smarTime;
                var usuarioSmatTime = response.data.usuarioSmatTime;

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
                if (usuario.perfil === 'Cocina') {
                    $window.location.href = 'http://localhost:4200/Views/despacho.html';
                } else {
                    $window.location.href = 'http://localhost:4200/Views/index.html';
                }
            })
            .catch(function (error) {
                // Mensaje por status
                var message = 'Credenciales incorrectas';
                if (error) {
                    if (error.status === 400) message = 'Usuario o contraseña incorrectos';
                    else if (error.status === 401) message = 'Acceso no autorizado';
                    else if (error.status === 500) message = 'Error del servidor';
                    else if (error.data && error.data.Message) message = error.data.Message;
                    else if (error.statusText) message = error.statusText;
                }
                showError(message);
            });
    };
});
