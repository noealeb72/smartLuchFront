import React, { memo } from 'react';
import { formatearImporte } from '../utils/formatearImporte';

const MenuItem = memo(({ item, index, defaultImage, bonificacionDisponible, pedidosRestantes, porcentajeBonificacion, turnoDisponible, puedeAplicarBonificacion, tooltipDeshabilitado, onHacerPedido, onAplicarBonificacion }) => {
  return (
    <div className="card mt-2 pl-2">
      <div className="row no-gutters">
        <div className="col-md-4 mt-2 mb-2">
          <img
            src={item.presentacion || defaultImage}
            alt={item.descripcion}
            className="card-img"
            loading="lazy"
          />
          <button
            type="button"
            className="btn btn-dark btn-sm mt-2"
            onClick={() => onHacerPedido(item)}
            disabled={!turnoDisponible}
          >
            ¡Ordenar ahora!
          </button>
        </div>
        <div className="col-md-8">
          <div className="card-body">
            <div style={{ fontSize: '1.25rem', color: '#212529', fontWeight: 'normal', marginBottom: '0.5rem' }}>
              {item.descripcion}
            </div>
            <p className="card-text">{item.ingredientes}</p>
            <p>
              <span style={{ fontSize: '0.8em' }}>* Plan Nutricional: </span>
              <span style={{ color: '#343a40', fontWeight: 500, fontSize: '0.8em' }}>
                {item.plannutricional || 'N/A'}
              </span>
            </p>
            {item.cantidadDisponible !== undefined && item.cantidadDisponible > 0 && (
              <p style={{ fontSize: '0.875rem' }}>
                <span>Disponible: </span>
                <span style={{ color: '#28a745', fontWeight: 500 }}>
                  {item.cantidadDisponible}
                </span>
              </p>
            )}
            <p style={{ fontSize: '0.875rem' }}>
              <span>Importe:</span>
              {item.costo === 0 ? (
                <span> {formatearImporte(0)}</span>
              ) : item.aplicarBonificacion ? (
                <>
                  <span style={{ textDecoration: 'line-through', color: '#6c757d' }}>
                    {formatearImporte(item.costo)}
                  </span>
                  <span className="text-success ml-2" style={{ fontWeight: 'normal' }}>
                    {formatearImporte(item.precioFinal)}
                  </span>
                </>
              ) : (
                <span> {formatearImporte(item.costo)}</span>
              )}
            </p>

            {bonificacionDisponible &&
              pedidosRestantes > 0 &&
              item.costo > 0 && (
                <div className="bonificacion-container mt-3">
                  <div className="custom-checkbox-wrapper">
                    <input
                      className="custom-checkbox"
                      type="checkbox"
                      checked={item.aplicarBonificacion || false}
                      disabled={!puedeAplicarBonificacion}
                      onChange={(e) => onAplicarBonificacion(item, e.target.checked)}
                      id={`bonificacion_${index}`}
                      title={tooltipDeshabilitado || ''}
                    />
                    <label
                      className={`custom-checkbox-label ${!puedeAplicarBonificacion ? 'disabled' : ''}`}
                      htmlFor={puedeAplicarBonificacion ? `bonificacion_${index}` : undefined}
                      style={!puedeAplicarBonificacion ? { opacity: 0.6, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                    >
                      <div className="checkbox-content">
                        <div className="discount-icon">
                          <i className="fas fa-percentage"></i>
                        </div>
                        <div className="discount-text">
                          <span className="discount-label">Aplicar</span>
                          <span className="discount-percentage">{porcentajeBonificacion}%</span>
                          <span className="discount-word">descuento</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

          </div>
        </div>
      </div>
    </div>
  );
});

MenuItem.displayName = 'MenuItem';

export default MenuItem;

