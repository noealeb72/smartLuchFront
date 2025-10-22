// === SHIM defensivo para SweetAlert2 v11 ===
// Pegar arriba de menudeldia.js, antes de angular.module(...)
(function (w) {
    // Si no está cargado SweetAlert2, no hacemos nada.
    if (!w.Swal) return;

    // 1) Normalizar alias 'swal' (algunas libs viejas lo siguen llamando)
    if (!w.swal || typeof w.swal !== 'function') {
        w.swal = function () {
            // soportar: swal('titulo','texto','icon') y swal({ ... })
            if (arguments.length === 1 && typeof arguments[0] === 'object') {
                return w.Swal.fire(arguments[0]);
            }
            var args = Array.prototype.slice.call(arguments);
            var opt = {};
            if (args[0]) opt.title = args[0];
            if (args[1]) opt.text = args[1];
            if (args[2]) opt.icon = args[2]; // 'success' | 'error' | 'warning' | ...
            return w.Swal.fire(opt);
        };
    }

    // 2) Si alguien llama incorrectamente 'Swal({...})', lo redirigimos
    if (typeof w.Swal === 'function' && typeof w.Swal.fire === 'function') {
        var _Swal = w.Swal;
        // Creamos un proxy sólo si detectamos que intentan invocarlo como función
        try {
            // Esto lanzaría error si llamamos _Swal({}) aquí; no lo hacemos.
            // En su lugar, envolvemos en función segura:
            w.Swal = function () {
                // Soporta 'Swal({...})' pero llama a 'fire'
                if (arguments.length === 1 && typeof arguments[0] === 'object') {
                    return _Swal.fire(arguments[0]);
                }
                // Si viene (titulo, texto, icon) también lo convertimos
                var args = Array.prototype.slice.call(arguments);
                var opt = {};
                if (args[0]) opt.title = args[0];
                if (args[1]) opt.text = args[1];
                if (args[2]) opt.icon = args[2];
                return _Swal.fire(opt);
            };
            // Preservamos el método fire real
            w.Swal.fire = _Swal.fire.bind(_Swal);
            // (opcional) expone versión
            w.Swal.version = _Swal.version || w.Swal.version;
        } catch (e) {
            // si algo raro, no tocamos Swal
            w.Swal = _Swal;
        }
    }
})(window);

var app = angular.module('AngujarJS', []);

app.filter('startFrom', function () {
    return function (input, start) {
        start = +start; // parse to int
        return input ? input.slice(start) : input;
    }
});

app.filter('formatDateArg', function () {
    return function (input) {
        if (!input) return '';
        var date = ('' + input).split('-');
        if (date.length !== 3) return input;
        return date[2] + '/' + date[1] + '/' + date[0];
    }
});

