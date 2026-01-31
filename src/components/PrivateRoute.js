import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, getCurrentRole } = useAuth();
  const { usuarioData } = useDashboard();

  if (loading) {
    return (
      <div className="se-pre-con">
        <span className="sr-only">Cargando contenido, por favor espere...</span>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles si se especificaron
  // Usar la función centralizada getCurrentRole para obtener el rol de forma consistente
  if (allowedRoles.length > 0) {
    const userRole = getCurrentRole(usuarioData);
    
    // Verificar si el usuario tiene alguno de los roles permitidos
    const hasRole = userRole && allowedRoles.includes(userRole);

    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;

