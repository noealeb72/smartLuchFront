var app = angular.module('AngujarJS', []);

app.filter('startFrom', function () {
	return function (input, start) {
		start = +start; //parse to int
		return input.slice(start);
	}
});

app.controller('Jerarquia', function ($scope, $sce, $http, $window) {

	$scope.base = 'http://localhost:8000/api/jerarquia/';
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

	$scope.ModelCreate = function (isVisible) {
		if (isVisible) {
			// debería ser automatico //
			$scope.view_nombre = $window.document.getElementById('view_nombre').value;
			$scope.view_descripcion = $window.document.getElementById('view_descripcion').value;
			$scope.view_bonificacion = $window.document.getElementById('view_bonificacion').value;
			//

			// Validar campos vacíos
			if (!$scope.view_nombre || $scope.view_nombre.trim() === '') {
				Swal.fire({
					title: 'Campos requeridos',
					text: 'El campo Nombre es obligatorio',
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

			if (!$scope.view_bonificacion || $scope.view_bonificacion.trim() === '') {
				Swal.fire({
					title: 'Campos requeridos',
					text: 'El campo Bonificación es obligatorio',
					icon: 'warning',
					confirmButtonText: 'Entendido'
				});
				return;
			}

			var jsonForm = { nombre: $scope.view_nombre, descripcion: $scope.view_descripcion, bonificacion: $scope.view_bonificacion };

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
				$scope.view_bonificacion = data[0].bonificacion;
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
		$scope.view_bonificacion = '';

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

	$scope.ModelUpdate = function (isVisible, view_id) {
		if (isVisible) {
			// debería ser automatico 
			$scope.view_nombre = $window.document.getElementById('view_nombre').value;
			$scope.view_descripcion = $window.document.getElementById('view_descripcion').value;
			$scope.view_bonificacion = $window.document.getElementById('view_bonificacion').value;
			//

			var jsonForm = { id: view_id, nombre: $scope.view_nombre, descripcion: $scope.view_descripcion, bonificacion: $scope.view_bonificacion };

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
			alert('Atributos invalidos en los campos');
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
				Swal.fire({
					title: 'Operación Correcta',
					text: 'Jerarquía eliminada exitosamente',
					icon: 'success',
					confirmButtonText: 'Entendido'
				});
				$scope.ModelReadAll();
			}
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
		$scope.ViewAction = 'Editar Jerarquia';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
	};

	$scope.ViewDelete = function (view_id) {
		Swal.fire({
			title: 'Eliminar registro',
			text: 'Desea eliminar la jerarquía?',
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
