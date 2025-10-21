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

app.controller('ReportegGestion', function ($scope, $sce, $http, $window, $timeout) {

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

	// Debug: Verificar valores del localStorage
	console.log('Valores del localStorage:', {
		planta: $scope.user_Planta,
		centrodecosto: $scope.user_Centrodecosto,
		proyecto: $scope.user_Proyecto
	});
	
	// Debug: Verificar todos los valores del localStorage
	console.log('Todos los valores del localStorage:', {
		role: localStorage.getItem('role'),
		nombre: localStorage.getItem('nombre'),
		apellido: localStorage.getItem('apellido'),
		planta: localStorage.getItem('planta'),
		centrodecosto: localStorage.getItem('centrodecosto'),
		proyecto: localStorage.getItem('proyecto'),
		plannutricional: localStorage.getItem('plannutricional'),
		bonificacion: localStorage.getItem('bonificacion'),
		dni: localStorage.getItem('dni')
	});

	$scope.filtro_fechadesde_inicio = null;
	$scope.filtro_fechadesde = null;
	$scope.filtro_fechahasta = null;
	$scope.filtro_legajodesde = '';
	$scope.filtro_legajohasta = '';
	$scope.filtro_plato = '';
	$scope.filtro_calificacion = '';
	$scope.filtro_turno = ''; // Se llenará después de cargar los turnos
	$scope.filtro_planta = $scope.user_Planta || '';
	$scope.filtro_centrodecosto = $scope.user_Centrodecosto || '';
	$scope.filtro_proyecto = $scope.user_Proyecto || '';
	$scope.filtro_invitado = '';

	// Variables para los buscadores
	$scope.usuarios = [];
	$scope.platos = [];
	$scope.platosFiltrados = [];
	$scope.busquedaLegajo = '';
	$scope.busquedaPlato = '';
	$scope.campoDestino = ''; // Para saber qué campo llenar (desde/hasta)

	// Función para buscar legajos
	$scope.buscarLegajo = function() {
		console.log('=== buscarLegajo() ejecutándose ===');
		$scope.busquedaLegajo = '';
		$scope.usuarios = [];
		$scope.campoDestino = 'desde';
		// Usar $timeout de AngularJS
		$timeout(function() {
			console.log('Intentando abrir modal #modalBuscarLegajo');
			var modal = $('#modalBuscarLegajo');
			console.log('Modal encontrado:', modal.length > 0);
			if (modal.length > 0) {
				modal.modal('show');
			} else {
				console.error('Modal #modalBuscarLegajo no encontrado');
			}
		}, 100);
	};

	// Función para buscar usuarios por nombre
	$scope.buscarUsuarios = function() {
		if ($scope.busquedaLegajo && $scope.busquedaLegajo.length >= 2) {
			$http.get('http://localhost:8000/api/usuario/buscar', {
				params: { nombre: $scope.busquedaLegajo }
			})
			.then(function(response) {
				$scope.usuarios = response.data;
			})
			.catch(function(error) {
				console.log('Error al buscar usuarios:', error);
				$scope.usuarios = [];
			});
		} else {
			$scope.usuarios = [];
		}
	};

	// Función para seleccionar legajo
	$scope.seleccionarLegajo = function(usuario) {
		if ($scope.campoDestino === 'hasta') {
			$scope.filtro_legajohasta = usuario.legajo;
		} else {
			$scope.filtro_legajodesde = usuario.legajo;
		}
		$scope.campoDestino = ''; // Reset
		$('#modalBuscarLegajo').modal('hide');
	};

	// Función para buscar legajo hasta
	$scope.buscarLegajoHasta = function() {
		$scope.busquedaLegajo = '';
		$scope.usuarios = [];
		$scope.campoDestino = 'hasta'; // Para saber qué campo llenar
		// Usar timeout para asegurar que el modal se abra
		setTimeout(function() {
			$('#modalBuscarLegajo').modal('show');
		}, 100);
	};

	// Función para buscar platos
	$scope.buscarPlato = function() {
		console.log('=== buscarPlato() ejecutándose ===');
		$scope.busquedaPlato = '';
		$scope.platos = [];
		$scope.platosFiltrados = [];
		// Cargar platos
		$http.get('http://localhost:8000/api/plato/getAll')
			.then(function(response) {
				$scope.platos = response.data;
				$scope.platosFiltrados = response.data;
			})
			.catch(function(error) {
				console.log('Error al cargar platos:', error);
				$scope.platos = [];
				$scope.platosFiltrados = [];
			});
		// Usar $timeout de AngularJS
		$timeout(function() {
			console.log('Intentando abrir modal #modalBuscarPlato');
			var modal = $('#modalBuscarPlato');
			console.log('Modal encontrado:', modal.length > 0);
			if (modal.length > 0) {
				modal.modal('show');
			} else {
				console.error('Modal #modalBuscarPlato no encontrado');
			}
		}, 100);
	};

	// Función para buscar platos por nombre
	$scope.buscarPlatos = function() {
		if ($scope.busquedaPlato && $scope.busquedaPlato.length >= 2) {
			// Filtrar platos localmente
			$scope.platosFiltrados = $scope.platos.filter(function(plato) {
				return plato.nombre.toLowerCase().includes($scope.busquedaPlato.toLowerCase()) ||
					   plato.codigo.toLowerCase().includes($scope.busquedaPlato.toLowerCase());
			});
		} else {
			$scope.platosFiltrados = $scope.platos;
		}
	};

	// Función para seleccionar plato
	$scope.seleccionarPlato = function(plato) {
		$scope.filtro_plato = plato.codigo;
		$('#modalBuscarPlato').modal('hide');
	};

	$scope.getReporte = function () {
		// Validar fecha desde requerida
		if (!$scope.filtro_fechadesde_inicio) {
			alert('La fecha desde es requerida');
			return;
		}

		// Obtener el reporte
		var desde = $scope.filtro_fechadesde_inicio.split('-');
		desde = desde[2] + '/' + desde[1] + '/' + desde[0];
		
		var hasta = '';
		if ($scope.filtro_fechaactualidad) {
			var hastaDate = $scope.filtro_fechaactualidad.split('-');
			hasta = hastaDate[2] + '/' + hastaDate[1] + '/' + hastaDate[0];
		}

		$http({
			url: $scope.baseReporte + 'getComandas',
			method: "GET",
			params: { 
				planta: $scope.filtro_planta || $scope.user_Planta, 
				fechadesde: desde,
				fechahasta: hasta
			}
		})
		.then(function (response) {
			$scope.ViewAction = 'reporte';
			var data = $scope.Ordena(response.data);
			$scope.dataset = data;
			$scope.comandas = data;
			$scope.currentPage = 0; // Reset pagination
			// El acordeón permanece abierto siempre
		})
		.catch(function (error) {
			alert('Error al obtener comandas: ' + error.data);
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


	$scope.Ordena = function (pedidos) {
		pedidos.sort(function (a, b) {
			return (a.createdate > b.createdate) ? -1 : ((a.createdate > b.createdate) ? 1 : 0);
		});
		return pedidos;
	}

	$scope.ViewAction = 'inicio';
	$scope.toggleFiltros = true; // Siempre abierto

	// Forzar que el filtro esté abierto
	$timeout(function() {
		$scope.toggleFiltros = true;
		$scope.$apply();
	}, 100);

	// Cargar datos de filtros al inicializar
	$scope.cargarDatosFiltros = function() {
		$http.get($scope.baseProyectos + 'getAll')
			.then(function (response) {
				$scope.proyectos = response.data;
				return $http.get($scope.baseCentrodecostos + 'getAll');
			})
			.then(function (response) {
				$scope.centrosdecosto = response.data;
				return $http.get($scope.basePlantas + 'getAll');
			})
			.then(function (response) {
				$scope.plantas = response.data;
				return $http.get($scope.baseTurno + 'getAll');
			})
			.then(function (response) {
				$scope.turnos = response.data;
				// Configurar turno por defecto si hay turnos disponibles
				if ($scope.turnos && $scope.turnos.length > 0) {
					$scope.filtro_turno = $scope.turnos[0].codigo;
				}
				
				// Ahora que los datos están cargados, pre-llenar los filtros
				console.log('=== PRE-LLENANDO DESPUÉS DE CARGAR DATOS ===');
				
				// Pre-llenar planta
				if ($scope.user_Planta) {
					$scope.filtro_planta = $scope.user_Planta;
					console.log('Planta asignada:', $scope.filtro_planta);
				}
				
				// Pre-llenar centro de costo
				if ($scope.user_Centrodecosto && $scope.centrosdecosto) {
					var centroEncontrado = $scope.centrosdecosto.find(function(cc) {
						return cc.nombre === $scope.user_Centrodecosto;
					});
					if (centroEncontrado) {
						$scope.filtro_centrodecosto = centroEncontrado.nombre;
						console.log('Centro de costo asignado:', $scope.filtro_centrodecosto);
					} else {
						console.log('Centro de costo no encontrado en la lista:', $scope.user_Centrodecosto);
					}
				}
				
				// Pre-llenar proyecto
				if ($scope.user_Proyecto && $scope.proyectos) {
					var proyectoEncontrado = $scope.proyectos.find(function(proj) {
						return proj.nombre === $scope.user_Proyecto;
					});
					if (proyectoEncontrado) {
						$scope.filtro_proyecto = proyectoEncontrado.nombre;
						console.log('Proyecto asignado:', $scope.filtro_proyecto);
					} else {
						console.log('Proyecto no encontrado en la lista:', $scope.user_Proyecto);
					}
				}
				
				console.log('Estado actual de los filtros:', {
					filtro_planta: $scope.filtro_planta,
					filtro_centrodecosto: $scope.filtro_centrodecosto,
					filtro_proyecto: $scope.filtro_proyecto
				});
				
				console.log('Datos del localStorage vs API:', {
					user_Centrodecosto: $scope.user_Centrodecosto,
					centrosdecosto_disponibles: $scope.centrosdecosto.map(function(cc) { return cc.nombre; }),
					user_Proyecto: $scope.user_Proyecto,
					proyectos_disponibles: $scope.proyectos.map(function(proj) { return proj.nombre; })
				});
				console.log('Datos cargados:', {
					plantas: $scope.plantas,
					centrosdecosto: $scope.centrosdecosto,
					proyectos: $scope.proyectos,
					turnos: $scope.turnos,
					filtro_planta: $scope.filtro_planta,
					filtro_centrodecosto: $scope.filtro_centrodecosto,
					filtro_proyecto: $scope.filtro_proyecto,
					filtro_turno: $scope.filtro_turno
				});
				// Forzar actualización de la vista
				$scope.$apply();
				// Asegurar que el filtro esté abierto
				$scope.toggleFiltros = true;
				
				// Forzar actualización adicional para asegurar que los select se llenen
				$timeout(function() {
					$scope.$apply();
					console.log('=== ACTUALIZACIÓN FINAL DE VISTA ===');
					console.log('Filtros finales:', {
						filtro_planta: $scope.filtro_planta,
						filtro_centrodecosto: $scope.filtro_centrodecosto,
						filtro_proyecto: $scope.filtro_proyecto
					});
				}, 100);
			})
			.catch(function (error) {
				console.log('Error al cargar datos de filtros:', error);
			});
	};

	// Función para pre-llenar filtros inmediatamente
	$scope.preLlenarFiltros = function() {
		console.log('=== PRE-LLENANDO FILTROS ===');
		console.log('Datos del localStorage disponibles:', {
			planta: $scope.user_Planta,
			centrodecosto: $scope.user_Centrodecosto,
			proyecto: $scope.user_Proyecto
		});
		
		// Pre-llenar inmediatamente con datos del localStorage
		$scope.filtro_planta = $scope.user_Planta || '';
		$scope.filtro_centrodecosto = $scope.user_Centrodecosto || '';
		$scope.filtro_proyecto = $scope.user_Proyecto || '';
		
		console.log('Filtros asignados:', {
			filtro_planta: $scope.filtro_planta,
			filtro_centrodecosto: $scope.filtro_centrodecosto,
			filtro_proyecto: $scope.filtro_proyecto
		});
		
		// Forzar actualización de la vista
		$scope.$apply();
	};

	// Pre-llenar filtros inmediatamente
	$scope.preLlenarFiltros();

	// También pre-llenar con timeout para asegurar que se ejecute después de la inicialización
	$timeout(function() {
		console.log('=== PRE-LLENANDO CON TIMEOUT ===');
		$scope.filtro_planta = $scope.user_Planta || '';
		$scope.filtro_centrodecosto = $scope.user_Centrodecosto || '';
		$scope.filtro_proyecto = $scope.user_Proyecto || '';
		console.log('Filtros asignados con timeout:', {
			filtro_planta: $scope.filtro_planta,
			filtro_centrodecosto: $scope.filtro_centrodecosto,
			filtro_proyecto: $scope.filtro_proyecto
		});
	}, 200);

	// Ejecutar inmediatamente al inicializar
	$scope.cargarDatosFiltros();

	// Función para forzar que el filtro esté abierto
	$scope.forceOpenFiltros = function() {
		$scope.toggleFiltros = true;
		$scope.$apply();
	};

	// Forzar que el filtro esté abierto después de un tiempo
	$timeout(function() {
		$scope.forceOpenFiltros();
	}, 500);
	
	// También ejecutar con un pequeño delay para asegurar que se carguen
	setTimeout(function() {
		$scope.cargarDatosFiltros();
	}, 100);


	$scope.currentPage = 0;
	$scope.pageSize = 20;

	$scope.numberOfPages = function () {
		return Math.ceil($scope.dataset.length / $scope.pageSize);
	}

	// Funciones de paginación tipo DataTable
	$scope.getPageNumbers = function () {
		var totalPages = $scope.numberOfPages();
		var current = $scope.currentPage + 1;
		var pages = [];
		
		if (totalPages <= 7) {
			// Si hay 7 páginas o menos, mostrar todas
			for (var i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Lógica para mostrar páginas con elipsis
			pages.push(1);
			
			if (current > 4) {
				pages.push('...');
			}
			
			var start = Math.max(2, current - 1);
			var end = Math.min(totalPages - 1, current + 1);
			
			for (var i = start; i <= end; i++) {
				if (i !== 1 && i !== totalPages) {
					pages.push(i);
				}
			}
			
			if (current < totalPages - 3) {
				pages.push('...');
			}
			
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}
		
		return pages;
	}

	$scope.goToPage = function (page) {
		if (page >= 0 && page < $scope.numberOfPages()) {
			$scope.currentPage = page;
		}
	}

	$scope.changePageSize = function (newSize) {
		$scope.pageSize = parseInt(newSize);
		$scope.currentPage = 0;
	}

});