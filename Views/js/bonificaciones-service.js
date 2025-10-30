// === Servicio de Bonificaciones ===
// Maneja la lógica de bonificaciones basada en sl_jerarquia

var BonificacionesService = {
    // Configuración de la API
    baseUrl: 'http://localhost:8000/api/jerarquia/',
    
    // Cache de bonificaciones por perfil
    bonificacionesCache: {},
    
    // Obtener bonificación para un perfil específico
    obtenerBonificacion: function(perfil) {
        // Si ya tenemos el cache, devolverlo
        if (this.bonificacionesCache[perfil]) {
            return Promise.resolve(this.bonificacionesCache[perfil]);
        }
        
        // Si no, consultar la API
        return this.consultarBonificacionDesdeAPI(perfil);
    },
    
    // Consultar bonificación desde la API usando GetName
    consultarBonificacionDesdeAPI: function(perfil) {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            // Hacer petición HTTP para obtener la jerarquía específica por nombre
            var xhr = new XMLHttpRequest();
            var url = self.baseUrl + 'GetName?name=' + encodeURIComponent(perfil);
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            
                            console.log('=== 📊 DATOS DE API JERARQUÍA ===');
                            console.log('URL llamada:', url);
                            console.log('Perfil consultado:', perfil);
                            console.log('Status:', xhr.status);
                            console.log('Response completa:', xhr.responseText);
                            console.log('Datos parseados:', data);
                            console.log('Tipo de datos:', Array.isArray(data) ? 'Array' : typeof data);
                            
                            // La respuesta puede ser un objeto o un array
                            var jerarquia = Array.isArray(data) ? data[0] : data;
                            console.log('Jerarquía extraída:', jerarquia);
                            console.log('Campos de jerarquía:', jerarquia ? Object.keys(jerarquia) : 'No hay jerarquía');
                            
                            if (jerarquia && jerarquia.bonificacion !== undefined) {
                                console.log('Campo bonificación encontrado:', jerarquia.bonificacion);
                                console.log('Tipo de bonificación:', typeof jerarquia.bonificacion);
                                
                                var bonificacion = {
                                    perfil: jerarquia.nombre || jerarquia.perfil || perfil,
                                    porcentaje: parseInt(jerarquia.bonificacion) || 0,
                                    descripcion: jerarquia.descripcion || ''
                                };
                                
                                console.log('=== 📋 BONIFICACIÓN PROCESADA ===');
                                console.log('Perfil:', bonificacion.perfil);
                                console.log('Porcentaje original:', jerarquia.bonificacion);
                                console.log('Porcentaje parseado:', bonificacion.porcentaje);
                                console.log('Descripción:', bonificacion.descripcion);
                                console.log('Objeto final:', bonificacion);
                                
                                // Guardar en cache
                                self.bonificacionesCache[perfil] = bonificacion;
                                resolve(bonificacion);
                            } else {
                                // Si no se encuentra el perfil, devolver 0%
                                var bonificacionDefault = {
                                    perfil: perfil,
                                    porcentaje: 0,
                                    descripcion: 'Perfil no encontrado'
                                };
                                console.log('Perfil no encontrado, usando default:', bonificacionDefault);
                                self.bonificacionesCache[perfil] = bonificacionDefault;
                                resolve(bonificacionDefault);
                            }
                        } catch (e) {
                            console.error('Error parsing bonificaciones:', e);
                            reject(e);
                        }
                    } else {
                        console.error('Error obteniendo bonificaciones:', xhr.status, xhr.responseText);
                        reject(new Error('Error en la API: ' + xhr.status));
                    }
                }
            };
            xhr.send();
        });
    },
    
    // Verificar si ya se usó la bonificación hoy
    verificarBonificacionHoy: function(dni, fecha) {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            // Consultar comandas del día
            var xhr = new XMLHttpRequest();
            var url = 'http://localhost:8000/api/comanda/getPedido/' + dni;
            
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            
                            console.log('=== 📊 DATOS DE API COMANDAS ===');
                            console.log('URL llamada:', url);
                            console.log('Status:', xhr.status);
                            console.log('Response completa:', xhr.responseText);
                            console.log('Datos parseados:', data);
                            console.log('Tipo de datos:', Array.isArray(data) ? 'Array' : typeof data);
                            console.log('Cantidad de registros:', Array.isArray(data) ? data.length : 'No es array');
                            
                            // Filtrar pedidos del día que tengan bonificación
                            console.log('=== 🔍 ANÁLISIS DETALLADO DE CADA PEDIDO ===');
                            var pedidosBonificados = data.filter(function(pedido, index) {
                                console.log(`--- PEDIDO ${index + 1} ---`);
                                console.log('Datos completos del pedido:', pedido);
                                console.log('Campos disponibles:', Object.keys(pedido));
                                
                                // Verificar si tiene campo bonificado con valor > 0
                                var tieneBonificacion = pedido.bonificado && parseFloat(pedido.bonificado) > 0;
                                console.log('Campo bonificado:', pedido.bonificado);
                                console.log('Valor parseado:', parseFloat(pedido.bonificado));
                                console.log('¿Tiene bonificación?', tieneBonificacion);
                                
                                // También verificar por fecha si está disponible
                                var esDelDia = true;
                                if (pedido.fecha) {
                                    esDelDia = pedido.fecha === fecha;
                                    console.log('Fecha del pedido (fecha):', pedido.fecha);
                                } else if (pedido.fecha_hora) {
                                    var fechaPedido = new Date(pedido.fecha_hora).toISOString().split('T')[0];
                                    esDelDia = fechaPedido === fecha;
                                    console.log('Fecha del pedido (fecha_hora):', pedido.fecha_hora);
                                    console.log('Fecha extraída:', fechaPedido);
                                }
                                console.log('¿Es del día?', esDelDia);
                                console.log('Fecha de búsqueda:', fecha);
                                
                                var cumpleCriterios = esDelDia && tieneBonificacion;
                                console.log('¿Cumple criterios?', cumpleCriterios);
                                console.log('--- FIN PEDIDO ---');
                                
                                return cumpleCriterios;
                            });
                            
                            // === LÓGICA MEJORADA ===
                            // Si hay al menos 1 bonificación del día, ya se usó
                            var yaBonificado = pedidosBonificados.length >= 1;
                            var cantidadBonificados = pedidosBonificados.length;
                            
                            console.log('=== 📋 RESUMEN DE VERIFICACIÓN ===');
                            console.log('Fecha de búsqueda:', fecha);
                            console.log('Total de pedidos encontrados:', data.length);
                            console.log('Pedidos con bonificación del día:', pedidosBonificados.length);
                            console.log('Lista de pedidos bonificados:', pedidosBonificados);
                            console.log('¿Ya se bonificó hoy?', yaBonificado);
                            console.log('Cantidad de bonificaciones:', cantidadBonificados);
                            console.log('Mensaje:', yaBonificado ? 'Ya se aplicó bonificación hoy' : 'Puede aplicar bonificación');
                            
                            resolve({
                                yaBonificado: yaBonificado,
                                pedidosBonificados: pedidosBonificados,
                                cantidadBonificados: cantidadBonificados
                            });
                        } catch (e) {
                            console.error('Error parsing comandas:', e);
                            reject(e);
                        }
                    } else {
                        console.error('Error obteniendo comandas:', xhr.status);
                        reject(new Error('Error en la API de comandas'));
                    }
                }
            };
            xhr.send();
        });
    },
    
    // Calcular precio con bonificación
    calcularPrecioConBonificacion: function(precioOriginal, porcentajeBonificacion) {
        var precio = parseFloat(precioOriginal) || 0;
        var porcentaje = parseInt(porcentajeBonificacion) || 0;
        
        if (porcentaje <= 0) {
            return {
                precioFinal: precio,
                bonificado: 0,
                descuento: 0
            };
        }
        
        var descuento = (precio * porcentaje) / 100;
        var precioFinal = precio - descuento;
        
        return {
            precioFinal: Math.round(precioFinal * 100) / 100,
            bonificado: Math.round(descuento * 100) / 100,
            descuento: Math.round(descuento * 100) / 100
        };
    },
    
    // Limpiar cache (útil para testing)
    limpiarCache: function() {
        this.bonificacionesCache = {};
    }
};

// Hacer disponible globalmente
window.BonificacionesService = BonificacionesService;
