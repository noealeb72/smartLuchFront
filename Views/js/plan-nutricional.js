var app = angular.module('AngujarJS', []);

// Controlador del navbar (lee localStorage)
app.controller('NavbarCtrl', function ($scope) {
    $scope.user_Rol = localStorage.getItem('role') || '';
});

// Filtro paginador simple
app.filter('startFrom', function () {
    return function (input, start) {
        if (!Array.isArray(input)) return input || [];
        start = +start;
        return input.slice(start);
    };
});

app.controller('PlanNutricional', function ($scope, $http) {
    // -------- Config ----------
    $scope.user_Rol = localStorage.getItem('role') || '';
    $scope.base = 'http://localhost:8000/api/plannutricional/';

    // -------- Helpers ----------
    function normalize(s) {
        s = (s || '').toString().toLowerCase().trim();
        if (typeof s.normalize === 'function') {
            return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        return s;
    }

    function msgError(err) {
        try {
            if (!err) return 'Ocurrió un error.';
            if (typeof err === 'string') return err;
            var d = err.data;
            if (typeof d === 'string') return d;
            if (d && d.message) return d.message;
            if (d && d.ModelState) {
                return Object.keys(d.ModelState).map(k => d.ModelState[k]).flat().join('\n');
            }
            if (d && d.errors) return JSON.stringify(d.errors);
            return (err.status || '') + ' ' + (err.statusText || '');
        } catch { return 'Ocurrió un error.'; }
    }

    function touchAll(form) {
        if (!form) return;
        form.$setSubmitted && form.$setSubmitted();
        angular.forEach(form.$error, function (fields) {
            angular.forEach(fields, function (field) {
                field.$setTouched && field.$setTouched();
            });
        });
    }

    // -------- Estado/UI ----------
    $scope.ViewAction = 'Lista de Items';
    $scope.view_id = -1;
    $scope.view_nombre = '';
    $scope.view_descripcion = '';

    $scope.dataset = [];
    $scope.searchText = '';
    $scope.currentPage = 0;
    $scope.pageSize = 20;


    // -------- CRUD ----------
    $scope.ModelCreate = function (isValid, form) {
        if (!isValid) { 
            touchAll(form); 
            Swal.fire({ 
                title: '¡Campos Obligatorios!', 
                text: 'Debes completar los campos Nombre y Descripción para continuar.', 
                icon: 'warning',
                confirmButtonText: 'Entendido'
            }); 
            return; 
        }
        var payload = { nombre: ($scope.view_nombre || '').trim(), descripcion: ($scope.view_descripcion || '').trim() };
        if (!payload.nombre || !payload.descripcion) { 
            touchAll(form); 
            Swal.fire({ 
                title: '¡Campos Vacíos!', 
                text: 'Los campos Nombre y Descripción no pueden estar vacíos.', 
                icon: 'error',
                confirmButtonText: 'Entendido'
            }); 
            return; 
        }
        $http.post($scope.base + 'Create', payload, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
            .then(function () { Swal.fire({ title: 'Operación Correcta', icon: 'success' }); $scope.ModelReadAll(); })
            .catch(function (err) { Swal.fire({ title: 'Operación Incorrecta', text: msgError(err), icon: 'error' }); });
    };

    $scope.ModelRead = function (id) {
        $http.get($scope.base + 'get/' + id)
            .then(function (res) {
                var it = Array.isArray(res.data) ? res.data[0] : res.data;
                if (!it) return;
                $scope.view_nombre = it.nombre || '';
                $scope.view_descripcion = it.descripcion || '';
            })
            .catch(function () { Swal.fire({ title: 'Ha ocurrido un error', text: 'Api no presente', icon: 'error' }); });
    };

    $scope.ModelReadAll = function () {
        $scope.dataset = [];
        $scope.searchText = '';
        $scope.ViewAction = 'Lista de Items';
        $scope.view_id = -1; $scope.view_nombre = ''; $scope.view_descripcion = '';
        console.log('ModelReadAll ejecutándose, searchText inicial:', $scope.searchText);
        $http.get($scope.base + 'getAll')
            .then(function (res) {
                $scope.dataset = Array.isArray(res.data) ? res.data : [];
                $scope.currentPage = 0;
                console.log('Datos cargados:', $scope.dataset.length, 'elementos');
                console.log('searchText después de cargar:', $scope.searchText);
            })
            .catch(function () { Swal.fire({ title: 'Ha ocurrido un error', text: 'Api no presente', icon: 'error' }); });
    };

    $scope.ModelUpdate = function (isValid, id, form) {
        if (!isValid) { touchAll(form); Swal.fire({ title: 'Validación', text: 'Completá Nombre y Descripción.', icon: 'warning' }); return; }
        var payload = { id: id, nombre: ($scope.view_nombre || '').trim(), descripcion: ($scope.view_descripcion || '').trim() };
        if (!payload.nombre || !payload.descripcion) { touchAll(form); Swal.fire({ title: 'Validación', text: 'Nombre y Descripción son obligatorios.', icon: 'warning' }); return; }
        $http.post($scope.base + 'Update', payload, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
            .then(function () { Swal.fire({ title: 'Operación Correcta', icon: 'success' }); $scope.ModelReadAll(); })
            .catch(function (err) { Swal.fire({ title: 'Operación Incorrecta', text: msgError(err), icon: 'error' }); });
    };

    $scope.ModelDelete = function (id) {
        Swal.fire({ title: 'Eliminar registro', text: '¿Desea eliminar el plan nutricional?', icon: 'warning', showCancelButton: true, confirmButtonText: 'OK', cancelButtonText: 'Cancelar' })
            .then(function (r) {
                if (!r.isConfirmed) return;
                $http.post($scope.base + 'Delete', { id: id }, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
                    .then(function () { Swal.fire({ title: 'Operación Correcta', icon: 'success' }); $scope.ModelReadAll(); })
                    .catch(function (err) { Swal.fire({ title: 'Operación Incorrecta', text: msgError(err), icon: 'error' }); });
            });
    };

    // -------- Vistas ----------
    $scope.ViewCreate = function () {
        $scope.ViewAction = 'Nuevo Plan';
        $scope.view_id = -1; $scope.view_nombre = ''; $scope.view_descripcion = '';
    };

    $scope.clearSearch = function () {
        console.log('clearSearch ejecutándose'); // Debug
        $scope.searchText = '';
        $scope.currentPage = 0;
    };
    $scope.ViewUpdate = function (id) { $scope.ViewAction = 'Editar Plan'; $scope.view_id = id; $scope.ModelRead(id); };
    $scope.ViewDelete = function (id) { $scope.ModelDelete(id); };
    $scope.ViewCancel = function () { $scope.ViewAction = 'Lista de Items'; $scope.view_id = -1; $scope.view_nombre = ''; $scope.view_descripcion = ''; };

    // -------- Init ----------
    $scope.ModelReadAll();
});
