import api from './apiClient';
import { getApiBaseUrl, loadConfig } from './configService';

const normalizeInicioData = (dataRaw) => {
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
      bonificacionesAplicadas: usuarioRaw.bonificacionesAplicadas ?? usuarioRaw.BonificacionesAplicadas ?? 0,
      pedidos: usuarioRaw.pedidos || usuarioRaw.Pedidos || 0,
      bonificaciones: usuarioRaw.bonificaciones || usuarioRaw.Bonificaciones || 0,
      descuento: usuarioRaw.descuento !== undefined ? usuarioRaw.descuento : (usuarioRaw.Descuento !== undefined ? usuarioRaw.Descuento : 0),
      activo: usuarioRaw.activo !== undefined ? usuarioRaw.activo : (usuarioRaw.Activo !== undefined ? usuarioRaw.Activo : true)
    };
  }
  
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
  
  return {
    Usuario: usuarioNormalizado || usuarioRaw,
    usuario: usuarioNormalizado,
    Turnos: turnosNormalizados,
    turnos: turnosNormalizados,
    MenuDelDia: menuDelDiaNormalizado,
    menuDelDia: menuDelDiaNormalizado,
    PlatosPedidos: platosPedidosNormalizado,
    platosPedidos: platosPedidosNormalizado
  };
};

export const inicioService = {
  getInicioWeb: async (usuarioId) => {
    try {
      const appConfig = await loadConfig(true);
      const baseUrl = appConfig?.apiBaseUrl || getApiBaseUrl() || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const usuarioIdNumero = parseInt(usuarioId, 10);
      const usuarioIdParam = !isNaN(usuarioIdNumero) ? usuarioIdNumero : usuarioId;
      
      const url = `${baseUrl}/api/inicio/web`;
      const timestamp = Date.now();
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get(url, {
        params: { id: usuarioIdParam, _t: timestamp },
        headers: headers
      });
      
      return normalizeInicioData(response.data);
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || '';
      if (error.response?.status === 500 && (String(msg).includes('No hay turnos') || String(msg).includes('turnos disponibles'))) {
        return {
          Usuario: null, usuario: null,
          Turnos: [], turnos: [],
          MenuDelDia: [], menuDelDia: [],
          PlatosPedidos: [], platosPedidos: []
        };
      }
      throw error;
    }
  },

  getInicioWebActualizado: async (usuarioId, turnoId, fechaHoy) => {
    try {
      const appConfig = await loadConfig(true);
      const baseUrl = appConfig?.apiBaseUrl || getApiBaseUrl() || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      const idScalar = Array.isArray(usuarioId) ? usuarioId[0] : usuarioId;
      const usuarioIdNumero = parseInt(idScalar, 10);
      const usuarioIdParam = !isNaN(usuarioIdNumero) ? usuarioIdNumero : idScalar;
      
      const turnoScalar = Array.isArray(turnoId) ? turnoId[0] : turnoId;
      const turnoIdNum = turnoScalar !== null && turnoScalar !== undefined ? parseInt(turnoScalar, 10) : null;
      const turnoParam = (turnoIdNum !== null && !isNaN(turnoIdNum) && turnoIdNum > 0) ? turnoIdNum : 0;
      
      const fechaScalar = Array.isArray(fechaHoy) ? fechaHoy[0] : fechaHoy;
      const hoy = new Date();
      const fechaDefault = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

      const url = `${baseUrl}/api/inicio/web-actualizado`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get(url, {
        params: {
          id: usuarioIdParam,
          turno: turnoParam,
          fecha: fechaScalar && String(fechaScalar).trim() ? fechaScalar : fechaDefault
        },
        headers
      });
      
      return normalizeInicioData(response.data);
    } catch (error) {
      if (error.response?.status === 401) throw error;
      return null;
    }
  }
};
