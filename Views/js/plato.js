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
    // Usar la variable de configuración global API_BASE_URL
    var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
    $scope.titulo = 'Gestión de Platos';
    $scope.base = apiBaseUrl + '/api/plato/';
    $scope.basePlan = apiBaseUrl + '/api/plannutricional/';

    // -------- Loading State ----------
    $scope.isLoading = true;

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
    $scope.pageSize = 5; // Por defecto 5 filas (número)
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
        //console.log('Éxito:', title || 'Operación Correcta', text || '');
    }
    function fireErr(title, text) {
        // Popup de alert eliminado
        //console.log('Error:', title || 'Operación Incorrecta', text || '');
    }
    function fireWarn(title, text) {
        // Popup de alert eliminado
        //console.log('Advertencia:', title || 'Atención', text || '');
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

    // Funciones para paginación tipo DataTable (igual que reportegcomensales)
    $scope.numberOfPages = function () {
        var arr = ($scope.filteredData || $scope.dataset) || [];
        var len = Array.isArray(arr) ? arr.length : 0;
        return Math.ceil(len / $scope.pageSize);
    };

    $scope.getPageNumbers = function() {
        var pages = [];
        var totalPages = $scope.numberOfPages();
        var current = $scope.currentPage;
        
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
        $scope.pageSize = parseInt(newSize);
        $scope.currentPage = 0; // Volver a la primera página
    };

    // --------- CRUD ---------
    $scope.ModelCreate = function (isValid) {
        //console.log('ModelCreate - isValid:', isValid);
        
        if (!isValid) {
            // Primero mostrar el popup
            Swal.fire({
                title: 'Completar campos requeridos',
                text: '',
                icon: 'warning',
                showCancelButton: false,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949',
                buttonsStyling: true
            }).then(() => {
                // Después del popup, mostrar las leyendas rojas
                $scope.showValidationErrors = true;
                //console.log('ModelCreate - showValidationErrors establecido en true después del popup');
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
                var errorMessage = 'No se pudo crear el plato.';
                
                // Manejar error 409 (Conflict) - código duplicado
                if (err.status === 409) {
                    errorMessage = 'El código del plato ya existe. Por favor, use un código diferente.';
                } else if (err.data && err.data.Message) {
                    errorMessage = err.data.Message;
                } else if (err.data && typeof err.data === 'string') {
                    errorMessage = err.data;
                } else if (err.statusText) {
                    errorMessage = 'Error: ' + err.statusText;
                }
                
                fireErr('Error al crear', errorMessage);
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
        $scope.isLoading = true;
        $scope.ViewAction = 'Platos';
        $scope.plato = {};
        $scope.view_previewImage = '';
        $scope.filteredData = null;
        $http.get($scope.base + 'getAll')
            .then(function (resp) {
                $scope.dataset = Array.isArray(resp.data) ? resp.data : [];
                recomputePages();
                $scope.isLoading = false;
            })
            .catch(function () {
                $scope.isLoading = false;
                fireErr('Ha ocurrido un error', 'Api no presente');
            });
    };

    $scope.ModelUpdate = function (isValid, view_id) {
        //console.log('ModelUpdate - isValid:', isValid);
        
        if (!isValid) {
            // Primero mostrar el popup
            Swal.fire({
                title: 'Completar campos requeridos',
                text: '',
                icon: 'warning',
                showCancelButton: false,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949',
                buttonsStyling: true
            }).then(() => {
                // Después del popup, mostrar las leyendas rojas
                $scope.showValidationErrors = true;
                //console.log('ModelUpdate - showValidationErrors establecido en true después del popup');
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
            .catch(function (err) {
                console.error(err);
                var errorMessage = 'No se pudo actualizar el plato.';
                
                // Manejar error 409 (Conflict) - código duplicado
                if (err.status === 409) {
                    errorMessage = 'El código del plato ya existe. Por favor, use un código diferente.';
                } else if (err.data && err.data.Message) {
                    errorMessage = err.data.Message;
                } else if (err.data && typeof err.data === 'string') {
                    errorMessage = err.data;
                } else if (err.statusText) {
                    errorMessage = 'Error: ' + err.statusText;
                }
                
                fireErr('Error al actualizar', errorMessage);
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
                        //console.log('Plan Nutricional seleccionado por defecto:', $scope.plato.plannutricional);
                    }
                }
            })
            .catch(function () {
                fireErr('Error', 'Error al obtener planes nutricionales.');
            });
    };

    // --------- Generación automática de código ---------
    // Función para generar código automáticamente desde la descripción
    // Ejemplo: "Milanesa de pollo con arroz y ensalada" -> "MIL-ARROZ"
    $scope.generarCodigoDesdeDescripcion = function(descripcion) {
        if (!descripcion || descripcion.trim() === '') {
            return '';
        }
        
        // Palabras comunes a excluir (artículos, preposiciones, conjunciones)
        var palabrasExcluidas = ['de', 'con', 'y', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 
                                  'del', 'al', 'en', 'por', 'para', 'a', 'o', 'e', 'u', 'que', 'cual', 
                                  'cuales', 'donde', 'cuando', 'como', 'si', 'no', 'ni', 'pero', 'mas', 
                                  'sin', 'sobre', 'bajo', 'entre', 'hasta', 'desde', 'durante', 'mediante'];
        
        // Palabras clave comunes de platos (se incluyen completas si están presentes)
        var palabrasClave = ['arroz', 'pollo', 'carne', 'pescado', 'ensalada', 'pasta', 'papa', 'papas',
                             'tomate', 'lechuga', 'zanahoria', 'cebolla', 'ajo', 'queso', 'huevo', 'huevos'];
        
        // Normalizar: convertir a minúsculas, eliminar acentos y caracteres especiales
        var texto = descripcion.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^a-z0-9\s]/g, ' ') // Reemplazar caracteres especiales por espacios
            .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
            .trim();
        
        // Dividir en palabras y filtrar
        var palabras = texto.split(/\s+/)
            .filter(function(palabra) {
                return palabra.length > 0 && palabrasExcluidas.indexOf(palabra) === -1;
            });
        
        if (palabras.length === 0) {
            return '';
        }
        
        var codigoPartes = [];
        
        // Primera palabra: siempre las primeras 3 letras
        if (palabras.length > 0) {
            var primeraPalabra = palabras[0];
            if (primeraPalabra.length >= 3) {
                codigoPartes.push(primeraPalabra.substring(0, 3).toUpperCase());
            } else {
                codigoPartes.push(primeraPalabra.toUpperCase());
            }
        }
        
        // Buscar palabras clave en el resto de las palabras
        var palabraClaveEncontrada = null;
        for (var i = 1; i < palabras.length && !palabraClaveEncontrada; i++) {
            var palabra = palabras[i];
            // Verificar si es una palabra clave
            for (var j = 0; j < palabrasClave.length; j++) {
                if (palabra === palabrasClave[j] || palabra.indexOf(palabrasClave[j]) === 0) {
                    palabraClaveEncontrada = palabrasClave[j];
                    break;
                }
            }
        }
        
        // Si se encontró una palabra clave, agregarla completa (máximo 6 letras)
        if (palabraClaveEncontrada) {
            if (palabraClaveEncontrada.length <= 6) {
                codigoPartes.push(palabraClaveEncontrada.toUpperCase());
            } else {
                codigoPartes.push(palabraClaveEncontrada.substring(0, 6).toUpperCase());
            }
        } else if (palabras.length > 1) {
            // Si no hay palabra clave, tomar la segunda palabra importante (primeras 3 letras)
            var segundaPalabra = palabras[1];
            if (segundaPalabra.length >= 3) {
                codigoPartes.push(segundaPalabra.substring(0, 3).toUpperCase());
            } else {
                codigoPartes.push(segundaPalabra.toUpperCase());
            }
        }
        
        // Unir con guiones (máximo 2 partes)
        return codigoPartes.slice(0, 2).join('-');
    };
    
    // Función para generar código automáticamente cuando cambia la descripción (al escribir)
    $scope.onDescripcionChange = function() {
        generarCodigoSiEsNecesario();
    };
    
    // Función para generar código automáticamente cuando el usuario sale del campo (al pegar o al perder el foco)
    $scope.onDescripcionBlur = function() {
        generarCodigoSiEsNecesario();
    };
    
    // Función auxiliar para generar el código si es necesario
    function generarCodigoSiEsNecesario() {
        // Solo generar código automáticamente si:
        // 1. Estamos en modo "Nuevo Plato"
        // 2. Hay una descripción
        if ($scope.ViewAction === 'Nuevo Plato' && 
            $scope.plato.descripcion && 
            $scope.plato.descripcion.trim() !== '') {
            
            // Verificar si el código actual coincide con el que se generaría (para saber si fue modificado)
            var codigoActual = $scope.plato.codigo || '';
            var codigoGenerado = $scope.generarCodigoDesdeDescripcion($scope.plato.descripcion);
            
            // Solo actualizar si:
            // 1. El código está vacío, O
            // 2. El código coincide con el generado anteriormente (no fue modificado manualmente), O
            // 3. El código no fue generado automáticamente (primera vez)
            if (!codigoActual || 
                codigoActual === '' || 
                codigoActual === $scope.codigoAnteriorGenerado ||
                !$scope.codigoAutoGenerado) {
                if (codigoGenerado && codigoGenerado !== '') {
                    $scope.plato.codigo = codigoGenerado;
                    $scope.codigoAnteriorGenerado = codigoGenerado;
                    $scope.codigoAutoGenerado = true;
                }
            }
        }
    }
    
    // Watch para detectar si el usuario modifica manualmente el código
    $scope.$watch('plato.codigo', function(newVal, oldVal) {
        // Si el usuario modifica el código manualmente, desactivar la generación automática
        if ($scope.ViewAction === 'Nuevo Plato' && 
            newVal !== oldVal && 
            oldVal !== undefined && 
            $scope.codigoAutoGenerado) {
            // Si el código cambió y no coincide con el generado, fue modificado manualmente
            var codigoGenerado = $scope.generarCodigoDesdeDescripcion($scope.plato.descripcion);
            if (newVal !== codigoGenerado && newVal !== '') {
                $scope.codigoAutoGenerado = false;
                $scope.codigoAnteriorGenerado = null;
            }
        }
    });

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
        $scope.codigoAutoGenerado = false; // Resetear flag de código auto-generado
        $scope.codigoAnteriorGenerado = null; // Resetear código anterior generado
        $scope.ModelReadPlanes();
        
        // Asegurar que se seleccione el primer plan nutricional después de cargar
        setTimeout(function() {
            if ($scope.planes && $scope.planes.length > 0 && (!$scope.plato.plannutricional || $scope.plato.plannutricional === '')) {
                $scope.plato.plannutricional = $scope.planes[0].nombre;
                //console.log('Plan Nutricional establecido por defecto en ViewCreate:', $scope.plato.plannutricional);
                $scope.$apply();
            }
        }, 300);
    };

    $scope.ViewUpdate = function (view_id) {
        $scope.ViewAction = 'Editar Plato';
        $scope.titulo = 'Modificar plato';
        $scope.showValidationErrors = true;
        $scope.codigoAutoGenerado = false; // Desactivar generación automática en modo edición
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
            confirmButtonColor: '#F34949',
            cancelButtonColor: '#C92A2A',
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
