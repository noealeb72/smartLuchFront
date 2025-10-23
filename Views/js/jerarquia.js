var app = angular.module('AngujarJS', []);

app.filter('startFrom', function () {
	return function (input, start) {
		start = +start; //parse to int
		return input.slice(start);
	}
});

app.controller('Jerarquia', function ($scope, $sce, $http, $window) {

	$scope.base = 'http://localhost:8000/api/jerarquia/';
	
	// Función touchAll copiada de plan-nutricional
	function touchAll(form) {
		if (!form) return;
		form.$setSubmitted && form.$setSubmitted();
		angular.forEach(form.$error, function (fields) {
			angular.forEach(fields, function (field) {
				field.$setTouched && field.$setTouched();
			});
		});
	}
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

	// Función para validar porcentaje en tiempo real
	$scope.validatePercentage = function(value) {
		if (value && value !== '') {
			var num = parseInt(value);
			if (num > 100) {
				$scope.view_bonificacion = 100;
				$scope.view_bonificacion_editar = 100;
			} else if (num < 0) {
				$scope.view_bonificacion = 0;
				$scope.view_bonificacion_editar = 0;
			}
		}
	};

	$scope.ModelCreate = function (isValid, form) {
		console.log('ModelCreate ejecutándose - isValid:', isValid, 'form:', form);
		if (!isValid) { 
			console.log('Formulario no válido, mostrando popup');
			console.log('SweetAlert2 disponible:', typeof Swal !== 'undefined');
			touchAll(form); 
			
			// Verificar si SweetAlert2 está disponible
			if (typeof Swal !== 'undefined') {
				Swal.fire({ 
					title: '¡Campos Obligatorios!', 
					text: 'Debes completar los campos Nombre, Descripción y Porcentaje de bonificación para continuar.', 
					icon: 'warning',
					confirmButtonText: 'Entendido'
				}); 
			} else {
				alert('¡Campos Obligatorios!\nDebes completar los campos Nombre, Descripción y Porcentaje de bonificación para continuar.');
			}
			return; 
		}
		var payload = { 
			nombre: (($scope.view_nombre || '') + '').trim(), 
			descripcion: (($scope.view_descripcion || '') + '').trim(),
			bonificacion: (($scope.view_bonificacion || '') + '').trim()
		};
		if (!payload.nombre || !payload.descripcion || !payload.bonificacion) { 
			console.log('Campos vacíos después del trim');
			touchAll(form); 
			
			if (typeof Swal !== 'undefined') {
				Swal.fire({ 
					title: '¡Campos Vacíos!', 
					text: 'Los campos Nombre, Descripción y Porcentaje de bonificación no pueden estar vacíos.', 
					icon: 'error',
					confirmButtonText: 'Entendido'
				}); 
			} else {
				alert('¡Campos Vacíos!\nLos campos Nombre, Descripción y Porcentaje de bonificación no pueden estar vacíos.');
			}
			return; 
		}

		// Validar que la bonificación sea un número válido
		var bonificacionNum = parseInt(payload.bonificacion);
		if (isNaN(bonificacionNum) || bonificacionNum < 0 || bonificacionNum > 100) {
			Swal.fire({
				title: 'Valor inválido',
				text: 'El porcentaje de bonificación debe ser un número entre 0 y 100. Valor ingresado: ' + payload.bonificacion,
				icon: 'error',
				confirmButtonText: 'Entendido'
			});
			return;
		}

		var jsonForm = {
			nombre: payload.nombre,
			descripcion: payload.descripcion,
			bonificacion: bonificacionNum
		};

		$http({
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			url: $scope.base + 'create',
			data: jsonForm
		}).then(function (response) {
			Swal.fire({
				title: 'Éxito',
				text: 'Jerarquía creada correctamente',
				icon: 'success',
				confirmButtonText: 'Entendido'
			}).then(function () {
				$scope.ModelReadAll();
			});
		}, function (error) {
			Swal.fire({
				title: 'Error',
				text: 'Error al crear la jerarquía: ' + error.data,
				icon: 'error',
				confirmButtonText: 'Entendido'
			});
		});
	};

	$scope.ModelRead = function (view_id) {
		console.log('=== INICIANDO ModelRead ===');
		console.log('ID recibido:', view_id);
		console.log('URL de la petición:', $scope.base + 'get/' + view_id);
		
		$http.get($scope.base + 'get/' + view_id)
			.success(function (data) {
				console.log('=== RESPUESTA DEL SERVIDOR ===');
				console.log('Datos completos recibidos:', data);
				console.log('Tipo de datos:', typeof data);
				console.log('Es array:', Array.isArray(data));
				console.log('Longitud del array:', data ? data.length : 'No es array');
				
				if (data && data.length > 0) {
					console.log('=== PRIMER ELEMENTO DEL ARRAY ===');
					console.log('data[0]:', data[0]);
					console.log('data[0].nombre:', data[0].nombre);
					console.log('data[0].descripcion:', data[0].descripcion);
					console.log('data[0].bonificacion:', data[0].bonificacion);
					console.log('Tipo de bonificación:', typeof data[0].bonificacion);
					
					console.log('=== ANTES DE ASIGNAR ===');
					console.log('view_nombre antes:', $scope.view_nombre);
					console.log('view_descripcion antes:', $scope.view_descripcion);
					console.log('view_bonificacion antes:', $scope.view_bonificacion);
					console.log('view_bonificacion_editar antes:', $scope.view_bonificacion_editar);
					
					// Asignar valores
					$scope.view_nombre = data[0].nombre;
					$scope.view_descripcion = data[0].descripcion;
					
					// Convertir bonificación a número explícitamente
					console.log('=== CONVERSIÓN DE BONIFICACIÓN ===');
					console.log('Valor original del servidor:', data[0].bonificacion);
					console.log('Tipo original:', typeof data[0].bonificacion);
					
					var bonificacionNum = parseFloat(data[0].bonificacion);
					console.log('Después de parseFloat:', bonificacionNum);
					console.log('Tipo después de parseFloat:', typeof bonificacionNum);
					
					if (isNaN(bonificacionNum)) {
						console.log('Es NaN, asignando 0');
						bonificacionNum = 0;
					}
					
					console.log('Valor final a asignar:', bonificacionNum);
					console.log('Tipo final:', typeof bonificacionNum);
					
					$scope.view_bonificacion = bonificacionNum;
					$scope.view_bonificacion_editar = bonificacionNum;
					
					console.log('=== DESPUÉS DE ASIGNAR ===');
					console.log('view_nombre después:', $scope.view_nombre);
					console.log('view_descripcion después:', $scope.view_descripcion);
					console.log('view_bonificacion después:', $scope.view_bonificacion);
					console.log('view_bonificacion_editar después:', $scope.view_bonificacion_editar);
					
					// Verificar si los valores se asignaron correctamente
					console.log('=== VERIFICACIÓN DE ASIGNACIÓN ===');
					console.log('¿Nombre asignado correctamente?:', $scope.view_nombre === data[0].nombre);
					console.log('¿Descripción asignada correctamente?:', $scope.view_descripcion === data[0].descripcion);
					console.log('¿Bonificación asignada correctamente?:', $scope.view_bonificacion === data[0].bonificacion);
					console.log('¿Bonificación editar asignada correctamente?:', $scope.view_bonificacion_editar === data[0].bonificacion);
				} else {
					console.log('ERROR: No hay datos en la respuesta o el array está vacío');
				}
			})
			.error(function (data, status) {
				console.log('=== ERROR EN LA PETICIÓN ===');
				console.log('Status:', status);
				console.log('Data del error:', data);
				Swal.fire(
					'Ha ocurrido un error',
					'Api no presente',
					'error'
				);
			});
	};

	$scope.ModelReadAll = function () {
		$scope.dataset = [];
		$scope.searchKeyword;
		$scope.ViewAction = 'Lista de Items';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_bonificacion = '';

		$http.get($scope.base + 'getAll')
			.success(function (data) {
				$scope.dataset = data;
			})
			.error(function (data, status) {
				Swal.fire(
					'Ha ocurrido un error',
					'Api no presente',
					'error'
				);
			});
	};

	$scope.ModelUpdate = function (isValid, view_id, form) {
		console.log('ModelUpdate ejecutándose - isValid:', isValid, 'view_id:', view_id, 'form:', form);
		if (!isValid) { 
			console.log('Formulario no válido, mostrando popup');
			console.log('SweetAlert2 disponible:', typeof Swal !== 'undefined');
			touchAll(form); 
			
			// Verificar si SweetAlert2 está disponible
			if (typeof Swal !== 'undefined') {
				Swal.fire({ 
					title: '¡Campos Obligatorios!', 
					text: 'Debes completar los campos Nombre, Descripción y Porcentaje de bonificación para continuar.', 
					icon: 'warning',
					confirmButtonText: 'Entendido'
				}); 
			} else {
				alert('¡Campos Obligatorios!\nDebes completar los campos Nombre, Descripción y Porcentaje de bonificación para continuar.');
			}
			return; 
		}
		
		var payload = { 
			nombre: (($scope.view_nombre || '') + '').trim(), 
			descripcion: (($scope.view_descripcion || '') + '').trim(),
			bonificacion: (($scope.view_bonificacion || '') + '').trim()
		};
		
		if (!payload.nombre || !payload.descripcion || !payload.bonificacion) { 
			console.log('Campos vacíos después del trim');
			touchAll(form); 
			
			if (typeof Swal !== 'undefined') {
				Swal.fire({ 
					title: '¡Campos Vacíos!', 
					text: 'Los campos Nombre, Descripción y Porcentaje de bonificación no pueden estar vacíos.', 
					icon: 'error',
					confirmButtonText: 'Entendido'
				}); 
			} else {
				alert('¡Campos Vacíos!\nLos campos Nombre, Descripción y Porcentaje de bonificación no pueden estar vacíos.');
			}
			return; 
		}

		// Validar que la bonificación sea un número válido
		var bonificacionNum = parseInt(payload.bonificacion);
		if (isNaN(bonificacionNum) || bonificacionNum < 0 || bonificacionNum > 100) {
			Swal.fire({
				title: 'Valor inválido',
				text: 'El porcentaje de bonificación debe ser un número entre 0 y 100. Valor ingresado: ' + payload.bonificacion,
				icon: 'error',
				confirmButtonText: 'Entendido'
			});
			return;
		}

		var jsonForm = {
			id: view_id,
			nombre: payload.nombre,
			descripcion: payload.descripcion,
			bonificacion: bonificacionNum
		};

		$http({
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			url: $scope.base + 'update',
			data: jsonForm
		}).then(function (response) {
			Swal.fire({
				title: 'Éxito',
				text: 'Jerarquía actualizada correctamente',
				icon: 'success',
				confirmButtonText: 'Entendido'
			}).then(function () {
				$scope.ModelReadAll();
			});
		}, function (error) {
			Swal.fire({
				title: 'Error',
				text: 'Error al actualizar la jerarquía: ' + error.data,
				icon: 'error',
				confirmButtonText: 'Entendido'
			});
		});

	};

	$scope.ModelDelete = function (view_id) {
		var jsonForm = { id: view_id };

		$http({
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			url: $scope.base + 'delete',
			data: jsonForm
		}).then(function (response) {
			Swal.fire({
				title: 'Éxito',
				text: 'Jerarquía eliminada correctamente',
				icon: 'success',
				confirmButtonText: 'Entendido'
			}).then(function () {
				$scope.ModelReadAll();
			});
		}, function (error) {
			Swal.fire({
				title: 'Operación Incorrecta',
				text: 'Error al eliminar la jerarquía',
				icon: 'error',
				confirmButtonText: 'Entendido'
			});
		});
	}

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nueva Jerarquia';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_bonificacion = '';
	};

	$scope.ViewUpdate = function (view_id) {
		console.log('=== INICIANDO ViewUpdate ===');
		console.log('ID del registro a editar:', view_id);
		console.log('Estado actual del scope:');
		console.log('- ViewAction:', $scope.ViewAction);
		console.log('- view_id:', $scope.view_id);
		console.log('- view_nombre:', $scope.view_nombre);
		console.log('- view_descripcion:', $scope.view_descripcion);
		console.log('- view_bonificacion:', $scope.view_bonificacion);
		console.log('- view_bonificacion_editar:', $scope.view_bonificacion_editar);
		
		$scope.ViewAction = 'Editar Jerarquia';
		$scope.view_id = view_id;
		
		console.log('Después de asignar ViewAction y view_id:');
		console.log('- ViewAction:', $scope.ViewAction);
		console.log('- view_id:', $scope.view_id);
		
		console.log('Llamando a ModelRead...');
		$scope.ModelRead(view_id);
	};

	$scope.ViewDelete = function (view_id) {
		Swal.fire({
			title: 'Baja registro',
			text: 'Desea dar de baja la jerarquía?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Sí, eliminar',
			cancelButtonText: 'Cancelar'
		}).then(function (result) {
			if (result.isConfirmed) {
				$scope.ModelDelete(view_id);
			}
		});
	};

	$scope.ViewCancel = function () {
		$scope.ModelReadAll();
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