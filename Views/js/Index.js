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
						confirmButtonColor: '#F34949',
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
						confirmButtonColor: '#F34949',
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
								confirmButtonColor: '#F34949',
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
								confirmButtonColor: '#F34949',
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
				} else if (rejection.status >= 500) {
					// Error del servidor
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
						confirmButtonColor: '#F34949',
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
					mostrarErrorBackend(true);
				} else if (tiempoTranscurrido < 2000) {
					// Entre 500ms y 2 segundos, puede ser CORS o conexión rechazada
					// Como el usuario está viendo el error de CORS en la consola, asumimos CORS
					esCORS = true;
					mostrarErrorBackend(true);
				} else {
					// Error después de mucho tiempo sugiere que el backend no está corriendo
					mostrarErrorBackend(false);
				}
			};
			
			xhr.onload = function() {
				clearTimeout(timeoutID);
				clearTimeout(errorTimeoutID);
				// Si hay respuesta (incluso si es error), el backend está corriendo
				if (xhr.status >= 200 && xhr.status < 500) {
					verificacionCompletada = true;
				} else {
					// Error del servidor, pero backend está corriendo
					verificacionCompletada = true;
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
				} else {
					verificacionCompletada = true;
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
	
	//usuario SmarTime
	$scope.smarTime = localStorage.getItem('SmarTime');
	$scope.usuarioSmatTime = localStorage.getItem('usuarioSmatTime');
	$scope.tipoVisualizacionCodigo = localStorage.getItem('tipoVisualizacionCodigo') || 'QR';//Barra
	//alert("Tipo de visualización:", $scope.tipoVisualizacionCodigo);
	////////////////////////////////////////////////INICIALIZACIONES////////////////////////////////////////////////
	// Llamada automática al iniciar
	
	$scope.changeTurno = function () {
		$scope.dataset = [];
		$scope.menuDatasetSeleccionado = [];

		if (!$scope.selectedTurno || typeof $scope.selectedTurno === 'string' || !$scope.selectedTurno.descripcion) {
			$scope.isLoading = false;
			return;
		}

		const ahora = new Date();
		const hoy = ahora.getFullYear() + '-' +
			String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
			String(ahora.getDate()).padStart(2, '0');


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
			if (Array.isArray(response.data)) {
				$scope.menuDatasetSeleccionado = response.data;
				$scope.filtraPlatos();
			}
		}).catch(function (error) {
			// Manejar el error de forma silenciosa - no bloquear la aplicación
			$scope.isLoading = false;
			
			// No mostrar modales de error, simplemente continuar
			$scope.menuDatasetSeleccionado = [];
			$scope.dataset = [];
			
			// Log silencioso para desarrollo
			if (typeof AppConfig !== 'undefined' && AppConfig.development.logApiCalls) {
			}
		});
	};


	$scope.filtraPlatos = function () {
		$scope.dataset = [];

		// Si no hay datos del menú, simplemente continuar sin mostrar nada
		if (!$scope.menuDatasetSeleccionado || $scope.menuDatasetSeleccionado.length === 0) {
			$scope.isLoading = false;
			return;
		}

		$scope.menuDatasetSeleccionado.forEach(menuItem => {
			const plato = $scope.platos.find(o => o.descripcion.trim() === menuItem.plato.trim());

			if (!plato) {
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
			$scope.platos = response.data;
			return $http.get($scope.baseTurno + 'GetTurnosDisponibles');
		})
		.then(function (response) {
			
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
			
			if (Array.isArray(response.data)) {
				$scope.menudeldia = response.data;

				// Solo llamá a changeTurno si hay un selectedTurno válido
				if ($scope.selectedTurno && $scope.selectedTurno.descripcion) {
					$scope.changeTurno();
				} else {
				}
			} else {
			}
		})
		.catch(function (error) {
			$scope.menudeldia = [];
			$scope.isLoading = false;
		})
		.catch(function (error) {
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
		
		if (!$scope.turnoElegidoManual) {
			if (turnoActual) {
				$scope.selectedTurno = turnoActual;
				$scope.turnoDisponible = true;
			} else if (proximoTurno) {
				$scope.selectedTurno = proximoTurno;
				$scope.turnoDisponible = true;
			} else {
				showInfoToast('Sin turnos disponibles para hoy.');
			}

			if ($scope.selectedTurno) {
				$scope.changeTurno();
			} else {
				$scope.isLoading = false;
			}
		} else {
		}
	};

	$scope.onTurnoChanged = function () {
		// FORZAR SINCRONIZACIÓN: Leer directamente del DOM
		var selectElement = document.getElementById('turno');
		var selectedIndex = selectElement ? selectElement.selectedIndex : -1;
		var selectedValue = selectElement ? selectElement.value : null;
		
		// Obtener el objeto completo del turno seleccionado
		if (selectedIndex >= 0 && $scope.turnoDataset && $scope.turnoDataset[selectedIndex]) {
			var turnoSeleccionado = $scope.turnoDataset[selectedIndex];
			
			// FORZAR ACTUALIZACIÓN DEL SCOPE
			$scope.$apply(function() {
				$scope.selectedTurno = turnoSeleccionado;
				$scope.turnoElegidoManual = true;
			});
			
			// Procesar el cambio
			if ($scope.selectedTurno && $scope.selectedTurno.descripcion) {
				$scope.changeTurno();
			}
		}
	};
	
	// Watch para detectar cambios en selectedTurno
	$scope.$watch('selectedTurno', function(newVal, oldVal) {
		if (newVal && newVal !== oldVal) {
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
				$scope.onTurnoChanged();
			};
			
			selectElement.addEventListener('change', $scope.handleTurnoChange);
		} else {
		}
	};

	$scope.obtieneComandas = function () {
		var id = $scope.user_DNI;
		var url = $scope.baseComanda + 'getPedido/' + id;


		$http.get(url)
			.success(function (data) {
				$timeout(function () {
					var pedidosNoC = data.filter(function (elemento) {
						return elemento.estado !== 'C';
					});

					$scope.pedidosGastados = pedidosNoC.length;
					// NO modificar pedidosRestantes aquí, se maneja en el sistema de bonificaciones

					var pedidosInvitados = 0;
					$scope.pedidoVigente = []; // reinicio para evitar duplicados

					// Validar si hay pedidos con bonificación aplicada
					var tieneBonificacionEnPedidosVigentes = false;
					var fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
					
					data.forEach(x => {
						var plato = $scope.platos.find(o => o.codigo === x.cod_plato);
						if (!plato) return;

						plato = angular.copy(plato); // para evitar modificar el array original

						// Validar si este pedido tiene bonificación aplicada y es del día de hoy
						if (x.bonificado !== null && x.bonificado !== undefined && x.bonificado !== '') {
							var bonificadoValue = parseFloat(x.bonificado) || 0;
							if (bonificadoValue > 0) {
								// Verificar que sea del día de hoy
								var fechaPedido = null;
								if (x.fecha_hora) {
									var fechaHoraStr = String(x.fecha_hora);
									try {
										fechaPedido = new Date(fechaHoraStr).toISOString().split('T')[0];
										if (fechaPedido === 'Invalid Date') {
											fechaPedido = null;
										}
									} catch (e) {
										fechaPedido = null;
									}
									
									// Si falla, intentar parseo manual
									if (!fechaPedido || fechaPedido === 'Invalid Date') {
										var m1 = fechaHoraStr.match(/(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
										if (m1) {
											var dd = m1[3].padStart(2, '0');
											var mm = m1[4].padStart(2, '0');
											var yyyy = m1[5];
											fechaPedido = yyyy + '-' + mm + '-' + dd;
										} else {
											var m2 = fechaHoraStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
											if (m2) {
												var dd = m2[1].padStart(2, '0');
												var mm = m2[2].padStart(2, '0');
												var yyyy = m2[3];
												fechaPedido = yyyy + '-' + mm + '-' + dd;
											}
										}
									}
								} else if (x.fecha) {
									try {
										var f = x.fecha;
										fechaPedido = (new Date(f)).toISOString().split('T')[0];
										if (fechaPedido === 'Invalid Date') {
											fechaPedido = x.fecha;
										}
									} catch (e) {
										fechaPedido = x.fecha;
									}
								}
								
								// Si es del día de hoy y tiene bonificación, y el estado no es cancelado ni devuelto
								if (fechaPedido === fechaHoy && (x.estado !== 'C' && x.estado !== 'D')) {
									tieneBonificacionEnPedidosVigentes = true;
								}
							}
						}

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
					
					// Si hay bonificación en pedidos vigentes, actualizar el estado
					if (tieneBonificacionEnPedidosVigentes) {
						$scope.cantidadBonificacionesHoy = 1;
						$scope.yaBonificadoHoy = true;
						$scope.pedidosRestantes = 0;
						$scope.guardarEstadoBonificacion();
					}

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
				confirmButtonColor: '#F34949'
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
				$scope.pedidosInvitadosRestantes = $scope.user_BonificacionInvitado - pedidosInvitados;

			})
		.catch(function () {
			Swal.fire({
				title: 'Ha ocurrido un error',
				text: 'Error al obtener pedidos',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
			});
	};*/



	////////////////////////////////////////////////SISTEMA DE BONIFICACIONES////////////////////////////////////////////////
	
	// Funciones auxiliares para persistir el estado de bonificaciones en localStorage
	$scope.guardarEstadoBonificacion = function() {
		try {
			var fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
			var clave = 'bonificacion_' + $scope.user_DNI + '_' + fechaHoy;
			var estado = {
				cantidadBonificacionesHoy: $scope.cantidadBonificacionesHoy,
				yaBonificadoHoy: $scope.yaBonificadoHoy,
				pedidosRestantes: $scope.pedidosRestantes,
				fecha: fechaHoy
			};
			localStorage.setItem(clave, JSON.stringify(estado));
		} catch (e) {
			// Si hay error al guardar, continuar sin localStorage
		}
	};
	
	$scope.cargarEstadoBonificacion = function() {
		try {
			var fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
			var clave = 'bonificacion_' + $scope.user_DNI + '_' + fechaHoy;
			var estadoGuardado = localStorage.getItem(clave);
			if (estadoGuardado) {
				var estado = JSON.parse(estadoGuardado);
				// Solo usar el estado guardado si es del mismo día
				if (estado.fecha === fechaHoy) {
					return estado;
				} else {
					// Si es de otro día, limpiar el localStorage
					localStorage.removeItem(clave);
				}
			}
		} catch (e) {
			// Si hay error al cargar, continuar sin localStorage
		}
		return null;
	};
	
	$scope.limpiarEstadoBonificacion = function() {
		try {
			var fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
			var clave = 'bonificacion_' + $scope.user_DNI + '_' + fechaHoy;
			localStorage.removeItem(clave);
		} catch (e) {
			// Si hay error al limpiar, continuar sin localStorage
		}
	};
	
	// Inicializar sistema de bonificaciones al cargar la página
	$scope.inicializarBonificaciones = function() {
		if (!window.BonificacionesService) {
			$scope.pedidosRestantes = 0;
			return;
		}
		
		// Cargar estado guardado desde localStorage
		var estadoGuardado = $scope.cargarEstadoBonificacion();
		if (estadoGuardado && estadoGuardado.cantidadBonificacionesHoy >= 1) {
			// Si hay un estado guardado que indica que ya se usó la bonificación, usarlo temporalmente
			// hasta que el servidor confirme (ahora que contamos estado 'P' también, debería confirmar correctamente)
			$scope.cantidadBonificacionesHoy = estadoGuardado.cantidadBonificacionesHoy;
			$scope.yaBonificadoHoy = estadoGuardado.yaBonificadoHoy;
			$scope.pedidosRestantes = estadoGuardado.pedidosRestantes;
		}
		
		// Obtener bonificación para el perfil del usuario
		window.BonificacionesService.obtenerBonificacion($scope.user_Rol)
			.then(function(bonificacion) {
				$scope.porcentajeBonificacion = bonificacion.porcentaje;
				$scope.bonificacionDisponible = bonificacion.porcentaje > 0;
				
				// Inicializar pedidos restantes solo si NO hay bonificación disponible
				if (!$scope.bonificacionDisponible) {
					$scope.pedidosRestantes = 0;
				}
				
				// Verificar si ya se usó la bonificación hoy (esto actualizará pedidosRestantes correctamente)
				// Ahora que contamos estado 'P' también, debería confirmar correctamente
				return $scope.verificarBonificacionHoy();
			})
			.catch(function(error) {
				$scope.bonificacionDisponible = false;
				$scope.porcentajeBonificacion = 0;
				$scope.pedidosRestantes = 0;
			});
	};
	
	// Verificar si ya se usó la bonificación hoy
	// Valida usando SOLO el campo bonificado de sl_comanda
	$scope.verificarBonificacionHoy = function() {
		var fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		var url = $scope.baseComanda + 'getPedido/' + $scope.user_DNI;
		
		return $http.get(url)
			.then(function(response) {
				var data = response.data || [];
				
				// Filtrar pedidos del día que tengan bonificado > 0
				// SOLO usar el campo bonificado para validar
				var pedidosBonificados = data.filter(function(pedido) {
					// Validar campo bonificado: si tiene valor > 0, se usó la bonificación
					var bonificadoValue = 0;
					if (pedido.bonificado !== null && pedido.bonificado !== undefined && pedido.bonificado !== '') {
						bonificadoValue = parseFloat(pedido.bonificado) || 0;
					}
					
					// Validar fecha: debe ser del día de hoy
					var esDelDia = false;
					if (pedido.fecha_hora) {
						var fechaHoraStr = String(pedido.fecha_hora);
						var fechaPedido = null;
						
						// Intentar parseo con Date nativo
						try {
							fechaPedido = new Date(fechaHoraStr).toISOString().split('T')[0];
							if (fechaPedido === 'Invalid Date') {
								fechaPedido = null;
							}
						} catch (e) {
							fechaPedido = null;
						}
						
						// Si falla, intentar parseo manual
						if (!fechaPedido || fechaPedido === 'Invalid Date') {
							// Formato: "h:mm dd/mm/yyyy" o "dd/mm/yyyy hh:mm"
							var m1 = fechaHoraStr.match(/(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
							if (m1) {
								var dd = m1[3].padStart(2, '0');
								var mm = m1[4].padStart(2, '0');
								var yyyy = m1[5];
								fechaPedido = yyyy + '-' + mm + '-' + dd;
							} else {
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
					} else if (pedido.fecha) {
						try {
							var f = pedido.fecha;
							var fIso = (new Date(f)).toISOString().split('T')[0];
							esDelDia = fIso === fechaHoy || f === fechaHoy;
						} catch (e) {
							esDelDia = pedido.fecha === fechaHoy;
						}
					}
					
					// Validar estado: NO contar si está cancelado ('C') o devuelto ('D')
					var estado = (pedido.estado || '').toString().trim().toUpperCase();
					var estadoValido = estado !== 'C' && estado !== 'D';
					
					// Solo cuenta si: es del día, tiene bonificado > 0, y estado válido
					return esDelDia && bonificadoValue > 0 && estadoValido;
				});
				
				// Verificar si hay un estado guardado en localStorage que indique que se usó la bonificación
				var estadoGuardado = $scope.cargarEstadoBonificacion();
				var yaBonificadoLocal = estadoGuardado && estadoGuardado.cantidadBonificacionesHoy >= 1;
				
				// Actualizar variables del scope
				var cantidadBonificados = pedidosBonificados.length;
				
				// Si el servidor confirma que hay bonificaciones, usar ese valor
				// Si no hay confirmación del servidor pero hay estado guardado local, respetar el estado local
				if (cantidadBonificados >= 1) {
					$scope.yaBonificadoHoy = true;
					$scope.cantidadBonificacionesHoy = cantidadBonificados;
					$scope.guardarEstadoBonificacion();
				} else if (yaBonificadoLocal) {
					// Si hay estado local que indica que se usó, mantenerlo hasta que el servidor confirme
					$scope.yaBonificadoHoy = true;
					$scope.cantidadBonificacionesHoy = 1;
					// No limpiar el localStorage, mantener el estado
				} else {
					$scope.yaBonificadoHoy = false;
					$scope.cantidadBonificacionesHoy = 0;
					$scope.limpiarEstadoBonificacion();
				}
				
				// Actualizar pedidosRestantes según si se usó o no la bonificación
				if ($scope.bonificacionDisponible) {
					$scope.pedidosRestantes = $scope.cantidadBonificacionesHoy >= 1 ? 0 : 1;
				} else {
					$scope.pedidosRestantes = 0;
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
				// En caso de error, verificar si hay estado guardado en localStorage
				var estadoGuardado = $scope.cargarEstadoBonificacion();
				if (estadoGuardado && estadoGuardado.cantidadBonificacionesHoy >= 1) {
					$scope.yaBonificadoHoy = true;
					$scope.cantidadBonificacionesHoy = 1;
					$scope.pedidosRestantes = 0;
				} else {
				$scope.yaBonificadoHoy = false;
					$scope.cantidadBonificacionesHoy = 0;
					$scope.pedidosRestantes = $scope.bonificacionDisponible ? 1 : 0;
				}
				
				// === VALIDACIÓN: NUNCA NEGATIVO ===
				if ($scope.pedidosRestantes < 0) {
					$scope.pedidosRestantes = 0;
				}
				if (!$scope.$$phase) {
				$scope.$apply();
				}
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
		
		
		return resultado;
	};
	
	// Aplicar bonificación a un plato (solo preview, no consume bonificación)
	$scope.aplicarBonificacion = function(item, aplicarBonificacion) {
		
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
	};

	////////////////////////////////////////////////ACCIONES SMARTIME////////////////////////////////////////////////
	
	$scope.hacerPedido = function (item) {

		// Asegurar que el pedido seleccionado quede seteado para el modal/confirmación
		$scope.pedidoSeleccionado = item;

		const cuil = localStorage.getItem("cuil");
		const legajo = localStorage.getItem("legajo");
		const smarTime = localStorage.getItem("smarTime") === 'true';
		const usuarioSmatTime = localStorage.getItem("usuarioSmatTime");

		// Validar si ya tiene pedido en el mismo turno del mismo día
		var fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		var turnoActual = $scope.selectedTurno ? $scope.selectedTurno.descripcion : null;
		
		if (!turnoActual) {
			Swal.fire({
				title: 'Error',
				text: 'No se ha seleccionado un turno válido.',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
			return;
		}
		
		// Obtener el código del plato que se está intentando pedir
		var codPlatoActual = item.codigo || item.cod_plato;
		var descripcionPlatoActual = item.descripcion || item.plato_descripcion;
		
		// Verificar en pedidos vigentes (estado 'P' o 'E') si hay alguno en el mismo turno del día de hoy
		var pedidoMismoTurnoHoy = $scope.pedidoVigente.find(function(pedido) {
			if (!pedido.user_Pedido) return false;
			
			// Verificar que sea del día de hoy
			var fechaPedido = null;
			if (pedido.user_Pedido.fecha_hora) {
				var fechaHoraStr = String(pedido.user_Pedido.fecha_hora);
				try {
					fechaPedido = new Date(fechaHoraStr).toISOString().split('T')[0];
					if (fechaPedido === 'Invalid Date') {
						fechaPedido = null;
					}
				} catch (e) {
					fechaPedido = null;
				}
				
				// Si falla, intentar parseo manual
				if (!fechaPedido || fechaPedido === 'Invalid Date') {
					var m1 = fechaHoraStr.match(/(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
					if (m1) {
						var dd = m1[3].padStart(2, '0');
						var mm = m1[4].padStart(2, '0');
						var yyyy = m1[5];
						fechaPedido = yyyy + '-' + mm + '-' + dd;
					} else {
						var m2 = fechaHoraStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
						if (m2) {
							var dd = m2[1].padStart(2, '0');
							var mm = m2[2].padStart(2, '0');
							var yyyy = m2[3];
							fechaPedido = yyyy + '-' + mm + '-' + dd;
						}
					}
				}
			} else if (pedido.user_Pedido.fecha) {
				try {
					var f = pedido.user_Pedido.fecha;
					fechaPedido = (new Date(f)).toISOString().split('T')[0];
					if (fechaPedido === 'Invalid Date') {
						fechaPedido = pedido.user_Pedido.fecha;
					}
				} catch (e) {
					fechaPedido = pedido.user_Pedido.fecha;
				}
			}
			
			// Si no es del día de hoy, no cuenta
			if (fechaPedido !== fechaHoy) return false;
			
			// Verificar si el plato del pedido existente está en el menú del turno actual
			// Si está, significa que ese pedido fue hecho en este turno
			var codPlatoPedido = pedido.codigo || pedido.user_Pedido.cod_plato;
			var platoEnTurnoActual = false;
			
			// Buscar el plato en el menú del turno actual
			if ($scope.menuDatasetSeleccionado && $scope.menuDatasetSeleccionado.length > 0) {
				platoEnTurnoActual = $scope.menuDatasetSeleccionado.some(function(menu) {
					return (menu.cod_plato === codPlatoPedido || 
							menu.plato === codPlatoPedido ||
							(menu.plato_descripcion && menu.plato_descripcion === pedido.descripcion));
				});
			}
			
			// Si el plato del pedido existente está en el menú del turno actual, significa que ya hay un pedido en este turno
			return platoEnTurnoActual;
		});
		
		// Validar si ya se pidió el mismo plato específico en el mismo turno del mismo día
		var pedidoMismoPlatoHoy = $scope.pedidoVigente.find(function(pedido) {
			if (!pedido.user_Pedido) return false;
			
			// Verificar que sea del día de hoy
			var fechaPedido = null;
			if (pedido.user_Pedido.fecha_hora) {
				var fechaHoraStr = String(pedido.user_Pedido.fecha_hora);
				try {
					fechaPedido = new Date(fechaHoraStr).toISOString().split('T')[0];
					if (fechaPedido === 'Invalid Date') {
						fechaPedido = null;
					}
				} catch (e) {
					fechaPedido = null;
				}
				
				// Si falla, intentar parseo manual
				if (!fechaPedido || fechaPedido === 'Invalid Date') {
					var m1 = fechaHoraStr.match(/(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
					if (m1) {
						var dd = m1[3].padStart(2, '0');
						var mm = m1[4].padStart(2, '0');
						var yyyy = m1[5];
						fechaPedido = yyyy + '-' + mm + '-' + dd;
					} else {
						var m2 = fechaHoraStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
						if (m2) {
							var dd = m2[1].padStart(2, '0');
							var mm = m2[2].padStart(2, '0');
							var yyyy = m2[3];
							fechaPedido = yyyy + '-' + mm + '-' + dd;
						}
					}
				}
			} else if (pedido.user_Pedido.fecha) {
				try {
					var f = pedido.user_Pedido.fecha;
					fechaPedido = (new Date(f)).toISOString().split('T')[0];
					if (fechaPedido === 'Invalid Date') {
						fechaPedido = pedido.user_Pedido.fecha;
					}
				} catch (e) {
					fechaPedido = pedido.user_Pedido.fecha;
				}
			}
			
			// Si no es del día de hoy, no cuenta
			if (fechaPedido !== fechaHoy) return false;
			
			// Obtener el código del plato del pedido existente
			var codPlatoPedido = pedido.codigo || pedido.user_Pedido.cod_plato;
			var descripcionPlatoPedido = pedido.descripcion || pedido.user_Pedido.plato_descripcion;
			
			// Verificar si el plato del pedido existente está en el menú del turno actual
			var platoEnTurnoActual = false;
			if ($scope.menuDatasetSeleccionado && $scope.menuDatasetSeleccionado.length > 0) {
				platoEnTurnoActual = $scope.menuDatasetSeleccionado.some(function(menu) {
					return (menu.cod_plato === codPlatoPedido || 
							menu.plato === codPlatoPedido ||
							(menu.plato_descripcion && menu.plato_descripcion === descripcionPlatoPedido));
				});
			}
			
			// Si el plato está en el turno actual, verificar si es el mismo plato que se está intentando pedir
			if (platoEnTurnoActual) {
				// Comparar por código de plato
				if (codPlatoPedido && codPlatoActual && 
					(codPlatoPedido === codPlatoActual || 
					 codPlatoPedido === item.cod_plato ||
					 codPlatoActual === pedido.user_Pedido.cod_plato)) {
					return true;
				}
				
				// Comparar por descripción si no hay código
				if (descripcionPlatoPedido && descripcionPlatoActual && 
					descripcionPlatoPedido === descripcionPlatoActual) {
					return true;
				}
			}
			
			return false;
		});

		if (pedidoMismoTurnoHoy) {
			Swal.fire({
				title: 'Ya tienes un pedido en este turno',
				text: 'No es posible hacer más de un pedido en el mismo turno del mismo día.',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949',
				allowOutsideClick: false,
				allowEscapeKey: false
			});
			return;
		}
		
		// Validar si ya se pidió el mismo plato específico
		if (pedidoMismoPlatoHoy) {
			Swal.fire({
				title: 'Ya pediste este plato',
				text: 'No es posible pedir el mismo plato dos veces en el mismo turno del mismo día.',
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949',
				allowOutsideClick: false,
				allowEscapeKey: false
			});
			return;
		}

		// === LÓGICA DE BONIFICACIÓN MEJORADA ===
		// Inicializar bonificaciones si no se ha hecho
		if (!$scope.bonificacionDisponible && !$scope.yaBonificadoHoy) {
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
		}
		
		// Si no puede aplicar bonificación, forzar a false
		if (!puedeAplicarBonificacion) {
			item.aplicarBonificacion = false;
		}
		
		
		// Solo actualizar el preview, NO consumir bonificación aún
		$scope.aplicarBonificacion(item, item.aplicarBonificacion);

		// Seteo valores del pedido en el scope
		$scope.pedidoPlato = item.descripcion;
		$scope.pedidoCodigo = item.codigo;
		$scope.pedidoCosto = item.precioFinal || item.costo; // Usar precio con bonificación si aplica
		$scope.pedidoPresentacion = item.presentacion || $scope.defaultImage;
		$scope.pedidoEstado = 'P';
		$scope.pedidoCalificacion = 1;
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
								confirmButtonColor: '#F34949'
							});
						}
					})
					.catch(function (error) {
						Swal.fire({
							title: 'Error',
							text: "Error al obtener SmarTime: " + error.statusText,
							icon: 'error',
							confirmButtonText: 'Aceptar',
							confirmButtonColor: '#F34949'
						});
					});
			} else {
				// Usuario con rol que no requiere control
				mostrarModalConfirmacion();
			}
		} else {
			mostrarModalConfirmacion();
		}
	};



	$scope.actualizaPedido = function (nuevoEstado) {
		//let calif = $window.document.getElementById('pedidoCalificacion').value;
		$scope.pedidoCalificacion = parseInt($window.document.getElementById('pedidoCalificacion').value) || 0;
	
		// Verificar si el pedido tenía bonificación y obtener el valor
		var pedidoTeniaBonificacion = false;
		var bonificadoValue = 0;
		if ($scope.pedidoSeleccionado && $scope.pedidoSeleccionado.user_Pedido) {
			var bonificadoOriginal = $scope.pedidoSeleccionado.user_Pedido.bonificado;
			if (bonificadoOriginal !== null && bonificadoOriginal !== undefined && bonificadoOriginal !== '') {
				bonificadoValue = parseFloat(bonificadoOriginal) || 0;
				pedidoTeniaBonificacion = bonificadoValue > 0;
			}
		}
	
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
			fecha_hora: $scope.pedidoSeleccionado.fecha_hora ?? new Date().toISOString(),
			bonificado: bonificadoValue // Incluir el campo bonificado al actualizar
		};
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
			// Si se recibió ('R') un pedido con bonificación, consumir la bonificación
			if (nuevoEstado === 'R' && pedidoTeniaBonificacion) {
				// Consumir la bonificación
				$scope.cantidadBonificacionesHoy = 1;
				$scope.yaBonificadoHoy = true;
				if ($scope.bonificacionDisponible) {
					$scope.pedidosRestantes = 0;
				}
				
				// Guardar el estado en localStorage
				$scope.guardarEstadoBonificacion();
				
				// Forzar actualización de la vista
				if (!$scope.$$phase) {
					$scope.$apply();
				}
				
				// Verificar nuevamente el estado de bonificaciones desde el servidor
				$timeout(function() {
					$scope.verificarBonificacionHoy();
				}, 1000);
			}
			// Si se canceló ('C') o devolvió ('D') un pedido con bonificación, restaurar el descuento
			else if ((nuevoEstado === 'C' || nuevoEstado === 'D') && pedidoTeniaBonificacion) {
				// Restaurar el descuento
				$scope.cantidadBonificacionesHoy = 0;
				$scope.yaBonificadoHoy = false;
				if ($scope.bonificacionDisponible) {
					$scope.pedidosRestantes = 1;
				}
				
				// Limpiar el estado guardado en localStorage
				$scope.limpiarEstadoBonificacion();
				
				// Forzar actualización de la vista
				if (!$scope.$$phase) {
					$scope.$apply();
				}
				
				// Verificar nuevamente el estado de bonificaciones desde el servidor
				$timeout(function() {
					$scope.verificarBonificacionHoy();
				}, 500);
			}
			
			Swal.fire({
				title: 'Operación correcta',
				text: '',
				icon: 'success',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			}).then(() => {
					cerrarModales();
					recargar();
				});
			}
		}, function (error) {
			Swal.fire({
				title: 'Operación Incorrecta',
				text: error,
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
			Swal.fire({
				title: 'Operación Incorrecta',
				text: JSON.stringify(error),
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
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
		$http({
			method: 'post',
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Authorization": ""
			},
			url: $scope.baseComanda + 'Create',
			data: jsonForm
		}).then(function (success) {
			if (success) {
				// === CONSUMIR BONIFICACIÓN SOLO SI EL PEDIDO SE CREÓ EXITOSAMENTE ===
				if ($scope.pedidoSeleccionado && $scope.pedidoSeleccionado.aplicarBonificacion && 
					$scope.bonificacionDisponible && $scope.cantidadBonificacionesHoy < 1) {
					
					// Consumir la bonificación inmediatamente
					$scope.pedidosRestantes = 0;
					$scope.cantidadBonificacionesHoy = 1;
					$scope.yaBonificadoHoy = true;
					
					// Guardar el estado en localStorage para persistir después de recargar
					$scope.guardarEstadoBonificacion();
					
					// Forzar actualización de la vista
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}

				// Limpiar preselección porque ya se consumió o se finalizó el flujo
				$scope.bonificacionPreSeleccionada = false;
				$scope.turnoBonificacionSeleccionada = null;
				
				// Verificar nuevamente el estado de bonificaciones desde el servidor después de más tiempo
				// para que el servidor tenga tiempo de guardar el campo bonificado
				$timeout(function() {
					$scope.verificarBonificacionHoy();
				}, 3000);
				
				Swal.fire({
					title: '¡Pedido Enviado!',
					text: '',
					icon: 'success',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949',
					allowOutsideClick: false,
					allowEscapeKey: false
				}).then(() => {					
					cerrarModales();
					recargar();
				});
			}
		}, function (error) {
			Swal.fire({
				title: 'Operación Incorrecta',
				text: JSON.stringify(error),
				icon: 'error',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#F34949'
			});
		});
	}

	
	$scope.seleccionaPedido = function (pedido) {
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
		$scope.obtieneComandas(); // recarga los pedidos vigentes
		$scope.$applyAsync(); // asegura que se refleje en el DOM
		//location.reload();
		//$scope.obtieneComandas();
		//$scope.changeTurno();
		
	}

	$('#confirmModal').on('shown.bs.modal', function () {
	});
	$('#confirmModal').on('hidden.bs.modal', function () {
	});
});
