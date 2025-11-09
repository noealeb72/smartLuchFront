var app = angular.module('AngujarJS', []);

app.filter('startFrom', function () {
	return function (input, start) {
		start = +start; //parse to int
		return input.slice(start);
	}
});

app.controller('Calificacion', function ($scope, $sce, $http, $window) {
	// Usar la variable de configuración global API_BASE_URL
	var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
	$scope.base = apiBaseUrl + '/api/plannutricional/';
	
	// -------- Loading State ----------
	$scope.isLoading = true;
	
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
		$scope.isLoading = true;
		$scope.dataset = [];
		$scope.searchKeyword;
		$scope.ViewAction = 'Platos consumidos';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';

		$http.get($scope.base + 'getAll')
			.then(function (response) {
				$scope.dataset = Array.isArray(response.data) ? response.data : [];
				$scope.isLoading = false;
			})
			.catch(function (error) {
				$scope.isLoading = false;
				Swal.fire(
					'Ha ocurrido un error',
					'Api no presente',
					'error'
				);
			});
	};

	$scope.checkStars = function ($event) {
		//console.log($event.target);
		let parent = $event.target.parentElement;
		let maxIndex = $event.target.id;
		//console.log("Max " + maxIndex);
		let childrenArr = parent.children;
		///console.log(childrenArr);
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
			confirmButtonColor: '#F34949',
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
	$scope.pageSize = parseInt($scope.pageSize) || 5; // Por defecto 5 filas (número)
	$scope.data = [];
	$scope.numberOfPages = function () {
		var len = Array.isArray($scope.data) ? $scope.data.length : 0;
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
	for (var i = 0; i < 45; i++) {
		$scope.data.push("Item " + i);
	}



});