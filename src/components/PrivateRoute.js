import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, hasAnyRole, loading, user } = useAuth();
  const { usuarioData } = useDashboard();

  // Obtener el role desde user o usuarioData (priorizar user, pero usar usuarioData como fallback)
  const userRole = user?.role || user?.jerarquia_nombre || usuarioData?.jerarquiaNombre || '';

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
  if (allowedRoles.length > 0) {
    // Verificar si el usuario tiene alguno de los roles permitidos
    const hasRole = allowedRoles.some(role => 
      userRole === role || 
      user?.role === role || 
      user?.jerarquia_nombre === role ||
      usuarioData?.jerarquiaNombre === role
    );

    if (!hasRole) {
      console.warn('⚠️ [PrivateRoute] Usuario no tiene rol permitido:', {
        userRole,
        allowedRoles,
        userRoleFromUser: user?.role,
        userJerarquiaNombre: user?.jerarquia_nombre,
        usuarioDataJerarquiaNombre: usuarioData?.jerarquiaNombre
      });
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;

