import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { login, user } = useAuth();
  const { loading: configLoading } = useConfig();
  const navigate = useNavigate();

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirigir si ya está autenticado (solo si tiene id, no solo token)
  useEffect(() => {
    if (user && user.token && user.id) {
      // Solo redirigir si hay un token válido Y un id de usuario
      if (user.role === 'Cocina') {
        navigate('/despacho', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user?.id, user?.token, user?.role, navigate]);

  useEffect(() => {
    // Ocultar error al escribir
    if (showError) {
      setShowError(false);
    }
  }, [username, password]);

  const isFormValid = () => {
    return username.trim().length > 0 && password.trim().length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Usuario y contraseña son requeridos');
      setShowError(true);
      return;
    }

    setIsLoading(true);
    setShowError(false);

    try {
      await login(username.trim(), password.trim());
      // Siempre redirigir a index después del login
      navigate('/', { replace: true });
    } catch (error) {
      setIsLoading(false);
      const message = error.message || 'Error de comunicación con el servidor';
      setErrorMsg(message);
      setShowError(true);
      // No mostrar ningún popup, solo mostrar el error en la página
    }
  };


  if (configLoading) {
    return (
      <div className="se-pre-con">
        <span className="sr-only">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="container" style={{ paddingTop: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'visible', minHeight: '100%', maxWidth: '100%' }}>
        <div className="d-flex justify-content-center" style={{ width: '100%', alignItems: 'center', padding: 0, overflow: 'visible' }}>
          <div className="user_card">
            <div className="d-flex justify-content-center">
              <div className="brand_logo_container">
                <i className="login-logo fas fa-utensils"></i>
                <h5 className="text-white mt-2" style={{ color: 'white !important' }}>Smart Lunch</h5>
              </div>
            </div>

            <div className="d-flex justify-content-center form_container">
              <form onSubmit={handleSubmit} noValidate>
                <div className="welcome-title">
                  <h4>Bienvenido</h4>
                  <p>Ingresa tus credenciales para continuar</p>
                  {showError && (
                    <p style={{ 
                      color: '#F34949', 
                      fontWeight: 600, 
                      marginTop: '0.5rem', 
                      fontSize: '0.95rem',
                      marginBottom: 0
                    }}>
                      {errorMsg}
                    </p>
                  )}
                </div>

                <div className="input-group mb-3" style={{ marginBottom: isMobile ? '0.75rem' : '1.25rem' }}>
                  <div className="input-group-append">
                    <span className="input-group-text">
                      <i className="fas fa-user"></i>
                    </span>
                  </div>
                  <input
                    type="text"
                    id="view_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control input_user"
                    placeholder="Nombre de usuario"
                    autoComplete="username"
                    required
                    style={{ borderLeft: 'none', paddingLeft: '0.75rem', borderRadius: '0' }}
                  />
                </div>

                <div className="input-group mb-3" style={{ marginBottom: isMobile ? '0.75rem' : '1.25rem' }}>
                  <div className="input-group-append">
                    <span className="input-group-text">
                      <i className="fas fa-key"></i>
                    </span>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="view_password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control input_pass"
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    required
                  />
                  <div className="input-group-append">
                    <button
                      className="btn btn-outline-secondary password-toggle-btn"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"}></i>
                    </button>
                  </div>
                </div>

                <div className="form-group mb-3" style={{ marginBottom: isMobile ? '0.75rem' : '1.25rem' }}>
                  <div className="custom-control custom-checkbox">
                    <input type="checkbox" className="custom-control-input" id="customControlInline" />
                    <label className="custom-control-label" htmlFor="customControlInline" style={{ color: 'var(--smart-gray)', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                      Recordar sesión
                    </label>
                  </div>
                </div>

                <div className="d-flex justify-content-center login_container" style={{ marginTop: isMobile ? '1rem' : '1.5rem', marginBottom: 0 }}>
                  <button
                    type="submit"
                    className="btn login_btn"
                    disabled={!isFormValid() || isLoading}
                    style={{ 
                      fontWeight: 600, 
                      letterSpacing: '0.5px', 
                      borderRadius: '8px',
                      position: 'relative',
                      minWidth: '120px'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" style={{ 
                          width: '1rem', 
                          height: '1rem', 
                          borderWidth: '0.15em',
                          marginRight: '0.5rem'
                        }}></span>
                        Ingresando...
                      </>
                    ) : (
                      <>
                        Ingresar <i className="fas fa-arrow-right ml-2"></i>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

