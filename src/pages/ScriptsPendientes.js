import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { dbScriptsService } from '../services/dbScriptsService';

const ScriptsPendientes = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ejecutando, setEjecutando] = useState(false);
  const [seleccionados, setSeleccionados] = useState({});
  const [error, setError] = useState(null);
  const [ultimosResultados, setUltimosResultados] = useState(null);

  const cargarScripts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dbScriptsService.listar();
      setScripts(data);
      setSeleccionados({});
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los scripts pendientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarScripts();
  }, [cargarScripts]);

  const toggleSeleccionado = (nombreScript) => {
    setSeleccionados((prev) => ({ ...prev, [nombreScript]: !prev[nombreScript] }));
  };

  const cantidadSeleccionados = Object.values(seleccionados).filter(Boolean).length;
  const scriptsPendientes = scripts.filter((s) => !s.ejecutado);
  const scriptsEjecutados = scripts.filter((s) => s.ejecutado);

  const handleEjecutar = async () => {
    const nombres = Object.keys(seleccionados).filter((n) => seleccionados[n]);
    if (nombres.length === 0) return;

    const porNombre = Object.fromEntries(scripts.map((s) => [s.nombreScript, s]));
    const yaEjecutados = nombres.filter((n) => porNombre[n]?.ejecutado);
    const pendientes = nombres.filter((n) => !porNombre[n]?.ejecutado);

    const listaHtml = (lista) => lista.map((n) => `<code>${n}</code>`).join('<br/>');

    const html = yaEjecutados.length > 0
      ? `<div style="text-align:left">` +
        `<p style="color:#F34949"><i class="fa fa-exclamation-triangle mr-1" aria-hidden="true"></i>` +
        `<strong>Ojo:</strong> ${yaEjecutados.length} de los scripts seleccionados ` +
        `<strong>ya se ejecutaron antes</strong>. Volver a correrlos puede modificar o eliminar ` +
        `datos que ya están en uso:</p>` +
        `<p>${listaHtml(yaEjecutados)}</p>` +
        (pendientes.length > 0
          ? `<p class="mt-3">El resto son pendientes normales:</p><p>${listaHtml(pendientes)}</p>`
          : '') +
        `</div>`
      : `Se van a ejecutar <strong>${nombres.length}</strong> script(s) contra la base de datos:<br/><br/>` +
        listaHtml(nombres);

    const confirmacion = await Swal.fire({
      title: yaEjecutados.length > 0 ? '¿Re-ejecutar scripts ya corridos?' : '¿Ejecutar scripts seleccionados?',
      html,
      icon: yaEjecutados.length > 0 ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonText: yaEjecutados.length > 0 ? 'Sí, re-ejecutar de todos modos' : 'Ejecutar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#F34949',
    });
    if (!confirmacion.isConfirmed) return;

    setEjecutando(true);
    setUltimosResultados(null);
    try {
      const resultado = await dbScriptsService.ejecutar(nombres);
      setUltimosResultados(resultado.resultados || []);
      const todosOk = resultado.ok;
      await Swal.fire({
        title: todosOk ? '¡Listo!' : 'Terminado con errores',
        text: todosOk
          ? 'Todos los scripts se ejecutaron correctamente.'
          : 'Alguno de los scripts falló, revisá el detalle en la lista.',
        icon: todosOk ? 'success' : 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      await cargarScripts();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'No se pudieron ejecutar los scripts.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setEjecutando(false);
    }
  };

  const renderEstado = (s) => {
    if (s.ejecutado) {
      const fecha = s.fechaEjecucion ? new Date(s.fechaEjecucion).toLocaleString() : '';
      return (
        <span className="badge badge-success">
          <i className="fa fa-check mr-1" aria-hidden="true"></i>
          Ejecutado {fecha}
        </span>
      );
    }
    if (s.ultimoResultado === 'ERROR') {
      return (
        <span className="badge badge-danger" title={s.ultimoMensaje || ''}>
          <i className="fa fa-exclamation-triangle mr-1" aria-hidden="true"></i>
          Error: {s.ultimoMensaje}
        </span>
      );
    }
    return (
      <span className="badge badge-warning text-dark">
        Pendiente
      </span>
    );
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
              <i className="fa fa-database mr-2" aria-hidden="true"></i>
              Scripts pendientes
            </h2>
            <button
              className="btn btn-outline-secondary"
              onClick={cargarScripts}
              disabled={loading || ejecutando}
            >
              <i className="fa fa-sync mr-2" aria-hidden="true"></i>
              Actualizar
            </button>
          </div>
          <p className="text-muted">
            Scripts SQL incrementales que se van dejando en <code>Scripts/nuevos_scripts</code> con
            cada deploy del backend, ordenados por cómo deben aplicarse (el más viejo primero).
            Tildá los que querés aplicar y confirmá. Los ya ejecutados se pueden volver a
            seleccionar, pero se avisa antes de confirmar porque pueden modificar o eliminar datos.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fa fa-exclamation-triangle mr-2" aria-hidden="true"></i>
          {error}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body p-0">
          {scripts.length === 0 && !error ? (
            <div className="p-4 text-center text-muted">
              No hay scripts en <code>Scripts/nuevos_scripts</code>.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '2.5rem' }}></th>
                    <th>Script</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {scriptsPendientes.length > 0 && (
                    <tr>
                      <td colSpan={4} className="bg-light">
                        <strong>Pendientes</strong> — en orden de aplicación
                      </td>
                    </tr>
                  )}
                  {scriptsPendientes.map((s) => (
                    <tr key={s.nombreScript}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!seleccionados[s.nombreScript]}
                          disabled={ejecutando}
                          onChange={() => toggleSeleccionado(s.nombreScript)}
                          aria-label={`Seleccionar ${s.nombreScript}`}
                        />
                      </td>
                      <td>
                        <code>{s.nombreScript}</code>
                      </td>
                      <td>{s.descripcion}</td>
                      <td>{renderEstado(s)}</td>
                    </tr>
                  ))}
                  {scriptsEjecutados.length > 0 && (
                    <tr>
                      <td colSpan={4} className="bg-light">
                        <strong>Ya ejecutados</strong>
                      </td>
                    </tr>
                  )}
                  {scriptsEjecutados.map((s) => (
                    <tr key={s.nombreScript}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!seleccionados[s.nombreScript]}
                          disabled={ejecutando}
                          onChange={() => toggleSeleccionado(s.nombreScript)}
                          aria-label={`Seleccionar ${s.nombreScript}`}
                        />
                      </td>
                      <td>
                        <code>{s.nombreScript}</code>
                      </td>
                      <td>{s.descripcion}</td>
                      <td>{renderEstado(s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex align-items-center mb-4" style={{ gap: '1rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleEjecutar}
          disabled={cantidadSeleccionados === 0 || ejecutando}
        >
          {ejecutando ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
              Ejecutando...
            </>
          ) : (
            <>
              <i className="fa fa-play mr-2" aria-hidden="true"></i>
              Ejecutar seleccionados
            </>
          )}
        </button>
        <span className="text-muted">
          {cantidadSeleccionados} seleccionado(s)
        </span>
      </div>

      {ultimosResultados && ultimosResultados.length > 0 && (
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">
              <i className="fa fa-list mr-2" aria-hidden="true"></i>
              Resultado de la última ejecución
            </h5>
          </div>
          <div className="card-body">
            <ul className="list-unstyled mb-0">
              {ultimosResultados.map((r) => (
                <li key={r.nombreScript} className="mb-2">
                  {r.exito ? (
                    <i className="fa fa-check-circle text-success mr-2" aria-hidden="true"></i>
                  ) : (
                    <i className="fa fa-times-circle text-danger mr-2" aria-hidden="true"></i>
                  )}
                  <code>{r.nombreScript}</code>: {r.mensaje}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptsPendientes;
