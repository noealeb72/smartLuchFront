import React, { memo } from 'react';

const MenuItem = memo(({ item, index, defaultImage, bonificacionDisponible, cantidadBonificacionesHoy, porcentajeBonificacion, turnoDisponible, onHacerPedido, onAplicarBonificacion }) => {
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
            <h5 className="card-title">{item.descripcion}</h5>
            <p className="card-text">{item.ingredientes}</p>
            <p>
              <span style={{ fontSize: '0.8em' }}>* Plan Nutricional: </span>
              <span style={{ color: '#343a40', fontWeight: 500, fontSize: '0.8em' }}>
                {item.plannutricional}
              </span>
            </p>
            <p>
              <strong>Importe:</strong>
              {item.costo === 0 ? (
                <span> Sin costo</span>
              ) : item.aplicarBonificacion ? (
                <>
                  <span style={{ textDecoration: 'line-through', color: '#6c757d' }}>
                    ${item.costo.toFixed(2)}
                  </span>
                  <span className="text-success font-weight-bold ml-2">
                    ${item.precioFinal.toFixed(2)}
                  </span>
                </>
              ) : (
                <span> ${item.costo.toFixed(2)}</span>
              )}
            </p>

            {bonificacionDisponible &&
              cantidadBonificacionesHoy < 1 &&
              item.costo > 0 && (
                <div className="bonificacion-container mt-3">
                  <div className="custom-checkbox-wrapper">
                    <input
                      className="custom-checkbox"
                      type="checkbox"
                      checked={item.aplicarBonificacion || false}
                      onChange={(e) => onAplicarBonificacion(item, e.target.checked)}
                      id={`bonificacion_${index}`}
                    />
                    <label className="custom-checkbox-label" htmlFor={`bonificacion_${index}`}>
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

            {cantidadBonificacionesHoy >= 1 && bonificacionDisponible && item.costo > 0 && (
              <div className="alert alert-info mt-2" style={{ fontSize: '0.8em', padding: '0.5rem' }}>
                <i className="fas fa-info-circle"></i> Ya utilizaste tu bonificación del día
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

