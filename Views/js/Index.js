// === SweetAlert2 shim: crea 'Swal.fire(...)' usando Swal.fire(...) ===
(function (w) {
	if (!w.Swal || typeof w.Swal.fire !== 'function') return; // no hay SweetAlert2

	// solo si NO existe un Swal.fire válido
	if (!w.Swal.fire || typeof w.Swal.fire !== 'function') {
		w.Swal.fire = function () {
			// soporta Swal.fire({ ... })
			if (arguments.length === 1 && typeof arguments[0] === 'object') {
				return w.Swal.fire(arguments[0]);
			}
			// soporta Swal.fire('titulo','texto','icon')
			var args = Array.prototype.slice.call(arguments);
			var opt = {};
			if (args[0]) opt.title = args[0];
			if (args[1]) opt.text = args[1];
			if (args[2]) opt.icon = args[2]; // 'success' | 'error' | 'warning' | 'info' | 'question'
			return w.Swal.fire(opt);
		};
	}
})(window);


var app = angular.module('AngujarJS', ['ja.qr']);

// === Capturar errores de CORS a nivel global ===
(function() {
	var mensajeCORSMostrado = false;
	
	// Capturar errores no capturados que mencionen CORS
	window.addEventListener('error', function(event) {
		var mensaje = event.message || '';
		if (mensaje.toLowerCase().indexOf('cors') !== -1 || 
			mensaje.toLowerCase().indexOf('cross-origin') !== -1 ||
			mensaje.toLowerCase().indexOf('origen cruzado') !== -1) {
			
			if (!mensajeCORSMostrado && window.Swal && typeof window.Swal.fire === 'function') {
				mensajeCORSMostrado = true;
				setTimeout(function() {
					window.Swal.fire({
						title: '⚠️ Error de CORS',
						html: '<div style="text-align: left;">' +
							  '<p><strong>No se puede conectar con el backend por restricciones CORS.</strong></p>' +
							  '<p style="color: #d33; font-weight: bold;">El backend debe configurar CORS para permitir solicitudes desde el frontend.</p>' +
							  '<hr style="margin: 15px 0;">' +
							  '<p><strong>Por favor verifica en el backend (C#/ASP.NET):</strong></p>' +
							  '<ul style="margin-left: 20px; text-align: left;">' +
							  '<li>Que CORS esté habilitado en <code>WebApiConfig.cs</code></li>' +
							  '<li>Que permita el origen del frontend:<br>' +
							  '<code style="display: block; margin: 5px 0; padding: 5px; background: #f5f5f5;">http://localhost:4200</code></li>' +
							  '<li>Que los métodos HTTP necesarios estén permitidos</li>' +
							  '<li>Que los headers necesarios estén permitidos</li>' +
							  '</ul>' +
							  '<p style="margin-top: 15px; color: #666; font-size: 0.9em;">' +
							  '<strong>Error detectado:</strong> Solicitud de origen cruzado bloqueada</p>' +
							  '</div>',
						icon: 'error',
						confirmButtonText: 'Aceptar',
						confirmButtonColor: '#343A40',
						width: '650px',
						allowOutsideClick: false,
						allowEscapeKey: true
					}).then(function() {
						mensajeCORSMostrado = false;
					});
				}, 500);
				
				// Resetear el flag después de 5 segundos
				setTimeout(function() {
					mensajeCORSMostrado = false;
				}, 5000);
			}
		}
	}, true);
	
	// También capturar errores de promesas no manejadas
	window.addEventListener('unhandledrejection', function(event) {
		var mensaje = (event.reason && event.reason.message) || (event.reason && event.reason.toString()) || '';
		if (mensaje.toLowerCase().indexOf('cors') !== -1 || 
			mensaje.toLowerCase().indexOf('cross-origin') !== -1 ||
			mensaje.toLowerCase().indexOf('origen cruzado') !== -1) {
			
			if (!mensajeCORSMostrado && window.Swal && typeof window.Swal.fire === 'function') {
				mensajeCORSMostrado = true;
				setTimeout(function() {
					window.Swal.fire({
						title: '⚠️ Error de CORS',
						html: '<div style="text-align: left;">' +
							  '<p><strong>No se puede conectar con el backend por restricciones CORS.</strong></p>' +
							  '<p style="color: #d33; font-weight: bold;">El backend debe configurar CORS para permitir solicitudes desde el frontend.</p>' +
							  '<hr style="margin: 15px 0;">' +
							  '<p><strong>Por favor verifica en el backend (C#/ASP.NET):</strong></p>' +
							  '<ul style="margin-left: 20px; text-align: left;">' +
							  '<li>Que CORS esté habilitado en <code>WebApiConfig.cs</code></li>' +
							  '<li>Que permita el origen del frontend:<br>' +
							  '<code style="display: block; margin: 5px 0; padding: 5px; background: #f5f5f5;">http://localhost:4200</code></li>' +
							  '<li>Que los métodos HTTP necesarios estén permitidos</li>' +
							  '<li>Que los headers necesarios estén permitidos</li>' +
							  '</ul>' +
							  '</div>',
						icon: 'error',
						confirmButtonText: 'Aceptar',
						confirmButtonColor: '#343A40',
						width: '650px',
						allowOutsideClick: false,
						allowEscapeKey: true
					}).then(function() {
						mensajeCORSMostrado = false;
					});
				}, 500);
				
				setTimeout(function() {
					mensajeCORSMostrado = false;
				}, 5000);
			}
		}
	});
})();

