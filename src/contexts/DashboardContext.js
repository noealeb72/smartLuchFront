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
    const turnosData = data.Turnos || data.turnos || [];
    const pedidosData = data.PlatosPedidos || data.platosPedidos || data.PedidosHoy || data.pedidosHoy || [];
    const menuData = data.MenuDelDia || data.menuDelDia || [];
    
    // Actualizar datos del usuario si vienen en la respuesta
    if (data.Usuario) {
      const usuario = data.Usuario;
      // Guardar datos adicionales del usuario en localStorage si es necesario
      if (usuario.Id) localStorage.setItem('id', String(usuario.Id));
      if (usuario.Nombre) localStorage.setItem('nombre', usuario.Nombre);
      if (usuario.Apellido) localStorage.setItem('apellido', usuario.Apellido);
      if (usuario.PlanNutricionalId) localStorage.setItem('plannutricional_id', String(usuario.PlanNutricionalId));
      if (usuario.PlanNutricionalNombre) localStorage.setItem('plannutricional_nombre', usuario.PlanNutricionalNombre);
      if (usuario.PlantaId) localStorage.setItem('planta_id', String(usuario.PlantaId));
      if (usuario.CentroCostoId) localStorage.setItem('centrodecosto_id', String(usuario.CentroCostoId));
      if (usuario.ProyectoId) localStorage.setItem('proyecto_id', String(usuario.ProyectoId));
      if (usuario.JerarquiaId) localStorage.setItem('jerarquia_id', String(usuario.JerarquiaId));
      if (usuario.JerarquiaNombre) {
        localStorage.setItem('jerarquia_nombre', usuario.JerarquiaNombre);
        localStorage.setItem('role', usuario.JerarquiaNombre);
        
        // Actualizar el estado del usuario en AuthContext si existe setUser
        // Usar una función para evitar dependencias innecesarias
        setUser((prevUser) => {
          if (prevUser && prevUser.role !== usuario.JerarquiaNombre) {
            return {
              ...prevUser,
              jerarquia: usuario.JerarquiaNombre,
              jerarquia_nombre: usuario.JerarquiaNombre,
              role: usuario.JerarquiaNombre,
            };
          }
          return prevUser;
        });
      }
      if (usuario.Bonificaciones !== undefined) localStorage.setItem('bonificaciones', String(usuario.Bonificaciones));
      if (usuario.BonificacionesInvitado !== undefined) localStorage.setItem('bonificaciones_invitado', String(usuario.BonificacionesInvitado));
      
      // Guardar datos del usuario en el estado
      setUsuarioData({
        id: usuario.Id,
        nombre: usuario.Nombre,
        apellido: usuario.Apellido,
        planNutricionalId: usuario.PlanNutricionalId,
        planNutricionalNombre: usuario.PlanNutricionalNombre,
        plantaId: usuario.PlantaId,
        centroCostoId: usuario.CentroCostoId,
        proyectoId: usuario.ProyectoId,
        jerarquiaId: usuario.JerarquiaId,
        jerarquiaNombre: usuario.JerarquiaNombre,
        bonificaciones: usuario.Bonificaciones,
        bonificacionesInvitado: usuario.BonificacionesInvitado,
        activo: usuario.Activo,
      });
    }
    
    setTurnos(Array.isArray(turnosData) ? turnosData : []);
    setPedidosHoy(Array.isArray(pedidosData) ? pedidosData : []);
    setMenuDelDia(Array.isArray(menuData) ? menuData : []);
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

