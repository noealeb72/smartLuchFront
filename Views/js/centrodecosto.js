
// Reusar módulo si existe
var app;
try { app = angular.module('AngujarJS'); }
catch (e) { app = angular.module('AngujarJS', []); }

app.filter('startFrom', function () {
    return function (input, start) {
        if (!Array.isArray(input)) return input || [];
        start = +start || 0;
        return input.slice(start);
    };
});

app.controller('CentroDeCosto', function ($scope, $sce, $http, $window) {

    // Usar la variable de configuración global API_BASE_URL
    var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
    $scope.titulo = 'Centro de costo';
    $scope.base = apiBaseUrl + '/api/centrodecosto/';
    $scope.basePlanta = apiBaseUrl + '/api/planta/';
    
    // -------- Loading State ----------
    $scope.isLoading = true;
    
    // Inicializar paginación al inicio
    $scope.currentPage = 0;
    $scope.pageSize = 5; // Inicializar como número directamente
    
    $scope.searchText = '';
    $scope.showValidationErrors = false;
    
    // Inicializar variables del formulario
    $scope.view_nombre = '';
    $scope.view_descripcion = '';
    $scope.view_planta = '';

    // Helpers SweetAlert2
    function swalWarn(msg) {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                title: 'Completar campos requeridos',
                text: msg || '',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949'   // <— color del botón
            });
        } else {
            alert('Completar campos requeridos.\n' + (msg || ''));
        }
    }
    function swalOk(t, m) { Swal.fire({ title: t, text: m || '', icon: 'success', confirmButtonText: 'Aceptar' }); }
    function swalErr(t, m) { Swal.fire({ title: t, text: m || 'Error desconocido', icon: 'error', confirmButtonText: 'Aceptar' }); }

    // Marca todos los controles como "touched" para mostrar errores visuales
    function touchAll(form) {
        if (!form) return;
        Object.keys(form).forEach(function (k) {
            var c = form[k];
            if (c && c.$setTouched) c.$setTouched();
        });
    }

    // === CREATE ===
    $scope.ModelCreate = function (formValid) {
        //console.log('=== DEBUGGING ModelCreate ===');
        
        // Obtener valores directamente del DOM (más confiable)
        var nombreElement = document.getElementById('view_nombre');
        var descripcionElement = document.getElementById('view_descripcion');
        var plantaElement = document.getElementById('view_planta');
        
        var nombre = nombreElement ? nombreElement.value.trim() : '';
        var descripcion = descripcionElement ? descripcionElement.value.trim() : '';
        var planta = plantaElement ? plantaElement.value.trim() : '';
        
        /*console.log('Valores obtenidos del DOM:');
        console.log('- nombre:', nombre, 'length:', nombre.length);
        console.log('- descripcion:', descripcion, 'length:', descripcion.length);
        console.log('- planta:', planta, 'length:', planta.length);*/

        // Validación simple: solo nombre y descripción son obligatorios
        if (!nombre || !descripcion) {
            //console.log('VALIDACIÓN FALLÓ - Campos obligatorios vacíos');
            $scope.showValidationErrors = true;
            swalWarn('');
            return;
        }
        
        //console.log('VALIDACIÓN PASÓ - Procediendo a guardar');

        var jsonForm = { 
            nombre: nombre, 
            descripcion: descripcion, 
            planta: planta || '' // Planta es opcional
        };
        
        /*console.log('JSON a enviar:', jsonForm);
        console.log('URL:', $scope.base + 'Create');*/

        $http.post($scope.base + 'Create', jsonForm, {
            headers: { "Content-Type": "application/json; charset=utf-8" }
        })
            /*.then(function (response) {
                console.log('Respuesta del servidor:', response);
                swalOk('Operación Correcta', 'Centro de costo creado');
                $scope.ViewCancel();
                $scope.ModelReadAll();
            })*/
            .then(function (response) {
                //console.log('Respuesta del servidor:', response);
                Swal.fire({
                    title: 'Operación Correcta',
                    text: 'Centro de costo creado',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#F34949' // <-- color del botón
                });
                $scope.ViewCancel();
                $scope.ModelReadAll();
            })
            .catch(function (err) {
                /*console.log('Error del servidor:', err);
                console.log('Error data:', err.data);
                console.log('Error status:', err.status);
                console.log('Error statusText:', err.statusText);*/
                swalErr('Operación Incorrecta', (err && (err.data || err.statusText)) || 'Error desconocido');
            });
    };

    // === READ (uno) ===
    $scope.ModelRead = function (view_id) {
        $http.get($scope.base + 'get/' + view_id)
            .then(function (resp) {
                var d = Array.isArray(resp.data) ? resp.data[0] : resp.data;
                $scope.ModelReadPlantas();
                $scope.view_nombre = d && d.nombre || '';
                $scope.view_descripcion = d && d.descripcion || '';
                $scope.view_planta = d && d.planta || ''; // quedará seleccionado si existe
            })
            .catch(function () { swalErr('Error', 'No se pudo cargar el centro de costo'); });
    };

    // === READ ALL ===
    $scope.ModelReadAll = function () {
        $scope.isLoading = true;
        $scope.dataset = [];
        $scope.ViewAction = 'Lista de Items';
        $scope.view_id = -1;
        $scope.view_nombre = '';
        $scope.view_descripcion = '';
        $scope.view_planta = '';

        $http.get($scope.base + 'getAll')
            .then(function (resp) { 
                $scope.dataset = Array.isArray(resp.data) ? resp.data : [];
                $scope.isLoading = false;
            })
            .catch(function () { 
                $scope.isLoading = false;
                swalErr('Error', 'No se pudo cargar la lista de centros de costo'); 
            });
    };

    // === UPDATE ===
    $scope.ModelUpdate = function (formValid, view_id) {
        var form = $scope.centroForm;
        
        // Esperar un poco para que el DOM se actualice
        setTimeout(function() {
            // Obtener valores directamente del DOM como respaldo
            var nombreField = document.getElementById('view_nombre');
            var descripcionField = document.getElementById('view_descripcion');
            var plantaField = document.getElementById('view_planta');
            
            var nombre = nombreField ? nombreField.value.trim() : '';
            var descripcion = descripcionField ? descripcionField.value.trim() : '';
            var planta = plantaField ? plantaField.value.trim() : '';

            /*console.log('=== UPDATE CENTRO DE COSTO ===');
            console.log('Valores desde DOM (actuales):');
            console.log('nombre:', nombre);
            console.log('descripcion:', descripcion);
            console.log('planta:', planta);
            console.log('Valores desde scope (pueden estar desactualizados):');
            console.log('view_nombre:', $scope.view_nombre);
            console.log('view_descripcion:', $scope.view_descripcion);
            console.log('view_planta:', $scope.view_planta);*/

            // Solo validamos nombre y descripción, planta es opcional
            if (!formValid || !nombre || !descripcion) {
                $scope.showValidationErrors = true;
                touchAll(form);
                swalWarn();
                return;
            }

            var jsonForm = { id: view_id, nombre: nombre, descripcion: descripcion, planta: planta };
            //console.log('Payload Update:', jsonForm);

            $http.post($scope.base + 'Update', jsonForm, {
                headers: { "Content-Type": "application/json; charset=utf-8" }
            })
                .then(function () {
                    swalOk('Operación Correcta', 'Centro de costo actualizado', { confirmButtonColor: '#343A40' });
                    $scope.ViewCancel();
                    $scope.ModelReadAll();
                })
                .catch(function (err) {
                    var msg = (err && (err.data || err.statusText)) || 'Error desconocido';
                    swalErr('Operación Incorrecta', msg);
                });
        }, 100);
    };

    // === DELETE ===
    $scope.ModelDelete = function (view_id) {
        var jsonForm = { id: view_id };
        $http.post($scope.base + 'Delete', jsonForm, {
            headers: { "Content-Type": "application/json; charset=utf-8" }
        })
            .then(function () {
                swalOk('Operación Correcta', 'Centro de costo eliminado', { confirmButtonColor: '#1F2326' });
                $scope.ModelReadAll();
            })
            .catch(function () { swalErr('Operación Incorrecta', 'No se pudo eliminar el centro de costo', { confirmButtonColor: '#343A40' }); });
    };

    // === Catálogo de plantas ===
    $scope.ModelReadPlantas = function () {
        $http.get($scope.basePlanta + 'getAll')
            .then(function (resp) { 
                $scope.plantas = Array.isArray(resp.data) ? resp.data : []; 
                
                // Ordenar plantas alfabéticamente por nombre
                $scope.plantas.sort(function(a, b) {
                    return a.nombre.localeCompare(b.nombre);
                });
                
               // console.log('Plantas cargadas:', $scope.plantas.length);
                
                // Si estamos en modo "Nuevo" y hay plantas disponibles, seleccionar la primera (ordenada)
                if ($scope.ViewAction === 'Nuevo' && $scope.plantas.length > 0) {
                    $scope.view_planta = $scope.plantas[0].nombre;
                    //console.log('Planta seleccionada automáticamente (ordenada):', $scope.view_planta);
                    
                    // Forzar actualización del DOM
                    setTimeout(function() {
                        var plantaElement = document.getElementById('view_planta');
                        if (plantaElement) {
                            plantaElement.value = $scope.view_planta;
                        }
                    }, 50);
                }
            })
            .catch(function () { 
                //console.log('Error cargando plantas');
                swalErr('Error', 'No se pudo cargar la lista de plantas'); 
            });
    };

    // === Vistas ===
    $scope.ViewCreate = function () {
        //onsole.log('=== ViewCreate llamado ===');
        $scope.ViewAction = 'Nuevo';
        $scope.view_id = -1;
        $scope.view_nombre = '';
        $scope.view_descripcion = '';
        $scope.view_planta = '';
        $scope.showValidationErrors = false;
        
        /*console.log('Campos inicializados:', {
            nombre: $scope.view_nombre,
            descripcion: $scope.view_descripcion,
            planta: $scope.view_planta
        });*/
        
        // Cargar plantas y seleccionar la primera automáticamente
        $scope.ModelReadPlantas();
        
        // Forzar actualización del scope después de un pequeño delay
        setTimeout(function() {
            $scope.$apply();
        }, 100);
    };

    $scope.ViewUpdate = function (view_id) {
        $scope.ViewAction = 'Editar';
        $scope.view_id = view_id;
        $scope.showValidationErrors = false;
        $scope.ModelRead(view_id);
    };

    $scope.ViewDelete = function (view_id) {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                title: 'Baja registro',
                text: '¿Desea dar de baja el centro de costo?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#F34949',
               cancelButtonColor: '#d33'
            }).then(function (r) {
                if (r.isConfirmed) $scope.ModelDelete(view_id);
            });
        } else if (confirm('¿Desea eliminar el centro de costo?')) {
            $scope.ModelDelete(view_id);
        }
    };

    $scope.ViewCancel = function () {
        $scope.ViewAction = 'Lista de Items';
        $scope.view_nombre = '';
        $scope.view_descripcion = '';
        $scope.view_planta = '';
        $scope.showValidationErrors = false;
    };

    // Init
    $scope.ModelReadAll();
    // currentPage y pageSize ya están inicializados al inicio del controlador
    $scope.numberOfPages = function () {
        var arr = ($scope.filteredData || $scope.dataset) || [];
        var len = Array.isArray(arr) ? arr.length : 0;
        return Math.ceil(len / ($scope.pageSize || 1));
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
});
