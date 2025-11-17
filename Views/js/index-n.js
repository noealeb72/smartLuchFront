var app = angular.module('AngujarJS', ['ja.qr']);

app.controller('Index', function ($scope, $http, $timeout, $window) {
	// === Inicializar isLoading en false para no mostrar loading ===
	$scope.isLoading = false;
	
	// === Inicializar URLs base ===
	var defaultApiBaseUrl = 'http://localhost:8000';
	$scope.baseMenu = defaultApiBaseUrl + '/api/menudd/';
	$scope.baseTurno = defaultApiBaseUrl + '/api/turno/';
	$scope.baseComanda = defaultApiBaseUrl + '/api/comanda/';
	$scope.basePlatos = defaultApiBaseUrl + '/api/plato/';
	
	// Variables para almacenar datos
	$scope.turnoDataset = [];
	$scope.selectedTurno = null;
	$scope.menuDatasetSeleccionado = [];
	$scope.platos = [];
	$scope.dataset = []; // Para compatibilidad con el HTML
	$scope.defaultImage = 'img/logo-preview.png'; // Imagen por defecto
	$scope.turnoDisponible = true; // Control de disponibilidad de turnos
	
	// Variables para pedidos
	$scope.pedidoVigente = [];
	$scope.pedidoSeleccionado = null;
	$scope.pedidoPlato = '';
	$scope.pedidoCodigo = '';
	$scope.pedidoCosto = 0;
	$scope.pedidoPresentacion = '';
	$scope.pedidoEstado = 'P';
	$scope.pedidoCalificacion = 1;
	$scope.pedidoComentario = '';
	$scope.pedidoInvitado = false;
	$scope.pedidosGastados = 0;
	
	// Variables para bonificación
	$scope.bonificacionDisponible = false;
	$scope.porcentajeBonificacion = 0;
	$scope.yaBonificadoHoy = false;
	$scope.cantidadBonificacionesHoy = 0;
	$scope.precioOriginal = 0;
	$scope.descuentoAplicado = 0;
	$scope.pedidosRestantes = 0;
	
	// === Cargar TODOS los datos del usuario desde localStorage ===
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
	$scope.user_domicilio = localStorage.getItem('domicilio');
	$scope.user_fechaingreso = localStorage.getItem('fechaingreso');
	$scope.user_contrato = localStorage.getItem('contrato');
	$scope.user_foto = localStorage.getItem('foto');
	$scope.user_user = localStorage.getItem('user');
	$scope.user_password = localStorage.getItem('password');
	$scope.smarTime = localStorage.getItem('smarTime');
	$scope.usuarioSmatTime = localStorage.getItem('usuarioSmatTime');
	$scope.tipoVisualizacionCodigo = localStorage.getItem('tipoVisualizacionCodigo') || 'QR'; // QR o Barra
	
	// === Validar que todos los datos necesarios estén en localStorage ===
	var datosFaltantes = [];
	if (!$scope.user_Planta || $scope.user_Planta === 'null' || $scope.user_Planta === 'undefined') {
		datosFaltantes.push('Planta');
	}
	if (!$scope.user_Centrodecosto || $scope.user_Centrodecosto === 'null' || $scope.user_Centrodecosto === 'undefined') {
		datosFaltantes.push('Centro de Costo');
	}
	if (!$scope.user_Proyecto || $scope.user_Proyecto === 'null' || $scope.user_Proyecto === 'undefined') {
		datosFaltantes.push('Proyecto');
	}
	if (!$scope.user_Jerarquia || $scope.user_Jerarquia === 'null' || $scope.user_Jerarquia === 'undefined') {
		datosFaltantes.push('Jerarquía');
	}
	if (!$scope.user_Perfilnutricional || $scope.user_Perfilnutricional === 'null' || $scope.user_Perfilnutricional === 'undefined') {
		datosFaltantes.push('Plan Nutricional');
	}
	
	// === Log completo de TODOS los valores del localStorage ===
	console.log('🔍 ========== VALORES CARGADOS DESDE LOCALSTORAGE ==========');
	console.log('   Rol:', $scope.user_Rol);
	console.log('   Nombre:', $scope.user_Nombre);
	console.log('   Apellido:', $scope.user_Apellido);
	console.log('   Planta:', $scope.user_Planta);
	console.log('   Centro de Costo:', $scope.user_Centrodecosto);
	console.log('   Proyecto:', $scope.user_Proyecto);
	console.log('   Jerarquía:', $scope.user_Jerarquia);
	console.log('   Plan Nutricional:', $scope.user_Perfilnutricional);
	console.log('   Bonificación:', $scope.user_Bonificacion);
	console.log('   Bonificación Invitado:', $scope.user_BonificacionInvitado);
	console.log('   DNI:', $scope.user_DNI);
	console.log('   Legajo:', $scope.user_legajo);
	console.log('   CUIL:', $scope.user_cuil);
	console.log('   Domicilio:', $scope.user_domicilio);
	console.log('   Fecha Ingreso:', $scope.user_fechaingreso);
	console.log('   Contrato:', $scope.user_contrato);
	console.log('   Foto:', $scope.user_foto ? 'Presente' : 'No disponible');
	console.log('   User:', $scope.user_user);
	console.log('   Password:', $scope.user_password ? 'Presente' : 'No disponible');
	console.log('   SmarTime:', $scope.smarTime);
	console.log('   Usuario SmarTime:', $scope.usuarioSmatTime);
	console.log('===========================================================');
	
	// Si faltan datos, mostrar error y redirigir al login
	if (datosFaltantes.length > 0) {
		var mensajeError = 'Faltan datos de usuario en el sistema. Por favor, inicie sesión nuevamente.\n\nDatos faltantes: ' + datosFaltantes.join(', ');
		
		// Mostrar mensaje de error con SweetAlert si está disponible
		if (typeof Swal !== 'undefined' && Swal.fire) {
			Swal.fire({
				title: 'Error de autenticación',
				text: mensajeError,
				icon: 'error',
				confirmButtonText: 'Ir al Login',
				confirmButtonColor: '#F34949',
				allowOutsideClick: false,
				allowEscapeKey: false
			}).then(function() {
				window.location.href = 'login.html';
			});
		} else {
			// Fallback si SweetAlert no está disponible
			alert(mensajeError);
			window.location.href = 'login.html';
		}
		return; // Detener la ejecución del controlador
	}
	
	// === Función para cargar turnos disponibles ===
	$scope.cargarTurnos = function() {
		console.log('🔄 Iniciando carga de turnos...');
		$http.get($scope.baseTurno + 'GetTurnosDisponibles')
			.then(function(response) {
				console.log('✅ Respuesta de turnos recibida:', response);
				$scope.turnoDataset = Array.isArray(response.data) ? response.data : [];
				
				if ($scope.turnoDataset.length === 0) {
					console.warn('⚠️ No hay turnos disponibles');
					$scope.turnoDisponible = false;
					return;
				}
				
				console.log('📋 Turnos disponibles:', $scope.turnoDataset.length);
				
				// Seleccionar el primer turno por defecto si hay turnos disponibles
				if ($scope.turnoDataset.length > 0 && !$scope.selectedTurno) {
					$scope.selectedTurno = $scope.turnoDataset[0];
					console.log('✅ Turno seleccionado:', $scope.selectedTurno.descripcion);
				}
				
				// Después de cargar turnos, cargar el menú
				$scope.cargarMenu();
			})
			.catch(function(error) {
				console.error('❌ Error al cargar turnos:', error);
				console.error('   Status:', error.status);
				console.error('   StatusText:', error.statusText);
				console.error('   Data:', error.data);
				
				// Mostrar error al usuario
				var mensajeError = 'Error al cargar los turnos disponibles';
				var detalleError = '';
				
				if (error.status === -1 || error.status === 0) {
					mensajeError = 'Error de conexión';
					detalleError = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8000.';
				} else if (error.data) {
					detalleError = typeof error.data === 'string' ? error.data : JSON.stringify(error.data);
				} else {
					detalleError = error.statusText || 'Error desconocido';
				}
				
				if (typeof Swal !== 'undefined' && Swal.fire) {
					Swal.fire({
						title: mensajeError,
						text: detalleError,
						icon: 'error',
						confirmButtonText: 'Aceptar',
						confirmButtonColor: '#F34949'
					});
				} else {
					alert(mensajeError + '\n\n' + detalleError);
				}
			});
	};
	
	// === Función para cargar el menú usando el stored procedure filtrar ===
	$scope.cargarMenu = function() {
		console.log('🔄 Iniciando carga de menú...');
		console.log('   Turno seleccionado del scope:', $scope.selectedTurno);
		
		// Validar y obtener el turno seleccionado
		var turnoSeleccionado = $scope.selectedTurno;
		
		// Si no hay turno en el scope, intentar leerlo del DOM
		if (!turnoSeleccionado || !turnoSeleccionado.descripcion) {
			var selectElement = document.getElementById('turno') || document.getElementById('selectedTurno');
			var selectedIndex = selectElement ? selectElement.selectedIndex : -1;
			
			if (selectedIndex >= 0 && $scope.turnoDataset && $scope.turnoDataset.length > selectedIndex) {
				turnoSeleccionado = $scope.turnoDataset[selectedIndex];
				$scope.selectedTurno = turnoSeleccionado;
				console.log('✅ Turno obtenido del DOM y actualizado en scope:', turnoSeleccionado);
			}
		}
		
		if (!turnoSeleccionado || !turnoSeleccionado.descripcion) {
			console.warn('⚠️ No hay turno seleccionado, no se puede cargar el menú');
			return;
		}
		
		const ahora = new Date();
		const hoy = ahora.getFullYear() + '-' +
			String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
			String(ahora.getDate()).padStart(2, '0');
		
		// Obtener la descripción del turno
		var descripcionTurno = turnoSeleccionado.descripcion || turnoSeleccionado.Descripcion || null;
		
		console.log('🔍 Turno que se enviará al store:');
		console.log('   selectedTurno completo:', turnoSeleccionado);
		console.log('   descripcionTurno:', descripcionTurno);
		console.log('   ID del turno:', turnoSeleccionado.id);
		
		// Parámetros para el stored procedure filtrar
		// Estos parámetros corresponden a los del store:
		// @Turno, @Planta, @CentroDeCosto, @Proyecto, @Jerarquia, @PlanNutricional
		var paramsMenu = {
			Fecha: hoy,
			Turno: descripcionTurno,
			Planta: $scope.user_Planta || null,
			Centro: $scope.user_Centrodecosto || null,
			Proyecto: $scope.user_Proyecto || null,
			Jerarquia: $scope.user_Jerarquia || null,
			PlanNutricional: ($scope.user_Perfilnutricional && 
			                 $scope.user_Perfilnutricional !== 'null' && 
			                 $scope.user_Perfilnutricional !== 'undefined') 
			                 ? $scope.user_Perfilnutricional : null
		};
		
		console.log('📋 Parámetros para el store:', paramsMenu);
		console.log('🎯 TURNO ENVIADO AL STORE:', paramsMenu.Turno);
		console.log('📡 URL base:', $scope.baseMenu);
		console.log('📡 Endpoint completo:', $scope.baseMenu + 'filtrar');
		
		// Verificar que todos los parámetros estén correctos
		console.log('🔍 Verificación de parámetros:');
		console.log('   Fecha:', paramsMenu.Fecha);
		console.log('   Turno:', paramsMenu.Turno);
		console.log('   Planta:', paramsMenu.Planta);
		console.log('   CentroDeCosto:', paramsMenu.Centro);
		console.log('   Proyecto:', paramsMenu.Proyecto);
		console.log('   Jerarquia:', paramsMenu.Jerarquia);
		console.log('   PlanNutricional:', paramsMenu.PlanNutricional);
		
		// Usar la misma forma que el código original
		console.log('📤 Enviando petición HTTP GET...');
		$http.get($scope.baseMenu + 'filtrar', {
			params: paramsMenu
		})
		.then(function (response) {
			console.log('✅ Respuesta del menú recibida:', response);
			console.log('   Status:', response.status);
			console.log('   Tipo de datos:', Array.isArray(response.data) ? 'Array' : typeof response.data);
			console.log('   Valor de response.data:', response.data);
			console.log('   Cantidad de items:', Array.isArray(response.data) ? response.data.length : 'N/A');
			
			// Si la respuesta es 200 OK, procesar los datos (aunque estén vacíos)
			if (response.status === 200) {
				// Verificar si la respuesta está vacía o es null
				if (!response.data) {
					console.warn('⚠️ La respuesta está vacía o es null');
					$scope.menuDatasetSeleccionado = [];
					$scope.platos = [];
					$scope.dataset = [];
					// Forzar actualización del scope
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				} else if (Array.isArray(response.data)) {
					$scope.menuDatasetSeleccionado = response.data;
					
					// Construir array de platos desde el menú
					$scope.platos = [];
					$scope.dataset = []; // Inicializar dataset para el HTML
					var platosMap = {}; // Para evitar duplicados
					
					// Si hay datos, procesarlos
					if (response.data.length > 0) {
						console.log('📦 Procesando', response.data.length, 'items del menú...');
						
						response.data.forEach(function(menuItem, index) {
							// Log del primer item para ver la estructura
							if (index === 0) {
								console.log('📋 Estructura del primer item:', menuItem);
								console.log('   Campos disponibles:', Object.keys(menuItem));
							}
							
							// Intentar obtener el código de diferentes formas posibles
							var codigo = menuItem.codigo || menuItem.cod_plato || menuItem.Codigo || menuItem.Cod_Plato;
							if (!codigo) {
								console.warn('⚠️ Item sin código, saltando:', menuItem);
								return;
							}
							
							var codigoKey = codigo.toString();
							if (!platosMap[codigoKey]) {
								platosMap[codigoKey] = true;
								
								// Mapear campos con diferentes nombres posibles
								// Obtener plan nutricional con múltiples variaciones
								var planNutricional = menuItem.plannutricional || 
								                      menuItem.PlanNutricional || 
								                      menuItem.plan_nutricional || 
								                      menuItem.planNutricional ||
								                      menuItem.PLANNUTRICIONAL ||
								                      menuItem.planNutricionalDescripcion ||
								                      menuItem.plan_nutricional_descripcion ||
								                      null;
								
								var plato = {
									codigo: codigo,
									descripcion: menuItem.descripcion || menuItem.Descripcion || menuItem.plato || menuItem.Plato || 'Sin descripción',
									costo: parseFloat(menuItem.costo || menuItem.Costo || menuItem.monto || menuItem.Monto || 0) || 0,
									plannutricional: planNutricional,
									presentacion: menuItem.presentacion || menuItem.Presentacion || menuItem.imagen || menuItem.Imagen || null,
									ingredientes: menuItem.ingredientes || menuItem.Ingredientes || menuItem.ingrediente || menuItem.Ingrediente || null,
									cantidadDisponible: menuItem.cantidad_disponible !== undefined && menuItem.cantidad_disponible !== null
										? parseInt(menuItem.cantidad_disponible)
										: (menuItem.cantidad !== undefined && menuItem.cantidad !== null
											? parseInt(menuItem.cantidad)
											: (menuItem.Cantidad !== undefined && menuItem.Cantidad !== null
												? parseInt(menuItem.Cantidad)
												: 0))
								};
								
								// Log del plan nutricional para debug
								if (index === 0) {
									console.log('📋 Plan Nutricional del primer item:', planNutricional);
									console.log('   Campo plannutricional en el objeto:', plato.plannutricional);
								}
								
								$scope.platos.push(plato);
								$scope.dataset.push(plato); // También agregar a dataset para compatibilidad
							}
						});
					}
					
					console.log('✅ Menú cargado:', $scope.platos.length, 'platos');
					console.log('✅ Dataset cargado:', $scope.dataset.length, 'items');
					
					if ($scope.platos.length === 0) {
						console.warn('⚠️ No hay platos disponibles para este turno');
						console.warn('   Esto puede ser normal si no hay platos configurados para los filtros aplicados');
					}
					
					// Forzar actualización del scope para que Angular detecte los cambios
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				} else {
					console.warn('⚠️ La respuesta no es un array:', response.data);
					console.warn('   Tipo:', typeof response.data);
					$scope.menuDatasetSeleccionado = [];
					$scope.platos = [];
					$scope.dataset = [];
					// Forzar actualización del scope
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}
			} else {
				// Si el status no es 200, tratar como error
				console.error('❌ Respuesta con status diferente a 200:', response.status);
				$scope.menuDatasetSeleccionado = [];
				$scope.platos = [];
				$scope.dataset = [];
				// Forzar actualización del scope
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			}
		})
		.catch(function (error) {
			console.error('❌ Error al cargar el menú:', error);
			console.error('   Status:', error.status);
			console.error('   StatusText:', error.statusText);
			console.error('   Data:', error.data);
			console.error('   Config URL:', error.config ? error.config.url : 'N/A');
			console.error('   Config Method:', error.config ? error.config.method : 'N/A');
			
			// Mostrar mensaje de error al usuario
			var mensajeError = 'Error al cargar el menú del día';
			var detalleError = '';
			
			if (error.status === -1 || error.status === 0) {
				mensajeError = 'Error de conexión';
				detalleError = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8000 y que CORS esté configurado correctamente.';
			} else if (error.status === 404) {
				mensajeError = 'Endpoint no encontrado';
				detalleError = 'El endpoint /api/menudd/filtrar no fue encontrado en el servidor.';
			} else if (error.status >= 500) {
				mensajeError = 'Error del servidor';
				detalleError = 'El servidor respondió con un error. Status: ' + error.status;
			} else if (error.data) {
				detalleError = typeof error.data === 'string' ? error.data : JSON.stringify(error.data);
			} else {
				detalleError = error.statusText || 'Error desconocido';
			}
			
			// Mostrar error con SweetAlert si está disponible
			if (typeof Swal !== 'undefined' && Swal.fire) {
				Swal.fire({
					title: mensajeError,
					text: detalleError,
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			} else {
				alert(mensajeError + '\n\n' + detalleError);
			}
			
			$scope.menuDatasetSeleccionado = [];
			$scope.platos = [];
			$scope.dataset = [];
		});
	};
	
	// === Función para cambiar de turno ===
	$scope.changeTurno = function() {
		$scope.menuDatasetSeleccionado = [];
		$scope.platos = [];
		$scope.cargarMenu();
	};
	
	// === Función que se ejecuta cuando cambia el combo de turnos ===
	$scope.onTurnoChanged = function() {
		// Leer directamente del DOM para obtener el índice seleccionado
		var selectElement = document.getElementById('turno') || document.getElementById('selectedTurno');
		var selectedIndex = selectElement ? selectElement.selectedIndex : -1;
		var selectedValue = selectElement ? selectElement.value : null;
		
		console.log('🔄 Turno cambiado - selectedIndex:', selectedIndex);
		console.log('🔄 Turno cambiado - selectedValue:', selectedValue);
		console.log('🔄 Turno cambiado - selectedTurno del scope:', $scope.selectedTurno);
		
		// Obtener el turno seleccionado desde el array usando el índice
		var turnoSeleccionado = null;
		if (selectedIndex >= 0 && $scope.turnoDataset && $scope.turnoDataset.length > selectedIndex) {
			turnoSeleccionado = $scope.turnoDataset[selectedIndex];
			console.log('✅ Turno obtenido del array por índice:', turnoSeleccionado);
		} else if ($scope.selectedTurno) {
			// Si no se puede obtener por índice, usar el del scope
			turnoSeleccionado = $scope.selectedTurno;
			console.log('✅ Usando turno del scope:', turnoSeleccionado);
		}
		
		// Validar que haya un turno seleccionado válido
		if (!turnoSeleccionado || !turnoSeleccionado.descripcion) {
			console.warn('⚠️ No hay turno seleccionado válido');
			$scope.menuDatasetSeleccionado = [];
			$scope.platos = [];
			$scope.dataset = [];
			return;
		}
		
		// ACTUALIZAR el scope con el turno correcto
		$scope.selectedTurno = turnoSeleccionado;
		
		console.log('📋 Turno seleccionado actualizado:', $scope.selectedTurno);
		console.log('📋 Descripción del turno:', $scope.selectedTurno.descripcion);
		console.log('🎯 Turno que se enviará al store:', $scope.selectedTurno.descripcion);
		
		// Limpiar datos anteriores
		$scope.menuDatasetSeleccionado = [];
		$scope.platos = [];
		$scope.dataset = [];
		
		// Usar $timeout para asegurar que el scope esté completamente actualizado antes de llamar al store
		$timeout(function() {
			// Llamar al método del store con el turno seleccionado
			$scope.cargarMenu();
		}, 0);
	};
	
	// === Función para hacer pedido (abre el popup) ===
	$scope.hacerPedido = function (item) {
		// Asegurar que el pedido seleccionado quede seteado para el modal/confirmación
		$scope.pedidoSeleccionado = item;
		
		const cuil = localStorage.getItem("cuil");
		const legajo = localStorage.getItem("legajo");
		const smarTime = localStorage.getItem("smarTime") === 'true';
		const usuarioSmatTime = localStorage.getItem("usuarioSmatTime");
		
		// Validar si ya tiene pedido en el mismo turno del mismo día
		var fechaHoy = new Date().toISOString().split('T')[0];
		var turnoActual = $scope.selectedTurno ? $scope.selectedTurno.descripcion : null;
		
		if (!turnoActual) {
			if (typeof Swal !== 'undefined' && Swal.fire) {
				Swal.fire({
					title: 'Error',
					text: 'No se ha seleccionado un turno válido.',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			}
			return;
		}
		
		// Verificar pedidos vigentes en el mismo turno
		var pedidoMismoTurnoHoy = $scope.pedidoVigente.find(function(pedido) {
			if (!pedido.user_Pedido) return false;
			var fechaPedido = null;
			if (pedido.user_Pedido.fecha_hora) {
				try {
					fechaPedido = new Date(pedido.user_Pedido.fecha_hora).toISOString().split('T')[0];
				} catch (e) {
					fechaPedido = null;
				}
			}
			if (fechaPedido !== fechaHoy) return false;
			
			var codPlatoPedido = pedido.codigo || pedido.user_Pedido.cod_plato;
			var platoEnTurnoActual = $scope.menuDatasetSeleccionado && $scope.menuDatasetSeleccionado.some(function(menu) {
				return (menu.cod_plato === codPlatoPedido || menu.plato === codPlatoPedido);
			});
			return platoEnTurnoActual;
		});
		
		if (pedidoMismoTurnoHoy) {
			if (typeof Swal !== 'undefined' && Swal.fire) {
				Swal.fire({
					title: 'Ya tienes un pedido en este turno',
					text: 'No es posible hacer más de un pedido en el mismo turno del mismo día.',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			}
			return;
		}
		
		// Inicializar bonificaciones si no se ha hecho
		if (!$scope.bonificacionDisponible && !$scope.yaBonificadoHoy) {
			$scope.inicializarBonificaciones();
		}
		
		// Aplicar bonificación si está disponible
		var puedeAplicarBonificacion = $scope.bonificacionDisponible && $scope.cantidadBonificacionesHoy < 1;
		if (item.aplicarBonificacion === undefined) {
			item.aplicarBonificacion = puedeAplicarBonificacion;
		}
		if (!puedeAplicarBonificacion) {
			item.aplicarBonificacion = false;
		}
		
		// Calcular precio con bonificación
		if (item.aplicarBonificacion && $scope.bonificacionDisponible) {
			var calculo = $scope.calcularPrecioConBonificacion(parseFloat(item.costo) || 0, true);
			item.precioFinal = calculo.precioFinal;
			item.bonificado = calculo.bonificado;
			$scope.precioOriginal = parseFloat(item.costo) || 0;
			$scope.descuentoAplicado = calculo.bonificado;
		} else {
			item.precioFinal = parseFloat(item.costo) || 0;
			item.bonificado = 0;
			$scope.precioOriginal = parseFloat(item.costo) || 0;
			$scope.descuentoAplicado = 0;
		}
		
		// Setear valores del pedido en el scope
		$scope.pedidoPlato = item.descripcion;
		$scope.pedidoCodigo = item.codigo;
		$scope.pedidoCosto = item.precioFinal || item.costo;
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
							if (typeof Swal !== 'undefined' && Swal.fire) {
								Swal.fire({
									title: 'Error',
									text: mensajeSmatTime || "El usuario no tiene fichadas en SmarTime",
									icon: 'error',
									confirmButtonText: 'Aceptar',
									confirmButtonColor: '#F34949'
								});
							}
						}
					})
					.catch(function (error) {
						if (typeof Swal !== 'undefined' && Swal.fire) {
							Swal.fire({
								title: 'Error',
								text: "Error al obtener SmarTime: " + error.statusText,
								icon: 'error',
								confirmButtonText: 'Aceptar',
								confirmButtonColor: '#F34949'
							});
						}
					});
			} else {
				mostrarModalConfirmacion();
			}
		} else {
			mostrarModalConfirmacion();
		}
	};
	
	// === Función para mostrar el modal de confirmación ===
	function mostrarModalConfirmacion() {
		$('#confirmModal').modal('hide');
		$('.modal-backdrop').remove();
		$('body').removeClass('modal-open');
		
		setTimeout(function() {
			$('#confirmModal').modal({
				backdrop: 'static',
				keyboard: false,
				show: true
			});
		}, 200);
	}
	
	// === Función para confirmar el pedido ===
	$scope.confirmaPedido = function () {
		var dia = new Date().getDay();
		var mes = new Date().getMonth();
		var anio = new Date().getFullYear();
		var hora = new Date().getHours();
		var hora2 = new Date().getMinutes();
		var fecha = hora + ':' + hora2 + ' ' + dia + '/' + mes + '/' + anio;
		var esInvitado = $scope.pedidoInvitado === true;
		
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
				// Consumir bonificación si aplica
				if ($scope.pedidoSeleccionado && $scope.pedidoSeleccionado.aplicarBonificacion && 
					$scope.bonificacionDisponible && $scope.cantidadBonificacionesHoy < 1) {
					$scope.pedidosRestantes = 0;
					$scope.cantidadBonificacionesHoy = 1;
					$scope.yaBonificadoHoy = true;
					$scope.guardarEstadoBonificacion();
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}
				
				if (typeof Swal !== 'undefined' && Swal.fire) {
					Swal.fire({
						title: '¡Pedido Enviado!',
						text: '',
						icon: 'success',
						confirmButtonText: 'Aceptar',
						confirmButtonColor: '#F34949',
						allowOutsideClick: false,
						allowEscapeKey: false
					}).then(function() {
						cerrarModales();
						recargar();
					});
				}
			}
		}, function (error) {
			if (typeof Swal !== 'undefined' && Swal.fire) {
				Swal.fire({
					title: 'Operación Incorrecta',
					text: JSON.stringify(error),
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			}
		});
	};
	
	// === Función para seleccionar un pedido ===
	$scope.seleccionaPedido = function (pedido) {
		$scope.pedidoSeleccionado = pedido;
		// Asegurar que la calificación tenga un valor por defecto
		$scope.pedidoCalificacion = 1;
		// Forzar actualización del select en el modal
		$timeout(function() {
			var selectElement = document.getElementById('pedidoCalificacion');
			if (selectElement) {
				selectElement.value = '1';
			}
		}, 100);
	};
	
	// === Función para actualizar el estado del pedido (Recibir, Devolver, Cancelar) ===
	$scope.actualizaPedido = function (nuevoEstado) {
		// Obtener la calificación del select
		$scope.pedidoCalificacion = parseInt($window.document.getElementById('pedidoCalificacion').value) || 1;
		
		// Validar que haya un pedido seleccionado
		if (!$scope.pedidoSeleccionado || !$scope.pedidoSeleccionado.user_Pedido) {
			if (typeof Swal !== 'undefined' && Swal.fire) {
				Swal.fire({
					title: 'Error',
					text: 'No hay un pedido seleccionado.',
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			}
			return;
		}
		
		// Verificar si el pedido tenía bonificación y obtener el valor
		var pedidoTeniaBonificacion = false;
		var bonificadoValue = 0;
		if ($scope.pedidoSeleccionado.user_Pedido) {
			var bonificadoOriginal = $scope.pedidoSeleccionado.user_Pedido.bonificado;
			if (bonificadoOriginal !== null && bonificadoOriginal !== undefined && bonificadoOriginal !== '') {
				bonificadoValue = parseFloat(bonificadoOriginal) || 0;
				pedidoTeniaBonificacion = bonificadoValue > 0;
			}
		}
		
		var jsonForm = {
			id: $scope.pedidoSeleccionado.user_Pedido.id,
			cod_plato: $scope.pedidoSeleccionado.codigo,
			monto: $scope.pedidoSeleccionado.user_Pedido.monto || 0,
			estado: nuevoEstado,
			calificacion: $scope.pedidoCalificacion || 1,
			planta: $scope.user_Planta,
			proyecto: $scope.user_Proyecto,
			centrodecosto: $scope.user_Centrodecosto,
			user_id: $scope.user_DNI,
			user_name: $scope.user_Nombre,
			user_lastName: $scope.user_Apellido,
			user_fileNumber: $scope.user_legajo,
			fecha_hora: $scope.pedidoSeleccionado.user_Pedido.fecha_hora || new Date().toISOString(),
			bonificado: bonificadoValue
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
					$scope.cantidadBonificacionesHoy = 1;
					$scope.yaBonificadoHoy = true;
					if ($scope.bonificacionDisponible) {
						$scope.pedidosRestantes = 0;
					}
					$scope.guardarEstadoBonificacion();
					if (!$scope.$$phase) {
						$scope.$apply();
					}
					$timeout(function() {
						$scope.verificarBonificacionHoy();
					}, 1000);
				}
				// Si se canceló ('C') o devolvió ('D') un pedido con bonificación, restaurar el descuento
				else if ((nuevoEstado === 'C' || nuevoEstado === 'D') && pedidoTeniaBonificacion) {
					$scope.cantidadBonificacionesHoy = 0;
					$scope.yaBonificadoHoy = false;
					if ($scope.bonificacionDisponible) {
						$scope.pedidosRestantes = 1;
					}
					$scope.limpiarEstadoBonificacion();
					if (!$scope.$$phase) {
						$scope.$apply();
					}
					$timeout(function() {
						$scope.verificarBonificacionHoy();
					}, 500);
				}
				
				if (typeof Swal !== 'undefined' && Swal.fire) {
					Swal.fire({
						title: 'Operación correcta',
						text: '',
						icon: 'success',
						confirmButtonText: 'Aceptar',
						confirmButtonColor: '#F34949'
					}).then(function() {
						cerrarModales();
						recargar();
					});
				}
			}
		}, function (error) {
			if (typeof Swal !== 'undefined' && Swal.fire) {
				var errorMessage = 'Error al actualizar el pedido';
				if (error.data && error.data.Message) {
					errorMessage = error.data.Message;
				} else if (error.data && typeof error.data === 'string') {
					errorMessage = error.data;
				} else if (error.statusText) {
					errorMessage = 'Error: ' + error.statusText;
				}
				Swal.fire({
					title: 'Operación Incorrecta',
					text: errorMessage,
					icon: 'error',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#F34949'
				});
			}
		});
	};
	
	// === Función para cerrar modales ===
	function cerrarModales() {
		$('.modal').each(function () {
			$(this).modal('hide');
		});
		$('.modal-backdrop').remove();
		$('body').removeClass('modal-open').css('padding-right', '');
		$scope.pedidoSeleccionado = null;
		$scope.pedidoCalificacion = 1; // Resetear calificación
	}
	
	// === Función para recargar pedidos ===
	function recargar() {
		$scope.pedidoVigente = [];
		$scope.obtieneComandas();
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	}
	
	// === Función para obtener comandas (pedidos vigentes) ===
	$scope.obtieneComandas = function () {
		var id = $scope.user_DNI;
		var url = $scope.baseComanda + 'getPedido/' + id;
		
		console.log('🔄 Obteniendo comandas para DNI:', id);
		console.log('📡 URL:', url);
		
		$http.get(url)
			.then(function (response) {
				var data = response.data;
				console.log('✅ Respuesta de comandas recibida:', data);
				console.log('   Cantidad de pedidos:', Array.isArray(data) ? data.length : 'No es array');
				
				if (Array.isArray(data) && data.length > 0) {
					// Log de todos los estados de los pedidos
					console.log('📋 Estados de los pedidos:');
					data.forEach(function(pedido, index) {
						console.log('   Pedido', index + 1, '- ID:', pedido.id, '- Estado:', pedido.estado, '- Código plato:', pedido.cod_plato);
					});
					
					$timeout(function () {
						var pedidosNoC = data.filter(function (elemento) {
							return elemento.estado !== 'C';
						});
						
						$scope.pedidosGastados = pedidosNoC.length;
						$scope.pedidoVigente = [];
						
						var pedidosPendientes = 0;
						var pedidosListos = 0;
						
						data.forEach(function(x) {
							var plato = $scope.platos.find(function(o) { return o.codigo === x.cod_plato; });
							
							// Si no encuentra el plato en el menú actual, crear un objeto básico con los datos del pedido
							if (!plato) {
								console.log('⚠️ Plato no encontrado en menú actual, creando objeto básico. Código:', x.cod_plato);
								// Crear objeto plato básico desde los datos del pedido
								plato = {
									codigo: x.cod_plato,
									descripcion: x.plato_descripcion || 'Plato no disponible',
									costo: x.monto || 0,
									presentacion: $scope.defaultImage,
									ingredientes: x.ingredientes || '',
									plannutricional: x.plannutricional || ''
								};
							} else {
								plato = angular.copy(plato);
							}
							
							// Asignar datos del pedido (común para ambos estados)
							plato.user_npedido = x.id;
							plato.datoQR = 'N' + x.id;
							plato.user_Pedido = x;
							
							if (x.estado == 'P') {
								plato.paraRetirar = false;
								plato.paraCancelar = true;
								$scope.pedidoVigente.push(plato);
								pedidosPendientes++;
								console.log('✅ Pedido PENDIENTE agregado - ID:', x.id, '- Código:', x.cod_plato, '- QR:', plato.datoQR);
							} else if (x.estado == 'E') {
								// Pedidos listos para retirar (próximos pedidos reservados)
								plato.paraRetirar = true;
								plato.paraCancelar = false;
								$scope.pedidoVigente.push(plato);
								pedidosListos++;
								console.log('✅ Pedido LISTO PARA RETIRAR agregado - ID:', x.id, '- Código:', x.cod_plato, '- QR:', plato.datoQR);
							}
						});
						
						console.log('📊 Resumen:');
						console.log('   Pedidos pendientes (P):', pedidosPendientes);
						console.log('   Pedidos listos (E):', pedidosListos);
						console.log('   Total en pedidoVigente:', $scope.pedidoVigente.length);
						
						// Generar los códigos de barra (espera que DOM esté renderizado)
						$timeout(function() {
							$timeout(function() {
								$scope.pedidoVigente.forEach(function(pedido) {
									var idSelector = '#barcode-' + pedido.user_npedido;
									var el = document.querySelector(idSelector);
									
									if (el && pedido.datoQR && typeof JsBarcode !== 'undefined') {
										JsBarcode(el, pedido.datoQR, {
											format: "CODE128",
											lineColor: "#000",
											width: 2,
											height: 40,
											displayValue: true
										});
									}
								});
							}, 200); // Espera corta después del render
						}, 1000); // Espera tras procesar pedidos
						
						if (!$scope.$$phase) {
							$scope.$apply();
						}
					}, 0);
				} else {
					console.log('⚠️ No hay pedidos o la respuesta no es un array');
				}
			})
			.catch(function (error) {
				console.error('❌ Error al obtener comandas:', error);
				console.error('   Status:', error.status);
				console.error('   StatusText:', error.statusText);
				console.error('   Data:', error.data);
			});
	};
	
	// === Funciones de bonificación (simplificadas) ===
	$scope.inicializarBonificaciones = function() {
		var bonificacion = $scope.user_Bonificacion;
		if (bonificacion && bonificacion !== 'null' && bonificacion !== 'undefined') {
			try {
				var bonifObj = JSON.parse(bonificacion);
				$scope.bonificacionDisponible = bonifObj.disponible === true;
				$scope.porcentajeBonificacion = parseFloat(bonifObj.porcentaje) || 0;
			} catch (e) {
				$scope.bonificacionDisponible = false;
			}
		}
		$scope.verificarBonificacionHoy();
	};
	
	$scope.verificarBonificacionHoy = function() {
		$scope.obtieneComandas();
	};
	
	$scope.calcularPrecioConBonificacion = function(precioOriginal, aplicarBonificacion) {
		if (!aplicarBonificacion || !$scope.bonificacionDisponible) {
			return {
				precioFinal: precioOriginal,
				bonificado: 0
			};
		}
		
		var descuento = precioOriginal * ($scope.porcentajeBonificacion / 100);
		var precioFinal = precioOriginal - descuento;
		
		return {
			precioFinal: precioFinal,
			bonificado: descuento
		};
	};
	
	$scope.guardarEstadoBonificacion = function() {
		// Guardar estado en localStorage si es necesario
		var fechaHoy = new Date().toISOString().split('T')[0];
		var estado = {
			fecha: fechaHoy,
			yaBonificadoHoy: $scope.yaBonificadoHoy,
			cantidadBonificacionesHoy: $scope.cantidadBonificacionesHoy,
			pedidosRestantes: $scope.pedidosRestantes
		};
		localStorage.setItem('estadoBonificacion', JSON.stringify(estado));
	};
	
	$scope.limpiarEstadoBonificacion = function() {
		// Limpiar estado de bonificación del localStorage
		localStorage.removeItem('estadoBonificacion');
	};
	
	// === Inicialización ===
	// Cargar turnos al iniciar
	$scope.cargarTurnos();
	
	// Cargar comandas al iniciar
	$scope.obtieneComandas();
	
	// Inicializar calificación cuando se abre el modal de recepción
	$timeout(function() {
		$('#receiveModal').on('shown.bs.modal', function () {
			$scope.pedidoCalificacion = 1;
			var selectElement = document.getElementById('pedidoCalificacion');
			if (selectElement) {
				selectElement.value = '1';
			}
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		});
	}, 500);
});

