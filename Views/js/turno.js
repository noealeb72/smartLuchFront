// === SweetAlert2 shim: crea 'Swal.fire(...)' usando Swal.fire(...) ===
(function (w) {
	if (!w.Swal || typeof w.Swal.fire !== 'function') return; // no hay SweetAlert2

	// solo si NO existe un Swal.fire válido
	if (!w.Swal.fire || typeof w.Swal.fire !== 'function') {
		w.Swal.fire = function () {
			// soporta Swal.fire({ ... })
			if (arguments.length === 1 && typeof arguments[0] === 'object') {
				return w.Swal.fire(arguments[0]);
			}
			// soporta Swal.fire('titulo','texto','icon')
			var args = Array.prototype.slice.call(arguments);
			var opt = {};
			if (args[0]) opt.title = args[0];
			if (args[1]) opt.text = args[1];
			if (args[2]) opt.icon = args[2]; // 'success' | 'error' | 'warning' | 'info' | 'question'
			return w.Swal.fire(opt);
		};
	}
})(window);

var app = angular.module('AngujarJS', []);

app.filter('startFrom', function () {
	return function (input, start) {
		start = +start; //parse to int
		return input.slice(start);
	}
});

// Filtro personalizado para eliminar elementos vacíos
app.filter('noEmpty', function () {
	return function (input) {
		if (!input) return [];
		return input.filter(function(item) {
			return item && 
				   item.descripcion && 
				   item.descripcion.trim() !== '' &&
				   item.codigo && 
				   item.codigo.trim() !== '';
		});
	}
});

