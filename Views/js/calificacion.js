var app = angular.module('AngujarJS', []);

app.filter('startFrom', function () {
	return function (input, start) {
		start = +start; //parse to int
		return input.slice(start);
	}
});

app.controller('Calificacion', function ($scope, $sce, $http, $window) {

	$scope.base = 'http://localhost:8000/api/plannutricional/';
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

	$scope.ModelCreate = function () {
		// debería ser automatico //
		$scope.view_nombre = $window.document.getElementById('view_nombre').value;
		$scope.view_descripcion = $window.document.getElementById('view_descripcion').value;
		//

		var jsonForm = { nombre: $scope.view_nombre, descripcion: $scope.view_descripcion };

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
	};

	$scope.ModelRead = function (view_id) {
		$http.get($scope.base + 'get/' + view_id)
			.success(function (data) {
				$scope.view_nombre = data[0].nombre;
				$scope.view_descripcion = data[0].descripcion;
			})
			.error(function (data, status) {
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
		$scope.ViewAction = 'Platos consumidos';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';

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

	$scope.checkStars = function ($event) {
		console.log($event.target);
		let parent = $event.target.parentElement;
		let maxIndex = $event.target.id;
		console.log("Max " + maxIndex);
		let childrenArr = parent.children;
		console.log(childrenArr);
		for (let i = 0; i < maxIndex; i++) {
			parent.children[i + 1].classList.add("star-checked");
			parent.children[i + 1].nextElementSibling.classList.remove("star-checked");
		}
	};

	$scope.ModelUpdate = function (view_id) {
		// debería ser automatico 
		$scope.view_nombre = $window.document.getElementById('view_nombre').value;
		$scope.view_descripcion = $window.document.getElementById('view_descripcion').value;
		//

		var jsonForm = { id: view_id, nombre: $scope.view_nombre, descripcion: $scope.view_descripcion };

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
	}

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nuevo Plan';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar Plan';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
	};

	$scope.ViewDelete = function (view_id) {
		Swal.fire({
			title: 'Baja registro',
			text: 'Desea dar de baja el plan nutricional?',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#343A40',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Aceptar'
		})
			.then(function (ConfirmClick) {
				if (ConfirmClick.value === true) {
					$scope.ModelDelete(view_id);
				}
			});
	};

	$scope.ViewCancel = function () {
		$scope.ViewAction = 'Platos consumidos';
	};

	$scope.ModelReadAll();

	$scope.currentPage = 0;
	$scope.pageSize = 10;
	$scope.data = [];
	$scope.numberOfPages = function () {
		return Math.ceil($scope.data.length / $scope.pageSize);
	}
	for (var i = 0; i < 45; i++) {
		$scope.data.push("Item " + i);
	}



});