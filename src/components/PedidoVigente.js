import React, { memo, lazy, Suspense, useMemo } from 'react';
import { getApiBaseUrl } from '../services/configService';

// Lazy load del QRCode solo cuando se necesita
const QRCodeSVG = lazy(() => import('qrcode.react').then(module => ({ default: module.QRCodeSVG })));

const PedidoVigente = memo(({ pedido, index, defaultImage, onCancelar, onRecibir, isLast }) => {
  // Obtener el Npedido para el QR
  const npedido = useMemo(() => {
    return pedido.Npedido || pedido.npedido || pedido.user_npedido || (pedido.user_Pedido && pedido.user_Pedido.id) || null;
  }, [pedido.Npedido, pedido.npedido, pedido.user_npedido, pedido.user_Pedido]);

  // Construir la URL de la foto desde el campo Foto del backend
  const fotoUrl = useMemo(() => {
    const foto = pedido.Foto || pedido.foto || pedido.presentacion;
    
    if (!foto || foto.trim() === '') {
      return defaultImage;
    }
    
    // Si es una URL completa (http/https) o base64, usarla tal cual
    if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
      return foto;
    }
    
    // Si es una ruta de uploads/platos/, construir la URL completa
    if (foto.startsWith('/uploads/platos/') || foto.includes('uploads/platos/')) {
      const baseUrl = getApiBaseUrl();
      
      // Si contiene 'uploads/platos/' pero no empieza con '/', extraer la parte relativa
      let rutaRelativa = foto;
      if (foto.includes('uploads/platos/') && !foto.startsWith('/uploads/platos/')) {
        const indiceUploads = foto.indexOf('uploads/platos/');
        rutaRelativa = `/${foto.substring(indiceUploads)}`;
      }
      
      // Decodificar primero para obtener el nombre original, luego codificar solo si es necesario
      const partes = rutaRelativa.split('/');
      let nombreArchivo = partes.pop();
      const rutaBase = partes.join('/');
      
      // Si el nombre ya está codificado (contiene % pero no espacios), decodificarlo primero
      if (nombreArchivo.includes('%') && !nombreArchivo.includes(' ')) {
        try {
          nombreArchivo = decodeURIComponent(nombreArchivo);
        } catch (e) {
          // Error al decodificar
        }
      }
      
      // Codificar solo si hay espacios o caracteres especiales
      if (nombreArchivo.includes(' ') || /[^a-zA-Z0-9._-]/.test(nombreArchivo)) {
        nombreArchivo = encodeURIComponent(nombreArchivo);
      }
      
      return `${baseUrl}${rutaBase}/${nombreArchivo}`;
    }
    
    // Si es solo un nombre de archivo, construir la ruta completa
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/uploads/platos/${foto}`;
  }, [pedido.Foto, pedido.foto, pedido.presentacion, defaultImage]);

  return (
    <>
      <div className="row no-gutters">
        <div className="col-md-4 mt-2 mb-2">
          <img
            src={fotoUrl}
            className="card-img"
            alt={pedido.PlatoDescripcion || pedido.platoDescripcion || pedido.descripcion || 'Imagen del plato del pedido'}
            loading="lazy"
            onError={(e) => {
              // Si la imagen no carga, usar la imagen por defecto
              e.target.src = defaultImage;
            }}
          />
          {/* Mostrar botón según el Estado: 'E' = Recibir pedido (verde), 'P' = Cancelar pedido (rojo) */}
          {(pedido.Estado === 'E' || pedido.estado === 'E') ? (
            <button
              type="button"
              onClick={() => onRecibir(pedido)}
              className="btn btn-success btn-sm mt-2"
              style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' }}
            >
              Recibir pedido
            </button>
          ) : (
            /* Mostrar botón "Cancelar pedido" si el Estado es 'P' (Pendiente) */
            <button
              type="button"
              onClick={() => onCancelar(pedido)}
              className="btn btn-outline-danger btn-sm mt-2"
              style={{ 
                borderColor: '#dc3545', 
                color: '#dc3545',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#dc3545';
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#dc3545';
              }}
            >
              Cancelar pedido
            </button>
          )}
        </div>
        <div className="col-md-8">
          <div className="card-body row">
            <div className="col-sm-6">
              <h5 className="card-title">
                <span className="badge badge-dark mr-2">
                  Nº {pedido.Npedido || pedido.npedido || pedido.user_npedido || (pedido.user_Pedido && pedido.user_Pedido.id) || 'N/A'}
                </span>
                <br /><br />
                {pedido.PlatoDescripcion || pedido.platoDescripcion || pedido.descripcion || pedido.Descripcion || '-'}
              </h5>
              <p className="card-text">{pedido.ingredientes}</p>
              <p>
                <span style={{ fontSize: '0.8em' }}>* Plan Nutricional: </span>
                <span style={{ color: '#343a40', fontWeight: 500, fontSize: '0.8em' }}>
                  {pedido.NutricionalNombre || pedido.nutricionalNombre || pedido.PlanNutricional || pedido.planNutricional || pedido.plannutricional || '-'}
                </span>
                {(pedido.Invitado === true || pedido.invitado === true) && <span className="badge badge-secondary">Invitado</span>}
              </p>
            </div>
            <div className="col-sm-6">
              {npedido && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Suspense fallback={<div className="text-center">Cargando QR...</div>}>
                    <QRCodeSVG value={String(npedido)} size={150} level="M" />
                  </Suspense>
                </div>
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

