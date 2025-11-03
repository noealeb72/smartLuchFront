// === Adapter SweetAlert2: expone swal(...) usando SweetAlert2 ===
(function (w) {
    if (w.Swal && typeof w.Swal.fire === 'function' && typeof w.swal !== 'function') {
        w.swal = function () {
            if (arguments.length === 1 && typeof arguments[0] === 'object') {
                return w.Swal.fire(arguments[0]);
            }
            var args = Array.prototype.slice.call(arguments);
            var opt = {};
            if (args[0]) opt.title = args[0];
            if (args[1]) opt.text = args[1];
            if (args[2]) opt.icon = args[2];
            return w.Swal.fire(opt);
        };
    }
})(window);

// VERSION 3.1 - SweetAlert2 v11 unificado
console.log('=== Planta.JS V3.1 CARGANDO ===');

// Usa el módulo si ya existe; si no, créalo (evita redefinirlo en otras páginas)
var app;
try { app = angular.module('AngujarJS'); }
catch (e) { app = angular.module('AngujarJS', []); }

console.log('=== MODULO ANGUJARJS OK ===');

// Filtros defensivos
app.filter('startFrom', function () {
    return function (input, start) {
        if (!Array.isArray(input)) return input || [];
        start = +start || 0;
        return input.slice(start);
    };
});

