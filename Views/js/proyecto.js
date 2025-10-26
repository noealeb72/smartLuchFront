// Verificar si el módulo ya existe
var app;
try {
    app = angular.module('AngujarJS');
    console.log('Módulo AngujarJS ya existe');
} catch (e) {
    app = angular.module('AngujarJS', []);
    console.log('Creando nuevo módulo AngujarJS');
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
	$scope.titulo = 'Proyecto';  // Título inicial
	$scope.base = 'http://localhost:8000/api/proyecto/';
	$scope.baseCentrodecostos = 'http://localhost:8000/api/centrodecosto/';
	$scope.centros = '';
	$scope.basePlanta = 'http://localhost:8000/api/planta/';
	$scope.plantas = '';
	$scope.searchText = ''; // Modelo de búsqueda vacío al inicio
	$scope.showValidationErrors = false; // Variable para mostrar leyendas de validación
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
		console.log('=== ModelCreate DEBUG ===');
		console.log('ModelCreate called with form:', form);
		
		// Inicializar variable de validación
		$scope.showValidationErrors = false;
		
		// Leer valores del modelo
		var nombre = $scope.view_nombre;
		var descripcion = $scope.view_descripcion;
		var planta = $scope.view_planta;
		var centrodecosto = $scope.view_centrodecosto;
		
		console.log('Form data:', {
			nombre: nombre,
			descripcion: descripcion,
			planta: planta,
			centrodecosto: centrodecosto
		});

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
				confirmButtonColor: '#5c636a'
			});
			
			return;
		}

		var jsonForm = { nombre: nombre, descripcion: descripcion, planta: planta, centrodecosto: centrodecosto };

		console.log('Enviando datos al servidor:', jsonForm);
		
		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Create',
			data: jsonForm
		}).then(function (success) {
			console.log('HTTP Success response:', success);
			if (success) {
				Swal.fire({
					title: 'Operación  Correcta',
					text: 'Proyecto creado correctamente',
					icon: 'success',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#5c636a'
				});
				$scope.ModelReadAll();
			}
		}, function (error) {
			console.log('HTTP Error response:', error);
			Swal.fire({
				title: 'Error',
				text: error.data || error.statusText || 'Error desconocido',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
			});
		});
	};*/
	$scope.ModelCreate = function () {
		console.log('=== ModelCreate DEBUG ===');

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

		console.log('Valores obtenidos:', {
			nombre: nombre,
			descripcion: descripcion,
			planta: planta,
			centrodecosto: centrodecosto
		});

		// Solo validar campos obligatorios: Nombre y Descripción
		$scope.showValidationErrors = false;

		if (!nombre || !descripcion) {
			$scope.showValidationErrors = true;

			Swal.fire({
				title: 'Campos requeridos',
				text: 'Completar campos requeridos',
				icon: 'warning',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
			});
			return;
		}

		var jsonForm = {
			nombre: nombre,
			descripcion: descripcion,
			planta: planta,
			centrodecosto: centrodecosto
		};

		console.log('Enviando datos al servidor:', jsonForm);

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
					confirmButtonColor: '#5c636a'
				});
			$scope.ModelReadAll();
		}, function (error) {
			Swal.fire({
				title: 'Error',
				text: error.data || error.statusText || 'Error desconocido',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
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
					confirmButtonColor: '#5c636a'
				});
			});
	};

	$scope.ModelReadAll = function () {
		$scope.dataset = [];
		$scope.searchKeyword;
		$scope.ViewAction = 'Lista de Items';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_planta = '';
		$scope.view_centrodecosto = '';

		$http.get($scope.base + 'getAll')
			.then(function (response) {
				$scope.dataset = response.data;
			}, function (error) {
				Swal.fire({
					title: 'Error',
					text: 'No se pudo cargar la lista de proyectos',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#5c636a'
				});
			});
	};

	$scope.ModelUpdate = function (form, view_id) {
		console.log('=== ModelUpdate DEBUG ===');
		console.log('ModelUpdate called with form:', form, 'view_id:', view_id);
		
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

		console.log('Valores obtenidos:', {
			nombre: nombre,
			descripcion: descripcion,
			planta: planta,
			centrodecosto: centrodecosto
		});

		console.log('Valores del scope:', {
			view_nombre: $scope.view_nombre,
			view_descripcion: $scope.view_descripcion,
			view_planta: $scope.view_planta,
			view_centrodecosto: $scope.view_centrodecosto
		});

		console.log('Valores del DOM:', {
			nombre_dom: document.getElementById('view_nombre')?.value,
			descripcion_dom: document.getElementById('view_descripcion')?.value,
			planta_dom: document.getElementById('view_planta')?.value,
			centrodecosto_dom: document.getElementById('view_centrodecosto')?.value
		});

		// Solo validar campos obligatorios: Nombre y Descripción
		$scope.showValidationErrors = false;

		if (!nombre || !descripcion) {
			$scope.showValidationErrors = true;

			Swal.fire({
				title: 'Campos requeridos',
				text: 'Completar campos requeridos',
				icon: 'warning',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
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

		console.log('Enviando datos al servidor:', jsonForm);
		
		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Update',
			data: jsonForm
		}).then(function (success) {
			console.log('HTTP Success response:', success);
			if (success) {
				Swal.fire({
					title: 'Operación  Correcta',
					text: 'Proyecto actualizado correctamente',
					icon: 'success',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#5c636a'
				});
				$scope.ModelReadAll();
			}
		}, function (error) {
			console.log('HTTP Error response:', error);
			Swal.fire({
				title: 'Error',
				text: error.data || error.statusText || 'Error desconocido',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
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
					confirmButtonColor: '#5c636a'
				});
				$scope.ModelReadAll();
			}
		}, function (error) {
			Swal.fire({
				title: 'Error',
				text: 'No se pudo eliminar el proyecto',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
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
					console.log('Centro de costo seleccionado automáticamente:', $scope.view_centrodecosto);
					$scope.$apply();
				}
			}, function (error) {
				Swal.fire({
					title: 'Error',
					text: 'No se pudo cargar la lista de centros de costo',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#5c636a'
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
					console.log('Planta seleccionada automáticamente:', $scope.view_planta);
					$scope.$apply();
				}
			}, function (error) {
				Swal.fire({
					title: 'Error',
					text: 'No se pudo cargar la lista de plantas',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#5c636a'
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
			confirmButtonColor: '#5c636a',
			cancelButtonColor: '#dc3545'
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

	$scope.currentPage = 0;
	$scope.pageSize = 20;

	$scope.numberOfPages = function () {
		return Math.ceil($scope.dataset.length / $scope.pageSize);
	}
});