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

app.controller('Usuario', function ($scope, $sce, $http, $window) {

	$scope.base = 'http://localhost:8000/api/usuario/';
	$scope.basePlan = 'http://localhost:8000/api/plannutricional/';
	$scope.planes = '';
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
	$scope.user_Bonificacion_Invitado = localStorage.getItem('bonificacion_invitado');
	$scope.user_DNI = localStorage.getItem('dni');

	$scope.basePlantas = 'http://localhost:8000/api/planta/';
	$scope.plantas = '';
	$scope.baseCentrodecostos = 'http://localhost:8000/api/centrodecosto/';
	$scope.centros = '';
	$scope.baseProyectos = 'http://localhost:8000/api/proyecto/';
	$scope.proyectos = '';

	$scope.ModelCreate = function (isValid) {
		if (isValid) {
			// debería ser automatico 
			//$scope.view_user = $window.document.getElementById('view_user').value;
			//$scope.view_pass = $window.document.getElementById('view_pass').value;
			//$scope.view_nombre = $window.document.getElementById('view_nombre').value;
			//$scope.view_apellido = $window.document.getElementById('view_apellido').value;
			//$scope.view_legajo = $window.document.getElementById('view_legajo').value;
			//$scope.view_perfil = $window.document.getElementById('view_perfil').value;
			//$scope.view_cuil = $window.document.getElementById('view_cuil').value;
			//$scope.view_plannutricional = $window.document.getElementById('view_plannutricional').value;
			//$scope.view_planta = $window.document.getElementById('view_planta').value;
			//$scope.view_dni = $window.document.getElementById('view_dni').value;
			//$scope.view_domicilio = $window.document.getElementById('view_domicilio').value;
			//$scope.view_fechaingreso = $window.document.getElementById('view_fechaingreso').value;
			//$scope.view_contrato = $window.document.getElementById('view_contrato').value;
			//$scope.view_centrodecosto = $window.document.getElementById('view_centrodecosto').value;
			//$scope.view_proyecto = $window.document.getElementById('view_proyecto').value;
			//$scope.view_bonificacion = $window.document.getElementById('view_bonificacion').value;
			//$scope.view_bonificacion_invitado = $window.document.getElementById('view_bonificacion_invitado').value;
			//

			var jsonForm = {
				user: $scope.view_user,
				pass: $scope.view_pass,
				nombre: $scope.view_nombre,
				apellido: $scope.view_apellido,
				legajo: $scope.view_legajo,
				perfil: $scope.view_perfil,
				cuil: $scope.view_cuil,
				plannutricional: $scope.view_plannutricional,
				planta: $scope.view_planta,
				dni: $scope.view_dni,
				domicilio: $scope.view_domicilio,
				fechaingreso: $scope.view_fechaingreso,
				contrato: $scope.view_contrato,
				proyecto: $scope.view_proyecto,
				centrodecosto: $scope.view_centrodecosto,
				bonificacion: $scope.view_bonificacion,
				bonificacion_invitado: $scope.view_bonificacion_invitado,
				foto: $scope.view_previewImage
			};
			console.log(jsonForm); // ✅ VERIFICAR

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
			alert('Atributo Invalido en los datos');
		}
	};

	$scope.ModelRead = function (view_id) {
		$http.get($scope.base + 'get/' + view_id)
			.success(function (data) {

				$scope.view_user = '';
				$scope.view_pass = '';
				$scope.view_nombre = '';
				$scope.view_apellido = '';
				$scope.view_legajo = '';
				$scope.view_perfil = '';
				$scope.view_cuil = '';
				$scope.view_plannutricional = '';
				$scope.view_planta = '';
				$scope.view_dni = '';
				$scope.view_domicilio = '';
				$scope.view_fechaingreso = '';
				$scope.view_contrato = '';
				$scope.view_proyecto = '';
				$scope.view_centrodecosto = '';
				$scope.view_bonificacion = '';
				$scope.view_previewImage = '';
				$scope.view_bonificacion_invitado = '';

				aux = data[0].fechaingreso.split('-');
				fecha = new Date(aux[0], aux[1] - 1, aux[2]);


				$scope.view_user = data[0].username;
				$scope.view_pass = data[0].password;
				$scope.view_nombre = data[0].nombre;
				$scope.view_apellido = data[0].apellido;
				$scope.view_legajo = data[0].legajo;
				$scope.view_perfil = data[0].perfil;
				$scope.view_cuil = data[0].cuil;
				$scope.view_plannutricional = data[0].plannutricional;
				$scope.view_planta = data[0].planta;
				$scope.view_dni = data[0].dni;
				$scope.view_domicilio = data[0].domicilio;
				$scope.view_fechaingreso = fecha;
				$scope.view_contrato = data[0].contrato;
				$scope.view_proyecto = data[0].proyecto;
				$scope.view_centrodecosto = data[0].centrodecosto;
				$scope.view_bonificacion = data[0].bonificaciones;
				$scope.view_previewImage = data[0].foto;
				$scope.view_bonificacion_invitado = data[0].bonificaciones_invitado;
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
		$scope.view_user = '';
		$scope.view_pass = '';
		$scope.view_nombre = '';
		$scope.view_apellido = '';
		$scope.view_legajo = '';
		$scope.view_perfil = '';
		$scope.view_cuil = '';
		$scope.view_plannutricional = '';
		$scope.view_planta = '';
		$scope.view_dni = '';
		$scope.view_domicilio = '';
		$scope.view_fechaingreso = '';
		$scope.view_contrato = '';
		$scope.view_proyecto = '';
		$scope.view_centrodecosto = '';
		$scope.view_bonificacion = '';
		$scope.view_bonificacion_invitado = '';
		$scope.view_previewImage = '';

		$http.get($scope.base + 'getAll')
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

			$scope.view_user = $window.document.getElementById('view_user').value;
			$scope.view_pass = $window.document.getElementById('view_pass').value;
			$scope.view_nombre = $window.document.getElementById('view_nombre').value;
			$scope.view_apellido = $window.document.getElementById('view_apellido').value;
			$scope.view_legajo = $window.document.getElementById('view_legajo').value;
			$scope.view_perfil = $window.document.getElementById('view_perfil').value;
			$scope.view_cuil = $window.document.getElementById('view_cuil').value;
			$scope.view_plannutricional = $window.document.getElementById('view_plannutricional').value;
			$scope.view_planta = $window.document.getElementById('view_planta').value;
			$scope.view_dni = $window.document.getElementById('view_dni').value;
			$scope.view_domicilio = $window.document.getElementById('view_domicilio').value;
			$scope.view_fechaingreso = $window.document.getElementById('view_fechaingreso').value;
			$scope.view_contrato = $window.document.getElementById('view_contrato').value;
			$scope.view_centrodecosto = $window.document.getElementById('view_centrodecosto').value;
			$scope.view_proyecto = $window.document.getElementById('view_proyecto').value;
			$scope.view_bonificacion = $window.document.getElementById('view_bonificacion').value;
			$scope.view_bonificacion_invitado = $window.document.getElementById('view_bonificacion_invitado').value;
			//

			var jsonForm = {
				id: view_id, user: $scope.view_user, pass: $scope.view_pass, bonificacion: $scope.view_bonificacion,
				nombre: $scope.view_nombre, apellido: $scope.view_apellido, legajo: $scope.view_legajo, perfil: $scope.view_perfil,
				cuil: $scope.view_cuil, plannutricional: $scope.view_plannutricional, planta: $scope.view_planta, dni: $scope.view_dni,
				domicilio: $scope.view_domicilio, fechaingreso: $scope.view_fechaingreso,
				contrato: $scope.view_contrato, proyecto: $scope.view_proyecto, centrodecosto: $scope.view_centrodecosto
				, foto: $scope.view_previewImage, bonificacion_invitado: $scope.view_bonificacion_invitado
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
			alert('Atributo Invalido en los datos');
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

	$scope.ModelReadPlanes = function () {
		$http.get($scope.basePlan + 'getAll')
			.success(function (data) {
				$scope.planes = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener planes',
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

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nuevo Usuario';
		$scope.view_id = -1;
		$scope.view_user = '';
		$scope.view_pass = '';
		$scope.view_nombre = '';
		$scope.view_apellido = '';
		$scope.view_legajo = '';
		$scope.view_perfil = '';
		$scope.view_cuil = '';
		$scope.view_plannutricional = '';
		$scope.view_planta = '';
		$scope.view_dni = '';
		$scope.view_domicilio = '';
		$scope.view_fechaingreso = '';
		$scope.view_contrato = '';
		$scope.view_centrodecosto = '';
		$scope.view_proyecto = '';
		$scope.view_centrodecosto = '';
		$scope.view_bonificacion = '';
		$scope.view_previewImage = '';
		$scope.view_bonificacion_invitado = '';

		$scope.ModelReadPlanes();
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
		$scope.ModelReadProyectos();
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

	$scope.ModelReadCentros = function () {
		$http.get($scope.baseCentrodecostos + 'getAll')
			.success(function (data) {
				$scope.centros = data;
			})
			.error(function (data, status) {
				swal(
					'Ha ocurrido un error',
					'Error al obtener plantas',
					'error'
				);
			});
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar Usuario';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
		$scope.ModelReadPlanes();
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
		$scope.ModelReadProyectos();
	};

	$scope.ViewDelete = function (view_id) {
		swal({
			title: 'Eliminar registro',
			text: 'Desea eliminar al usuario?',
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

	$scope.ViewCancel = function () {
		$scope.ViewAction = 'Lista de Items';
	};

	$scope.loadImage = function () {
		$scope.view_file = $window.document.getElementById('view_file');
		var file = $scope.view_file.files[0];
		var reader = new FileReader();
		reader.onloadend = function () {
			$scope.view_previewImage = reader.result;
			$scope.$apply();
		}
		reader.readAsDataURL(file);
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