var app = angular.module('AngujarJS', []);

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

	$scope.ModelCreate = function (isValid) {
		if (isValid) {
			// debería ser automatico //
			$scope.view_nombre = $window.document.getElementById('view_nombre').value;
			$scope.view_descripcion = $window.document.getElementById('view_descripcion').value;
			$scope.view_planta = $window.document.getElementById('view_planta').value;
			$scope.view_centrodecosto = $window.document.getElementById('view_centrodecosto').value;
			//

			var jsonForm = { nombre: $scope.view_nombre, descripcion: $scope.view_descripcion, planta: $scope.view_planta, centrodecosto: $scope.view_centrodecosto };

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
					swal(
						'Operación Correcta',
						'',
						'success'
					);
					$scope.ModelReadAll();
				}
			}, function (error) {
				swal(
					'Operación Incorrecta',
					error,
					'error'
				);
			});
		} else {
			alert('Atributos invalidos en los campos');
		}
	};

	$scope.ModelRead = function (view_id) {
		$http.get($scope.base + 'get/' + view_id)
			.success(function (data) {
				$scope.view_nombre = data[0].nombre;
				$scope.view_descripcion = data[0].descripcion;
				$scope.view_planta = data[0].planta;
				$scope.view_centrodecosto = data[0].centrodecosto;
			})
			.error(function (data, status) {
				swal(
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
		$scope.view_planta = '';
		$scope.view_centrodecosto = '';

		$http.get($scope.base + 'getAll')
			.success(function (data) {
				$scope.dataset = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Api no presente',
					'error'
				);
			});
	};

	$scope.ModelUpdate = function (isValid, view_id) {
		if (isValid) {
			// debería ser automatico 
			$scope.view_nombre = $window.document.getElementById('view_nombre').value;
			$scope.view_descripcion = $window.document.getElementById('view_descripcion').value;
			$scope.view_planta = $window.document.getElementById('view_planta').value;
			$scope.view_centrodecosto = $window.document.getElementById('view_centrodecosto').value;
			//

			var jsonForm = { id: view_id, nombre: $scope.view_nombre, descripcion: $scope.view_descripcion, planta: $scope.view_planta, centrodecosto: $scope.view_centrodecosto };

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
					swal(
						'Operación Correcta',
						'',
						'success'
					);
					$scope.ModelReadAll();
				}
			}, function (error) {
				swal(
					'Operación Incorrecta',
					error,
					'error'
				);
			});
		} else {
			alert('Atributo invalido en los campos');
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
				swal(
					'Operación Correcta',
					'',
					'success'
				);
				$scope.ModelReadAll();
			}
		}, function (error) {
			swal(
				'Operación Incorrecta',
				error,
				'error'
			);
		});
	}

	$scope.ModelReadCentros = function () {
		$http.get($scope.baseCentrodecostos + 'getAll')
			.success(function (data) {
				$scope.centros = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener plantas',
					'error'
				);
			});
	};

	$scope.ModelReadPlantas = function () {
		$http.get($scope.basePlanta + 'getAll')
			.success(function (data) {
				$scope.plantas = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener plantas',
					'error'
				);
			});
	};

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nuevo Proyecto';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_planta = '';
		$scope.view_centrodecosto = '';
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar Proyecto';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
	};

	$scope.ViewDelete = function (view_id) {
		swal({
			title: 'Eliminar registro',
			text: 'Desea eliminar el proyecto?',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'OK'
		})
			.then(function (ConfirmClick) {
				if (ConfirmClick.value === true) {
					$scope.ModelDelete(view_id);
				}
			});
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