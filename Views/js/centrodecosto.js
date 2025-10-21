console.log('centrodecosto.js loaded');

// Verificar si el módulo ya existe
var app;
try {
    app = angular.module('AngujarJS');
    console.log('Módulo AngujarJS ya existe');
} catch (e) {
    app = angular.module('AngujarJS', []);
    console.log('Creando nuevo módulo AngujarJS');
}

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


app.controller('CentroDeCosto', function ($scope, $sce, $http, $window) {
	console.log('CentroDeCosto controller initialized');
	$scope.titulo = 'Centro de costo';  // Título inicial
	$scope.base = 'http://localhost:8002/api/centrodecosto/';
	$scope.basePlanta = 'http://localhost:8002/api/planta/';
	
	$scope.searchText = ''; // Modelo de búsqueda vacío al inicio
	
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

	// Funciones helper para SweetAlert2
	$scope.showPopup = function (title, text, icon) {
		if (typeof Swal !== 'undefined' && Swal.fire) {
			Swal.fire({
				title: title,
				text: text,
				icon: icon,
				confirmButtonText: 'Aceptar'
			});
		} else {
			alert(title + ': ' + text);
		}
	};

	$scope.showSuccess = function (title, text) {
		$scope.showPopup(title, text, 'success');
	};

	$scope.showError = function (title, text) {
		$scope.showPopup(title, text, 'error');
	};



	$scope.ModelCreate = function (form) {
		// Validar si el formulario es válido
		if (!form.$valid) {
			alert('Campos requeridos: Por favor complete todos los campos obligatorios');
			return;
		}
		
		// Leer valores del modelo
		var nombre = $scope.view_nombre;
		var descripcion = $scope.view_descripcion;
		var planta = $scope.view_planta;

		// Validación de campos vacíos
		if (!nombre || nombre.trim() === '') {
			alert('El campo Nombre es obligatorio');
			return;
		}

		if (!descripcion || descripcion.trim() === '') {
			alert('El campo Descripción es obligatorio');
			return;
		}

		if (!planta || planta.trim() === '') {
			alert('El campo Planta es obligatorio');
			return;
		}
		
		var jsonForm = { nombre: nombre, descripcion: descripcion, planta: planta };
		
		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Create',
			data: jsonForm
		}).then(function (success) {
			alert('Centro de costo creado correctamente');
			// Limpiar el formulario
			$scope.view_nombre = '';
			$scope.view_descripcion = '';
			$scope.view_planta = '';
			// Volver al listado
			$scope.ViewAction = 'Lista de Items';
			// Actualizar la lista
			$scope.ModelReadAll();
		}, function (error) {
			alert('Error: ' + (error.data || error.statusText || 'Error desconocido'));
		});
	};
	

	$scope.ModelRead = function (view_id) {
		$http.get($scope.base + 'get/' + view_id)
			.then(function (response) {
				$scope.ModelReadPlantas();
				$scope.view_nombre = response.data[0].nombre;
				$scope.view_descripcion = response.data[0].descripcion;
				$scope.view_planta = response.data[0].planta;
			}, function (error) {
				alert('Error: No se pudo cargar el centro de costo');
			});
	};

	$scope.ModelReadAll = function () {
		$scope.dataset = [];
		$scope.searchKeyword;
		$scope.ViewAction = 'Lista de Items';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_planta = '';

		$http.get($scope.base + 'getAll')
			.then(function (response) {
				$scope.dataset = response.data;
			}, function (error) {
				alert('Error: No se pudo cargar la lista de centros de costo');
			});
	};

	$scope.ModelUpdate = function (form, view_id) {
		// Validar si el formulario es válido
		if (!form.$valid) {
			alert('Campos requeridos: Por favor complete todos los campos obligatorios');
			return;
		}
		
		// Leer valores del modelo
		var nombre = $scope.view_nombre;
		var descripcion = $scope.view_descripcion;
		var planta = $scope.view_planta;

		// Validación de campos vacíos
		if (!nombre || nombre.trim() === '') {
			alert('El campo Nombre es obligatorio');
			return;
		}

		if (!descripcion || descripcion.trim() === '') {
			alert('El campo Descripción es obligatorio');
			return;
		}

		if (!planta || planta.trim() === '') {
			alert('El campo Planta es obligatorio');
			return;
		}
		
		var jsonForm = { id: view_id, nombre: nombre, descripcion: descripcion, planta: planta };
		
		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Update',
			data: jsonForm
		}).then(function (success) {
			alert('Centro de costo actualizado correctamente');
			// Limpiar el formulario
			$scope.view_nombre = '';
			$scope.view_descripcion = '';
			$scope.view_planta = '';
			// Volver al listado
			$scope.ViewAction = 'Lista de Items';
			// Actualizar la lista
			$scope.ModelReadAll();
		}, function (error) {
			alert('Error: ' + (error.data || error.statusText || 'Error desconocido'));
		});
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
			alert('Centro de costo eliminado correctamente');
			$scope.ModelReadAll();
		}, function (error) {
			alert('Error: No se pudo eliminar el centro de costo');
		});
	}

	$scope.ModelReadPlantas = function () {
		$http.get($scope.basePlanta + 'getAll')
			.then(function (response) {
				$scope.plantas = response.data;
			}, function (error) {
				alert('Error: No se pudo cargar la lista de plantas');
			});
	};

	$scope.ViewCreate = function () {
		$scope.ViewAction = 'Nuevo';
		$scope.view_id = -1;
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_planta = '';
		$scope.ModelReadPlantas();
	};

	$scope.ViewUpdate = function (view_id) {
		$scope.ViewAction = 'Editar';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
	};

	$scope.ViewDelete = function (view_id) {
		if (confirm('¿Desea eliminar el Centro de costo?')) {
			$scope.ModelDelete(view_id);
		}
	};

	$scope.ViewCancel = function () {
		$scope.ViewAction = 'Lista de Items';
		$scope.view_nombre = '';
		$scope.view_descripcion = '';
		$scope.view_planta = '';
	};


	// Función de prueba para verificar conectividad
	$scope.testConnection = function() {
		$http.get($scope.base + 'getAll')
			.then(function(response) {
				alert('Server connection successful! Data received: ' + JSON.stringify(response.data));
			}, function(error) {
				alert('Server connection failed: ' + error.status + ' - ' + error.statusText);
			});
	};
	
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