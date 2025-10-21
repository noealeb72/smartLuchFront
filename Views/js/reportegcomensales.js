var app = angular.module('AngujarJS', []);

app.filter('startFrom', function () {
	return function (input, start) {
		start = +start; //parse to int
		return input.slice(start);
	}
});

app.filter('formatDate', function () {
	return function (input) {
		var date = input.split('T');
		var fecha = date[0].split('-');
		var hora = date[1].split('.');
		input = fecha[2] + '/' + fecha[1] + '/' + fecha[0];
		return input;
	}
});

app.filter('formatHour', function () {
	return function (input) {
		var date = input.split('T');
		var fecha = date[0].split('-');
		var hora = date[1].split('.');
		input = hora[0];
		return input;
	}
});

app.filter('formatBool', function () {
	return function (input) {
		if (input === true) {
			input = "Si"
		} else {
			input = "No"
        }
		return input;
	}
});

app.filter('formatEstados', function () {
	return function (input) {
		switch (input) {
			case 'C':
				input = 'Cancelado';
				break;
			case 'P':
				input = 'Pendiente';
				break;
			case 'R':
				input = 'Recibido';
				break;
			case 'E':
				input = 'Entregado';
				break;
			case 'D':
				input = 'Devuelto';
				break;
		}
		return input;
	}
});

