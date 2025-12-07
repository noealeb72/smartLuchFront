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
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [pedidosHoy, setPedidosHoy] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarDashboardInicio = useCallback(async () => {
    // Solo cargar si el usuario está autenticado
    if (!isAuthenticated()) {
      setLoading(false);
      setTurnos([]);
      setPedidosHoy([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Cargando dashboard inicio...');
      const data = await apiService.getDashboardInicio();
      console.log('Dashboard inicio cargado:', data);
      
      // El backend devuelve { Turnos: [...], PedidosHoy: [...] }
      const turnosData = data.Turnos || data.turnos || [];
      const pedidosData = data.PedidosHoy || data.pedidosHoy || [];
      
      setTurnos(Array.isArray(turnosData) ? turnosData : []);
      setPedidosHoy(Array.isArray(pedidosData) ? pedidosData : []);
    } catch (err) {
      console.error('Error al cargar dashboard inicio:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los datos iniciales';
      setError(errorMessage);
      setTurnos([]);
      setPedidosHoy([]);
      
      // Mostrar error más detallado en consola para debugging
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
      } else if (err.request) {
        console.error('Error request:', err.request);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar datos cuando el usuario se autentica o cambia
  useEffect(() => {
    if (isAuthenticated() && user) {
      cargarDashboardInicio();
    } else {
      setTurnos([]);
      setPedidosHoy([]);
      setLoading(false);
      setError(null);
    }
  }, [cargarDashboardInicio, user, isAuthenticated]);

  const value = {
    turnos,
    pedidosHoy,
    loading,
    error,
    recargar: cargarDashboardInicio,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

