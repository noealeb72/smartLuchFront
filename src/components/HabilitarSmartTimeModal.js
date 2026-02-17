import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { configApiService } from '../services/configApiService';
import './CambiarContraseñaModal.css';
import './HabilitarSmartTimeModal.css';

const MIN_LENGTH = 8;

const HabilitarSmartTimeModal = ({ show, onClose, soloModificarContraseña = false }) => {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [showPasswordConfirmar, setShowPasswordConfirmar] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const actual = (passwordActual || '').trim();
    const nueva = (passwordNueva || '').trim();
    const confirmar = (passwordConfirmar || '').trim();

    if (soloModificarContraseña && !actual) {
      Swal.fire({
        title: 'Contraseña actual requerida',
        text: 'Debe ingresar la contraseña actual del usuario SmartTime.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
        customClass: { container: 'swal-delante-modal-contrasena' },
      });
      return;
    }
    if (!allReqs) {
      Swal.fire({
        title: 'Contraseña inválida',
        text: 'La contraseña debe cumplir todos los requisitos.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
        customClass: { container: 'swal-delante-modal-contrasena' },
      });
      return;
    }
    if (nueva !== confirmar) {
      Swal.fire({
        title: 'Las contraseñas no coinciden',
        text: 'La contraseña y la confirmación deben ser iguales.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
        customClass: { container: 'swal-delante-modal-contrasena' },
      });
      return;
    }

    setIsLoading(true);
    try {
      if (soloModificarContraseña) {
        // TODO: llamar al backend para cambiar contraseña del usuario smartTime (actual + nueva)
        await new Promise((r) => setTimeout(r, 500));
        Swal.fire({
          title: 'Contraseña actualizada',
          text: 'La contraseña del usuario SmartTime se ha actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
          customClass: { container: 'swal-delante-modal-contrasena' },
        });
      } else {
        const data = await configApiService.crearUsuarioSmartTime(nueva);
        const mensaje = data.mensaje || data.message || (data.creado ? 'Usuario smartTime creado correctamente.' : 'El usuario smartTime ya existía.');
        await Swal.fire({
          title: data.creado ? 'SmartTime habilitado' : 'Usuario existente',
          text: mensaje,
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
          customClass: { container: 'swal-delante-modal-contrasena' },
        });
      }
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
      onClose();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo completar la operación.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
        customClass: { container: 'swal-delante-modal-contrasena' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPasswordActual('');
    setPasswordNueva('');
    setPasswordConfirmar('');
    onClose();
  };

  if (!show) return null;

  return (
    <div className="habilitar-smarttime-modal-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="habilitar-smarttime-title">
      <div className="habilitar-smarttime-modal-dialog cambiar-contrasena-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cambiar-contrasena-modal-close" onClick={handleClose} aria-label="Cerrar">
          <i className="fa fa-times"></i>
        </button>
        <h2 id="habilitar-smarttime-title" className="cambiar-contrasena-modal-title">
          {soloModificarContraseña ? 'Modificar contraseña SmartTime' : 'Habilitar SmartTime'}
        </h2>
        <p className="cambiar-contrasena-modal-subtitle">
          {soloModificarContraseña
            ? 'Solo puede modificar la contraseña.'
            : <>SmartTime se habilita para gestionar horarios y control de acceso. Ingrese la contraseña para el usuario del sistema.</>}
        </p>

        <form onSubmit={handleSubmit} noValidate className="cambiar-contrasena-modal-form">
          {!soloModificarContraseña && (
            <div className="cambiar-contrasena-field">
              <label>Usuario</label>
              <input
                type="text"
                className="form-control"
                value="smartTime"
                readOnly
                disabled
                style={{ backgroundColor: 'var(--smart-gray-light, #f5f5f5)', cursor: 'not-allowed' }}
                aria-label="Usuario SmartTime (solo lectura)"
              />
            </div>
          )}
          {soloModificarContraseña && (
            <div className="cambiar-contrasena-field">
              <label htmlFor="smarttime-passwordActual"><span className="cambiar-contrasena-asterisco">*</span> Contraseña actual</label>
              <div className="cambiar-contrasena-input-wrap">
                <input
                  type={showPasswordActual ? 'text' : 'password'}
                  className="form-control"
                  id="smarttime-passwordActual"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Contraseña actual"
                />
                <button type="button" className="cambiar-contrasena-eye" onClick={() => setShowPasswordActual(!showPasswordActual)} aria-label={showPasswordActual ? 'Ocultar' : 'Mostrar'}>
                  <i className={`fa ${showPasswordActual ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          )}
          <div className="cambiar-contrasena-field">
            <label htmlFor="smarttime-passwordNueva"><span className="cambiar-contrasena-asterisco">*</span> {soloModificarContraseña ? 'Nueva contraseña' : 'Contraseña'}</label>
            <div className="cambiar-contrasena-input-wrap">
              <input
                type={showPasswordNueva ? 'text' : 'password'}
                className="form-control"
                id="smarttime-passwordNueva"
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
            <label htmlFor="smarttime-passwordConfirmar"><span className="cambiar-contrasena-asterisco">*</span> Confirmar contraseña</label>
            <div className="cambiar-contrasena-input-wrap">
              <input
                type={showPasswordConfirmar ? 'text' : 'password'}
                className="form-control"
                id="smarttime-passwordConfirmar"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                autoComplete="new-password"
                placeholder="Repita la contraseña"
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
            <button type="button" className="cambiar-contrasena-modal-btn cerrar" onClick={handleClose} disabled={isLoading}>
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

export default HabilitarSmartTimeModal;
