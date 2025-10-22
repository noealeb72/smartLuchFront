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

	$scope.filtro_plato = '';

	// Variables para el buscador de platos
	$scope.platos = [];
	$scope.platosFiltrados = [];
	$scope.busquedaPlato = '';

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
		// Obtener el reporte solo con filtro de platos
		$http({
			url: $scope.baseReporte + 'getComandas',
			method: "GET",
			params: { 
				plato: $scope.filtro_plato || ''
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

	// Inicializar con filtros abiertos
	$scope.toggleFiltros = true;


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