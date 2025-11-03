var app = angular.module('AngujarJS', []);

app.filter('startFrom', function () {
    return function (input, start) {
        start = +start; // parse to int
        return input.slice(start);
    }
});

app.controller('Jerarquia', function ($scope, $sce, $http, $window, $timeout) {
    // Usar la variable de configuración global API_BASE_URL
    var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
    $scope.base = apiBaseUrl + '/api/jerarquia/';

    // ============================================================
    // Datos de usuario (los dejé porque los tenías, aunque acá no se usan)
    // ============================================================
    $scope.user_Rol = localStorage.getItem('role');
    $scope.user_Nombre = localStorage.getItem('nombre');
    $scope.user_Apellido = localStorage.getItem('apellido');
    $scope.user_Planta = localStorage.getItem('planta');
    $scope.user_Centrodecosto = localStorage.getItem('centrodecosto');
    $scope.user_Proyecto = localStorage.getItem('proyecto');
    $scope.user_Jerarquia = localStorage.getItem('role');
    $scope.user_Perfilnutricional = localStorage.getItem('plannutricional');
    $scope.user_Bonificacion = localStorage.getItem('bonificacion');
    $scope.user_DNI = localStorage.getItem('dni');

    // ============================================================
    // Helpers de validación
    // ============================================================
    $scope.showValidationErrors = false;

    $scope.validatePercentage = function (value) {
        if (value === undefined || value === null || value === '') return;
        var num = parseInt(value, 10);
        if (num > 100) $scope.view_bonificacion = 100;
        if (num < 0) $scope.view_bonificacion = 0;
    };

    // ============================================================
    // CREATE
    // ============================================================
    $scope.ModelCreate = function (isValid, form) {
        // Leer valores directamente del DOM para asegurar que obtenemos los valores actuales
        var perfilElement = document.getElementById('view_perfil');
        var descripcionElement = document.getElementById('view_descripcion');
        var bonificacionElement = document.getElementById('view_bonificacion');

        // Obtener valores del DOM (fuente principal)
        var perfil = perfilElement ? perfilElement.value : '';
        var descripcion = descripcionElement ? descripcionElement.value : '';
        var bonificacion = bonificacionElement ? bonificacionElement.value : '';

        // Si no se obtuvieron valores del DOM, usar ng-model como fallback
        if (!perfil) perfil = ($scope.view_perfil || '').trim();
        if (!descripcion) descripcion = ($scope.view_descripcion || '').trim();
        if (!bonificacion) bonificacion = ($scope.view_bonificacion || '').toString().trim();

        console.log('=== MODELCREATE - VALORES OBTENIDOS ===');
        console.log('perfil (DOM):', perfilElement ? perfilElement.value : 'N/A');
        console.log('perfil (final):', perfil);
        console.log('descripcion (final):', descripcion);
        console.log('bonificacion (final):', bonificacion);

        // validaciones
        var camposFaltantes = [];
        if (!descripcion)   camposFaltantes.push('Descripción');
        if (bonificacion === '' || bonificacion === null || bonificacion === undefined)
            camposFaltantes.push('Porcentaje de bonificación');

        if (camposFaltantes.length > 0) {
            Swal.fire({
                title: 'Completar campos requeridos',
                text: 'Debe completar: ' + camposFaltantes.join(', '),
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            }).then(function () {
                $scope.showValidationErrors = true;
                !$scope.$$phase && $scope.$apply();
            });
            return;
        }

        var bonificacionNum = parseInt(bonificacion, 10);
        if (isNaN(bonificacionNum) || bonificacionNum < 0 || bonificacionNum > 100) {
            Swal.fire({
                title: 'Valor inválido',
                text: 'El porcentaje de bonificación debe ser un número entre 0 y 100.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        // si el perfil está vacío, lo mando como 'Admin' por default
        if (!perfil) {
            perfil = 'Admin';
        }

        var jsonForm = {
            perfil: perfil,
            descripcion: descripcion,
            bonificacion: bonificacionNum
        };

        $http({
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            url: $scope.base + 'create',
            data: jsonForm
        }).then(function () {
            $scope.showValidationErrors = false;
            Swal.fire({
                title: 'Operación Correcta',
                text: 'Jerarquía creada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then(function () {
                $scope.ModelReadAll();
            });
        }, function (error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al crear la jerarquía: ' + (error.data || error.statusText || 'Error desconocido'),
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        });
    };

    // ============================================================
    // READ (uno solo)
    // ============================================================
    $scope.ModelRead = function (view_id) {
        $http.get($scope.base + 'get/' + view_id)
            .success(function (data) {
                if (!data || !data.length) {
                    Swal.fire('Error', 'No se encontró la jerarquía', 'error');
                    return;
                }

                var row = data[0];

                console.log('=== DATOS DEL SERVIDOR ===');
                console.log('row:', row);
                console.log('row.perfil:', row.perfil);
                console.log('row.nombre:', row.nombre);
                console.log('row.descripcion:', row.descripcion);
                console.log('row.bonificacion:', row.bonificacion);

                 // Usar el campo correcto del perfil
                 $scope.view_perfil       = row.perfil || row.nombre || 'Admin';
                $scope.view_descripcion  = row.descripcion || '';
                $scope.view_bonificacion = parseInt(row.bonificacion, 10) || 0;

                console.log('=== VALORES ASIGNADOS ===');
                console.log('view_perfil:', $scope.view_perfil);
                console.log('view_descripcion:', $scope.view_descripcion);
                console.log('view_bonificacion:', $scope.view_bonificacion);

                // guardamos el id que estamos editando, por si acaso
                $scope.view_id = row.id;

                // Angular debería manejar la sincronización del select automáticamente
            })
            .error(function () {
                Swal.fire(
                    'Ha ocurrido un error',
                    'Api no presente',
                    'error'
                );
            });
    };

    // ============================================================
    // READ ALL (lista)
    // ============================================================
    $scope.ModelReadAll = function () {
        $scope.dataset = [];
        $scope.searchKeyword = '';
        $scope.ViewAction = 'Lista de Items';

        // reseteo de campos del form
        $scope.view_id = -1;
        $scope.view_perfil = 'Admin';
        $scope.view_descripcion = '';
        $scope.view_bonificacion = '';
        $scope.showValidationErrors = false;

        $http.get($scope.base + 'getAll')
            .success(function (data) {
                $scope.dataset = data;
            })
            .error(function () {
                Swal.fire(
                    'Ha ocurrido un error',
                    'Api no presente',
                    'error'
                );
            });
    };

    // ============================================================
    // UPDATE
    // ============================================================
     $scope.ModelUpdate = function (isValid, view_id, form) {
         // Leer valores directamente del DOM para asegurar que obtenemos los valores actuales
         var perfilElement = document.getElementById('view_perfil');
         var descripcionElement = document.getElementById('view_descripcion');
         var bonificacionElement = document.getElementById('view_bonificacion');

         // Obtener valores del DOM (fuente principal)
         var perfil = perfilElement ? perfilElement.value : '';
         var descripcion = descripcionElement ? descripcionElement.value : '';
         var bonificacion = bonificacionElement ? bonificacionElement.value : '';

         // Si no se obtuvieron valores del DOM, usar ng-model como fallback
         if (!perfil) perfil = ($scope.view_perfil || '').trim();
         if (!descripcion) descripcion = ($scope.view_descripcion || '').trim();
         if (!bonificacion) bonificacion = ($scope.view_bonificacion || '').toString().trim();

         console.log('=== MODELUPDATE - VALORES OBTENIDOS ===');
         console.log('perfil (DOM):', perfilElement ? perfilElement.value : 'N/A');
         console.log('perfil (final):', perfil);
         console.log('descripcion (final):', descripcion);
         console.log('bonificacion (final):', bonificacion);

        if (!descripcion || bonificacion === '' || bonificacion === null || bonificacion === undefined) {
            Swal.fire({
                title: 'Campos requeridos',
                text: 'Los campos Descripción y Porcentaje de bonificación son obligatorios',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            }).then(function () {
                $scope.showValidationErrors = true;
                !$scope.$$phase && $scope.$apply();
            });
            return;
        }

        var bonificacionNum = parseInt(bonificacion, 10);
        if (isNaN(bonificacionNum) || bonificacionNum < 0 || bonificacionNum > 100) {
            Swal.fire({
                title: 'Valor inválido',
                text: 'El porcentaje de bonificación debe ser un número entre 0 y 100.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        if (!perfil) {
            perfil = 'Admin';
        }

         var jsonForm = {
             id: view_id,
             perfil: perfil,
             descripcion: descripcion,
             bonificacion: bonificacionNum
         };

         console.log('=== ENVIANDO AL SERVIDOR ===');
         console.log('jsonForm:', jsonForm);

        $http({
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            url: $scope.base + 'update',
            data: jsonForm
        }).then(function () {
            $scope.showValidationErrors = false;
            Swal.fire({
                title: 'Operación Correcta',
                text: 'Jerarquía actualizada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then(function () {
                $scope.ModelReadAll();
            });
        }, function (error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al actualizar la jerarquía: ' + (error.data || error.statusText || 'Error desconocido'),
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        });
    };

    // ============================================================
    // DELETE
    // ============================================================
    $scope.ModelDelete = function (view_id) {
        var jsonForm = { id: view_id };

        $http({
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            url: $scope.base + 'delete',
            data: jsonForm
        }).then(function () {
            Swal.fire({
                title: 'Operación Correcta',
                text: 'Jerarquía eliminada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then(function () {
                $scope.ModelReadAll();
            });
        }, function () {
            Swal.fire({
                title: 'Operación Incorrecta',
                text: 'Error al eliminar la jerarquía',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        });
    };

    // ============================================================
    // VIEW STATES (pantallas)
    // ============================================================
    $scope.ViewCreate = function () {
        $scope.ViewAction = 'Nueva Jerarquia';
        $scope.view_id = -1;
        $scope.view_perfil = 'Admin'; // default
        $scope.view_descripcion = '';
        $scope.view_bonificacion = '';
        $scope.showValidationErrors = false;
    };

    $scope.ViewUpdate = function (view_id) {
        $scope.ViewAction = 'Editar Jerarquia';
        $scope.view_id = view_id;
        $scope.showValidationErrors = false;

        // Traemos los datos de ese registro y llenamos el form
        $scope.ModelRead(view_id);
    };

    $scope.ViewDelete = function (view_id) {
        Swal.fire({
            title: 'Baja registro',
            text: 'Desea dar de baja la jerarquía?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        }).then(function (result) {
            if (result.isConfirmed) {
                $scope.ModelDelete(view_id);
            }
        });
    };

    $scope.ViewCancel = function () {
        $scope.ModelReadAll();
    };

    // ============================================================
    // Paginación
    // ============================================================
    $scope.data = [];
    for (var i = 0; i < 45; i++) {
        $scope.data.push("Item " + i);
    }

    $scope.currentPage = 0;
    $scope.pageSize = 20;

    $scope.numberOfPages = function () {
        return Math.ceil(($scope.dataset || []).length / $scope.pageSize);
    };

    // ============================================================
    // INIT
    // ============================================================
    $scope.ModelReadAll();
});
