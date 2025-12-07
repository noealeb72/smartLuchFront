import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = memo(() => {
  const { user, logout } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [openDropdowns, setOpenDropdowns] = useState({});

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const formattedDate = now.toLocaleString('es-ES', options);
      setCurrentDateTime(formattedDate);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const toggleDropdown = (dropdownId) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [dropdownId]: !prev[dropdownId],
    }));
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark smart-bg" role="navigation" aria-label="Navegación principal" style={{ margin: 0, padding: 0 }}>
      {/* Logo - siempre visible arriba en móvil */}
      <div className="w-100 d-lg-none d-block text-center py-2">
        <h4 className="navbar-brand smart-title mb-0" style={{ marginLeft: '3rem', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', gap: '0' }}>
          <i className="fa fa-utensils" style={{ margin: '0', padding: '0' }} aria-hidden="true"></i>
          <span style={{ marginLeft: '-0.2rem', paddingLeft: '0', letterSpacing: '0' }}>SmartLunch</span>
        </h4>
      </div>

      {/* Desktop: Estructura con flexbox */}
      <div className="d-none d-lg-flex w-100 align-items-center justify-content-between">
        {/* Logo a la izquierda */}
        <h3 className="navbar-brand mb-0" style={{ marginLeft: '3rem', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', gap: '0' }}>
          <i className="fa fa-utensils" style={{ margin: '0', padding: '0' }} aria-hidden="true"></i>
          <span className="smart-title" style={{ marginLeft: '-0.2rem', paddingLeft: '0', letterSpacing: '0' }}>SmartLunch</span>
        </h3>


        {/* Jerarquía y fecha/hora en el centro */}
        <div className="d-flex align-items-center" style={{ fontSize: '0.8em', fontWeight: 'normal', opacity: 0.9, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} aria-live="polite">
          {(user?.role || user?.jerarquia_nombre) && (
            <span className="mr-3 d-flex align-items-center" aria-label="Jerarquía del usuario">
              <i className="fa fa-user mr-1" style={{ fontSize: '1.1em' }} aria-hidden="true"></i>
              <span className="badge badge-light text-dark" style={{ fontSize: '0.9em', padding: '0.3em 0.6em' }} aria-label={`Jerarquía: ${user.jerarquia_nombre || user.role}`}>
                {user.jerarquia_nombre || user.role}
              </span>
            </span>
          )}
          <span className="d-flex align-items-center" aria-label="Fecha y hora actual">
            <i className="fa fa-clock mr-1" style={{ fontSize: '1.1em' }} aria-hidden="true"></i>
            <time id="current-datetime" style={{ fontSize: '1em' }} dateTime={new Date().toISOString()}>
              {currentDateTime}
            </time>
          </span>
        </div>
      </div>

      {/* Mobile: Jerarquía, fecha/hora y botón Salir en la misma línea */}
      <div className="w-100 d-lg-none d-flex align-items-center justify-content-between px-3 py-2" style={{ fontSize: '0.75em', fontWeight: 'normal', opacity: 0.9 }} aria-live="polite">
        <div className="d-flex align-items-center">
          {(user?.role || user?.jerarquia_nombre) && (
            <span className="mr-2 d-flex align-items-center" aria-label="Jerarquía del usuario">
              <i className="fa fa-user mr-1" style={{ fontSize: '1em' }} aria-hidden="true"></i>
              <span className="badge badge-light text-dark" style={{ fontSize: '0.85em', padding: '0.25em 0.5em' }} aria-label={`Jerarquía: ${user.jerarquia_nombre || user.role}`}>
                {user.jerarquia_nombre || user.role}
              </span>
            </span>
          )}
          <span className="d-flex align-items-center" aria-label="Fecha y hora actual">
            <i className="fa fa-clock mr-1" style={{ fontSize: '1em' }} aria-hidden="true"></i>
            <time id="current-datetime-mobile" style={{ fontSize: '0.9em' }} dateTime={new Date().toISOString()}>
              {currentDateTime}
            </time>
          </span>
        </div>
        <Link 
          className="btn btn-outline-light btn-sm" 
          to="/login" 
          onClick={handleLogout} 
          aria-label="Cerrar sesión" 
          title="Cerrar sesión"
          style={{ fontSize: '0.85em', whiteSpace: 'nowrap' }}
        >
          <i className="fa fa-sign-out-alt mr-1" aria-hidden="true"></i>Salir
        </Link>
      </div>

      {/* Desktop: Menú siempre visible a la derecha (sin hamburguesa) */}
      <div className="d-none d-lg-block ml-auto" id="navbarSupportedContent" role="menu">
        <ul className="navbar-nav text-right" id="navbar-menu" role="menubar">
          {user?.role !== 'Comensal' && (
            <li className="nav-item active" role="none">
              <Link className="nav-link" to="/" aria-label="Ir a inicio" role="menuitem">
                <i className="fa fa-home mr-2" aria-hidden="true"></i> Inicio
              </Link>
            </li>
          )}

          {user?.role === 'Cocina' && (
            <>
              <li className="nav-item active" role="none">
                <Link className="nav-link" to="/despacho" aria-label="Despacho de plato" role="menuitem">
                  <i className="fa fa-edit mr-2" aria-hidden="true"></i> Despacho de plato
                </Link>
              </li>
              <li className="nav-item dropdown" role="none">
                <a
                  className="nav-link dropdown-toggle active"
                  href="#"
                  id="ddCocina"
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown('ddCocina');
                  }}
                  aria-haspopup="true"
                  aria-expanded={openDropdowns.ddCocina || false}
                  aria-label="Menú de cocina"
                >
                  <i className="fa fa-boxes mr-2" aria-hidden="true"></i> Cocina
                </a>
                <div 
                  className={`dropdown-menu ${openDropdowns.ddCocina ? 'show' : ''}`} 
                  aria-labelledby="ddCocina" 
                  role="menu"
                >
                  <Link 
                    className="dropdown-item" 
                    to="/plato" 
                    role="menuitem"
                    onClick={() => setOpenDropdowns({})}
                  >
                    Platillos
                  </Link>
                  <Link 
                    className="dropdown-item" 
                    to="/menudeldia" 
                    role="menuitem"
                    onClick={() => setOpenDropdowns({})}
                  >
                    Menú del día
                  </Link>
                </div>
              </li>
            </>
          )}

          {user?.role === 'Gerencia' && (
            <li className="nav-item dropdown" role="none">
              <a
                className="nav-link dropdown-toggle active"
                href="#"
                id="ddReportes"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown('ddReportes');
                }}
                aria-haspopup="true"
                aria-expanded={openDropdowns.ddReportes || false}
                aria-label="Menú de reportes"
              >
                <i className="fa fa-chart-bar mr-2" aria-hidden="true"></i> Reportes de Gestión
              </a>
              <div 
                className={`dropdown-menu ${openDropdowns.ddReportes ? 'show' : ''}`} 
                aria-labelledby="ddReportes" 
                role="menu"
              >
                <Link 
                  className="dropdown-item" 
                  to="/reportegcomensales" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Reporte por Comensal
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/reporteggestion" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Reporte de Gestión
                </Link>
              </div>
            </li>
          )}

          {(user?.role === 'Admin' || user?.role === 'Gerencia') && (
            <li className="nav-item dropdown" role="none">
              <a
                className="nav-link dropdown-toggle active"
                href="#"
                id="ddConfig"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown('ddConfig');
                }}
                aria-haspopup="true"
                aria-expanded={openDropdowns.ddConfig || false}
                aria-label="Menú de configuración"
              >
                <i className="fa fa-cog mr-2" aria-hidden="true"></i> Configuración
              </a>
              <div 
                className={`dropdown-menu ${openDropdowns.ddConfig ? 'show' : ''}`} 
                aria-labelledby="ddConfig" 
                role="menu"
              >
                <Link 
                  className="dropdown-item" 
                  to="/usuarios" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Usuarios
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/planta" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Planta
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/centrodecosto" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Centro de Costo
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/proyecto" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Proyecto
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/plannutricional" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Perfil Nutricional
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/jerarquia" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Jerarquía
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/turno" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  Turnos
                </Link>
                <div className="dropdown-divider"></div>
                <Link 
                  className="dropdown-item" 
                  to="/configuracion" 
                  role="menuitem"
                  onClick={() => setOpenDropdowns({})}
                >
                  <i className="fa fa-server mr-2" aria-hidden="true"></i>
                  Configuración del Servidor
                </Link>
              </div>
            </li>
          )}

          <li className="nav-item active" role="none">
            <Link className="nav-link" to="/login" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión" role="menuitem">
              <i className="fa fa-sign-out-alt mr-2" aria-hidden="true"></i>
              <span className="d-none d-lg-inline">Salir</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