app.controller('Menudeldia', function ($scope, $sce, $http, $window) {
    // Detecta si la pantalla es móvil
    $scope.isMobile = $window.innerWidth < 768;

    // Función touchAll para validación
    function touchAll(form) {
        if (!form) return;
        form.$setSubmitted && form.$setSubmitted();
        angular.forEach(form.$error, function (fields) {
            angular.forEach(fields, function (field) {
                field.$setTouched && field.$setTouched();
            });
        });
    }

    // Actualiza la propiedad isMobile cuando se cambia el tamaño de la ventana
    angular.element($window).bind('resize', function () {
        $scope.$apply(function () {
            $scope.isMobile = $window.innerWidth < 768;
        });
    });

    $scope.titulo = 'Menú del día';  // Título inicial
    $scope.base = 'http://localhost:8000/api/menudd/';

    //////////////// USER ////////////////
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

    // Filtros
    $scope.filtroPlanta = '';
    $scope.filtroCentro = '';
    $scope.filtroJerarquia = '';
    $scope.filtroProyecto = '';
    $scope.filtroPlato = '';
    $scope.filtroDesde = null;
    $scope.filtroHasta = null;
    $scope.filtroTurno = '';

    // Bases para combos
    $scope.basePlatos = 'http://localhost:8000/api/plato/';
    $scope.basePlantas = 'http://localhost:8000/api/planta/';
    $scope.baseCentros = 'http://localhost:8000/api/centrodecosto/';
    $scope.baseProyectos = 'http://localhost:8000/api/proyecto/';
    $scope.baseJerarquias = 'http://localhost:8000/api/jerarquia/';
    $scope.baseTurnos = 'http://localhost:8000/api/turno/';

    $scope.platos = '';
    $scope.plantas = '';
    $scope.centros = '';
    $scope.proyectos = '';
    $scope.jerarquias = '';
    $scope.turnos = '';

    // --- Utilidades de paginación usadas por la vista ---
    $scope.currentPage = 0;
    $scope.pageSize = 10;
    $scope.totalPages = 1;
    
    $scope.numberOfPages = function () {
        return Math.ceil(($scope.dataset || []).length / $scope.pageSize);
    };
    
    // Función para recalcular totalPages
    function updateTotalPages() {
        var filteredData = $scope.dataset || [];
        if ($scope.searchText) {
            filteredData = filteredData.filter(function(item) {
                return JSON.stringify(item).toLowerCase().indexOf($scope.searchText.toLowerCase()) !== -1;
            });
        }
        $scope.totalPages = Math.ceil(filteredData.length / $scope.pageSize);
        if ($scope.currentPage >= $scope.totalPages) {
            $scope.currentPage = Math.max(0, $scope.totalPages - 1);
        }
    }
    
    // Función para obtener datos filtrados
    $scope.getFilteredData = function() {
        var filteredData = $scope.dataset || [];
        if ($scope.searchText) {
            filteredData = filteredData.filter(function(item) {
                return JSON.stringify(item).toLowerCase().indexOf($scope.searchText.toLowerCase()) !== -1;
            });
        }
        return filteredData;
    };
    
    // Watcher para actualizar paginación cuando cambie el texto de búsqueda
    $scope.$watch('searchText', function() {
        updateTotalPages();
    });
    // La vista llama getNumber(totalPages): devolvemos un array con N elementos
    $scope.getNumber = function (n) {
        if (!n && n !== 0) {
            n = Math.ceil((($scope.dataset || []).length) / $scope.pageSize) || 0;
        }
        return new Array(n);
    };

    // ------------------- CRUD -------------------

    $scope.ModelCreate = function (isValid, form) {
        $scope.showValidationErrors = true;
        
        if (!isValid) {
            touchAll(form);
            
            // Recopilar campos faltantes
            var camposFaltantes = [];
            if (!$scope.view_turno || $scope.view_turno === '') camposFaltantes.push('Turno');
            if (!$scope.view_planta || $scope.view_planta === '') camposFaltantes.push('Planta');
            if (!$scope.view_centrodecosto || $scope.view_centrodecosto === '') camposFaltantes.push('Centro de costo');
            if (!$scope.view_jerarquia || $scope.view_jerarquia === '') camposFaltantes.push('Jerarquía');
            if (!$scope.view_proyecto || $scope.view_proyecto === '') camposFaltantes.push('Proyecto');
            if (!$scope.view_cantidad || $scope.view_cantidad === '' || $scope.view_cantidad < 1 || !/^[1-9][0-9]*$/.test($scope.view_cantidad)) camposFaltantes.push('Cantidad');
            if (!$scope.view_fechadeldia || $scope.view_fechadeldia === '') camposFaltantes.push('Fecha del día');
            if (!$scope.view_plato || $scope.view_plato === '') camposFaltantes.push('Plato');
            
            if ($window.Swal && typeof $window.Swal.fire === 'function') {
                $window.Swal.fire({
                    title: 'Completar campos requeridos',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#495057',
                    buttonsStyling: true
                });
            }
            return;
        }

        // debería ser automático //
        $scope.view_turno = $window.document.getElementById('view_turno').value;
        $scope.view_planta = $window.document.getElementById('view_planta').value;
        $scope.view_jerarquia = $window.document.getElementById('view_jerarquia').value;
        $scope.view_centrodecosto = $window.document.getElementById('view_centrodecosto').value;
        $scope.view_proyecto = $window.document.getElementById('view_proyecto').value;
        $scope.view_plato = $window.document.getElementById('view_plato').value;
        $scope.view_cantidad = Math.max(1, parseInt($window.document.getElementById('view_cantidad').value) || 1);
        $scope.view_fechadeldia = $window.document.getElementById('view_fechadeldia').value;
        //

        var jsonForm = {
            turno: $scope.view_turno,
            planta: $scope.view_planta,
            centrodecosto: $scope.view_centrodecosto,
            jerarquia: $scope.view_jerarquia,
            proyecto: $scope.view_proyecto,
            plato: $scope.view_plato,
            estado: '-',
            cantidad: $scope.view_cantidad,
            fechadeldia: $scope.view_fechadeldia
        };

        $http({
            method: 'post',
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": ""
            },
            url: $scope.base + 'Create',
            data: jsonForm
        }).then(function () {
            $window.Swal && $window.Swal.fire({ title: 'Operación Correcta', icon: 'success' });
            $scope.ModelReadAll();
        }, function (error) {
            $window.Swal && $window.Swal.fire({ title: 'Operación Incorrecta', text: ('' + error), icon: 'error' });
        });
    };

    $scope.ModelRead = function (view_id) {
        $http.get($scope.base + 'get/' + view_id)
            .success(function (data) {
                var aux = (data[0].fechadeldia || '').split('-');
                var fecha = aux.length === 3 ? new Date(aux[0], aux[1] - 1, aux[2]) : '';

                $scope.view_turno = data[0].turno;
                $scope.view_planta = data[0].planta;
                $scope.view_centrodecosto = data[0].centrodecosto;
                $scope.view_jerarquia = data[0].jerarquia;
                $scope.view_proyecto = data[0].proyecto;
                $scope.view_plato = data[0].plato;
                $scope.view_cantidad = data[0].cantidad;
                $scope.view_comandas = data[0].comandas;
                $scope.view_despachado = data[0].despachado;
                $scope.view_fechadeldia = fecha;
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'API no presente', icon: 'error' });
            });
    };

    $scope.ModelReadAll = function () {
        $scope.dataset = [];
        $scope.searchKeyword;
        $scope.ViewAction = 'Lista de Items';
        $scope.view_id = -1;
        $scope.view_turno = '';
        $scope.view_planta = '';
        $scope.view_centrodecosto = '';
        $scope.view_jerarquia = '';
        $scope.view_proyecto = '';
        $scope.view_plato = '';
        $scope.view_estado = '';
        $scope.view_cantidad = 1;
        $scope.view_comandas = '';
        $scope.view_despachado = '';
        $scope.view_fechadeldia = (new Date()).toISOString().split('T')[0];

        $http.get($scope.base + 'getAll')
            // $http.get($scope.base + 'GetToday') // solo trae el menu del día
            .success(function (data) {
                $scope.dataset = data;
                // opcional: reset de página si el dataset cambió
                $scope.currentPage = 0;
                updateTotalPages();
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'API no presente', icon: 'error' });
            });
    };

    $scope.ModelUpdate = function (isValid, view_id, form) {
        $scope.showValidationErrors = true;
        
        if (!isValid) {
            touchAll(form);
            
            // Recopilar campos faltantes
            var camposFaltantes = [];
            if (!$scope.view_turno || $scope.view_turno === '') camposFaltantes.push('Turno');
            if (!$scope.view_planta || $scope.view_planta === '') camposFaltantes.push('Planta');
            if (!$scope.view_centrodecosto || $scope.view_centrodecosto === '') camposFaltantes.push('Centro de costo');
            if (!$scope.view_jerarquia || $scope.view_jerarquia === '') camposFaltantes.push('Jerarquía');
            if (!$scope.view_proyecto || $scope.view_proyecto === '') camposFaltantes.push('Proyecto');
            if (!$scope.view_cantidad || $scope.view_cantidad === '' || $scope.view_cantidad < 1 || !/^[1-9][0-9]*$/.test($scope.view_cantidad)) camposFaltantes.push('Cantidad');
            if (!$scope.view_fechadeldia || $scope.view_fechadeldia === '') camposFaltantes.push('Fecha del día');
            if (!$scope.view_plato || $scope.view_plato === '') camposFaltantes.push('Plato');
            
            if ($window.Swal && typeof $window.Swal.fire === 'function') {
                $window.Swal.fire({
                    title: 'Completar campos requeridos',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#495057',
                    buttonsStyling: true
                });
            }
            return;
        }

        // debería ser automático 
        $scope.view_turno = $window.document.getElementById('view_turno').value;
        $scope.view_planta = $window.document.getElementById('view_planta').value;
        $scope.view_centrodecosto = $window.document.getElementById('view_centrodecosto').value;
        $scope.view_jerarquia = $window.document.getElementById('view_jerarquia').value;
        $scope.view_proyecto = $window.document.getElementById('view_proyecto').value;
        $scope.view_plato = $window.document.getElementById('view_plato').value;
        $scope.view_estado = '-';
        $scope.view_cantidad = Math.max(1, parseInt($window.document.getElementById('view_cantidad').value) || 1);
        $scope.view_fechadeldia = $window.document.getElementById('view_fechadeldia').value;
        //

        var jsonForm = {
            id: view_id,
            turno: $scope.view_turno,
            planta: $scope.view_planta,
            centrodecosto: $scope.view_centrodecosto,
            jerarquia: $scope.view_jerarquia,
            proyecto: $scope.view_proyecto,
            plato: $scope.view_plato,
            estado: $scope.view_estado,
            despachado: $scope.view_despachado,
            comandas: $scope.view_comandas,
            cantidad: $scope.view_cantidad,
            fechadeldia: $scope.view_fechadeldia
        };

        $http({
            method: 'post',
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": ""
            },
            url: $scope.base + 'Update',
            data: jsonForm
        }).then(function () {
            $window.Swal && $window.Swal.fire({ title: 'Operación Correcta', icon: 'success' });
            $scope.ModelReadAll();
        }, function (error) {
            $window.Swal && $window.Swal.fire({ title: 'Operación Incorrecta', text: ('' + error), icon: 'error' });
        });
    };

    $scope.ModelDelete = function (view_id) {
        var jsonForm = { id: view_id };

        $http({
            method: 'post',
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": ""
            },
            url: $scope.base + 'Delete',
            data: jsonForm
        }).then(function () {
            $window.Swal && $window.Swal.fire({ title: 'Operación Correcta', icon: 'success' });
            $scope.ModelReadAll();
        }, function (error) {
            $window.Swal && $window.Swal.fire({ title: 'Operación Incorrecta', text: ('' + error), icon: 'error' });
        });
    };

    // -------------- Acciones de Vista --------------

    $scope.ViewCreate = function () {
        $scope.ViewAction = 'Nuevo Menú';
        $scope.view_id = -1;
        $scope.showValidationErrors = false;
        $scope.isEditMode = false;
        $scope.view_turno = '';
        $scope.view_planta = '';
        $scope.view_centrodecosto = '';
        $scope.view_jerarquia = '';
        $scope.view_proyecto = '';
        $scope.view_plato = '';
        $scope.view_estado = '';
        $scope.view_cantidad = 1;
        $scope.view_fechadeldia = new Date();

        $scope.ModelReadPlatos();
        $scope.ModelReadPlantas();
        $scope.ModelReadCentros();
        $scope.ModelReadProyectos();
        $scope.ModelReadJerarquias();
        $scope.ModelReadTurnos();
    };

    $scope.ModelReadPlatos = function () {
        $http.get($scope.basePlatos + 'getAll')
            .success(function (data) {
                $scope.platos = data;
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'Error al obtener platos', icon: 'error' });
            });
    };

    $scope.ModelReadPlantas = function () {
        $http.get($scope.basePlantas + 'getAll')
            .success(function (data) {
                $scope.plantas = data;
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'Error al obtener plantas', icon: 'error' });
            });
    };

    $scope.ModelReadCentros = function () {
        $http.get($scope.baseCentros + 'getAll')
            .success(function (data) {
                $scope.centros = data;
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'Error al obtener centros de costo', icon: 'error' });
            });
    };

    $scope.ModelReadProyectos = function () {
        $http.get($scope.baseProyectos + 'getAll')
            .success(function (data) {
                $scope.proyectos = data;
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'Error al obtener proyectos', icon: 'error' });
            });
    };

    $scope.ModelReadJerarquias = function () {
        $http.get($scope.baseJerarquias + 'getAll')
            .success(function (data) {
                $scope.jerarquias = data;
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'Error al obtener jerarquías', icon: 'error' });
            });
    };

    $scope.ModelReadTurnos = function () {
        $http.get($scope.baseTurnos + 'getAll')
            .success(function (data) {
                $scope.turnos = data;
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'Error al obtener turnos', icon: 'error' });
            });
    };

    $scope.ViewUpdate = function (view_id) {
        $scope.ViewAction = 'Editar Menú';
        $scope.view_id = view_id;
        $scope.showValidationErrors = false;
        $scope.ModelRead(view_id);
        $scope.ModelReadPlatos();
        $scope.ModelReadPlantas();
        $scope.ModelReadCentros();
        $scope.ModelReadProyectos();
        $scope.ModelReadJerarquias();
        $scope.ModelReadTurnos();
        
        // Marcar que estamos en modo edición para los select
        $scope.isEditMode = true;
    };

    $scope.ViewDelete = function (view_id, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if ($window.Swal && typeof $window.Swal.fire === 'function') {
            $window.Swal.fire({
                title: 'Baja registro',
                text: '¿Desea dar de baja el plato?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                allowOutsideClick: false
            }).then((res) => {
                if (res.isConfirmed) {
                    $scope.$applyAsync(() => $scope.ModelDelete(view_id));
                }
            });
        } else {
            if ($window.confirm('¿Desea dar de baja el plato?')) {
                $scope.ModelDelete(view_id);
            }
        }
    };

    $scope.ViewActive = function (view_id, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if ($window.Swal && typeof $window.Swal.fire === 'function') {
            $window.Swal.fire({
                title: '¿Activar menú?',
                text: 'Este menú volverá a estar disponible.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, activar',
                cancelButtonText: 'Cancelar',
                allowOutsideClick: false
            }).then((res) => {
                if (res.isConfirmed) {
                    $http.post($scope.base + 'Activate', { id: view_id })
                        .then(() => {
                            $window.Swal && $window.Swal.fire({ title: 'Menú activado correctamente', icon: 'success' });
                            $scope.ModelReadAll();
                        })
                        .catch((error) => {
                            $window.Swal && $window.Swal.fire({ title: 'Error', text: 'No se pudo activar el menú', icon: 'error' });
                            console.error(error);
                        });
                }
            });
        } else {
            if ($window.confirm('¿Activar menú?')) {
                $http.post($scope.base + 'Activate', { id: view_id })
                    .then(() => {
                        $window.Swal && $window.Swal.fire({ title: 'Menú activado correctamente', icon: 'success' });
                        $scope.ModelReadAll();
                    })
                    .catch((error) => {
                        $window.Swal && $window.Swal.fire({ title: 'Error', text: 'No se pudo activar el menú', icon: 'error' });
                        console.error(error);
                    });
            }
        }
    };

    // --- Filtros ---
    $scope.filtrarMenu = function () {
        const params = [];

        if ($scope.filtroPlanta) params.push('planta=' + encodeURIComponent($scope.filtroPlanta));
        if ($scope.filtroCentro) params.push('centro=' + encodeURIComponent($scope.filtroCentro));
        if ($scope.filtroJerarquia) params.push('jerarquia=' + encodeURIComponent($scope.filtroJerarquia));
        if ($scope.filtroProyecto) params.push('proyecto=' + encodeURIComponent($scope.filtroProyecto));
        if ($scope.filtroPlato) params.push('plato=' + encodeURIComponent($scope.filtroPlato));
        if ($scope.filtroTurno) params.push('turno=' + encodeURIComponent($scope.filtroTurno));
        if ($scope.filtroDesde) params.push('desde=' + $scope.filtroDesde);
        if ($scope.filtroHasta) params.push('hasta=' + $scope.filtroHasta);

        if (params.length === 0) {
            $window.Swal && $window.Swal.fire({ title: 'Filtros requeridos', text: 'Seleccioná al menos un filtro', icon: 'warning' });
            return;
        }

        const url = $scope.base + 'Filtrar?' + params.join('&');

        $http.get(url)
            .then(response => {
                $scope.dataset = response.data;
                $scope.currentPage = 0;
                updateTotalPages();
            })
            .catch(error => {
                $window.Swal && $window.Swal.fire({ title: 'Error', text: 'No se pudo obtener el menú filtrado', icon: 'error' });
                console.error(error);
            });
    };

    $scope.limpiarFiltros = function () {
        $scope.filtroPlanta = '';
        $scope.filtroCentro = '';
        $scope.filtroJerarquia = '';
        $scope.filtroProyecto = '';
        $scope.filtroPlato = '';
        $scope.filtroDesde = null;
        $scope.filtroHasta = null;
        $scope.filtroTurno = '';
        $scope.ModelReadAll(); // Vuelve a cargar sin filtro
    };

    $scope.ViewCancel = function () {
        $scope.ViewAction = 'Lista de Items';
    };

    // --- Init ---
    $scope.ModelReadAll();
    $scope.ModelReadPlatos();
    $scope.ModelReadPlantas();
    $scope.ModelReadCentros();
    $scope.ModelReadProyectos();
    $scope.ModelReadJerarquias();
    $scope.ModelReadTurnos();

    // dummy data (no usado para render real)
    $scope.data = [];
    for (var i = 0; i < 45; i++) {
        $scope.data.push("Item " + i);
    }
});
