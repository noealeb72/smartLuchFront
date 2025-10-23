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

app.controller('Turno', function ($scope, $sce, $http, $window) {

	$scope.base = 'http://localhost:8000/api/turno/';
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

	// Función helper para mostrar popup
	$scope.showPopup = function(title, text, icon) {
		if (typeof Swal !== 'undefined' && Swal.fire) {
			Swal.fire({ 
				title: title, 
				text: text, 
				icon: icon,
				confirmButtonText: 'Entendido'
			}); 
		} else {
			alert(title + '\n' + text);
		}
	};

	// Función helper para mostrar alertas de éxito
	$scope.showSuccess = function(title, text) {
		Swal.fire({
			title: title,
			text: text || '',
			icon: 'success',
			confirmButtonText: 'Entendido'
		});
	};

	// Función helper para mostrar alertas de error
	$scope.showError = function(title, text) {
		Swal.fire({
			title: title,
			text: text || '',
			icon: 'error',
			confirmButtonText: 'Entendido'
		});
	};

	$scope.ModelCreate = function (isValid) {
		if (isValid) {
			// debería ser automatico //
			$scope.view_codigo = $window.document.getElementById('view_codigo').value;
			$scope.view_descripcion = $window.document.getElementById('view_descripcion').value;
			$scope.view_horadesde = $window.document.getElementById('view_horadesde').value;
			$scope.view_horahasta = $window.document.getElementById('view_horahasta').value;
			//

			// Validar campos vacíos
			if (!$scope.view_codigo || $scope.view_codigo.trim() === '') {
				Swal.fire({
					title: 'Campos requeridos',
					text: 'El campo Código es obligatorio',
					icon: 'warning',
					confirmButtonText: 'Entendido'
				});
				return;
			}

			if (!$scope.view_descripcion || $scope.view_descripcion.trim() === '') {
				Swal.fire({
					title: 'Campos requeridos',
					text: 'El campo Descripción es obligatorio',
					icon: 'warning',
					confirmButtonText: 'Entendido'
				});
				return;
			}

			if (!$scope.view_horadesde || $scope.view_horadesde.trim() === '') {
				Swal.fire({
					title: 'Campos requeridos',
					text: 'El campo Hora Desde es obligatorio',
					icon: 'warning',
					confirmButtonText: 'Entendido'
				});
				return;
			}

			if (!$scope.view_horahasta || $scope.view_horahasta.trim() === '') {
				Swal.fire({
					title: 'Campos requeridos',
					text: 'El campo Hora Hasta es obligatorio',
					icon: 'warning',
					confirmButtonText: 'Entendido'
				});
				return;
			}

			var jsonForm = { codigo: $scope.view_codigo, descripcion: $scope.view_descripcion, horadesde: $scope.view_horadesde, horahasta: $scope.view_horahasta };

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
					Swal.fire(
						'Operación Correcta',
						'',
						'success'
					);
					$scope.ModelReadAll();
				}
			}, function (error) {
				Swal.fire(
					'Operación Incorrecta',
					error,
					'error'
				);
			});
		} else {
			alert('Atributo Invalido en los datos');
		}
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
				Swal.fire('Ha ocurrido un error', 'Api no presente', 'error');
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

	$scope.ModelUpdate = function (isValid,view_id) {
		if (isValid) {
			// debería ser automatico 
			$scope.view_codigo = $window.document.getElementById('view_codigo').value;
			$scope.view_descripcion = $window.document.getElementById('view_descripcion').value;
			$scope.view_horadesde = $window.document.getElementById('view_horadesde').value;
			$scope.view_horahasta = $window.document.getElementById('view_horahasta').value;
			//

			var jsonForm = { id: view_id, codigo: $scope.view_codigo, descripcion: $scope.view_descripcion, horadesde: $scope.view_horadesde, horahasta: $scope.view_horahasta };

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
					Swal.fire(
						'Operación Correcta',
						'',
						'success'
					);
					$scope.ModelReadAll();
				}
			}, function (error) {
				Swal.fire(
					'Operación Incorrecta',
					error,
					'error'
				);
			});
		} else {
			alert('Atributo Invalido en los datos');
		}
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
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar Turno';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
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
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Sí, eliminar',
			cancelButtonText: 'Cancelar'
		  }).then(function (result) {
			if (result.isConfirmed) $scope.ModelDelete(view_id);
		  });
		} else {
		  // Fallback nativo si SweetAlert2 no está sano
		  if (window.confirm('Desea eliminar el turno?')) {
			$scope.ModelDelete(view_id);
		  }
		}
	};

	$scope.ViewCancel = function () {
		$scope.ViewAction = 'Lista de Items';
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
