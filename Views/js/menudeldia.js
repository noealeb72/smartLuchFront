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

app.controller('Menudeldia', function ($scope, $sce, $http, $window) {
	// Detecta si la pantalla es móvil
	$scope.isMobile = $window.innerWidth < 768;

	// Actualiza la propiedad isMobile cuando se cambia el tamaño de la ventana
	angular.element($window).bind('resize', function () {
		$scope.$apply(function () {
			$scope.isMobile = $window.innerWidth < 768;
		});
	});

	$scope.titulo = 'Menú del día';  // Título inicial
	$scope.base = 'http://localhost:8000/api/menudd/';
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
	// Filtros
	$scope.filtroPlanta = '';
	$scope.filtroCentro = '';
	$scope.filtroJerarquia = '';
	$scope.filtroProyecto = '';
	$scope.filtroPlato = '';
	$scope.filtroDesde = null;
	$scope.filtroHasta = null;
	$scope.filtroTurno = '';
	$scope.basePlatos = 'http://localhost:8000/api/plato/';
	$scope.platos = '';
	$scope.basePlantas = 'http://localhost:8000/api/planta/';
	$scope.plantas = '';
	$scope.baseCentros = 'http://localhost:8000/api/centrodecosto/';
	$scope.centros = '';
	$scope.baseProyectos = 'http://localhost:8000/api/proyecto/';
	$scope.proyectos = '';
	$scope.baseJerarquias = 'http://localhost:8000/api/jerarquia/';
	$scope.jerarquias = '';
	$scope.baseTurnos = 'http://localhost:8000/api/turno/';
	$scope.turnos = '';

	$scope.ModelCreate = function (isValid) {
		if (isValid) {
			// debería ser automatico //
			$scope.view_turno = $window.document.getElementById('view_turno').value;
			$scope.view_planta = $window.document.getElementById('view_planta').value;
			$scope.view_jerarquia = $window.document.getElementById('view_jerarquia').value;
			$scope.view_centrodecosto = $window.document.getElementById('view_centrodecosto').value;
			$scope.view_proyecto = $window.document.getElementById('view_proyecto').value;
			$scope.view_plato = $window.document.getElementById('view_plato').value;
			//$scope.view_estado = $window.document.getElementById('view_estado').value;
			$scope.view_cantidad = $window.document.getElementById('view_cantidad').value;
			$scope.view_fechadeldia = $window.document.getElementById('view_fechadeldia').value;
			//

			var jsonForm = {
				turno: $scope.view_turno,
				planta: $scope.view_planta,
				centrodecosto: $scope.view_centrodecosto,
				jerarquia: $scope.view_jerarquia,
				proyecto: $scope.view_proyecto,
				plato: $scope.view_plato,
				estado: '-',
				cantidad: $scope.view_cantidad,
				fechadeldia: $scope.view_fechadeldia
			};

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
				aux = data[0].fechadeldia.split('-');
				fecha = new Date(aux[0], aux[1] - 1, aux[2]);
				$scope.view_turno = data[0].turno;
				$scope.view_planta = data[0].planta;
				$scope.view_centrodecosto = data[0].centrodecosto;
				$scope.view_jerarquia = data[0].jerarquia;
				$scope.view_proyecto = data[0].proyecto;
				$scope.view_plato = data[0].plato;
				//$scope.view_estado = data[0].estado;
				$scope.view_cantidad = data[0].cantidad;
				$scope.view_comandas = data[0].comandas;
				$scope.view_despachado = data[0].despachado;
				$scope.view_fechadeldia = fecha;
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
		$scope.view_turno = '';
		$scope.view_planta = '';
		$scope.view_centrodecosto = '';
		$scope.view_jerarquia = '';
		$scope.view_proyecto = '';
		$scope.view_plato = '';
		$scope.view_estado = '';
		$scope.view_cantidad = '';
		$scope.view_comandas = '';
		$scope.view_despachado = '';
		$scope.view_fechadeldia = '';

		$http.get($scope.base + 'getAll')
			//$http.get($scope.base + 'GetToday')//solo trae el menu del dia
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
			$scope.view_turno = $window.document.getElementById('view_turno').value;
			$scope.view_planta = $window.document.getElementById('view_planta').value;
			$scope.view_centrodecosto = $window.document.getElementById('view_centrodecosto').value;
			$scope.view_jerarquia = $window.document.getElementById('view_jerarquia').value;
			$scope.view_proyecto = $window.document.getElementById('view_proyecto').value;
			$scope.view_plato = $window.document.getElementById('view_plato').value;
			$scope.view_estado = '-';
			$scope.view_cantidad = $window.document.getElementById('view_cantidad').value;
			$scope.view_fechadeldia = $window.document.getElementById('view_fechadeldia').value;
			//

			var jsonForm = {
				id: view_id, turno: $scope.view_turno,
				planta: $scope.view_planta,
				centrodecosto: $scope.view_centrodecosto,
				jerarquia: $scope.view_jerarquia,
				proyecto: $scope.view_proyecto,
				plato: $scope.view_plato,
				estado: $scope.view_estado,
				despachado: $scope.view_despachado,
				comandas: $scope.view_comandas,
				cantidad: $scope.view_cantidad,
				fechadeldia: $scope.view_fechadeldia
			};

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

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nuevo Menú';
		$scope.view_id = -1;
		$scope.view_turno = '';
		$scope.view_planta = '';
		$scope.view_centrodecosto = '';
		$scope.view_jerarquia = '';
		$scope.view_proyecto = '';
		$scope.view_plato = '';
		$scope.view_estado = '';
		$scope.view_cantidad = '';
		/*$scope.view_comandas = '';
		$scope.view_despachado = '';*/
		$scope.view_fechadeldia = '';
		$scope.ModelReadPlatos();
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
		$scope.ModelReadProyectos();
		$scope.ModelReadJerarquias();
		$scope.ModelReadTurnos();
	};

	$scope.ModelReadPlatos = function () {
		$http.get($scope.basePlatos + 'getAll')
			.success(function (data) {
				$scope.platos = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener platos',
					'error'
				);
			});
	};

	$scope.ModelReadPlantas = function () {
		$http.get($scope.basePlantas + 'getAll')
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

	$scope.ModelReadCentros = function () {
		$http.get($scope.baseCentros + 'getAll')
			.success(function (data) {
				$scope.centros = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener centros de costo',
					'error'
				);
			});
	};

	$scope.ModelReadProyectos = function () {
		$http.get($scope.baseProyectos + 'getAll')
			.success(function (data) {
				$scope.proyectos = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener proyectos',
					'error'
				);
			});
	};

	$scope.ModelReadJerarquias = function () {
		$http.get($scope.baseJerarquias + 'getAll')
			.success(function (data) {
				$scope.jerarquias = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener jerarquias',
					'error'
				);
			});
	};

	$scope.ModelReadTurnos = function () {
		$http.get($scope.baseTurnos + 'getAll')
			.success(function (data) {
				$scope.turnos = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener turnos',
					'error'
				);
			});
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar Menú';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
		$scope.ModelReadPlatos();
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
		$scope.ModelReadProyectos();
		$scope.ModelReadJerarquias();
		$scope.ModelReadTurnos();
	};

	$scope.ViewDelete = function (view_id) {
		swal({
			title: 'Baja registro',
			text: 'Desea dar de baja el plato?',
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

	$scope.ViewActive = function (view_id) {
		swal({
			title: '¿Activar menú?',
			text: 'Este menú volverá a estar disponible.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Sí, activar',
			cancelButtonText: 'Cancelar'
		}).then((result) => {
			if (result.value === true || result.isConfirmed) {
				$http.post($scope.base + 'Activate', { id: view_id })
					.then(() => {
						swal('Menú activado correctamente', '', 'success');
						$scope.ModelReadAll();
					})
					.catch((error) => {
						swal('Error', 'No se pudo activar el menú', 'error');
						console.error(error);
					});
			}
		});
	};

	$scope.filtrarMenu = function () {
		const params = [];

		if ($scope.filtroPlanta) params.push('planta=' + encodeURIComponent($scope.filtroPlanta));
		if ($scope.filtroCentro) params.push('centro=' + encodeURIComponent($scope.filtroCentro));
		if ($scope.filtroJerarquia) params.push('jerarquia=' + encodeURIComponent($scope.filtroJerarquia));
		if ($scope.filtroProyecto) params.push('proyecto=' + encodeURIComponent($scope.filtroProyecto));
		if ($scope.filtroPlato) params.push('plato=' + encodeURIComponent($scope.filtroPlato));
		if ($scope.filtroTurno) params.push('turno=' + encodeURIComponent($scope.filtroTurno));
		if ($scope.filtroDesde) params.push('desde=' + $scope.filtroDesde);
		if ($scope.filtroHasta) params.push('hasta=' + $scope.filtroHasta);

		if (params.length === 0) {
			swal('Filtros requeridos', 'Seleccioná al menos un filtro', 'warning');
			return;
		}

		const url = $scope.base + 'Filtrar?' + params.join('&');

		$http.get(url)
			.then(response => {
				$scope.dataset = response.data;
			})
			.catch(error => {
				swal('Error', 'No se pudo obtener el menú filtrado', 'error');
				console.error(error);
			});
	};


	$scope.limpiarFiltros = function () {
		$scope.filtroPlanta = '';
		$scope.filtroCentro = '';
		$scope.filtroJerarquia = '';
		$scope.filtroProyecto = '';
		$scope.filtroPlato = '';
		$scope.filtroDesde = null;
		$scope.filtroHasta = null;
		$scope.filtroTurno = '';
		$scope.ModelReadAll(); // Vuelve a cargar sin filtro
	};


	$scope.ViewCancel = function () {
		$scope.ViewAction = 'Lista de Items';
	};

	$scope.ModelReadAll();
	$scope.ModelReadPlatos();
	$scope.ModelReadPlantas();
	$scope.ModelReadCentros();
	$scope.ModelReadProyectos();
	$scope.ModelReadJerarquias();
	$scope.ModelReadTurnos();

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