app.controller('Planta', function ($scope, $sce, $http, $window) {
    // Usar la variable de configuración global API_BASE_URL
    var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
    $scope.base = apiBaseUrl + '/api/planta/';

    // USER (por si lo usas en headers o UI)
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

    // Helpers SweetAlert2
    $scope.showPopup = function (title, text, icon) {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({ title: title, text: text || '', icon: icon || 'info', confirmButtonText: 'Aceptar' });
        } else {
            alert((title || 'Aviso') + (text ? '\n' + text : ''));
        }
    };
    $scope.showSuccess = function (title, text) { $scope.showPopup(title, text || '', 'success'); };
    $scope.showError = function (title, text) { $scope.showPopup(title, text || '', 'error'); };

    // CREATE
     $scope.ModelCreate = function (isValid) {
         console.log('=== VALIDACIÓN CREATE PLANTA === isValid:', isValid);
         console.log('=== FUNCIÓN MODELCREATE EJECUTADA ===');

        // Tomo valores desde ng-model y respaldo desde el DOM
        var nombre = ($scope.view_nombre || '').trim();
        var descripcion = ($scope.view_descripcion || '').trim();

        var nombreField = document.getElementById('view_nombre');
        var descripcionField = document.getElementById('view_descripcion');
        if (nombreField && typeof nombreField.value === 'string') nombre = nombreField.value.trim() || nombre;
        if (descripcionField && typeof descripcionField.value === 'string') descripcion = descripcionField.value.trim() || descripcion;

        var errores = [];
        if (!nombre) errores.push('Nombre');
        if (!descripcion) errores.push('Descripción');

         if (!isValid || errores.length > 0) {
             console.log('=== DEBUG VALIDACIÓN CREATE ===');
             console.log('showValidationErrors antes:', $scope.showValidationErrors);
             
             // Mostrar leyendas rojas
             $scope.showValidationErrors = true;
             console.log('showValidationErrors después:', $scope.showValidationErrors);
             
             Swal.fire({
                 title: 'Completar campos requeridos',
                 //text: errores.length ? '' + errores.join(', ') : '',
                 icon: 'warning',
                 confirmButtonText: 'Aceptar',
                 confirmButtonColor: '#343A40',
                 allowOutsideClick: false,
                 allowEscapeKey: false
             });
             return;
         }

        // Payload usando valores validados
        var jsonForm = { nombre: nombre, descripcion: descripcion };
        console.log('Payload Create:', jsonForm);

        $http({
            method: 'post',
            headers: { "Content-Type": "application/json; charset=utf-8" },
            url: $scope.base + 'Create',
            data: jsonForm
        }).then(function () {
            $scope.showSuccess('Operación Correcta', 'Planta creada exitosamente');
            $scope.ModelReadAll();
        }).catch(function (err) {
            var msg = (err && (err.data || err.statusText)) || 'Error desconocido';
            $scope.showError('Operación Incorrecta', msg);
        });
    };

    // READ (1)
    $scope.ModelRead = function (view_id) {
        $http.get($scope.base + 'get/' + view_id)
            .then(function (resp) {
                var data = resp.data;
                var item = Array.isArray(data) ? data[0] : data;
                if (!item) throw new Error('Respuesta vacía');
                $scope.view_nombre = item.nombre || '';
                $scope.view_descripcion = item.descripcion || '';
            })
            .catch(function () {
                $scope.showError('Ha ocurrido un error', 'No se pudo obtener la planta');
            });
    };

    // READ ALL
    $scope.ModelReadAll = function () {
        $scope.dataset = [];
        $scope.ViewAction = 'Lista de Items';
        $scope.view_id = -1;
        $scope.view_nombre = '';
        $scope.view_descripcion = '';
        $scope.showValidationErrors = false;

        $http.get($scope.base + 'getAll')
            .then(function (resp) {
                $scope.dataset = Array.isArray(resp.data) ? resp.data : [];
            })
            .catch(function () {
                $scope.showError('Ha ocurrido un error', 'Api no presente');
            });
    };

    // UPDATE
    $scope.ModelUpdate = function (isValid, view_id) {
        console.log('=== VALIDACIÓN UPDATE PLANTA === isValid:', isValid, 'id:', view_id);

        // Tomo valores desde ng-model y respaldo desde el DOM
        var nombre = ($scope.view_nombre || '').trim();
        var descripcion = ($scope.view_descripcion || '').trim();

        var nombreField = document.getElementById('view_nombre');
        var descripcionField = document.getElementById('view_descripcion');
        if (nombreField && typeof nombreField.value === 'string') nombre = nombreField.value.trim() || nombre;
        if (descripcionField && typeof descripcionField.value === 'string') descripcion = descripcionField.value.trim() || descripcion;

        var errores = [];
        if (!nombre) errores.push('Nombre');
        if (!descripcion) errores.push('Descripción');

         if (!isValid || errores.length > 0) {
             console.log('=== DEBUG VALIDACIÓN ===');
             console.log('ViewAction:', $scope.ViewAction);
             console.log('showValidationErrors antes:', $scope.showValidationErrors);
             
             // Mostrar leyendas rojas en ambos modos
             $scope.showValidationErrors = true;
             console.log('showValidationErrors después:', $scope.showValidationErrors);
             
             Swal.fire({
                 title: 'Completar campos requeridos',
                 //text: errores.length ? 'Faltan: ' + errores.join(', ') : '',
                 icon: 'warning',
                 confirmButtonText: 'Aceptar',
                 confirmButtonColor: '#343A40',
                 allowOutsideClick: false,
                 allowEscapeKey: false
             });
             return;
         }

        // Payload usando valores validados
        var jsonForm = { id: view_id, nombre: nombre, descripcion: descripcion };
        console.log('Payload Update:', jsonForm);

        $http({
            method: 'post',
            headers: { "Content-Type": "application/json; charset=utf-8" },
            url: $scope.base + 'Update',
            data: jsonForm
        }).then(function () {
            $scope.showSuccess('Operación Correcta', 'Planta actualizada exitosamente');
            $scope.ModelReadAll();
        }).catch(function (err) {
            var msg = (err && (err.data || err.statusText)) || 'Error desconocido';
            $scope.showError('Operación Incorrecta', msg);
        });
    };

    // DELETE
    $scope.ModelDelete = function (view_id) {
        var jsonForm = { id: view_id };

        $http({
            method: 'post',
            headers: { "Content-Type": "application/json; charset=utf-8" },
            url: $scope.base + 'Delete',
            data: jsonForm
        }).then(function () {
            $scope.showSuccess('Operación Correcta', 'Planta eliminada exitosamente');
            $scope.ModelReadAll();
        }).catch(function () {
            $scope.showError('Operación Incorrecta', 'Error al eliminar la planta');
        });
    };

    // VIEWS
    $scope.ViewCreate = function () {
        $scope.ViewAction = 'Nueva Planta';
        $scope.view_id = -1;
        $scope.view_nombre = '';
        $scope.view_descripcion = '';
        $scope.showValidationErrors = false;

        setTimeout(function () {
            var nombreField = document.getElementById('view_nombre');
            var descripcionField = document.getElementById('view_descripcion');
            if (nombreField) nombreField.classList.remove('show-validation-error');
            if (descripcionField) descripcionField.classList.remove('show-validation-error');
        }, 0);
    };

    $scope.ViewUpdate = function (view_id) {
        $scope.ViewAction = 'Editar Planta';
        $scope.view_id = view_id;
        $scope.showValidationErrors = false;

        setTimeout(function () {
            var nombreField = document.getElementById('view_nombre');
            var descripcionField = document.getElementById('view_descripcion');
            if (nombreField) nombreField.classList.remove('show-validation-error');
            if (descripcionField) descripcionField.classList.remove('show-validation-error');
        }, 0);

        $scope.ModelRead(view_id);
    };

    $scope.ViewDelete = function (view_id) {
        const hasSwal = typeof window !== 'undefined' && window.Swal && typeof window.Swal.fire === 'function';
        if (hasSwal) {
            window.Swal.fire({
                title: 'Baja registro',
                text: '¿Desea dar de baja la planta?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#343A40',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar'
            }).then(function (result) {
                if (result.isConfirmed) $scope.ModelDelete(view_id);
            });
        } else {
            if (window.confirm('¿Desea eliminar la planta?')) $scope.ModelDelete(view_id);
        }
    };

    $scope.ViewCancel = function () {
        $scope.ViewAction = 'Lista de Items';
        $scope.showValidationErrors = false;

        var nombreField = document.getElementById('view_nombre');
        var descripcionField = document.getElementById('view_descripcion');
        if (nombreField) nombreField.classList.remove('show-validation-error');
        if (descripcionField) descripcionField.classList.remove('show-validation-error');
    };

    // Init
    $scope.showValidationErrors = false;
    $scope.ModelReadAll();
    $scope.data = [];
    for (var i = 0; i < 45; i++) $scope.data.push("Item " + i);
    $scope.currentPage = 0;
    $scope.pageSize = 20;
    $scope.numberOfPages = function () {
        var len = Array.isArray($scope.dataset) ? $scope.dataset.length : 0;
        return Math.ceil(len / ($scope.pageSize || 1));
    };
});
