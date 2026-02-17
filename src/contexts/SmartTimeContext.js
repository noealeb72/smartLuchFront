import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useDashboard } from './DashboardContext';
import { configApiService } from '../services/configApiService';

const SmartTimeContext = createContext();

/** Rutas de menú administrador (Admin o Gerencia) donde se valida smarTime */
const ADMIN_ROUTES = [
  '/usuarios',
  '/planta',
  '/centrodecosto',
  '/proyecto',
  '/plannutricional',
  '/jerarquia',
  '/turno',
  '/plato',
  '/menudeldia',
  '/reportegcomensales',
  '/reporteggestion',
  '/configuracion',
];

const isAdminRoute = (pathname) => {
  const path = (pathname || '').toLowerCase().replace(/\/$/, '');
  return ADMIN_ROUTES.some((route) => path === route || path.startsWith(route + '/'));
};

export const useSmartTime = () => {
  const context = useContext(SmartTimeContext);
  if (!context) {
    throw new Error('useSmartTime debe usarse dentro de SmartTimeProvider');
  }
  return context;
};

export const SmartTimeProvider = ({ children }) => {
  const { getCurrentRole } = useAuth();
  const { usuarioData } = useDashboard();
  const location = useLocation();
  const [smarTimeHabilitado, setSmarTimeHabilitado] = useState(false);

  const role = getCurrentRole(usuarioData) || '';
  const isAdmin = role === 'Admin' || role === 'Gerencia';
  const onAdminRoute = isAdminRoute(location.pathname);

  const validarSmartTime = useCallback(async () => {
    if (!isAdmin) {
      setSmarTimeHabilitado(false);
      return;
    }
    try {
      const habilitado = await configApiService.getSmartTimeConfig();
      setSmarTimeHabilitado(habilitado === true);
    } catch {
      setSmarTimeHabilitado(false);
    }
  }, [isAdmin]);

  // Validar smarTime cuando: 1) usuario es Admin/Gerencia, 2) entra a menú admin o se monta
  useEffect(() => {
    if (!isAdmin) {
      setSmarTimeHabilitado(false);
      return;
    }
    validarSmartTime();
  }, [isAdmin, onAdminRoute, location.pathname, validarSmartTime]);

  const value = {
    smarTimeHabilitado,
    validarSmartTime,
  };

  return (
    <SmartTimeContext.Provider value={value}>
      {children}
    </SmartTimeContext.Provider>
  );
};
