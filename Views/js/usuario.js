// VERSION 3.1 - SweetAlert2 v11 unificado - FORZAR RECARGA
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
	// Siempre usar puerto 8000, detectando el hostname automáticamente
	function getApiBaseUrl() {
		var protocol = window.location.protocol;
		var hostname = window.location.hostname;
		// Siempre usar puerto 8000
		return protocol + '//' + hostname + ':8000';
	}
	
	var apiBaseUrl = getApiBaseUrl();
	$scope.base = apiBaseUrl + '/api/usuario/';
	$scope.basePlan = apiBaseUrl + '/api/plannutricional/';
	$scope.planes = '';
	
	// -------- Loading State ----------
	$scope.isLoading = true;
	
	// Inicializar paginación al inicio
	$scope.currentPage = 0;
	$scope.pageSize = 5; // Inicializar como número directamente
	
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

	$scope.basePlantas = apiBaseUrl + '/api/planta/';
	$scope.plantas = '';
	$scope.baseCentrodecostos = apiBaseUrl + '/api/centrodecosto/';
	$scope.centros = '';
	$scope.baseProyectos = apiBaseUrl + '/api/proyecto/';
	$scope.proyectos = '';
	$scope.baseJerarquias = apiBaseUrl + '/api/jerarquia/';
	$scope.jerarquias = '';

	// Función helper para mostrar popup
	$scope.showPopup = function(title, text, icon) {
		if (typeof Swal !== 'undefined' && Swal.fire) {
			Swal.fire({ 
				title: title, 
				text: text, 
				icon: icon,
				confirmButtonText: 'Aceptar'
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
			confirmButtonText: 'Aceptar'
		});
	};

	// Función helper para mostrar alertas de error
	$scope.showError = function(title, text) {
		Swal.fire({
			title: title,
			text: text || '',
			icon: 'error',
			confirmButtonText: 'Aceptar'
		});
	};

	$scope.ModelCreate = function (form) {
		/*console.log('=== DEBUGGING ModelCreate ===');
		console.log('form:', form);
		console.log('form.$valid:', form && form.$valid);*/
		
		// Obtener valores directamente del DOM para verificar
		var camposRequeridos = [
			{ id: 'view_nombre', nombre: 'Nombre' },
			{ id: 'view_apellido', nombre: 'Apellido' },
			{ id: 'view_legajo', nombre: 'Legajo' },
			{ id: 'view_cuil', nombre: 'CUIL' },
			{ id: 'view_dni', nombre: 'DNI' },
			{ id: 'view_domicilio', nombre: 'Domicilio' },
			{ id: 'view_fechaingreso', nombre: 'Fecha de ingreso' },
			{ id: 'view_contrato', nombre: 'Contrato' },
			{ id: 'view_perfil', nombre: 'Perfil' },
			{ id: 'view_planta', nombre: 'Planta' },
			{ id: 'view_proyecto', nombre: 'Proyecto' },
			{ id: 'view_centrodecosto', nombre: 'Centro de costo' },
			{ id: 'view_plannutricional', nombre: 'Plan nutricional' }
		];
		
		//console.log('=== VALORES DE LOS CAMPOS ===');
		var camposFaltantes = [];
		
		camposRequeridos.forEach(function(campo) {
			var elemento = document.getElementById(campo.id);
			var valor = elemento ? elemento.value : 'NO ENCONTRADO';
			var estaVacio = !valor || valor.trim() === '';
			
			//console.log(campo.nombre + ':', valor, estaVacio ? '(VACÍO)' : '(OK)');
			
			if (estaVacio) {
				camposFaltantes.push(campo.nombre);
			}
		});
		
		if (camposFaltantes.length > 0) {
			$scope.showPopup('Completar campos requeridos','', 'warning');
			return;
		}
		
		if (form && !form.$valid) {
			//console.log('=== ERRORES DE VALIDACIÓN DE ANGULAR ===');
			//console.log('form.$error:', form.$error);
			
			var requiredErrors = (form.$error && form.$error.required) ? form.$error.required : [];
			var patternErrors = (form.$error && form.$error.pattern) ? form.$error.pattern : [];
			var minlengthErrors = (form.$error && form.$error.minlength) ? form.$error.minlength : [];
			var maxlengthErrors = (form.$error && form.$error.maxlength) ? form.$error.maxlength : [];
			
			var missing = [];
			var errores = [];
			
			// Errores de campos requeridos
			requiredErrors.forEach(function(ctrl){
				if (ctrl && ctrl.$name) {
					var map = { view_user:'Usuario', view_pass:'Contraseña', view_nombre:'Nombre', view_apellido:'Apellido', view_legajo:'Legajo', view_perfil:'Perfil', view_cuil:'CUIL', view_plannutricional:'Plan nutricional', view_planta:'Planta', view_dni:'DNI', view_domicilio:'Domicilio', view_fechaingreso:'Fecha de ingreso', view_contrato:'Contrato', view_proyecto:'Proyecto', view_centrodecosto:'Centro de costo', view_bonificacion:'Bonificación', view_bonificacion_invitado:'Bonificación invitado' };
					missing.push(map[ctrl.$name] || ctrl.$name);
				}
			});
			
			// Errores de patrón
			patternErrors.forEach(function(ctrl){
				if (ctrl && ctrl.$name) {
					errores.push(ctrl.$name + ' tiene caracteres inválidos');
				}
			});
			
			// Errores de longitud mínima
			minlengthErrors.forEach(function(ctrl){
				if (ctrl && ctrl.$name) {
					errores.push(ctrl.$name + ' es muy corto');
				}
			});
			
			// Errores de longitud máxima
			maxlengthErrors.forEach(function(ctrl){
				if (ctrl && ctrl.$name) {
					errores.push(ctrl.$name + ' es muy largo');
				}
			});
			
			
			var mensaje = '';
			if (missing.length > 0) {
				mensaje += 'Faltan: ' + missing.join(', ');
			}
			if (errores.length > 0) {
				mensaje += (mensaje ? '\n' : '') + 'Errores: ' + errores.join(', ');
			}
			
			$scope.showPopup('Completar campos requeridos', mensaje, 'warning');
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

		// Leer valores directamente del DOM (siempre, para obtener los valores actuales)
		// Esto asegura que obtenemos los valores que el usuario ingresó, no los valores antiguos del scope
		$scope.view_user = getVal('view_user');
		$scope.view_pass = getVal('view_pass');
		$scope.view_nombre = getVal('view_nombre');
		$scope.view_apellido = getVal('view_apellido');
		$scope.view_legajo = getVal('view_legajo');
		$scope.view_perfil = getVal('view_perfil');
		$scope.view_cuil = getVal('view_cuil');
		$scope.view_plannutricional = getVal('view_plannutricional');
		$scope.view_planta = getVal('view_planta');
		$scope.view_dni = getVal('view_dni');
		$scope.view_domicilio = getVal('view_domicilio');
		$scope.view_fechaingreso = getVal('view_fechaingreso');
		$scope.view_contrato = getVal('view_contrato');
		$scope.view_proyecto = getVal('view_proyecto');
		$scope.view_centrodecosto = getVal('view_centrodecosto');
		$scope.view_bonificacion = getVal('view_bonificacion');
		$scope.view_bonificacion_invitado = getVal('view_bonificacion_invitado');

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
		//console.log('Payload Create:', jsonForm);

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
			//console.error('Create 400/500:', error);
			$scope.showError('Operación Incorrecta', msg);
		});
	};

	$scope.ModelRead = function (view_id) {
		/*console.log('=== MODELREAD EJECUTADO ===');
		console.log('ID del usuario:', view_id);
		console.log('URL:', $scope.base + 'get/' + view_id);*/
		$http.get($scope.base + 'get/' + view_id)
			.success(function (data) {
				//console.log('Datos recibidos del servidor:', data);

				// Validar que data existe (puede ser objeto o array)
				if (!data) {
					$scope.showError('Error', 'No se pudieron cargar los datos del usuario');
					return;
				}

				// Si es array, tomar el primer elemento; si es objeto, usarlo directamente
				var userData = Array.isArray(data) ? data[0] : data;
				
				if (!userData) {
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
		$scope.isLoading = true;
		$scope.dataset = [];
		$scope.searchKeyword = '';
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
			.then(function (response) {
				console.log('✅ Respuesta de usuarios recibida:', response);
				console.log('   Tipo de datos:', Array.isArray(response.data) ? 'Array' : typeof response.data);
				console.log('   Cantidad de usuarios:', Array.isArray(response.data) ? response.data.length : 'No es array');
				
				$scope.dataset = Array.isArray(response.data) ? response.data : [];
				
				if ($scope.dataset.length > 0) {
					console.log('📋 Primer usuario:', $scope.dataset[0]);
					
					// Ordenar alfabéticamente por apellido y luego por nombre
					$scope.dataset.sort(function(a, b) {
						var apellidoA = (a.apellido || '').toLowerCase().trim();
						var apellidoB = (b.apellido || '').toLowerCase().trim();
						var nombreA = (a.nombre || '').toLowerCase().trim();
						var nombreB = (b.nombre || '').toLowerCase().trim();
						
						// Primero comparar por apellido
						if (apellidoA < apellidoB) return -1;
						if (apellidoA > apellidoB) return 1;
						
						// Si los apellidos son iguales, comparar por nombre
						if (nombreA < nombreB) return -1;
						if (nombreA > nombreB) return 1;
						
						return 0;
					});
					
					console.log('✅ Usuarios ordenados:', $scope.dataset.length);
				} else {
					console.warn('⚠️ No hay usuarios en la respuesta');
				}
				
				$scope.searchText = '';
				$scope.isLoading = false;
			})
			.catch(function (error) {
				console.error('❌ Error al cargar usuarios:', error);
				console.error('   Status:', error.status);
				console.error('   StatusText:', error.statusText);
				console.error('   Data:', error.data);
				console.error('   URL:', $scope.base + 'getAll');
				$scope.isLoading = false;
				
				// Mensaje más específico según el tipo de error
				var mensajeError = 'No se pudieron cargar los usuarios. ';
				if (error.status === -1) {
					mensajeError += 'El servidor backend no está respondiendo. Verifique que el servidor esté corriendo en el puerto 8000.';
				} else if (error.status === 0) {
					mensajeError += 'Error de conexión. Verifique su conexión a internet o que el servidor esté accesible.';
				} else if (error.status === 404) {
					mensajeError += 'El endpoint no fue encontrado. Verifique la configuración del servidor.';
				} else if (error.status >= 500) {
					mensajeError += 'Error del servidor. Contacte al administrador.';
				} else {
					mensajeError += 'Verifique la conexión con el servidor.';
				}
				
				$scope.showError('Error al cargar usuarios', mensajeError);
			});
	};

	$scope.ModelUpdate = function (isValid, view_id) {
		//console.log('ModelUpdate ejecutándose - isValid:', isValid);
		
		// Validación adicional para selects vacíos
		var selectFields = ['view_perfil', 'view_planta', 'view_proyecto', 'view_centrodecosto'];
		var emptySelects = [];
		
		/*selectFields.forEach(function(field) {
			if (!$scope[field] || $scope[field] === '' || $scope[field] === null || $scope[field] === undefined || $scope[field] === '-- Seleccionar --') {
				var fieldNames = {
					'view_perfil': 'Perfil',
					'view_planta': 'Planta', 
					'view_proyecto': 'Proyecto',
					'view_centrodecosto': 'Centro de costo'
				};
				emptySelects.push(fieldNames[field] || field);
			}
		});
		
		if (emptySelects.length > 0) {
			$scope.showPopup('Completar campos requeridos', '', 'warning');
			return;
		}*/
		
		if (!isValid) { 
			//console.log('Formulario no válido, mostrando popup');
			//console.log('SweetAlert2 disponible:', typeof Swal !== 'undefined');
			
			// Verificar si SweetAlert2 está disponible
			if (typeof Swal !== 'undefined' && Swal.fire) {
				Swal.fire({ 
					title: 'Completar campos requeridos', 
					//text: 'Debes completar los campos obligatorios: Usuario, Contraseña, Nombre, Legajo y DNI.', 
					icon: 'warning',
					confirmButtonText: 'Aceptar'
				}); 
			} else {
				alert('¡Campos Obligatorios!');
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
		/*console.log('=== MODELDELETE EJECUTADO ===');
		console.log('ID a eliminar:', view_id);
		console.log('URL:', $scope.base + 'Delete');*/
		
		var jsonForm = { id: view_id };
		//console.log('Datos a enviar:', jsonForm);

		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.base + 'Delete',
			data: jsonForm
		}).then(function (response) {
			/*console.log('Respuesta completa del servidor:', response);
			console.log('Status:', response.status);
			console.log('Data:', response.data);*/
			
			// Verificar si la respuesta indica éxito
			if (response.status === 200 && response.data) {
				//console.log('Eliminación exitosa');
				Swal.fire({
					title: 'Operación Correcta',
					text: 'Usuario eliminado exitosamente',
					icon: 'success',
					confirmButtonText: 'Aceptar'
				});
				$scope.ModelReadAll();
			} else {
				//console.log('Respuesta inesperada del servidor');
				Swal.fire({
					title: 'Error',
					text: 'Respuesta inesperada del servidor: ' + JSON.stringify(response.data),
					icon: 'warning',
					confirmButtonText: 'Aceptar'
				});
			}
		}, function (error) {
			/*console.log('Error en eliminación:', error);
			console.log('Status:', error.status);
			console.log('Data:', error.data);*/
			Swal.fire({
				title: 'Operación Incorrecta',
				text: 'Error al eliminar el usuario: ' + (error.data || error.statusText || 'Error desconocido'),
				icon: 'error',
				confirmButtonText: 'Aceptar'
			});
		});
	}

	$scope.ModelReadPlanes = function () {
		$http.get($scope.basePlan + 'getAll')
			.success(function (data) {
				$scope.planes = data;
				
				// Ordenar planes alfabéticamente por nombre
				$scope.planes.sort(function(a, b) {
					return a.nombre.localeCompare(b.nombre);
				});
				
				// Si estamos en modo "Nuevo Usuario" y hay planes disponibles, seleccionar el primero solo si está vacío
				if ($scope.ViewAction === 'Nuevo Usuario' && $scope.planes.length > 0 && (!$scope.view_plannutricional || $scope.view_plannutricional === '')) {
					$scope.view_plannutricional = $scope.planes[0].nombre;
					//console.log('Plan nutricional seleccionado automáticamente:', $scope.view_plannutricional);
				}
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Error al obtener planes');
			});
	};

	$scope.ModelReadPlantas = function () {
		$http.get($scope.basePlantas + 'getAll')
			.success(function (data) {
				$scope.plantas = data;
				
				// Ordenar plantas alfabéticamente por nombre
				$scope.plantas.sort(function(a, b) {
					return a.nombre.localeCompare(b.nombre);
				});
				
				// Si estamos en modo "Nuevo Usuario" y hay plantas disponibles, seleccionar el primero solo si está vacío
				if ($scope.ViewAction === 'Nuevo Usuario' && $scope.plantas.length > 0 && (!$scope.view_planta || $scope.view_planta === '')) {
					$scope.view_planta = $scope.plantas[0].nombre;
					//console.log('Planta seleccionada automáticamente:', $scope.view_planta);
				}
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
		$scope.view_cuil = '';
		$scope.view_dni = '';
		$scope.view_domicilio = '';
		$scope.view_fechaingreso = '';
		$scope.view_bonificacion = 0;
		$scope.view_previewImage = '';
		$scope.view_bonificacion_invitado = 0;

		// Inicializar selects como vacíos para permitir selección automática
		$scope.view_perfil = '';
		$scope.view_plannutricional = '';
		$scope.view_planta = '';
		$scope.view_centrodecosto = '';
		$scope.view_proyecto = '';
		
		// No seleccionar automáticamente, esperar a que se carguen las jerarquías
		// El ModelReadJerarquias() se encargará de seleccionar la primera si es necesario
		
		/*console.log('ViewCreate - Inicializando selects:', {
			perfil: $scope.view_perfil,
			planta: $scope.view_planta,
			centrodecosto: $scope.view_centrodecosto,
			proyecto: $scope.view_proyecto
		});*/

		// Cargar datos
		$scope.ModelReadPlanes();
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
		$scope.ModelReadProyectos();
		$scope.ModelReadJerarquias();
	};

	$scope.ModelReadProyectos = function () {
		$http.get($scope.baseProyectos + 'getAll')
			.success(function (data) {
				$scope.proyectos = data;
				
				// Ordenar proyectos alfabéticamente por nombre
				$scope.proyectos.sort(function(a, b) {
					return a.nombre.localeCompare(b.nombre);
				});
				
				// Si estamos en modo "Nuevo Usuario" y hay proyectos disponibles, seleccionar el primero solo si está vacío
				if ($scope.ViewAction === 'Nuevo Usuario' && $scope.proyectos.length > 0 && (!$scope.view_proyecto || $scope.view_proyecto === '')) {
					$scope.view_proyecto = $scope.proyectos[0].nombre;
					//console.log('Proyecto seleccionado automáticamente:', $scope.view_proyecto);
				}
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Error al obtener proyectos');
			});
	};

	$scope.ModelReadCentros = function () {
		$http.get($scope.baseCentrodecostos + 'getAll')
			.success(function (data) {
				$scope.centros = data;
				
				// Ordenar centros alfabéticamente por nombre
				$scope.centros.sort(function(a, b) {
					return a.nombre.localeCompare(b.nombre);
				});
				
				// Si estamos en modo "Nuevo Usuario" y hay centros disponibles, seleccionar el primero solo si está vacío
				if ($scope.ViewAction === 'Nuevo Usuario' && $scope.centros.length > 0 && (!$scope.view_centrodecosto || $scope.view_centrodecosto === '')) {
					$scope.view_centrodecosto = $scope.centros[0].nombre;
					//console.log('Centro de costo seleccionado automáticamente:', $scope.view_centrodecosto);
				}
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Error al obtener centros de costo');
			});
	};

	$scope.ModelReadJerarquias = function () {
		$http.get($scope.baseJerarquias + 'getAll')
			.success(function (data) {
				$scope.jerarquias = Array.isArray(data) ? data : [];
				
				// Ordenar jerarquías alfabéticamente por nombre (usar perfil o nombre según lo que tenga)
				$scope.jerarquias.sort(function(a, b) {
					var nombreA = (a.perfil || a.nombre || '').toLowerCase();
					var nombreB = (b.perfil || b.nombre || '').toLowerCase();
					return nombreA.localeCompare(nombreB);
				});
				
				// Si estamos en modo "Nuevo Usuario" y hay jerarquías disponibles, seleccionar el primero solo si está vacío
				if ($scope.ViewAction === 'Nuevo Usuario' && $scope.jerarquias.length > 0 && (!$scope.view_perfil || $scope.view_perfil === '')) {
					var primeraJerarquia = $scope.jerarquias[0];
					$scope.view_perfil = primeraJerarquia.perfil || primeraJerarquia.nombre || '';
					//console.log('Jerarquía seleccionada automáticamente:', $scope.view_perfil);
				}
			})
			.error(function (data, status) {
				$scope.showError('Ha ocurrido un error', 'Error al obtener jerarquías');
			});
	};

	$scope.ViewUpdate = function (view_id) {
		/*console.log('=== EDITAR USUARIO ===');
		console.log('ID del usuario:', view_id);*/
		$scope.ViewAction = 'Editar Usuario';
		$scope.view_id = view_id;
		$scope.ModelRead(view_id);
		$scope.ModelReadPlanes();
		$scope.ModelReadPlantas();
		$scope.ModelReadCentros();
		$scope.ModelReadProyectos();
		$scope.ModelReadJerarquias();
	};

	$scope.ViewDelete = function (view_id) {
		// defensa por si otra lib ensucia Swal
		const hasSwal = typeof window !== 'undefined' && window.Swal && typeof window.Swal.fire === 'function';
	  
		if (hasSwal) {
		  window.Swal.fire({
			title: 'Baja registro',
			text: '¿Desea dar de baja el usuario?',
			icon: 'warning',
			showCancelButton: true,
			  confirmButtonColor: '#F34949',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar'
		  }).then(function (result) {
			if (result.isConfirmed) $scope.ModelDelete(view_id);
		  });
		} else {
		  // Fallback nativo si SweetAlert2 no está sano
		  if (window.confirm('¿Desea dar de baja el usuario?')) {
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
	// Cargar jerarquías al iniciar
	$scope.ModelReadJerarquias();
	$scope.data = [];
	for (var i = 0; i < 45; i++) {
		$scope.data.push("Item " + i);
	}

	// pageSize y currentPage ya están inicializados al inicio del controlador

	$scope.numberOfPages = function () {
		var arr = ($scope.filteredData || $scope.dataset) || [];
		var len = Array.isArray(arr) ? arr.length : 0;
		return Math.ceil(len / $scope.pageSize);
	}

	// Funciones para paginación tipo DataTable (igual que reportegcomensales)
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
	};

	// Función para ir a una página específica
	$scope.goToPage = function(page) {
		if (page >= 0 && page < $scope.numberOfPages()) {
			$scope.currentPage = page;
		}
	};

	// Función para cambiar el tamaño de página
	$scope.changePageSize = function(newSize) {
		$scope.pageSize = parseInt(newSize);
		$scope.currentPage = 0; // Volver a la primera página
	};
});