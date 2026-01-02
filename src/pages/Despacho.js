import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { apiService } from '../services/apiService';
import { comandasService } from '../services/comandasService';
import { getApiBaseUrl } from '../services/configService';
import Swal from 'sweetalert2';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
  const [filtroEstado, setFiltroEstado] = useState('P'); // Filtro por estado (por defecto: Pendiente)
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  
  // Estados para el modal de impresión
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState({
    npedido: true,
    usuario: true,
    plato: true,
    importe: true,
    fecha: true,
    estado: true,
    turno: false,
    comentario: false,
  });

  // Cargar pedidos pendientes
  const cargarPedidos = useCallback(async () => {
    try {
      setIsLoading(true);
      // Obtener fecha de hoy en formato YYYY-MM-DD
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];
      
      // Llamar al endpoint /api/comanda/lista con fechaDesde y fechaHasta igual a hoy
      const data = await apiService.getListaComandas(1, 1000, fechaHoy, fechaHoy);
      
      // Mostrar en log lo que devuelve la API de despacho
      console.log('[Despacho] 📥 Respuesta completa de /api/comanda/lista:', JSON.stringify(data, null, 2));
      
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

  // Filtrar pedidos por texto y estado
  useEffect(() => {
    let filtrados = pedidos;

    // Filtrar por texto
    if (filtro.trim()) {
      const textoFiltro = filtro.toLowerCase();
      filtrados = filtrados.filter((pedido) => {
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
    }

    // Filtrar por estado
    if (filtroEstado) {
      filtrados = filtrados.filter((pedido) => {
        const estado = pedido.Estado || pedido.estado || '';
        return estado === filtroEstado;
      });
    }
    
    setPedidosFiltrados(filtrados);
  }, [filtro, filtroEstado, pedidos]);

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

  // Funciones de impresión
  const handleExportarPDF = useCallback(() => {
    try {
      if (pedidosFiltrados.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay pedidos para imprimir',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      const doc = new jsPDF();

      // Título centrado
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(14);
      const titulo = 'Listado de Despacho de Platos';
      const tituloWidth = doc.getTextWidth(titulo);
      const tituloX = (pageWidth - tituloWidth) / 2;
      doc.text(titulo, tituloX, 15);

      // Fecha centrada con letra más chica
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.setFontSize(9);
      const fechaTexto = `Generado el: ${fecha}`;
      const fechaWidth = doc.getTextWidth(fechaTexto);
      const fechaX = (pageWidth - fechaWidth) / 2;
      doc.text(fechaTexto, fechaX, 22);

      // Construir headers y datos
      const headers = [];
      const tableData = [];

      // Agregar columnas según selección
      if (columnasSeleccionadas.npedido) headers.push('Nº Pedido');
      if (columnasSeleccionadas.usuario) headers.push('Usuario');
      if (columnasSeleccionadas.plato) headers.push('Plato');
      if (columnasSeleccionadas.importe) headers.push('Importe ($)');
      if (columnasSeleccionadas.fecha) headers.push('Fecha');
      if (columnasSeleccionadas.estado) headers.push('Estado');
      if (columnasSeleccionadas.turno) headers.push('Turno');
      if (columnasSeleccionadas.comentario) headers.push('Comentario');

      pedidosFiltrados.forEach((pedido) => {
        const fila = [];
        if (columnasSeleccionadas.npedido) {
          fila.push(pedido.Npedido || pedido.npedido || '-');
        }
        if (columnasSeleccionadas.usuario) {
          const nombre = pedido.user_name || pedido.userName || pedido.nombre || '';
          const apellido = pedido.user_lastName || pedido.userLastName || pedido.apellido || '';
          fila.push(`${nombre} ${apellido}`.trim() || '-');
        }
        if (columnasSeleccionadas.plato) {
          fila.push(pedido.PlatoDescripcion || pedido.platoDescripcion || pedido.descripcion || pedido.Descripcion || '-');
        }
        if (columnasSeleccionadas.importe) {
          const importe = pedido.Importe || pedido.importe || pedido.Monto || pedido.monto || 0;
          fila.push(`$${parseFloat(importe).toFixed(2)}`);
        }
        if (columnasSeleccionadas.fecha) {
          fila.push(formatearFecha(pedido.Fecha || pedido.fecha));
        }
        if (columnasSeleccionadas.estado) {
          const estado = pedido.Estado || pedido.estado;
          const estadoTexto = estado === 'P' ? 'Pendiente' : estado === 'D' ? 'Devuelto' : estado === 'C' ? 'Cancelado' : estado === 'R' ? 'Recibido' : estado === 'E' ? 'En Aceptación' : estado || '-';
          fila.push(estadoTexto);
        }
        if (columnasSeleccionadas.turno) {
          fila.push(pedido.TurnoNombre || pedido.turnoNombre || pedido.turno || '-');
        }
        if (columnasSeleccionadas.comentario) {
          fila.push(pedido.Comentario || pedido.comentario || '-');
        }
        tableData.push(fila);
      });

      doc.autoTable({
        startY: 28,
        head: [headers],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [52, 58, 64], fontStyle: 'bold', halign: 'center' },
      });

      doc.save('despacho-platos.pdf');
      setMostrarModalImpresion(false);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al generar el PDF',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  }, [pedidosFiltrados, columnasSeleccionadas]);

  const handleExportarExcel = useCallback(() => {
    try {
      if (pedidosFiltrados.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay pedidos para exportar',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      // Construir headers
      const headers = [];
      if (columnasSeleccionadas.npedido) headers.push('Nº Pedido');
      if (columnasSeleccionadas.usuario) headers.push('Usuario');
      if (columnasSeleccionadas.plato) headers.push('Plato');
      if (columnasSeleccionadas.importe) headers.push('Importe ($)');
      if (columnasSeleccionadas.fecha) headers.push('Fecha');
      if (columnasSeleccionadas.estado) headers.push('Estado');
      if (columnasSeleccionadas.turno) headers.push('Turno');
      if (columnasSeleccionadas.comentario) headers.push('Comentario');

      // Construir datos
      const worksheetData = pedidosFiltrados.map((pedido) => {
        const fila = [];
        if (columnasSeleccionadas.npedido) {
          fila.push(pedido.Npedido || pedido.npedido || '-');
        }
        if (columnasSeleccionadas.usuario) {
          const nombre = pedido.user_name || pedido.userName || pedido.nombre || '';
          const apellido = pedido.user_lastName || pedido.userLastName || pedido.apellido || '';
          fila.push(`${nombre} ${apellido}`.trim() || '-');
        }
        if (columnasSeleccionadas.plato) {
          fila.push(pedido.PlatoDescripcion || pedido.platoDescripcion || pedido.descripcion || pedido.Descripcion || '-');
        }
        if (columnasSeleccionadas.importe) {
          const importe = pedido.Importe || pedido.importe || pedido.Monto || pedido.monto || 0;
          fila.push(parseFloat(importe).toFixed(2));
        }
        if (columnasSeleccionadas.fecha) {
          fila.push(formatearFecha(pedido.Fecha || pedido.fecha));
        }
        if (columnasSeleccionadas.estado) {
          const estado = pedido.Estado || pedido.estado;
          const estadoTexto = estado === 'P' ? 'Pendiente' : estado === 'D' ? 'Devuelto' : estado === 'C' ? 'Cancelado' : estado === 'R' ? 'Recibido' : estado === 'E' ? 'En Aceptación' : estado || '-';
          fila.push(estadoTexto);
        }
        if (columnasSeleccionadas.turno) {
          fila.push(pedido.TurnoNombre || pedido.turnoNombre || pedido.turno || '-');
        }
        if (columnasSeleccionadas.comentario) {
          fila.push(pedido.Comentario || pedido.comentario || '-');
        }
        return fila;
      });

      // Obtener fecha formateada
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const numColumnas = headers.length;

      // Crear datos con título y fecha
      const datosConTitulo = [
        [],
        ['Listado de Despacho de Platos'],
        [`Generado el: ${fecha}`],
        [],
        headers,
        ...worksheetData,
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(datosConTitulo);

      // Fusionar celdas para centrar título y fecha
      worksheet['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: numColumnas - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: numColumnas - 1 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: numColumnas - 1 } },
      ];

      // Ajustar el ancho de las columnas
      const colWidths = headers.map(() => ({ wch: 18 }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Despacho');
      XLSX.writeFile(workbook, 'despacho-platos.xlsx');

      setMostrarModalImpresion(false);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al generar el archivo Excel',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  }, [pedidosFiltrados, columnasSeleccionadas]);


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
              justifyContent: 'space-between',
            }}
          >
            <div style={{ flex: '1', minWidth: '200px', maxWidth: '100%' }}>
              <Buscador
                filtro={filtro}
                setFiltro={setFiltro}
                placeholder="Buscar pedidos..."
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <select
                className="form-control"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{
                  minWidth: '150px',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #ced4da',
                }}
              >
                <option value="">Todos los estados</option>
                <option value="P">Pendiente</option>
                <option value="D">Devuelto</option>
                <option value="C">Cancelado</option>
                <option value="R">Recibido</option>
                <option value="E">En Aceptación</option>
              </select>
              {pedidosFiltrados.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setMostrarModalImpresion(true)}
                  title="Opciones de impresión"
                  style={{
                    backgroundColor: '#007bff',
                    borderColor: '#007bff',
                    color: 'white',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa fa-print" aria-hidden="true"></i>
                  Imprimir
                </button>
              )}
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
                    
                    // Obtener la foto del usuario - priorizar Foto que viene con prefijo data:image/jpeg;base64,
                    const foto = row.Foto || row.foto || row.FotoComensal || row.fotoComensal || row.user_foto || row.userFoto || row.UsuarioFoto;
                    let fotoUrl = null;
                    
                    if (foto && foto.trim() !== '') {
                      // Si ya tiene el prefijo data:, usarlo directamente
                      if (foto.startsWith('data:')) {
                        fotoUrl = foto;
                      }
                      // Si es una URL completa (http/https), usarla tal cual
                      else if (foto.startsWith('http://') || foto.startsWith('https://')) {
                        fotoUrl = foto;
                      }
                      // Si es base64 puro (sin prefijo), agregar el prefijo data:image/jpeg;base64,
                      // Verificar si parece ser base64: solo caracteres alfanuméricos, +, /, = y posiblemente espacios/saltos de línea
                      else if (typeof foto === 'string') {
                        // Limpiar posibles espacios y saltos de línea
                        const fotoLimpia = foto.trim().replace(/\s/g, '');
                        // Verificar si es base64 puro (caracteres válidos de base64)
                        if (/^[A-Za-z0-9+/=]+$/.test(fotoLimpia) && fotoLimpia.length > 50) {
                          fotoUrl = `data:image/jpeg;base64,${fotoLimpia}`;
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
                    }
                    
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt={nombreCompleto}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1px solid #dee2e6',
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span style={{ flex: 1 }}>{nombreCompleto}</span>
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
                      // Priorizar Foto que viene con prefijo data:image/jpeg;base64,
                      const foto = pedidoSeleccionado?.Foto || pedidoSeleccionado?.foto || pedidoSeleccionado?.FotoComensal || pedidoSeleccionado?.fotoComensal || pedidoSeleccionado?.user_foto || pedidoSeleccionado?.userFoto || pedidoSeleccionado?.UsuarioFoto;
                      
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
                        // Si es base64 puro (sin prefijo), agregar el prefijo data:image/jpeg;base64,
                        // Verificar si parece ser base64: solo caracteres alfanuméricos, +, /, = y posiblemente espacios/saltos de línea
                        else if (typeof foto === 'string') {
                          // Limpiar posibles espacios y saltos de línea
                          const fotoLimpia = foto.trim().replace(/\s/g, '');
                          // Verificar si es base64 puro (caracteres válidos de base64)
                          if (/^[A-Za-z0-9+/=]+$/.test(fotoLimpia) && fotoLimpia.length > 50) {
                            fotoUrl = `data:image/jpeg;base64,${fotoLimpia}`;
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

        {/* Modal de opciones de impresión */}
        {mostrarModalImpresion && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '1rem',
            }}
            onClick={() => setMostrarModalImpresion(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '0.25rem',
                padding: '1.5rem',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0 }}>Opciones de Impresión</h4>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setMostrarModalImpresion(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: '#6c757d',
                    cursor: 'pointer',
                    padding: 0,
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              {/* Selección de columnas */}
              <div style={{ marginBottom: '2rem' }}>
                <h5 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                  Columnas a incluir:
                </h5>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem 1rem',
                    maxWidth: '50%',
                    justifyContent: 'start',
                  }}
                >
                  {Object.keys(columnasSeleccionadas).map((columna) => {
                    const labels = {
                      npedido: 'Nº Pedido',
                      usuario: 'Usuario',
                      plato: 'Plato',
                      importe: 'Importe',
                      fecha: 'Fecha',
                      estado: 'Estado',
                      turno: 'Turno',
                      comentario: 'Comentario',
                    };

                    const labelTexto = labels[columna] || columna;

                    return (
                      <label
                        key={columna}
                        htmlFor={`col-${columna}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          margin: 0,
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`col-${columna}`}
                          checked={columnasSeleccionadas[columna] || false}
                          onChange={(e) => {
                            setColumnasSeleccionadas((prev) => ({
                              ...prev,
                              [columna]: e.target.checked,
                            }));
                          }}
                          style={{
                            margin: 0,
                            flexShrink: 0,
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                          }}
                        />
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {labelTexto}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                justifyContent: 'flex-end',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e0e0e0'
              }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setMostrarModalImpresion(false)}
                  style={{
                    backgroundColor: '#6c757d',
                    borderColor: '#6c757d',
                    color: 'white',
                    padding: '0.625rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a6268';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#6c757d';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleExportarPDF}
                  style={{
                    backgroundColor: '#dc3545',
                    borderColor: '#dc3545',
                    color: 'white',
                    padding: '0.625rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c82333';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Exportar PDF
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleExportarExcel}
                  style={{
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    color: 'white',
                    padding: '0.625rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#218838';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#28a745';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Exportar Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Despacho;
