import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { apiService } from '../services/apiService';
import { getApiBaseUrl } from '../services/configService';
import Swal from 'sweetalert2';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import './Despacho.css';
import './Usuarios.css';

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
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📤 [Despacho] SOLICITANDO LISTA DE PEDIDOS');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📤 [Despacho] Parámetros enviados:');
      console.log('  • page: 1');
      console.log('  • pageSize: 1000');
      console.log('  • fechaDesde:', fechaHoy);
      console.log('  • fechaHasta:', fechaHoy);
      console.log('  • activo: true');
      console.log('═══════════════════════════════════════════════════════════');
      
      // Llamar al endpoint /api/comanda/lista con fechaDesde y fechaHasta igual a hoy
      const data = await apiService.getListaComandas(1, 1000, fechaHoy, fechaHoy);
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📥 [Despacho] RESPUESTA DE LA API');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📥 [Despacho] Respuesta completa:', data);
      console.log('📥 [Despacho] Tipo de respuesta:', typeof data);
      console.log('📥 [Despacho] ¿Es array?:', Array.isArray(data));
      if (!Array.isArray(data)) {
        console.log('📥 [Despacho] Propiedades del objeto:', Object.keys(data));
        if (data.items) {
          console.log('📥 [Despacho] data.items:', data.items);
          console.log('📥 [Despacho] Cantidad de items:', data.items?.length || 0);
        }
        if (data.data) {
          console.log('📥 [Despacho] data.data:', data.data);
          console.log('📥 [Despacho] Cantidad de data:', data.data?.length || 0);
        }
        if (data.pedidos) {
          console.log('📥 [Despacho] data.pedidos:', data.pedidos);
          console.log('📥 [Despacho] Cantidad de pedidos:', data.pedidos?.length || 0);
        }
      } else {
        console.log('📥 [Despacho] Cantidad de pedidos (array):', data.length);
        if (data.length > 0) {
          console.log('📥 [Despacho] Primer pedido:', data[0]);
          console.log('📥 [Despacho] Estructura del primer pedido:', Object.keys(data[0]));
        }
      }
      console.log('═══════════════════════════════════════════════════════════');
      
      // Normalizar la respuesta (puede venir como array directo o dentro de un objeto con items/data)
      const pedidosArray = Array.isArray(data) 
        ? data 
        : (data.items || data.data || data.pedidos || []);
      
      console.log('📋 [Despacho] Pedidos normalizados:', pedidosArray);
      console.log('📋 [Despacho] Cantidad de pedidos normalizados:', pedidosArray.length);
      console.log('═══════════════════════════════════════════════════════════');
      
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
    
    const pedidoId = pedidoSeleccionado.Id || pedidoSeleccionado.id || pedidoSeleccionado.ID;
    
    if (!pedidoId) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo identificar el pedido',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    try {
      setIsLoading(true);
      await apiService.despacharPedido(pedidoId);
      
      Swal.fire({
        title: '¡Despachado!',
        text: 'El plato ha sido marcado como despachado',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
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
      'D': { texto: 'Despachado', color: '#6c757d', bgColor: '#f5f5f5' }, // Gris
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
                    return `${nombre} ${apellido}`.trim() || '-';
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
                    return (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleVerDetalle(row)}
                          disabled={isLoading}
                          title="Ver todos los datos de la comanda"
                          style={{ 
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: '1px solid #007bff',
                            whiteSpace: 'nowrap',
                            padding: '0.25rem 0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                          }}
                        >
                          <i className="fa fa-eye"></i>
                        </button>
                        {estado === 'P' && (
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
                        )}
                      </div>
                    );
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
                margin: 'auto',
                transform: 'none',
                top: 'auto',
                left: 'auto',
                right: 'auto',
                bottom: 'auto',
                alignSelf: 'center',
                flexShrink: 0,
                minHeight: 'auto',
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
                    <img
                      className="round-img mr-4"
                      style={{ width: '100%', borderRadius: '50%', objectFit: 'cover', aspectRatio: 1 }}
                      src={pedidoSeleccionado.user_foto || pedidoSeleccionado.userFoto || pedidoSeleccionado.foto || pedidoSeleccionado.UsuarioFoto || `${process.env.PUBLIC_URL || ''}/img/logo-preview.png`}
                      alt={pedidoSeleccionado.user_name || pedidoSeleccionado.userName || pedidoSeleccionado.UsuarioNombre || 'Usuario'}
                      onError={(e) => {
                        e.target.src = `${process.env.PUBLIC_URL || ''}/img/logo-preview.png`;
                      }}
                    />
                  </div>
                  <div className="col-12 modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary mr-2"
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
                        className="btn btn-success"
                        onClick={handleDespachar}
                        disabled={isLoading}
                      >
                        <i className="fa fa-check mr-2"></i>
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
