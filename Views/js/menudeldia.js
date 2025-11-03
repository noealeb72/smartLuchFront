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

app.controller('Menudeldia', function ($scope, $sce, $http, $window) {
    // Inicializar fecha por defecto
    $scope.view_fechadeldia = new Date();
    
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

    // Usar la variable de configuración global API_BASE_URL
    var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
    
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
    $scope.pageSize = 10;
    $scope.totalPages = 1;
    
    $scope.numberOfPages = function () {
        return Math.ceil(($scope.dataset || []).length / $scope.pageSize);
    };
    
    // Función para recalcular totalPages
    function updateTotalPages() {
        var filteredData = $scope.dataset || [];
        // Solo aplicar filtro de texto local, los filtros avanzados se manejan desde la API
        if ($scope.searchText && $scope.searchText.trim() !== '') {
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
        console.log('🔍 Abriendo popup de platos para filtro');
        $scope.modoSeleccionPlato = 'filtro';
        cargarPlatosYMostrarModal();
    };
    
    // Función para abrir popup de platos (para formulario)
    $scope.abrirPopupPlatosFormulario = function() {
        console.log('🔍 Abriendo popup de platos para formulario');
        $scope.modoSeleccionPlato = 'formulario';
        cargarPlatosYMostrarModal();
    };
    
    // Función auxiliar para cargar platos y mostrar modal
    var cargarPlatosYMostrarModal = function() {
        // Cargar platos disponibles
        $http.get($scope.basePlatos + 'getAll')
            .success(function(data) {
                console.log('✅ Platos cargados:', data);
                $scope.platosDisponibles = data;
                $scope.busquedaPlato = ''; // Limpiar búsqueda
                
                // Mostrar modal
                $('#modalSeleccionarPlato').modal('show');
            })
            .error(function(data, status) {
                console.error('❌ Error al cargar platos:', data, status);
                $window.Swal && $window.Swal.fire({
                    title: 'Error',
                    text: 'Error al cargar la lista de platos: ' + (data || status),
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#343A40'
                });
            });
    };
    
    // Función de filtro personalizada para buscar platos por descripción o código
    $scope.filtrarPlatos = function(plato) {
        if (!$scope.busquedaPlato || $scope.busquedaPlato.trim() === '') {
            return true;
        }
        var busqueda = $scope.busquedaPlato.toLowerCase().trim();
        var descripcion = (plato.descripcion || '').toLowerCase();
        var codigo = (plato.codigo || '').toLowerCase();
        return descripcion.indexOf(busqueda) !== -1 || codigo.indexOf(busqueda) !== -1;
    };
    
    // Función para seleccionar un plato
    $scope.seleccionarPlato = function(plato) {
        console.log('✅ Plato seleccionado:', plato);
        console.log('📍 Modo selección:', $scope.modoSeleccionPlato);
        
        if ($scope.modoSeleccionPlato === 'formulario') {
            // Si estamos en modo formulario, actualizar el campo view_plato
            $scope.view_plato = plato.descripcion;
            console.log('✅ Plato asignado al formulario:', plato.descripcion);
            
            // Forzar actualización del select si es necesario
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        } else {
            // Si estamos en modo filtro, actualizar el filtro
            $scope.filtroPlato = plato.descripcion;
            console.log('✅ Plato asignado al filtro:', plato.descripcion);
        }
        
        $('#modalSeleccionarPlato').modal('hide');
    };
    
    // Función para verificar y corregir la fecha en modo edición
    $scope.verificarYCorregirFecha = function() {
        console.log('🔍 Verificando fecha en modo edición...');
        
        // Verificar si el campo de fecha está vacío o tiene un valor incorrecto
        var fechaField = document.getElementById('view_fechadeldia');
        if (fechaField) {
            var valorActual = fechaField.value;
            var valorScope = $scope.view_fechadeldia;
            
            console.log('Valor del campo DOM:', valorActual);
            console.log('Valor del scope:', valorScope);
            
            // Si el campo está vacío pero el scope tiene valor, aplicar el valor del scope
            if ((!valorActual || valorActual === '') && valorScope) {
                fechaField.value = valorScope;
                console.log('✅ Fecha aplicada desde scope al DOM:', valorScope);
            }
            // Si el scope está vacío pero el campo tiene valor, actualizar el scope
            else if (valorActual && (!valorScope || valorScope === '')) {
                $scope.view_fechadeldia = valorActual;
                console.log('✅ Fecha aplicada desde DOM al scope:', valorActual);
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
                console.log('✅ Fecha actual aplicada:', fechaHoy);
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
        console.log('🔍 Aplicando filtros avanzados:', {
            fechaDesde: $scope.filtroFechaDesde,
            plato: $scope.filtroPlato,
            centroCosto: $scope.filtroCentroCosto,
            proyecto: $scope.filtroProyecto,
            planta: $scope.filtroPlanta,
            turno: $scope.filtroTurno,
            jerarquia: $scope.filtroJerarquia,
            estado: $scope.filtroEstado
        });
        
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
        
        console.log('📡 Parámetros para API:', params);
        
        // Llamar a la API
        $http.get($scope.base + 'BuscarAvanzado', { params: params })
            .success(function(data) {
                console.log('✅ Datos recibidos de la API:', data);
                $scope.dataset = data;
                $scope.currentPage = 0; // Resetear a la primera página
                $scope.filtrosActivos = Object.keys(params).length > 0; // Marcar si hay filtros activos
                updateTotalPages();
            })
            .error(function(data, status) {
                console.error('❌ Error al buscar en la API:', data, status);
                $window.Swal && $window.Swal.fire({
                    title: 'Error',
                    text: 'Error al buscar en la base de datos: ' + (data || status),
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#343A40'
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
        console.log('🧹 Filtros avanzados limpiados');
        
        // Recargar todos los datos originales
        $scope.ModelReadAll();
    };
    
    // Watcher solo para el buscador de texto (filtrado local)
    $scope.$watch('searchText', function() {
        updateTotalPages();
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
        if (!fechadeldia || fechadeldia.trim() === '') camposFaltantes.push('Fecha del día');
        if (!plato || plato.trim() === '') camposFaltantes.push('Plato');
        
        if (camposFaltantes.length > 0) {
            if ($window.Swal && typeof $window.Swal.fire === 'function') {
                $window.Swal.fire({
                    title: 'Completar campos requeridos',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#343A40',
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
            $window.Swal && $window.Swal.fire({ title: 'Operación Correcta', icon: 'success' });
            $scope.ModelReadAll();
        }, function (error) {
            $window.Swal && $window.Swal.fire({ title: 'Operación Incorrecta', text: ('' + error), icon: 'error' });
        });
    };

    $scope.ModelRead = function (view_id) {
        $http.get($scope.base + 'get/' + view_id)
            .success(function (data) {
                console.log('Datos recibidos para edición:', data);
                
                // Procesar fecha de manera más robusta
                var fecha = '';
                if (data[0].fechadeldia) {
                    try {
                        // Intentar diferentes formatos de fecha
                        var fechaStr = data[0].fechadeldia;
                        console.log('Fecha original:', fechaStr, 'Tipo:', typeof fechaStr);
                        
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
                        
                        console.log('Fecha procesada:', fecha);
                    } catch (e) {
                        console.error('Error procesando fecha:', e);
                        fecha = '';
                    }
                }
                
                // Si no hay fecha válida, usar fecha actual como fallback
                if (!fecha || fecha === '' || isNaN(fecha.getTime())) {
                    console.log('Usando fecha actual como fallback');
                    fecha = new Date();
                }

                // Convertir fecha a formato YYYY-MM-DD para el input de tipo date
                var fechaFormateada = '';
                if (fecha instanceof Date && !isNaN(fecha.getTime())) {
                    var year = fecha.getFullYear();
                    var month = String(fecha.getMonth() + 1).padStart(2, '0');
                    var day = String(fecha.getDate()).padStart(2, '0');
                    fechaFormateada = year + '-' + month + '-' + day;
                    console.log('Fecha formateada para input:', fechaFormateada);
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
                
                console.log('Variables asignadas:', {
                    turno: $scope.view_turno,
                    planta: $scope.view_planta,
                    fechadeldia: $scope.view_fechadeldia
                });
                
                // Forzar actualización de la vista con timeout para asegurar que el DOM esté listo
                $scope.$apply();
                
                // Aplicar la fecha al campo del DOM directamente como respaldo
                setTimeout(function() {
                    var fechaField = document.getElementById('view_fechadeldia');
                    if (fechaField && fechaFormateada) {
                        fechaField.value = fechaFormateada;
                        console.log('Fecha aplicada directamente al DOM:', fechaFormateada);
                    }
                }, 100);
            })
            .error(function () {
                $window.Swal && $window.Swal.fire({ title: 'Ha ocurrido un error', text: 'API no presente', icon: 'error' });
            });
    };

    $scope.ModelReadAll = function () {
        $scope.dataset = [];
        $scope.searchKeyword;
        $scope.ViewAction = 'Lista de Items';
        console.log('ViewAction inicializado a:', $scope.ViewAction);
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

        $http.get($scope.base + 'GetToday')
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
        if (!fechadeldia || fechadeldia.trim() === '') camposFaltantes.push('Fecha del día');
        if (!plato || plato.trim() === '') camposFaltantes.push('Plato');
        
        if (camposFaltantes.length > 0) {
            if ($window.Swal && typeof $window.Swal.fire === 'function') {
                $window.Swal.fire({
                    title: 'Completar campos requeridos',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#343A40',
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
        $scope.ViewAction = 'Nuevo Menó';
        $scope.view_id = -1;
        $scope.showValidationErrors = false;
        $scope.isEditMode = false;
        
        // Inicializar campos básicos
        $scope.view_turno = '';
        $scope.view_planta = '';
        $scope.view_centrodecosto = '';
        $scope.view_jerarquia = '';
        $scope.view_proyecto = '';
        $scope.view_plato = '';
        $scope.view_estado = '';
        $scope.view_cantidad = 1;
        $scope.view_fechadeldia = new Date();
        
        // Forzar actualización de la vista
        if (!$scope.$$phase) {
            $scope.$apply();
        }
        
        // Asegurar que todos los campos se establezcan después de cargar los datos
        setTimeout(function() {
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
                            console.log('Primer plato seleccionado después del filtrado:', $scope.view_plato);
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
        $http.get($scope.basePlatos + 'getAll')
            .success(function (data) {
                $scope.allPlatos = data; // Almacenar todos los platos
                $scope.platos = data; // Mostrar todos los platos por defecto
                console.log('Platos cargados:', $scope.platos.length);
                console.log('Primer plato:', $scope.platos[0]);
                console.log('Propiedades del primer plato:', Object.keys($scope.platos[0] || {}));
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
        console.log('🔄 Cargando turnos desde:', $scope.baseTurnos + 'getAll');
        
        // Inicializar con datos por defecto primero
        $scope.turnos = [
            { id: 1, descripcion: 'Almuerzo' },
            { id: 2, descripcion: 'Cena' }
        ];
        $scope.view_turno = 'Almuerzo';
        console.log('⚠️ Usando turnos por defecto mientras se carga la API');
        
        $http.get($scope.baseTurnos + 'getAll')
            .success(function (data) {
                console.log('✅ Turnos cargados exitosamente desde API:', data);
                if (data && data.length > 0) {
                    $scope.turnos = data;
                    // Establecer el primer turno como valor por defecto si no hay uno seleccionado
                    if (!$scope.view_turno || $scope.view_turno === '') {
                        $scope.view_turno = data[0].descripcion;
                        console.log('🎯 Primer turno seleccionado desde API:', $scope.view_turno);
                        // Forzar actualización de la vista
                        $scope.$apply();
                    }
                }
            })
            .error(function (data, status) {
                console.error('❌ Error al cargar turnos desde API:', data, status);
                console.log('⚠️ Manteniendo turnos por defecto debido a error en API');
                // No mostrar popup de error para no interrumpir la experiencia del usuario
            });
    };

    // Función para filtrar platos por turno - VERSIÓN SIMPLIFICADA
    $scope.filtrarPlatosPorTurno = function(turno) {
        console.log('🚀 filtrarPlatosPorTurno ejecutada con turno:', turno);
        
        if (!turno) {
            console.warn('⚠️ Turno vacío, mostrando todos los platos');
            $scope.platos = $scope.allPlatos || [];
            return;
        }
        
        // SIMULACIÓN SIMPLE: Filtrar platos basándose en el turno
        if ($scope.allPlatos && $scope.allPlatos.length > 0) {
            console.log('🔍 Filtrando platos para turno:', turno);
            console.log('Platos disponibles:', $scope.allPlatos.length);
            
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
            
            console.log('✅ Platos filtrados para turno', turno, ':', $scope.platos.length);
            console.log('Platos mostrados:', $scope.platos.map(p => p.descripcion || p.nombre || 'Sin nombre'));
        } else {
            console.warn('⚠️ No hay platos disponibles para filtrar');
            $scope.platos = [];
        }
    };

    // Función para manejar el cambio de turno
    $scope.onTurnoChange = function() {
        console.log('🔥 onTurnoChange ejecutada!');
        console.log('Turno actual:', $scope.view_turno);
        console.log('Tipo de turno:', typeof $scope.view_turno);
        console.log('Platos antes del filtrado:', $scope.platos ? $scope.platos.length : 'undefined');
        console.log('AllPlatos disponibles:', $scope.allPlatos ? $scope.allPlatos.length : 'undefined');
        
        // Verificar que el turno no esté vacío
        if (!$scope.view_turno || $scope.view_turno.trim() === '') {
            console.warn('⚠️ Turno vacío, no se puede filtrar');
            return;
        }
        
        // Filtrar platos por turno
        $scope.filtrarPlatosPorTurno($scope.view_turno);
        
        // No limpiar la selección de plato para mantener el primer plato seleccionado
        
        console.log('✅ Filtrado de platos completado para turno:', $scope.view_turno);
        console.log('Platos después del filtrado:', $scope.platos ? $scope.platos.length : 'undefined');
    };

    // Función de prueba para verificar si ng-change funciona
    $scope.testTurnoChange = function() {
        console.log('🧪 TEST: ng-change funciona!');
        alert('ng-change funciona!');
    };

    // Watch simple para detectar cambios en view_turno
    $scope.$watch('view_turno', function(newVal, oldVal) {
        if (newVal && newVal !== oldVal) {
            console.log('👀 $watch detectó cambio en view_turno:', oldVal, '->', newVal);
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
                confirmButtonColor: '#343A40',
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
