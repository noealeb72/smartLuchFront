import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import Swal from 'sweetalert2';
import { mapUsuarios } from '../utils/dataMapper';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Usuarios.css';

const ReporteGComensales = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerandoReporte, setIsGenerandoReporte] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  
  // Estado del reporte
  const [reporte, setReporte] = useState(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCargandoHistorial, setIsCargandoHistorial] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    fechaDesde: '',
    fechaHasta: '',
    usuarioId: '',
  });

  // Cargar usuarios activos para el selector
  const cargarUsuarios = useCallback(async () => {
    try {
      setIsLoading(true);
      // Obtener todos los usuarios activos (pageSize=100 para obtener todos)
      const data = await apiService.getUsuarios(1, 100, '', true);
      
      let usuariosArray = [];
      if (data.items && Array.isArray(data.items)) {
        usuariosArray = data.items;
      } else if (Array.isArray(data)) {
        usuariosArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        usuariosArray = data.data;
      }
      
      if (usuariosArray.length > 0) {
        const usuariosMapeados = mapUsuarios(usuariosArray);
        setUsuarios(usuariosMapeados);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los usuarios',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Establecer fecha por defecto (hoy)
  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      fechaDesde: prev.fechaDesde || hoy,
      fechaHasta: prev.fechaHasta || hoy,
    }));
  }, []);

  // Filtrar usuarios según el término de búsqueda
  useEffect(() => {
    if (!busquedaUsuario.trim()) {
      setUsuariosFiltrados([]);
      setMostrarDropdown(false);
      return;
    }

    const termino = busquedaUsuario.toLowerCase().trim();
    const filtrados = usuarios.filter(usuario => {
      const nombre = (usuario.nombre || '').toLowerCase();
      const apellido = (usuario.apellido || '').toLowerCase();
      const legajo = (usuario.legajo || '').toString().toLowerCase();
      const username = (usuario.username || '').toLowerCase();
      const nombreCompleto = `${nombre} ${apellido}`.trim();
      
      return nombre.includes(termino) ||
             apellido.includes(termino) ||
             legajo.includes(termino) ||
             username.includes(termino) ||
             nombreCompleto.includes(termino);
    });

    setUsuariosFiltrados(filtrados);
    setMostrarDropdown(filtrados.length > 0);
  }, [busquedaUsuario, usuarios]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.usuario-buscador-container')) {
        setMostrarDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manejar cambio de input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejar búsqueda de usuario
  const handleBusquedaUsuario = (e) => {
    const valor = e.target.value;
    setBusquedaUsuario(valor);
    if (valor.trim() && !mostrarDropdown) {
      setMostrarDropdown(true);
    }
  };

  // Seleccionar usuario
  const handleSeleccionarUsuario = (usuario) => {
    const usuarioId = usuario.id || usuario.Id || usuario.ID;
    setFormData(prev => ({
      ...prev,
      usuarioId: usuarioId,
    }));
    setUsuarioSeleccionado(usuario);
    setBusquedaUsuario('');
    setMostrarDropdown(false);
  };

  // Limpiar selección de usuario
  const handleLimpiarUsuario = () => {
    setFormData(prev => ({
      ...prev,
      usuarioId: '',
    }));
    setUsuarioSeleccionado(null);
    setBusquedaUsuario('');
    setMostrarDropdown(false);
  };

  // Validar formulario
  const validarFormulario = () => {
    const errores = [];
    let primerCampoConError = '';

    const addError = (message, fieldId) => {
      errores.push(message);
      if (!primerCampoConError) primerCampoConError = fieldId;
    };

    if (!formData.fechaDesde.trim()) {
      addError('La fecha desde es requerida', 'fechaDesde');
    }

    if (!formData.fechaHasta.trim()) {
      addError('La fecha hasta es requerida', 'fechaHasta');
    }

    if (formData.fechaDesde && formData.fechaHasta) {
      const fechaDesde = new Date(formData.fechaDesde);
      const fechaHasta = new Date(formData.fechaHasta);
      
      if (fechaDesde > fechaHasta) {
        addError('La fecha desde no puede ser mayor que la fecha hasta', 'fechaDesde');
      }
    }

    if (!formData.usuarioId || formData.usuarioId === '' || !usuarioSeleccionado) {
      addError('Debe seleccionar un usuario/comensal', 'busquedaUsuario');
    }

    if (errores.length > 0) {
      Swal.fire({
        title: 'Error de validación',
        html: '<div style="text-align: left;"><p>Los siguientes campos son obligatorios:</p><ul style="margin: 0; padding-left: 20px;">' + 
              errores.map(err => `<li>${err}</li>`).join('') + 
              '</ul></div>',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      }).then(() => {
        if (primerCampoConError) {
          const campo = document.getElementById(primerCampoConError);
          if (campo) {
            campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            campo.focus();
          }
        }
      });
      return false;
    }

    return true;
  };

  // Paginar historial localmente
  const paginarHistorial = useCallback((historial, page) => {
    if (!historial || historial.length === 0) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1
      };
    }
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = historial.slice(startIndex, endIndex);
    const totalPages = Math.ceil(historial.length / pageSize);
    
    return {
      items,
      totalItems: historial.length,
      totalPages,
      currentPage: page
    };
  }, [pageSize]);

  // Generar reporte
  const handleGenerarReporte = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Declarar variables fuera del try para que estén disponibles en el catch
    let legajo = null;
    let plantaId = null;

    try {
      setIsGenerandoReporte(true);
      setCurrentPage(1);
      
      // Obtener el legajo del usuario seleccionado
      legajo = usuarioSeleccionado?.legajo || formData.usuarioId;
      
      if (!legajo) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener el legajo del usuario',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }
      
      // Obtener plantaId del usuario seleccionado (si está disponible)
      plantaId = usuarioSeleccionado?.planta_id || 
                 usuarioSeleccionado?.plantaId || 
                 usuarioSeleccionado?.PlantaId || 
                 null;
      
      const data = await apiService.getReportePorComensal(
        legajo.toString(), // Asegurar que sea string
        formData.fechaDesde,
        formData.fechaHasta,
        plantaId ? parseInt(plantaId) : null // Convertir a número si existe
      );
      
      // Debug: Ver qué datos vienen del backend
      console.log('📸 [ReporteGComensales] Datos recibidos del backend:', {
        foto: data.foto || data.Foto,
        tieneFoto: !!(data.foto || data.Foto),
        keys: Object.keys(data),
        usuarioSeleccionadoFoto: usuarioSeleccionado?.foto || usuarioSeleccionado?.Foto
      });
      
      // Mapear los datos según la estructura del backend
      const historialCompleto = (data.consumidos || []).map(comanda => {
        // Asegurar que descripcionPlato sea siempre un string
        let descripcionPlato = comanda.descripcionPlato;
        
        // Si descripcionPlato es un objeto, extraer la propiedad descripcion o nombre
        if (descripcionPlato && typeof descripcionPlato === 'object') {
          descripcionPlato = descripcionPlato.descripcion || 
                            descripcionPlato.Descripcion || 
                            descripcionPlato.nombre || 
                            descripcionPlato.Nombre || 
                            'N/A';
        }
        
        // Asegurar que sea string o null/undefined
        if (descripcionPlato && typeof descripcionPlato !== 'string') {
          descripcionPlato = String(descripcionPlato);
        }
        
        return {
          id: comanda.id,
          fecha: comanda.fecha,
          monto: comanda.monto,
          estado: comanda.estado,
          platoId: comanda.platoId,
          descripcionPlato: descripcionPlato || 'N/A',
          bonificado: comanda.bonificado,
          plato: descripcionPlato || 'N/A'
        };
      });
      
      // Paginar el historial
      const historialPaginado = paginarHistorial(historialCompleto, 1);
      
      // Obtener nombres de las entidades relacionadas desde el usuario seleccionado o datos del backend
      const planNutricionalNombre = (() => {
        const v = data.plannutricional;
        if (!v) return usuarioSeleccionado?.plannutricional_nombre || usuarioSeleccionado?.planNutricionalNombre || null;
        if (typeof v === 'object') return v.nombre || v.Nombre || v.descripcion || v.Descripcion || null;
        return v;
      })();

      // Obtener foto del usuario (buscar en múltiples variantes)
      const obtenerFoto = () => {
        // Buscar en data del backend (variantes posibles)
        const fotoData = data.foto || data.Foto || data.fotoUsuario || data.FotoUsuario;
        if (fotoData) return fotoData;
        
        // Buscar en usuarioSeleccionado (variantes posibles)
        const fotoUsuario = usuarioSeleccionado?.foto || 
                           usuarioSeleccionado?.Foto || 
                           usuarioSeleccionado?.fotoUsuario || 
                           usuarioSeleccionado?.FotoUsuario;
        if (fotoUsuario) return fotoUsuario;
        
        return null;
      };

      // Normalizar los datos del reporte según la estructura sugerida
      const reporteData = {
        // Sección 1: Header con datos del usuario
        usuario: {
          foto: obtenerFoto(),
          nombreCompleto: `${data.nombre || ''} ${data.apellido || ''}`.trim() || 
                         `${usuarioSeleccionado?.nombre || ''} ${usuarioSeleccionado?.apellido || ''}`.trim(),
          legajo: data.legajo || legajo || usuarioSeleccionado?.legajo || '',
          dni: data.dni || usuarioSeleccionado?.dni || '',
          domicilio: data.domicilio || usuarioSeleccionado?.domicilio || null
        },
        
        // Sección 2: Información organizacional
        organizacion: {
          planta: usuarioSeleccionado?.planta_nombre || usuarioSeleccionado?.plantaNombre || usuarioSeleccionado?.planta || 'N/A',
          centroCosto: usuarioSeleccionado?.centrodecosto_nombre || usuarioSeleccionado?.centroDeCostoNombre || usuarioSeleccionado?.centrodecosto || 'N/A',
          proyecto: usuarioSeleccionado?.proyecto_nombre || usuarioSeleccionado?.proyectoNombre || usuarioSeleccionado?.proyecto || 'N/A',
          jerarquia: usuarioSeleccionado?.jerarquia_nombre || usuarioSeleccionado?.jerarquiaNombre || usuarioSeleccionado?.jerarquia || 'N/A',
          planNutricional: planNutricionalNombre || 'N/A'
        },
        
        // Sección 3: Resumen de bonificaciones
        bonificaciones: {
          total: data.bonificados || 0,
          invitadoAcumulado: usuarioSeleccionado?.bonificacionesInvitado || usuarioSeleccionado?.bonificaciones_invitado || 0,
          invitadoRango: data.bonificadosInvitados || 0
        },
        
        // Sección 4: Estadísticas del período
        estadisticas: {
          montoTotal: data.monto || 0,
          ultimoEstado: data.ultimoEstado || null,
          ultimoPlato: data.ultimoPlato || null,
          cantidadPlatosDistintos: (data.descripcionesPlatos || []).length
        },
        
        // Sección 5: Tabla de comandas
        comandas: historialCompleto.map(comanda => ({
          fecha: comanda.fecha,
          plato: comanda.descripcionPlato || comanda.plato || 'N/A',
          monto: comanda.monto || 0,
          estado: comanda.estado || 'N/A',
          bonificado: comanda.bonificado ? 'Sí' : 'No',
          invitado: comanda.invitado ? 'Sí' : 'No'
        })),
        
        // Sección 6: Lista de platos
        platosDistintos: data.descripcionesPlatos || [],
        
        // Datos adicionales para compatibilidad
        historialCompleto: historialCompleto,
        historialPedidos: historialPaginado.items,
        totalItems: historialPaginado.totalItems,
        totalPages: historialPaginado.totalPages,
        currentPage: 1
      };
      
      setReporte(reporteData);
      setMostrarReporte(true);
      
      // Scroll al inicio del reporte
      setTimeout(() => {
        const reporteSection = document.getElementById('reporte-section');
        if (reporteSection) {
          reporteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (error) {
      if (!error.redirectToLogin) {
        let errorMessage = error.message || 'Error al generar el reporte';
        
        // Obtener información adicional del error si está disponible
        let errorDetails = '';
        if (error.response) {
          const status = error.response.status;
          const responseData = error.response.data;
          
          // Para errores 500, intentar obtener más detalles del backend
          if (status === 500) {
            if (responseData && typeof responseData === 'object') {
              const backendError = responseData.error || responseData.Error || responseData.message || responseData.Message;
              if (backendError && typeof backendError === 'string') {
                errorDetails = `\n\nDetalles: ${backendError}`;
              }
            } else if (typeof responseData === 'string') {
              errorDetails = `\n\nDetalles: ${responseData}`;
            }
            
            // Agregar información de los parámetros enviados para diagnóstico
            const paramsInfo = `\n\nParámetros enviados:\n- Usuario (legajo): ${legajo}\n- Fecha desde: ${formData.fechaDesde}\n- Fecha hasta: ${formData.fechaHasta}\n- Planta ID: ${plantaId || 'No especificado'}`;
            errorDetails += paramsInfo;
          }
        }
        
        // Mejorar mensaje de error para CORS
        if (errorMessage.includes('CORS') || errorMessage.includes('mismo origen')) {
          errorMessage = 'Error CORS: El backend no permite peticiones desde este origen. Por favor, contacta al administrador para configurar CORS en el servidor.';
        } else if (errorMessage.includes('conexión') || errorMessage.includes('ECONNREFUSED')) {
          errorMessage = 'Error de conexión con el servidor. Verifica que el backend esté corriendo y accesible.';
        } else if (errorMessage.includes('Error interno del servidor')) {
          errorMessage = `Error interno del servidor. Contacta al administrador.${errorDetails}`;
        }
        
        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
          width: '600px'
        });
      }
    } finally {
      setIsGenerandoReporte(false);
    }
  };

  // Cambiar página del historial
  const handlePageChange = (page) => {
    if (!reporte || !reporte.comandas || reporte.comandas.length === 0) return;
    
    setCurrentPage(page);
    // Convertir comandas a formato de historial para la paginación
    const historialParaPaginacion = reporte.comandas.map(comanda => ({
      fecha: comanda.fecha,
      plato: comanda.plato,
      descripcionPlato: comanda.plato,
      monto: comanda.monto,
      estado: comanda.estado,
      bonificado: comanda.bonificado === 'Sí',
      invitado: comanda.invitado === 'Sí'
    }));
    
    const historialPaginado = paginarHistorial(historialParaPaginacion, page);
    
    setReporte(prev => ({
      ...prev,
      historialPedidos: historialPaginado.items,
      totalItems: historialPaginado.totalItems,
      totalPages: historialPaginado.totalPages,
      currentPage: page
    }));
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Formatear fecha con hora
  const formatearFechaHora = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}-${hours}:${minutes}:${seconds}`;
  };

  // Formatear moneda
  const formatearMoneda = (valor) => {
    if (!valor && valor !== 0) return '$0,00';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(valor);
  };

  // Traducir estado
  const traducirEstado = (estado) => {
    if (!estado) return 'N/A';
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower.includes('aceptación') || estadoLower.includes('aceptacion')) {
      return 'Aceptado';
    } else if (estadoLower.includes('devuelto')) {
      return 'Devuelto';
    } else if (estadoLower.includes('pendiente')) {
      return 'Pendiente';
    }
    return estado; // Devolver el estado original si no se reconoce
  };

  // Obtener color del estado
  // Limpiar la palabra "jerarquia" del inicio del texto
  const limpiarJerarquia = (texto) => {
    if (!texto || texto === 'N/A') return texto;
    const textoLimpio = texto.trim();
    // Verificar si comienza con "jerarquia" (case insensitive)
    const regex = /^jerarquia\s+/i;
    if (regex.test(textoLimpio)) {
      return textoLimpio.replace(regex, '').trim();
    }
    return textoLimpio;
  };

  const getEstadoColor = (estado) => {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower.includes('aceptación') || estadoLower.includes('aceptacion')) {
      return '#28a745'; // Verde
    } else if (estadoLower.includes('devuelto')) {
      return '#6c757d'; // Gris
    } else if (estadoLower.includes('pendiente')) {
      return '#ffc107'; // Amarillo
    }
    return '#343a40'; // Negro por defecto
  };

  // Exportar reporte a PDF
  const handleExportarPDF = () => {
    if (!reporte || !reporte.usuario || !reporte.comandas || reporte.comandas.length === 0) {
      Swal.fire({
        title: 'Error',
        text: 'No hay pedidos para exportar',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    try {
      // Manejar diferentes formas de importación de jsPDF
      const JSPDF = jsPDF.default || jsPDF;
      const doc = new JSPDF();
      
      // Título del reporte
      doc.setFontSize(16);
      doc.text('Reporte por Comensal', 14, 15);
      
      // Fecha de generación
      const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Generado el: ${fechaGeneracion}`, 14, 22);
      
      // Período del reporte
      const periodo = `${formatearFecha(formData.fechaDesde)} - ${formatearFecha(formData.fechaHasta)}`;
      doc.text(`Período: ${periodo}`, 14, 28);
      
      let yPos = 38;
      
      // Información del Comensal
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Información del Comensal', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Sección 1: Datos del usuario
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Datos del Usuario', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Nombre completo: ${reporte.usuario.nombreCompleto || 'N/A'}`, 14, yPos);
      yPos += 6;
      doc.text(`Legajo: ${reporte.usuario.legajo || 'N/A'}`, 14, yPos);
      yPos += 6;
      doc.text(`DNI: ${reporte.usuario.dni || 'N/A'}`, 14, yPos);
      yPos += 6;
      if (reporte.usuario.domicilio) {
        doc.text(`Domicilio: ${reporte.usuario.domicilio}`, 14, yPos);
        yPos += 6;
      }
      yPos += 4;
      
      // Sección 2: Información organizacional
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Información Organizacional', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Planta: ${reporte.organizacion.planta}`, 14, yPos);
      yPos += 6;
      doc.text(`Centro de Costo: ${reporte.organizacion.centroCosto}`, 14, yPos);
      yPos += 6;
      doc.text(`Proyecto: ${reporte.organizacion.proyecto}`, 14, yPos);
      yPos += 6;
      doc.text(`Jerarquía: ${limpiarJerarquia(reporte.organizacion.jerarquia)}`, 14, yPos);
      yPos += 6;
      doc.text(`Plan Nutricional: ${reporte.organizacion.planNutricional}`, 14, yPos);
      yPos += 10;
      
      // Sección 3: Resumen de bonificaciones
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen de Bonificaciones', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total bonificados: ${reporte.bonificaciones.total || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Invitado acumulado: ${reporte.bonificaciones.invitadoAcumulado || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Invitado en rango: ${reporte.bonificaciones.invitadoRango || 0}`, 14, yPos);
      yPos += 10;
      
      // Sección 4: Estadísticas del período
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Estadísticas del Período', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Monto total: ${formatearMoneda(reporte.estadisticas.montoTotal || 0)}`, 14, yPos);
      yPos += 6;
      doc.text(`Último estado: ${traducirEstado(reporte.estadisticas.ultimoEstado) || 'N/A'}`, 14, yPos);
      yPos += 6;
      doc.text(`Último plato: ${reporte.estadisticas.ultimoPlato || 'N/A'}`, 14, yPos);
      yPos += 6;
      doc.text(`Cantidad de platos distintos: ${reporte.estadisticas.cantidadPlatosDistintos || 0}`, 14, yPos);
      yPos += 10;
      
      // Sección 5: Historial de Pedidos
      if (reporte.comandas && reporte.comandas.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Historial de Pedidos', 14, yPos);
        yPos += 8;
        
        // Preparar datos de la tabla con TODOS los pedidos (no solo la página actual)
        const tableData = reporte.comandas.map((comanda) => {
          return [
            formatearFechaHora(comanda.fecha),
            comanda.plato || 'N/A',
            traducirEstado(comanda.estado),
            comanda.bonificado,
            comanda.invitado,
            formatearMoneda(comanda.monto || 0)
          ];
        });
        
        doc.autoTable({
          startY: yPos,
          head: [['Fecha', 'Plato', 'Estado', 'Bonificación', 'Invitado', 'Costo']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { top: yPos }
        });
        
        // Sección 6: Lista de platos distintos
        if (reporte.platosDistintos && reporte.platosDistintos.length > 0) {
          yPos = doc.lastAutoTable.finalY + 10;
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Platos Distintos Consumidos', 14, yPos);
          yPos += 8;
          
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          reporte.platosDistintos.forEach((plato) => {
            doc.text(`• ${plato || 'N/A'}`, 14, yPos);
            yPos += 6;
          });
        }
      } else {
        doc.setFontSize(10);
        doc.text('No hay pedidos registrados en el rango de fechas seleccionado.', 14, yPos);
      }
      
      // Nombre del archivo
      const nombreUsuario = (reporte.usuario.nombreCompleto || 'comensal').replace(/\s+/g, '_');
      const fechaArchivo = new Date().toISOString().split('T')[0];
      const fileName = `reporte_${nombreUsuario}_${fechaArchivo}.pdf`;
      
      doc.save(fileName);
      
      Swal.fire({
        title: 'Éxito',
        text: 'El reporte se ha exportado correctamente en formato PDF',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: true,
      });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al exportar el reporte a PDF',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  };

  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      {/* Barra negra con título */}
      <div className="page-title-bar">
        <h3>
          <i className="fa fa-chart-bar mr-2" aria-hidden="true"></i>
          Reporte por Comensal
        </h3>
      </div>

      <div className="container-fluid" style={{ backgroundColor: 'white', padding: '2rem 3rem', minHeight: 'calc(100vh - 200px)' }}>
        <div className="usuarios-form-container" style={{ maxWidth: '95%', width: '100%', margin: '0 auto' }}>
          <form>
            <div className="form-section" style={{ marginBottom: '2rem' }}>
              <div 
                className="page-title-bar" 
                style={{ 
                  marginBottom: filtrosAbiertos ? '0' : '1.5rem', 
                  borderRadius: filtrosAbiertos ? '0.5rem 0.5rem 0 0' : '0.5rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFiltrosAbiertos(!filtrosAbiertos);
                  }
                }}
                aria-expanded={filtrosAbiertos}
                aria-controls="filtros-content"
              >
                <h3 style={{ margin: 0, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <i className="fa fa-filter mr-2" aria-hidden="true" style={{ fontSize: '12px' }}></i>
                    Filtros del Reporte
                  </span>
                  <i 
                    className={`fa ${filtrosAbiertos ? 'fa-chevron-up' : 'fa-chevron-down'}`} 
                    aria-hidden="true"
                    style={{ fontSize: '0.9rem', marginLeft: '1rem', transition: 'transform 0.3s ease' }}
                  ></i>
                </h3>
              </div>
              {filtrosAbiertos && (
              <div 
                id="filtros-content"
                className="form-section-content" 
                style={{ 
                  border: '1px solid #dee2e6', 
                  borderTop: 'none', 
                  borderRadius: '0 0 0.5rem 0.5rem', 
                  backgroundColor: 'white', 
                  padding: '1.5rem',
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                <div className="row">
                  <div className="col-md-2">
                    <div className="form-group">
                      <label htmlFor="fechaDesde">
                        Fecha Desde <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fechaDesde"
                        name="fechaDesde"
                        value={formData.fechaDesde || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label htmlFor="fechaHasta">
                        Fecha Hasta <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fechaHasta"
                        name="fechaHasta"
                        value={formData.fechaHasta || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="form-group">
                      <label htmlFor="busquedaUsuario">
                        Usuario/Comensal <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                        <div className="usuario-buscador-container" style={{ position: 'relative', flex: 1 }}>
                          {usuarioSeleccionado ? (
                            <input
                              type="text"
                              className="form-control"
                              id="busquedaUsuario"
                              value={`${`${usuarioSeleccionado.nombre || ''} ${usuarioSeleccionado.apellido || ''}`.trim() || usuarioSeleccionado.username || 'Sin nombre'}${usuarioSeleccionado.legajo ? ` (Legajo: ${usuarioSeleccionado.legajo})` : ''}`}
                              readOnly
                              disabled={isLoading}
                              style={{ backgroundColor: '#e9ecef', cursor: 'default' }}
                            />
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              id="busquedaUsuario"
                              name="busquedaUsuario"
                              value={busquedaUsuario}
                              onChange={handleBusquedaUsuario}
                              onFocus={() => {
                                if (busquedaUsuario.trim() && usuariosFiltrados.length > 0) {
                                  setMostrarDropdown(true);
                                }
                              }}
                              placeholder="Buscar por nombre, apellido o legajo..."
                              required
                              disabled={isLoading}
                              autoComplete="off"
                            />
                          )}
                          {mostrarDropdown && usuariosFiltrados.length > 0 && (
                            <div
                              className="dropdown-menu show"
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                                maxHeight: '300px',
                                overflowY: 'auto',
                                marginTop: '2px',
                                width: '100%',
                                display: 'block'
                              }}
                            >
                              {usuariosFiltrados.map((usuario) => {
                                const usuarioId = usuario.id || usuario.Id || usuario.ID;
                                const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.username || 'Sin nombre';
                                const legajo = usuario.legajo ? ` (Legajo: ${usuario.legajo})` : '';
                                return (
                                  <button
                                    key={usuarioId}
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => handleSeleccionarUsuario(usuario)}
                                    style={{ textAlign: 'left', cursor: 'pointer' }}
                                  >
                                    <div>
                                      <strong>{nombreCompleto}</strong>
                                      {legajo && <span style={{ color: '#6c757d' }}>{legajo}</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {mostrarDropdown && busquedaUsuario.trim() && usuariosFiltrados.length === 0 && (
                            <div
                              className="dropdown-menu show"
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                                marginTop: '2px',
                                width: '100%',
                                display: 'block'
                              }}
                            >
                              <div className="dropdown-item-text text-muted" style={{ textAlign: 'center', padding: '0.5rem' }}>
                                No se encontraron usuarios
                              </div>
                            </div>
                          )}
                        </div>
                        {usuarioSeleccionado && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleLimpiarUsuario}
                            disabled={isLoading}
                            title="Limpiar selección"
                            style={{
                              backgroundColor: '#F34949',
                              color: 'white',
                              borderColor: '#F34949',
                              height: 'calc(1.5em + 1rem + 2px)',
                              width: '38px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <i className="fa fa-times"></i>
                          </button>
                        )}
                        {busquedaUsuario && !usuarioSeleccionado && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setBusquedaUsuario('');
                              setMostrarDropdown(false);
                            }}
                            disabled={isLoading}
                            title="Limpiar búsqueda"
                            style={{
                              backgroundColor: '#6c757d',
                              color: 'white',
                              borderColor: '#6c757d',
                              height: 'calc(1.5em + 1rem + 2px)',
                              width: '38px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <i className="fa fa-times"></i>
                          </button>
                        )}
                        {isLoading && !usuarioSeleccionado && (
                          <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', position: 'absolute', top: '100%', left: 0 }}>
                            <i className="fa fa-spinner fa-spin mr-1"></i>
                            Cargando usuarios...
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label style={{ visibility: 'hidden' }}>&nbsp;</label>
                      <button
                        type="button"
                        className="btn"
                        onClick={handleGenerarReporte}
                        disabled={isGenerandoReporte || isLoading}
                        style={{
                          backgroundColor: '#6c757d',
                          borderColor: '#6c757d',
                          color: 'white',
                          height: 'calc(1.5em + 0.75rem + 2px)',
                          minHeight: 'calc(1.5em + 0.75rem + 2px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          padding: '0.375rem 0.75rem',
                          whiteSpace: 'nowrap',
                          width: 'auto',
                          minWidth: '120px'
                        }}
                      >
                        {isGenerandoReporte ? (
                          <>
                            <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                            Buscando...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-search mr-2"></i>
                            Buscar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </form>

          {/* Sección del Reporte */}
          {mostrarReporte && reporte && (
            <div id="reporte-section" style={{ marginTop: '3rem' }}>
              {/* Botón de exportar PDF - Solo mostrar si hay pedidos */}
              {reporte.comandas && reporte.comandas.length > 0 && (
                <div className="d-flex justify-content-end mb-3">
                  <button
                    type="button"
                    className="btn"
                    onClick={handleExportarPDF}
                    style={{
                      backgroundColor: '#dc3545',
                      borderColor: '#dc3545',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem 1rem'
                    }}
                    title="Exportar reporte a PDF"
                  >
                    <i className="fa fa-file-pdf mr-2"></i>
                    Exportar a PDF
                  </button>
                </div>
              )}

              {/* Tarjeta de Perfil del Comensal */}
              <div className="form-section" style={{ marginBottom: '2rem' }}>
                <div className="page-title-bar" style={{ marginBottom: '1.5rem', borderRadius: '0.5rem 0.5rem 0 0' }}>
                  <h3 style={{ margin: 0, padding: '0.75rem 1.5rem' }}>
                    <i className="fa fa-user mr-2" aria-hidden="true"></i>
                    Datos del Usuario
                  </h3>
                </div>
                <div className="form-section-content" style={{ padding: '1.5rem', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 0.5rem 0.5rem', backgroundColor: 'white' }}>
                  <div className="row align-items-center">
                    {/* Información del usuario - Columnas izquierda y centro */}
                    <div className="col-md-9">
                      {/* Primera fila: Nombre, DNI, Legajo */}
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <div>
                            <strong>Nombre:</strong> {reporte.usuario.nombreCompleto || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div>
                            <strong>DNI:</strong> {reporte.usuario.dni || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div>
                            <strong>Legajo:</strong> {reporte.usuario.legajo || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Segunda fila: Planta, Proyecto, Centro de Costo */}
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <div>
                            <strong>Planta:</strong> {reporte.organizacion.planta || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div>
                            <strong>Proyecto:</strong> {reporte.organizacion.proyecto || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div>
                            <strong>Centro de Costo:</strong> {reporte.organizacion.centroCosto || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Tercera fila: Jerarquía y Perfil nutricional */}
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <div>
                            <strong>Jerarquía:</strong> {limpiarJerarquia(reporte.organizacion.jerarquia) || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div>
                            <strong>Perfil nutricional:</strong> {reporte.organizacion.planNutricional || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Cuarta fila: Platos consumidos, Bonificaciones, Costo total */}
                      <div className="row">
                        <div className="col-md-4">
                          <div>
                            <strong>Platos consumidos:</strong> {reporte.comandas ? reporte.comandas.length : 0}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div>
                            <strong>Bonificados del mes:</strong> {reporte.bonificaciones.total || 0}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div>
                            <strong>Costo total:</strong> {formatearMoneda(reporte.estadisticas.montoTotal || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Foto del comensal - Columna derecha */}
                    <div className="col-md-3 text-center">
                      {(() => {
                        const foto = reporte.usuario.foto;
                        if (foto) {
                          // La foto ya viene con el prefijo data:image/jpeg;base64, desde el backend
                          // Solo necesitamos usarla directamente
                          return (
                            <>
                              <img
                                src={foto}
                                alt="Foto del comensal"
                                style={{
                                  width: '150px',
                                  height: '150px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '3px solid #dee2e6',
                                  marginBottom: '0.5rem',
                                  display: 'block',
                                  margin: '0 auto 0.5rem'
                                }}
                                onError={(e) => {
                                  // Si falla la carga, mostrar el fallback
                                  e.target.style.display = 'none';
                                  const parent = e.target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.sin-foto-fallback');
                                    if (fallback) {
                                      fallback.style.display = 'block';
                                    }
                                  }
                                }}
                                onLoad={(e) => {
                                  // Si carga correctamente, ocultar el fallback
                                  const parent = e.target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.sin-foto-fallback');
                                    if (fallback) {
                                      fallback.style.display = 'none';
                                    }
                                  }
                                }}
                              />
                              <div className="sin-foto-fallback" style={{ display: 'none' }}>
                                <div
                                  style={{
                                    width: '150px',
                                    height: '150px',
                                    borderRadius: '50%',
                                    backgroundColor: '#e9ecef',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 0.5rem',
                                    border: '3px solid #dee2e6'
                                  }}
                                >
                                  <i className="fa fa-user" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                                </div>
                              </div>
                            </>
                          );
                        } else {
                          // No hay foto, mostrar icono por defecto
                          return (
                            <div
                              style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                backgroundColor: '#e9ecef',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 0.5rem',
                                border: '3px solid #dee2e6'
                              }}
                            >
                              <i className="fa fa-user" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 5: Tabla de comandas */}
              <div className="form-section" style={{ marginBottom: '2rem' }}>
                <div className="page-title-bar" style={{ marginBottom: '1.5rem', borderRadius: '0.5rem 0.5rem 0 0' }}>
                  <h3 style={{ margin: 0, padding: '0.75rem 1.5rem' }}>
                    <i className="fa fa-utensils mr-2" aria-hidden="true"></i>
                    Historial de Pedidos ({formatearFecha(formData.fechaDesde)} - {formatearFecha(formData.fechaHasta)})
                  </h3>
                </div>
                <div className="form-section-content" style={{ padding: '1.5rem' }}>
                  {isCargandoHistorial ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Cargando...</span>
                      </div>
                    </div>
                  ) : reporte.comandas && reporte.comandas.length > 0 ? (
                    <>
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Plato</th>
                              <th>Estado</th>
                              <th>Bonificación</th>
                              <th>Costo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reporte.historialPedidos.map((pedido, index) => (
                              <tr key={index}>
                                <td>{formatearFechaHora(pedido.fecha || pedido.Fecha || pedido.fechaPedido)}</td>
                                <td>{pedido.plato || pedido.descripcionPlato || 'N/A'}</td>
                                <td>
                                  <span
                                    className="badge"
                                    style={{
                                      backgroundColor: getEstadoColor(pedido.estado),
                                      color: 'white',
                                      padding: '0.5rem 1rem',
                                      borderRadius: '0.25rem'
                                    }}
                                  >
                                    {traducirEstado(pedido.estado)}
                                  </span>
                                </td>
                                <td>{pedido.bonificado ? 'Sí' : 'No'}</td>
                                <td>{formatearMoneda(pedido.monto || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginación */}
                      {reporte.totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <span className="text-muted">
                              Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, reporte.totalItems)} de {reporte.totalItems} registros
                            </span>
                          </div>
                          <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                            <label className="mr-2" style={{ margin: 0 }}>Filas por página:</label>
                            <select
                              className="form-control form-control-sm"
                              style={{ width: 'auto' }}
                              value={pageSize}
                              onChange={(e) => {
                                const newPageSize = parseInt(e.target.value);
                                setPageSize(newPageSize);
                                setCurrentPage(1);
                                if (reporte && reporte.comandas && reporte.comandas.length > 0) {
                                  // Convertir comandas a formato de historial para la paginación
                                  const historialParaPaginacion = reporte.comandas.map(comanda => ({
                                    fecha: comanda.fecha,
                                    plato: comanda.plato,
                                    descripcionPlato: comanda.plato,
                                    monto: comanda.monto,
                                    estado: comanda.estado,
                                    bonificado: comanda.bonificado === 'Sí',
                                    invitado: comanda.invitado === 'Sí'
                                  }));
                                  
                                  const historialPaginado = paginarHistorial(historialParaPaginacion, 1);
                                  setReporte(prev => ({
                                    ...prev,
                                    historialPedidos: historialPaginado.items,
                                    totalItems: historialPaginado.totalItems,
                                    totalPages: historialPaginado.totalPages,
                                    currentPage: 1
                                  }));
                                }
                              }}
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                              <option value={50}>50</option>
                            </select>
                          </div>
                          <nav>
                            <ul className="pagination mb-0">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(1)}
                                  disabled={currentPage === 1}
                                >
                                  «
                                </button>
                              </li>
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  &lt;
                                </button>
                              </li>
                              {[...Array(Math.min(reporte.totalPages, 5))].map((_, index) => {
                                let page;
                                if (reporte.totalPages <= 5) {
                                  page = index + 1;
                                } else if (currentPage <= 3) {
                                  page = index + 1;
                                } else if (currentPage >= reporte.totalPages - 2) {
                                  page = reporte.totalPages - 4 + index;
                                } else {
                                  page = currentPage - 2 + index;
                                }
                                return (
                                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                    <button
                                      className="page-link"
                                      onClick={() => handlePageChange(page)}
                                    >
                                      {page}
                                    </button>
                                  </li>
                                );
                              })}
                              <li className={`page-item ${currentPage === reporte.totalPages ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(currentPage + 1)}
                                  disabled={currentPage === reporte.totalPages}
                                >
                                  &gt;
                                </button>
                              </li>
                              <li className={`page-item ${currentPage === reporte.totalPages ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(reporte.totalPages)}
                                  disabled={currentPage === reporte.totalPages}
                                >
                                  »
                                </button>
                              </li>
                            </ul>
                          </nav>
                          <div className="ml-3">
                            <span className="text-muted">Página {currentPage} de {reporte.totalPages}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="alert alert-info">
                      No hay pedidos registrados en el rango de fechas seleccionado.
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 6: Lista de platos distintos */}
              {reporte.platosDistintos && reporte.platosDistintos.length > 0 && (
                <div className="form-section">
                  <div className="page-title-bar" style={{ marginBottom: '1.5rem', borderRadius: '0.5rem 0.5rem 0 0' }}>
                    <h3 style={{ margin: 0, padding: '0.75rem 1.5rem' }}>
                      <i className="fa fa-list mr-2" aria-hidden="true"></i>
                      Platos Distintos Consumidos
                    </h3>
                  </div>
                  <div className="form-section-content" style={{ padding: '1.5rem' }}>
                    <ul className="list-unstyled">
                      {reporte.platosDistintos.map((plato, index) => (
                        <li key={index} className="mb-2">
                          <i className="fa fa-check-circle mr-2 text-success" aria-hidden="true"></i>
                          {plato || 'N/A'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporteGComensales;