// === Interceptor HTTP para detectar errores de conexión y CORS ===
app.config(function($httpProvider) {
	$httpProvider.interceptors.push(function($q, $window, $timeout) {
		// Variable para evitar mostrar múltiples mensajes al mismo tiempo
		var mensajeMostrandose = false;
		
		return {
			'responseError': function(rejection) {
				// Detectar errores de conexión o CORS
				var esErrorConexion = !rejection.status || rejection.status === 0 || rejection.status === -1;
				var urlTarget = (rejection.config && rejection.config.url) || '';
				var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
				// Extraer el dominio y puerto de la URL base
				var apiDomain = apiBaseUrl.replace(/^https?:\/\//, '').split('/')[0];
				var esPeticionBackend = urlTarget.indexOf(apiDomain) !== -1 || urlTarget.indexOf('localhost:8000') !== -1 || urlTarget.indexOf('127.0.0.1:8000') !== -1;
				
				// Detectar CORS desde el mensaje del error
				var mensajeError = rejection.message || rejection.statusText || '';
				var mensajeErrorLower = mensajeError.toLowerCase();
				var esErrorCORS = mensajeErrorLower.indexOf('cors') !== -1 || 
								  mensajeErrorLower.indexOf('cross-origin') !== -1 ||
								  mensajeErrorLower.indexOf('origen cruzado') !== -1 ||
								  mensajeErrorLower.indexOf('solicitud de origen cruzado') !== -1;
				
				// Si el status es 0 y es una petición al backend, probablemente es CORS
				// CORS típicamente devuelve status 0, mientras que backend no corriendo puede dar timeout
				if (esErrorConexion && esPeticionBackend && (rejection.status === 0 || rejection.status === -1)) {
					// Cuando status es 0/-1 desde backend, casi siempre es CORS
					esErrorCORS = true;
				}
				
				if (esErrorConexion && !mensajeMostrandose) {
					mensajeMostrandose = true;
					
					// Mensaje específico para CORS (si es backend y status 0, es CORS)
					if (esErrorCORS || (esPeticionBackend && (rejection.status === 0 || rejection.status === -1))) {
						if ($window.Swal && typeof $window.Swal.fire === 'function') {
							$window.Swal.fire({
								title: '⚠️ Error de CORS',
								html: '<div style="text-align: left;">' +
									  '<p><strong>No se puede conectar con el backend por restricciones CORS.</strong></p>' +
									  '<p style="color: #d33; font-weight: bold;">El backend debe configurar CORS para permitir solicitudes desde el frontend.</p>' +
									  '<hr style="margin: 15px 0;">' +
									  '<p><strong>Por favor verifica en el backend:</strong></p>' +
									  '<ul style="margin-left: 20px; text-align: left;">' +
									  '<li>Que CORS esté habilitado</li>' +
									  '<li>Que permita el origen del frontend (ej: <code>http://localhost:4200</code>)</li>' +
									  '<li>Que los headers necesarios estén permitidos</li>' +
									  '<li>Que el método HTTP esté permitido</li>' +
									  '</ul>' +
									  '<p style="margin-top: 15px; color: #666; font-size: 0.9em;">' +
									  '<strong>URL que falló:</strong><br>' +
									  '<code style="font-size: 0.85em; word-break: break-all;">' + 
									  (rejection.config ? rejection.config.url : 'N/A') + 
									  '</code></p>' +
									  '</div>',
								icon: 'error',
								confirmButtonText: 'Aceptar',
								confirmButtonColor: '#343A40',
								width: '600px',
								allowOutsideClick: false,
								allowEscapeKey: true
							}).then(function() {
								mensajeMostrandose = false;
							});
						} else {
							alert('⚠️ Error de CORS\n\nNo se puede conectar con el backend por restricciones CORS.\n\nEl backend debe configurar CORS para permitir solicitudes desde el frontend.\n\nURL: ' + (rejection.config ? rejection.config.url : 'N/A'));
							mensajeMostrandose = false;
						}
					} else {
						// Mensaje específico: backend no está corriendo
						if ($window.Swal && typeof $window.Swal.fire === 'function') {
							$window.Swal.fire({
								title: '⚠️ Backend No Está Corriendo',
								html: '<div style="text-align: left;">' +
									  '<p><strong style="color: #d33; font-size: 1.1em;">El backend NO está corriendo o no es accesible.</strong></p>' +
									  '<hr style="margin: 15px 0;">' +
									  '<p><strong>Por favor verifica:</strong></p>' +
									  '<ul style="margin-left: 20px; text-align: left;">' +
									  '<li>Que el backend esté iniciado</li>' +
									  '<li>Que esté corriendo en <code style="background: #f5f5f5; padding: 2px 5px;">' + 
									  (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:8000') + 
									  '</code></li>' +
									  '<li>Que el puerto esté disponible y no esté ocupado por otro proceso</li>' +
									  '<li>Que no haya errores al iniciar el backend</li>' +
									  '</ul>' +
									  '<p style="margin-top: 15px; color: #666; font-size: 0.9em;">' +
									  '<strong>URL que falló:</strong><br>' +
									  '<code style="font-size: 0.85em; word-break: break-all; background: #f5f5f5; padding: 3px;">' + 
									  (rejection.config ? rejection.config.url : 'N/A') + 
									  '</code></p>' +
									  '<p style="margin-top: 10px; color: #666; font-size: 0.9em;">' +
									  '<strong>💡 Consejo:</strong> Revisa la consola del backend para ver si hay errores al iniciar.</p>' +
									  '</div>',
								icon: 'error',
								confirmButtonText: 'Aceptar',
								confirmButtonColor: '#343A40',
								width: '650px',
								allowOutsideClick: false,
								allowEscapeKey: true
							}).then(function() {
								mensajeMostrandose = false;
							});
						} else {
							var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
							alert('⚠️ Backend No Está Corriendo\n\nNo se puede conectar al servidor backend en ' + apiBaseUrl + '\n\nPor favor verifica que el backend esté iniciado y corriendo.\n\nURL que falló: ' + (rejection.config ? rejection.config.url : 'N/A'));
							mensajeMostrandose = false;
						}
					}
					
					// Resetear el flag después de 3 segundos como respaldo
					$timeout(function() {
						mensajeMostrandose = false;
					}, 3000);
				} else if (rejection.status === 404) {
					// Endpoint no encontrado
					console.error('❌ Endpoint no encontrado:', rejection.config ? rejection.config.url : 'N/A');
				} else if (rejection.status >= 500) {
					// Error del servidor
					console.error('❌ Error del servidor:', rejection.status, rejection.config ? rejection.config.url : 'N/A');
				}
				
				return $q.reject(rejection);
			}
		};
	});
});

// Filtro para pluralización
app.filter('pluralize', function() {
	return function(count, singular, plural) {
		if (count === 1) {
			return singular;
		}
		return plural || singular + 's';
	};
});

function normalizar(str) {
	return (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
function showInfoToast(msg) {
	// SweetAlert2 (si está)
	if (window.Swal && Swal.fire) {
		Swal.fire({
			toast: true, position: 'top-end',
			icon: 'info', title: msg,
			showConfirmButton: false, timer: 2000, timerProgressBar: true
		});
		return;
	}
	// SweetAlert v1 (fallback, no bloqueante)
	if (window.Swal.fire) {
		Swal.fire({
			title: 'Info',
			text: msg,
			icon: 'info',
			buttons: false,
			timer: 1800,
			closeOnClickOutside: true,
			closeOnEsc: true
		});
	} else {
		console.info(msg);
	}
}

app.controller('Index', function ($scope, $sce, $http, $window, $timeout) {
	////////////////////////////////////////////////HTTP////////////////////////////////////////////////
	$scope.isLoading = true;

	// Fecha y hora actual para navbar
	$scope.currentDateTime = new Date().toLocaleString('es-AR');
	setInterval(function() {
		$scope.currentDateTime = new Date().toLocaleString('es-AR');
		if (!$scope.$$phase) { $scope.$apply(); }
	}, 1000);

	// === Verificación de conectividad con la API al inicio ===
	(function verificarConectividadAPI() {
		var mensajeMostrado = false;
		var verificacionCompletada = false;
		var tiempoEspera = 1000; // Esperar 1 segundo antes de verificar
		
		var mostrarErrorBackend = function(esCORS) {
			if (mensajeMostrado) return; // Evitar múltiples mensajes
			
			mensajeMostrado = true;
			verificacionCompletada = true;
			
			$timeout(function() {
				if (window.Swal && typeof window.Swal.fire === 'function') {
					var titulo = esCORS ? '⚠️ Error de CORS' : '⚠️ Backend No Está Corriendo';
					var contenido = esCORS ? 
						'<div style="text-align: left;">' +
						  '<p><strong>No se puede conectar con el backend por restricciones CORS.</strong></p>' +
						  '<p style="color: #d33; font-weight: bold;">El backend debe configurar CORS para permitir solicitudes desde el frontend.</p>' +
						  '<hr style="margin: 15px 0;">' +
						  '<p><strong>Por favor verifica en el backend (C#/ASP.NET):</strong></p>' +
						  '<ul style="margin-left: 20px; text-align: left;">' +
						  '<li>Que CORS esté habilitado en <code>WebApiConfig.cs</code></li>' +
						  '<li>Que permita el origen del frontend:<br>' +
						  '<code style="display: block; margin: 5px 0; padding: 5px; background: #f5f5f5; color: #333;">http://localhost:4200</code></li>' +
						  '<li>Que los métodos HTTP necesarios estén permitidos (GET, POST, etc.)</li>' +
						  '<li>Que los headers necesarios estén permitidos</li>' +
						  '</ul>' +
						  '<p style="margin-top: 15px; color: #666; font-size: 0.9em;">' +
						  'Revisa la consola del navegador (F12) para ver el error: "Solicitud de origen cruzado bloqueada"</p>' +
						  '</div>' :
						'<div style="text-align: left;">' +
						  '<p><strong style="color: #d33; font-size: 1.1em;">El backend NO está corriendo o no es accesible.</strong></p>' +
						  '<hr style="margin: 15px 0;">' +
						  '<p><strong>Por favor verifica:</strong></p>' +
						  '<ul style="margin-left: 20px; text-align: left;">' +
						  '<li>Que el backend esté iniciado</li>' +
						  '<li>Que esté corriendo en <code style="background: #f5f5f5; padding: 2px 5px;">' + 
						  (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:8000') + 
						  '</code></li>' +
						  '<li>Que el puerto esté disponible y no esté ocupado por otro proceso</li>' +
						  '<li>Que no haya errores al iniciar el backend</li>' +
						  '</ul>' +
						  '<p style="margin-top: 15px; color: #666; font-size: 0.9em;">' +
						  '<strong>💡 Consejo:</strong> Revisa la consola del backend para ver si hay errores al iniciar.</p>' +
						  '</div>';
					
					window.Swal.fire({
						title: titulo,
						html: contenido,
						icon: 'error',
						confirmButtonText: 'Aceptar',
						confirmButtonColor: '#343A40',
						width: '650px',
						allowOutsideClick: false,
						allowEscapeKey: true
					}).then(function() {
						mensajeMostrado = false;
					});
					} else {
						// Fallback si SweetAlert2 no está disponible
						var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
						var mensaje = esCORS ? 
							'⚠️ Error de CORS\n\nNo se puede conectar con el backend por restricciones CORS.\n\nEl backend debe configurar CORS para permitir solicitudes desde el frontend.' :
							'⚠️ Backend No Está Corriendo\n\nNo se puede conectar al servidor backend en ' + apiBaseUrl + '\n\nPor favor verifica que el backend esté iniciado y corriendo.';
						alert(mensaje);
						mensajeMostrado = false;
					}
			}, 500);
		};
		
		// Usar XMLHttpRequest directamente para mejor detección de errores CORS
		var verificarConXMLHttpRequest = function() {
			var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
			var xhr = new XMLHttpRequest();
			var urlPrueba = apiBaseUrl + '/api/jerarquia/GetName?name=Test';
			var timeoutID = null;
			var errorTimeoutID = null;
			var inicioTiempo = Date.now();
			var esCORS = false;
			
			// Timeout para detectar si es backend no corriendo (más largo)
			timeoutID = setTimeout(function() {
				if (xhr.readyState !== 4) {
					xhr.abort();
					var tiempoTranscurrido = Date.now() - inicioTiempo;
					// Si pasa mucho tiempo sin respuesta, backend no está corriendo
					// Si el error fue rápido (< 500ms), probablemente es CORS
					if (tiempoTranscurrido < 1000) {
						esCORS = true;
						mostrarErrorBackend(true);
					} else {
						mostrarErrorBackend(false);
					}
				}
			}, 5000);
			
			// Detectar errores rápidos (probablemente CORS)
			errorTimeoutID = setTimeout(function() {
				if (xhr.readyState === 0 || (xhr.readyState < 4 && xhr.status === 0)) {
					var tiempoTranscurrido = Date.now() - inicioTiempo;
					// Si el error ocurre muy rápido (< 200ms), es casi seguro CORS
					if (tiempoTranscurrido < 500) {
						esCORS = true;
						clearTimeout(timeoutID);
						xhr.abort();
						mostrarErrorBackend(true);
					}
				}
			}, 300);
			
			xhr.onerror = function(e) {
				clearTimeout(timeoutID);
				clearTimeout(errorTimeoutID);
				var tiempoTranscurrido = Date.now() - inicioTiempo;
				// Si el error ocurre muy rápido (< 500ms), probablemente es CORS
				// CORS se bloquea casi inmediatamente por el navegador
				// Backend no corriendo tarda más (timeout de conexión puede tardar varios segundos)
				if (tiempoTranscurrido < 500) {
					esCORS = true;
					console.log('🔍 Error detectado rápidamente (< 500ms) - Probable CORS');
					mostrarErrorBackend(true);
				} else if (tiempoTranscurrido < 2000) {
					// Entre 500ms y 2 segundos, puede ser CORS o conexión rechazada
					// Como el usuario está viendo el error de CORS en la consola, asumimos CORS
					esCORS = true;
					console.log('🔍 Error detectado en tiempo intermedio - Probable CORS');
					mostrarErrorBackend(true);
				} else {
					// Error después de mucho tiempo sugiere que el backend no está corriendo
					console.log('🔍 Error detectado después de tiempo (> 2s) - Backend no corriendo');
					mostrarErrorBackend(false);
				}
			};
			
			xhr.onload = function() {
				clearTimeout(timeoutID);
				clearTimeout(errorTimeoutID);
				// Si hay respuesta (incluso si es error), el backend está corriendo
				if (xhr.status >= 200 && xhr.status < 500) {
					verificacionCompletada = true;
					console.log('✅ Backend está corriendo correctamente (status: ' + xhr.status + ')');
				} else {
					// Error del servidor, pero backend está corriendo
					verificacionCompletada = true;
					console.log('✅ Backend está corriendo (status: ' + xhr.status + ')');
				}
			};
			
			xhr.ontimeout = function() {
				clearTimeout(timeoutID);
				clearTimeout(errorTimeoutID);
				// Timeout sugiere que el backend no está respondiendo
				mostrarErrorBackend(false);
			};
			
			try {
				xhr.open('GET', urlPrueba, true);
				xhr.timeout = 5000;
				xhr.send();
			} catch(e) {
				clearTimeout(timeoutID);
				clearTimeout(errorTimeoutID);
				// Error al abrir la petición - podría ser CORS
				mostrarErrorBackend(true);
			}
		};
		
		// También usar $http como respaldo
		var verificarConAngularHttp = function() {
			var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
			var peticionPrueba = $http.get(apiBaseUrl + '/api/jerarquia/GetName?name=Test', {
				timeout: 4000
			});
			
			peticionPrueba.then(function(response) {
				verificacionCompletada = true;
				console.log('✅ Backend está corriendo correctamente');
			}).catch(function(rejection) {
				if (verificacionCompletada) return; // Ya se mostró el mensaje
				
				var status = rejection.status;
				var esCORS = false;
				
				if (!status || status === 0 || status === -1) {
					var mensajeError = rejection.message || rejection.statusText || '';
					var mensajeErrorLower = mensajeError.toLowerCase();
					
					esCORS = mensajeErrorLower.indexOf('cors') !== -1 || 
							 mensajeErrorLower.indexOf('cross-origin') !== -1 ||
							 mensajeErrorLower.indexOf('origen cruzado') !== -1;
					
					if (!esCORS) {
						// Si no es claramente CORS y el status es 0, probablemente backend no está corriendo
						mostrarErrorBackend(false);
					} else {
						mostrarErrorBackend(true);
					}
				} else if (status === 404) {
					verificacionCompletada = true;
					console.log('✅ Backend está corriendo (404 es normal para endpoint de prueba)');
				} else {
					verificacionCompletada = true;
					console.log('✅ Backend está corriendo (status: ' + status + ')');
				}
			});
		};
		
		// Iniciar verificación después de un breve delay
		$timeout(function() {
			// Intentar primero con XMLHttpRequest (más directo para detectar CORS)
			verificarConXMLHttpRequest();
			
			// También intentar con $http como respaldo
			setTimeout(function() {
				if (!verificacionCompletada) {
					verificarConAngularHttp();
				}
			}, 500);
	}, tiempoEspera);
})();
// Usar la variable de configuración global API_BASE_URL
var apiBaseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
$scope.baseMenu = apiBaseUrl + '/api/menudd/';
$scope.basePlatos = apiBaseUrl + '/api/plato/';
$scope.baseComanda = apiBaseUrl + '/api/comanda/';
$scope.baseTurno = apiBaseUrl + '/api/turno/';
$scope.base = apiBaseUrl + '/api/jerarquia/';
	$scope.platos = [];
	$scope.menudeldia = [];
	$scope.comanda = '';
	$scope.dataset = [];
	$scope.menuDatasetSeleccionado = [];
	$scope.turnoDataset = [];
	$scope.pedidoVigente = [];
	$scope.pedidoSeleccionado = '';
	$scope.defaultImage = 'img/logo-preview.png';
	const hoy = new Date().toISOString().split('T')[0];
	
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
	$scope.user_BonificacionInvitado = localStorage.getItem('bonificacion_invitado');
	$scope.user_DNI = localStorage.getItem('dni');
	$scope.user_legajo = localStorage.getItem('legajo');
	$scope.user_cuil = localStorage.getItem('cuil');
	$scope.user_Pedido = '';
	$scope.pedidosGastados = '';
	$scope.pedidosRestantes = 0; // Inicializar como número, no como cadena vacía
	$scope.pedidosInvitadosRestantes = '';
	$scope.selectedTurno = null;
	$scope.mostrarModal = false;
	$scope.turnoDisponible = true;
	
	// === Variables para sistema de bonificaciones ===
	$scope.bonificacionDisponible = false;
	$scope.porcentajeBonificacion = 0;
	$scope.yaBonificadoHoy = false;
	$scope.cantidadBonificacionesHoy = 0;
	$scope.pedidosBonificadosArray = []; // Array de pedidos con bonificado > 0 y estado 'R' (Recibido)
	$scope.precioOriginal = 0;
	// Control de preselección por turno: si se marcó descuento en un turno, no permitir en otro
	$scope.bonificacionPreSeleccionada = false;
	$scope.turnoBonificacionSeleccionada = null;
	$scope.precioConBonificacion = 0;
	$scope.descuentoAplicado = 0;
	
	// === FUNCIÓN DE MONITOREO PARA PEDIDOS RESTANTES ===
	$scope.monitorearPedidosRestantes = function(nuevoValor, contexto) {
		console.log('🔍 MONITOREO pedidosRestantes:', {
			valorAnterior: $scope.pedidosRestantes,
			valorNuevo: nuevoValor,
			contexto: contexto,
			stackTrace: new Error().stack
		});
		
		if (nuevoValor < 0) {
			console.error('❌ ERROR: pedidosRestantes NEGATIVO DETECTADO:', nuevoValor, 'en contexto:', contexto);
			console.error('Stack trace:', new Error().stack);
			return 0; // Corregir a 0
		}
		
		return nuevoValor;
	}; 
	//usuario SmarTime
	$scope.smarTime = localStorage.getItem('SmarTime');
	$scope.usuarioSmatTime = localStorage.getItem('usuarioSmatTime');
	$scope.tipoVisualizacionCodigo = localStorage.getItem('tipoVisualizacionCodigo') || 'QR';//Barra
	console.log("🧾 Tipo de visualización seleccionada:", $scope.tipoVisualizacionCodigo);
	//alert("Tipo de visualización:", $scope.tipoVisualizacionCodigo);
	////////////////////////////////////////////////INICIALIZACIONES////////////////////////////////////////////////
	// Llamada automática al iniciar
	
	$scope.changeTurno = function () {
		console.log("🔄 changeTurno ejecutado");
		console.log("📋 selectedTurno:", $scope.selectedTurno);
		console.log("📋 Tipo de selectedTurno:", typeof $scope.selectedTurno);
		
		$scope.dataset = [];
		$scope.menuDatasetSeleccionado = [];

		if (!$scope.selectedTurno) {
			console.warn("⚠️ selectedTurno es null/undefined");
			$scope.isLoading = false;
			return;
		}
		
		if (typeof $scope.selectedTurno === 'string') {
			console.warn("⚠️ selectedTurno es string, no objeto:", $scope.selectedTurno);
			$scope.isLoading = false;
			return;
		}
		
		if (!$scope.selectedTurno.descripcion) {
			console.warn("⚠️ selectedTurno no tiene descripción:", $scope.selectedTurno);
			$scope.isLoading = false;
			return;
		}

		console.log("📦 Parámetros enviados a filtrarPorTurno:");
		console.log("planta:", $scope.user_Planta);
		console.log("centrodecosto:", $scope.user_Centrodecosto);
		console.log("jerarquia:", $scope.user_Jerarquia);
		console.log("proyecto:", $scope.user_Proyecto);
		console.log("turno:", $scope.selectedTurno.descripcion);

		const ahora = new Date();
		const hoy = ahora.getFullYear() + '-' +
			String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
			String(ahora.getDate()).padStart(2, '0');
		console.log(hoy);


		// Intentar conectar con el servidor real
		$http.get($scope.baseMenu + 'filtrarPorTurno', {
			params: {
				planta: $scope.user_Planta || '',
				centro: $scope.user_Centrodecosto || '',
				jerarquia: $scope.user_Jerarquia || '',
				proyecto: $scope.user_Proyecto || '',
				turno: ($scope.selectedTurno && $scope.selectedTurno.descripcion) ? $scope.selectedTurno.descripcion : '',
				fecha: hoy || ''
			}
		}).then(function (response) {
			console.log('=== 📊 DATOS DE API FILTRAR POR TURNO ===');
			console.log('URL llamada:', $scope.baseMenu + 'filtrarPorTurno');
			console.log('Parámetros:', {
				planta: $scope.user_Planta,
				centro: $scope.user_Centrodecosto,
				jerarquia: $scope.user_Jerarquia,
				proyecto: $scope.user_Proyecto,
				turno: $scope.selectedTurno.descripcion,
				fecha: hoy
			});
			console.log('Status:', response.status);
			console.log('Datos recibidos:', response.data);
			console.log('Tipo de datos:', Array.isArray(response.data) ? 'Array' : typeof response.data);
			console.log('Cantidad de menús filtrados:', Array.isArray(response.data) ? response.data.length : 'No es array');
			if (Array.isArray(response.data) && response.data.length > 0) {
				console.log('Primer menú filtrado:', response.data[0]);
				console.log('Campos del primer menú filtrado:', Object.keys(response.data[0]));
			}
			
			if (Array.isArray(response.data)) {
				console.log("✅ Datos recibidos de filtrarPorTurno:", response.data); 
				$scope.menuDatasetSeleccionado = response.data;
				$scope.filtraPlatos();
			} else {
				console.warn("La respuesta no es un array:", response.data);
			}
		}).catch(function (error) {
			console.warn("⚠️ Servidor API no disponible. Continuando sin datos.");
			// Manejar el error de forma silenciosa - no bloquear la aplicación
			$scope.isLoading = false;
			
			// No mostrar modales de error, simplemente continuar
			$scope.menuDatasetSeleccionado = [];
			$scope.dataset = [];
			
			// Log silencioso para desarrollo
			if (typeof AppConfig !== 'undefined' && AppConfig.development.logApiCalls) {
				console.log("🔧 Modo desarrollo: API no disponible, continuando sin datos");
			}
		});
	};


	$scope.filtraPlatos = function () {
		$scope.dataset = [];

		// Si no hay datos del menú, simplemente continuar sin mostrar nada
		if (!$scope.menuDatasetSeleccionado || $scope.menuDatasetSeleccionado.length === 0) {
			console.log("No hay datos de menú disponibles. Continuando sin mostrar platos.");
			$scope.isLoading = false;
			return;
		}

		$scope.menuDatasetSeleccionado.forEach(menuItem => {
			const plato = $scope.platos.find(o => o.descripcion.trim() === menuItem.plato.trim());

			if (!plato) {
				console.warn("No se encontró el plato:", menuItem.plato);
			}

			if (plato) {
				plato.presentacion = plato.presentacion || $scope.defaultImage;
				plato.cantidadDisponible = menuItem.cantidad;
				plato.turno = menuItem.turno;
				$scope.dataset.push(plato);
			}
		});

		$scope.isLoading = false;
	};

	$http.get($scope.basePlatos + 'getAll')
		.then(function (response) {
			console.log('=== 📊 DATOS DE API PLATOS ===');
			console.log('URL llamada:', $scope.basePlatos + 'getAll');
			console.log('Status:', response.status);
			console.log('Datos recibidos:', response.data);
			console.log('Tipo de datos:', Array.isArray(response.data) ? 'Array' : typeof response.data);
			console.log('Cantidad de platos:', Array.isArray(response.data) ? response.data.length : 'No es array');
			if (Array.isArray(response.data) && response.data.length > 0) {
				console.log('Primer plato:', response.data[0]);
				console.log('Campos del primer plato:', Object.keys(response.data[0]));
			}
			$scope.platos = response.data;
			return $http.get($scope.baseTurno + 'GetTurnosDisponibles');
		})
		.then(function (response) {
			console.log('=== 📊 DATOS DE API TURNOS ===');
			console.log('URL llamada:', $scope.baseTurno + 'GetTurnosDisponibles');
			console.log('Status:', response.status);
			console.log('Datos recibidos:', response.data);
			console.log('Tipo de datos:', Array.isArray(response.data) ? 'Array' : typeof response.data);
			console.log('Cantidad de turnos:', Array.isArray(response.data) ? response.data.length : 'No es array');
			if (Array.isArray(response.data) && response.data.length > 0) {
				console.log('Primer turno:', response.data[0]);
				console.log('Campos del primer turno:', Object.keys(response.data[0]));
			}
			
			$scope.turnoDataset = Array.isArray(response.data) ? response.data : [];
			if ($scope.turnoDataset.length === 0) {
				$scope.turnoDisponible = false;
				showInfoToast('Sin turnos disponibles.');
			}
			$scope.getTurnoActual();
			
			// Configurar event listener después de cargar turnos
			$timeout(function() {
				$scope.setupTurnoSelectListener();
			}, 100);
		})
		.then(() => {
			const hoy = new Date().toISOString().split('T')[0];
			return $http.get($scope.baseMenu + 'filtrar', {
				params: {
					planta: $scope.user_Planta,
					centro: $scope.user_Centrodecosto,
					jerarquia: $scope.user_Jerarquia,
					proyecto: $scope.user_Proyecto,
					desde: hoy,
					hasta: hoy
				}
			});
		})
		.then(function (response) {
			console.log('=== 📊 DATOS DE API MENÚ DEL DÍA ===');
			console.log('URL llamada:', $scope.baseMenu + 'filtrar');
			console.log('Parámetros:', {
				planta: $scope.user_Planta,
				centro: $scope.user_Centrodecosto,
				jerarquia: $scope.user_Jerarquia,
				proyecto: $scope.user_Proyecto,
				desde: hoy,
				hasta: hoy
			});
			console.log('Status:', response.status);
			console.log('Datos recibidos:', response.data);
			console.log('Tipo de datos:', Array.isArray(response.data) ? 'Array' : typeof response.data);
			console.log('Cantidad de menús:', Array.isArray(response.data) ? response.data.length : 'No es array');
			if (Array.isArray(response.data) && response.data.length > 0) {
				console.log('Primer menú:', response.data[0]);
				console.log('Campos del primer menú:', Object.keys(response.data[0]));
			}
			
			if (Array.isArray(response.data)) {
				$scope.menudeldia = response.data;

				// Solo llamá a changeTurno si hay un selectedTurno válido
				if ($scope.selectedTurno && $scope.selectedTurno.descripcion) {
					$scope.changeTurno();
				} else {
					console.warn("No hay turno seleccionado para aplicar changeTurno");
				}
			} else {
				console.warn("No vino un array para menudeldia");
			}
		})
		.catch(function (error) {
			console.warn("⚠️ Error al obtener menú del día. Continuando sin datos.");
			$scope.menudeldia = [];
			$scope.isLoading = false;
		})
		.catch(function (error) {
			console.warn("⚠️ Error en inicialización de datos. Continuando sin datos.");
			$scope.platos = [];
			$scope.turnoDataset = [];
			$scope.menudeldia = [];
			$scope.isLoading = false;
		})


	$scope.getTurnoActual = function () {
		if (!Array.isArray($scope.turnoDataset)) return;

		const ahora = new Date();
		const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
		let turnoActual = null;
		let proximoTurno = null;
		let diferenciaMin = Infinity;

		$scope.turnoDataset.forEach(turno => {
			const [hDesde, mDesde] = turno.horadesde.split(':').map(Number);
			const [hHasta, mHasta] = turno.horahasta.split(':').map(Number);
			const desdeMin = hDesde * 60 + mDesde;
			const hastaMin = hHasta * 60 + mHasta;

			if (
				(desdeMin <= hastaMin && minutosAhora >= desdeMin && minutosAhora <= hastaMin) ||
				(desdeMin > hastaMin && (minutosAhora >= desdeMin || minutosAhora <= hastaMin))
			) {
				turnoActual = turno;
			} else if (desdeMin > minutosAhora && (desdeMin - minutosAhora) < diferenciaMin) {
				diferenciaMin = desdeMin - minutosAhora;
				proximoTurno = turno;
			}
		});

		console.log("🔄 getTurnoActual ejecutado");
		console.log("📋 turnoElegidoManual:", $scope.turnoElegidoManual);
		console.log("📋 selectedTurno actual:", $scope.selectedTurno);
		
		if (!$scope.turnoElegidoManual) {
			console.log("📋 Usuario no eligió manualmente, estableciendo turno automático");
			if (turnoActual) {
				console.log("📋 Estableciendo turno actual:", turnoActual.descripcion);
				$scope.selectedTurno = turnoActual;
				$scope.turnoDisponible = true;
			} else if (proximoTurno) {
				console.log("📋 Estableciendo próximo turno:", proximoTurno.descripcion);
				$scope.selectedTurno = proximoTurno;
				$scope.turnoDisponible = true;
			} else {
				console.log("📋 No hay turnos disponibles");
				//$scope.selectedTurno = null;
				//$scope.turnoDisponible = false;
				//Swal.fire('Sin turnos disponibles', 'Ya no hay turnos activos para hoy.', 'info');
				showInfoToast('Sin turnos disponibles para hoy.');
			}

			if ($scope.selectedTurno) {
				console.log("📋 Llamando changeTurno desde getTurnoActual");
				$scope.changeTurno();
			} else {
				$scope.isLoading = false; // asegurá que no quede spinner
			}
		} else {
			console.log("📋 Usuario eligió manualmente, NO sobrescribiendo selectedTurno");
		}
	};

	$scope.onTurnoChanged = function () {
		console.log("🔄 === onTurnoChanged EJECUTADO ===");
		
		// FORZAR SINCRONIZACIÓN: Leer directamente del DOM
		var selectElement = document.getElementById('turno');
		var selectedIndex = selectElement ? selectElement.selectedIndex : -1;
		var selectedValue = selectElement ? selectElement.value : null;
		
		console.log("📋 selectedIndex:", selectedIndex);
		console.log("📋 selectedValue:", selectedValue);
		console.log("📋 turnoDataset disponible:", $scope.turnoDataset ? $scope.turnoDataset.length : 'NO');
		
		// Obtener el objeto completo del turno seleccionado
		if (selectedIndex >= 0 && $scope.turnoDataset && $scope.turnoDataset[selectedIndex]) {
			var turnoSeleccionado = $scope.turnoDataset[selectedIndex];
			console.log("📋 Turno seleccionado del DOM:", turnoSeleccionado);
			
			// FORZAR ACTUALIZACIÓN DEL SCOPE
			$scope.$apply(function() {
				$scope.selectedTurno = turnoSeleccionado;
				$scope.turnoElegidoManual = true;
			});
			
			console.log("📋 selectedTurno actualizado:", $scope.selectedTurno);
			
			// Procesar el cambio
			if ($scope.selectedTurno && $scope.selectedTurno.descripcion) {
				console.log("✅ Procesando turno:", $scope.selectedTurno.descripcion);
				$scope.changeTurno();
			}
		} else {
			console.warn("⚠️ No se pudo obtener el turno del DOM");
		}
		
		console.log("🔄 === FIN onTurnoChanged ===");
	};
	
	// Watch para detectar cambios en selectedTurno
	$scope.$watch('selectedTurno', function(newVal, oldVal) {
		console.log("🔄 $watch ejecutado");
		console.log("📋 newVal:", newVal);
		console.log("📋 oldVal:", oldVal);
		console.log("📋 Son diferentes:", newVal !== oldVal);
		
		if (newVal && newVal !== oldVal) {
			console.log("🔄 $watch detectó cambio en selectedTurno:", newVal);
			$scope.onTurnoChanged();
		}
	}, true);

	// EVENT LISTENER ADICIONAL como respaldo
	$scope.setupTurnoSelectListener = function() {
		var selectElement = document.getElementById('turno');
		if (selectElement) {
			// Remover listener anterior si existe
			selectElement.removeEventListener('change', $scope.handleTurnoChange);
			
			// Agregar nuevo listener
			$scope.handleTurnoChange = function(event) {
				console.log("🎯 Event listener detectó cambio en select");
				$scope.onTurnoChanged();
			};
			
			selectElement.addEventListener('change', $scope.handleTurnoChange);
			console.log("✅ Event listener configurado para select turno");
		} else {
			console.warn("⚠️ No se encontró el select con id 'turno'");
		}
	};

	$scope.obtieneComandas = function () {
		var id = $scope.user_DNI;
		var url = $scope.baseComanda + 'getPedido/' + id;

		console.log('=== 📊 DATOS DE API COMANDAS (obtieneComandas) ===');
		console.log('URL llamada:', url);
		console.log('DNI del usuario:', id);

		$http.get(url)
			.success(function (data) {
				console.log('=== 📊 RESPUESTA DE API COMANDAS ===');
				console.log('Datos recibidos:', data);
				console.log('Tipo de datos:', Array.isArray(data) ? 'Array' : typeof data);
				console.log('Cantidad de comandas:', Array.isArray(data) ? data.length : 'No es array');
				if (Array.isArray(data) && data.length > 0) {
					console.log('Primera comanda:', data[0]);
					console.log('Campos de la primera comanda:', Object.keys(data[0]));
					console.log('=== 🔍 ANÁLISIS DETALLADO DE COMANDAS ===');
					data.forEach(function(comanda, index) {
						console.log(`--- COMANDA ${index + 1} ---`);
						console.log('ID:', comanda.id);
						console.log('Código plato:', comanda.cod_plato);
						console.log('Monto:', comanda.monto);
						console.log('Bonificado:', comanda.bonificado);
						console.log('Estado:', comanda.estado);
						console.log('Fecha:', comanda.fecha);
						console.log('Fecha_hora:', comanda.fecha_hora);
						console.log('Invitado:', comanda.invitado);
						console.log('Todos los campos:', Object.keys(comanda));
						console.log('--- FIN COMANDA ---');
					});
				}
				$timeout(function () {
					var pedidosNoC = data.filter(function (elemento) {
						return elemento.estado !== 'C';
					});

					$scope.pedidosGastados = pedidosNoC.length;
					// NO modificar pedidosRestantes aquí, se maneja en el sistema de bonificaciones

					var pedidosInvitados = 0;
					$scope.pedidoVigente = []; // reinicio para evitar duplicados

					data.forEach(x => {
						var plato = $scope.platos.find(o => o.codigo === x.cod_plato);
						if (!plato) return;

						plato = angular.copy(plato); // para evitar modificar el array original

						if (x.estado == 'P') {
							plato.user_npedido = x.id;
							plato.datoQR = 'N' + x.id;
							plato.user_Pedido = x;
							plato.paraRetirar = false;
							plato.paraCancelar = true;
							$scope.pedidoVigente.push(plato);
						} else if (x.estado == 'E') {
							plato.user_npedido = x.id;
							plato.datoQR = 'N' + x.id;
							plato.user_Pedido = x;
							plato.paraRetirar = true;
							plato.paraCancelar = false;
							$scope.pedidoVigente.push(plato);
						}

						if (x.invitado === true) {
							pedidosInvitados++;
						}
					});

					// NO modificar pedidosRestantes aquí, se maneja en el sistema de bonificaciones
					$scope.pedidosInvitadosRestantes = $scope.user_BonificacionInvitado - pedidosInvitados;

					// Generar los códigos de barra (espera que DOM esté renderizado)
					$timeout(() => {
						$timeout(() => {
							$scope.pedidoVigente.forEach(pedido => {
								const idSelector = `#barcode-${pedido.user_npedido}`;
								const el = document.querySelector(idSelector);

								if (el && pedido.datoQR) {
									JsBarcode(el, pedido.datoQR, {
										format: "CODE128",
										lineColor: "#000",
										width: 2,
										height: 40,
										displayValue: true
									});
								} else {
									console.warn("❌ No se encontró el elemento para renderizar:", idSelector);
								}
							});
						}, 200); // Espera corta después del render
					}, 1000); // Espera tras procesar pedidos

				}, 1000); // Espera para render Angular
				
				// === INICIALIZAR SISTEMA DE BONIFICACIONES ===
				$scope.inicializarBonificaciones();
				
			})
		.error(function (data, status) {
			Swal.fire({
				title: 'Ha ocurrido un error',
				text: 'Error al obtener pedidos',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
			});
	};
	
	/*$scope.obtieneComandas = function () {
		var id = $scope.user_DNI;

		$http.get($scope.baseComanda + 'getPedido/' + id)
			.then(function (response) {
				var data = response.data;

				var pedidosNoC = data.filter(function (e) {
					return e.estado !== 'C';
				});

				$scope.pedidosGastados = pedidosNoC.length;
				// NO modificar pedidosRestantes aquí, se maneja en el sistema de bonificaciones
				console.log('=== LOG PEDIDOS GASTADOS ===');
				console.log('pedidosGastados:', $scope.pedidosGastados);
				console.log('user_Bonificacion:', $scope.user_Bonificacion);
				console.log('pedidosRestantes ANTES:', $scope.pedidosRestantes);

				var pedidosInvitados = 0;
				$scope.pedidoVigente = [];

				data.forEach(x => {
					var plato = $scope.platos.find(o => o.codigo === x.cod_plato);
					if (!plato) return;

					plato = angular.copy(plato);

					if (x.estado === 'P') {
						plato.user_npedido = x.id;
						plato.datoQR = 'N' + x.id;
						plato.user_Pedido = x;
						plato.paraRetirar = false;
						plato.paraCancelar = true;
						$scope.pedidoVigente.push(plato);
					} else if (x.estado === 'E') {
						plato.user_npedido = x.id;
						plato.datoQR = 'N' + x.id;
						plato.user_Pedido = x;
						plato.paraRetirar = true;
						plato.paraCancelar = false;
						$scope.pedidoVigente.push(plato);
					}

					if (x.invitado === true) {
						pedidosInvitados++;
					}
				});

				// NO modificar pedidosRestantes aquí, se maneja en el sistema de bonificaciones
				console.log('=== LOG PEDIDOS INVITADOS ===');
				console.log('pedidosInvitados:', pedidosInvitados);
				console.log('pedidosRestantes DESPUÉS:', $scope.pedidosRestantes);
				$scope.pedidosInvitadosRestantes = $scope.user_BonificacionInvitado - pedidosInvitados;

			})
		.catch(function () {
			Swal.fire({
				title: 'Ha ocurrido un error',
				text: 'Error al obtener pedidos',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#5c636a'
			});
			});
	};*/



	////////////////////////////////////////////////SISTEMA DE BONIFICACIONES////////////////////////////////////////////////
	
	// Inicializar sistema de bonificaciones al cargar la página
	$scope.inicializarBonificaciones = function() {
		console.log('=== INICIALIZANDO SISTEMA DE BONIFICACIONES ===');
		console.log('Perfil del usuario:', $scope.user_Rol);
		console.log('pedidosRestantes INICIAL:', $scope.pedidosRestantes);
		
		if (!window.BonificacionesService) {
			console.error('BonificacionesService no está disponible');
			$scope.pedidosRestantes = 0;
			console.log('pedidosRestantes ERROR:', $scope.pedidosRestantes);
			return;
		}
		
		// Obtener bonificación para el perfil del usuario
		window.BonificacionesService.obtenerBonificacion($scope.user_Rol)
			.then(function(bonificacion) {
				console.log('Bonificación obtenida:', bonificacion);
				$scope.porcentajeBonificacion = bonificacion.porcentaje;
				$scope.bonificacionDisponible = bonificacion.porcentaje > 0;
				
				// Inicializar pedidos restantes solo si NO hay bonificación disponible
				if (!$scope.bonificacionDisponible) {
					$scope.pedidosRestantes = $scope.monitorearPedidosRestantes(0, 'INICIALIZAR_SIN_BONIFICACION');
					console.log('pedidosRestantes SIN BONIFICACIÓN:', $scope.pedidosRestantes);
				}
				
				// Verificar si ya se usó la bonificación hoy (esto actualizará pedidosRestantes correctamente)
				return $scope.verificarBonificacionHoy();
			})
			.catch(function(error) {
				console.error('Error obteniendo bonificación:', error);
				$scope.bonificacionDisponible = false;
				$scope.porcentajeBonificacion = 0;
				$scope.pedidosRestantes = $scope.monitorearPedidosRestantes(0, 'ERROR_CATCH_INICIALIZAR');
				console.log('pedidosRestantes ERROR CATCH:', $scope.pedidosRestantes);
			});
	};
	
	// Verificar si ya se usó la bonificación hoy
	// Consulta directamente usando $scope.baseComanda
	$scope.verificarBonificacionHoy = function() {
		var fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		var url = $scope.baseComanda + 'getPedido/' + $scope.user_DNI;
		
		
		return $http.get(url)
			.then(function(response) {
				var data = response.data || [];
				
				// Filtrar pedidos del día que tengan bonificado > 0
				var pedidosBonificados = data.filter(function(pedido, index) {
					// Verificar si tiene campo bonificado con valor > 0
					// Si bonificado tiene cualquier valor positivo (distinto de vacío, null, 0), ya se aplicó la bonificación
					var bonificadoOriginal = pedido.bonificado;
					var bonificadoValue = 0;
					var tieneBonificacion = false;
					
					// Verificar si bonificado tiene valor (distinto de vacío, null, undefined)
					if (bonificadoOriginal !== null && bonificadoOriginal !== undefined && bonificadoOriginal !== '') {
						bonificadoValue = parseFloat(bonificadoOriginal) || 0;
						// Si el valor parseado es > 0, tiene bonificación
						tieneBonificacion = bonificadoValue > 0;
					}
					
					// Log principal: mostrar el campo bonificado
					console.log('Campo bonificado (original):', bonificadoOriginal);
					
					// Verificar por fecha si está disponible
					var esDelDia = true;
					if (pedido.fecha) {
						try {
							var f = pedido.fecha;
							var fIso = (new Date(f)).toISOString().split('T')[0];
							esDelDia = fIso === fechaHoy || f === fechaHoy;
						} catch (e) {
							esDelDia = pedido.fecha === fechaHoy;
						}
					} else if (pedido.fecha_hora) {
						var fechaPedido = null;
						var fechaHoraStr = String(pedido.fecha_hora);
						
						// Intentar parseo con Date nativo primero
						try {
							fechaPedido = new Date(fechaHoraStr).toISOString().split('T')[0];
							if (fechaPedido === 'Invalid Date') {
								fechaPedido = null;
							}
						} catch (e) {
							fechaPedido = null;
						}
						
						// Si el Date nativo falla, intentar parseo manual de diferentes formatos
						if (!fechaPedido || fechaPedido === 'Invalid Date') {
							// Formato 1: "h:mm dd/mm/yyyy" (ejemplo: "1:10 2/10/2025")
							var m1 = fechaHoraStr.match(/(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
							if (m1) {
								var dd = m1[3].padStart(2, '0');
								var mm = m1[4].padStart(2, '0');
								var yyyy = m1[5];
								fechaPedido = yyyy + '-' + mm + '-' + dd;
							} else {
								// Formato 2: "dd/mm/yyyy hh:mm" (formato estándar)
								var m2 = fechaHoraStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
								if (m2) {
									var dd = m2[1].padStart(2, '0');
									var mm = m2[2].padStart(2, '0');
									var yyyy = m2[3];
									fechaPedido = yyyy + '-' + mm + '-' + dd;
								}
							}
						}
						
						esDelDia = fechaPedido === fechaHoy;
					}
					
					// Validar estado: solo contar si el estado es 'R' (Recibido)
					var estado = (pedido.estado || '').toString().trim().toUpperCase();
					var estadoValido = estado === 'R'; // Solo contar si estado es 'R' (Recibido)

					// Solo cuenta si: es del día, tiene bonificado > 0, y tiene estado 'R' (Recibido)
					var cumpleCriterios = esDelDia && tieneBonificacion && estadoValido;
					
					return cumpleCriterios;
				});
				
				// === LÓGICA CORRECTA ===
				// Solo cuenta las comandas con bonificado > 0 y estado 'R' (Recibido)
				// Guardar el array de pedidos bonificados con estado 'R' en el scope
				$scope.pedidosBonificadosArray = pedidosBonificados; // Array de pedidos con bonificado > 0 y estado 'R'
				
				var yaBonificado = pedidosBonificados.length >= 1;
				var cantidadBonificados = pedidosBonificados.length;
				
				console.log('Cantidad de bonificaciones (usado para bloquear):', cantidadBonificados);
				console.log('Array de pedidos bonificados (estado R):', $scope.pedidosBonificadosArray);
				
				// Actualizar variables del scope
				$scope.yaBonificadoHoy = yaBonificado;
				$scope.cantidadBonificacionesHoy = cantidadBonificados;
				
				// === LÓGICA MEJORADA DE "TE QUEDAN PLATOS BONIFICADOS" ===
				// Si hay bonificación disponible:
				// - Si ya se usó hoy (cantidad >= 1): mostrar 0
				// - Si no se ha usado hoy (cantidad = 0): mostrar 1
				if ($scope.bonificacionDisponible) {
					var nuevoValor = $scope.cantidadBonificacionesHoy >= 1 ? 0 : 1;
					$scope.pedidosRestantes = $scope.monitorearPedidosRestantes(nuevoValor, 'VERIFICAR_BONIFICACION_CON_BONIFICACION');
				} else {
					// Si no hay bonificación disponible, mantener en 0
					$scope.pedidosRestantes = $scope.monitorearPedidosRestantes(0, 'VERIFICAR_BONIFICACION_SIN_BONIFICACION');
				}
				
				// === VALIDACIÓN: NUNCA NEGATIVO ===
				if ($scope.pedidosRestantes < 0) {
					$scope.pedidosRestantes = 0;
				}
				
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			})
			.catch(function(error) {
				$scope.yaBonificadoHoy = false;
				$scope.cantidadBonificacionesHoy = 0;
				$scope.pedidosBonificadosArray = []; // Inicializar array vacío en caso de error
				$scope.pedidosRestantes = $scope.monitorearPedidosRestantes($scope.bonificacionDisponible ? 1 : 0, 'ERROR_CATCH_VERIFICAR');
				
				// === VALIDACIÓN: NUNCA NEGATIVO ===
				if ($scope.pedidosRestantes < 0) {
					$scope.pedidosRestantes = 0;
				}
				$scope.$apply();
			});
	};
	
	// Calcular precio con bonificación
	$scope.calcularPrecioConBonificacion = function(precioOriginal, aplicarBonificacion) {
		if (!aplicarBonificacion || $scope.cantidadBonificacionesHoy >= 1 || !$scope.bonificacionDisponible) {
			return {
				precioFinal: precioOriginal,
				bonificado: 0,
				descuento: 0
			};
		}
		
		var resultado = window.BonificacionesService.calcularPrecioConBonificacion(
			precioOriginal, 
			$scope.porcentajeBonificacion
		);
		
		console.log('Cálculo de bonificación:', {
			precioOriginal: precioOriginal,
			porcentaje: $scope.porcentajeBonificacion,
			cantidadBonificacionesHoy: $scope.cantidadBonificacionesHoy,
			resultado: resultado
		});
		
		return resultado;
	};
	
	// Aplicar bonificación a un plato (solo preview, no consume bonificación)
	$scope.aplicarBonificacion = function(item, aplicarBonificacion) {
		console.log('=== PREVIEW BONIFICACIÓN ===');
		console.log('aplicarBonificacion:', aplicarBonificacion);
		console.log('bonificacionDisponible:', $scope.bonificacionDisponible);
		console.log('cantidadBonificacionesHoy:', $scope.cantidadBonificacionesHoy);
		
		// === LÓGICA DE RADIO BUTTON: SOLO UN PLATO PUEDE TENER DESCUENTO ===
		if (aplicarBonificacion) {
			// Si se está marcando este plato, desmarcar todos los demás
			$scope.dataset.forEach(function(plato) {
				if (plato !== item) {
					plato.aplicarBonificacion = false;
					// Restaurar precio original de los demás platos
					plato.precioFinal = parseFloat(plato.costo) || 0;
					plato.bonificado = 0;
				}
			});
			console.log('✅ Desmarcando otros platos, solo este tendrá descuento');
		}
		
		// Actualizar el estado del plato actual
		item.aplicarBonificacion = aplicarBonificacion;
		
		// Registrar/limpiar preselección ligada al turno actual
		if (aplicarBonificacion) {
			$scope.bonificacionPreSeleccionada = true;
			$scope.turnoBonificacionSeleccionada = ($scope.selectedTurno && $scope.selectedTurno.descripcion) ? $scope.selectedTurno.descripcion : null;
		} else {
			$scope.bonificacionPreSeleccionada = false;
			$scope.turnoBonificacionSeleccionada = null;
		}
		
		if (aplicarBonificacion && $scope.bonificacionDisponible && $scope.cantidadBonificacionesHoy < 1) {
			// Calcular precio con descuento para preview
			var calculo = $scope.calcularPrecioConBonificacion(parseFloat(item.costo) || 0, true);
			item.precioFinal = calculo.precioFinal;
			item.bonificado = calculo.bonificado;
		} else {
			// Restaurar precio original
			item.precioFinal = parseFloat(item.costo) || 0;
			item.bonificado = 0;
		}
		
		console.log('Preview bonificación:', {
			plato: item.descripcion,
			precioOriginal: item.costo,
			precioFinal: item.precioFinal,
			descuento: item.bonificado,
			aplicarBonificacion: aplicarBonificacion,
			bonificacionPreSeleccionada: $scope.bonificacionPreSeleccionada,
			turnoBonificacionSeleccionada: $scope.turnoBonificacionSeleccionada
		});
	};

	////////////////////////////////////////////////ACCIONES SMARTIME////////////////////////////////////////////////
	
	$scope.hacerPedido = function (item) {
		console.log("Se hizo clic en Ordenar", item);

		// Asegurar que el pedido seleccionado quede seteado para el modal/confirmación
		$scope.pedidoSeleccionado = item;

		const cuil = localStorage.getItem("cuil");
		const legajo = localStorage.getItem("legajo");
		const smarTime = localStorage.getItem("smarTime") === 'true';
		const usuarioSmatTime = localStorage.getItem("usuarioSmatTime");

		// Validar si ya tiene pedido en ese turno
		const pedidoExistente = $scope.pedidoVigente.find(pedido =>
			pedido.turno === $scope.selectedTurno.descripcion
		);

		if (pedidoExistente) {
			Swal.fire({
				title: 'Pedido ya registrado en esta franja horaria',
				text: 'No es posible hacer más de un pedido en el mismo horario.',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40',
				allowOutsideClick: false,
				allowEscapeKey: false
			});
			return;
		}

		// === LÓGICA DE BONIFICACIÓN MEJORADA ===
		console.log('=== HACER PEDIDO - ESTADO BONIFICACIÓN ===');
		console.log('bonificacionDisponible:', $scope.bonificacionDisponible);
		console.log('yaBonificadoHoy:', $scope.yaBonificadoHoy);
		console.log('cantidadBonificacionesHoy:', $scope.cantidadBonificacionesHoy);
		console.log('pedidosRestantes:', $scope.pedidosRestantes);
		console.log('item.aplicarBonificacion ANTES:', item.aplicarBonificacion);
		
		// Inicializar bonificaciones si no se ha hecho
		if (!$scope.bonificacionDisponible && !$scope.yaBonificadoHoy) {
			console.log('Inicializando bonificaciones...');
			$scope.inicializarBonificaciones();
		}
		
		// === LÓGICA MEJORADA PARA DETERMINAR SI APLICAR BONIFICACIÓN ===
		// Solo permitir bonificación si:
		// 1. Hay bonificación disponible
		// 2. No se ha usado hoy (cantidadBonificacionesHoy < 1)
		var puedeAplicarBonificacion = $scope.bonificacionDisponible && $scope.cantidadBonificacionesHoy < 1;
		
		// Aplicar bonificación según la selección del usuario en el checkbox
		// Si no se ha inicializado el campo, usar el valor por defecto
		if (item.aplicarBonificacion === undefined) {
			item.aplicarBonificacion = puedeAplicarBonificacion;
			console.log('item.aplicarBonificacion INICIALIZADO A:', item.aplicarBonificacion, '(puedeAplicarBonificacion:', puedeAplicarBonificacion, ')');
		}
		
		// Si no puede aplicar bonificación, forzar a false
		if (!puedeAplicarBonificacion) {
			console.log('No puede aplicar bonificación, forzando a false');
			item.aplicarBonificacion = false;
		}
		
		console.log('item.aplicarBonificacion FINAL:', item.aplicarBonificacion);
		
		// Solo actualizar el preview, NO consumir bonificación aún
		$scope.aplicarBonificacion(item, item.aplicarBonificacion);

		// Seteo valores del pedido en el scope
		$scope.pedidoPlato = item.descripcion;
		$scope.pedidoCodigo = item.codigo;
		$scope.pedidoCosto = item.precioFinal || item.costo; // Usar precio con bonificación si aplica
		$scope.pedidoPresentacion = item.presentacion || $scope.defaultImage;
		$scope.pedidoEstado = 'P';
		$scope.pedidoCalificacion = 1;
		console.log("pasa por aca");
		// Lógica según si se usa SmarTime
		if (smarTime) {
			if ($scope.user_Rol === usuarioSmatTime) {
				$http.get($scope.basePlatos + 'GetSmartTime?legajo=' + legajo)
					.then(function (response) {
						const { usuarioSmarTimePlato, mensajeSmatTime } = response.data;

						if (usuarioSmarTimePlato) {
							mostrarModalConfirmacion();
						} else {
							Swal.fire({
								title: 'Error',
								text: mensajeSmatTime || "El usuario no tiene fichadas en SmarTime",
								icon: 'error',
								confirmButtonText: 'Aceptar',
								confirmButtonColor: '#343A40'
							});
						}
					})
					.catch(function (error) {
						console.error("Error al obtener SmarTime", error);
						Swal.fire({
							title: 'Error',
							text: "Error al obtener SmarTime: " + error.statusText,
							icon: 'error',
							confirmButtonText: 'Aceptar',
							confirmButtonColor: '#343A40'
						});
					});
			} else {
				// Usuario con rol que no requiere control
				mostrarModalConfirmacion();
			}
		} else {
			console.log("mostrarModalConfirmacion");
			mostrarModalConfirmacion();
		}
	};



	$scope.actualizaPedido = function (nuevoEstado) {
		//let calif = $window.document.getElementById('pedidoCalificacion').value;
		$scope.pedidoCalificacion = parseInt($window.document.getElementById('pedidoCalificacion').value) || 0;
	
		var jsonForm = {
			id: $scope.pedidoSeleccionado.user_Pedido.id,
			cod_plato: $scope.pedidoSeleccionado.codigo,
			monto: $scope.pedidoSeleccionado.monto ?? 0,
			estado: nuevoEstado,
			calificacion: $scope.pedidoCalificacion ?? 0,
			planta: $scope.user_Planta,
			proyecto: $scope.user_Proyecto,
			centrodecosto: $scope.user_Centrodecosto,
			user_id: $scope.user_DNI,
			user_name: $scope.user_Nombre,
			user_lastName: $scope.user_Apellido,
			user_fileNumber: $scope.user_legajo,
			fecha_hora: $scope.pedidoSeleccionado.fecha_hora ?? new Date().toISOString()
		};
		console.log("📦 jsonForm enviado actualizaPedido:", jsonForm);
		$http({
			method: 'POST',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.baseComanda + 'Update',
			data: jsonForm
		}).then(function (success) {
		if (success) {
			Swal.fire({
				title: 'Operación correcta',
				text: '',
				icon: 'success',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			}).then(() => {
					cerrarModales();
					recargar();
					//$scope.recargaPagina();
				});
			}
		}, function (error) {
			Swal.fire({
				title: 'Operación Incorrecta',
				text: error,
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
			Swal.fire({
				title: 'Operación Incorrecta',
				text: JSON.stringify(error),
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
		});
	};

	$scope.confirmaPedido = function () { //Aceptar pedido

		var dia = new Date().getDay();
		var mes = new Date().getMonth();
		var anio = new Date().getFullYear();
		var hora = new Date().getHours();
		var hora2 = new Date().getMinutes();
		var fecha = hora + ':' + hora2 + ' ' + dia + '/' + mes + '/' + anio;
		var esInvitado;
		if ($scope.pedidoInvitado === true) {
			esInvitado = true;
		} else {
			esInvitado = false;
		}

		// Blindar acceso a pedidoSeleccionado por si fuese null
		var sel = $scope.pedidoSeleccionado || {};
		var jsonForm = {
			cod_plato: $scope.pedidoCodigo,
			monto: $scope.pedidoCosto,
			estado: $scope.pedidoEstado,
			calificacion: $scope.pedidoCalificacion,
			planta: $scope.user_Planta,
			proyecto: $scope.user_Proyecto,
			centrodecosto: $scope.user_Centrodecosto,
			user_id: $scope.user_DNI,
			user_name: $scope.user_Nombre,
			user_lastName: $scope.user_Apellido,
			user_fileNumber: $scope.user_legajo,
			invitado: esInvitado,
			comentario: $scope.pedidoComentario,
			fecha_hora: fecha,
			// === CAMPOS DE BONIFICACIÓN ===
			precio_original: (sel.costo != null ? sel.costo : ($scope.precioOriginal != null ? $scope.precioOriginal : $scope.pedidoCosto)),
			bonificado: (sel.bonificado != null ? sel.bonificado : ($scope.descuentoAplicado != null ? $scope.descuentoAplicado : 0)),
			porcentaje_bonificacion: $scope.porcentajeBonificacion,
			aplicar_bonificacion: !!(sel.aplicarBonificacion)
		};
		
		console.log('=== 📤 DATOS ENVIADOS A API CREATE PEDIDO ===');
		console.log('URL:', $scope.baseComanda + 'Create');
		console.log('Método:', 'POST');
		console.log('Headers:', {
			"Content-Type": "application/json; charset=utf-8",
			"Authorization": ""
		});
		console.log('Datos del formulario:', jsonForm);
		console.log('=== 🔍 ANÁLISIS DETALLADO DE CAMPOS ===');
		console.log('Código plato:', jsonForm.cod_plato);
		console.log('Monto final:', jsonForm.monto);
		console.log('Precio original:', jsonForm.precio_original);
		console.log('Bonificado:', jsonForm.bonificado);
		console.log('Porcentaje bonificación:', jsonForm.porcentaje_bonificacion);
		console.log('Aplicar bonificación:', jsonForm.aplicar_bonificacion);
		console.log('Estado:', jsonForm.estado);
		console.log('Usuario ID:', jsonForm.user_id);
		console.log('Invitado:', jsonForm.invitado);
		console.log('Fecha:', jsonForm.fecha_hora);
		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.baseComanda + 'Create',
			data: jsonForm
		}).then(function (success) {
			console.log('=== 📥 RESPUESTA DE API CREATE PEDIDO ===');
			console.log('Status de éxito:', success.status);
			console.log('Datos de respuesta:', success.data);
			console.log('Headers de respuesta:', success.headers);
			console.log('Configuración de la petición:', success.config);
			
			if (success) {
				console.log('✅ Pedido creado exitosamente');
				
				// === CONSUMIR BONIFICACIÓN SOLO SI EL PEDIDO SE CREÓ EXITOSAMENTE ===
				if ($scope.pedidoSeleccionado && $scope.pedidoSeleccionado.aplicarBonificacion && 
					$scope.bonificacionDisponible && $scope.cantidadBonificacionesHoy < 1) {
					
					console.log('=== CONSUMIENDO BONIFICACIÓN ===');
					console.log('ANTES - pedidosRestantes:', $scope.pedidosRestantes);
					console.log('ANTES - cantidadBonificacionesHoy:', $scope.cantidadBonificacionesHoy);
					
					// Consumir la bonificación
					$scope.pedidosRestantes = $scope.monitorearPedidosRestantes(0, 'CONFIRMAR_PEDIDO_CONSUMIR');
					$scope.cantidadBonificacionesHoy = 1;
					$scope.yaBonificadoHoy = true;
					
					console.log('DESPUÉS - pedidosRestantes:', $scope.pedidosRestantes);
					console.log('DESPUÉS - cantidadBonificacionesHoy:', $scope.cantidadBonificacionesHoy);
					console.log('✅ Bonificación consumida exitosamente');
				}

				// Limpiar preselección porque ya se consumió o se finalizó el flujo
				$scope.bonificacionPreSeleccionada = false;
				$scope.turnoBonificacionSeleccionada = null;
				
				Swal.fire({
					title: '¡Pedido Enviado!',
					text: '',
					icon: 'success',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#343A40',
					allowOutsideClick: false,
					allowEscapeKey: false
				}).then(() => {					
					cerrarModales();
					recargar();
					//$scope.recargaPagina();
				});
			}
		}, function (error) {
			console.log('=== ❌ ERROR EN API CREATE PEDIDO ===');
			console.log('Status de error:', error.status);
			console.log('Datos de error:', error.data);
			console.log('Headers de error:', error.headers);
			console.log('Configuración de la petición:', error.config);
			console.log('Mensaje de error:', error.statusText);
			Swal.fire({
				title: 'Operación Incorrecta',
				text: JSON.stringify(error),
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#343A40'
			});
		});
	}

	
	$scope.seleccionaPedido = function (pedido) {
		//console.log(pedido); // Verifica el valor de pedido.paraRetirar
		$scope.pedidoSeleccionado = pedido;
	}

	/*$scope.recargaPagina = function () {
		$window.location.reload();
	}*/
	$scope.recargaPagina = function () {
		$scope.init(); // Usamos init en lugar de reload para mantener estado
	};

	// NUEVO: llamada a init al final del controlador
	$scope.init = function () {
		$scope.obtieneComandas();
	};

	$scope.init();

	function cerrarModales() {
		// Cierra y limpia todos los modales activos
		$('.modal').each(function () {
			$(this)
				.removeClass('show')
				.css('display', 'none')
				.attr('aria-hidden', 'true')
				.removeAttr('aria-modal')
				.removeAttr('role');
		});

		// Limpia el fondo oscurecido
		$('.modal-backdrop').remove();

		// Restaura scroll en el body
		$('body').removeClass('modal-open').css('padding-right', '');
		$scope.pedidoSeleccionado = null;
		$scope.pedidoCalificacion = null;
		$scope.mostrarModal = false;
		
	}
	$('#confirmModal').on('hidden.bs.modal', function () {
		$scope.$apply(function () {
			$scope.pedidoSeleccionado = null;
			$scope.pedidoCalificacion = null;
			$scope.mostrarModal = false;
		});
	});

	function mostrarModalConfirmacion() {
		//cerrarModales(); // Cierra cualquier modal previo y limpia estado
		// Fuerza cierre del modal si quedó en estado raro
		$('#confirmModal').modal('hide');

		// Elimina backdrop por las dudas (aunque uses .modal('hide'))
		$('.modal-backdrop').remove();
		$('body').removeClass('modal-open');

		// Después de un pequeño delay, forzá la apertura
		setTimeout(() => {
			$('#confirmModal').modal({
				backdrop: 'static',
				keyboard: false,
				show: true
			});
		}, 200);
	}

	function recargar() {
		$scope.pedidoVigente = []; // limpia antes de recargar
		console.log("🔄 Recargando pedidos...");
		$scope.obtieneComandas(); // recarga los pedidos vigentes
		$scope.$applyAsync(); // asegura que se refleje en el DOM
		//location.reload();
		//$scope.obtieneComandas();
		//$scope.changeTurno();
		
	}

	$('#confirmModal').on('shown.bs.modal', function () {
		console.log("✅ Modal mostrado correctamente");
	});
	$('#confirmModal').on('hidden.bs.modal', function () {
		console.log("🔙 Modal cerrado");
	});
});
