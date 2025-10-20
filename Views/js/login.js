console.log('=== ARCHIVO LOGIN.JS CARGADO ===');

var app = angular.module('AngujarJS', []);

app.controller('Login', function ($scope, $location, $sce, $http, $window) {
    console.log('=== CONTROLADOR LOGIN INICIALIZADO ===');
    console.log('AngularJS disponible:', typeof angular !== 'undefined');
    console.log('jQuery disponible:', typeof $ !== 'undefined');

    $scope.base = 'http://localhost:8000/api/login/';

    $scope.logIn = function () {
        console.log('=== BOTÓN INGRESAR PRESIONADO ===');
        console.log('Usuario:', $scope.view_username);
        console.log('Contraseña:', $scope.view_password ? '***' : 'vacía');
        
        var user = $scope.view_username;
        var pass = $scope.view_password;
        
        // Fallback: si ng-model no tomó el valor, leer desde el DOM visible
        var getVisibleElById = function(id){
            var nodes = document.querySelectorAll('[id="'+id+'"]');
            if (!nodes || nodes.length === 0) return null;
            for (var i=0;i<nodes.length;i++){ if (nodes[i].offsetParent !== null) return nodes[i]; }
            return nodes[0];
        };
        if (!user) { var uEl = getVisibleElById('view_username'); if (uEl) user = uEl.value; }
        if (!pass) { var pEl = getVisibleElById('view_password'); if (pEl) pass = pEl.value; }
        
        user = (user||'').trim();
        pass = (pass||'').trim();
        
        console.log('Usuario normalizado:', user ? '[ok]' : '[vacío]');
        console.log('Contraseña normalizada:', pass ? '[ok]' : '[vacía]');
        
        // Validación: ambos requeridos ANTES de llamar al backend
        if (!user || !pass) {
            if (typeof Swal !== 'undefined' && Swal.fire) {
                Swal.fire({ title: 'Campos requeridos', text: 'Usuario y contraseña son requeridos', icon: 'warning', confirmButtonText: 'Entendido' });
            } else if (typeof CustomToast !== 'undefined') {
                CustomToast.show('Usuario y contraseña son requeridos');
            } else { alert('Usuario y contraseña son requeridos'); }
            return; // cortar flujo
        }
        
        console.log('Validación pasada, procediendo con login...');
        
        console.log('Haciendo llamada HTTP a:', $scope.base + 'Authorize');
        $http({
            url: $scope.base + 'Authorize',
            method: "GET",
            params: { user: user, pass: pass }
        }).then(function (response) {
            console.log('Respuesta del servidor recibida:', response);
            var usuario = response.data.Usuario[0];
            var smarTime = response.data.smarTime;
            var usuarioSmatTime = response.data.usuarioSmatTime;
            localStorage.setItem("id", usuario.id);
            localStorage.setItem("nombre", usuario.nombre);
            localStorage.setItem("apellido", usuario.apellido);
            localStorage.setItem("legajo", usuario.legajo);
            localStorage.setItem("role", usuario.perfil);
            localStorage.setItem("cuil", usuario.cuil);
            localStorage.setItem("plannutricional", usuario.plannutricional);
            localStorage.setItem("planta", usuario.planta);
            localStorage.setItem("dni", usuario.dni);
            localStorage.setItem("domicilio", usuario.domicilio);
            localStorage.setItem("fechaingreso", usuario.fechaingreso);
            localStorage.setItem("contrato", usuario.contrato);
            localStorage.setItem("foto", usuario.foto);
            localStorage.setItem("user", usuario.user);
            localStorage.setItem("password", usuario.password);
            localStorage.setItem("proyecto", usuario.proyecto);
            localStorage.setItem("centrodecosto", usuario.centrodecosto);
            localStorage.setItem("bonificacion", usuario.bonificaciones);
            localStorage.setItem("bonificacion_invitado", usuario.bonificaciones_invitado);
            localStorage.setItem("smarTime", smarTime);
            localStorage.setItem("usuarioSmatTime", usuarioSmatTime);
            if (usuario.perfil === "Cocina") {
                $window.location.href = 'http://localhost:4200/Views/despacho.html';
            } else {
                $window.location.href = 'http://localhost:4200/Views/index.html';
            }
        }).catch(function (error) {
            console.error('Error en login:', error);
            $scope.errorMsg = (error && error.data && error.data.Message) ? error.data.Message : (error.statusText || 'Error en la solicitud');
            $scope.showError = true;
        });
    }

    // Limpiar almacenamiento local

    $scope.clearLocal = function () {
        $window.localStorage.clear();
        $location.path('/');
    }
    // Limpiar el almacenamiento local al cargar el controlador
    $scope.clearLocal();

});

