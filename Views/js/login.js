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
            
            // Debug: verificar valores que llegan del servidor
            console.log('=== DATOS DEL SERVIDOR ===');
            console.log('usuario.perfil (rol):', JSON.stringify(usuario.perfil));
            console.log('usuario.nombre:', JSON.stringify(usuario.nombre));
            console.log('usuario.apellido:', JSON.stringify(usuario.apellido));
            console.log('usuario.planta:', JSON.stringify(usuario.planta));
            console.log('usuario.centrodecosto:', JSON.stringify(usuario.centrodecosto));
            console.log('usuario.proyecto:', JSON.stringify(usuario.proyecto));
            // Función para limpiar y guardar datos
            function cleanAndSetItem(key, value) {
                if (value !== null && value !== undefined) {
                    localStorage.setItem(key, String(value).trim());
                }
            }
            
            cleanAndSetItem("id", usuario.id);
            cleanAndSetItem("nombre", usuario.nombre);
            cleanAndSetItem("apellido", usuario.apellido);
            cleanAndSetItem("legajo", usuario.legajo);
            cleanAndSetItem("role", usuario.perfil);
            cleanAndSetItem("cuil", usuario.cuil);
            cleanAndSetItem("plannutricional", usuario.plannutricional);
            cleanAndSetItem("planta", usuario.planta);
            cleanAndSetItem("dni", usuario.dni);
            cleanAndSetItem("domicilio", usuario.domicilio);
            cleanAndSetItem("fechaingreso", usuario.fechaingreso);
            cleanAndSetItem("contrato", usuario.contrato);
            cleanAndSetItem("foto", usuario.foto);
            cleanAndSetItem("user", usuario.user);
            cleanAndSetItem("password", usuario.password);
            cleanAndSetItem("proyecto", usuario.proyecto);
            cleanAndSetItem("centrodecosto", usuario.centrodecosto);
            cleanAndSetItem("bonificacion", usuario.bonificaciones);
            cleanAndSetItem("bonificacion_invitado", usuario.bonificaciones_invitado);
            localStorage.setItem("smarTime", smarTime);
            localStorage.setItem("usuarioSmatTime", usuarioSmatTime);
            
            // Debug: verificar datos guardados en localStorage
            console.log('=== DATOS GUARDADOS EN LOCALSTORAGE ===');
            console.log('role guardado:', JSON.stringify(localStorage.getItem('role')));
            console.log('nombre guardado:', JSON.stringify(localStorage.getItem('nombre')));
            console.log('apellido guardado:', JSON.stringify(localStorage.getItem('apellido')));
            console.log('planta guardada:', JSON.stringify(localStorage.getItem('planta')));
            console.log('centrodecosto guardado:', JSON.stringify(localStorage.getItem('centrodecosto')));
            console.log('proyecto guardado:', JSON.stringify(localStorage.getItem('proyecto')));
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

