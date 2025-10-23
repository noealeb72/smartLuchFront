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

    $scope.base = 'http://localhost:8000/api/planta/';

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
            Swal.fire({ title: title, text: text || '', icon: icon || 'info', confirmButtonText: 'Entendido' });
        } else {
            alert((title || 'Aviso') + (text ? '\n' + text : ''));
        }
    };
    $scope.showSuccess = function (title, text) {
        $scope.showPopup(title, text || '', 'success');
    };
    $scope.showError = function (title, text) {
        $scope.showPopup(title, text || '', 'error');
    };

    // CREATE
    $scope.ModelCreate = function (isValid) {
        console.log('=== VALIDACIÓN CREATE PLANTA === isValid:', isValid);
        console.log('=== FUNCIÓN MODELCREATE EJECUTADA ===');

        // Toma de valores (si no estás bindeando con ng-model)
        $scope.view_nombre = ($window.document.getElementById('view_nombre') || {}).value || $scope.view_nombre || '';
        $scope.view_descripcion = ($window.document.getElementById('view_descripcion') || {}).value || $scope.view_descripcion || '';

        var errores = [];
        if (!$scope.view_nombre || $scope.view_nombre.trim() === '') errores.push('Nombre');
        if (!$scope.view_descripcion || $scope.view_descripcion.trim() === '') errores.push('Descripción');

        if (errores.length > 0) {
            // Marcar campos como tocados para mostrar errores
            $scope.showValidationErrors = true;
            
            Swal.fire({
                title: 'Completar campos requeridos',
                text: '',
                icon: 'warning',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#6c757d',
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        var jsonForm = {
            nombre: ($scope.view_nombre || '').trim(),
            descripcion: ($scope.view_descripcion || '').trim()
        };
        console.log('Payload Create:', jsonForm);

        $http({
            method: 'post',
            headers: { "Content-Type": "application/json; charset=utf-8" },
            url: $scope.base + 'Create',
            data: jsonForm
        }).then(function (resp) {
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
            .catch(function (err) {
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
        console.log('=== FUNCIÓN MODELUPDATE EJECUTADA ===');

        $scope.view_nombre = ($window.document.getElementById('view_nombre') || {}).value || $scope.view_nombre || '';
        $scope.view_descripcion = ($window.document.getElementById('view_descripcion') || {}).value || $scope.view_descripcion || '';

        var errores = [];
        if (!$scope.view_nombre || $scope.view_nombre.trim() === '') errores.push('Nombre');
        if (!$scope.view_descripcion || $scope.view_descripcion.trim() === '') errores.push('Descripción');

        if (errores.length > 0) {
            // Marcar campos como tocados para mostrar errores
            $scope.showValidationErrors = true;
            
            Swal.fire({
                title: 'Completar campos requeridos',
                text: '',
                icon: 'warning',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#6c757d',
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        var jsonForm = {
            id: view_id,
            nombre: ($scope.view_nombre || '').trim(),
            descripcion: ($scope.view_descripcion || '').trim()
        };
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
    };

    $scope.ViewUpdate = function (view_id) {
        $scope.ViewAction = 'Editar Planta';
        $scope.view_id = view_id;
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
                confirmButtonColor: '#6c757d',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
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
    };

    // Init
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