app.controller('Turno', function ($scope, $sce, $http, $window) {

	$scope.base = 'http://localhost:8000/api/turno/';
	////////////////////////////////////////////////USER////////////////////////////////////////////////
	$scope.user_Rol = localStorage.getItem('role');
	$scope.user_Nombre = localStorage.getItem('nombre');
	$scope.user_Apellido = localStorage.getItem('apellido');
	$scope.user_Planta = localStorage.getItem('planta');
	
	// Función para formatear hora a HH:MM
	$scope.formatTime = function(time) {
		if (!time) return '';
		// Si ya está en formato HH:MM, devolverlo
		if (time.match(/^\d{2}:\d{2}$/)) return time;
		// Si está en formato H:MM, agregar 0 al inicio
		if (time.match(/^\d{1}:\d{2}$/)) return '0' + time;
		// Si está en formato HH:M, agregar 0 al final
		if (time.match(/^\d{2}:\d{1}$/)) return time + '0';
		// Si está en formato H:M, agregar 0s
		if (time.match(/^\d{1}:\d{1}$/)) return '0' + time + '0';
		return time;
	};
	
	// Función para inicializar campos de hora con selector de tiempo
	$scope.initTimeFields = function() {
		setTimeout(function() {
			var horaDesdeField = document.getElementById('view_horadesde');
			var horaHastaField = document.getElementById('view_horahasta');
			
			if (horaDesdeField) {
				horaDesdeField.type = 'time';
				horaDesdeField.step = 60;
				horaDesdeField.min = '00:00';
				horaDesdeField.max = '23:59';
			}
			
			if (horaHastaField) {
				horaHastaField.type = 'time';
				horaHastaField.step = 60;
				horaHastaField.min = '00:00';
				horaHastaField.max = '23:59';
			}
		}, 100);
	};
	
	// Función para asegurar formato HH:MM en campos de hora
	$scope.ensureTimeFormat = function() {
		if ($scope.view_horadesde) {
			$scope.view_horadesde = $scope.formatTime($scope.view_horadesde);
		}
		if ($scope.view_horahasta) {
			$scope.view_horahasta = $scope.formatTime($scope.view_horahasta);
		}
	};
	$scope.user_Centrodecosto = localStorage.getItem('centrodecosto');
	$scope.user_Proyecto = localStorage.getItem('proyecto');
	$scope.user_Jerarquia = localStorage.getItem('role');
	$scope.user_Perfilnutricional = localStorage.getItem('plannutricional');
	$scope.user_Bonificacion = localStorage.getItem('bonificacion');
	$scope.user_DNI = localStorage.getItem('dni');

	// Inicializar variable para mostrar errores de validación
	$scope.showValidationErrors = false;

	// Función helper para mostrar popup
	$scope.showPopup = function(title, text, icon) {
		if (typeof Swal !== 'undefined' && Swal.fire) {
			Swal.fire({ 
				title: title, 
				text: text, 
				icon: icon,
				confirmButtonText: 'Aceptar'
			}); 
		} else {
			// Fallback si SweetAlert2 no está disponible
			console.error('SweetAlert2 no está disponible');
		}
	};

	// Función helper para mostrar alertas de éxito
	$scope.showSuccess = function(title, text) {
		Swal.fire({
			title: title,
			text: text || '',
			icon: 'success',
			confirmButtonText: 'Aceptar',
			confirmButtonColor: '#5c636a'
		});
	};

	// Función helper para mostrar alertas de error
	$scope.showError = function(title, text) {
		Swal.fire({
			title: title,
			text: text || '',
			icon: 'error',
			confirmButtonText: 'Aceptar',
			confirmButtonColor: '#5c636a'
		});
	};

	$scope.ModelCreate = function () {
		console.log('=== CREATE TURNO ===');
		console.log('Valores del scope:');
		console.log('view_codigo:', $scope.view_codigo, 'tipo:', typeof $scope.view_codigo);
		console.log('view_descripcion:', $scope.view_descripcion, 'tipo:', typeof $scope.view_descripcion);
		console.log('view_horadesde:', $scope.view_horadesde, 'tipo:', typeof $scope.view_horadesde);
		console.log('view_horahasta:', $scope.view_horahasta, 'tipo:', typeof $scope.view_horahasta);

		// Obtener valores directamente del DOM como respaldo
		var codigoField = document.getElementById('view_codigo');
		var descripcionField = document.getElementById('view_descripcion');
		var horadesdeField = document.getElementById('view_horadesde');
		var horahastaField = document.getElementById('view_horahasta');
		
		var codigo = codigoField ? codigoField.value.trim() : '';
		var descripcion = descripcionField ? descripcionField.value.trim() : '';
		var horadesde = horadesdeField ? horadesdeField.value.trim() : '';
		var horahasta = horahastaField ? horahastaField.value.trim() : '';
		
		console.log('Valores desde DOM:');
		console.log('codigo desde DOM:', codigo);
		console.log('descripcion desde DOM:', descripcion);
		console.log('horadesde desde DOM:', horadesde);
		console.log('horahasta desde DOM:', horahasta);

		console.log('Valores después de trim:');
		console.log('codigo:', codigo, 'vacío?', !codigo);
		console.log('descripcion:', descripcion, 'vacía?', !descripcion);
		console.log('horadesde:', horadesde, 'vacía?', !horadesde);
		console.log('horahasta:', horahasta, 'vacía?', !horahasta);

		// Validación básica requerida
		var errores = [];
		
		console.log('=== VALIDACIÓN DETALLADA ===');
		console.log('codigo === ""?', codigo === "");
		console.log('codigo === null?', codigo === null);
		console.log('codigo === undefined?', codigo === undefined);
		console.log('codigo.length:', codigo.length);
		console.log('!codigo evalúa a:', !codigo);
		
		if (!codigo) {
			console.log('Agregando Código a errores');
			errores.push('Código');
		}
		if (!descripcion) {
			console.log('Agregando Descripción a errores');
			errores.push('Descripción');
		}
		if (!horadesde) {
			console.log('Agregando Hora desde a errores');
			errores.push('Hora desde');
		}
		if (!horahasta) {
			console.log('Agregando Hora hasta a errores');
			errores.push('Hora hasta');
		}

		console.log('Errores encontrados:', errores);

		if (errores.length > 0) {
			// Activo las leyendas rojas en el HTML
			$scope.showValidationErrors = true;
			console.log('showValidationErrors activado:', $scope.showValidationErrors);

			// Popup
			Swal.fire({
				title: 'Completar campos requeridos',
				icon: 'warning',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a',
				allowOutsideClick: false,
				allowEscapeKey: false
			});

			return; // no sigo, no guardo
		}

		// Si está todo OK armo el payload
		var jsonForm = {
			codigo: codigo,
			descripcion: descripcion,
			horadesde: horadesde,
			horahasta: horahasta
		};

		console.log('Payload Create:', jsonForm);

		$http({
			method: 'post',
			headers: { "Content-Type": "application/json; charset=utf-8" },
			url: $scope.base + 'Create',
			data: jsonForm
		}).then(function () {
			Swal.fire({
				title: 'Operación Correcta',
				text: 'Turno creado exitosamente',
				icon: 'success',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
			});
			$scope.ModelReadAll();
		}).catch(function (err) {
			var msg = (err && (err.data || err.statusText)) || 'Error desconocido';
			Swal.fire({
				title: 'Operación Incorrecta',
				text: msg,
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
			});
		});
	};


	$scope.ModelRead = function (view_id) {
		$http.get($scope.base + 'get/' + view_id)
			.success(function (data) {
				$scope.view_codigo = data[0].codigo;
				$scope.view_descripcion = data[0].descripcion;

				// Convertir strings tipo "23:00" a Date
				if (data[0].horadesde) {
					let parts = data[0].horadesde.split(':');
					$scope.view_horadesde = new Date(1970, 0, 1, parts[0], parts[1]);
				}

				if (data[0].horahasta) {
					let parts = data[0].horahasta.split(':');
					$scope.view_horahasta = new Date(1970, 0, 1, parts[0], parts[1]);
				}
			})
			.error(function (data, status) {
				Swal.fire({
				title: 'Ha ocurrido un error',
				text: 'Api no presente',
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
		$scope.view_codigo = '';
		$scope.view_descripcion = '';
		$scope.view_horadesde = '';
		$scope.view_horahasta = '';

		$http.get($scope.base + 'getAll')
			.then(function (response) {
				// Filtrar elementos vacíos o con campos vacíos
				$scope.dataset = response.data.filter(function(item) {
					return item && 
						   item.descripcion && 
						   item.descripcion.trim() !== '' &&
						   item.codigo && 
						   item.codigo.trim() !== '';
				});
				// Ordenar alfabéticamente por descripción
				$scope.dataset.sort(function(a, b) {
					return a.descripcion.localeCompare(b.descripcion);
				});
			})
			.catch(function (error) {
				Swal.fire({
					title: 'Ha ocurrido un error',
					text: 'Api no presente',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#5c636a'
				});
			});
	};

	$scope.ModelUpdate = function (isValid, view_id) {
		console.log('=== UPDATE TURNO ===', view_id);

		// Obtener valores directamente del DOM como respaldo
		var codigoField = document.getElementById('view_codigo');
		var descripcionField = document.getElementById('view_descripcion');
		var horadesdeField = document.getElementById('view_horadesde');
		var horahastaField = document.getElementById('view_horahasta');
		
		var codigo = codigoField ? codigoField.value.trim() : '';
		var descripcion = descripcionField ? descripcionField.value.trim() : '';
		var horadesde = horadesdeField ? horadesdeField.value.trim() : '';
		var horahasta = horahastaField ? horahastaField.value.trim() : '';

		var errores = [];
		if (!codigo) errores.push('Código');
		if (!descripcion) errores.push('Descripción');
		if (!horadesde) errores.push('Hora desde');
		if (!horahasta) errores.push('Hora hasta');

		if (errores.length > 0) {
			$scope.showValidationErrors = true;

			Swal.fire({
				title: 'Completar campos requeridos',
				icon: 'warning',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a',
				allowOutsideClick: false,
				allowEscapeKey: false
			});
			return;
		}

		var jsonForm = {
			id: view_id,
			codigo: codigo,
			descripcion: descripcion,
			horadesde: horadesde,
			horahasta: horahasta
		};

		console.log('Payload Update:', jsonForm);

		$http({
			method: 'post',
			headers: { "Content-Type": "application/json; charset=utf-8" },
			url: $scope.base + 'Update',
			data: jsonForm
		}).then(function () {
			Swal.fire({
				title: 'Operación Correcta',
				text: 'Turno actualizado exitosamente',
				icon: 'success',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
			});
			$scope.ModelReadAll();
		}).catch(function (err) {
			var msg = (err && (err.data || err.statusText)) || 'Error desconocido';
			Swal.fire({
				title: 'Operación Incorrecta',
				text: msg,
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
				$scope.showSuccess('Operación Correcta', 'Turno eliminado exitosamente');
				$scope.ModelReadAll(); // Recargar la lista después de eliminar
			}
		}, function (error) {
			$scope.showError('Operación Incorrecta', 'Error al eliminar el turno');
		});
	}

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nuevo Turno';
		$scope.view_id = -1;
		$scope.view_codigo = '';
		$scope.view_descripcion = '';
		$scope.view_horadesde = '';
		$scope.view_horahasta = '';
		$scope.showValidationErrors = false;
		$scope.initTimeFields();
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar Turno';
		$scope.view_id = view_id;
		$scope.showValidationErrors = false;
		$scope.ModelRead(view_id);
		$scope.initTimeFields();
	};

	$scope.ViewDelete = function (view_id) {
		// defensa por si otra lib ensucia Swal
		const hasSwal = typeof window !== 'undefined' && window.Swal && typeof window.Swal.fire === 'function';
	  
		if (hasSwal) {
		  window.Swal.fire({
			title: 'Baja registro',
			text: 'Desea dar de baja el turno?',
			icon: 'warning',
			showCancelButton: true,
			  confirmButtonColor: '#343A40',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar'
		  }).then(function (result) {
			if (result.isConfirmed) $scope.ModelDelete(view_id);
		  });
		} else {
		  // Fallback nativo si SweetAlert2 no está sano
		  if (window.confirm('Desea dar de baja al turno?')) {
			$scope.ModelDelete(view_id);
		  }
		}
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
