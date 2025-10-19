var app = angular.module('AngujarJS', []);

app.controller('Login', function ($scope, $location, $sce, $http, $window) {

    $scope.base = 'http://localhost:8000/api/login/';

    $scope.logIn = function () {
        var user = $scope.view_username;//$window.document.getElementById('view_username').value;
        var pass = $scope.view_password; //$window.document.getElementById('view_password').value;
        
        // Validar que los campos no estén vacíos
        if (!user || !pass || user === undefined || pass === undefined || user === null || pass === null) {
            CustomToast.show('Por favor, ingrese usuario y contraseña');
            return;
        }
        
        // Validar que no sean solo espacios en blanco
        if (user.trim() === '' || pass.trim() === '') {
            CustomToast.show('Por favor, ingrese usuario y contraseña válidos');
            return;
        }
        
        // Validar longitud mínima (opcional)
        if (user.trim().length < 2 || pass.trim().length < 2) {
            CustomToast.show('Usuario y contraseña deben tener al menos 2 caracteres');
            return;
        }
        
        $http({
            url: $scope.base + 'Authorize',
            method: "GET",
            params: { user: user, pass: pass }
        }).then(function (response) {
           
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

            // Redirigir según el rol del usuario
            if (usuario.perfil === "Cocina") {
                $window.location.href = 'http://localhost:4200/Views/despacho.html';
            } else {
                $window.location.href = 'http://localhost:4200/Views/index.html';
            }
        }).catch(function (error) {
            console.error("Error en login:", error);
            if (error.status === 400) {
                $scope.errorMsg = error.data.Message; // Mensaje del error
            } else {
                $scope.errorMsg = "Error en la solicitud. Por favor, valide la conexión con el servicio.";
            }
            $scope.showError = true; // Muestra el mensaje de error en el HTML
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

