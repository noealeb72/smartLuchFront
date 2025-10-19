var app = angular.module('AngujarJS', ['base64', 'ngMessages']);

app.filter('startFrom', function () {
	return function (input, start) {
		start = +start;
		return input.slice(start);
	};
});

app.controller('Plato', function ($scope, $location, $sce, $http, $window, $base64) {
	$scope.base = 'http://localhost:8000/api/plato/';
	$scope.basePlan = 'http://localhost:8000/api/plannutricional/';
	$scope.planes = '';
	$scope.titulo = 'Gestión de Platos';
	$scope.plato = {};
	$scope.filteredData = null;
	$scope.filtroCostoMin = null;
	$scope.filtroCostoMax = null;
	$scope.filtroPlan = '';
	$scope.filtroEstado = '';

	// Datos de usuario desde localStorage
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
			$scope.titulo = 'Agregar nuevo plato';
			let jsonForm = {
				codigo: $scope.plato.codigo,
				ingredientes: $scope.plato.ingredientes,
				plannutricional: $scope.plato.plannutricional,
				descripcion: $scope.plato.descripcion,
				costo: $scope.plato.costo || 0,
				presentacion: $scope.view_previewImage
			};

			$http.post($scope.base + 'Create', jsonForm)
				.then(() => {
					swal('Operación Correcta', 'El plato ha sido creado', 'success');
					$scope.ModelReadAll();
				})
				.catch((error) => {
					swal('Operación Incorrecta', 'Error al crear el plato', 'error');
					console.error(error);
				});
		} else {
			// 👉 Esto es lo que te faltaba: marcar los campos requeridos
			angular.forEach($scope.platoForm.$error.required, function (field) {
				field.$setTouched();
			});
			swal('Campos incompletos', 'Por favor completá todos los campos obligatorios.', 'warning');
		}
	};



	$scope.ModelRead = function (view_id) {
		$http.get($scope.base + 'get/' + view_id)
			.then(response => {
				const data = response.data[0];
				$scope.plato = {
					codigo: data.codigo,
					ingredientes: data.ingredientes,
					plannutricional: data.plannutricional,
					descripcion: data.descripcion,
					costo: data.costo,
					presentacion: data.presentacion
				};
				$scope.view_previewImage = data.presentacion;
			})
			.catch(() => {
				swal('Ha ocurrido un error', 'Api no presente', 'error');
			});
	};

	$scope.ModelReadAll = function () {
		$scope.dataset = [];
		$scope.ViewAction = 'Platos';
		$scope.plato = {};
		$scope.view_previewImage = '';

		$http.get($scope.base + 'getAll')
			.then(response => $scope.dataset = response.data)
			.catch(() => swal('Ha ocurrido un error', 'Api no presente', 'error'));
	};

	$scope.ModelUpdate = function (isValid, view_id) {
		if (isValid) {
			$scope.titulo = 'Modificar plato';
			let jsonForm = {
				id: view_id,
				codigo: $scope.plato.codigo,
				ingredientes: $scope.plato.ingredientes,
				plannutricional: $scope.plato.plannutricional,
				descripcion: $scope.plato.descripcion,
				costo: $scope.plato.costo || 0,
				presentacion: $scope.view_previewImage
			};

			$http.post($scope.base + 'Update', jsonForm)
				.then(() => {
					swal('Plato actualizado correctamente', '', 'success');
					$scope.ModelReadAll();
					$scope.ViewAction = 'Platos';
					$scope.titulo = 'Gestión de Platos';
				})
				.catch(() => swal('Error', 'Hubo un error al actualizar el plato', 'error'));
		} else {
			// 👉 Marca todos los campos requeridos como tocados
			angular.forEach($scope.platoForm.$error.required, function (field) {
				field.$setTouched();
			});
			swal('Campos incompletos', 'Por favor completá todos los campos obligatorios.', 'warning');
		}
	};


	$scope.ModelDelete = function (view_id) {
		$http.post($scope.base + 'Delete', { id: view_id })
			.then(() => {
				swal('Operación Correcta', '', 'success');
				$scope.ModelReadAll();
			})
			.catch((error) => swal('Operación Incorrecta', error, 'error'));
	};

	$scope.ModelReadPlanes = function () {
		$http.get($scope.basePlan + 'getAll')
			.then(response => $scope.planes = response.data)
			.catch(() => swal('Error', 'Error al obtener planes', 'error'));
	};

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nuevo Plato';
		$scope.plato = {
			codigo: '',
			descripcion: '',
			ingredientes: '',
			plannutricional: '',
			costo: 0,
			presentacion: ''
		};
		$scope.view_id = -1;
		$scope.view_previewImage = '';
		$scope.ModelReadPlanes();
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar Plato';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
		$scope.ModelReadPlanes();
	};

	$scope.ViewDelete = function (view_id) {
		swal({
			title: 'Eliminar registro',
			text: 'Desea eliminar plato?',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Aceptar'
		}).then((ConfirmClick) => {
			if (ConfirmClick.value === true) {
				$scope.ModelDelete(view_id);
			}
		});
	};

	$scope.ViewCancel = function () {
		$scope.ViewAction = 'Platos';
	};

	$scope.loadImage = function () {
		var file = document.getElementById('view_file').files[0];
		var reader = new FileReader();
		reader.onloadend = function () {
			$scope.view_previewImage = reader.result;
			$scope.plato.presentacion = reader.result;
			$scope.$apply();
		};
		if (file) {
			reader.readAsDataURL(file);
		}
	};

	$scope.ModelReadAll();
	$scope.ModelReadPlanes();
	$scope.currentPage = 0;
	$scope.pageSize = 20;

	$scope.numberOfPages = function () {
		return Math.ceil($scope.dataset.length / $scope.pageSize);
	};

	$scope.filtrarPlatos = function () {
		const params = [];
		console.log('📦 filtroCostoMin:', $scope.filtroCostoMin);
		console.log('📦 filtroCostoMax:', $scope.filtroCostoMax);
		console.log('📦 filtroPlan:', $scope.filtroPlan);
		console.log('📦 filtroEstado:', $scope.filtroEstado);
		if ($scope.filtroCostoMin != null) {
			params.push('costoMin=' + $scope.filtroCostoMin);
		}
		if ($scope.filtroCostoMax != null) {
			params.push('costoMax=' + $scope.filtroCostoMax);
		}
		if ($scope.filtroPlan && $scope.filtroPlan !== '') {
			params.push('plannutricional=' + encodeURIComponent($scope.filtroPlan));
		}
		if ($scope.filtroEstado && $scope.filtroEstado !== '') {
			params.push('estado=' + encodeURIComponent($scope.filtroEstado));
		}

		if (params.length === 0) {
			swal('Filtros requeridos', 'Debes seleccionar al menos un filtro para buscar.', 'warning');
			return;
		}

		const queryString = params.join('&');

		$http.get($scope.base + 'filtrar?' + queryString)
			.then(function (response) {
				$scope.filteredData = response.data;
			})
			.catch(function () {
				swal('Error', 'No se pudieron obtener los platos con los filtros seleccionados.', 'error');
			});
	};


	$scope.limpiarFiltros = function () {
		$scope.filtroCostoMin = null;
		$scope.filtroCostoMax = null;
		$scope.filtroPlan = '';
		$scope.filtroEstado = '';
		$scope.filteredData = null;
	};

});