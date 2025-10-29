// =========================
// SweetAlert2 alias seguro
// (no reescribe Swal; solo crea "Swal.fire(...)" para compatibilidad)
// =========================
(function (w) {
    if (!w.Swal || typeof w.Swal.fire !== 'function') return;
    if (!w.Swal.fire || typeof w.Swal.fire !== 'function') {
        w.Swal.fire = function () {
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

// =========================
// App AngularJS
// =========================
var app = angular.module('AngujarJS', ['base64', 'ngMessages']);

app.filter('startFrom', function () {
    return function (input, start) {
        if (!Array.isArray(input)) return input;
        start = +start || 0;
        return input.slice(start);
    };
});

app.controller('Plato', function ($scope, $http, $window, $base64, $timeout) {
    // --------- Estado base ---------
    $scope.titulo = 'Gestión de Platos';
    $scope.base = 'http://localhost:8000/api/plato/';
    $scope.basePlan = 'http://localhost:8000/api/plannutricional/';

    $scope.dataset = [];
    $scope.filteredData = null;
    $scope.planes = [];
    $scope.showValidationErrors = false;

    // filtros
    $scope.filtroCostoMin = null;
    $scope.filtroCostoMax = null;
    $scope.filtroPlan = '';
    $scope.filtroEstado = '';

    // paginación
    $scope.currentPage = 0;
    $scope.pageSize = 20;
    $scope.totalPages = 1;

    // responsivo (para ocultar columnas en mobile)
    $scope.isMobile = $window.innerWidth < 768;
    angular.element($window).on('resize', function () {
        $scope.$applyAsync(function () {
            $scope.isMobile = $window.innerWidth < 768;
        });
    });

    // Datos de usuario desde localStorage (si los necesitás en headers, etc.)
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

    // --------- Helpers ---------
    function fireOk(title, text) {
        // Popup de alert eliminado
        console.log('Éxito:', title || 'Operación Correcta', text || '');
    }
    function fireErr(title, text) {
        // Popup de alert eliminado
        console.log('Error:', title || 'Operación Incorrecta', text || '');
    }
    function fireWarn(title, text) {
        // Popup de alert eliminado
        console.log('Advertencia:', title || 'Atención', text || '');
    }

    $scope.getNumber = function (n) {
        return new Array(n);
    };

    function recomputePages() {
        var arr = ($scope.filteredData || $scope.dataset) || [];
        var len = Array.isArray(arr) ? arr.length : 0;
        $scope.totalPages = Math.max(1, Math.ceil(len / $scope.pageSize));
        if ($scope.currentPage >= $scope.totalPages) {
            $scope.currentPage = $scope.totalPages - 1;
        }
    }

    // Recalcular paginación al cambiar dataset/filteredData/pageSize
    $scope.$watchGroup(['dataset.length', 'filteredData.length', 'pageSize'], function () {
        recomputePages();
    });

    // --------- CRUD ---------
    $scope.ModelCreate = function (isValid) {
        console.log('ModelCreate - isValid:', isValid);
        
        if (!isValid) {
            // Primero mostrar el popup
            Swal.fire({
                title: 'Completar campos requeridos',
                text: '',
                icon: 'warning',
                showCancelButton: false,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#343A40',
                buttonsStyling: true
            }).then(() => {
                // Después del popup, mostrar las leyendas rojas
                $scope.showValidationErrors = true;
                console.log('ModelCreate - showValidationErrors establecido en true después del popup');
                $scope.$apply();
            });
            return;
        }

        var jsonForm = {
            codigo: $scope.plato.codigo,
            ingredientes: $scope.plato.ingredientes,
            plannutricional: $scope.plato.plannutricional,
            descripcion: $scope.plato.descripcion,
            costo: $scope.plato.costo || 0,
            presentacion: $scope.view_previewImage || ''
        };

        $http.post($scope.base + 'Create', jsonForm)
            .then(function () {
                fireOk('Plato creado', 'El plato ha sido creado correctamente.');
                $scope.ModelReadAll();
            })
            .catch(function (err) {
                console.error(err);
                fireErr('Error al crear', 'No se pudo crear el plato.');
            });
    };

    $scope.ModelRead = function (view_id) {
        $http.get($scope.base + 'get/' + view_id)
            .then(function (resp) {
                var d = (resp.data && resp.data[0]) || {};
                $scope.plato = {
                    codigo: d.codigo,
                    ingredientes: d.ingredientes,
                    plannutricional: d.plannutricional,
                    descripcion: d.descripcion,
                    costo: d.costo,
                    presentacion: d.presentacion
                };
                $scope.view_previewImage = d.presentacion || '';
            })
            .catch(function () {
                fireErr('Ha ocurrido un error', 'Api no presente');
            });
    };

    $scope.ModelReadAll = function () {
        $scope.ViewAction = 'Platos';
        $scope.plato = {};
        $scope.view_previewImage = '';
        $scope.filteredData = null;
        $http.get($scope.base + 'getAll')
            .then(function (resp) {
                $scope.dataset = Array.isArray(resp.data) ? resp.data : [];
                recomputePages();
            })
            .catch(function () {
                fireErr('Ha ocurrido un error', 'Api no presente');
            });
    };

    $scope.ModelUpdate = function (isValid, view_id) {
        console.log('ModelUpdate - isValid:', isValid);
        
        if (!isValid) {
            // Primero mostrar el popup
            Swal.fire({
                title: 'Completar campos requeridos',
                text: '',
                icon: 'warning',
                showCancelButton: false,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#343A40',
                buttonsStyling: true
            }).then(() => {
                // Después del popup, mostrar las leyendas rojas
                $scope.showValidationErrors = true;
                console.log('ModelUpdate - showValidationErrors establecido en true después del popup');
                $scope.$apply();
            });
            return;
        }

        var jsonForm = {
            id: view_id,
            codigo: $scope.plato.codigo,
            ingredientes: $scope.plato.ingredientes,
            plannutricional: $scope.plato.plannutricional,
            descripcion: $scope.plato.descripcion,
            costo: $scope.plato.costo || 0,
            presentacion: $scope.view_previewImage || ''
        };

        $http.post($scope.base + 'Update', jsonForm)
            .then(function () {
                fireOk('Plato actualizado', 'Los cambios fueron guardados.');
                $scope.ModelReadAll();
                $scope.ViewAction = 'Platos';
                $scope.titulo = 'Gestión de Platos';
            })
            .catch(function () {
                fireErr('Error al actualizar', 'No se pudo actualizar el plato.');
            });
    };

    $scope.ModelDelete = function (view_id) {
        $http.post($scope.base + 'Delete', { id: view_id })
            .then(function () {
                fireOk('Registro eliminado', '');
                $scope.ModelReadAll();
            })
            .catch(function (err) {
                console.error(err);
                fireErr('Operación Incorrecta', 'Error al eliminar el plato.');
            });
    };

    $scope.ModelReadPlanes = function () {
        $http.get($scope.basePlan + 'getAll')
            .then(function (resp) {
                $scope.planes = Array.isArray(resp.data) ? resp.data : [];
                
                // Ordenar alfabéticamente
                if ($scope.planes && $scope.planes.length > 0) {
                    $scope.planes.sort(function(a, b) {
                        return a.nombre.localeCompare(b.nombre);
                    });
                    
                    // Si estamos en modo "Nuevo Plato" y no hay valor seleccionado, seleccionar el primero
                    if ($scope.ViewAction === 'Nuevo Plato' && (!$scope.plato.plannutricional || $scope.plato.plannutricional === '')) {
                        $scope.plato.plannutricional = $scope.planes[0].nombre;
                        console.log('Plan Nutricional seleccionado por defecto:', $scope.plato.plannutricional);
                    }
                }
            })
            .catch(function () {
                fireErr('Error', 'Error al obtener planes nutricionales.');
            });
    };

    // --------- Vistas ---------
    $scope.ViewCreate = function () {
        $scope.ViewAction = 'Nuevo Plato';
        $scope.titulo = 'Agregar nuevo plato';
        $scope.showValidationErrors = false;
        $scope.plato = {
            codigo: '', descripcion: '', ingredientes: '',
            plannutricional: '', costo: 0.00, presentacion: ''
        };
        $scope.view_id = -1;
        $scope.view_previewImage = '';
        $scope.ModelReadPlanes();
        
        // Asegurar que se seleccione el primer plan nutricional después de cargar
        setTimeout(function() {
            if ($scope.planes && $scope.planes.length > 0 && (!$scope.plato.plannutricional || $scope.plato.plannutricional === '')) {
                $scope.plato.plannutricional = $scope.planes[0].nombre;
                console.log('Plan Nutricional establecido por defecto en ViewCreate:', $scope.plato.plannutricional);
                $scope.$apply();
            }
        }, 300);
    };

    $scope.ViewUpdate = function (view_id) {
        $scope.ViewAction = 'Editar Plato';
        $scope.titulo = 'Modificar plato';
        $scope.showValidationErrors = true;
        $scope.view_id = view_id;
        $scope.ModelRead(view_id);
        $scope.ModelReadPlanes();
    };

    $scope.ViewDelete = function (view_id, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        Swal.fire({
            title: 'Baja registro',
            text: 'Desea eliminar plato?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#343A40',
            cancelButtonColor: '#dc3545',
            buttonsStyling: true
        }).then((result) => {
            if (result.isConfirmed) {
                $scope.ModelDelete(view_id);
            }
        });
    };

    $scope.ViewCancel = function () {
        $scope.ViewAction = 'Platos';
        $scope.titulo = 'Gestión de Platos';
        $scope.showValidationErrors = true;
    };

    // --------- Imagen (preview/base64) ---------
    $scope.view_previewImage = '';
    $scope.loadImage = function () {
        var input = document.getElementById('view_file');
        var file = input && input.files ? input.files[0] : null;
        if (!file) return;

        var reader = new FileReader();
        reader.onloadend = function () {
            $scope.$applyAsync(function () {
                $scope.view_previewImage = reader.result;
                if (!$scope.plato) $scope.plato = {};
                $scope.plato.presentacion = reader.result;
            });
        };
        reader.readAsDataURL(file);
    };

    // --------- Filtros ---------
    $scope.filtrarPlatos = function () {
        var params = [];

        if ($scope.filtroCostoMin != null && $scope.filtroCostoMin !== '') {
            params.push('costoMin=' + encodeURIComponent($scope.filtroCostoMin));
        }
        if ($scope.filtroCostoMax != null && $scope.filtroCostoMax !== '') {
            params.push('costoMax=' + encodeURIComponent($scope.filtroCostoMax));
        }
        if ($scope.filtroPlan) {
            params.push('plannutricional=' + encodeURIComponent($scope.filtroPlan));
        }
        if ($scope.filtroEstado) {
            params.push('estado=' + encodeURIComponent($scope.filtroEstado));
        }

        if (params.length === 0) {
            return fireWarn('Filtros requeridos', 'Seleccioná al menos un filtro.');
        }

        var url = $scope.base + 'filtrar?' + params.join('&');
        $http.get(url)
            .then(function (resp) {
                $scope.filteredData = Array.isArray(resp.data) ? resp.data : [];
                $scope.currentPage = 0;
                recomputePages();
            })
            .catch(function () {
                fireErr('Error', 'No se pudieron obtener los platos filtrados.');
            });
    };

    $scope.limpiarFiltros = function () {
        $scope.filtroCostoMin = null;
        $scope.filtroCostoMax = null;
        $scope.filtroPlan = '';
        $scope.filtroEstado = '';
        $scope.filteredData = null;
        $scope.currentPage = 0;
        recomputePages();
    };

    // --------- Init ---------
    $scope.ModelReadAll();
    $scope.ModelReadPlanes();
});
