// VERSION 3.1 - SweetAlert2 v11 unificado - FORZAR RECARGA
console.log('=== USUARIO.JS V3.1 CARGANDO ===');
var app = angular.module('AngujarJS', []);
console.log('=== MODULO ANGUJARJS V3.1 CREADO ===');

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

	// Función helper para mostrar popup
	$scope.showPopup = function(title, text, icon) {
		if (typeof Swal !== 'undefined' && Swal.fire) {
			Swal.fire({ 
				title: title, 
				text: text, 
				icon: icon,
				confirmButtonText: 'Entendido'
			}); 
		} else {
			alert(title + '\n' + text);
		}
	};

	// Función helper para mostrar alertas de éxito
	$scope.showSuccess = function(title, text) {
		Swal.fire({
			title: title,
			text: text || '',
			icon: 'success',
			confirmButtonText: 'Entendido'
		});
	};

	// Función helper para mostrar alertas de error
	$scope.showError = function(title, text) {
		Swal.fire({
			title: title,
			text: text || '',
			icon: 'error',
			confirmButtonText: 'Entendido'
		});
	};

	$scope.ModelCreate = function (form) {
		console.log('ModelCreate ejecutándose - isValid:', form && form.$valid);
		if (form && !form.$valid) {
			var requiredErrors = (form.$error && form.$error.required) ? form.$error.required : [];
			var missing = [];
			requiredErrors.forEach(function(ctrl){
				if (ctrl && ctrl.$name) {
					var map = { view_user:'Usuario', view_pass:'Contraseña', view_nombre:'Nombre', view_apellido:'Apellido', view_legajo:'Legajo', view_perfil:'Perfil', view_cuil:'CUIL', view_plannutricional:'Plan nutricional', view_planta:'Planta', view_dni:'DNI', view_domicilio:'Domicilio', view_fechaingreso:'Fecha de ingreso', view_contrato:'Contrato', view_proyecto:'Proyecto', view_centrodecosto:'Centro de costo', view_bonificacion:'Bonificación', view_bonificacion_invitado:'Bonificación invitado' };
					missing.push(map[ctrl.$name] || ctrl.$name);
				}
			});
			console.warn('Completar campos requeridos:', missing);
			$scope.showPopup('Completar campos requeridos', 'Completar: ' + missing.join(', '), 'warning');
			return;
		}

		// Normalización de datos
		var toNumber = function(v){ var n = parseInt((v||'').toString().trim(), 10); return isNaN(n) ? 0 : n; };
		var toStringT = function(v){ return (v==null? '' : (''+v)).trim(); };
		var toDateYMD = function(v){
			if (!v) return '';
			try {
				var d = v;
				if (typeof v === 'string') d = new Date(v);
				var yyyy = d.getFullYear();
				var mm = ('0'+(d.getMonth()+1)).slice(-2);
				var dd = ('0'+d.getDate()).slice(-2);
				return yyyy+'-'+mm+'-'+dd;
			} catch(e) { return ''; }
		};

		// Helpers para obtener valores del DOM (preferir elemento visible)
		var getVisibleElById = function(id){
			var nodes = $window.document.querySelectorAll('[id="'+id+'"]');
			if (!nodes || nodes.length === 0) return null;
			for (var i=0;i<nodes.length;i++) { if (nodes[i].offsetParent !== null) return nodes[i]; }
			return nodes[0];
		};
		var getVal = function(id){ var el = getVisibleElById(id); return el ? (el.value || '').toString().trim() : ''; };

		// Bonificaciones no negativas
		var bonificacion = parseFloat($scope.view_bonificacion) || 0;
		var bonificacionInvitado = parseFloat($scope.view_bonificacion_invitado) || 0;
		if (bonificacion < 0 || bonificacionInvitado < 0) {
			$scope.showPopup('¡Valores Inválidos!', 'Las bonificaciones no pueden ser números negativos.', 'error');
			return;
		}

		// Validación específica: fecha de ingreso obligatoria
		if (!toStringT($scope.view_fechaingreso)) {
			$scope.view_fechaingreso = getVal('view_fechaingreso');
		}
		if (!toStringT($scope.view_fechaingreso)) {
			$scope.showPopup('Campo requerido', 'Fecha de ingreso es obligatoria', 'warning');
			return;
		}

		// Rellenar modelos vacíos desde el DOM visible (fallback)
		var ensure = function(modelKey, inputId){ if (!toStringT($scope[modelKey])) { $scope[modelKey] = getVal(inputId); } };
		ensure('view_user','view_user');
		ensure('view_pass','view_pass');
		ensure('view_nombre','view_nombre');
		ensure('view_apellido','view_apellido');
		ensure('view_legajo','view_legajo');
		ensure('view_perfil','view_perfil');
		ensure('view_cuil','view_cuil');
		ensure('view_plannutricional','view_plannutricional');
		ensure('view_planta','view_planta');
		ensure('view_dni','view_dni');
		ensure('view_domicilio','view_domicilio');
		ensure('view_fechaingreso','view_fechaingreso');
		ensure('view_contrato','view_contrato');
		ensure('view_proyecto','view_proyecto');
		ensure('view_centrodecosto','view_centrodecosto');
		ensure('view_bonificacion','view_bonificacion');
		ensure('view_bonificacion_invitado','view_bonificacion_invitado');

		// Log final de valores capturados (post-fallback)
		console.table({
			user:$scope.view_user, pass:$scope.view_pass, nombre:$scope.view_nombre, apellido:$scope.view_apellido,
			legajo:$scope.view_legajo, perfil:$scope.view_perfil, cuil:$scope.view_cuil, plannutricional:$scope.view_plannutricional,
			planta:$scope.view_planta, dni:$scope.view_dni, domicilio:$scope.view_domicilio, fechaingreso:$scope.view_fechaingreso,
			contrato:$scope.view_contrato, proyecto:$scope.view_proyecto, centrodecosto:$scope.view_centrodecosto,
			bonificacion:$scope.view_bonificacion, bonificacion_invitado:$scope.view_bonificacion_invitado
		});

			var jsonForm = {
			user: toStringT($scope.view_user),
			pass: toStringT($scope.view_pass),
			nombre: toStringT($scope.view_nombre),
			apellido: toStringT($scope.view_apellido),
			legajo: toStringT($scope.view_legajo),
			perfil: toStringT($scope.view_perfil),
			cuil: toStringT($scope.view_cuil),
			plannutricional: toStringT($scope.view_plannutricional),
			planta: toStringT($scope.view_planta),
			dni: toStringT($scope.view_dni),
			domicilio: toStringT($scope.view_domicilio),
			fechaingreso: toDateYMD($scope.view_fechaingreso),
			contrato: toStringT($scope.view_contrato),
			proyecto: toStringT($scope.view_proyecto),
			centrodecosto: toStringT($scope.view_centrodecosto),
			bonificacion: bonificacion,
			bonificacion_invitado: bonificacionInvitado,
				foto: $scope.view_previewImage
			};
		console.log('Payload Create:', jsonForm);

			$http({
				method: 'post',
			headers: { "Content-Type": "application/json; charset=utf-8", "Authorization": "" },
				url: $scope.base + 'Create',
				data: jsonForm
			}).then(function (success) {
				if (success) {
				$scope.showSuccess('Operación Correcta', '');
					$scope.ModelReadAll();
				}
			}, function (error) {
			var msg = (error && error.data) ? (typeof error.data === 'string' ? error.data : (error.data.Message || JSON.stringify(error.data))) : (error.statusText || 'Error desconocido');
			console.error('Create 400/500:', error);
			$scope.showError('Operación Incorrecta', msg);
		});
	};

	$scope.ModelRead = function (view_id) {
		console.log('=== MODELREAD EJECUTADO ===');
		console.log('ID del usuario:', view_id);
		console.log('URL:', $scope.base + 'get/' + view_id);
		$http.get($scope.base + 'get/' + view_id)
			.success(function (data) {
				console.log('Datos recibidos del servidor:', data);

				// Validar que data existe (puede ser objeto o array)
				if (!data) {
					console.error('Error: No se recibieron datos del servidor');
					$scope.showError('Error', 'No se pudieron cargar los datos del usuario');
					return;
				}

				// Si es array, tomar el primer elemento; si es objeto, usarlo directamente
				var userData = Array.isArray(data) ? data[0] : data;
				
				if (!userData) {
					console.error('Error: Datos de usuario no válidos');
					$scope.showError('Error', 'No se pudieron cargar los datos del usuario');
					return;
				}

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

				// Validar que fechaingreso existe antes de procesarlo
				if (userData.fechaingreso) {
					aux = userData.fechaingreso.split('-');
					fecha = new Date(aux[0], aux[1] - 1, aux[2]);
				} else {
					console.warn('fechaingreso no encontrada en los datos');
					fecha = new Date();
				}

				// Mapear los campos del servidor a los campos del formulario
				$scope.view_user = userData.username || userData.user || '';
				$scope.view_pass = userData.password || userData.pass || '';
				$scope.view_nombre = userData.nombre || '';
				$scope.view_apellido = userData.apellido || '';
				$scope.view_legajo = userData.Legajo || userData.legajo || '';
				$scope.view_perfil = userData.perfil || '';
				$scope.view_cuil = userData.cuil || '';
				$scope.view_plannutricional = userData.plannutricional || '';
				$scope.view_planta = userData.planta || '';
				$scope.view_dni = userData.dni || '';
				$scope.view_domicilio = userData.domicilio || '';
				$scope.view_fechaingreso = fecha;
				$scope.view_contrato = userData.contrato || '';
				$scope.view_proyecto = userData.proyecto || '';
				$scope.view_centrodecosto = userData.centrodecosto || '';
				$scope.view_bonificacion = userData.bonificaciones || 0;
				$scope.view_previewImage = userData.foto || '';
				$scope.view_bonificacion_invitado = userData.bonificaciones_invitado || 0;
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Api no presente');
			});
	};

	$scope.ModelReadAll = function () {
		$scope.dataset = [];
		$scope.searchKeyword;
		$scope.searchText = '';
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
		$scope.view_bonificacion = 0;
		$scope.view_bonificacion_invitado = 0;
		$scope.view_previewImage = '';

		$http.get($scope.base + 'getAll')
			.success(function (data) {
				$scope.dataset = data;
				$scope.searchText = '';
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Api no presente');
			});
	};

	$scope.ModelUpdate = function (isValid, view_id) {
		console.log('ModelUpdate ejecutándose - isValid:', isValid);
		if (!isValid) { 
			console.log('Formulario no válido, mostrando popup');
			console.log('SweetAlert2 disponible:', typeof Swal !== 'undefined');
			
			// Verificar si SweetAlert2 está disponible
			if (typeof Swal !== 'undefined' && Swal.fire) {
				Swal.fire({ 
					title: '¡Campos Obligatorios!', 
					text: 'Debes completar los campos obligatorios: Usuario, Contraseña, Nombre, Legajo y DNI.', 
					icon: 'warning',
					confirmButtonText: 'Entendido'
				}); 
			} else {
				alert('¡Campos Obligatorios!\nDebes completar los campos obligatorios: Usuario, Contraseña, Nombre, Legajo y DNI.');
			}
			return; 
		}
		
		// Validar que las bonificaciones no sean negativas
		var bonificacion = parseFloat($scope.view_bonificacion) || 0;
		var bonificacionInvitado = parseFloat($scope.view_bonificacion_invitado) || 0;
		
		if (bonificacion < 0 || bonificacionInvitado < 0) {
			$scope.showPopup('¡Valores Inválidos!', 'Las bonificaciones no pueden ser números negativos.', 'error');
			return;
		}
		
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
					$scope.showSuccess('Operación Correcta', '');
					$scope.ModelReadAll();
				}
			}, function (error) {
				$scope.showError('Operación Incorrecta', error);
			});
		} else {
			alert('Atributo Invalido en los datos');
		}

	};

	$scope.ModelDelete = function (view_id) {
		console.log('=== MODELDELETE EJECUTADO ===');
		console.log('ID a eliminar:', view_id);
		console.log('URL:', $scope.base + 'Delete');
		
		var jsonForm = { id: view_id };
		console.log('Datos a enviar:', jsonForm);

		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Delete',
			data: jsonForm
		}).then(function (response) {
			console.log('Respuesta completa del servidor:', response);
			console.log('Status:', response.status);
			console.log('Data:', response.data);
			
			// Verificar si la respuesta indica éxito
			if (response.status === 200 && response.data) {
				console.log('Eliminación exitosa');
				Swal.fire({
					title: 'Operación Correcta',
					text: 'Usuario eliminado exitosamente',
					icon: 'success',
					confirmButtonText: 'Entendido'
				});
				$scope.ModelReadAll();
			} else {
				console.log('Respuesta inesperada del servidor');
				Swal.fire({
					title: 'Error',
					text: 'Respuesta inesperada del servidor: ' + JSON.stringify(response.data),
					icon: 'warning',
					confirmButtonText: 'Entendido'
				});
			}
		}, function (error) {
			console.log('Error en eliminación:', error);
			console.log('Status:', error.status);
			console.log('Data:', error.data);
			Swal.fire({
				title: 'Operación Incorrecta',
				text: 'Error al eliminar el usuario: ' + (error.data || error.statusText || 'Error desconocido'),
				icon: 'error',
				confirmButtonText: 'Entendido'
			});
		});
	}

	$scope.ModelReadPlanes = function () {
		$http.get($scope.basePlan + 'getAll')
			.success(function (data) {
				$scope.planes = data;
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Error al obtener planes');
			});
	};

	$scope.ModelReadPlantas = function () {
		$http.get($scope.basePlantas + 'getAll')
			.success(function (data) {
				$scope.plantas = data;
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Error al obtener plantas');
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
		$scope.view_bonificacion = 0;
		$scope.view_previewImage = '';
		$scope.view_bonificacion_invitado = 0;

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
				$scope.showError('Ha ocurrido un error', 'Error al obtener proyectos');
			});
	};

	$scope.ModelReadCentros = function () {
		$http.get($scope.baseCentrodecostos + 'getAll')
			.success(function (data) {
				$scope.centros = data;
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Error al obtener plantas');
			});
	};

	$scope.ViewUpdate = function (view_id) {
		console.log('=== EDITAR USUARIO ===');
		console.log('ID del usuario:', view_id);
		$scope.ViewAction = 'Editar Usuario';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
		$scope.ModelReadPlanes();
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
		$scope.ModelReadProyectos();
	};

	$scope.ViewDelete = function (view_id) {
		// defensa por si otra lib ensucia Swal
		const hasSwal = typeof window !== 'undefined' && window.Swal && typeof window.Swal.fire === 'function';
	  
		if (hasSwal) {
		  window.Swal.fire({
			title: 'Eliminar registro',
			text: 'Desea eliminar al usuario?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Sí, eliminar',
			cancelButtonText: 'Cancelar'
		  }).then(function (result) {
			if (result.isConfirmed) $scope.ModelDelete(view_id);
		  });
		} else {
		  // Fallback nativo si SweetAlert2 no está sano
		  if (window.confirm('Desea eliminar al usuario?')) {
					$scope.ModelDelete(view_id);
				}
		}
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