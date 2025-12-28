import React, { memo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import packageJson from '../../package.json';
import './Footer.css';

const Footer = memo(({ variant = 'full' }) => {
  const { turnos } = useDashboard();
  const version = packageJson.version || '1.0.0';

  // Footer simple para páginas que no sean Index
  if (variant === 'simple') {
    return (
      <footer className="smart-bg text-white" style={{ padding: '0.5rem 0' }}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <p className="mb-0 text-white" style={{ fontSize: '0.85rem', margin: 0 }}>
                Copyright 2020. All Right Reserved. Grupo Datco SRL | Versión {version}
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Footer completo para Index
  return (
      <footer className="smart-bg text-white">
      <div className="container">
        <div className="row" style={{ paddingTop: '0.5rem', marginTop: '0.5rem' }}>
          <div className="col-6">
            <div className="footer-widget pr-lg-5 pr-0">
              <h4 className="text-white" style={{ marginTop: '0', marginBottom: '0.5rem', paddingTop: '0' }}>SmartLunch</h4>
              <p style={{ marginTop: '0.5rem' }}>Sistema de Gestión de concesiones y servicios de comedores indoor de compañías.</p>
              <nav className="nav nav-mastfoot justify-content-start">
                <a className="nav-link text-white" href="#" aria-label="Facebook" style={{ color: 'white !important' }}>
                  <i className="fab fa-facebook-f" style={{ color: 'white', fontSize: '1.2rem', display: 'inline-block' }}></i>
                </a>
                <a className="nav-link text-white" href="#" aria-label="Twitter" style={{ color: 'white !important' }}>
                  <i className="fab fa-twitter" style={{ color: 'white', fontSize: '1.2rem', display: 'inline-block' }}></i>
                </a>
                <a className="nav-link text-white" href="#" aria-label="Instagram" style={{ color: 'white !important' }}>
                  <i className="fab fa-instagram" style={{ color: 'white', fontSize: '1.2rem', display: 'inline-block' }}></i>
                </a>
              </nav>
            </div>
          </div>
          <div className="col-6">
            <div className="footer-widget px-lg-5 px-0">
              <h4 className="text-white" style={{ marginTop: '0', marginBottom: '0.5rem', paddingTop: '0' }}>Turnos de Atención</h4>
              {turnos.length > 0 ? (
                <div className="row">
                  <div className="col-6">
                    <ul className="list-unstyled open-hours">
                      {turnos.map((item, index) => {
                        // Formatear horas para mostrar solo HH:MM (sin segundos)
                        const formatearHora = (hora) => {
                          if (!hora) return '';
                          // Si viene en formato HH:MM:SS, tomar solo HH:MM
                          if (typeof hora === 'string' && hora.includes(':')) {
                            const partes = hora.split(':');
                            return `${partes[0]}:${partes[1]}`;
                          }
                          return hora;
                        };
                        
                        const horaDesde = formatearHora(item.HoraDesde || item.hora_desde || item.horaDesde || item.horadesde);
                        const horaHasta = formatearHora(item.HoraHasta || item.hora_hasta || item.horaHasta || item.horahasta);
                        
                        // Primera columna: primeros elementos
                        if (index < Math.ceil(turnos.length / 2)) {
                          return (
                            <li key={item.id || index} className="d-flex justify-content-between text-white">
                              <span>
                                {item.nombre || item.Nombre || item.descripcion || item.Descripcion} {horaDesde} a {horaHasta}
                              </span>
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  </div>
                  <div className="col-6">
                    <ul className="list-unstyled open-hours">
                      {turnos.map((item, index) => {
                        // Formatear horas para mostrar solo HH:MM (sin segundos)
                        const formatearHora = (hora) => {
                          if (!hora) return '';
                          // Si viene en formato HH:MM:SS, tomar solo HH:MM
                          if (typeof hora === 'string' && hora.includes(':')) {
                            const partes = hora.split(':');
                            return `${partes[0]}:${partes[1]}`;
                          }
                          return hora;
                        };
                        
                        const horaDesde = formatearHora(item.HoraDesde || item.hora_desde || item.horaDesde || item.horadesde);
                        const horaHasta = formatearHora(item.HoraHasta || item.hora_hasta || item.horaHasta || item.horahasta);
                        
                        // Segunda columna: últimos elementos
                        if (index >= Math.ceil(turnos.length / 2)) {
                          return (
                            <li key={item.id || index} className="d-flex justify-content-between text-white">
                              <span>
                                {item.nombre || item.Nombre || item.descripcion || item.Descripcion} {horaDesde} a {horaHasta}
                              </span>
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-white">No hay turnos disponibles para hoy.</p>
              )}
            </div>
          </div>
        </div>
        <div className="row" style={{ paddingTop: '0.5rem', marginTop: '0.5rem' }}>
          <div className="col-md-12 d-flex align-items-center">
            <p className="mx-auto text-center mb-0 text-white" style={{ marginTop: '0' }}>
              Copyright 2020. All Right Reserved. Grupo Datco SRL | Versión {version}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;

