import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { apiService } from '../services/apiService';
import { comandasService } from '../services/comandasService';
import { getApiBaseUrl } from '../services/configService';
import Swal from 'sweetalert2';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import './Despacho.css';
import './Usuarios.css';

// Constante para la imagen por defecto (fuera del componente para evitar recreaciones)
const DEFAULT_IMAGE = `${process.env.PUBLIC_URL || ''}/img/logo-preview.png`;

const Despacho = () => {
  const { turnos } = useDashboard();
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  // Cargar pedidos pendientes
  const cargarPedidos = useCallback(async () => {
    try {
      setIsLoading(true);
      // Obtener fecha de hoy en formato YYYY-MM-DD
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];
      
      // Llamar al endpoint /api/comanda/lista con fechaDesde y fechaHasta igual a hoy
      const data = await apiService.getListaComandas(1, 1000, fechaHoy, fechaHoy);
      
      // Normalizar la respuesta (puede venir como array directo o dentro de un objeto con items/data)
      const pedidosArray = Array.isArray(data) 
        ? data 
        : (data.items || data.data || data.pedidos || []);
      
      setPedidos(pedidosArray);
      setPedidosFiltrados(pedidosArray);
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los pedidos pendientes',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      setPedidos([]);
      setPedidosFiltrados([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar pedidos al montar y cuando cambian los filtros
  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // Filtrar pedidos por texto
  useEffect(() => {
    if (!filtro.trim()) {
      setPedidosFiltrados(pedidos);
      return;
    }

    const textoFiltro = filtro.toLowerCase();
    const filtrados = pedidos.filter((pedido) => {
      const nombre = (pedido.user_name || pedido.userName || pedido.nombre || '').toLowerCase();
      const apellido = (pedido.user_lastName || pedido.userLastName || pedido.apellido || '').toLowerCase();
      const legajo = (pedido.user_fileNumber || pedido.userFileNumber || pedido.legajo || '').toString().toLowerCase();
      const plato = (pedido.PlatoDescripcion || pedido.platoDescripcion || pedido.descripcion || pedido.Descripcion || pedido.plato || pedido.Plato || '').toLowerCase();
      const npedido = (pedido.Npedido || pedido.npedido || '').toString().toLowerCase();
      
      return nombre.includes(textoFiltro) ||
             apellido.includes(textoFiltro) ||
             legajo.includes(textoFiltro) ||
             plato.includes(textoFiltro) ||
             npedido.includes(textoFiltro);
    });
    
    setPedidosFiltrados(filtrados);
  }, [filtro, pedidos]);

  // Abrir modal de información del pedido
  const handleVerDetalle = (pedido) => {
    setPedidoSeleccionado(pedido);
    setMostrarModal(true);
  };

  // Despachar un pedido
  const handleDespachar = async () => {
    if (!pedidoSeleccionado) return;
    
    // Obtener Npedido del pedido seleccionado
    const npedido = pedidoSeleccionado.Npedido || 
                   pedidoSeleccionado.npedido || 
                   pedidoSeleccionado.Id || 
                   pedidoSeleccionado.id;
    
    if (!npedido || npedido <= 0 || isNaN(parseInt(npedido))) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener el número de pedido.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    const npedidoInt = parseInt(npedido);

    try {
      setIsLoading(true);
      await comandasService.despacharPedidoPorNpedido(npedidoInt);
      
      Swal.fire({
        title: '¡Despachado!',
        text: 'El plato ha sido marcado como despachado',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // Cerrar modal y recargar pedidos
      setMostrarModal(false);
      setPedidoSeleccionado(null);
      await cargarPedidos();
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al despachar el pedido',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear fecha con hora
  const formatearFecha = (fechaHora) => {
    if (!fechaHora) return '-';
    try {
      const fecha = new Date(fechaHora);
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const año = fecha.getFullYear();
      const horas = String(fecha.getHours()).padStart(2, '0');
      const minutos = String(fecha.getMinutes()).padStart(2, '0');
      const segundos = String(fecha.getSeconds()).padStart(2, '0');
      return `${dia}/${mes}/${año} ${horas}:${minutos}:${segundos}`;
    } catch {
      return fechaHora;
    }
  };

  // Formatear importe con separadores de miles
  const formatearImporte = (monto) => {
    if (!monto && monto !== 0) return '-';
    return `$${parseFloat(monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Obtener estado del pedido con badge de color
  const obtenerEstadoBadge = (estado) => {
    const estados = {
      'P': { texto: 'Pendiente', color: '#ffffff', bgColor: '#ff9800' }, // Naranja con texto blanco
      'D': { texto: 'Devuelto', color: '#6c757d', bgColor: '#f5f5f5' }, // Gris
      'C': { texto: 'Cancelado', color: '#dc3545', bgColor: '#f8d7da' }, // Rojo
      'R': { texto: 'Recibido', color: '#28a745', bgColor: '#d4edda' }, // Verde
      'E': { texto: 'En Aceptación', color: '#007bff', bgColor: '#cce5ff' }, // Azul
    };
    
    const estadoInfo = estados[estado] || { texto: estado || '-', color: '#6c757d', bgColor: '#f5f5f5' };
    
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: estadoInfo.color,
          backgroundColor: estadoInfo.bgColor,
          border: 'none',
        }}
      >
        {estadoInfo.texto}
      </span>
    );
  };


  return (
      <div className="container-fluid" style={{ padding: 0 }}>
        {/* Barra negra con título */}
        <div className="page-title-bar">
          <h3>
            <i className="fa fa-truck mr-2" aria-hidden="true"></i>
            <span>Despacho de platos</span>
          </h3>
        </div>

        <div
          style={{
            paddingTop: '1.5rem',
            paddingLeft: '3rem',
            paddingRight: '3rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Buscador */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
              flexWrap: 'nowrap',
            }}
          >
            <div style={{ flex: '1', minWidth: '200px', maxWidth: '100%' }}>
              <Buscador
                filtro={filtro}
                setFiltro={setFiltro}
                placeholder="Buscar pedidos..."
              />
            </div>
          </div>

          {/* Tabla */}
          <div style={{ 
            width: '100%', 
            overflowX: 'auto',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <DataTable
              columns={[
                {
                  key: 'pedido',
                  field: 'Npedido',
                  label: 'Pedido',
                  render: (v, row) => {
                    return row.Npedido || row.npedido || row.Id || row.id || '-';
                  },
                },
                {
                  key: 'usuario',
                  field: 'usuario',
                  label: 'Usuario',
                  render: (v, row) => {
                    const nombre = row.user_name || row.userName || row.nombre || row.UsuarioNombre || '';
                    const apellido = row.user_lastName || row.userLastName || row.apellido || '';
                    const nombreCompleto = `${nombre} ${apellido}`.trim() || '-';
                    
                    // Obtener la foto del usuario - priorizar FotoComensal que viene con prefijo data:
                    const foto = row.FotoComensal || row.fotoComensal || row.user_foto || row.userFoto || row.foto || row.UsuarioFoto;
                    let fotoUrl = null;
                    
                    if (foto && foto.trim() !== '') {
                      // Si ya tiene el prefijo data:, usarlo directamente (FotoComensal viene así)
                      if (foto.startsWith('data:')) {
                        fotoUrl = foto;
                      }
                      // Si es una URL completa (http/https), usarla tal cual
                      else if (foto.startsWith('http://') || foto.startsWith('https://')) {
                        fotoUrl = foto;
                      }
                      // Si es base64 puro (sin prefijo), agregar el prefijo
                      else if (typeof foto === 'string' && !foto.startsWith('/') && !foto.includes('uploads/') && /^[A-Za-z0-9+/=]+$/.test(foto)) {
                        fotoUrl = `data:image/jpeg;base64,${foto}`;
                      }
                      // Si es una ruta de uploads/, construir la URL completa
                      else if (foto.startsWith('/uploads/') || foto.includes('uploads/')) {
                        const baseUrl = getApiBaseUrl();
                        let rutaRelativa = foto;
                        if (foto.includes('uploads/') && !foto.startsWith('/uploads/')) {
                          const indiceUploads = foto.indexOf('uploads/');
                          rutaRelativa = `/${foto.substring(indiceUploads)}`;
                        }
                        const partes = rutaRelativa.split('/');
                        let nombreArchivo = partes.pop();
                        const rutaBase = partes.join('/');
                        if (nombreArchivo.includes('%') && !nombreArchivo.includes(' ')) {
                          try {
                            nombreArchivo = decodeURIComponent(nombreArchivo);
                          } catch (e) {}
                        }
                        if (nombreArchivo.includes(' ') || /[^a-zA-Z0-9._-]/.test(nombreArchivo)) {
                          nombreArchivo = encodeURIComponent(nombreArchivo);
                        }
                        fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivo}`;
                      }
                      // Si es solo un nombre de archivo o ruta relativa, construir la URL completa
                      else {
                        const baseUrl = getApiBaseUrl();
                        const rutaNormalizada = foto.startsWith('/') ? foto : `/${foto}`;
                        fotoUrl = `${baseUrl}${rutaNormalizada}`;
                      }
                    }
                    
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {fotoUrl && (
                          <img
                            src={fotoUrl}
                            alt={nombreCompleto}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <span>{nombreCompleto}</span>
                      </div>
                    );
                  },
                },
                {
                  key: 'plato',
                  field: 'PlatoDescripcion',
                  label: 'Plato',
                  render: (v, row) => {
                    return row.PlatoDescripcion || row.platoDescripcion || row.descripcion || row.Descripcion || '-';
                  },
                },
                {
                  key: 'importe',
                  field: 'Monto',
                  label: 'Importe',
                  render: (v, row) => {
                    const monto = row.Monto || row.monto || row.importe || row.Importe || 0;
                    return formatearImporte(monto);
                  },
                },
                {
                  key: 'fecha',
                  field: 'fecha',
                  label: 'Fecha',
                  render: (v, row) => {
                    const fechaHora = row.fecha_hora || row.fechaHora || row.fecha || row.Fecha || row.createdate || '';
                    return formatearFecha(fechaHora);
                  },
                },
                {
                  key: 'estado',
                  field: 'Estado',
                  label: 'Estado',
                  render: (v, row) => {
                    const estado = row.Estado || row.estado || 'P';
                    return obtenerEstadoBadge(estado);
                  },
                },
                {
                  key: 'accion',
                  field: 'accion',
                  label: 'Acción',
                  align: 'center',
                  render: (v, row) => {
                    const estado = row.Estado || row.estado || 'P';
                    if (estado === 'P') {
                      return (
                        <button
                          className="btn btn-sm"
                          onClick={() => handleVerDetalle(row)}
                          disabled={isLoading}
                          title="Ver detalle y despachar"
                          style={{ 
                            backgroundColor: '#343a40',
                            color: 'white',
                            border: '1px solid #343a40',
                            whiteSpace: 'nowrap',
                            padding: '0.25rem 0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            borderRadius: '0.25rem',
                          }}
                        >
                          <i className="fa fa-truck"></i>
                        </button>
                      );
                    }
                    return '-';
                  },
                },
              ]}
              data={pedidosFiltrados}
              isLoading={isLoading}
              emptyMessage={
                filtro
                  ? 'No se encontraron pedidos con la búsqueda ingresada'
                  : 'No hay pedidos pendientes'
              }
            />
          </div>
        </div>

        {/* Modal de información del pedido */}
        {mostrarModal && pedidoSeleccionado && (
          <div 
            className="modal fade show" 
            style={{ 
              display: 'flex',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1050,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              overflow: 'auto',
              padding: '20px',
              boxSizing: 'border-box',
              margin: 0,
            }} 
            tabIndex="-1" 
            role="dialog"
            onClick={() => {
              setMostrarModal(false);
              setPedidoSeleccionado(null);
            }}
          >
            <div 
              className="modal-dialog" 
              role="document"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                margin: 'auto !important',
                transform: 'none !important',
                top: 'auto !important',
                left: 'auto !important',
                right: 'auto !important',
                bottom: 'auto !important',
                alignSelf: 'center',
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: '#343a40', color: 'white', padding: '10px 15px' }}>
                  <h5 className="modal-title" style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: 500 }}>
                    Información del Pedido
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => {
                      setMostrarModal(false);
                      setPedidoSeleccionado(null);
                    }}
                    style={{ color: 'white' }}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body row">
                  <div className="col-8 pl-4">
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Nombre del usuario</span>
                      <span style={{ wordWrap: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                        {pedidoSeleccionado.user_name || pedidoSeleccionado.userName || pedidoSeleccionado.UsuarioNombre || ''} {pedidoSeleccionado.user_lastName || pedidoSeleccionado.userLastName || ''}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Jerarquía</span>
                      <span>
                        {pedidoSeleccionado.JerarquiaDescripcion || pedidoSeleccionado.jerarquiaDescripcion || pedidoSeleccionado.jerarquiaNombre || pedidoSeleccionado.JerarquiaNombre || pedidoSeleccionado.jerarquia || '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Planta</span>
                      <span>
                        {pedidoSeleccionado.PlantaDescripcion || pedidoSeleccionado.plantaDescripcion || pedidoSeleccionado.plantaNombre || pedidoSeleccionado.PlantaNombre || pedidoSeleccionado.planta || '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Proyecto</span>
                      <span>
                        {pedidoSeleccionado.ProyectoDescripcion || pedidoSeleccionado.proyectoDescripcion || pedidoSeleccionado.proyectoNombre || pedidoSeleccionado.ProyectoNombre || pedidoSeleccionado.proyecto || '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Centro de costo</span>
                      <span>
                        {pedidoSeleccionado.CentroDeCostoDescripcion || pedidoSeleccionado.centroDeCostoDescripcion || pedidoSeleccionado.centroCostoNombre || pedidoSeleccionado.CentroCostoNombre || pedidoSeleccionado.centrodecosto || '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Turno</span>
                      <span>
                        {pedidoSeleccionado.TurnoNombre || pedidoSeleccionado.turnoNombre || pedidoSeleccionado.turno || '-'}
                      </span>
                    </div>
                    <div className="container row d-flex align-items-start">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        Nombre del plato
                      </span>
                      <span style={{ wordWrap: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                        {pedidoSeleccionado.PlatoDescripcion || pedidoSeleccionado.platoDescripcion || pedidoSeleccionado.descripcion || pedidoSeleccionado.Descripcion || pedidoSeleccionado.PlatoNombre || pedidoSeleccionado.platoNombre || '-'}
                      </span>
                    </div>
                    {(pedidoSeleccionado.comentario || pedidoSeleccionado.Comentario) && (pedidoSeleccionado.comentario || pedidoSeleccionado.Comentario).trim() !== '' && (
                      <div className="container row mt-2">
                        <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Comentario</span>
                        <span style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {pedidoSeleccionado.comentario || pedidoSeleccionado.Comentario}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-4 pl-0 mx-auto mt-5">
                    {(() => {
                      // Priorizar FotoComensal que viene con prefijo data:
                      const foto = pedidoSeleccionado?.FotoComensal || pedidoSeleccionado?.fotoComensal || pedidoSeleccionado?.user_foto || pedidoSeleccionado?.userFoto || pedidoSeleccionado?.foto || pedidoSeleccionado?.UsuarioFoto;
                      
                      let fotoUrl = null;
                      
                      if (foto && foto.trim() !== '') {
                        // Si ya tiene el prefijo data:, usarlo directamente (FotoComensal viene así)
                        if (foto.startsWith('data:')) {
                          fotoUrl = foto;
                        }
                        // Si es una URL completa (http/https), usarla tal cual
                        else if (foto.startsWith('http://') || foto.startsWith('https://')) {
                          fotoUrl = foto;
                        }
                        // Si es base64 puro (sin prefijo), agregar el prefijo
                        // Verificar si parece ser base64 (caracteres alfanuméricos, +, /, =)
                        else if (typeof foto === 'string' && !foto.startsWith('/') && !foto.includes('uploads/') && /^[A-Za-z0-9+/=]+$/.test(foto)) {
                          fotoUrl = `data:image/jpeg;base64,${foto}`;
                        }
                        // Si es una ruta de uploads/, construir la URL completa
                        else if (foto.startsWith('/uploads/') || foto.includes('uploads/')) {
                          const baseUrl = getApiBaseUrl();
                          
                          // Si contiene 'uploads/' pero no empieza con '/', extraer la parte relativa
                          let rutaRelativa = foto;
                          if (foto.includes('uploads/') && !foto.startsWith('/uploads/')) {
                            const indiceUploads = foto.indexOf('uploads/');
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
                          
                          fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivo}`;
                        }
                        // Si es solo un nombre de archivo o ruta relativa, construir la URL completa
                        else {
                          const baseUrl = getApiBaseUrl();
                          const rutaNormalizada = foto.startsWith('/') ? foto : `/${foto}`;
                          fotoUrl = `${baseUrl}${rutaNormalizada}`;
                        }
                      }
                      
                      // Solo mostrar la imagen si hay una URL válida
                      if (fotoUrl) {
                        return (
                          <img
                            className="round-img mr-4"
                            style={{ width: '100%', borderRadius: '50%', objectFit: 'cover', aspectRatio: 1 }}
                            src={fotoUrl}
                            alt={pedidoSeleccionado?.user_name || pedidoSeleccionado?.userName || pedidoSeleccionado?.UsuarioNombre || 'Usuario'}
                            onError={(e) => {
                              // Si falla la carga, ocultar la imagen en lugar de cargar logo-preview
                              e.target.style.display = 'none';
                            }}
                          />
                        );
                      }
                      
                      // Si no hay foto, no mostrar nada (no cargar logo-preview)
                      return null;
                    })()}
                  </div>
                  <div className="col-12 modal-footer">
                    <button
                      type="button"
                      className="btn btn-danger mr-2"
                      onClick={() => {
                        setMostrarModal(false);
                        setPedidoSeleccionado(null);
                      }}
                    >
                      Cerrar
                    </button>
                    {(pedidoSeleccionado.estado || pedidoSeleccionado.Estado) === 'P' && (
                      <button
                        type="button"
                        className="btn btn-dark"
                        onClick={handleDespachar}
                        disabled={isLoading}
                      >
                        Despachar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Despacho;
