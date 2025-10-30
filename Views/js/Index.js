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
	$scope.baseMenu = 'http://localhost:8000/api/menudd/';
	$scope.basePlatos = 'http://localhost:8000/api/plato/';
	$scope.baseComanda = 'http://localhost:8000/api/comanda/';
	$scope.baseTurno = 'http://localhost:8000/api/turno/';
	$scope.base = 'http://localhost:8000/api/jerarquia/';
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
	$scope.pedidosRestantes = '';
	$scope.pedidosInvitadosRestantes = '';
	$scope.selectedTurno = null;
	$scope.mostrarModal = false;
	$scope.turnoDisponible = true;
	
	// === Variables para sistema de bonificaciones ===
	$scope.bonificacionDisponible = false;
	$scope.porcentajeBonificacion = 0;
	$scope.yaBonificadoHoy = false;
	$scope.cantidadBonificacionesHoy = 0;
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
	$scope.verificarBonificacionHoy = function() {
		var fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		
		console.log('=== VERIFICANDO BONIFICACIÓN HOY ===');
		console.log('fechaHoy:', fechaHoy);
		console.log('user_DNI:', $scope.user_DNI);
		console.log('pedidosRestantes ANTES VERIFICAR:', $scope.pedidosRestantes);
		console.log('bonificacionDisponible ANTES VERIFICAR:', $scope.bonificacionDisponible);
		console.log('yaBonificadoHoy ANTES VERIFICAR:', $scope.yaBonificadoHoy);
		
		return window.BonificacionesService.verificarBonificacionHoy($scope.user_DNI, fechaHoy)
			.then(function(resultado) {
				console.log('Verificación de bonificación hoy:', resultado);
				$scope.yaBonificadoHoy = resultado.yaBonificado;
				$scope.cantidadBonificacionesHoy = resultado.cantidadBonificados;
				
				// === LÓGICA MEJORADA DE "TE QUEDAN PLATOS BONIFICADOS" ===
				// Si hay bonificación disponible:
				// - Si ya se usó hoy (cantidad >= 1): mostrar 0
				// - Si no se ha usado hoy (cantidad = 0): mostrar 1
				if ($scope.bonificacionDisponible) {
					var nuevoValor = $scope.cantidadBonificacionesHoy >= 1 ? 0 : 1;
					$scope.pedidosRestantes = $scope.monitorearPedidosRestantes(nuevoValor, 'VERIFICAR_BONIFICACION_CON_BONIFICACION');
					console.log('pedidosRestantes CON BONIFICACIÓN:', $scope.pedidosRestantes, '(cantidadBonificacionesHoy:', $scope.cantidadBonificacionesHoy, ')');
				} else {
					// Si no hay bonificación disponible, mantener en 0
					$scope.pedidosRestantes = $scope.monitorearPedidosRestantes(0, 'VERIFICAR_BONIFICACION_SIN_BONIFICACION');
					console.log('pedidosRestantes SIN BONIFICACIÓN:', $scope.pedidosRestantes);
				}
				
				// === VALIDACIÓN: NUNCA NEGATIVO ===
				if ($scope.pedidosRestantes < 0) {
					console.warn('⚠️ pedidosRestantes NEGATIVO DETECTADO:', $scope.pedidosRestantes, '→ CORRIGIENDO A 0');
					$scope.pedidosRestantes = 0;
				}
				
				console.log('Pedidos restantes actualizados:', $scope.pedidosRestantes);
				console.log('yaBonificadoHoy DESPUÉS VERIFICAR:', $scope.yaBonificadoHoy);
				console.log('cantidadBonificacionesHoy DESPUÉS VERIFICAR:', $scope.cantidadBonificacionesHoy);
				console.log('bonificacionDisponible DESPUÉS VERIFICAR:', $scope.bonificacionDisponible);
				$scope.$apply();
			})
			.catch(function(error) {
				console.error('Error verificando bonificación:', error);
				$scope.yaBonificadoHoy = false;
				$scope.cantidadBonificacionesHoy = 0;
				$scope.pedidosRestantes = $scope.monitorearPedidosRestantes($scope.bonificacionDisponible ? 1 : 0, 'ERROR_CATCH_VERIFICAR');
				
				// === VALIDACIÓN: NUNCA NEGATIVO ===
				if ($scope.pedidosRestantes < 0) {
					console.warn('⚠️ pedidosRestantes NEGATIVO DETECTADO EN CATCH:', $scope.pedidosRestantes, '→ CORRIGIENDO A 0');
					$scope.pedidosRestantes = 0;
				}
				
				console.log('pedidosRestantes ERROR CATCH:', $scope.pedidosRestantes);
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
