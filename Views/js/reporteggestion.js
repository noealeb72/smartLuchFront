// reporteggestion.js
// -------------------------------------------------------------
// Reporte de Gestión - AngularJS 1.x
// Carga combos (plantas, centros, proyectos, turnos, perfiles)
// y permite buscar platos con modal.
// -------------------------------------------------------------

(function () {
    'use strict';

    // Usa o crea el módulo (según exista ya en tu app)
    var app;
    try { app = angular.module('AngujarJS'); }
    catch (e) { app = angular.module('AngujarJS', []); }

    // ====== Filtros seguros ======
    app.filter('startFrom', function () {
        return function (input, start) {
            if (!Array.isArray(input)) return [];
            start = +start || 0;
            return input.slice(start);
        };
    });

    app.filter('formatDate', function () {
        return function (input) {
            if (!input || typeof input !== 'string') return input || '';
            var t = input.split('T')[0] || input;
            var p = t.split('-'); // YYYY-MM-DD
            return (p[2] || '') + '/' + (p[1] || '') + '/' + (p[0] || '');
        };
    });

    app.filter('formatHour', function () {
        return function (input) {
            if (!input || typeof input !== 'string' || input.indexOf('T') === -1) return '';
            return input.split('T')[1].split('.')[0] || '';
        };
    });

    app.filter('formatBool', function () {
        return function (input) { return input ? 'Si' : 'No'; };
    });

    app.filter('formatEstados', function () {
        return function (input) {
            switch (input) {
                case 'C':
                    return 'Cancelado';
                case 'P':
                    return 'Pendiente';
                case 'R':
                    return 'Recibido';
                case 'E':
                    return 'Entregado';
                case 'D':
                    return 'Devuelto';
                default:
                    return input || '-';
            }
        };
    });

    // ====== Controlador principal ======
    app.controller('ReportegGestion', function ($scope, $http, $timeout, $q, $window) {

        // ---- Configuración del usuario ----
        $scope.user_Rol = localStorage.getItem('user_Rol') || 'Gerencia';
        $scope.user_Name = localStorage.getItem('user_Name') || '';
        $scope.user_LastName = localStorage.getItem('user_LastName') || '';
        
        // ---- Fecha y hora actual ----
        $scope.currentDateTime = new Date().toLocaleString('es-ES');
        setInterval(function() {
            $scope.currentDateTime = new Date().toLocaleString('es-ES');
            $scope.$apply();
        }, 1000);

        // ---- Endpoints ----
        $scope.basePlantas = 'http://localhost:8000/api/planta/';
        $scope.baseCentrodecostos = 'http://localhost:8000/api/centrodecosto/';
        $scope.baseProyectos = 'http://localhost:8000/api/proyecto/';
        $scope.baseTurno = 'http://localhost:8000/api/turno/';
        $scope.baseReporte = 'http://localhost:8000/api/reporte/';
        var basePlatos = 'http://localhost:8000/api/plato/';

        // ---- Modelos UI ----
        $scope.plantas = [];
        $scope.centrosdecosto = [];
        $scope.proyectos = [];
        $scope.turnos = [];
        $scope.perfiles = [];         // opcional (plan nutricional)
        $scope.dataset = [];          // tabla
        $scope.comandas = [];
        
        // ---- Estado del acordeón ----
        $scope.toggleFiltros = true;  // Inicialmente expandido
        
        // Asegurar que el acordeón esté abierto al cargar
        $scope.$on('$viewContentLoaded', function() {
            $scope.toggleFiltros = true;
            $scope.$apply();
        });
        
        // Forzar apertura después de un pequeño delay
        setTimeout(function() {
            $scope.toggleFiltros = true;
            $scope.$apply();
        }, 100);
        $scope.filtro_plato = '';
        $scope.busquedaPlato = '';
        $scope.platos = [];
        $scope.platosFiltrados = [];

        // Totales
        $scope.totales = { platos: 0, promedio: 0, devueltos: 0, costo: 0 };

        // Paginación
        $scope.currentPage = 0;
        $scope.pageSize = 20;

        $scope.numberOfPages = function () {
            var len = Array.isArray($scope.dataset) ? $scope.dataset.length : 0;
            return Math.ceil(len / ($scope.pageSize || 1));
        };

        $scope.getPageNumbers = function () {
            var total = $scope.numberOfPages(), cur = $scope.currentPage + 1, out = [];
            if (total <= 7) for (var i = 1; i <= total; i++) out.push(i);
            else {
                out.push(1);
                if (cur > 4) out.push('...');
                var start = Math.max(2, cur - 1), end = Math.min(total - 1, cur + 1);
                for (var j = start; j <= end; j++) out.push(j);
                if (cur < total - 3) out.push('...');
                out.push(total);
            }
            return out;
        };

        $scope.goToPage = function (p) {
            if (typeof p !== 'number') return;
            if (p >= 0 && p < $scope.numberOfPages()) $scope.currentPage = p;
        };

        $scope.changePageSize = function (n) {
            n = parseInt(n, 10);
            $scope.pageSize = isNaN(n) ? 20 : n;
            $scope.currentPage = 0;
        };

        // ===== Normalizadores =====
        function toListIdDesc(arr) {
            if (!Array.isArray(arr)) return [];
            return arr.map(function (x) {
                console.log('Procesando elemento:', x);
                var id = x.id || x.Id || x.ID || x.codigo || x.code || x.value || null;
                var nombre = x.nombre || x.Nombre || x.descripcion || x.Descripcion || x.detalle || x.text || 'Sin nombre';
                console.log('ID mapeado:', id, 'Nombre mapeado:', nombre);
                return {
                    id: id,
                    nombre: nombre
                };
            });
        }

        // ===== Cargas de combos =====
        function cargarPlantas() {
            console.log('🔄 Cargando plantas...');
            $http.get($scope.basePlantas + 'getAll')
                .then(function (response) {
                    $scope.plantas = toListIdDesc(response.data);
                    // Ordenar alfabéticamente por nombre
                    $scope.plantas.sort(function(a, b) {
                        var nombreA = (a.nombre || '').toLowerCase();
                        var nombreB = (b.nombre || '').toLowerCase();
                        return nombreA.localeCompare(nombreB);
                    });
                    console.log('✅ Plantas cargadas:', $scope.plantas.length, 'elementos');
                })
                .catch(function (error) {
                    $scope.plantas = [];
                    console.error('❌ Error cargando plantas:', error.status, error.data);
                    warn('Error cargando plantas', {status: error.status, data: error.data});
                });
        }

        function cargarCentros() {
            console.log('🔄 Cargando centros de costo...');
            console.log('URL:', $scope.baseCentrodecostos + 'getAll');
            $http.get($scope.baseCentrodecostos + 'getAll')
                .then(function (response) {
                    console.log('📥 Respuesta centros:', response);
                    console.log('📥 Datos centros:', response.data);
                    console.log('📥 Tipo de datos:', typeof response.data);
                    console.log('📥 Es array:', Array.isArray(response.data));
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        console.log('📥 Primer elemento:', response.data[0]);
                        console.log('📥 Campos del primer elemento:', Object.keys(response.data[0]));
                    }
                    $scope.centrosdecosto = toListIdDesc(response.data);
                    // Ordenar alfabéticamente por nombre
                    $scope.centrosdecosto.sort(function(a, b) {
                        var nombreA = (a.nombre || '').toLowerCase();
                        var nombreB = (b.nombre || '').toLowerCase();
                        return nombreA.localeCompare(nombreB);
                    });
                    console.log('✅ Centros cargados:', $scope.centrosdecosto.length, 'elementos');
                    console.log('✅ Lista centros:', $scope.centrosdecosto);
                })
                .catch(function (error) {
                    $scope.centrosdecosto = [];
                    console.error('❌ Error cargando centros:', error.status, error.data);
                    console.error('❌ Error completo:', error);
                    warn('Error cargando centros de costo', {status: error.status, data: error.data});
                });
        }

        function cargarProyectos() {
            console.log('🔄 Cargando proyectos...');
            $http.get($scope.baseProyectos + 'getAll')
                .then(function (response) {
                    $scope.proyectos = toListIdDesc(response.data);
                    // Ordenar alfabéticamente por nombre
                    $scope.proyectos.sort(function(a, b) {
                        var nombreA = (a.nombre || '').toLowerCase();
                        var nombreB = (b.nombre || '').toLowerCase();
                        return nombreA.localeCompare(nombreB);
                    });
                    console.log('✅ Proyectos cargados:', $scope.proyectos.length, 'elementos');
                })
                .catch(function (error) {
                    $scope.proyectos = [];
                    console.error('❌ Error cargando proyectos:', error.status, error.data);
                    warn('Error cargando proyectos', {status: error.status, data: error.data});
                });
        }

        function cargarTurnos() {
            console.log('🔄 Cargando turnos...');
            $http.get($scope.baseTurno + 'GetTurnosDisponibles')
                .then(function (response) {
                    $scope.turnos = toListIdDesc(response.data);
                    // Ordenar alfabéticamente por nombre
                    $scope.turnos.sort(function(a, b) {
                        var nombreA = (a.nombre || '').toLowerCase();
                        var nombreB = (b.nombre || '').toLowerCase();
                        return nombreA.localeCompare(nombreB);
                    });
                    console.log('✅ Turnos cargados:', $scope.turnos.length, 'elementos');
                })
                .catch(function (error) {
                    $scope.turnos = [];
                    console.error('❌ Error cargando turnos:', error.status, error.data);
                    warn('Error cargando turnos', {status: error.status, data: error.data});
                });
        }

        function cargarPerfiles() {
            console.log('🔄 Cargando perfiles nutricionales...');
            $http.get('http://localhost:8000/api/plannutricional/getAll')
                .then(function (response) {
                    // normalizo a {id, nombre} para ng-options pf as pf.nombre for pf in perfiles track by pf.id
                    var list = Array.isArray(response.data) ? response.data : [];
                    console.log('📥 Datos originales de perfiles:', response.data);
                    console.log('📥 Lista procesada:', list);
                    $scope.perfiles = list.map(function (x) {
                        var id = x.id || x.codigo || x.value || null;
                        var nombre = x.nombre || x.descripcion || String(x);
                        console.log('🔄 Mapeando perfil:', x, '-> ID:', id, 'Nombre:', nombre);
                        return { id: id, nombre: nombre };
                    });
                    // Ordenar alfabéticamente por nombre
                    console.log('🔄 Ordenando perfiles alfabéticamente...');
                    console.log('📋 Perfiles antes del ordenamiento:', $scope.perfiles);
                    $scope.perfiles.sort(function(a, b) {
                        var nombreA = (a.nombre || '').toLowerCase();
                        var nombreB = (b.nombre || '').toLowerCase();
                        console.log('🔄 Comparando:', nombreA, 'vs', nombreB);
                        return nombreA.localeCompare(nombreB);
                    });
                    console.log('📋 Perfiles después del ordenamiento:', $scope.perfiles);
                    console.log('✅ Perfiles cargados:', $scope.perfiles.length, 'elementos');
                })
                .catch(function (error) {
                    $scope.perfiles = [];
                    console.error('❌ Error cargando perfiles:', error.status, error.data);
                    // no es crítico
                });
        }

        // ===== Buscar/seleccionar plato =====
        $scope.buscarPlato = function () {
            $scope.busquedaPlato = '';
            $scope.platos = [];
            $scope.platosFiltrados = [];
            $http.get(basePlatos + 'getAll')
                .then(function (res) {
                    var data = Array.isArray(res.data) ? res.data : [];
                    $scope.platos = data;
                    $scope.platosFiltrados = data.slice();
                    console.log('Platos:', data.length);
                    $timeout(function () {
                        var m = $('#modalBuscarPlato');
                        if (m.length) m.modal('show');
                    }, 80);
                })
                .catch(function (e) {
                    warn('Error cargando platos', e, true);
                });
        };

        $scope.buscarPlatos = function () {
            var q = ($scope.busquedaPlato || '').toLowerCase();
            if (q.length < 2) { $scope.platosFiltrados = $scope.platos.slice(); return; }
            $scope.platosFiltrados = $scope.platos.filter(function (p) {
                var nombre = (p.nombre || p.descripcion || '').toLowerCase();
                var codigo = (p.codigo || '').toString().toLowerCase();
                return nombre.indexOf(q) !== -1 || codigo.indexOf(q) !== -1;
            });
        };

        $scope.seleccionarPlato = function (plato) {
            $scope.filtro_plato = (plato && plato.codigo) ? plato.codigo : '';
            $('#modalBuscarPlato').modal('hide');
        };

        // ===== Reporte (por ahora, sólo filtra por plato) =====
        /*$scope.getReporte = function () {
            $http.get($scope.baseReporte + 'getComandas', { params: { plato: $scope.filtro_plato || '' } })
                .then(function (res) {
                    var data = Array.isArray(res.data) ? res.data : [];
                    data.sort(function (a, b) {
                        var da = a.createdate || '', db = b.createdate || '';
                        return da > db ? -1 : (da < db ? 1 : 0);
                    });
                    $scope.dataset = data;
                    $scope.comandas = data;
                    $scope.ViewAction = 'reporte';
                    $scope.currentPage = 0;
                })
                .catch(function (e) {
                    warn('Error al obtener comandas', e, true);
                });
        };*/

        // helper para dd/MM/yyyy
        function fmtFecha(d) {
            if (!d) return '';
            var x = new Date(d);
            if (isNaN(x)) return '';
            var dd = String(x.getDate()).padStart(2, '0');
            var mm = String(x.getMonth() + 1).padStart(2, '0');
            var yyyy = x.getFullYear();
            return dd + '/' + mm + '/' + yyyy;
        }

        $scope.getReporte = function () {
            console.log('🔍 Ejecutando getReporte()');
            console.log('📊 ViewAction actual:', $scope.ViewAction);
            
            var params = {
                fechadesde: fmtFecha($scope.filtro_fechadesde),
                fechahasta: fmtFecha($scope.filtro_fechahasta),
                codplato: $scope.filtro_plato || '',
                centrodecosto: ($scope.rep_centro && $scope.rep_centro.nombre) || '',
                proyecto: ($scope.rep_proyecto && $scope.rep_proyecto.nombre) || '',
                planta: ($scope.rep_planta && $scope.rep_planta.nombre) || ''
            };

            console.log('📋 Parámetros de búsqueda:', params);

            $http.get($scope.baseReporte + 'GetComandas', { params: params })
                .then(function (res) {
                    console.log('✅ Respuesta de la API:', res.data);
                    var data = Array.isArray(res.data) ? res.data : [];
                    console.log('📊 Datos procesados:', data.length, 'registros');
                    
                    // ya vienen ordenadas desc por createdate desde la API,
                    // pero si querés asegurarlo del lado del cliente:
                    data.sort(function (a, b) {
                        return (a.createdate > b.createdate ? -1 : (a.createdate < b.createdate ? 1 : 0));
                    });
                    $scope.dataset = data;
                    $scope.comandas = data;
                    $scope.ViewAction = 'reporte';
                    $scope.currentPage = 0;
                    
                    console.log('🎯 ViewAction establecido a:', $scope.ViewAction);
                    console.log('📊 Dataset establecido con', $scope.dataset.length, 'elementos');
                })
                .catch(function (e) {
                    console.error('❌ Error en getReporte:', e);
                    warn('Error al obtener comandas', e, true);
                });
        };

        // Totales
        $scope.$watch('dataset', function (nv) {
            if (!Array.isArray(nv)) return;
            var t = { platos: 0, promedio: 0, devueltos: 0, costo: 0 };
            var sum = 0, cnt = 0;
            nv.forEach(function (x) {
                t.platos += 1;
                var c = parseFloat(x.calificacion); if (!isNaN(c)) { sum += c; cnt++; }
                if (x.estado === 'D') t.devueltos += 1;
                var m = parseFloat(x.monto); if (!isNaN(m)) t.costo += m;
            });
            t.promedio = cnt ? Math.round(sum / cnt) : 0;
            $scope.totales = t;
        });

        // ===== INIT =====
        $scope.ViewAction = 'inicio';
        $scope.toggleFiltros = true;

        function warn(msg, err, toast) {
            console.warn(msg, err);
            if ($window.Swal && $window.Swal.fire && toast) {
                $window.Swal.fire({ icon: 'error', title: 'Error', text: (msg + (err && err.status ? ' (' + err.status + ')' : '')) });
            }
        }

        // Cargar combos al iniciar
        (function init() {
            console.log('🔄 Iniciando carga de combos...');
            console.log('🔄 Llamando cargarPlantas...');
            cargarPlantas();
            console.log('🔄 Llamando cargarCentros...');
            cargarCentros();
            console.log('🔄 Llamando cargarProyectos...');
            cargarProyectos();
            console.log('🔄 Llamando cargarTurnos...');
            cargarTurnos();
            console.log('🔄 Llamando cargarPerfiles...');
            cargarPerfiles();
            
            // Verificar carga después de un tiempo
            setTimeout(function() {
                console.log('📊 Estado de combos después de 2 segundos:');
                console.log('Plantas:', $scope.plantas.length);
                console.log('Centros:', $scope.centrosdecosto.length);
                console.log('Proyectos:', $scope.proyectos.length);
                console.log('Turnos:', $scope.turnos.length);
                console.log('Perfiles:', $scope.perfiles.length);
            }, 2000);
        })();

    });
})();
