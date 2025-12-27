import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe usarse dentro de DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const { user, isAuthenticated, setUser } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [pedidosHoy, setPedidosHoy] = useState([]);
  const [menuDelDia, setMenuDelDia] = useState([]);
  const [usuarioData, setUsuarioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // DashboardContext ya no carga datos automáticamente
  // Index se encarga de llamar a /api/inicio/web y actualizar estos estados

  // Funciones para actualizar los datos desde Index
  const actualizarDatos = useCallback((data) => {
    console.log('🔄 [DashboardContext] actualizarDatos llamado con:', data);
    console.log('🔄 [DashboardContext] Estructura completa de data:', JSON.stringify(data, null, 2));
    
    const turnosData = data.Turnos || data.turnos || [];
    console.log('⏰ [DashboardContext] Turnos recibidos:', turnosData, 'Cantidad:', turnosData.length);
    // Usar PlatosPedidos de la respuesta de api/inicio/web
    const pedidosData = data.PlatosPedidos || data.platosPedidos || data.PedidosHoy || data.pedidosHoy || [];
    console.log('🍽️ [DashboardContext] PlatosPedidos recibidos:', pedidosData, 'Cantidad:', pedidosData.length);
    // Usar MenuDelDia de la respuesta de api/inicio/web
    const menuData = data.MenuDelDia || data.menuDelDia || [];
    console.log('📋 [DashboardContext] MenuDelDia recibido:', menuData, 'Cantidad:', menuData.length);
    
      // Actualizar datos del usuario si vienen en la respuesta
      if (data.Usuario) {
        console.log('👤 [DashboardContext] Actualizando datos del usuario:', data.Usuario);
        const usuario = data.Usuario;
        
        // Obtener JerarquiaNombre (el backend envía "JerarquiaNombre" con mayúscula J y N)
        // Priorizar exactamente como viene del backend: JerarquiaNombre
        const jerarquiaNombre = usuario.JerarquiaNombre || usuario.jerarquiaNombre || usuario.Jerarquia || usuario.jerarquia || '';
        
        console.log('🔍 [DashboardContext] ==========================================');
        console.log('🔍 [DashboardContext] ACTUALIZANDO USUARIO DESDE API');
        console.log('🔍 [DashboardContext] ==========================================');
        console.log('🔍 [DashboardContext] JerarquiaNombre del backend (exacto):', usuario.JerarquiaNombre);
        console.log('🔍 [DashboardContext] Jerarquía encontrada (final):', jerarquiaNombre);
        console.log('🔍 [DashboardContext] Usuario completo:', JSON.stringify(usuario, null, 2));
        console.log('🔍 [DashboardContext] ==========================================');
        
        // NO guardar datos en localStorage, solo actualizar el estado
        // Actualizar el estado del usuario en AuthContext
        if (jerarquiaNombre) {
          setUser((prevUser) => {
            // Si hay usuario previo, actualizarlo; si no, crear uno nuevo con el token
            const token = prevUser?.token || localStorage.getItem('token');
            const nuevoUsuario = {
              ...(prevUser || {}),
              token: token, // Mantener el token
              id: usuario.Id || usuario.id || prevUser?.id,
              jerarquia: jerarquiaNombre,
              jerarquia_nombre: jerarquiaNombre, // Jerarquía para mostrar en navbar
              role: jerarquiaNombre, // Jerarquía para permisos (IMPORTANTE: debe coincidir con las condiciones del Navbar)
              nombre: usuario.Nombre || usuario.nombre || prevUser?.nombre || '',
              apellido: usuario.Apellido || usuario.apellido || prevUser?.apellido || '',
              username: prevUser?.username || '',
              nombreCompleto: `${usuario.Nombre || usuario.nombre || ''} ${usuario.Apellido || usuario.apellido || ''}`.trim(),
              activo: usuario.Activo !== undefined ? usuario.Activo : (prevUser?.activo !== undefined ? prevUser.activo : true),
            };
            console.log('✅ [DashboardContext] Usuario actualizado en AuthContext:', nuevoUsuario);
            console.log('✅ [DashboardContext] Role establecido:', nuevoUsuario.role);
            console.log('✅ [DashboardContext] Jerarquía nombre establecido:', nuevoUsuario.jerarquia_nombre);
            return nuevoUsuario;
          });
          console.log('✅ [DashboardContext] Usuario actualizado en AuthContext con jerarquía:', jerarquiaNombre);
        } else {
          console.warn('⚠️ [DashboardContext] No se encontró JerarquiaNombre en los datos del usuario');
          console.warn('⚠️ [DashboardContext] Campos disponibles:', Object.keys(usuario));
        }
      
        // Guardar datos del usuario en el estado (manejar diferentes casos de mayúsculas/minúsculas)
        setUsuarioData({
          id: usuario.Id || usuario.id,
          nombre: usuario.Nombre || usuario.nombre,
          apellido: usuario.Apellido || usuario.apellido,
          planNutricionalId: usuario.Plannutricional_id || usuario.PlanNutricionalId || usuario.plannutricional_id || usuario.planNutricionalId,
          planNutricionalNombre: usuario.PlanNutricionalNombre || usuario.planNutricionalNombre,
          plantaId: usuario.PlantaId || usuario.plantaId,
          centroCostoId: usuario.CentroCostoId || usuario.centroCostoId,
          proyectoId: usuario.ProyectoId || usuario.proyectoId,
          jerarquiaId: usuario.JerarquiaId || usuario.jerarquiaId,
          jerarquiaNombre: jerarquiaNombre,
          bonificaciones: usuario.Bonificaciones || usuario.bonificaciones || 0,
          bonificacionesInvitado: usuario.BonificacionesInvitado || usuario.bonificacionesInvitado || 0,
          activo: usuario.Activo !== undefined ? usuario.Activo : (usuario.activo !== undefined ? usuario.activo : true),
        });
        console.log('✅ [DashboardContext] Datos del usuario actualizados en el estado:', {
          id: usuario.Id || usuario.id,
          jerarquiaNombre: jerarquiaNombre,
          nombre: usuario.Nombre || usuario.nombre,
          apellido: usuario.Apellido || usuario.apellido
        });
      } else {
        console.log('⚠️ [DashboardContext] No se recibieron datos del Usuario en la respuesta');
      }
    
    setTurnos(Array.isArray(turnosData) ? turnosData : []);
    setPedidosHoy(Array.isArray(pedidosData) ? pedidosData : []);
    setMenuDelDia(Array.isArray(menuData) ? menuData : []);
    console.log('✅ Datos actualizados - Turnos:', turnosData.length, 'Pedidos:', pedidosData.length, 'MenuDelDia:', menuData.length);
  }, [setUser]); // Solo setUser como dependencia, no user

  const value = {
    turnos,
    pedidosHoy,
    menuDelDia,
    usuarioData,
    loading,
    error,
    actualizarDatos,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

