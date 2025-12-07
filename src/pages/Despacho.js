import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import apiService from '../services/apiService';
import Swal from 'sweetalert2';
import './Despacho.css';

const Despacho = () => {
  const { turnos } = useDashboard();
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtro, setFiltro] = useState('');

  // Cargar pedidos pendientes
  const cargarPedidos = useCallback(async () => {
    try {
      setIsLoading(true);
      const fecha = new Date().toISOString().split('T')[0];
      
      const data = await apiService.getPedidosPendientes(fecha, null);
      
      // Normalizar la respuesta (puede venir como array directo o dentro de un objeto)
      const pedidosArray = Array.isArray(data) ? data : (data.pedidos || data.items || data.data || []);
      
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
      const plato = (pedido.descripcion || pedido.Descripcion || pedido.plato || pedido.Plato || '').toLowerCase();
      const codigo = (pedido.cod_plato || pedido.codPlato || pedido.codigo || '').toString().toLowerCase();
      
      return nombre.includes(textoFiltro) ||
             apellido.includes(textoFiltro) ||
             legajo.includes(textoFiltro) ||
             plato.includes(textoFiltro) ||
             codigo.includes(textoFiltro);
    });
    
    setPedidosFiltrados(filtrados);
  }, [filtro, pedidos]);

  // Despachar un pedido
  const handleDespachar = async (pedido) => {
    const pedidoId = pedido.id || pedido.Id || pedido.ID;
    
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

    const resultado = await Swal.fire({
      title: '¿Despachar este plato?',
      html: `
        <div style="text-align: left;">
          <p><strong>Usuario:</strong> ${pedido.user_name || pedido.userName || ''} ${pedido.user_lastName || pedido.userLastName || ''}</p>
          <p><strong>Legajo:</strong> ${pedido.user_fileNumber || pedido.userFileNumber || ''}</p>
          <p><strong>Plato:</strong> ${pedido.descripcion || pedido.Descripcion || pedido.plato || ''}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, despachar',
      cancelButtonText: 'Cancelar',
    });

    if (resultado.isConfirmed) {
      try {
        setIsLoading(true);
        await apiService.despacharPedido(pedidoId);
        
        Swal.fire({
          title: '¡Despachado!',
          text: 'El plato ha sido marcado como despachado',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });

        // Recargar pedidos
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
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaHora) => {
    if (!fechaHora) return '-';
    try {
      const fecha = new Date(fechaHora);
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return fechaHora;
    }
  };

  // Formatear importe
  const formatearImporte = (monto) => {
    if (!monto && monto !== 0) return '-';
    return `$${parseFloat(monto).toFixed(2)}`;
  };

  // Obtener estado del pedido
  const obtenerEstado = (estado) => {
    const estados = {
      'P': 'Pendiente',
      'D': 'Despachado',
      'C': 'Cancelado',
      'R': 'Recibido',
    };
    return estados[estado] || estado || '-';
  };

  // Limpiar búsqueda
  const limpiarBusqueda = () => {
    setFiltro('');
  };

  return (
      <div className="container-fluid despacho-container">
        {/* Barra negra con título */}
        <div style={{ backgroundColor: '#343A40', color: 'white', padding: '0.5rem 0', width: '100%', minHeight: 'auto' }}>
          <h3 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'normal', 
            margin: 0, 
            fontFamily: 'sans-serif', 
            color: 'white', 
            textAlign: 'left', 
            paddingLeft: '1.5rem',
            paddingTop: '0',
            paddingBottom: '0',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'center'
          }}>
            <i className="fa fa-utensils mr-2" aria-hidden="true"></i>Despacho de platos
          </h3>
        </div>

        {/* Búsqueda */}
        <div className="despacho-busqueda">
          <label htmlFor="filtro">Buscar</label>
          <div className="despacho-busqueda-input-container">
            <input
              type="text"
              id="filtro"
              className="form-control despacho-busqueda-input"
              placeholder="Buscar pedidos..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            {filtro && (
              <button
                type="button"
                className="despacho-busqueda-clear"
                onClick={limpiarBusqueda}
                title="Limpiar búsqueda"
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Tabla de pedidos */}
        <div className="despacho-tabla-container">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Cargando...</span>
              </div>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="despacho-empty-state">
              <div className="despacho-empty-banner">
                <p className="despacho-empty-text">
                  {filtro
                    ? 'No se encontraron pedidos con la búsqueda ingresada'
                    : 'No hay platos registrados'}
                </p>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table despacho-tabla">
                <thead className="despacho-tabla-header">
                  <tr>
                    <th>Pedido</th>
                    <th>Usuario</th>
                    <th>Plato</th>
                    <th>Importe</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((pedido, index) => {
                    const pedidoId = pedido.id || pedido.Id || pedido.ID;
                    const fechaHora = pedido.fecha_hora || pedido.fechaHora || pedido.fecha || '';
                    const nombreCompleto = `${pedido.user_name || pedido.userName || pedido.nombre || ''} ${pedido.user_lastName || pedido.userLastName || pedido.apellido || ''}`.trim();
                    const monto = pedido.monto || pedido.Monto || pedido.importe || pedido.Importe || 0;
                    const estado = pedido.estado || pedido.Estado || 'P';
                    
                    return (
                      <tr key={pedidoId || index}>
                        <td>{pedidoId || '-'}</td>
                        <td>{nombreCompleto || '-'}</td>
                        <td>{pedido.descripcion || pedido.Descripcion || pedido.plato || pedido.Plato || '-'}</td>
                        <td>{formatearImporte(monto)}</td>
                        <td>{formatearFecha(fechaHora)}</td>
                        <td>{obtenerEstado(estado)}</td>
                        <td>
                          {estado === 'P' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleDespachar(pedido)}
                              disabled={isLoading}
                              title="Marcar como despachado"
                            >
                              <i className="fa fa-check"></i> Despachar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
};

export default Despacho;
