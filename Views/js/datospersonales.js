var app = angular.module('AngujarJS', []);

app.controller('DatosPersonales', function ($scope, $http, $window) {
    alert("paso datos personales")
    $scope.base = 'http://localhost:8000/api/usuario/'; // URL base para la API de usuarios
    $scope.user_DNI = localStorage.getItem('dni'); // Obtener el DNI del usuario logueado desde localStorage

    // Inicializar las variables del formulario
    $scope.view_user = '';
    $scope.view_pass = '';
    $scope.view_nombre = '';
    $scope.view_apellido = '';
    $scope.view_dni = '';
    $scope.view_domicilio = '';
    $scope.view_fechaingreso = '';
    $scope.view_previewImage = '';

    // Función para obtener los datos personales del usuario logueado
    $scope.getDatosPersonales = function () {
        if ($scope.user_DNI) {
            $http.get($scope.base + 'get/' + $scope.user_DNI)
                .then(function (response) {
                    const data = response.data;

                    // Asignar los datos obtenidos al $scope
                    $scope.view_user = data.username;
                    $scope.view_pass = data.password;
                    $scope.view_nombre = data.nombre;
                    $scope.view_apellido = data.apellido;
                    $scope.view_dni = data.dni;
                    $scope.view_domicilio = data.domicilio;
                    $scope.view_fechaingreso = new Date(data.fechaingreso);
                    $scope.view_previewImage = data.foto;
                })
                .catch(function (error) {
                    console.error('Error al obtener los datos personales:', error);
                    swal(
                        'Error',
                        'No se pudieron obtener los datos personales del usuario.',
                        'error'
                    );
                });
        } else {
            swal(
                'Error',
                'Usuario no logueado. Por favor inicie sesión.',
                'error'
            ).then(() => {
                window.location.href = 'login.html';
            });
        }
    };

    // Función para actualizar los datos personales del usuario
    $scope.updateDatosPersonales = function (isValid) {
        if (isValid) {
            var jsonForm = {
                user: $scope.view_user,
                pass: $scope.view_pass,
                nombre: $scope.view_nombre,
                apellido: $scope.view_apellido,
                dni: $scope.view_dni,
                domicilio: $scope.view_domicilio,
                fechaingreso: $scope.view_fechaingreso,
                foto: $scope.view_previewImage
            };

            $http({
                method: 'post',
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                url: $scope.base + 'Update', // Endpoint de actualización
                data: jsonForm
            }).then(function (success) {
                swal(
                    'Operación Correcta',
                    'Los datos personales fueron actualizados con éxito.',
                    'success'
                );
            }).catch(function (error) {
                console.error('Error al actualizar los datos personales:', error);
                swal(
                    'Operación Incorrecta',
                    'Hubo un error al actualizar los datos personales.',
                    'error'
                );
            });
        } else {
            swal(
                'Error',
                'Por favor, complete todos los campos requeridos correctamente.',
                'error'
            );
        }
    };

    // Función para cargar una imagen seleccionada
    $scope.loadImage = function () {
        var file = $window.document.getElementById('view_file').files[0];
        var reader = new FileReader();
        reader.onloadend = function () {
            $scope.view_previewImage = reader.result; // Convertir la imagen a base64
            $scope.$apply();
        };
        reader.readAsDataURL(file);
    };

    // Llamar a la función para obtener los datos personales al cargar la página
    $scope.getDatosPersonales();
});
