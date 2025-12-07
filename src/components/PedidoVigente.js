import React, { memo, lazy, Suspense } from 'react';

// Lazy load del QRCode solo cuando se necesita
const QRCodeSVG = lazy(() => import('qrcode.react').then(module => ({ default: module.QRCodeSVG })));

const PedidoVigente = memo(({ pedido, index, defaultImage, onCancelar, onRecibir, isLast }) => {
  return (
    <>
      <div className="row no-gutters">
        <div className="col-md-4 mt-2 mb-2">
          <img
            src={pedido.presentacion || defaultImage}
            className="card-img"
            alt={pedido.descripcion || 'Imagen del plato del pedido'}
            loading="lazy"
          />
          <div className="row mt-2 pl-3">
            {pedido.paraCancelar && (
              <button
                type="button"
                onClick={() => onCancelar(pedido)}
                className="btn btn-outline-danger btn-sm mr-1"
              >
                Cancelar pedido
              </button>
            )}
            {pedido.paraRetirar && (
              <button
                type="button"
                onClick={() => onRecibir(pedido)}
                className="btn btn-outline-success btn-sm"
              >
                Recibir pedido
              </button>
            )}
          </div>
        </div>
        <div className="col-md-8">
          <div className="card-body row">
            <div className="col-sm-6">
              <h5 className="card-title">
                <span className="badge badge-dark mr-2">
                  Nº {pedido.user_npedido || (pedido.user_Pedido && pedido.user_Pedido.id) || 'N/A'}
                </span>
                <br /><br />
                {pedido.descripcion}
              </h5>
              <p className="card-text">{pedido.ingredientes}</p>
              <p>
                <span style={{ fontSize: '0.8em' }}>* Plan Nutricional: </span>
                <span style={{ color: '#343a40', fontWeight: 500, fontSize: '0.8em' }}>
                  {pedido.plannutricional}
                </span>
                {pedido.invitado === true && <span className="badge badge-secondary">Invitado</span>}
              </p>
            </div>
            <div className="col-sm-6">
              {pedido.datoQR && (
                <Suspense fallback={<div className="text-center">Cargando QR...</div>}>
                  <QRCodeSVG value={pedido.datoQR} size={150} level="M" />
                </Suspense>
              )}
            </div>
          </div>
        </div>
        {!isLast && (
          <div className="col-12">
            <hr style={{ margin: '20px 0', borderColor: '#dee2e6' }} />
          </div>
        )}
      </div>
    </>
  );
});

PedidoVigente.displayName = 'PedidoVigente';

export default PedidoVigente;

