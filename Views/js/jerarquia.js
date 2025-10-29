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
	$scope.validatePercentage = function (value) {
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
		console.log('IGNORANDO isValid del formulario - haciendo validación propia');
		console.log('VERSIÓN ACTUALIZADA - Caché limpiado:', new Date().getTime());

		// Forzar sincronización de ng-model con DOM (solo si no hay digest en progreso)
		if (!$scope.$$phase) {
			$scope.$apply();
		}

		// ESTRATEGIA ROBUSTA: Usar ng-model como principal, DOM como fallback
		var perfil = '';
		var descripcion = '';
		var bonificacion = '';

		// Intentar obtener valores desde ng-model primero
		if ($scope.view_perfil) {
			perfil = $scope.view_perfil.toString().trim();
		}
		if ($scope.view_descripcion) {
			descripcion = $scope.view_descripcion.toString().trim();
		}
		if ($scope.view_bonificacion) {
			bonificacion = $scope.view_bonificacion.toString().trim();
		}

		// Si ng-model no tiene valores, intentar desde DOM
		if (!perfil || !descripcion || !bonificacion) {
			console.log('Valores desde ng-model incompletos, intentando DOM...');
			console.log('Estado actual - perfil:', perfil, 'descripcion:', descripcion, 'bonificacion:', bonificacion);
			
			var perfilElement = document.getElementById('view_perfil');
			var descripcionElement = document.getElementById('view_descripcion');
			var bonificacionElement = document.getElementById('view_bonificacion_nueva');
			
			console.log('Elementos DOM encontrados en crear:');
			console.log('perfilElement:', perfilElement);
			console.log('descripcionElement:', descripcionElement);
			console.log('bonificacionElement:', bonificacionElement);
			
			// Solo actualizar si el valor está vacío
			if (perfilElement && !perfil) {
				perfil = perfilElement.value.trim();
				console.log('Perfil actualizado desde DOM:', perfil);
			}
			if (descripcionElement && !descripcion) {
				descripcion = descripcionElement.value.trim();
				console.log('Descripción actualizada desde DOM:', descripcion);
			}
			if (bonificacionElement && !bonificacion) {
				bonificacion = bonificacionElement.value.trim();
				console.log('Bonificación actualizada desde DOM:', bonificacion);
			}
		}
		
		console.log('=== VALORES FINALES EN CREAR ===');
		console.log('Perfil:', perfil);
		console.log('Descripción:', descripcion);
		console.log('Bonificación:', bonificacion);
		
		// Validación final antes de continuar
		if (!descripcion || !bonificacion) {
			console.log('ERROR: Campos requeridos vacíos después de intentar obtener valores');
			console.log('Descripción:', descripcion, 'Bonificación:', bonificacion);
			
			Swal.fire({
				title: 'Campos requeridos',
				text: 'Los campos Descripción y Porcentaje de bonificación son obligatorios',
				icon: 'error',
				confirmButtonText: 'Aceptar'
			}).then(function () {
				$scope.showValidationErrors = true;
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			});
			return;
		}
		
		var payload = {
			perfil: perfil || 'Admin', // Default si está vacío
			descripcion: descripcion,
			bonificacion: bonificacion
		};

		// Validar SOLO descripción y bonificación - ignorar perfil
		var camposFaltantes = [];
		if (!payload.descripcion) camposFaltantes.push('Descripción');
		if (!payload.bonificacion) camposFaltantes.push('Porcentaje de bonificación');
		
		if (camposFaltantes.length > 0) {
			console.log('Campos faltantes:', camposFaltantes);
			console.log('Descripción:', payload.descripcion, 'Bonificación:', payload.bonificacion);
			
			// Mostrar popup primero
			if (typeof Swal !== 'undefined') {
				Swal.fire({
					title: 'Completar campos requeridos',
					text: 'Debe completar: ' + camposFaltantes.join(', '),
					icon: 'warning',
					confirmButtonText: 'Aceptar'
				}).then(function() {
					// Después del popup, mostrar leyendas rojas
					$scope.showValidationErrors = true;
					$scope.$apply();
				});
			} else {
				alert('Completar campos requeridos\nDebe completar: ' + camposFaltantes.join(', '));
				$scope.showValidationErrors = true;
				if (!$scope.$$phase) {
					$scope.$apply();
				}
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
				confirmButtonText: 'Aceptar'
			});
			return;
		}

		var jsonForm = {
			perfil: payload.perfil,
			descripcion: payload.descripcion,
			bonificacion: bonificacionNum
		};

		console.log('=== ENVIANDO DATOS AL SERVIDOR ===');
		console.log('jsonForm:', jsonForm);
		console.log('URL:', $scope.base + 'create');

		$http({
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			url: $scope.base + 'create',
			data: jsonForm
		}).then(function (response) {
			console.log('=== RESPUESTA DEL SERVIDOR ===');
			console.log('Response:', response);
			$scope.showValidationErrors = false; // Limpiar leyendas de validación
			Swal.fire({
				title: 'Operación Correcta',
				text: 'Jerarquía creada correctamente',
				icon: 'success',
				confirmButtonText: 'Aceptar'
			}).then(function () {
				$scope.ModelReadAll();
			});
		}, function (error) {
			console.log('=== ERROR DEL SERVIDOR ===');
			console.log('Error:', error);
			console.log('Error data:', error.data);
			console.log('Error status:', error.status);
			Swal.fire({
				title: 'Error',
				text: 'Error al crear la jerarquía: ' + (error.data || error.statusText || 'Error desconocido'),
				icon: 'error',
				confirmButtonText: 'Aceptar'
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
					$scope.view_perfil = data[0].perfil || '';
					$scope.view_descripcion = data[0].descripcion;
					
					console.log('=== ASIGNACIÓN DE PERFIL ===');
					console.log('Perfil del servidor:', data[0].perfil);
					console.log('$scope.view_perfil asignado:', $scope.view_perfil);

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
					console.log('view_perfil después:', $scope.view_perfil);
					
					// Forzar actualización del DOM para el perfil
					$scope.$apply();
					
					// Actualizar el select del perfil en el DOM
					setTimeout(function() {
						var perfilSelect = document.getElementById('view_perfil');
						if (perfilSelect) {
							console.log('=== ACTUALIZANDO SELECT DE PERFIL ===');
							console.log('Select encontrado:', perfilSelect);
							console.log('Valor a establecer:', $scope.view_perfil);
							perfilSelect.value = $scope.view_perfil;
							console.log('Valor establecido en DOM:', perfilSelect.value);
						} else {
							console.log('ERROR: No se encontró el select view_perfil');
						}
					}, 100);

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
		$scope.view_perfil = '';
		$scope.view_descripcion = '';
		$scope.view_bonificacion = '';
		$scope.showValidationErrors = false;

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

	// Función de debug para bonificación
	$scope.debugBonificacion = function() {
		console.log('=== DEBUG BONIFICACIÓN DETALLADO ===');
		console.log('$scope.view_bonificacion:', $scope.view_bonificacion);
		console.log('Tipo:', typeof $scope.view_bonificacion);
		console.log('¿Es undefined?:', $scope.view_bonificacion === undefined);
		console.log('¿Es null?:', $scope.view_bonificacion === null);
		console.log('¿Es string vacío?:', $scope.view_bonificacion === '');
		console.log('¿Es 0?:', $scope.view_bonificacion === 0);
		console.log('¿Es NaN?:', isNaN($scope.view_bonificacion));
		
		// Verificar elemento DOM
		var bonificacionElement = document.getElementById('view_bonificacion');
		console.log('Elemento DOM view_bonificacion:', bonificacionElement);
		if (bonificacionElement) {
			console.log('Valor del elemento DOM:', bonificacionElement.value);
			console.log('Tipo del valor DOM:', typeof bonificacionElement.value);
		}
	};

	// Función robusta para obtener valor de bonificación
	$scope.obtenerValorBonificacion = function() {
		console.log('=== OBTENIENDO VALOR DE BONIFICACIÓN ===');
		
		// Intentar desde ng-model primero
		var valorNgModel = $scope.view_bonificacion;
		console.log('Valor desde ng-model:', valorNgModel, 'tipo:', typeof valorNgModel);
		
		// Si ng-model tiene valor (incluso 0), usarlo
		if (valorNgModel !== undefined && valorNgModel !== null && valorNgModel !== '') {
			console.log('Usando valor de ng-model:', valorNgModel);
			return valorNgModel.toString().trim();
		} else if (valorNgModel === 0) {
			console.log('Usando valor 0 de ng-model');
			return '0';
		}
		
		// Si ng-model no tiene valor, intentar desde DOM
		var bonificacionElement = document.getElementById('view_bonificacion');
		if (bonificacionElement) {
			var valorDOM = bonificacionElement.value;
			console.log('Valor desde DOM:', valorDOM, 'tipo:', typeof valorDOM);
			if (valorDOM !== undefined && valorDOM !== null && valorDOM !== '') {
				console.log('Usando valor de DOM:', valorDOM);
				return valorDOM.toString().trim();
			} else if (valorDOM === '0') {
				console.log('Usando valor 0 de DOM');
				return '0';
			}
		}
		
		console.log('No se pudo obtener valor de bonificación');
		return '';
	};

	// Función para cargar perfil en el select
	$scope.cargarPerfilEnSelect = function(perfil) {
		console.log('=== CARGANDO PERFIL EN SELECT ===');
		console.log('Perfil a cargar:', perfil);
		
		// Actualizar ng-model
		$scope.view_perfil = perfil;
		
		// Actualizar DOM
		setTimeout(function() {
			var perfilSelect = document.getElementById('view_perfil');
			if (perfilSelect) {
				console.log('Select encontrado, estableciendo valor:', perfil);
				perfilSelect.value = perfil;
				console.log('Valor establecido en DOM:', perfilSelect.value);
				
				// Disparar evento change para asegurar que Angular detecte el cambio
				var event = new Event('change', { bubbles: true });
				perfilSelect.dispatchEvent(event);
			} else {
				console.log('ERROR: No se encontró el select view_perfil');
			}
		}, 50);
	};

	$scope.ModelUpdate = function (isValid, view_id, form) {
		console.log('=== INICIANDO ModelUpdate ===');
		console.log('isValid:', isValid, 'view_id:', view_id, 'form:', form);
		console.log('VERSIÓN ACTUALIZADA - Caché limpiado:', new Date().getTime());
		
		// DEBUG ESPECÍFICO PARA BONIFICACIÓN
		$scope.debugBonificacion();
		
		// OBTENER VALOR DE BONIFICACIÓN DE MANERA ROBUSTA
		var bonificacion = $scope.obtenerValorBonificacion();
		console.log('=== VALOR DE BONIFICACIÓN OBTENIDO ===');
		console.log('Bonificación:', bonificacion);
		
		// Obtener perfil y descripción (siguiendo el patrón de Planta)
		var perfil = ($scope.view_perfil || '').trim();
		var descripcion = ($scope.view_descripcion || '').trim();
		
		// Obtener elementos del DOM como respaldo
		var perfilField = document.getElementById('view_perfil');
		var descripcionField = document.getElementById('view_descripcion');
		var bonificacionField = document.getElementById('view_bonificacion');
		
		// Sobrescribir con valores del DOM si están disponibles (como en Planta)
		if (perfilField && typeof perfilField.value === 'string') perfil = perfilField.value.trim() || perfil;
		if (descripcionField && typeof descripcionField.value === 'string') descripcion = descripcionField.value.trim() || descripcion;
		if (bonificacionField && typeof bonificacionField.value === 'string') bonificacion = bonificacionField.value.trim() || bonificacion;
		
		console.log('=== VALORES FINALES OBTENIDOS (PATRÓN PLANTA) ===');
		console.log('Perfil:', perfil);
		console.log('Descripción:', descripcion);
		console.log('Bonificación:', bonificacion);
		console.log('¿Bonificación está vacía?:', !bonificacion);

		// LÓGICA DUPLICADA ELIMINADA - Ya se obtuvieron los valores arriba siguiendo el patrón de Planta

		// LÓGICA DUPLICADA ELIMINADA - Los valores ya se obtuvieron correctamente arriba
		
		// Validación final antes de continuar
		if (!descripcion || !bonificacion) {
			console.log('ERROR: Campos requeridos vacíos después de intentar obtener valores');
			console.log('Descripción:', descripcion, 'Bonificación:', bonificacion);
			
			Swal.fire({
				title: 'Campos requeridos',
				text: 'Los campos Descripción y Porcentaje de bonificación son obligatorios',
				icon: 'error',
				confirmButtonText: 'Aceptar'
			}).then(function () {
				$scope.showValidationErrors = true;
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			});
			return;
		}
		
		var payload = {
			perfil: perfil || 'Admin', // Default si está vacío
			descripcion: descripcion,
			bonificacion: bonificacion
		};

		// Validar solo los campos que realmente necesitamos
		var camposFaltantes = [];
		if (!payload.descripcion) camposFaltantes.push('Descripción');
		if (!payload.bonificacion) camposFaltantes.push('Porcentaje de bonificación');
		
		if (camposFaltantes.length > 0) {
			console.log('Campos faltantes:', camposFaltantes);
			console.log('Descripción:', payload.descripcion, 'Bonificación:', payload.bonificacion);
			
			// Mostrar popup primero
			if (typeof Swal !== 'undefined') {
				Swal.fire({
					title: 'Completar campos requeridos',
					text: 'Debe completar: ' + camposFaltantes.join(', '),
					icon: 'warning',
					confirmButtonText: 'Aceptar'
				}).then(function() {
					// Después del popup, mostrar leyendas rojas
					$scope.showValidationErrors = true;
					$scope.$apply();
				});
			} else {
				alert('Completar campos requeridos\nDebe completar: ' + camposFaltantes.join(', '));
				$scope.showValidationErrors = true;
				if (!$scope.$$phase) {
					$scope.$apply();
				}
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
				confirmButtonText: 'Aceptar'
			});
			return;
		}

		var jsonForm = {
			id: view_id,
			perfil: payload.perfil,
			descripcion: payload.descripcion,
			bonificacion: bonificacionNum
		};

		console.log('=== ENVIANDO DATOS AL SERVIDOR PARA ACTUALIZAR ===');
		console.log('jsonForm:', jsonForm);
		console.log('URL:', $scope.base + 'update');
		console.log('view_id:', view_id);

		$http({
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			url: $scope.base + 'update',
			data: jsonForm
		}).then(function (response) {
			console.log('=== RESPUESTA DEL SERVIDOR EN ACTUALIZAR ===');
			console.log('Response:', response);
			$scope.showValidationErrors = false; // Limpiar leyendas de validación
			Swal.fire({
				title: 'Operación Correcta',
				text: 'Jerarquía actualizada correctamente',
				icon: 'success',
				confirmButtonText: 'Aceptar'
			}).then(function () {
				$scope.ModelReadAll();
			});
		}, function (error) {
			console.log('=== ERROR DEL SERVIDOR EN ACTUALIZAR ===');
			console.log('Error:', error);
			console.log('Error data:', error.data);
			console.log('Error status:', error.status);
			Swal.fire({
				title: 'Error',
				text: 'Error al actualizar la jerarquía: ' + (error.data || error.statusText || 'Error desconocido'),
				icon: 'error',
				confirmButtonText: 'Aceptar'
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
				title: 'Operación Correcta',
				text: 'Jerarquía eliminada correctamente',
				icon: 'success',
				confirmButtonText: 'Aceptar'
			}).then(function () {
				$scope.ModelReadAll();
			});
		}, function (error) {
			Swal.fire({
				title: 'Operación Incorrecta',
				text: 'Error al eliminar la jerarquía',
				icon: 'error',
				confirmButtonText: 'Aceptar'
			});
		});
	}

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nueva Jerarquia';
		$scope.view_id = -1;
		$scope.view_perfil = 'Admin'; // Perfil seleccionado por defecto
		$scope.view_descripcion = '';
		$scope.view_bonificacion = '';
		$scope.showValidationErrors = false; // Controlar leyendas de validación
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
			confirmButtonText: 'Aceptar',
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