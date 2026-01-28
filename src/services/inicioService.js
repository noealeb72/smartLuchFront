import api from './apiClient';
import { getApiBaseUrl } from './configService';
import { loadConfig } from './configService';

/**
 * Servicio de inicio para web
 * Llama a api/inicio/web pasando el id del usuario
 * 
 * @param {string|number} usuarioId - ID del usuario
 * @returns {Promise<Object>} Datos del inicio con estructura normalizada
 */
export const inicioService = {
  getInicioWeb: async (usuarioId) => {
    // Optimizado: reducir logs para mejorar rendimiento
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      console.log('🚀 [InicioService] getInicioWeb - UsuarioId:', usuarioId);
    }

    try {
      // Obtener configuración para la URL base de la API
      const appConfig = await loadConfig(true);
      const baseUrl = appConfig?.apiBaseUrl || getApiBaseUrl() || 'http://localhost:8000';
      
      // Obtener token de autenticación (si existe)
      const token = localStorage.getItem('token');
      
      // Convertir usuarioId a número entero si es posible
      const usuarioIdNumero = parseInt(usuarioId, 10);
      const usuarioIdParam = !isNaN(usuarioIdNumero) ? usuarioIdNumero : usuarioId;
      
      // Construir URL completa
      const url = `${baseUrl}/api/inicio/web?id=${usuarioIdParam}`;
      
      // Agregar timestamp a la URL para forzar que cada request sea único
      const timestamp = Date.now();
      
      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Headers para evitar caché del navegador y service worker
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // Agregar token si existe
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Hacer la llamada HTTP usando apiClient (que ya maneja el token automáticamente)
      const response = await api.get(url, {
        params: {
          id: usuarioIdParam,
          _t: timestamp
        },
        headers: headers
      });
      
      // Procesar respuesta exitosa
      const dataRaw = response.data;
      
      // Normalizar datos: la API puede devolver Usuario, Turnos, MenuDelDia (mayúsculas)
      
      // Normalizar objeto Usuario
      const usuarioRaw = dataRaw.Usuario || dataRaw.usuario || null;
      let usuarioNormalizado = null;
      
      if (usuarioRaw) {
        usuarioNormalizado = {
          id: usuarioRaw.id || usuarioRaw.Id || null,
          nombre: usuarioRaw.nombre || usuarioRaw.Nombre || '',
          apellido: usuarioRaw.apellido || usuarioRaw.Apellido || '',
          legajo: usuarioRaw.legajo || usuarioRaw.Legajo || '',
          dni: usuarioRaw.dni || usuarioRaw.Dni || null,
          cuil: usuarioRaw.cuil || usuarioRaw.Cuil || null,
          planNutricionalId: usuarioRaw.planNutricionalId || usuarioRaw.PlanNutricionalId || null,
          planNutricionalNombre: usuarioRaw.planNutricionalNombre || usuarioRaw.PlanNutricionalNombre || '',
          plantaId: usuarioRaw.plantaId || usuarioRaw.PlantaId || null,
          plantaNombre: usuarioRaw.plantaNombre || usuarioRaw.PlantaNombre || '',
          centroCostoId: usuarioRaw.centroCostoId || usuarioRaw.CentroCostoId || null,
          centroCostoNombre: usuarioRaw.centroCostoNombre || usuarioRaw.CentroCostoNombre || '',
          proyectoId: usuarioRaw.proyectoId || usuarioRaw.ProyectoId || null,
          proyectoNombre: usuarioRaw.proyectoNombre || usuarioRaw.ProyectoNombre || '',
          jerarquiaId: usuarioRaw.jerarquiaId || usuarioRaw.JerarquiaId || null,
          jerarquiaNombre: usuarioRaw.jerarquiaNombre || usuarioRaw.JerarquiaNombre || '',
          bonificacionesInvitado: usuarioRaw.bonificacionesInvitado || usuarioRaw.BonificacionesInvitado || 0,
          pedidos: usuarioRaw.pedidos || usuarioRaw.Pedidos || 0,
          bonificaciones: usuarioRaw.bonificaciones || usuarioRaw.Bonificaciones || 0,
          descuento: usuarioRaw.descuento !== undefined ? usuarioRaw.descuento : (usuarioRaw.Descuento !== undefined ? usuarioRaw.Descuento : 0),
          activo: usuarioRaw.activo !== undefined ? usuarioRaw.activo : (usuarioRaw.Activo !== undefined ? usuarioRaw.Activo : true)
        };
      }
      
      // Normalizar arrays de turnos y menuDelDia
      const turnosRaw = dataRaw.Turnos || dataRaw.turnos || [];
      const turnosNormalizados = Array.isArray(turnosRaw) ? turnosRaw.map(turno => ({
        id: turno.id || turno.Id || null,
        Id: turno.Id || turno.id || null,
        nombre: turno.nombre || turno.Nombre || '',
        Nombre: turno.Nombre || turno.nombre || '',
        horaDesde: turno.horaDesde || turno.HoraDesde || '',
        horaHasta: turno.horaHasta || turno.HoraHasta || ''
      })) : [];
      
      const menuDelDiaRaw = dataRaw.MenuDelDia || dataRaw.menuDelDia || [];
      const menuDelDiaNormalizado = Array.isArray(menuDelDiaRaw) ? menuDelDiaRaw : [];
      
      const platosPedidosRaw = dataRaw.PlatosPedidos || dataRaw.platosPedidos || dataRaw.PedidosHoy || dataRaw.pedidosHoy || [];
      const platosPedidosNormalizado = Array.isArray(platosPedidosRaw) ? platosPedidosRaw : [];
      
      const data = {
        Usuario: usuarioNormalizado || usuarioRaw, // Mantener estructura original también
        usuario: usuarioNormalizado,
        Turnos: turnosNormalizados,
        turnos: turnosNormalizados,
        MenuDelDia: menuDelDiaNormalizado,
        menuDelDia: menuDelDiaNormalizado,
        PlatosPedidos: platosPedidosNormalizado,
        platosPedidos: platosPedidosNormalizado
      };
      
      console.log('✅ [InicioService] Datos normalizados');
      console.log('   - usuario:', data.usuario ? '✅ Presente' : '❌ Ausente');
      console.log('   - turnos:', Array.isArray(data.turnos) ? `✅ Array con ${data.turnos.length} elementos` : '❌ No es array');
      console.log('   - menuDelDia:', Array.isArray(data.menuDelDia) ? `✅ Array con ${data.menuDelDia.length} elementos` : '❌ No es array');
      console.log('   - platosPedidos:', Array.isArray(data.platosPedidos) ? `✅ Array con ${data.platosPedidos.length} elementos` : '❌ No es array');
      console.log('');
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ [InicioService] getInicioWeb COMPLETADO EXITOSAMENTE');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      
      return data;
    } catch (error) {
      // Solo loggear errores en desarrollo para mejorar rendimiento
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [InicioService] Error:', error.message, 'Status:', error.response?.status || 'N/A');
      }
      throw error;
    }
  },

  /**
   * Obtiene datos actualizados del inicio para web
   * Llama a api/inicio/web-actualizado con el turnoId seleccionado y la fecha del día
   * 
   * @param {string|number} usuarioId - ID del usuario
   * @param {string} fecha - Fecha del día en formato 'YYYY-MM-DD' (ej: '2025-01-15')
   * @param {number|null} turnoId - ID del turno seleccionado (opcional)
   * @returns {Promise<Object>} Datos del inicio actualizados con estructura normalizada
   */
  getInicioWebActualizado: async (usuarioId, fecha, turnoId = null) => {
    try {
      // Obtener configuración para la URL base de la API
      const appConfig = await loadConfig(true);
      const baseUrl = appConfig?.apiBaseUrl || getApiBaseUrl() || 'http://localhost:8000';
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      
      // Convertir usuarioId a número entero si es posible
      const usuarioIdNumero = parseInt(usuarioId, 10);
      const usuarioIdParam = !isNaN(usuarioIdNumero) ? usuarioIdNumero : usuarioId;
      
      // Construir URL con parámetros
      let url = `${baseUrl}/api/inicio/web-actualizado?id=${usuarioIdParam}`;
      
      // Agregar fecha del día (siempre requerida)
      if (fecha) {
        url += `&fecha=${encodeURIComponent(fecha)}`;
      }
      
      // Agregar turnoId si está presente
      if (turnoId !== null && turnoId !== undefined) {
        const turnoIdNumero = parseInt(turnoId, 10);
        if (!isNaN(turnoIdNumero)) {
          url += `&turnoId=${turnoIdNumero}`;
        }
      }
      
      // Agregar timestamp para evitar caché
      const timestamp = Date.now();
      
      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // Agregar token si existe
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Hacer la llamada HTTP
      const response = await api.get(url, {
        params: {
          id: usuarioIdParam,
          fecha: fecha,
          turnoId: turnoId !== null && turnoId !== undefined ? parseInt(turnoId, 10) : undefined,
          _t: timestamp
        },
        headers: headers
      });
      
      // Procesar respuesta exitosa
      const dataRaw = response.data;
      
      // Normalizar datos (misma lógica que getInicioWeb)
      const usuarioRaw = dataRaw.Usuario || dataRaw.usuario || null;
      let usuarioNormalizado = null;
      
      if (usuarioRaw) {
        usuarioNormalizado = {
          id: usuarioRaw.id || usuarioRaw.Id || null,
          nombre: usuarioRaw.nombre || usuarioRaw.Nombre || '',
          apellido: usuarioRaw.apellido || usuarioRaw.Apellido || '',
          legajo: usuarioRaw.legajo || usuarioRaw.Legajo || '',
          dni: usuarioRaw.dni || usuarioRaw.Dni || null,
          cuil: usuarioRaw.cuil || usuarioRaw.Cuil || null,
          planNutricionalId: usuarioRaw.planNutricionalId || usuarioRaw.PlanNutricionalId || null,
          planNutricionalNombre: usuarioRaw.planNutricionalNombre || usuarioRaw.PlanNutricionalNombre || '',
          plantaId: usuarioRaw.plantaId || usuarioRaw.PlantaId || null,
          plantaNombre: usuarioRaw.plantaNombre || usuarioRaw.PlantaNombre || '',
          centroCostoId: usuarioRaw.centroCostoId || usuarioRaw.CentroCostoId || null,
          centroCostoNombre: usuarioRaw.centroCostoNombre || usuarioRaw.CentroCostoNombre || '',
          proyectoId: usuarioRaw.proyectoId || usuarioRaw.ProyectoId || null,
          proyectoNombre: usuarioRaw.proyectoNombre || usuarioRaw.ProyectoNombre || '',
          jerarquiaId: usuarioRaw.jerarquiaId || usuarioRaw.JerarquiaId || null,
          jerarquiaNombre: usuarioRaw.jerarquiaNombre || usuarioRaw.JerarquiaNombre || '',
          bonificacionesInvitado: usuarioRaw.bonificacionesInvitado || usuarioRaw.BonificacionesInvitado || 0,
          pedidos: usuarioRaw.pedidos || usuarioRaw.Pedidos || 0,
          bonificaciones: usuarioRaw.bonificaciones || usuarioRaw.Bonificaciones || 0,
          descuento: usuarioRaw.descuento !== undefined ? usuarioRaw.descuento : (usuarioRaw.Descuento !== undefined ? usuarioRaw.Descuento : 0),
          activo: usuarioRaw.activo !== undefined ? usuarioRaw.activo : (usuarioRaw.Activo !== undefined ? usuarioRaw.Activo : true)
        };
      }
      
      // Normalizar arrays de turnos y menuDelDia
      const turnosRaw = dataRaw.Turnos || dataRaw.turnos || [];
      const turnosNormalizados = Array.isArray(turnosRaw) ? turnosRaw.map(turno => ({
        id: turno.id || turno.Id || null,
        Id: turno.Id || turno.id || null,
        nombre: turno.nombre || turno.Nombre || '',
        Nombre: turno.Nombre || turno.nombre || '',
        horaDesde: turno.horaDesde || turno.HoraDesde || '',
        horaHasta: turno.horaHasta || turno.HoraHasta || ''
      })) : [];
      
      const menuDelDiaRaw = dataRaw.MenuDelDia || dataRaw.menuDelDia || [];
      const menuDelDiaNormalizado = Array.isArray(menuDelDiaRaw) ? menuDelDiaRaw : [];
      
      const platosPedidosRaw = dataRaw.PlatosPedidos || dataRaw.platosPedidos || dataRaw.PedidosHoy || dataRaw.pedidosHoy || [];
      const platosPedidosNormalizado = Array.isArray(platosPedidosRaw) ? platosPedidosRaw : [];
      
      const data = {
        Usuario: usuarioNormalizado || usuarioRaw,
        usuario: usuarioNormalizado,
        Turnos: turnosNormalizados,
        turnos: turnosNormalizados,
        MenuDelDia: menuDelDiaNormalizado,
        menuDelDia: menuDelDiaNormalizado,
        PlatosPedidos: platosPedidosNormalizado,
        platosPedidos: platosPedidosNormalizado
      };
      
      return data;
    } catch (error) {
      // Silenciar errores de actualización periódica para no interrumpir la experiencia del usuario
      // Solo lanzar error si es crítico (401)
      if (error.response?.status === 401) {
        throw error;
      }
      // Para otros errores, retornar null para que el componente pueda manejarlo
      return null;
    }
  },
};

