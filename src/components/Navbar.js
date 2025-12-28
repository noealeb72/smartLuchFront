import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';
import './Navbar.css';

const Navbar = memo(() => {
  const { user, logout } = useAuth();
  const { usuarioData } = useDashboard();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Obtener jerarquía desde user o usuarioData (priorizar user, pero usar usuarioData como fallback)
  const jerarquiaNombre = user?.jerarquia_nombre || user?.role || usuarioData?.jerarquiaNombre || '';
  const role = user?.role || user?.jerarquia_nombre || usuarioData?.jerarquiaNombre || '';

  // Log para depuración
  useEffect(() => {
    console.log('🔍 [Navbar] ==========================================');
    console.log('🔍 [Navbar] Usuario de AuthContext:', user);
    console.log('🔍 [Navbar] UsuarioData de DashboardContext:', usuarioData);
    console.log('🔍 [Navbar] Role final:', role);
    console.log('🔍 [Navbar] Jerarquía nombre final:', jerarquiaNombre);
    console.log('🔍 [Navbar] ==========================================');
  }, [user, usuarioData, role, jerarquiaNombre]);

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
    setOpenDropdowns((prev) => {
      // Si el dropdown que se está haciendo clic ya está abierto, cerrarlo
      if (prev[dropdownId]) {
        return {};
      }
      // Si está cerrado, abrirlo y cerrar todos los demás
      return {
        [dropdownId]: true,
      };
    });
  };

  // Cerrar dropdowns y menú móvil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setOpenDropdowns({});
      }
      // Cerrar menú móvil si se hace clic fuera del navbar
      if (isMobileMenuOpen && !event.target.closest('.navbar')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Cerrar menú móvil al redimensionar la ventana a tablet/desktop
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 768);
      if (width >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize(); // Llamar una vez al montar
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
    <nav className="navbar navbar-expand-lg navbar-dark smart-bg" role="navigation" aria-label="Navegación principal" style={{ margin: 0, padding: 0, position: 'relative' }}>
      <div className="container-fluid" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', width: '100%', position: 'relative', flexWrap: 'nowrap' }}>
        {/* Logo - Desktop */}
        <h3 className="navbar-brand mb-0 d-none d-md-inline-flex" style={{ marginLeft: '1.5rem', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', gap: '0', flexShrink: 0, marginRight: 'auto' }}>
          <i className="fa fa-utensils" style={{ margin: '0', padding: '0', marginRight: '0.5rem' }} aria-hidden="true"></i>
          <span className="smart-title" style={{ marginLeft: '0', paddingLeft: '0', letterSpacing: '0' }}>SmartLunch</span>
        </h3>

        {/* Logo y botón hamburguesa en móvil */}
        <div className="d-md-none d-flex align-items-center justify-content-between w-100">
          <h4 className="navbar-brand smart-title mb-0" style={{ marginLeft: '1.5rem', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', gap: '0' }}>
            <i className="fa fa-utensils" style={{ margin: '0', padding: '0', marginRight: '0.5rem' }} aria-hidden="true"></i>
            <span style={{ marginLeft: '0', paddingLeft: '0', letterSpacing: '0' }}>SmartLunch</span>
          </h4>
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-controls="navbarSupportedContentMobile"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'white',
              padding: '0.5rem',
              marginRight: '1rem',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            <i className={`fa ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true"></i>
          </button>
        </div>

        {/* Jerarquía y fecha/hora en el centro - visible solo en pantallas extra grandes (xl >= 1200px) */}
        <div className="d-none d-xl-flex align-items-center" style={{ fontSize: '0.8em', fontWeight: 'normal', opacity: 0.9, position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 1, pointerEvents: 'none' }} aria-live="polite">
          {jerarquiaNombre && (
            <span className="mr-3 d-flex align-items-center" aria-label="Jerarquía del usuario">
              <i className="fa fa-user mr-1" style={{ fontSize: '1.1em' }} aria-hidden="true"></i>
              <span className="badge badge-light text-dark" style={{ fontSize: '0.9em', padding: '0.3em 0.6em' }} aria-label={`Jerarquía: ${jerarquiaNombre}`}>
                {jerarquiaNombre}
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

        {/* Solo jerarquía en pantallas grandes (lg >= 992px, sin hora) */}
        <div className="d-none d-lg-flex d-xl-none align-items-center" style={{ fontSize: '0.8em', fontWeight: 'normal', opacity: 0.9, position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 1, pointerEvents: 'none' }} aria-live="polite">
          {jerarquiaNombre && (
            <span className="d-flex align-items-center" aria-label="Jerarquía del usuario">
              <i className="fa fa-user mr-1" style={{ fontSize: '1.1em' }} aria-hidden="true"></i>
              <span className="badge badge-light text-dark" style={{ fontSize: '0.9em', padding: '0.3em 0.6em' }} aria-label={`Jerarquía: ${jerarquiaNombre}`}>
                {jerarquiaNombre}
              </span>
            </span>
          )}
        </div>

        {/* Desktop/Tablet: Menú visible cuando cabe en pantalla */}
        {isDesktop && (
        <div className="d-none d-md-flex align-items-center" id="navbarSupportedContent" role="menu" style={{ flexShrink: 0, marginLeft: 'auto', display: 'flex' }}>
        <ul className="navbar-nav d-flex flex-row align-items-center" id="navbar-menu" role="menubar" style={{ margin: 0, listStyle: 'none', flexWrap: 'nowrap' }}>
          {role !== 'Comensal' && (
            <li className="nav-item active" role="none">
              <Link className="nav-link" to="/" aria-label="Ir a inicio" role="menuitem">
                <i className="fa fa-home mr-2" aria-hidden="true"></i> Inicio
              </Link>
            </li>
          )}

          {role === 'Cocina' && (
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
                    Platos
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

          {role === 'Gerencia' && (
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

          {(role === 'Admin' || role === 'Gerencia') && (
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
                {role === 'Admin' && (
                  <>
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
                  </>
                )}
              </div>
            </li>
          )}

          <li className="nav-item active" role="none" style={{ marginRight: '1rem' }}>
            <Link className="nav-link" to="/login" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión" role="menuitem">
              <i className="fa fa-sign-out-alt mr-2" aria-hidden="true"></i>
              Salir
            </Link>
          </li>
        </ul>
        </div>
        )}
      </div>
    </nav>

    {/* Mobile/Tablet pequeña: Menú colapsable con hamburguesa - FUERA del nav principal */}
    {isMobileMenuOpen && (
      <div 
        className="d-md-none" 
        id="navbarSupportedContentMobile"
        style={{ 
          width: '100%', 
          backgroundColor: 'var(--smart-primary)', 
          padding: '0.5rem 0', 
          display: 'block',
          position: 'relative',
          zIndex: 999,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <ul className="navbar-nav" style={{ flexDirection: 'column', width: '100%' }}>
          {role !== 'Comensal' && (
            <li className="nav-item active" role="none">
              <Link 
                className="nav-link" 
                to="/" 
                aria-label="Ir a inicio" 
                role="menuitem"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fa fa-home mr-2" aria-hidden="true"></i> Inicio
              </Link>
            </li>
          )}

          {role === 'Cocina' && (
            <>
              <li className="nav-item active" role="none">
                <Link 
                  className="nav-link" 
                  to="/despacho" 
                  aria-label="Despacho de plato" 
                  role="menuitem"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fa fa-edit mr-2" aria-hidden="true"></i> Despacho de plato
                </Link>
              </li>
              <li className="nav-item dropdown" role="none">
                <a
                  className="nav-link dropdown-toggle active"
                  href="#"
                  id="ddCocinaMobile"
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown('ddCocinaMobile');
                  }}
                  aria-haspopup="true"
                  aria-expanded={openDropdowns.ddCocinaMobile || false}
                  aria-label="Menú de cocina"
                >
                  <i className="fa fa-boxes mr-2" aria-hidden="true"></i> Cocina
                </a>
                <div 
                  className={`dropdown-menu ${openDropdowns.ddCocinaMobile ? 'show' : ''}`} 
                  aria-labelledby="ddCocinaMobile" 
                  role="menu"
                >
                  <Link 
                    className="dropdown-item" 
                    to="/plato" 
                    role="menuitem"
                    onClick={() => {
                      setOpenDropdowns({});
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Platos
                  </Link>
                  <Link 
                    className="dropdown-item" 
                    to="/menudeldia" 
                    role="menuitem"
                    onClick={() => {
                      setOpenDropdowns({});
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Menú del día
                  </Link>
                </div>
              </li>
            </>
          )}

          {role === 'Gerencia' && (
            <li className="nav-item dropdown" role="none">
              <a
                className="nav-link dropdown-toggle active"
                href="#"
                id="ddReportesMobile"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown('ddReportesMobile');
                }}
                aria-haspopup="true"
                aria-expanded={openDropdowns.ddReportesMobile || false}
                aria-label="Menú de reportes"
              >
                <i className="fa fa-chart-bar mr-2" aria-hidden="true"></i> Reportes de Gestión
              </a>
              <div 
                className={`dropdown-menu ${openDropdowns.ddReportesMobile ? 'show' : ''}`} 
                aria-labelledby="ddReportesMobile" 
                role="menu"
              >
                <Link 
                  className="dropdown-item" 
                  to="/reportegcomensales" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Reporte por Comensal
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/reporteggestion" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Reporte de Gestión
                </Link>
              </div>
            </li>
          )}

          {(role === 'Admin' || role === 'Gerencia') && (
            <li className="nav-item dropdown" role="none">
              <a
                className="nav-link dropdown-toggle active"
                href="#"
                id="ddConfigMobile"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown('ddConfigMobile');
                }}
                aria-haspopup="true"
                aria-expanded={openDropdowns.ddConfigMobile || false}
                aria-label="Menú de configuración"
              >
                <i className="fa fa-cog mr-2" aria-hidden="true"></i> Configuración
              </a>
              <div 
                className={`dropdown-menu ${openDropdowns.ddConfigMobile ? 'show' : ''}`} 
                aria-labelledby="ddConfigMobile" 
                role="menu"
              >
                <Link 
                  className="dropdown-item" 
                  to="/usuarios" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Usuarios
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/planta" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Planta
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/centrodecosto" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Centro de Costo
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/proyecto" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Proyecto
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/plannutricional" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Perfil Nutricional
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/jerarquia" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Jerarquía
                </Link>
                <Link 
                  className="dropdown-item" 
                  to="/turno" 
                  role="menuitem"
                  onClick={() => {
                    setOpenDropdowns({});
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Turnos
                </Link>
                {role === 'Admin' && (
                  <>
                    <div className="dropdown-divider"></div>
                    <Link 
                      className="dropdown-item" 
                      to="/configuracion" 
                      role="menuitem"
                      onClick={() => {
                        setOpenDropdowns({});
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <i className="fa fa-server mr-2" aria-hidden="true"></i>
                      Configuración del Servidor
                    </Link>
                  </>
                )}
              </div>
            </li>
          )}

          <li className="nav-item active" role="none">
            <Link 
              className="nav-link" 
              to="/login" 
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }} 
              aria-label="Cerrar sesión" 
              title="Cerrar sesión" 
              role="menuitem"
            >
              <i className="fa fa-sign-out-alt mr-2" aria-hidden="true"></i> Salir
            </Link>
          </li>
        </ul>
      </div>
    )}
  </>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
