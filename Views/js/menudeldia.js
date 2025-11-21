// === SHIM defensivo para SweetAlert2 v11 ===
// Pegar arriba de menudeldia.js, antes de angular.module(...)
(function (w) {
    // Si no está cargado SweetAlert2, no hacemos nada.
    if (!w.Swal) return;

    // 1) Normalizar alias 'Swal.fire' (algunas libs viejas lo siguen llamando)
    if (!w.Swal.fire || typeof w.Swal.fire !== 'function') {
        w.Swal.fire = function () {
            // soportar: Swal.fire('titulo','texto','icon') y Swal.fire({ ... })
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

app.controller('Menudeldia', function ($scope, $sce, $http, $window, $timeout) {
    // Inicializar fecha por defecto en formato YYYY-MM-DD para input type="date"
    var fechaHoy = new Date();
    var year = fechaHoy.getFullYear();
    var month = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    var day = String(fechaHoy.getDate()).padStart(2, '0');
    $scope.view_fechadeldia = year + '-' + month + '-' + day;
    
    // Inicializar flag para controlar cuando mostrar el error de fecha
    $scope.fechadeldiaTouched = false;
    
    // -------- Loading State ----------
    $scope.isLoading = true;
    
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

    // Siempre usar puerto 8000, detectando el hostname automáticamente
    function getApiBaseUrl() {
        var protocol = window.location.protocol;
        var hostname = window.location.hostname;
        return protocol + '//' + hostname + ':8000';
    }
    var apiBaseUrl = getApiBaseUrl();
    
    $scope.titulo = 'Menú del día';  // Título inicial
    $scope.base = apiBaseUrl + '/api/menudd/';

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
    
    // Debounced filter function
    $scope.debouncedFilter = window.debounce ? window.debounce(function() {
        // Trigger digest cycle
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }, 300) : function() {};

    // Bases para combos
    $scope.basePlatos = apiBaseUrl + '/api/plato/';
    $scope.basePlantas = apiBaseUrl + '/api/planta/';
    $scope.baseCentros = apiBaseUrl + '/api/centrodecosto/';
    $scope.baseProyectos = apiBaseUrl + '/api/proyecto/';
    $scope.baseJerarquias = apiBaseUrl + '/api/jerarquia/';
    $scope.baseTurnos = apiBaseUrl + '/api/turno/';
    $scope.baseMenu = apiBaseUrl + '/api/menudd/';

    $scope.platos = '';
    $scope.plantas = '';
    $scope.centros = '';
    $scope.proyectos = '';
    $scope.jerarquias = '';
    $scope.turnos = '';

    // --- Utilidades de paginación usadas por la vista ---
    $scope.currentPage = 0;
    // Inicializar pageSize como número 5 explícitamente
    $scope.pageSize = 5; // Por defecto 5 filas (número)
    $scope.totalPages = 1;
    $scope.searchText = ''; // Inicializar searchText
    
    // Asegurar que pageSize esté correctamente inicializado después de que AngularJS cargue
    $timeout(function() {
        if (!$scope.pageSize || $scope.pageSize !== 5) {
            $scope.pageSize = 5;
        }
    }, 0);
    
    $scope.numberOfPages = function () {
        var arr = $scope.getFilteredDataset() || [];
        var len = Array.isArray(arr) ? arr.length : 0;
        var pages = Math.ceil(len / $scope.pageSize);
        return Math.max(1, pages); // Siempre devolver al menos 1 página
    };

    // Funciones para paginación tipo DataTable (igual que reportegcomensales)
    $scope.getPageNumbers = function() {
        var pages = [];
        var totalPages = $scope.numberOfPages();
        var current = $scope.currentPage;
        
        // Asegurar que totalPages sea al menos 1
        if (totalPages < 1) {
            totalPages = 1;
        }
        
        // Asegurar que current no exceda totalPages
        if (current >= totalPages) {
            current = Math.max(0, totalPages - 1);
            $scope.currentPage = current;
        }
        
        if (totalPages <= 7) {
            // Si hay 7 páginas o menos, mostrar todas
            for (var i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Lógica para mostrar páginas con puntos suspensivos
            if (current <= 3) {
                // Estamos cerca del inicio
                for (var i = 0; i < 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages - 1);
            } else if (current >= totalPages - 4) {
                // Estamos cerca del final
                pages.push(0);
                pages.push('...');
                for (var i = totalPages - 5; i < totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Estamos en el medio
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

    // Función para ir a una página específica
    $scope.goToPage = function(page) {
        if (page >= 0 && page < $scope.numberOfPages()) {
            $scope.currentPage = page;
        }
    };

    // Función para cambiar el tamaño de página
    $scope.changePageSize = function(newSize) {
        // Convertir a número y asegurar que sea válido
        // Si viene como string del select, convertirlo a número
        var newPageSize = typeof newSize === 'string' ? parseInt(newSize, 10) : parseInt(newSize, 10);
        if (isNaN(newPageSize) || newPageSize < 1) {
            newPageSize = 5; // Valor por defecto si es inválido
        }
        $scope.pageSize = newPageSize;
        $scope.currentPage = 0; // Volver a la primera página
        updateTotalPages(); // Recalcular totalPages después de cambiar el tamaño
    };
    
    // Función para obtener datos filtrados (igual que en el HTML)
    $scope.getFilteredDataset = function() {
        var filteredData = $scope.dataset || [];
        // Aplicar el mismo filtro que se usa en el HTML (filter:searchText)
        if ($scope.searchText && $scope.searchText.trim() !== '') {
            var searchLower = $scope.searchText.toLowerCase();
            filteredData = filteredData.filter(function(item) {
                // Buscar en todos los campos del objeto
                var itemStr = JSON.stringify(item).toLowerCase();
                return itemStr.indexOf(searchLower) !== -1;
            });
        }
        return filteredData;
    };
    
    // Función para recalcular totalPages
    function updateTotalPages() {
        // Usar la misma función de filtrado que se usa en el HTML
        var filteredData = $scope.getFilteredDataset();
        var totalItems = filteredData.length;
        
        // Calcular totalPages basándose en el dataset filtrado
        if (totalItems === 0) {
            $scope.totalPages = 1;
        } else {
            $scope.totalPages = Math.ceil(totalItems / $scope.pageSize);
        }
        
        // Asegurar que totalPages sea al menos 1
        if ($scope.totalPages < 1) {
            $scope.totalPages = 1;
        }
        
        // Ajustar currentPage si es necesario
        if ($scope.currentPage >= $scope.totalPages && $scope.totalPages > 0) {
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
    
    // Variables para filtros avanzados
    $scope.filtrosExpandidos = false;
    $scope.filtrosActivos = false;
    $scope.filtroFechaDesde = '';
    $scope.filtroPlato = '';
    $scope.filtroCentroCosto = '';
    $scope.filtroProyecto = '';
    $scope.filtroPlanta = '';
    $scope.filtroTurno = '';
    $scope.filtroJerarquia = '';
    $scope.filtroEstado = '';
    
    // Variables para popup de platos
    $scope.platosDisponibles = [];
    $scope.busquedaPlato = '';
    $scope.modoSeleccionPlato = 'filtro'; // 'filtro' o 'formulario'
    
    // Función para alternar la visibilidad de los filtros
    $scope.toggleFiltros = function() {
        $scope.filtrosExpandidos = !$scope.filtrosExpandidos;
    };
    
    // Función para abrir popup de platos (para filtro)
    $scope.abrirPopupPlatos = function() {
        $scope.modoSeleccionPlato = 'filtro';
        cargarPlatosYMostrarModal();
    };
    
    // Función para abrir popup de platos (para formulario)
    $scope.abrirPopupPlatosFormulario = function() {
        $scope.modoSeleccionPlato = 'formulario';
        cargarPlatosYMostrarModal();
    };
    
    // Función auxiliar para cargar platos y mostrar modal
    var cargarPlatosYMostrarModal = function() {
        // Cargar platos disponibles
        $http.get($scope.basePlatos + 'getAll')
            .success(function(data) {
                $scope.platosDisponibles = data;
                $scope.busquedaPlato = ''; // Limpiar búsqueda
                
                // Mostrar modal
                $('#modalSeleccionarPlato').modal('show');
            })
            .error(function(data, status) {
                $window.Swal && $window.Swal.fire({
                    title: 'Error',
                    text: 'Error al cargar la lista de platos: ' + (data || status),
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#F34949'
                });
            });
    };
    
    // Función de filtro personalizada para buscar platos por descripción, código o plan nutricional
    $scope.filtrarPlatos = function(plato) {
        if (!$scope.busquedaPlato || $scope.busquedaPlato.trim() === '') {
            return true;
        }
        var busqueda = $scope.busquedaPlato.toLowerCase().trim();
        var descripcion = (plato.descripcion || '').toLowerCase();
        var codigo = (plato.codigo || '').toLowerCase();
        var planNutricional = (plato.plannutricional || '').toLowerCase();
        return descripcion.indexOf(busqueda) !== -1 || 
               codigo.indexOf(busqueda) !== -1 || 
               planNutricional.indexOf(busqueda) !== -1;
    };
    
    // Función para seleccionar un plato
    $scope.seleccionarPlato = function(plato) {
        
        if ($scope.modoSeleccionPlato === 'formulario') {
            // Si estamos en modo formulario, actualizar el campo view_plato
            $scope.view_plato = plato.descripcion;
            
            // Forzar actualización del select si es necesario
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        } else {
            // Si estamos en modo filtro, actualizar el filtro
            $scope.filtroPlato = plato.descripcion;
        }
        
        $('#modalSeleccionarPlato').modal('hide');
    };
    
    // Función para verificar y corregir la fecha en modo edición
    $scope.verificarYCorregirFecha = function() {
        
        // Verificar si el campo de fecha está vacío o tiene un valor incorrecto
        var fechaField = document.getElementById('view_fechadeldia');
        if (fechaField) {
            var valorActual = fechaField.value;
            var valorScope = $scope.view_fechadeldia;
            
            
            // Si el campo está vacío pero el scope tiene valor, aplicar el valor del scope
            if ((!valorActual || valorActual === '') && valorScope) {
                fechaField.value = valorScope;
            }
            // Si el scope está vacío pero el campo tiene valor, actualizar el scope
            else if (valorActual && (!valorScope || valorScope === '')) {
                $scope.view_fechadeldia = valorActual;
            }
            // Si ambos están vacíos, usar fecha actual
            else if ((!valorActual || valorActual === '') && (!valorScope || valorScope === '')) {
                var hoy = new Date();
                var year = hoy.getFullYear();
                var month = String(hoy.getMonth() + 1).padStart(2, '0');
                var day = String(hoy.getDate()).padStart(2, '0');
                var fechaHoy = year + '-' + month + '-' + day;
                
                $scope.view_fechadeldia = fechaHoy;
                fechaField.value = fechaHoy;
            }
        }
    };
    
    // Función de filtro avanzado
    $scope.filtroAvanzado = function(item) {
        // Filtro de fecha desde
        if ($scope.filtroFechaDesde && $scope.filtroFechaDesde.trim() !== '') {
            var fechaItem = new Date(item.fechadeldia);
            var fechaDesde = new Date($scope.filtroFechaDesde);
            if (isNaN(fechaItem.getTime()) || fechaItem < fechaDesde) {
                return false;
            }
        }
        
        // Filtro de fecha hasta
        if ($scope.filtroFechaHasta && $scope.filtroFechaHasta.trim() !== '') {
            var fechaItem = new Date(item.fechadeldia);
            var fechaHasta = new Date($scope.filtroFechaHasta);
            fechaHasta.setHours(23, 59, 59, 999);
            if (isNaN(fechaItem.getTime()) || fechaItem > fechaHasta) {
                return false;
            }
        }
        
        // Filtro de plato
        if ($scope.filtroPlato && $scope.filtroPlato.trim() !== '') {
            if (!item.plato || item.plato.toLowerCase().indexOf($scope.filtroPlato.toLowerCase()) === -1) {
                return false;
            }
        }
        
        // Filtro de centro de costo
        if ($scope.filtroCentroCosto && $scope.filtroCentroCosto.trim() !== '') {
            if (!item.centrodecosto || item.centrodecosto !== $scope.filtroCentroCosto) {
                return false;
            }
        }
        
        // Filtro de proyecto
        if ($scope.filtroProyecto && $scope.filtroProyecto.trim() !== '') {
            if (!item.proyecto || item.proyecto !== $scope.filtroProyecto) {
                return false;
            }
        }
        
        // Filtro de planta
        if ($scope.filtroPlanta && $scope.filtroPlanta.trim() !== '') {
            if (!item.planta || item.planta !== $scope.filtroPlanta) {
                return false;
            }
        }
        
        // Filtro de turno
        if ($scope.filtroTurno && $scope.filtroTurno.trim() !== '') {
            if (!item.turno || item.turno !== $scope.filtroTurno) {
                return false;
            }
        }
        
        // Filtro de jerarquía
        if ($scope.filtroJerarquia && $scope.filtroJerarquia.trim() !== '') {
            if (!item.jerarquia || item.jerarquia !== $scope.filtroJerarquia) {
                return false;
            }
        }
        
        // Filtro de estado
        if ($scope.filtroEstado && $scope.filtroEstado.trim() !== '') {
            var estadoItem = item.deletemark ? 'Baja' : 'Activo';
            if (estadoItem !== $scope.filtroEstado) {
                return false;
            }
        }
        
        return true;
    };
    
    // Función para aplicar filtros avanzados
    $scope.aplicarFiltrosAvanzados = function() {
        
        // Construir parámetros para la API
        var params = {};
        
        // Manejar fecha desde (puede ser Date object o string)
        if ($scope.filtroFechaDesde) {
            var fechaDesde = $scope.filtroFechaDesde;
            if (fechaDesde instanceof Date) {
                // Convertir Date a string YYYY-MM-DD
                var year = fechaDesde.getFullYear();
                var month = String(fechaDesde.getMonth() + 1).padStart(2, '0');
                var day = String(fechaDesde.getDate()).padStart(2, '0');
                params.desde = year + '-' + month + '-' + day;
            } else if (typeof fechaDesde === 'string' && fechaDesde.trim() !== '') {
                params.desde = fechaDesde;
            }
        }
        
        // Manejar campos de texto
        if ($scope.filtroPlato && $scope.filtroPlato.trim() !== '') {
            params.plato = $scope.filtroPlato;
        }
        if ($scope.filtroCentroCosto && $scope.filtroCentroCosto.trim() !== '') {
            params.centrodecosto = $scope.filtroCentroCosto;
        }
        if ($scope.filtroProyecto && $scope.filtroProyecto.trim() !== '') {
            params.proyecto = $scope.filtroProyecto;
        }
        if ($scope.filtroPlanta && $scope.filtroPlanta.trim() !== '') {
            params.planta = $scope.filtroPlanta;
        }
        if ($scope.filtroTurno && $scope.filtroTurno.trim() !== '') {
            params.turno = $scope.filtroTurno;
        }
        if ($scope.filtroJerarquia && $scope.filtroJerarquia.trim() !== '') {
            params.jerarquia = $scope.filtroJerarquia;
        }
        if ($scope.filtroEstado && $scope.filtroEstado.trim() !== '') {
            params.estado = $scope.filtroEstado;
        }
        
        
        // Llamar a la API
        $scope.isLoading = true;
        $http.get($scope.base + 'BuscarAvanzado', { params: params })
            .then(function(response) {
                $scope.dataset = Array.isArray(response.data) ? response.data : [];
                // Ordenar por ID descendente para que el plato más reciente aparezca primero
                $scope.dataset.sort(function(a, b) {
                    var idA = parseInt(a.id) || 0;
                    var idB = parseInt(b.id) || 0;
                    return idB - idA; // Orden descendente (mayor ID primero)
                });
                $scope.currentPage = 0; // Resetear a la primera página
                $scope.filtrosActivos = Object.keys(params).length > 0; // Marcar si hay filtros activos
                $timeout(function() {
                    updateTotalPages();
                }, 0);
                $scope.isLoading = false;
            })
            .catch(function(error) {
                $scope.isLoading = false;
                $window.Swal && $window.Swal.fire({
                    title: 'Error',
                    text: 'Error al buscar en la base de datos: ' + (error.data || error.status),
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#F34949'
                });
            });
    };
    
    // Función para limpiar filtros avanzados
    $scope.limpiarFiltrosAvanzados = function() {
        $scope.filtroFechaDesde = '';
        $scope.filtroPlato = '';
        $scope.filtroCentroCosto = '';
        $scope.filtroProyecto = '';
        $scope.filtroPlanta = '';
        $scope.filtroTurno = '';
        $scope.filtroJerarquia = '';
        $scope.filtroEstado = '';
        $scope.filtrosActivos = false;
        
        // Recargar todos los datos originales
        $scope.ModelReadAll();
    };
    
    // Watcher para el dataset - recalcular totalPages cuando cambia
    $scope.$watch('dataset', function(newVal, oldVal) {
        if (newVal !== oldVal) {
            $timeout(function() {
                updateTotalPages();
            }, 0);
        }
    }, true); // true para deep watch
    
    // Watcher solo para el buscador de texto (filtrado local)
    $scope.$watch('searchText', function(newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.currentPage = 0; // Resetear a la primera página cuando cambia el filtro
            $timeout(function() {
                updateTotalPages();
            }, 0);
        }
    });
    
    // Los filtros avanzados ahora se manejan desde la API, no necesitan watchers automáticos
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
        
        // Leer valores del DOM para validación
        var turno = $window.document.getElementById('view_turno').value;
        var planta = $window.document.getElementById('view_planta').value;
        var jerarquia = $window.document.getElementById('view_jerarquia').value;
        var centrodecosto = $window.document.getElementById('view_centrodecosto').value;
        var proyecto = $window.document.getElementById('view_proyecto').value;
        var plato = $window.document.getElementById('view_plato').value;
        var cantidad = $window.document.getElementById('view_cantidad').value;
        var fechadeldia = $window.document.getElementById('view_fechadeldia').value;
        
        // Validar campos requeridos
        var camposFaltantes = [];
        if (!turno || turno.trim() === '') camposFaltantes.push('Turno');
        if (!planta || planta.trim() === '') camposFaltantes.push('Planta');
        if (!centrodecosto || centrodecosto.trim() === '') camposFaltantes.push('Centro de costo');
        if (!jerarquia || jerarquia.trim() === '') camposFaltantes.push('Jerarquía');
        if (!proyecto || proyecto.trim() === '') camposFaltantes.push('Proyecto');
        if (!cantidad || cantidad.trim() === '' || parseInt(cantidad) < 1 || !/^[1-9][0-9]*$/.test(cantidad)) camposFaltantes.push('Cantidad');
        if (!fechadeldia || (typeof fechadeldia === 'string' && fechadeldia.trim() === '')) camposFaltantes.push('Fecha del día');
        if (!plato || plato.trim() === '') camposFaltantes.push('Plato');
        
        if (camposFaltantes.length > 0) {
            if ($window.Swal && typeof $window.Swal.fire === 'function') {
                $window.Swal.fire({
                    title: 'Completar campos requeridos',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#F34949',
                    buttonsStyling: true
                });
            }
            return;
        }

        // Actualizar scope con valores validados
        $scope.view_turno = turno;
        $scope.view_planta = planta;
        $scope.view_jerarquia = jerarquia;
        $scope.view_centrodecosto = centrodecosto;
        $scope.view_proyecto = proyecto;
        $scope.view_plato = plato;
        $scope.view_cantidad = parseInt(cantidad);
        $scope.view_fechadeldia = fechadeldia;
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
            $window.Swal && $window.Swal.fire({ 
                title: 'Operación Correcta', 
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            });
            $scope.ModelReadAll();
        }, function (error) {
            console.error('Error al crear menú:', error);
            console.error('err.data:', error.data);
            console.error('err.status:', error.status);
            
            var errorMessage = 'No se pudo crear el menú.';
            
            // Manejar error 409 (Conflict) - duplicado
            if (error.status === 409) {
                // Buscar el mensaje de error en diferentes ubicaciones posibles
                if (error.data && error.data.error) {
                    errorMessage = error.data.error;
                } else if (error.data && error.data.Message) {
                    errorMessage = error.data.Message;
                } else if (error.data && typeof error.data === 'string') {
                    errorMessage = error.data;
                } else {
                    errorMessage = 'Ya existe un menú con estos datos. Por favor, verifique los campos.';
                }
            } else if (error.data) {
                // Para otros errores, buscar el mensaje en diferentes ubicaciones
                if (error.data.error) {
                    errorMessage = error.data.error;
                } else if (error.data.Message) {
                    errorMessage = error.data.Message;
                } else if (typeof error.data === 'string') {
                    errorMessage = error.data;
                } else if (error.data.message) {
                    errorMessage = error.data.message;
                }
            } else if (error.statusText) {
                errorMessage = 'Error: ' + error.statusText;
            }
            
            console.log('Mensaje de error a mostrar:', errorMessage);
            $window.Swal && $window.Swal.fire({ 
                title: 'Operación Incorrecta', 
                text: errorMessage, 
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            });
        });
    };

    $scope.ModelRead = function (view_id) {
        $http.get($scope.base + 'get/' + view_id)
            .success(function (data) {
                
                // Procesar fecha de manera más robusta
                var fecha = '';
                if (data[0].fechadeldia) {
                    try {
                        // Intentar diferentes formatos de fecha
                        var fechaStr = data[0].fechadeldia;
                        
                        // Si viene en formato YYYY-MM-DD
                        if (fechaStr.includes('-')) {
                            var aux = fechaStr.split('-');
                            if (aux.length === 3) {
                                fecha = new Date(aux[0], aux[1] - 1, aux[2]);
                            }
                        }
                        // Si viene en formato DD/MM/YYYY
                        else if (fechaStr.includes('/')) {
                            var aux = fechaStr.split('/');
                            if (aux.length === 3) {
                                fecha = new Date(aux[2], aux[1] - 1, aux[0]);
                            }
                        }
                        // Si ya es un objeto Date válido
                        else if (fechaStr instanceof Date) {
                            fecha = fechaStr;
                        }
                        
                    } catch (e) {
                        fecha = '';
                    }
                }
                
                // Si no hay fecha válida, usar fecha actual como fallback
                if (!fecha || fecha === '' || isNaN(fecha.getTime())) {
                    fecha = new Date();
                }

                // Convertir fecha a formato YYYY-MM-DD para el input de tipo date
                var fechaFormateada = '';
                if (fecha instanceof Date && !isNaN(fecha.getTime())) {
                    var year = fecha.getFullYear();
                    var month = String(fecha.getMonth() + 1).padStart(2, '0');
                    var day = String(fecha.getDate()).padStart(2, '0');
                    fechaFormateada = year + '-' + month + '-' + day;
                }

                $scope.view_turno = data[0].turno || '';
                $scope.view_planta = data[0].planta || '';
                $scope.view_centrodecosto = data[0].centrodecosto || '';
                $scope.view_jerarquia = data[0].jerarquia || '';
                $scope.view_proyecto = data[0].proyecto || '';
                $scope.view_plato = data[0].plato || '';
                $scope.view_cantidad = data[0].cantidad || 1;
                $scope.view_comandas = data[0].comandas || '';
                $scope.view_despachado = data[0].despachado || '';
                $scope.view_fechadeldia = fechaFormateada;
                
                
                // Forzar actualización de la vista con timeout para asegurar que el DOM esté listo
                $scope.$apply();
                
                // Aplicar la fecha al campo del DOM directamente como respaldo
                setTimeout(function() {
                    var fechaField = document.getElementById('view_fechadeldia');
                    if (fechaField && fechaFormateada) {
                        fechaField.value = fechaFormateada;
                    }
                }, 100);
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'API no presente', icon: 'error' });
            });
    };

    $scope.ModelReadAll = function () {
        $scope.isLoading = true;
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

        // La página de menú del día es administrativa, debe mostrar TODOS los items sin filtrar por plan nutricional
        $http.get($scope.base + 'GetToday')
            .then(function (response) {
                $scope.dataset = Array.isArray(response.data) ? response.data : [];
                console.log('✅ Menu del día cargado:', $scope.dataset.length, 'items');
                if ($scope.dataset.length > 0) {
                    console.log('📋 Primer item del menú:', $scope.dataset[0]);
                    console.log('   Campos disponibles:', Object.keys($scope.dataset[0]));
                    console.log('   Valor de item.plato:', $scope.dataset[0].plato);
                }
                // Ordenar por ID descendente para que el plato más reciente aparezca primero
                $scope.dataset.sort(function(a, b) {
                    var idA = parseInt(a.id) || 0;
                    var idB = parseInt(b.id) || 0;
                    return idB - idA; // Orden descendente (mayor ID primero)
                });
                // Resetear a la primera página cuando se carga un nuevo dataset
                $scope.currentPage = 0;
                // Recalcular totalPages después de actualizar el dataset
                $timeout(function() {
                    updateTotalPages();
                }, 0);
                $scope.isLoading = false;
            })
            .catch(function () {
                $scope.isLoading = false;
                $scope.dataset = [];
                $scope.currentPage = 0;
                updateTotalPages();
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'API no presente', icon: 'error' });
            });
    };

    $scope.ModelUpdate = function (isValid, view_id, form) {
        $scope.showValidationErrors = true;
        
        // Leer valores del DOM para validación
        var turno = $window.document.getElementById('view_turno').value;
        var planta = $window.document.getElementById('view_planta').value;
        var jerarquia = $window.document.getElementById('view_jerarquia').value;
        var centrodecosto = $window.document.getElementById('view_centrodecosto').value;
        var proyecto = $window.document.getElementById('view_proyecto').value;
        var plato = $window.document.getElementById('view_plato').value;
        var cantidad = $window.document.getElementById('view_cantidad').value;
        var fechadeldia = $window.document.getElementById('view_fechadeldia').value;
        
        // Validar campos requeridos
        var camposFaltantes = [];
        if (!turno || turno.trim() === '') camposFaltantes.push('Turno');
        if (!planta || planta.trim() === '') camposFaltantes.push('Planta');
        if (!centrodecosto || centrodecosto.trim() === '') camposFaltantes.push('Centro de costo');
        if (!jerarquia || jerarquia.trim() === '') camposFaltantes.push('Jerarquía');
        if (!proyecto || proyecto.trim() === '') camposFaltantes.push('Proyecto');
        if (!cantidad || cantidad.trim() === '' || parseInt(cantidad) < 1 || !/^[1-9][0-9]*$/.test(cantidad)) camposFaltantes.push('Cantidad');
        if (!fechadeldia || (typeof fechadeldia === 'string' && fechadeldia.trim() === '')) camposFaltantes.push('Fecha del día');
        if (!plato || plato.trim() === '') camposFaltantes.push('Plato');
        
        if (camposFaltantes.length > 0) {
            if ($window.Swal && typeof $window.Swal.fire === 'function') {
                $window.Swal.fire({
                    title: 'Completar campos requeridos',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#F34949',
                    buttonsStyling: true
                });
            }
            return;
        }

        // Actualizar scope con valores validados
        $scope.view_turno = turno;
        $scope.view_planta = planta;
        $scope.view_jerarquia = jerarquia;
        $scope.view_centrodecosto = centrodecosto;
        $scope.view_proyecto = proyecto;
        $scope.view_plato = plato;
        $scope.view_estado = '-';
        $scope.view_cantidad = parseInt(cantidad);
        $scope.view_fechadeldia = fechadeldia;
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
            $window.Swal && $window.Swal.fire({ 
                title: 'Operación Correcta', 
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            });
            $scope.ModelReadAll();
        }, function (error) {
            console.error('Error al actualizar menú:', error);
            console.error('err.data:', error.data);
            console.error('err.status:', error.status);
            
            var errorMessage = 'No se pudo actualizar el menú.';
            
            // Manejar error 409 (Conflict) - duplicado
            if (error.status === 409) {
                // Buscar el mensaje de error en diferentes ubicaciones posibles
                if (error.data && error.data.error) {
                    errorMessage = error.data.error;
                } else if (error.data && error.data.Message) {
                    errorMessage = error.data.Message;
                } else if (error.data && typeof error.data === 'string') {
                    errorMessage = error.data;
                } else {
                    errorMessage = 'Ya existe un menú con estos datos. Por favor, verifique los campos.';
                }
            } else if (error.data) {
                // Para otros errores, buscar el mensaje en diferentes ubicaciones
                if (error.data.error) {
                    errorMessage = error.data.error;
                } else if (error.data.Message) {
                    errorMessage = error.data.Message;
                } else if (typeof error.data === 'string') {
                    errorMessage = error.data;
                } else if (error.data.message) {
                    errorMessage = error.data.message;
                }
            } else if (error.statusText) {
                errorMessage = 'Error: ' + error.statusText;
            }
            
            console.log('Mensaje de error a mostrar:', errorMessage);
            $window.Swal && $window.Swal.fire({ 
                title: 'Operación Incorrecta', 
                text: errorMessage, 
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            });
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
            $window.Swal && $window.Swal.fire({ 
                title: 'Operación Correcta', 
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            });
            $scope.ModelReadAll();
        }, function (error) {
            console.error('Error al eliminar menú:', error);
            console.error('err.data:', error.data);
            console.error('err.status:', error.status);
            
            var errorMessage = 'No se pudo eliminar el menú.';
            
            if (error.data) {
                if (error.data.error) {
                    errorMessage = error.data.error;
                } else if (error.data.Message) {
                    errorMessage = error.data.Message;
                } else if (typeof error.data === 'string') {
                    errorMessage = error.data;
                } else if (error.data.message) {
                    errorMessage = error.data.message;
                }
            } else if (error.statusText) {
                errorMessage = 'Error: ' + error.statusText;
            }
            
            $window.Swal && $window.Swal.fire({ 
                title: 'Operación Incorrecta', 
                text: errorMessage, 
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'
            });
        });
    };

    // -------------- Acciones de Vista --------------

    $scope.ViewCreate = function () {
        $scope.ViewAction = 'Nuevo Menó';
        $scope.view_id = -1;
        $scope.showValidationErrors = false;
        $scope.isEditMode = false;
        $scope.fechadeldiaTouched = false; // Resetear flag de fecha tocada
        
        // Inicializar campos básicos
        $scope.view_turno = '';
        $scope.view_planta = '';
        $scope.view_centrodecosto = '';
        $scope.view_jerarquia = '';
        $scope.view_proyecto = '';
        $scope.view_plato = '';
        $scope.view_estado = '';
        $scope.view_cantidad = 1;
        // Inicializar fecha en formato YYYY-MM-DD para input type="date"
        var fechaHoy = new Date();
        var year = fechaHoy.getFullYear();
        var month = String(fechaHoy.getMonth() + 1).padStart(2, '0');
        var day = String(fechaHoy.getDate()).padStart(2, '0');
        $scope.view_fechadeldia = year + '-' + month + '-' + day;
        
        // Forzar actualización de la vista
        if (!$scope.$$phase) {
            $scope.$apply();
        }
        
        // Asegurar que todos los campos se establezcan después de cargar los datos
        // Función para establecer la fecha en el campo HTML
        var establecerFecha = function() {
            var fechaField = document.getElementById('view_fechadeldia');
            if (fechaField) {
                // Establecer el valor directamente en el campo HTML
                fechaField.value = $scope.view_fechadeldia;
                // Forzar actualización del modelo de AngularJS usando $timeout
                $timeout(function() {
                    // Disparar evento input para asegurar que AngularJS detecte el cambio
                    try {
                        var event = new Event('input', { bubbles: true });
                        fechaField.dispatchEvent(event);
                    } catch(e) {
                        // Fallback para navegadores antiguos
                        var event = document.createEvent('Event');
                        event.initEvent('input', true, true);
                        fechaField.dispatchEvent(event);
                    }
                    // También disparar evento change
                    try {
                        var changeEvent = new Event('change', { bubbles: true });
                        fechaField.dispatchEvent(changeEvent);
                    } catch(e) {
                        var changeEvent = document.createEvent('Event');
                        changeEvent.initEvent('change', true, true);
                        fechaField.dispatchEvent(changeEvent);
                    }
                    console.log('✅ Fecha establecida en el campo:', $scope.view_fechadeldia, 'Valor del campo:', fechaField.value);
                }, 0);
            } else {
                console.warn('⚠️ Campo de fecha no encontrado, reintentando...');
            }
        };
        
        // Intentar establecer la fecha inmediatamente
        $timeout(establecerFecha, 0);
        
        // Reintentar después de un delay más largo por si el DOM aún no está listo
        $timeout(function() {
            establecerFecha();
            
            // Reintentar una vez más después de otro delay
            $timeout(establecerFecha, 200);
            
            // Turno - SIEMPRE establecer el primero
            if ($scope.turnos && $scope.turnos.length > 0) {
                var sortedTurnos = $scope.turnos.slice().sort(function(a, b) {
                    return a.descripcion.localeCompare(b.descripcion);
                });
                $scope.view_turno = sortedTurnos[0].descripcion;
            }
            // Jerarquía - SIEMPRE establecer el primero
            if ($scope.jerarquias && $scope.jerarquias.length > 0) {
                var sortedJerarquias = $scope.jerarquias.slice().sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                $scope.view_jerarquia = sortedJerarquias[0].nombre;
            }
            // Platos - SIEMPRE establecer el primero
            if ($scope.platos && $scope.platos.length > 0) {
                var sortedPlatos = $scope.platos.slice().sort(function(a, b) {
                    return a.descripcion.localeCompare(b.descripcion);
                });
                $scope.view_plato = sortedPlatos[0].descripcion;
            }
            
            // Filtrar platos por turno seleccionado (asíncrono)
            if ($scope.view_turno) {
                setTimeout(function() {
                    $scope.filtrarPlatosPorTurno($scope.view_turno);
                    
                    // Después del filtrado, asegurar que el primer plato esté seleccionado
                    setTimeout(function() {
                        if ($scope.platos && $scope.platos.length > 0 && (!$scope.view_plato || $scope.view_plato === '')) {
                            var sortedPlatos = $scope.platos.slice().sort(function(a, b) {
                                return a.descripcion.localeCompare(b.descripcion);
                            });
                            $scope.view_plato = sortedPlatos[0].descripcion;
                        }
                    }, 50);
                }, 100);
            }
            // Plantas - SIEMPRE establecer el primero
            if ($scope.plantas && $scope.plantas.length > 0) {
                var sortedPlantas = $scope.plantas.slice().sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                $scope.view_planta = sortedPlantas[0].nombre;
            }
            // Centros de costo - SIEMPRE establecer el primero
            if ($scope.centros && $scope.centros.length > 0) {
                var sortedCentros = $scope.centros.slice().sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                $scope.view_centrodecosto = sortedCentros[0].nombre;
            }
            // Proyectos - SIEMPRE establecer el primero
            if ($scope.proyectos && $scope.proyectos.length > 0) {
                var sortedProyectos = $scope.proyectos.slice().sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                $scope.view_proyecto = sortedProyectos[0].nombre;
            }
            $scope.$apply();
        }, 200);
    };

    $scope.ModelReadPlatos = function () {
        return $http.get($scope.basePlatos + 'getAll')
            .then(function (response) {
                var data = response.data || response; // Compatibilidad con .success y .then
                $scope.allPlatos = Array.isArray(data) ? data : []; // Almacenar todos los platos
                $scope.platos = Array.isArray(data) ? data : []; // Mostrar todos los platos por defecto
                console.log('✅ Platos cargados en ModelReadPlatos:', $scope.allPlatos.length);
                console.log('📋 Primeros 3 platos:', $scope.allPlatos.slice(0, 3));
                return $scope.allPlatos;
            })
            .catch(function (error) {
                console.error('❌ Error al cargar platos:', error);
                $scope.allPlatos = [];
                $scope.platos = [];
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'Error al obtener platos', icon: 'error' });
                return [];
            });
    };
    
    // Función helper para obtener el plan nutricional de un plato por su nombre
    $scope.getPlanNutricional = function(nombrePlato) {
        if (!nombrePlato || !$scope.allPlatos || $scope.allPlatos.length === 0) {
            console.log('⚠️ getPlanNutricional: datos faltantes', {
                nombrePlato: nombrePlato,
                allPlatosLength: $scope.allPlatos ? $scope.allPlatos.length : 0
            });
            return null;
        }
        
        // Normalizar el nombre del plato (trim y lowercase)
        var nombreNormalizado = (nombrePlato || '').toString().trim().toLowerCase();
        
        // Buscar el plato por descripcion
        var plato = $scope.allPlatos.find(function(p) {
            if (!p) return false;
            // Intentar con descripcion
            if (p.descripcion) {
                var descNormalizada = p.descripcion.toString().trim().toLowerCase();
                if (descNormalizada === nombreNormalizado) {
                    return true;
                }
            }
            // Intentar con otros campos posibles (nombre, plato, etc.)
            if (p.nombre) {
                var nomNormalizado = p.nombre.toString().trim().toLowerCase();
                if (nomNormalizado === nombreNormalizado) {
                    return true;
                }
            }
            return false;
        });
        
        if (plato) {
            console.log('✅ Plan nutricional encontrado para', nombrePlato, ':', plato.plannutricional);
            return plato.plannutricional || null;
        } else {
            console.log('⚠️ No se encontró plato para:', nombrePlato);
            console.log('   Buscando en', $scope.allPlatos.length, 'platos');
            console.log('   Primeros 3 platos disponibles:', $scope.allPlatos.slice(0, 3).map(function(p) {
                return { descripcion: p.descripcion, nombre: p.nombre, plannutricional: p.plannutricional };
            }));
            return null;
        }
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
        // Inicializar con datos por defecto primero
        $scope.turnos = [
            { id: 1, descripcion: 'Almuerzo' },
            { id: 2, descripcion: 'Cena' }
        ];
        $scope.view_turno = 'Almuerzo';
        
        $http.get($scope.baseTurnos + 'getAll')
            .success(function (data) {
                if (data && data.length > 0) {
                    $scope.turnos = data;
                    // Establecer el primer turno como valor por defecto si no hay uno seleccionado
                    if (!$scope.view_turno || $scope.view_turno === '') {
                        $scope.view_turno = data[0].descripcion;
                        // Forzar actualización de la vista
                        $scope.$apply();
                    }
                }
            })
            .error(function (data, status) {
                // No mostrar popup de error para no interrumpir la experiencia del usuario
            });
    };

    // Función para filtrar platos por turno - VERSIÓN SIMPLIFICADA
    $scope.filtrarPlatosPorTurno = function(turno) {
        if (!turno) {
            $scope.platos = $scope.allPlatos || [];
            return;
        }
        
        // SIMULACIÓN SIMPLE: Filtrar platos basándose en el turno
        if ($scope.allPlatos && $scope.allPlatos.length > 0) {
            
            // Simular filtrado basándose en el turno
            if (turno.toLowerCase().includes('almuerzo')) {
                // Para almuerzo, mostrar la primera mitad de los platos
                $scope.platos = $scope.allPlatos.slice(0, Math.ceil($scope.allPlatos.length / 2));
            } else if (turno.toLowerCase().includes('cena')) {
                // Para cena, mostrar la segunda mitad de los platos
                $scope.platos = $scope.allPlatos.slice(Math.ceil($scope.allPlatos.length / 2));
            } else {
                // Para otros turnos, mostrar todos los platos
                $scope.platos = $scope.allPlatos;
            }
            
        } else {
            $scope.platos = [];
        }
    };

    // Función para manejar el cambio de turno
    $scope.onTurnoChange = function() {
        // Verificar que el turno no esté vacío
        if (!$scope.view_turno || $scope.view_turno.trim() === '') {
            return;
        }
        
        // Filtrar platos por turno
        $scope.filtrarPlatosPorTurno($scope.view_turno);
    };

    // Función de prueba para verificar si ng-change funciona
    $scope.testTurnoChange = function() {
        alert('ng-change funciona!');
    };

    // Watch simple para detectar cambios en view_turno
    $scope.$watch('view_turno', function(newVal, oldVal) {
        if (newVal && newVal !== oldVal) {
            $scope.onTurnoChange();
        }
    });

    $scope.ViewUpdate = function (view_id) {
        $scope.ViewAction = 'Editar Menó';
        $scope.view_id = view_id;
        $scope.showValidationErrors = false;
        
        // Forzar actualización de la vista
        if (!$scope.$$phase) {
            $scope.$apply();
        }
        
        $scope.ModelRead(view_id);
        $scope.ModelReadPlatos();
        $scope.ModelReadPlantas();
        $scope.ModelReadCentros();
        $scope.ModelReadProyectos();
        $scope.ModelReadJerarquias();
        $scope.ModelReadTurnos();
        
        // Marcar que estamos en modo edición para los select
        $scope.isEditMode = true;
        
        // Asegurar que todos los campos tengan valores por defecto si están vacíos
        setTimeout(function() {
            // Verificar y corregir la fecha si es necesario
            $scope.verificarYCorregirFecha();
            
            // Turno - establecer el primero si está vacío
            if ($scope.turnos && $scope.turnos.length > 0 && (!$scope.view_turno || $scope.view_turno === '')) {
                var sortedTurnos = $scope.turnos.slice().sort(function(a, b) {
                    return a.descripcion.localeCompare(b.descripcion);
                });
                $scope.view_turno = sortedTurnos[0].descripcion;
            }
            // Jerarquía - establecer el primero si está vacío
            if ($scope.jerarquias && $scope.jerarquias.length > 0 && (!$scope.view_jerarquia || $scope.view_jerarquia === '')) {
                var sortedJerarquias = $scope.jerarquias.slice().sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                $scope.view_jerarquia = sortedJerarquias[0].nombre;
            }
            // Platos - establecer el primero si está vacío
            if ($scope.platos && $scope.platos.length > 0 && (!$scope.view_plato || $scope.view_plato === '')) {
                var sortedPlatos = $scope.platos.slice().sort(function(a, b) {
                    return a.descripcion.localeCompare(b.descripcion);
                });
                $scope.view_plato = sortedPlatos[0].descripcion;
            }
            
            // Filtrar platos por turno seleccionado (asíncrono)
            if ($scope.view_turno) {
                setTimeout(function() {
                    $scope.filtrarPlatosPorTurno($scope.view_turno);
                }, 100);
            }
            
            // Verificación adicional de fecha después de un tiempo
            setTimeout(function() {
                $scope.verificarYCorregirFecha();
            }, 200);
            // Plantas - establecer el primero si está vacío
            if ($scope.plantas && $scope.plantas.length > 0 && (!$scope.view_planta || $scope.view_planta === '')) {
                var sortedPlantas = $scope.plantas.slice().sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                $scope.view_planta = sortedPlantas[0].nombre;
            }
            // Centros de costo - establecer el primero si está vacío
            if ($scope.centros && $scope.centros.length > 0 && (!$scope.view_centrodecosto || $scope.view_centrodecosto === '')) {
                var sortedCentros = $scope.centros.slice().sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                $scope.view_centrodecosto = sortedCentros[0].nombre;
            }
            // Proyectos - establecer el primero si está vacío
            if ($scope.proyectos && $scope.proyectos.length > 0 && (!$scope.view_proyecto || $scope.view_proyecto === '')) {
                var sortedProyectos = $scope.proyectos.slice().sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                $scope.view_proyecto = sortedProyectos[0].nombre;
            }
            $scope.$apply();
        }, 300);
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
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#F34949',
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
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar',
                allowOutsideClick: false
            }).then((res) => {
                if (res.isConfirmed) {
                    $http.post($scope.base + 'Activate', { id: view_id })
                        .then(() => {
                            $window.Swal && $window.Swal.fire({ 
                                title: 'Menú activado correctamente', 
                                icon: 'success',
                                confirmButtonText: 'Aceptar',
                                confirmButtonColor: '#F34949'
                            });
                            $scope.ModelReadAll();
                        })
                        .catch((error) => {
                            $window.Swal && $window.Swal.fire({ title: 'Error', text: 'No se pudo activar el menú', icon: 'error' });
                        });
                }
            });
        } else {
            if ($window.confirm('¿Activar menú?')) {
                $http.post($scope.base + 'Activate', { id: view_id })
                    .then(() => {
                        $window.Swal && $window.Swal.fire({ 
                            title: 'Menú activado correctamente', 
                            icon: 'success',
                            confirmButtonText: 'Aceptar',
                            confirmButtonColor: '#F34949'
                        });
                        $scope.ModelReadAll();
                    })
                    .catch((error) => {
                        $window.Swal && $window.Swal.fire({ title: 'Error', text: 'No se pudo activar el menú', icon: 'error' });
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
                $scope.dataset = response.data || [];
                // Ordenar por ID descendente para que el plato más reciente aparezca primero
                $scope.dataset.sort(function(a, b) {
                    var idA = parseInt(a.id) || 0;
                    var idB = parseInt(b.id) || 0;
                    return idB - idA; // Orden descendente (mayor ID primero)
                });
                $scope.currentPage = 0;
                $timeout(function() {
                    updateTotalPages();
                }, 0);
            })
            .catch(error => {
                $window.Swal && $window.Swal.fire({ title: 'Error', text: 'No se pudo obtener el menú filtrado', icon: 'error' });
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
        $scope.fechadeldiaTouched = false; // Resetear flag de fecha tocada al cancelar
    };

    // --- Init ---
    // Cargar primero los platos para que estén disponibles al filtrar el menú del día
    $scope.ModelReadPlatos().then(function() {
        // Una vez cargados los platos, cargar el menú del día (que usará allPlatos para filtrar)
        $scope.ModelReadAll();
    });
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
