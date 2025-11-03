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
		input = fecha[2] + '/' + fecha[1] + '/' + fecha[0] + ' ' + hora[0];
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

app.controller('Despacho', function ($scope, $sce, $http, $window) {
	// Usar la variable de configuración global API_BASE_URL
	var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
	$scope.titulo = 'Despacho de platos';  // Título inicial
	$scope.base = apiBaseUrl + '/api/comanda/';
	$scope.pedidos = '';
	$scope.baseUser = apiBaseUrl + '/api/usuario/';
	$scope.basePlatos = apiBaseUrl + '/api/plato/';
	$scope.baseMenu = apiBaseUrl + '/api/menudd/';
	$scope.baseTurnos = apiBaseUrl + '/api/turno/';
	$scope.Pic = '';
	$scope.view_plato_descripcion = '';
	$scope.allPlatos = [];
	$scope.allTurnos = [];
	$scope.allMenus = [];
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
	$scope.pedidosGastados = '';
	$scope.pedidosRestantes = '';

	// Fecha y hora para el navbar en Despacho
	$scope.currentDateTime = new Date().toLocaleString('es-AR');
	setInterval(function() {
		$scope.currentDateTime = new Date().toLocaleString('es-AR');
		if (!$scope.$$phase) { $scope.$apply(); }
	}, 1000);

	$scope.filterPlanta = localStorage.getItem('planta');
	$scope.filterCentrodecosto = localStorage.getItem('centrodecosto');
	$scope.filterProyecto = localStorage.getItem('proyecto');
	$scope.filterSearch = '';

	$scope.ModelCreate = function () {
		// debería ser automatico //
		$scope.view_npedido = $window.document.getElementById('view_npedido').value;
		$scope.view_userid = $window.document.getElementById('view_userid').value;
		$scope.view_codplato = $window.document.getElementById('view_codplato').value;
		$scope.view_monto = $window.document.getElementById('view_monto').value;
		$scope.view_fechahora = $window.document.getElementById('view_fechahora').value;
		$scope.view_bonificado = $window.document.getElementById('view_bonificado').value;
		$scope.view_estado = $window.document.getElementById('view_estado').value;
		$scope.view_comentario = $window.document.getElementById('view_comentario').value;
		//

		var jsonForm = {
			npedido: $scope.npedido, user_id: $scope.view_usuario, planta: $scope.view_planta, centrodecosto: $scope.view_centrodecosto, proyecto: $scope.view_proyecto,
			cod_plato: $scope.codplato, fecha_hora: $scope.view_fechahora, monto: $scope.view_monto, bonificado: $scope.view_bonificado, estado: $scope.view_estado, calificacion: $scope.view_calificacion, comentario: $scope.view_comentario
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
			Swal.fire({
				title: 'Operación Correcta',
				text: '',
				icon: 'success',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
				$scope.ModelReadAll();
			}
		}, function (error) {
			Swal.fire({
				title: 'Operación Incorrecta',
				text: error,
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
		});
	};

	// Función auxiliar para obtener descripción del plato y turno
	$scope.enriquecerDatosPedido = function(item) {
		// Buscar descripción del plato
		var platoEncontrado = null;
		if (item.cod_plato && $scope.allPlatos.length > 0) {
			platoEncontrado = $scope.allPlatos.find(function(p) {
				return p.codigo === item.cod_plato || p.codigo === item.cod_plato.toString();
			});
			if (platoEncontrado) {
				item.plato_descripcion = platoEncontrado.descripcion || '';
			} else {
				item.plato_descripcion = '';
			}
		} else {
			item.plato_descripcion = '';
		}

		// Buscar turno en el menú del día usando descripción del plato y fecha
		item.turno_descripcion = '';
		if (platoEncontrado && platoEncontrado.descripcion && $scope.allMenus.length > 0) {
			// Convertir fecha_hora o createdate a formato de fecha para buscar en menú
			var fechaPedido = null;
			if (item.fecha_hora) {
				try {
					fechaPedido = new Date(item.fecha_hora);
				} catch(e) {
					// Si fecha_hora viene en formato "dd/mm/yyyy hh:mm", parsearlo manualmente
					var parts = item.fecha_hora.split(' ');
					if (parts.length >= 1) {
						var dateParts = parts[0].split('/');
						if (dateParts.length === 3) {
							fechaPedido = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
						}
					}
				}
			} else if (item.createdate) {
				fechaPedido = new Date(item.createdate);
			}
			
			if (fechaPedido && !isNaN(fechaPedido.getTime())) {
				var fechaPedidoStr = fechaPedido.toISOString().split('T')[0]; // YYYY-MM-DD
				
				// Buscar en el menú del día por descripción del plato y fecha
				var menuEncontrado = $scope.allMenus.find(function(m) {
					var fechaMenu = '';
					if (m.fecha) {
						try {
							var fechaMenuObj = new Date(m.fecha);
							if (!isNaN(fechaMenuObj.getTime())) {
								fechaMenu = fechaMenuObj.toISOString().split('T')[0];
							} else if (typeof m.fecha === 'string') {
								// Intentar parsear formato diferente
								fechaMenu = m.fecha.split('T')[0] || m.fecha.split(' ')[0];
							}
						} catch(e) {
							fechaMenu = m.fecha.split('T')[0] || m.fecha.split(' ')[0];
						}
					}
					
					// Comparar descripción del plato y fecha
					var platoCoincide = false;
					if (m.plato === platoEncontrado.descripcion) {
						platoCoincide = true;
					} else if (m.cod_plato === item.cod_plato) {
						platoCoincide = true;
					}
					
					return platoCoincide && fechaMenu === fechaPedidoStr;
				});
				
				if (menuEncontrado && menuEncontrado.turno) {
					// Buscar descripción del turno
					var turnoEncontrado = $scope.allTurnos.find(function(t) {
						return t.descripcion === menuEncontrado.turno || t.id === menuEncontrado.turno || t.id === menuEncontrado.turno.toString();
					});
					if (turnoEncontrado && turnoEncontrado.descripcion) {
						item.turno_descripcion = turnoEncontrado.descripcion;
					} else {
						// Si no se encuentra el turno en la lista, usar directamente el valor del menú
						item.turno_descripcion = menuEncontrado.turno || '';
					}
				}
			}
		}
	};

	$scope.ModelReadAll = function () {
		$scope.dataset = [];
		$scope.searchKeyword;
		$scope.ViewAction = 'Pedidos';
		$scope.view_npedido = '';
		$scope.view_userid = '';
		$scope.view_codplato = '';
		$scope.view_monto = '';
		$scope.view_fechahora = '';
		$scope.view_bonificado = '';
		$scope.view_estado = '';
		$scope.view_comentario = '';

		// Cargar platos, turnos y menús en paralelo
		var promesas = [];
		
		// Cargar platos
		promesas.push($http.get($scope.basePlatos + 'getAll').then(function(response) {
			$scope.allPlatos = Array.isArray(response.data) ? response.data : [];
		}));
		
		// Cargar turnos
		promesas.push($http.get($scope.baseTurnos + 'getAll').then(function(response) {
			$scope.allTurnos = Array.isArray(response.data) ? response.data : [];
		}));
		
		// Cargar menús del día
		promesas.push($http.get($scope.baseMenu + 'getAll').then(function(response) {
			$scope.allMenus = Array.isArray(response.data) ? response.data : [];
		}));

		// Cuando todas las promesas se resuelvan, cargar comandas
		Promise.all(promesas).then(function() {
			$http.get($scope.base + 'getAll')
				.success(function (data) {
					if ($scope.filterSearch === '') {
						$scope.dataset = data;
					} else {
						var dato = data;
						$scope.dataset = [];
						dato.forEach(x => {
							id = x.id.toString();
							if (id === $scope.filterSearch) {
								$scope.dataset.push(x);
							}
						});
					}
					
					// Enriquecer cada item con descripción de plato y turno
					$scope.dataset.forEach(function(item) {
						$scope.enriquecerDatosPedido(item);
					});
					
					// Ordenar por fecha de creación (más nuevos primero)
					$scope.dataset.sort(function(a, b) {
						var dateA = new Date(a.createdate);
						var dateB = new Date(b.createdate);
						return dateB - dateA; // Orden descendente (más nuevos primero)
					});
				})
				.error(function (data, status) {
				Swal.fire({
					title: 'Ha ocurrido un error',
					text: 'No hay comunicación con la Api del sistema',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#343A40'
				});
				});
		}).catch(function(error) {
			console.error('Error al cargar datos auxiliares:', error);
			Swal.fire({
				title: 'Ha ocurrido un error',
				text: 'Error al cargar información de platos y turnos',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
		});
	};

	/*$scope.entregarPedido = function (item) {
		$scope.view_id = item.id;
		$http.get($scope.baseUser + 'getPic/' + item.user_id)
			.success(function (data) {
				$scope.Pic = data;
				alert('Entro');
			})
			.error(function (data, status) {
			Swal.fire({
				title: 'Ha ocurrido un error',
				text: 'Api no presente',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
			});
			});
	};*/

	$scope.entregarPedido = function (item) {

		$scope.view_id = item.id;
		$scope.view_userid = item.user_id;
		$scope.view_user_name = item.user_name;
		$scope.view_user_lastName = item.user_lastName;
		$scope.view_user_legajo = item.user_fileNumber;
		$scope.view_npedido = item.npedido;
		$scope.view_codplato = item.cod_plato;
		$scope.view_monto = item.monto;
		$scope.view_estado = item.estado;
		$scope.view_calificacion = item.calificacion;
		$scope.view_planta = item.planta;
		$scope.view_proyecto = item.proyecto
		$scope.view_centrodecosto = item.centrodecosto;
		$scope.view_bonificado = item.bonificado
		$scope.view_fechahora = item.fecha_hora;
		$scope.view_comentario = item.comentario;
		$scope.view_plato_descripcion = ''; // Limpiar descripción anterior

		// Obtener foto del usuario
		$http.get($scope.baseUser + 'getPic/' + $scope.view_userid)
			.success(function (data) {
				$scope.Pic = data[0];
			})
			.error(function (data, status) {
			Swal.fire({
				title: 'Ha ocurrido un error',
				text: 'Error al obtener foto',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
			})
		.catch (function(response) {
			console.log("ERROR:", response);
		});
		
		// Obtener descripción del plato por código
		if ($scope.view_codplato) {
			$http.get($scope.basePlatos + 'getAll')
				.success(function (data) {
					// Buscar el plato por código
					var platoEncontrado = null;
					if (Array.isArray(data)) {
						platoEncontrado = data.find(function(p) {
							return p.codigo === $scope.view_codplato || p.codigo === $scope.view_codplato.toString();
						});
					}
					
					if (platoEncontrado && platoEncontrado.descripcion) {
						$scope.view_plato_descripcion = platoEncontrado.descripcion;
					} else {
						$scope.view_plato_descripcion = '';
					}
				})
				.error(function (data, status) {
					console.error('Error al obtener descripción del plato:', data, status);
					$scope.view_plato_descripcion = '';
				});
		}
	}

	$scope.confirmarEntrega = function () {

		var jsonForm = {
			id: $scope.view_id,
			user_id: $scope.view_userid,
			user_name : $scope.view_user_name,
			user_lastName : $scope.view_user_lastName,
			user_fileNumber : $scope.view_user_legajo,
			npedido: $scope.view_npedido,
			cod_plato: $scope.view_codplato,
			monto: $scope.view_monto,
			estado: 'E',
			calificacion: $scope.view_calificacion,
			planta: $scope.view_planta,
			proyecto: $scope.view_proyecto,
			centrodecosto: $scope.view_centrodecosto,
			bonificado: $scope.view_bonificado,
			fecha_hora: $scope.view_fechahora,
			comentario: $scope.view_comentario
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
				// Cerrar el modal
				$('#pedidoModal').modal('hide');
				
			Swal.fire({
				title: 'Pedido entregado',
				text: '',
				icon: 'success',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
				$scope.ModelReadAll();
			}
		}, function (error) {
			Swal.fire({
				title: 'Operación Incorrecta',
				text: error,
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
		});
	}

	$scope.ModelReadAll();

	$scope.data = [];
	for (var i = 0; i < 45; i++) {
		$scope.data.push("Item " + i);
	}

	$scope.currentPage = 0;
	$scope.pageSize = 20;
	$scope.searchText = '';

	$scope.numberOfPages = function () {
		return Math.ceil($scope.dataset.length / $scope.pageSize);
	}

	// Función de búsqueda personalizada que incluye estados formateados
	$scope.customSearch = function(item) {
		if (!$scope.searchText || $scope.searchText === '') {
			return true;
		}
		
		var searchTerm = $scope.searchText.toLowerCase();
		var matches = false;
		
		// ID
		if (item.id && item.id.toString().toLowerCase().indexOf(searchTerm) !== -1) {
			matches = true;
		}
		
		// User ID
		if (item.user_id && item.user_id.toString().toLowerCase().indexOf(searchTerm) !== -1) {
			matches = true;
		}
		
		// Nombre y apellido
		if (item.user_name && item.user_name.toLowerCase().indexOf(searchTerm) !== -1) {
			matches = true;
		}
		if (item.user_lastName && item.user_lastName.toLowerCase().indexOf(searchTerm) !== -1) {
			matches = true;
		}
		// Búsqueda combinada de nombre completo
		if (item.user_name && item.user_lastName) {
			var fullName = (item.user_name + ' ' + item.user_lastName).toLowerCase();
			if (fullName.indexOf(searchTerm) !== -1) {
				matches = true;
			}
		}
		
		// Código de plato
		if (item.cod_plato && item.cod_plato.toLowerCase().indexOf(searchTerm) !== -1) {
			matches = true;
		}
		
		// Descripción del plato
		if (item.plato_descripcion && item.plato_descripcion.toLowerCase().indexOf(searchTerm) !== -1) {
			matches = true;
		}
		
		// Turno
		if (item.turno_descripcion && item.turno_descripcion.toLowerCase().indexOf(searchTerm) !== -1) {
			matches = true;
		}
		
		// Monto
		if (item.monto && item.monto.toString().toLowerCase().indexOf(searchTerm) !== -1) {
			matches = true;
		}
		
		// Fecha formateada
		if (item.createdate) {
			var formattedDate = $scope.formatDate(item.createdate);
			if (formattedDate && formattedDate.toLowerCase().indexOf(searchTerm) !== -1) {
				matches = true;
			}
		}
		
		// Estado formateado
		if (item.estado) {
			var formattedEstado = $scope.formatEstados(item.estado);
			if (formattedEstado && formattedEstado.toLowerCase().indexOf(searchTerm) !== -1) {
				matches = true;
			}
		}
		
		return matches;
	};

	// Función auxiliar para formatear fecha
	$scope.formatDate = function(dateString) {
		if (!dateString) return '';
		var date = new Date(dateString);
		var day = date.getDate().toString().padStart(2, '0');
		var month = (date.getMonth() + 1).toString().padStart(2, '0');
		var year = date.getFullYear();
		var hours = date.getHours().toString().padStart(2, '0');
		var minutes = date.getMinutes().toString().padStart(2, '0');
		var seconds = date.getSeconds().toString().padStart(2, '0');
		return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
	};

	// Función auxiliar para formatear estados
	$scope.formatEstados = function(estado) {
		switch (estado) {
			case 'C': return 'Cancelado';
			case 'P': return 'Pendiente';
			case 'R': return 'Recibido';
			case 'E': return 'Entregado';
			case 'D': return 'Devuelto';
			default: return estado;
		}
	};
});