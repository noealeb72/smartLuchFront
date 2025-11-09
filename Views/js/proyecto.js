// Verificar si el módulo ya existe
var app;
try {
    app = angular.module('AngujarJS');
} catch (e) {
    app = angular.module('AngujarJS', []);
}

app.filter('startFrom', function () {
	return function (input, start) {
		start = +start; //parse to int
		return input.slice(start);
	}
});

app.filter('formatDateArg', function () {
	return function (input) {
		var date = input.split('-');
		input = date[2] + '/' + date[1] + '/' + date[0];
		return input;
	}
});

app.controller('Proyecto', function ($scope, $sce, $http, $window) {
	// Usar la variable de configuración global API_BASE_URL
	var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
	$scope.titulo = 'Proyecto';  // Título inicial
	$scope.base = apiBaseUrl + '/api/proyecto/';
	$scope.baseCentrodecostos = apiBaseUrl + '/api/centrodecosto/';
	$scope.centros = '';
	$scope.basePlanta = apiBaseUrl + '/api/planta/';
	$scope.plantas = '';
	
	// -------- Loading State ----------
	$scope.isLoading = true;
	
	// Inicializar variables
	$scope.ViewAction = 'Lista de Items';
	$scope.dataset = [];
	$scope.filteredData = null;
	$scope.searchText = ''; // Modelo de búsqueda vacío al inicio
	$scope.showValidationErrors = false; // Variable para mostrar leyendas de validación
	
	// Inicializar paginación al inicio
	$scope.currentPage = 0;
	$scope.pageSize = 5; // Inicializar como número directamente
	////////////////////////////////////////////////USER////////////////////////////////////////////////
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

	/*$scope.ModelCreate = function (form) {
		
		// Inicializar variable de validación
		$scope.showValidationErrors = false;
		
		// Leer valores del modelo
		var nombre = $scope.view_nombre;
		var descripcion = $scope.view_descripcion;
		var planta = $scope.view_planta;
		var centrodecosto = $scope.view_centrodecosto;
		

		// Validación de campos vacíos
		var camposFaltantes = [];
		
		if (!nombre || nombre.trim() === '') {
			camposFaltantes.push('Nombre');
		}

		if (!descripcion || descripcion.trim() === '') {
			camposFaltantes.push('Descripción');
		}

		// Si hay campos faltantes, mostrar popup y leyendas rojas
		if (camposFaltantes.length > 0) {
			$scope.showValidationErrors = true;
			
			// Mostrar popup con SweetAlert2
			Swal.fire({
				title: 'Campos requeridos',
				text: 'Completar campos requeridos',
				icon: 'warning',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
			
			return;
		}

		var jsonForm = { nombre: nombre, descripcion: descripcion, planta: planta, centrodecosto: centrodecosto };

		
		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Create',
			data: jsonForm
		}).then(function (success) {
			if (success) {
				Swal.fire({
					title: 'Operación  Correcta',
					text: 'Proyecto creado correctamente',
					icon: 'success',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
				$scope.ModelReadAll();
			}
		}, function (error) {
			Swal.fire({
				title: 'Error',
				text: error.data || error.statusText || 'Error desconocido',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
		});
	};*/
	$scope.ModelCreate = function () {

		// Obtener valores del scope y como fallback del DOM
		var nombre = $scope.view_nombre || document.getElementById('view_nombre')?.value || '';
		var descripcion = $scope.view_descripcion || document.getElementById('view_descripcion')?.value || '';
		var planta = $scope.view_planta || document.getElementById('view_planta')?.value || '';
		var centrodecosto = $scope.view_centrodecosto || document.getElementById('view_centrodecosto')?.value || '';

		// Limpiar espacios en blanco
		nombre = nombre.trim();
		descripcion = descripcion.trim();
		planta = planta.trim();
		centrodecosto = centrodecosto.trim();


		// Solo validar campos obligatorios: Nombre y Descripción
		$scope.showValidationErrors = false;

		if (!nombre || !descripcion) {
			$scope.showValidationErrors = true;

			Swal.fire({
				title: 'Campos requeridos',
				text: 'Completar campos requeridos',
				icon: 'warning',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
			return;
		}

		var jsonForm = {
			nombre: nombre,
			descripcion: descripcion,
			planta: planta,
			centrodecosto: centrodecosto
		};


		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Create',
			data: jsonForm
		}).then(function (success) {
				Swal.fire({
					title: 'Operación  Correcta',
					text: 'Proyecto creado correctamente',
					icon: 'success',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			$scope.ModelReadAll();
		}, function (error) {
			Swal.fire({
				title: 'Error',
				text: error.data || error.statusText || 'Error desconocido',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
		});
	};



	$scope.ModelRead = function (view_id) {
		$http.get($scope.base + 'get/' + view_id)
			.then(function (response) {
				$scope.ModelReadCentros();
				$scope.ModelReadPlantas();
				$scope.view_nombre = response.data[0].nombre;
				$scope.view_descripcion = response.data[0].descripcion;
				$scope.view_planta = response.data[0].planta;
				$scope.view_centrodecosto = response.data[0].centrodecosto;
			}, function (error) {
				Swal.fire({
					title: 'Error',
					text: 'No se pudo cargar el proyecto',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			});
	};

	$scope.ModelReadAll = function () {
		$scope.isLoading = true;
		$scope.dataset = [];
		$scope.searchKeyword = '';
		$scope.ViewAction = 'Lista de Items';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_planta = '';
		$scope.view_centrodecosto = '';

		$http.get($scope.base + 'getAll')
			.then(function (response) {
				$scope.dataset = response.data;
				$scope.isLoading = false;
			}, function (error) {
				$scope.isLoading = false;
				Swal.fire({
					title: 'Error',
					text: 'No se pudo cargar la lista de proyectos',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			});
	};

	$scope.ModelUpdate = function (form, view_id) {
		
		// Obtener valores directamente del DOM para asegurar que tenemos los valores actuales
		var nombre = document.getElementById('view_nombre')?.value || $scope.view_nombre || '';
		var descripcion = document.getElementById('view_descripcion')?.value || $scope.view_descripcion || '';
		var planta = document.getElementById('view_planta')?.value || $scope.view_planta || '';
		var centrodecosto = document.getElementById('view_centrodecosto')?.value || $scope.view_centrodecosto || '';

		// Limpiar espacios en blanco
		nombre = nombre.trim();
		descripcion = descripcion.trim();
		planta = planta.trim();
		centrodecosto = centrodecosto.trim();




		// Solo validar campos obligatorios: Nombre y Descripción
		$scope.showValidationErrors = false;

		if (!nombre || !descripcion) {
			$scope.showValidationErrors = true;

			Swal.fire({
				title: 'Campos requeridos',
				text: 'Completar campos requeridos',
				icon: 'warning',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
			return;
		}

		var jsonForm = { 
			id: view_id, 
			nombre: nombre, 
			descripcion: descripcion, 
			planta: planta, 
			centrodecosto: centrodecosto 
		};

		
		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Update',
			data: jsonForm
		}).then(function (success) {
			if (success) {
				Swal.fire({
					title: 'Operación  Correcta',
					text: 'Proyecto actualizado correctamente',
					icon: 'success',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
				$scope.ModelReadAll();
			}
		}, function (error) {
			Swal.fire({
				title: 'Error',
				text: error.data || error.statusText || 'Error desconocido',
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
		}).then(function (success) {
			if (success) {
				Swal.fire({
					title: 'Operación  Correcta',
					text: 'Proyecto eliminado correctamente',
					icon: 'success',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
				$scope.ModelReadAll();
			}
		}, function (error) {
			Swal.fire({
				title: 'Error',
				text: 'No se pudo eliminar el proyecto',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
		});
	}

	$scope.ModelReadCentros = function () {
		$http.get($scope.baseCentrodecostos + 'getAll')
			.then(function (response) {
				// Ordenar alfabéticamente por nombre
				$scope.centros = response.data.sort(function(a, b) {
					return a.nombre.localeCompare(b.nombre);
				});
				
				// Si estamos en modo "Nueva Proyecto" y hay centros disponibles, seleccionar el primero
				if ($scope.ViewAction === 'Nueva Proyecto' && $scope.centros.length > 0) {
					$scope.view_centrodecosto = $scope.centros[0].nombre;
					$scope.$apply();
				}
			}, function (error) {
				Swal.fire({
					title: 'Error',
					text: 'No se pudo cargar la lista de centros de costo',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			});
	};

	$scope.ModelReadPlantas = function () {
		$http.get($scope.basePlanta + 'getAll')
			.then(function (response) {
				// Ordenar alfabéticamente por nombre
				$scope.plantas = response.data.sort(function(a, b) {
					return a.nombre.localeCompare(b.nombre);
				});
				
				// Si estamos en modo "Nueva Proyecto" y hay plantas disponibles, seleccionar la primera
				if ($scope.ViewAction === 'Nueva Proyecto' && $scope.plantas.length > 0) {
					$scope.view_planta = $scope.plantas[0].nombre;
					$scope.$apply();
				}
			}, function (error) {
				Swal.fire({
					title: 'Error',
					text: 'No se pudo cargar la lista de plantas',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			});
	};

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nueva Proyecto';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_planta = '';
		$scope.view_centrodecosto = '';
		$scope.showValidationErrors = false;
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar Proyecto';
		$scope.view_id = view_id;
		$scope.showValidationErrors = false;
		$scope.ModelRead(view_id);
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
	};

	$scope.ViewDelete = function (view_id) {
		Swal.fire({
			title: 'Eliminar registro',
			text: 'Desea eliminar proyecto?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#F34949',
			cancelButtonColor: '#C92A2A'
		}).then((result) => {
			if (result.isConfirmed) {
				$scope.ModelDelete(view_id);
			}
		});
	};

	$scope.ViewCancel = function () {
		$scope.ViewAction = 'Lista de Items';
		$scope.showValidationErrors = false;
	};

	$scope.ModelReadAll();
	$scope.data = [];
	for (var i = 0; i < 45; i++) {
		$scope.data.push("Item " + i);
	}

	// currentPage y pageSize ya están inicializados al inicio del controlador

	$scope.numberOfPages = function () {
		var arr = ($scope.filteredData || $scope.dataset) || [];
		var len = Array.isArray(arr) ? arr.length : 0;
		return Math.ceil(len / $scope.pageSize);
	}

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