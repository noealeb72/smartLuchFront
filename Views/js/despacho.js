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
		input = hora[0] + ' ' + fecha[2] + '/' + fecha[1] + '/' + fecha[0];
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
	$scope.titulo = 'Despacho de platos';  // Título inicial
	$scope.base = 'http://localhost:8000/api/comanda/';
	$scope.pedidos = '';
	$scope.baseUser = 'http://localhost:8000/api/usuario/';
	$scope.Pic = '';
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
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Api no presente',
					'error'
				);
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
				swal(
					'Ha ocurrido un error',
					'Api no presente',
					'error'
				);
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
		$scope.view_comentario = item.comentario

		$http.get($scope.baseUser + 'getPic/' + $scope.view_userid)
			.success(function (data) {
				$scope.Pic = data[0];
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener foto',
					'error'
				);
			})
		.catch (function(response) {
			console.log("ERROR:", response);
		});
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
				swal(
					'Pedido entregado',
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

	$scope.ModelReadAll();

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