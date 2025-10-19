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

app.controller('ReportegGestion', function ($scope, $sce, $http, $window) {

	$scope.basePlantas = 'http://localhost:8000/api/planta/';
	$scope.plantas = '';
	$scope.baseCentrodecostos = 'http://localhost:8000/api/centrodecosto/';
	$scope.centrosdecosto = '';
	$scope.baseProyectos = 'http://localhost:8000/api/proyecto/';
	$scope.proyectos = '';
	$scope.baseTurno = 'http://localhost:8000/api/turno/';
	$scope.turnos = '';
	$scope.baseComanda = 'http://localhost:8000/api/comanda/';
	$scope.comandas = '';
	$scope.baseReporte = 'http://localhost:8000/api/reporte/';
	$scope.reportes = '';
	$scope.dataset = [];
	$scope.totales = { platos: 0, promedio: 0, devueltos: 0, costo: 0 };

	$scope.filtro_fechaactualidad = new Date();

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

	$scope.filtro_fechadesde_inicio = null;
	$scope.filtro_fechadesde = null;
	$scope.filtro_fechahasta = null;
	$scope.filtro_legajodesde = '';
	$scope.filtro_legajohasta = '';
	$scope.filtro_plato = '';
	$scope.filtro_calificacion = '';
	$scope.filtro_turno = '';
	$scope.filtro_planta = '';
	$scope.filtro_centrodecosto = '';
	$scope.filtro_proyecto = '';
	$scope.filtro_invitado = '';

	$scope.getReporte = function () {
		$scope.filtro_fechadesde_inicio = $window.document.getElementById('filtro_fechadesde_inicio').value;
		var desde = $scope.filtro_fechadesde_inicio.split('-');
		var desde = desde[2] + '/' + desde[1] + '/' + desde[0];

		$http({
			url: $scope.baseReporte + 'getComandas',
			method: "GET",
			params: { planta: $scope.user_Planta, fechadesde: desde }
		})
			.success(function (data) {
				$scope.ViewAction = 'reporte';
				data = $scope.Ordena(data);
				$scope.dataset = data;
				$scope.comandas = data;
				$http.get($scope.baseProyectos + 'getAll')
					.success(function (data) {
						$scope.proyectos = data;
						$http.get($scope.baseCentrodecostos + 'getAll')
							.success(function (data) {
								$scope.centrosdecosto = data;
								$http.get($scope.basePlantas + 'getAll')
									.success(function (data) {
										$scope.plantas = data;
										$http.get($scope.baseTurno + 'getAll')
											.success(function (data) {
												$scope.turnos = data;
											})
											.error(function (data, status) {
												swal(
													'Ha ocurrido un error',
													'Error al obtener proyectos',
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
									'Error al obtener plantas',
									'error'
								);
							});
					})
					.error(function (data, status) {
						swal(
							'Ha ocurrido un error',
							'Error al obtener totales',
							'error'
						);
					});
			})

			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener comandas',
					'error'
				);
			});
	}


	$scope.$watch('dataset', function (newValue, oldValue) {
		if (newValue != oldValue) {
			$scope.totales = { platos: 0, promedio: 0, devueltos: 0, costo: 0 };
			var calificaciones = 0;
			var pedidos = 0;
			var pedidoscalificaciones = 0;
			newValue.forEach(x => {
				$scope.totales.platos += 1;
				calificaciones += x.calificacion;
				pedidoscalificaciones += 1;
				if (x.estado === 'D') { $scope.totales.devueltos += 1;
				}
				$scope.totales.costo += x.monto;//contamos devueltos en costos
			});
			$scope.totales.promedio = Math.round(calificaciones / pedidoscalificaciones);
		}
	}
	);

	$scope.SelectFiltros = function () {

		$scope.filtro_fechahasta = $window.document.getElementById('filtro_fechahasta');
		$scope.filtro_planta = $window.document.getElementById('filtro_planta').value;
		$scope.filtro_centrodecosto = $window.document.getElementById('filtro_centrodecosto').value;
		$scope.filtro_proyecto = $window.document.getElementById('filtro_proyecto').value;
		$scope.filtro_legajodesde = $window.document.getElementById('filtro_legajodesde').value;
		$scope.filtro_legajohasta = $window.document.getElementById('filtro_legajohasta').value;
		$scope.filtro_plato = $window.document.getElementById('filtro_plato').value;
		$scope.filtro_calificacion = $window.document.getElementById('filtro_calificacion').value;
		$scope.filtro_turno = $window.document.getElementById('filtro_turno').value;
		$scope.filtro_invitado = $window.document.getElementById('filtro_invitado').value;
		if ($scope.filtro_invitado !== "") {
			if ($scope.filtro_invitado == 1) {
				$scope.filtro_invitado = true;
			} else {
				$scope.filtro_invitado = false;
			}
		}

		if ($scope.filtro_fechahasta.value === '' && $scope.filtro_legajodesde === ''
			&& $scope.filtro_legajohasta === '' && $scope.filtro_plato === '' && $scope.filtro_calificacion === ''
			&& $scope.filtro_planta === "" && $scope.filtro_centrodecosto === "" && $scope.filtro_proyecto === "" && $scope.filtro_turno === "" && $scope.filtro_invitado === "") {
			$scope.dataset = $scope.comandas;
		} else {
			var datos = $scope.comandas;
			$scope.dataset = [];
			datos.forEach(x => {
				var safa = true;
				var date = x.createdate.split('T');
				var fecha = date[0].split('-');
				var y = fecha[0] + fecha[1] + fecha[2];
				y = parseInt(y, 10);
				if ($scope.filtro_fechahasta.value != '' && $scope.filtro_fechahasta.value != null) {
					aux = $scope.filtro_fechahasta.value.split('-');
					var anio = aux[0];
					var mes = aux[1]
					var dia = aux[2];
					var fechahasta = anio.toString() + mes.toString() + dia.toString();
					fechahasta = parseInt(fechahasta, 10);
					if (fechahasta >= y) {
						safa = true;
					} else {
						return;
					}
				}
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

				if ($scope.filtro_legajodesde != '') {
					if ($scope.filtro_legajohasta != '') {
						if ($scope.filtro_legajohasta >= x.user_fileNumber && x.user_fileNumber >= $scope.filtro_legajodesde) {
							safa = true;
						} else {
							return;
						}
					} else {
						if ($scope.filtro_legajodesde <= x.user_fileNumber) {
							safa = true;
						} else {
							return;
						}
					}
				} else {
					if ($scope.filtro_legajohasta != '') {
						if ($scope.filtro_legajohasta >= x.user_fileNumber) {
							safa = true;
						} else {
							return;
						}
					}
				}
				if ($scope.filtro_plato != '') {
					if ($scope.filtro_plato === x.cod_plato) {
						safa = true;
					} else {
						return;
					}
				}
				if ($scope.filtro_calificacion != '') {
					if ($scope.filtro_calificacion === x.calificacion) {
						safa = true;
					} else {
						return;
					}
				}
				if ($scope.filtro_planta != "") {
					if ($scope.filtro_planta === x.planta) {
						safa = true;
					} else {
						return;
					}
				}
				if ($scope.filtro_centrodecosto != "") {
					if ($scope.filtro_centrodecosto === x.centrodecosto) {
						safa = true;
					} else {
						return;
					}
				}
				if ($scope.filtro_proyecto != "") {
					if ($scope.filtro_proyecto === x.proyecto) {
						safa = true;
					} else {
						return;
					}
				}
				if ($scope.filtro_invitado !== "") {
					if ($scope.filtro_invitado == x.invitado) {
						safa = true;
					} else {
						return;
                    }
                }

				$scope.dataset.push(x);
			});
		}
		$('#filtrosModal').modal('hide');
	}

	$scope.loadFiltro = function () {

		$scope.filtro_fechahasta = $window.document.getElementById('filtro_fechahasta');
		$scope.filtro_planta = $window.document.getElementById('filtro_planta').value;
		$scope.filtro_centrodecosto = $window.document.getElementById('filtro_centrodecosto').value;
		$scope.filtro_proyecto = $window.document.getElementById('filtro_proyecto').value;
		$scope.filtro_legajodesde = $window.document.getElementById('filtro_legajodesde').value;
		$scope.filtro_legajohasta = $window.document.getElementById('filtro_legajohasta').value;
		$scope.filtro_plato = $window.document.getElementById('filtro_plato').value;
		$scope.filtro_calificacion = $window.document.getElementById('filtro_calificacion').value;
		$scope.filtro_turno = $window.document.getElementById('filtro_turno').value;

		var desde = $scope.filtro_fechadesde_inicio.split('-');
		var aux = new Date(desde[0], desde[1] - 1, desde[2]);
		$scope.filtro_fechadesde = aux;
	}

	$scope.Ordena = function (pedidos) {
		pedidos.sort(function (a, b) {
			return (a.createdate > b.createdate) ? -1 : ((a.createdate > b.createdate) ? 1 : 0);
		});
		return pedidos;
	}

	$scope.ViewAction = 'inicio';

	$scope.ClearFiltros = function () {

		$scope.filtro_fechahasta.value = "";
		$scope.filtro_legajodesde = '';
		document.getElementById('filtro_legajodesde').value = "";
		$scope.filtro_legajohasta = '';
		document.getElementById('filtro_legajohasta').value = "";
		$scope.filtro_plato = '';
		document.getElementById('filtro_plato').value = "";
		$scope.filtro_calificacion = '';
		document.getElementById('filtro_calificacion').value = "";
		$scope.filtro_planta = "";
		document.getElementById('filtro_planta').value = "";
		$scope.filtro_centrodecosto = "";
		document.getElementById('filtro_centrodecosto').value = "";
		$scope.filtro_proyecto = "";
		document.getElementById('filtro_proyecto').value = "";
		$scope.filtro_turno = "";
		document.getElementById('filtro_turno').value = "";
		$scope.filtro_invitado = "";
		document.getElementById('filtro_invitado').value = "";
		$scope.SelectFiltros();
	}

	$scope.currentPage = 0;
	$scope.pageSize = 20;

	$scope.numberOfPages = function () {
		return Math.ceil($scope.dataset.length / $scope.pageSize);
	}
});