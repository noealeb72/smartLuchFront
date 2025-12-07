import React, { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { reloadConfig as reloadConfigService } from '../services/configService';
import Swal from 'sweetalert2';
import './Configuracion.css';

const Configuracion = () => {
  const { config, loading, reloadConfig } = useConfig();
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await reloadConfigService();
      await reloadConfig();
      
      Swal.fire({
        title: '¡Recargado!',
        text: 'La configuración se ha recargado desde public/config.json',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al recargar la configuración',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setIsReloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <i className="fa fa-cog mr-2" aria-hidden="true"></i>
              Configuración del Sistema
            </h2>
            <button
              className="btn btn-primary"
              onClick={handleReload}
              disabled={isReloading}
            >
              {isReloading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Recargando...
                </>
              ) : (
                <>
                  <i className="fa fa-sync mr-2" aria-hidden="true"></i>
                  Recargar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          {/* Configuración actual - Solo lectura */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fa fa-info-circle mr-2" aria-hidden="true"></i>
                Configuración Actual
              </h5>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="apiUrl">
                  <strong>URL Base del Servidor:</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="apiUrl"
                  value={config?.apiBaseUrl || ''}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                />
                <small className="form-text text-muted">
                  URL base donde se encuentra el backend de la aplicación.
                </small>
              </div>

              <div className="form-group mt-3">
                <label htmlFor="totemId">
                  <strong>ID del Totem:</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="totemId"
                  value={config?.totemId || ''}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                />
                <small className="form-text text-muted">
                  Identificador único del totem.
                </small>
              </div>

              <div className="form-group mt-3">
                <label>
                  <strong>Bloqueos de Usuarios:</strong>
                </label>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr>
                        <th>Rol</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Admin</td>
                        <td>
                          {config?.bloqueos?.Admin ? (
                            <span className="badge badge-danger">Bloqueado</span>
                          ) : (
                            <span className="badge badge-success">Activo</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Cocina</td>
                        <td>
                          {config?.bloqueos?.Cocina ? (
                            <span className="badge badge-danger">Bloqueado</span>
                          ) : (
                            <span className="badge badge-success">Activo</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Comensal</td>
                        <td>
                          {config?.bloqueos?.Comensal ? (
                            <span className="badge badge-danger">Bloqueado</span>
                          ) : (
                            <span className="badge badge-success">Activo</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Gerencia</td>
                        <td>
                          {config?.bloqueos?.Gerencia ? (
                            <span className="badge badge-danger">Bloqueado</span>
                          ) : (
                            <span className="badge badge-success">Activo</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="alert alert-info mt-3">
                <i className="fa fa-info-circle mr-2" aria-hidden="true"></i>
                <strong>Fuente:</strong> public/config.json
              </div>
            </div>
          </div>

          {/* Instrucciones para editar */}
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="fa fa-edit mr-2" aria-hidden="true"></i>
                Cómo Editar la Configuración
              </h5>
            </div>
            <div className="card-body">
              <p>
                La configuración se lee directamente del archivo <code>public/config.json</code>.
                Para modificar la configuración, edita este archivo directamente.
              </p>
              
              <h6 className="mt-3">Pasos para editar:</h6>
              <ol>
                <li>Localiza el archivo <code>public/config.json</code> en tu proyecto</li>
                <li>Edita el archivo con un editor de texto</li>
                <li>Guarda los cambios</li>
                <li>Recarga la configuración usando el botón "Recargar Configuración" arriba</li>
                <li>O recarga la página completa (F5)</li>
              </ol>

              <h6 className="mt-3">Estructura del archivo:</h6>
              <pre className="bg-light p-3 rounded" style={{ fontSize: '0.9rem' }}>
{`{
  "apiBaseUrl": "http://localhost:8000",
  "totemId": "T001",
  "bloqueos": {
    "Admin": false,
    "Cocina": false,
    "Comensal": false,
    "Gerencia": false
  }
}`}
              </pre>

              <div className="alert alert-warning mt-3">
                <i className="fa fa-exclamation-triangle mr-2" aria-hidden="true"></i>
                <strong>Importante:</strong> Asegúrate de que el JSON sea válido. Un error de sintaxis puede hacer que la aplicación use valores por defecto.
              </div>
            </div>
          </div>

          {/* Información sobre el sistema */}
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="fa fa-info-circle mr-2" aria-hidden="true"></i>
                Información del Sistema
              </h5>
            </div>
            <div className="card-body">
              <p>
                <strong>Ubicación del archivo:</strong> <code>public/config.json</code>
              </p>
              <p>
                <strong>Cuándo se lee:</strong> Al iniciar la aplicación y cada vez que se recarga la configuración.
              </p>
              <p>
                <strong>Validación:</strong> El sistema valida que el archivo exista y tenga la estructura correcta.
                Si el archivo no existe o tiene errores, se usan valores por defecto.
              </p>
              <p className="mb-0">
                <strong>En producción:</strong> El archivo se copia junto con el build. Puedes editarlo directamente
                en el servidor sin necesidad de recompilar la aplicación.
              </p>
            </div>
          </div>
        </div>

        {/* Panel lateral con información */}
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="fa fa-lightbulb mr-2" aria-hidden="true"></i>
                Consejos
              </h5>
            </div>
            <div className="card-body">
              <ul className="list-unstyled">
                <li className="mb-3">
                  <i className="fa fa-check-circle text-success mr-2" aria-hidden="true"></i>
                  <strong>Desarrollo:</strong> Edita el archivo directamente en tu editor
                </li>
                <li className="mb-3">
                  <i className="fa fa-check-circle text-success mr-2" aria-hidden="true"></i>
                  <strong>Producción:</strong> Edita el archivo en el servidor después del deploy
                </li>
                <li className="mb-3">
                  <i className="fa fa-check-circle text-success mr-2" aria-hidden="true"></i>
                  <strong>Validación:</strong> Usa un validador JSON online si tienes dudas
                </li>
                <li className="mb-0">
                  <i className="fa fa-check-circle text-success mr-2" aria-hidden="true"></i>
                  <strong>Recarga:</strong> Después de editar, recarga la configuración o la página
                </li>
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">
                <i className="fa fa-file-code mr-2" aria-hidden="true"></i>
                Ubicación del Archivo
              </h5>
            </div>
            <div className="card-body">
              <p className="mb-2">
                <strong>En desarrollo:</strong>
              </p>
              <code className="d-block mb-3" style={{ fontSize: '0.85rem' }}>
                public/config.json
              </code>
              
              <p className="mb-2">
                <strong>En producción:</strong>
              </p>
              <code className="d-block" style={{ fontSize: '0.85rem' }}>
                /build/config.json<br />
                (o donde esté desplegada la app)
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
