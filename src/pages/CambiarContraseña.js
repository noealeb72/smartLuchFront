import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext';
import { usuariosService } from '../services/usuariosService';
import Swal from 'sweetalert2';
import '../components/CambiarContraseñaModal.css';
import './CambiarContraseña.css';

const MIN_LENGTH = 8;

const CambiarContraseña = ({ obligatorio = false }) => {
  const { user, logout } = useAuth();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [showPasswordConfirmar, setShowPasswordConfirmar] = useState(false);
  const [touchedActual, setTouchedActual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const reqMinLength = useMemo(() => (passwordNueva || '').length >= MIN_LENGTH, [passwordNueva]);
  const reqMayuscula = useMemo(() => /[A-Z]/.test(passwordNueva || ''), [passwordNueva]);
  const reqNumeroEspecial = useMemo(() => /[0-9]|[^A-Za-z0-9]/.test(passwordNueva || ''), [passwordNueva]);
  const allReqs = reqMinLength && reqMayuscula && reqNumeroEspecial;

  const strength = useMemo(() => {
    const p = passwordNueva || '';
    if (p.length < MIN_LENGTH) return 0;
    let s = 0;
    if (p.length >= MIN_LENGTH) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]|[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [passwordNueva]);

  const strengthLabel = strength === 0 ? 'Débil' : strength === 1 ? 'Débil' : strength === 2 ? 'Medio' : 'Fuerte';
  const errorActual = touchedActual && !(passwordActual || '').trim();

  // Si recargan la página estando en esta ventana, desloguear
  useEffect(() => {
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    const isReload = nav?.type === 'reload';
    if (isReload) {
      logout();
    }
  }, [logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedActual(true);
    const actual = (passwordActual || '').trim();
    const nueva = (passwordNueva || '').trim();
    const confirmar = (passwordConfirmar || '').trim();

    if (!actual) return;
    if (!allReqs) {
      Swal.fire({
        title: 'Contraseña inválida',
        text: 'La nueva contraseña debe cumplir todos los requisitos.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }
    if (nueva !== confirmar) {
      Swal.fire({
        title: 'Las contraseñas no coinciden',
        text: 'La nueva contraseña y la confirmación deben ser iguales.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    const usuarioId = user?.id;
    if (!usuarioId) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo identificar al usuario. Cierre sesión y vuelva a iniciar.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    setIsLoading(true);
    try {
      await usuariosService.cambiarContraseña(actual, nueva, usuarioId);
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
      setTouchedActual(false);
      await Swal.fire({
        title: 'Contraseña actualizada',
        text: 'Su contraseña se ha cambiado correctamente. El sistema cerrará su sesión y lo llevará al inicio de sesión para que ingrese con su nueva contraseña.',
        icon: 'success',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      logout();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.Message || error.response?.data?.error || error.message || 'No se pudo cambiar la contraseña. Verifique la contraseña actual.';
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cambiar-contrasena-page">
      <div className="cambiar-contrasena-page-dialog cambiar-contrasena-modal-dialog">
        <div className="cambiar-contrasena-modal-icon">
          <i className="fa fa-lock"></i>
        </div>
        <h2 className="cambiar-contrasena-modal-title">Modificar contraseña</h2>
        {!obligatorio && (
          <p className="cambiar-contrasena-modal-subtitle">
            Asegúrate de elegir una contraseña segura.
          </p>
        )}

        {obligatorio && (
          <div className="cambiar-contrasena-cartel" role="alert">
            <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
            <span>Necesita cambiar su contraseña para poder ingresar al sistema.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="cambiar-contrasena-modal-form">
          <div className="cambiar-contrasena-field">
            <label htmlFor="page-passwordActual"><span className="cambiar-contrasena-asterisco">*</span> Contraseña actual</label>
            <div className="cambiar-contrasena-input-wrap">
              <input
                type={showPasswordActual ? 'text' : 'password'}
                className="form-control"
                id="page-passwordActual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                onBlur={() => setTouchedActual(true)}
                autoComplete="current-password"
                placeholder="Ingrese su contraseña actual"
              />
              <button type="button" className="cambiar-contrasena-eye" onClick={() => setShowPasswordActual(!showPasswordActual)} aria-label={showPasswordActual ? 'Ocultar' : 'Mostrar'}>
                <i className={`fa ${showPasswordActual ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {errorActual && (
              <p className="cambiar-contrasena-error">
                <i className="fa fa-exclamation-circle"></i> Este campo es obligatorio
              </p>
            )}
          </div>

          <div className="cambiar-contrasena-field">
            <label htmlFor="page-passwordNueva"><span className="cambiar-contrasena-asterisco">*</span> Nueva contraseña</label>
            <div className="cambiar-contrasena-input-wrap">
              <input
                type={showPasswordNueva ? 'text' : 'password'}
                className="form-control"
                id="page-passwordNueva"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                minLength={MIN_LENGTH}
              />
              <button type="button" className="cambiar-contrasena-eye" onClick={() => setShowPasswordNueva(!showPasswordNueva)} aria-label={showPasswordNueva ? 'Ocultar' : 'Mostrar'}>
                <i className={`fa ${showPasswordNueva ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <div className="cambiar-contrasena-strength">
              <span>Fortaleza: </span>
              <span className={`cambiar-contrasena-strength-label strength-${strength}`}>{strengthLabel}</span>
              <div className="cambiar-contrasena-strength-bar">
                <div className={`cambiar-contrasena-strength-fill strength-${strength}`} style={{ width: strength === 0 ? '25%' : strength === 1 ? '25%' : strength === 2 ? '50%' : '100%' }} />
              </div>
            </div>
            <ul className="cambiar-contrasena-reqs">
              <li className={reqMinLength ? 'ok' : ''}>
                <i className={`fa ${reqMinLength ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                Mínimo 8 caracteres
              </li>
              <li className={reqMayuscula ? 'ok' : ''}>
                <i className={`fa ${reqMayuscula ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                Una letra mayúscula
              </li>
              <li className={reqNumeroEspecial ? 'ok' : ''}>
                <i className={`fa ${reqNumeroEspecial ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                Un número o carácter especial
              </li>
            </ul>
          </div>

          <div className="cambiar-contrasena-field">
            <label htmlFor="page-passwordConfirmar"><span className="cambiar-contrasena-asterisco">*</span> Confirmar nueva contraseña</label>
            <div className="cambiar-contrasena-input-wrap">
              <input
                type={showPasswordConfirmar ? 'text' : 'password'}
                className="form-control"
                id="page-passwordConfirmar"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                autoComplete="new-password"
                placeholder="Repita la nueva contraseña"
                minLength={MIN_LENGTH}
              />
              <button type="button" className="cambiar-contrasena-eye" onClick={() => setShowPasswordConfirmar(!showPasswordConfirmar)} aria-label={showPasswordConfirmar ? 'Ocultar' : 'Mostrar'}>
                <i className={`fa ${showPasswordConfirmar ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {passwordNueva && passwordConfirmar && passwordNueva !== passwordConfirmar && (
              <p className="cambiar-contrasena-error">
                <i className="fa fa-exclamation-circle"></i> Las contraseñas no coinciden
              </p>
            )}
          </div>

          <div className="cambiar-contrasena-modal-buttons">
            <button
              type="button"
              className={`cambiar-contrasena-modal-btn cerrar ${isLoading ? 'disabled' : ''}`}
              onClick={() => logout()}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="cambiar-contrasena-modal-btn actualizar" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarContraseña;