app.controller('ReportegComensales', function ($scope, $sce, $http, $window) {

	$scope.basePlantas = 'http://localhost:8000/api/planta/';
	$scope.plantas = '';
	$scope.baseCentrodecostos = 'http://localhost:8000/api/centrodecosto/';
	$scope.centrosdecosto = '';
	$scope.baseProyectos = 'http://localhost:8000/api/proyecto/';
	$scope.proyectos = '';
	$scope.baseTurno = 'http://localhost:8000/api/turno/';
	$scope.turnos = '';
	$scope.baseComanda = 'http://localhost:8000/api/comanda/';
	$scope.baseReporte = 'http://localhost:8000/api/reporte/';
	$scope.usuarios = '';
	$scope.baseUsuario = 'http://localhost:8000/api/usuario/';
	$scope.reportes = '';
	$scope.comandas = '';
	$scope.filtro_comensal = '';
	$scope.dataset = '';
	$scope.dataset.consumidos = [];
	$scope.filterUser = '';

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

	$scope.desdewarning = false;
	$scope.hastawarning = false;
	$scope.legajowarning = false;

	$scope.dia_desde = '';
	$scope.dia_hasta = '';

	$scope.filtro_dia_desde = '';
	$scope.filtro_dia_hasta = '';

	$scope.filtro_user = '';
	$scope.filtro_legajo = '';
	$scope.filtro_turno = "";
	$scope.filtro_planta = '';
	$scope.filtro_centrodecosto = "";
	$scope.filtro_proyecto = "";
	$scope.cantcons = '';
	$scope.apagar = '';
	$scope.view_rango1 = '';
	$scope.view_rango2 = '';

	$http.get($scope.baseProyectos + 'getAll')//GET PROYECTOS
		.success(function (data) {
			$scope.proyectos = data;
			$http.get($scope.baseCentrodecostos + 'getAll') //GET CCs
				.success(function (data) {
					$scope.centrosdecosto = data;
					$http.get($scope.basePlantas + 'getAll') //GET PLANTAS
						.success(function (data) {
							$scope.plantas = data;
							$http.get($scope.baseTurno + 'getAll') //GET TURNOS
								.success(function (data) {
									$scope.turnos = data;
									var planta = $scope.user_Planta;
									$http({
										url: $scope.baseUsuario + 'getByPlanta',
										method: "GET",
										params: { planta: planta }
									})
										.success(function (data) {
											$scope.usuarios = data;
											$scope.filterUser = data;
										})
										.error(function (data, status) {
											swal(
												'Ha ocurrido un error',
												'Error al obtener usuarios de la planta',
												'error'
											);
										});
								})
								.error(function (data, status) {
									swal(
										'Ha ocurrido un error',
										'Error al obtener turnos',
										'error'
									);
								});
						})
						.error(function (data, status) {
							swal(
								'Ha ocurrido un error',
								'Error al obtener plantas',
								'error'
							);
						});
				})
				.error(function (data, status) {
					swal(
						'Ha ocurrido un error',
						'Error al obtener centros de costo',
						'error'
					);
				});
		})
		.error(function (data, status) {
			swal(
				'Ha ocurrido un error',
				'Error al obtener proyectos',
				'error'
			);
		});

	$scope.SelectFiltros = function () {

		$scope.filtro_dia_desde = $window.document.getElementById('filtro_dia_desde').value;
		$scope.filtro_dia_hasta = $window.document.getElementById('filtro_dia_hasta').value;
		$scope.filtro_turno = $window.document.getElementById('filtro_turno').value;
		$scope.filtro_legajo = $window.document.getElementById('filtro_legajo').value;
		$scope.filtro_centrodecosto = $window.document.getElementById('filtro_centrodecosto').value;
		$scope.filtro_proyecto = $window.document.getElementById('filtro_proyecto').value;

		var desde = $scope.filtro_dia_desde.split('-');
		var hasta = $scope.filtro_dia_hasta.split('-');

		desde = desde[2] + '/' + desde[1] + '/' + desde[0];
		hasta = hasta[2] + '/' + hasta[1] + '/' + hasta[0];

		$scope.view_rango1 = desde;
		$scope.view_rango2 = hasta;

		var user = $scope.filtro_legajo;

		$scope.EvaluaObligatorios();

		$http({
			url: $scope.baseReporte + 'getUserReport',
			method: "GET",
			params: { user: user, desde: desde, hasta: hasta, planta: $scope.user_Planta }
		})
			.success(function (data) {
				$scope.reportes = data;
				var monto = 0;
				data.consumidos = $scope.Ordena(data.consumidos);
				$scope.comandas = data.consumidos;
				$scope.dataset.consumidos = [];
				data.consumidos.forEach(x => {
					if ($scope.filtro_turno != "" && $scope.filtro_turno != null) {
						var horadesde_turno = '';
						var horahasta_turno = '';
						$scope.turnos.forEach(y => {
							if (y.codigo === $scope.filtro_turno) {
								horadesde_turno = y.horadesde;
								horahasta_turno = y.horahasta;
							}
						});
						var hora = x.createdate.split('T');
						hora = hora[1].split(':');
						hora = hora[0] + hora[1];
						horadesde_turno = horadesde_turno.split(':');
						horadesde_turno = horadesde_turno[0] + horadesde_turno[1];
						horahasta_turno = horahasta_turno.split(':');
						horahasta_turno = horahasta_turno[0] + horahasta_turno[1];
						if (horahasta_turno < horadesde_turno) {
							if (hora > horahasta_turno) {
								return;
							}
						} else {
							if (horadesde_turno > hora || horahasta_turno < hora) {
								return;
							}
						}
					}

					if ($scope.filtro_centrodecosto != "") {
						if ($scope.filtro_centrodecosto != x.centrodecosto) {
							return;
						}
					}

					if ($scope.filtro_proyecto != "") {
						if ($scope.filtro_proyecto != x.proyecto) {
							return;
						}
					}
					monto += x.monto;
					$scope.dataset.consumidos.push(x);
				});

				$scope.cantcons = $scope.dataset.consumidos.length;
				$scope.apagar = -$scope.cantcons + data.bonificados;
				$scope.reportes.monto = monto;
				$('#filtrosModal').modal('hide');
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener reporte',
					'error'
				);
			});
	}

	$scope.ClearFiltros = function () {
		document.getElementById('filtro_centrodecosto').value = "";
		document.getElementById('filtro_proyecto').value = "";
		document.getElementById('filtro_turno').value = "";
		$scope.SelectFiltros();
	}

	$scope.EvaluaObligatorios = function () {
		if ($scope.filtro_dia_desde === '' || $scope.filtro_dia_hasta === '' || $scope.filtro_legajo === '') {
			$scope.warningon = true;
		} else {
			$scope.warningon = false;
		}
	}

	$scope.imprimir = function () {
		window.print();
    }

	$scope.cargafiltro = function () {
		var desde = $scope.dia_desde.split('-');
		var hasta = $scope.dia_hasta.split('-');
		var aux = new Date(desde[0], desde[1] - 1, desde[2]);
		$scope.filtro_dia_desde = aux;
		aux = new Date(hasta[0], hasta[1] - 1, hasta[2]);
		$scope.filtro_dia_hasta = aux;
		$scope.filtro_legajo = parseInt($scope.filtro_user);
	}

	$scope.buscarUsuario = function () {
		alert('Función buscarUsuario ejecutada');
		
		// Leer valores de los campos
		$scope.dia_desde = $window.document.getElementById('dia_desde').value;
		$scope.dia_hasta = $window.document.getElementById('dia_hasta').value;
		$scope.filtro_user = $window.document.getElementById('filtro_user').value;

		console.log('Valores leídos:', {
			dia_desde: $scope.dia_desde,
			dia_hasta: $scope.dia_hasta,
			filtro_user: $scope.filtro_user
		});

		// Marcar campos como tocados para mostrar validación visual
		var diaDesdeElement = $window.document.getElementById('dia_desde');
		var diaHastaElement = $window.document.getElementById('dia_hasta');
		var filtroUserElement = $window.document.getElementById('filtro_user');
		
		if (diaDesdeElement) {
			diaDesdeElement.classList.add('ng-touched');
		}
		if (diaHastaElement) {
			diaHastaElement.classList.add('ng-touched');
		}
		if (filtroUserElement) {
			filtroUserElement.classList.add('ng-touched');
		}

		// Validar todos los campos y mostrar todos los mensajes de error
		var hasErrors = false;
		
		// Validar fecha desde
		if (!$scope.dia_desde || $scope.dia_desde.trim() === '') {
			$scope.desdewarning = true;
			hasErrors = true;
			console.log('Error: Fecha desde vacía');
		} else {
			$scope.desdewarning = false;
		}
		
		// Validar fecha hasta
		if (!$scope.dia_hasta || $scope.dia_hasta.trim() === '') {
			$scope.hastawarning = true;
			hasErrors = true;
			console.log('Error: Fecha hasta vacía');
		} else {
			$scope.hastawarning = false;
		}
		
		// Validar filtro de usuario
		if (!$scope.filtro_user || $scope.filtro_user.trim() === '') {
			$scope.legajowarning = true;
			hasErrors = true;
			console.log('Error: Filtro usuario vacío');
		} else {
			$scope.legajowarning = false;
		}
		
		console.log('Errores encontrados:', hasErrors);
		console.log('Mensajes de error:', {
			desdewarning: $scope.desdewarning,
			hastawarning: $scope.hastawarning,
			legajowarning: $scope.legajowarning
		});
		
		// Si hay errores, no continuar
		if (hasErrors) {
			$scope.$apply();
			return;
		}
		
		// Si todos los campos están completos, proceder con la búsqueda
		if (!$scope.desdewarning && !$scope.hastawarning && !$scope.legajowarning) {
			var desde = $scope.dia_desde.split('-');
			var hasta = $scope.dia_hasta.split('-');

			$scope.filtro_user = $window.document.getElementById('filtro_user').value;

			var auxdesde = desde[2] + '/' + desde[1] + '/' + desde[0];
			var auxhasta = hasta[2] + '/' + hasta[1] + '/' + hasta[0];

			$scope.view_rango1 = auxdesde;
			$scope.view_rango2 = auxhasta;
			var user = $scope.filtro_user;
			//$scope.getReporte(user, auxdesde, auxhasta, $scope.user_Planta);
			$http({
				url: $scope.baseReporte + 'getUserReport',
				method: "GET",
				params: { user: user, desde: auxdesde, hasta: auxhasta, planta: $scope.user_Planta }
			})
				.success(function (data) {
					data.consumidos = $scope.Ordena(data.consumidos);
					$scope.reportes = data;
					$scope.dataset = data;
					$scope.cantcons = data.consumidos.length;
					$scope.apagar = -$scope.cantcons + data.bonificados;
				})
				.error(function (data, status) {
					swal(
						'Ha ocurrido un error',
						'Error al obtener registros para legajo ' + user,
						'error'
					);
				});
			$scope.ViewAction = 'pedidos';
		}
	}

	$scope.AgregaUser = function (legajo) {
		$scope.filtro_user = legajo;
		$('#userSearch').modal('hide');
	}

	$scope.filtraUsuarios = function () {
		$scope.filtro_comensal = $window.document.getElementById('filtro_comensal').value;
		if ($scope.filtro_comensal != '') {
			$scope.filterUser = [];
			$scope.usuarios.forEach(x => {
				datos = x.nombre.toLowerCase() + x.apellido.toLowerCase() + x.legajo;
				if (datos.includes($scope.filtro_comensal)) {
					$scope.filterUser.push(x);
				}
			});
		} else {
			$scope.filterUser = $scope.usuarios;
		}
	}

	$scope.Ordena = function (pedidos) {
		pedidos.sort(function (a, b) {
			return (a.createdate > b.createdate) ? -1 : ((a.createdate > b.createdate) ? 1 : 0);
		});
		return pedidos;
	}

	$scope.ViewAction = 'inicio';

	$scope.currentPage = 0;
	$scope.pageSize = 20;

	$scope.currentPageusers = 0;
	$scope.pageSizeusers = 20;

	$scope.numberOfPages = function () {
		return Math.ceil($scope.dataset.consumidos.length / $scope.pageSize);
	}

	$scope.numberOfPagesusers = function () {
		return Math.ceil($scope.filterUser.length / $scope.pageSizeusers);
	}
});