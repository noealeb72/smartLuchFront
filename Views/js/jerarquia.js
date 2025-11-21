// Verificar si el módulo ya existe
var app;
try {
	app = angular.module('AngujarJS');
} catch (e) {
	app = angular.module('AngujarJS', []);
}

app.filter('startFrom', function () {
    return function (input, start) {
        start = +start; // parse to int
        return input.slice(start);
    }
});

app.controller('Jerarquia', function ($scope, $sce, $http, $window, $timeout) {
    // Siempre usar puerto 8000, detectando el hostname automáticamente
    function getApiBaseUrl() {
        var protocol = window.location.protocol;
        var hostname = window.location.hostname;
        return protocol + '//' + hostname + ':8000';
    }
    var apiBaseUrl = getApiBaseUrl();
    $scope.base = apiBaseUrl + '/api/jerarquia/';

    // -------- Loading State ----------
    $scope.isLoading = true;
    
    // Inicializar variables
    $scope.ViewAction = 'Lista de Items';
    $scope.dataset = [];
    $scope.filteredData = null;
    $scope.searchText = '';
    
    // Inicializar paginación al inicio
    $scope.currentPage = 0;
    $scope.pageSize = 5; // Inicializar como número directamente

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

    // Helper para escapar saltos de línea en strings (previene errores de sintaxis)
    function escapeString(str) {
        if (!str) return str || '';
        if (typeof str !== 'string') {
            try {
                str = String(str);
            } catch (e) {
                return '';
            }
        }
        // Reemplazar saltos de línea con espacios o eliminarlos completamente
        return str.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
    }

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
        // El ID puede ser 'view_bonificacion_nueva' o 'view_bonificacion' dependiendo del formulario
        var bonificacionElement = document.getElementById('view_bonificacion_nueva') || document.getElementById('view_bonificacion');

        // Obtener valores del DOM (fuente principal)
        var perfil = perfilElement ? perfilElement.value : '';
        var descripcion = descripcionElement ? descripcionElement.value : '';
        var bonificacion = bonificacionElement ? bonificacionElement.value : '';

        // Si no se obtuvieron valores del DOM, usar ng-model como fallback
        if (!perfil) perfil = ($scope.view_perfil || '').trim();
        if (!descripcion) descripcion = ($scope.view_descripcion || '').trim();
        // Para bonificación, verificar explícitamente null/undefined/string vacío (0 es válido)
        if (bonificacion === '' || bonificacion === null || bonificacion === undefined) {
            // Si el valor del scope es 0, es válido, así que lo tomamos
            if ($scope.view_bonificacion === 0 || $scope.view_bonificacion === '0') {
                bonificacion = '0';
            } else if ($scope.view_bonificacion !== null && $scope.view_bonificacion !== undefined && $scope.view_bonificacion !== '') {
                bonificacion = $scope.view_bonificacion.toString().trim();
            } else {
                bonificacion = '';
            }
        }

        // Limpiar espacios en blanco
        bonificacion = String(bonificacion || '').trim();

        // validaciones
        var camposFaltantes = [];
        if (!descripcion)   camposFaltantes.push('Descripción');
        // Validar bonificación: debe ser un número (puede ser 0)
        var bonificacionNum = null;
        if (bonificacion !== '' && bonificacion !== null && bonificacion !== undefined) {
            bonificacionNum = parseInt(bonificacion, 10);
            // Si es NaN, entonces es inválido (0 es válido porque parseInt('0') = 0, no NaN)
            if (isNaN(bonificacionNum)) {
                camposFaltantes.push('Porcentaje de bonificación');
            }
        } else {
            camposFaltantes.push('Porcentaje de bonificación');
        }
        if (!perfil || perfil.trim() === '') {
            camposFaltantes.push('Jerarquía');
        }

        if (camposFaltantes.length > 0) {
            Swal.fire({
                title: 'Completar campos requeridos',
                text: '',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            }).then(function () {
                $scope.showValidationErrors = true;
                !$scope.$$phase && $scope.$apply();
            });
            return;
        }

        // Validar que no sea un perfil fijo (reservado)
        var perfilTrimmed = perfil.trim();
        if ($scope.esPerfilFijo(perfilTrimmed)) {
            Swal.fire({
                title: 'Nombre no permitido',
                text: 'No se puede crear una jerarquía con el nombre "' + escapeString(perfilTrimmed) + '" porque es una jerarquía reservada del sistema. Use otro nombre personalizado.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            }).then(function () {
                $scope.showValidationErrors = true;
                !$scope.$$phase && $scope.$apply();
            });
            return;
        }

        // Validar rango de bonificación (0 es válido)
        if (bonificacionNum < 0 || bonificacionNum > 100) {
            Swal.fire({
                title: 'Valor inválido',
                text: 'El porcentaje de bonificación debe ser un número entre 0 y 100.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            return;
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
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            }).then(function () {
                $scope.ModelReadAll();
            });
        }, function (error) {
            var errorMsg = '';
            if (error.data && typeof error.data === 'string') {
                errorMsg = escapeString(error.data);
            } else if (error.data) {
                errorMsg = JSON.stringify(error.data);
            } else {
                errorMsg = escapeString(error.statusText || 'Error desconocido');
            }
            Swal.fire({
                title: 'Error',
                text: 'Error al crear la jerarquía: ' + errorMsg,
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

                /*console.log('=== DATOS DEL SERVIDOR ===');
                console.log('row:', row);
                console.log('row.perfil:', row.perfil);
                console.log('row.nombre:', row.nombre);
                console.log('row.descripcion:', row.descripcion);
                console.log('row.bonificacion:', row.bonificacion);*/

                 // Usar el campo correcto del perfil (escapar saltos de línea si existen)
                 var perfilValue = row.perfil || row.nombre || '';
                 var descripcionValue = row.descripcion || '';
                 $scope.view_perfil       = escapeString(perfilValue);
                $scope.view_descripcion  = escapeString(descripcionValue);
                $scope.view_bonificacion = parseInt(row.bonificacion, 10) || 0;

                /*console.log('=== VALORES ASIGNADOS ===');
                console.log('view_perfil:', $scope.view_perfil);
                console.log('view_descripcion:', $scope.view_descripcion);
                console.log('view_bonificacion:', $scope.view_bonificacion);*/

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
        $scope.isLoading = true;
        $scope.dataset = [];
        $scope.searchKeyword = '';
        $scope.ViewAction = 'Lista de Items';

        // reseteo de campos del form
        $scope.view_id = -1;
        $scope.view_perfil = '';
        $scope.view_descripcion = '';
        $scope.view_bonificacion = '';
        $scope.showValidationErrors = false;

        $http.get($scope.base + 'getAll')
            .then(function (response) {
                $scope.dataset = Array.isArray(response.data) ? response.data : [];
                $scope.isLoading = false;
            })
            .catch(function () {
                $scope.isLoading = false;
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
         // Ignorar el parámetro isValid y validar manualmente para asegurar que funcione
         // Leer valores directamente del DOM para asegurar que obtenemos los valores actuales
         var perfilElement = document.getElementById('view_perfil');
         var descripcionElement = document.getElementById('view_descripcion');
         var bonificacionElement = document.getElementById('view_bonificacion');

         // Obtener valores del DOM (fuente principal) - leer siempre del DOM primero
         var perfil = '';
         var descripcion = '';
         var bonificacion = '';
         
         // Leer del DOM (incluso si está vacío, el value será string vacío)
         if (perfilElement) {
             perfil = String(perfilElement.value || '').trim();
         }
         if (descripcionElement) {
             // Leer directamente del DOM, incluso si está vacío
             descripcion = String(descripcionElement.value || '').trim();
         }
         if (bonificacionElement) {
             bonificacion = String(bonificacionElement.value || '').trim();
         }

         // Si el elemento del DOM no existe, usar ng-model como fallback
         // IMPORTANTE: Si el elemento existe, siempre usar su valor (incluso si está vacío)
         if (!perfilElement && $scope.view_perfil) {
             perfil = String($scope.view_perfil || '').trim();
         }
         if (!descripcionElement && $scope.view_descripcion) {
             descripcion = String($scope.view_descripcion || '').trim();
         }
         // Para bonificación, verificar explícitamente null/undefined/string vacío (0 es válido)
         if (bonificacion === '' || bonificacion === null || bonificacion === undefined) {
             // Si el valor del scope es 0 (número) o '0' (string), es válido
             if ($scope.view_bonificacion === 0 || $scope.view_bonificacion === '0') {
                 bonificacion = '0';
             } else if ($scope.view_bonificacion !== null && $scope.view_bonificacion !== undefined && $scope.view_bonificacion !== '') {
                 bonificacion = String($scope.view_bonificacion).trim();
             } else {
                 bonificacion = '';
             }
         }

        // Validar campos requeridos ANTES de cualquier otra operación
        var camposFaltantes = [];
        
        // Validar Jerarquía (perfil)
        if (!perfil || perfil.trim() === '') {
            camposFaltantes.push('Jerarquía');
        }
        
        // Validar Descripción
        if (!descripcion || descripcion.trim() === '') {
            camposFaltantes.push('Descripción');
        }
        
        // Validar bonificación: debe ser un número (puede ser 0)
        var bonificacionNum = null;
        if (bonificacion === '' || bonificacion === null || bonificacion === undefined) {
            camposFaltantes.push('Porcentaje de bonificación');
        } else {
            bonificacionNum = parseInt(bonificacion, 10);
            if (isNaN(bonificacionNum)) {
                camposFaltantes.push('Porcentaje de bonificación');
            }
        }
        
        // Si hay campos faltantes, mostrar error y detener
        if (camposFaltantes.length > 0) {
            Swal.fire({
                title: 'Completar campos requeridos',
                text: '',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            }).then(function () {
                $scope.showValidationErrors = true;
                !$scope.$$phase && $scope.$apply();
            });
            return;
        }

        // Validar rango de bonificación (0 es válido)
        if (bonificacionNum < 0 || bonificacionNum > 100) {
            Swal.fire({
                title: 'Valor inválido',
                text: 'El porcentaje de bonificación debe ser un número entre 0 y 100.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

         var jsonForm = {
             id: view_id,
             perfil: perfil,
             descripcion: descripcion,
             bonificacion: bonificacionNum
         };

         //console.log('=== ENVIANDO AL SERVIDOR ===');
         //console.log('jsonForm:', jsonForm);

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
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            }).then(function () {
                $scope.ModelReadAll();
            });
        }, function (error) {
            var errorMsg = '';
            if (error.data && typeof error.data === 'string') {
                errorMsg = escapeString(error.data);
            } else if (error.data) {
                errorMsg = JSON.stringify(error.data);
            } else {
                errorMsg = escapeString(error.statusText || 'Error desconocido');
            }
            Swal.fire({
                title: 'Error',
                text: 'Error al actualizar la jerarquía: ' + errorMsg,
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
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
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
        $scope.view_perfil = '';
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

    // Función para verificar si es un perfil fijo
    $scope.esPerfilFijo = function(nombre) {
        if (!nombre) return false;
        var perfilesFijos = ['Admin', 'Cocina', 'Comensal', 'Gerencia'];
        return perfilesFijos.includes(nombre.toString().trim());
    };

    $scope.ViewDelete = function (view_id) {
        // Buscar la jerarquía en el dataset para verificar si es fija
        var jerarquia = $scope.dataset.find(function(item) {
            return item.id === view_id;
        });
        
        // Si es una jerarquía fija, no permitir eliminarla
        if (jerarquia && $scope.esPerfilFijo(jerarquia.nombre)) {
            var nombreEscapado = escapeString(jerarquia.nombre || '');
            Swal.fire({
                title: 'No se puede eliminar',
                text: 'No se puede eliminar la jerarquía "' + nombreEscapado + '" porque es una jerarquía del sistema.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            });
            return;
        }

        Swal.fire({
            title: 'Baja registro',
            text: 'Desea dar de baja la jerarquía?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F34949',
            cancelButtonColor: '#C92A2A',
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

    // currentPage y pageSize ya están inicializados al inicio del controlador

    $scope.numberOfPages = function () {
        var arr = ($scope.filteredData || $scope.dataset) || [];
        var len = Array.isArray(arr) ? arr.length : 0;
        return Math.ceil(len / $scope.pageSize);
    };

    // Funciones para paginación tipo DataTable (igual que reportegcomensales)
    $scope.getPageNumbers = function() {
        var pages = [];
        var totalPages = $scope.numberOfPages();
        var current = $scope.currentPage;
        
        if (totalPages <= 7) {
            for (var i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (current <= 3) {
                for (var i = 0; i < 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages - 1);
            } else if (current >= totalPages - 4) {
                pages.push(0);
                pages.push('...');
                for (var i = totalPages - 5; i < totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(0);
                pages.push('...');
                for (var i = current - 1; i <= current + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages - 1);
            }
        }
        return pages;
    };

    $scope.goToPage = function(page) {
        if (page >= 0 && page < $scope.numberOfPages()) {
            $scope.currentPage = page;
        }
    };

    $scope.changePageSize = function(newSize) {
        $scope.pageSize = parseInt(newSize);
        $scope.currentPage = 0;
    };

    // ============================================================
    // INIT
    // ============================================================
    $scope.ModelReadAll();
});
