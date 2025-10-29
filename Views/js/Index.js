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
				planta: $scope.user_Planta,
				centro: $scope.user_Centrodecosto,
				jerarquia: $scope.user_Jerarquia,
				proyecto: $scope.user_Proyecto,
				turno: $scope.selectedTurno.descripcion,
				fecha: hoy
			}
		}).then(function (response) {
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

		$http.get($scope.baseComanda + 'getPedido/' + id)
			.success(function (data) {
				$timeout(function () {
					var pedidosNoC = data.filter(function (elemento) {
						return elemento.estado !== 'C';
					});

					$scope.pedidosGastados = pedidosNoC.length;
					$scope.pedidosRestantes = $scope.user_Bonificacion - $scope.pedidosGastados;

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

					$scope.pedidosRestantes = $scope.user_Bonificacion - $scope.pedidosGastados + pedidosInvitados;
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
				$scope.pedidosRestantes = $scope.user_Bonificacion - $scope.pedidosGastados;

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

				$scope.pedidosRestantes = $scope.user_Bonificacion - $scope.pedidosGastados + pedidosInvitados;
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



	////////////////////////////////////////////////ACCIONES SMARTIME////////////////////////////////////////////////
	
	$scope.hacerPedido = function (item) {
		console.log("Se hizo clic en Ordenar", item);

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

		// Seteo valores del pedido en el scope
		$scope.pedidoPlato = item.descripcion;
		$scope.pedidoCodigo = item.codigo;
		$scope.pedidoCosto = item.costo;
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
			fecha_hora: fecha
		};
		console.log("📦 jsonForm confirmaPedido:", jsonForm);
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
