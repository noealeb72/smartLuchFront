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

app.controller('ReportegComensales', function ($scope, $sce, $http, $window, $timeout) {
	// Usar la variable de configuración global API_BASE_URL
	var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';

	$scope.basePlantas = apiBaseUrl + '/api/planta/';
	$scope.plantas = '';
	$scope.baseCentrodecostos = apiBaseUrl + '/api/centrodecosto/';
	$scope.centrosdecosto = '';
	$scope.baseProyectos = apiBaseUrl + '/api/proyecto/';
	$scope.proyectos = '';
	$scope.baseTurno = apiBaseUrl + '/api/turno/';
	$scope.turnos = '';
	$scope.baseComanda = apiBaseUrl + '/api/comanda/';
	$scope.baseReporte = apiBaseUrl + '/api/reporte/';
	$scope.usuarios = '';
	$scope.baseUsuario = apiBaseUrl + '/api/usuario/';
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
											Swal.fire(
												'Ha ocurrido un error',
												'Error al obtener usuarios de la planta',
												'error'
											);
										});
								})
								.error(function (data, status) {
									Swal.fire(
										'Ha ocurrido un error',
										'Error al obtener turnos',
										'error'
									);
								});
						})
						.error(function (data, status) {
							Swal.fire(
								'Ha ocurrido un error',
								'Error al obtener plantas',
								'error'
							);
						});
				})
				.error(function (data, status) {
					Swal.fire(
						'Ha ocurrido un error',
						'Error al obtener centros de costo',
						'error'
					);
				});
		})
		.error(function (data, status) {
			Swal.fire(
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
				Swal.fire(
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
		console.log('=== INICIO buscarUsuario ===');
		
		// Leer valores de los campos directamente del DOM
		var diaDesdeValue = $window.document.getElementById('dia_desde').value;
		var diaHastaValue = $window.document.getElementById('dia_hasta').value;
		var filtroUserValue = $window.document.getElementById('filtro_user').value;

		console.log('Valores leídos:', {
			dia_desde: diaDesdeValue,
			dia_hasta: diaHastaValue,
			filtro_user: filtroUserValue
		});

		// Actualizar el scope con los valores
		$scope.dia_desde = diaDesdeValue;
		$scope.dia_hasta = diaHastaValue;
		$scope.filtro_user = filtroUserValue;

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

		// Inicializar todas las variables de warning en false
		$scope.desdewarning = false;
		$scope.hastawarning = false;
		$scope.legajowarning = false;

		// Validar todos los campos y establecer warnings
		var hasErrors = false;
		
		// Validar fecha desde
		if (!diaDesdeValue || diaDesdeValue.trim() === '') {
			$scope.desdewarning = true;
			hasErrors = true;
			console.log('Error: Fecha desde vacía');
		}
		
		// Validar fecha hasta
		if (!diaHastaValue || diaHastaValue.trim() === '') {
			$scope.hastawarning = true;
			hasErrors = true;
			console.log('Error: Fecha hasta vacía');
		}
		
		// Validar filtro de usuario
		if (!filtroUserValue || filtroUserValue.trim() === '') {
			$scope.legajowarning = true;
			hasErrors = true;
			console.log('Error: Filtro usuario vacío');
		}
		
		console.log('Estado de warnings:', {
			desdewarning: $scope.desdewarning,
			hastawarning: $scope.hastawarning,
			legajowarning: $scope.legajowarning,
			hasErrors: hasErrors
		});
		
		// Usar $timeout para asegurar que la vista se actualice
		$timeout(function() {
			console.log('Aplicando cambios a la vista...');
		}, 0);
		
		// Si hay errores, no continuar
		if (hasErrors) {
			console.log('Hay errores, deteniendo ejecución');
			return;
		}
		
		console.log('Todos los campos están completos, procediendo con la búsqueda...');
		
		// Si todos los campos están completos, proceder con la búsqueda
		var desde = diaDesdeValue.split('-');
		var hasta = diaHastaValue.split('-');

		var auxdesde = desde[2] + '/' + desde[1] + '/' + desde[0];
		var auxhasta = hasta[2] + '/' + hasta[1] + '/' + hasta[0];

		$scope.view_rango1 = auxdesde;
		$scope.view_rango2 = auxhasta;
		var user = filtroUserValue;
		
		$http({
			url: $scope.baseReporte + 'getUserReport',
			method: "GET",
			params: { user: user, desde: auxdesde, hasta: auxhasta, planta: $scope.user_Planta }
		})
			.success(function (data) {
				console.log('Datos recibidos de la API:', data);
				
				data.consumidos = $scope.Ordena(data.consumidos);
				$scope.reportes = data;
				$scope.dataset = data;
				$scope.cantcons = data.consumidos.length;
				$scope.apagar = -$scope.cantcons + data.bonificados;
				
				// Si no vienen centrodecosto y proyecto en la respuesta, obtenerlos del primer pedido
				if (!data.centrodecosto && data.consumidos && data.consumidos.length > 0) {
					$scope.reportes.centrodecosto = data.consumidos[0].centrodecosto;
					console.log('Centro de costo obtenido del primer pedido:', $scope.reportes.centrodecosto);
				}
				
				if (!data.proyecto && data.consumidos && data.consumidos.length > 0) {
					$scope.reportes.proyecto = data.consumidos[0].proyecto;
					console.log('Proyecto obtenido del primer pedido:', $scope.reportes.proyecto);
				}
				
				$scope.ViewAction = 'pedidos';
			})
			.error(function (data, status) {
				Swal.fire(
					'Ha ocurrido un error',
					'Error al obtener registros para legajo ' + user,
					'error'
				);
			});
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

	// Funciones para paginación tipo DataTable
	$scope.getPageNumbers = function() {
		var pages = [];
		var totalPages = $scope.numberOfPages();
		var current = $scope.currentPage;
		
		if (totalPages <= 7) {
			// Si hay 7 páginas o menos, mostrar todas
			for (var i = 0; i < totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Lógica para mostrar páginas con puntos suspensivos
			if (current <= 3) {
				// Estamos cerca del inicio
				for (var i = 0; i < 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages - 1);
			} else if (current >= totalPages - 4) {
				// Estamos cerca del final
				pages.push(0);
				pages.push('...');
				for (var i = totalPages - 5; i < totalPages; i++) {
					pages.push(i);
				}
			} else {
				// Estamos en el medio
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
	}

	// Función para ir a una página específica
	$scope.goToPage = function(page) {
		if (page >= 0 && page < $scope.numberOfPages()) {
			$scope.currentPage = page;
		}
	}

	// Función para cambiar el tamaño de página
	$scope.changePageSize = function(newSize) {
		$scope.pageSize = parseInt(newSize);
		$scope.currentPage = 0; // Volver a la primera página
	}
});