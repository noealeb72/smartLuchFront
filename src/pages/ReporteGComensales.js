import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usuariosService } from '../services/usuariosService';
import { reportesService } from '../services/reportesService';
import Swal from 'sweetalert2';
import { mapUsuarios } from '../utils/dataMapper';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addPdfReportHeader } from '../utils/pdfReportHeader';
import { exportAoaToExcel } from '../utils/excelReportHeader';
import { formatearImporte } from '../utils/formatearImporte';
import { getApiBaseUrl } from '../services/configService';
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
  const [pageSize, setPageSize] = useState(5);
  const [isCargandoHistorial] = useState(false);
  const OPCIONES_BASE = [5, 10, 25, 50];
  const totalItemsReporte = reporte?.totalItems ?? 0;
  const opcionesPageSize = useMemo(() => {
    if (totalItemsReporte <= 0) return [5];
    const filtradas = OPCIONES_BASE.filter((n) => n <= totalItemsReporte);
    if (!filtradas.includes(totalItemsReporte) && totalItemsReporte > 5) {
      filtradas.push(totalItemsReporte);
      filtradas.sort((a, b) => a - b);
    }
    return filtradas.length > 0 ? filtradas : [totalItemsReporte];
  }, [totalItemsReporte]);
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
      const data = await usuariosService.getUsuarios(1, 100, '', true);
      
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
        const sinSmartTime = usuariosMapeados.filter((u) => {
          const login = (u.username ?? u.Usuario ?? u.userName ?? '').toString().trim().toLowerCase();
          return login !== 'smarttime';
        });
        setUsuarios(sinSmartTime);
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
      const jerarquia = (usuario.jerarquia_nombre || usuario.jerarquiaNombre || usuario.jerarquia || '').toLowerCase();
      const nombreCompleto = `${nombre} ${apellido}`.trim();
      
      return nombre.includes(termino) ||
             apellido.includes(termino) ||
             legajo.includes(termino) ||
             username.includes(termino) ||
             nombreCompleto.includes(termino) ||
             jerarquia.includes(termino);
    });

    setUsuariosFiltrados(filtrados);
    setMostrarDropdown(filtrados.length > 0);
  }, [busquedaUsuario, usuarios]);

  // Si pageSize no está en las opciones disponibles (ej. totalItems bajó), usar 5 como base
  useEffect(() => {
    if (totalItemsReporte <= 0) return;
    const validas = opcionesPageSize;
    if (!validas.includes(pageSize) || pageSize > totalItemsReporte) {
      setPageSize(validas[0] ?? 5);
    }
  }, [totalItemsReporte, pageSize, opcionesPageSize]);

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

  // Paginar historial localmente (pageSizeOverride: opcional, para cuando se cambia el combo antes del re-render)
  const paginarHistorial = useCallback((historial, page, pageSizeOverride = null) => {
    if (!historial || historial.length === 0) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1
      };
    }
    
    const sizeToUse = pageSizeOverride ?? pageSize;
    const startIndex = (page - 1) * sizeToUse;
    const endIndex = startIndex + sizeToUse;
    const items = historial.slice(startIndex, endIndex);
    const totalPages = Math.ceil(historial.length / sizeToUse);
    
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
      
      const data = await reportesService.getReportePorComensal(
        legajo.toString(), // Asegurar que sea string
        formData.fechaDesde,
        formData.fechaHasta,
        plantaId ? parseInt(plantaId) : null // Convertir a número si existe
      );
      



      // Extraer datos del DTO según la estructura: { usuario, consumidos, resumen }
      // Si los datos del usuario están en el nivel superior (Id, Nombre, Apellido, Dni, Foto), usarlos directamente
      // Si están anidados en usuario/Usuario, usar esos
      let usuarioData = {};
      if (data.usuario || data.Usuario) {
        usuarioData = data.usuario || data.Usuario;
      } else if (data.Id || data.Nombre || data.Apellido || data.Dni || data.Foto) {
        // Los datos del usuario están en el nivel superior del DTO
        usuarioData = {
          id: data.Id || data.id,
          nombre: data.Nombre || data.nombre,
          apellido: data.Apellido || data.apellido,
          dni: data.Dni || data.dni,
          cuil: data.Cuil || data.cuil,
          foto: data.Foto || data.foto,
          legajo: data.Legajo || data.legajo,
          planNutricionalNombre: data.PlanNutricionalNombre || data.planNutricionalNombre,
          plantaNombre: data.PlantaNombre || data.plantaNombre,
          centroCostoNombre: data.CentroCostoNombre || data.centroCostoNombre,
          proyectoNombre: data.ProyectoNombre || data.proyectoNombre,
          jerarquiaNombre: data.JerarquiaNombre || data.jerarquiaNombre
        };
      }
      
      const consumidos = Array.isArray(data.consumidos) ? data.consumidos : 
                        Array.isArray(data.Consumidos) ? data.Consumidos : [];
      const resumen = data.resumen || data.Resumen || {};
      // Debug: si el primer consumido no tiene npedido ni turno, loguear estructura para inspección
      if (consumidos.length > 0 && typeof window !== 'undefined' && window.location?.search?.includes('debug=reporte')) {
        const p = consumidos[0];
        const tieneNpedido = p?.npedido ?? p?.Npedido ?? p?.user_npedido ?? p?.Pedido?.Npedido ?? p?.user_Pedido?.id;
        const tieneTurno = p?.turnoNombre ?? p?.TurnoNombre ?? p?.Turno?.Nombre ?? p?.turno?.nombre;
        if (!tieneNpedido || !tieneTurno) {
          console.log('[ReporteGComensales] consumidos[0] (para inspeccionar npedido/turno):', p);
        }
      }

      // Mapear los consumidos a formato interno
      const historialCompleto = consumidos.map(comanda => ({
        id: comanda.id ?? comanda.Id ?? comanda.ID,
        npedido: comanda.npedido ?? comanda.Npedido ?? comanda.NPedido ?? comanda.user_npedido ?? comanda.User_Npedido ?? comanda.pedidoId ?? comanda.PedidoId ?? comanda.Pedido?.Npedido ?? comanda.Pedido?.npedido ?? comanda.Pedido?.id ?? comanda.Comanda?.Npedido ?? comanda.Comanda?.npedido ?? comanda.user_Pedido?.Npedido ?? comanda.user_Pedido?.npedido ?? comanda.user_Pedido?.id ?? comanda.user_Pedido?.Id ?? comanda.id ?? comanda.Id ?? comanda.ID,
        fecha: comanda.fecha ?? comanda.Fecha,
        monto: parseFloat(comanda.monto ?? comanda.Monto ?? 0),
        bonificado: comanda.bonificado ?? comanda.Bonificado ?? false,
        invitado: comanda.invitado ?? comanda.Invitado ?? false,
        calificacion: comanda.calificacion ?? comanda.Calificacion ?? null,
        estado: comanda.estado ?? comanda.Estado ?? '-',
        comentario: comanda.comentario ?? comanda.Comentario ?? null,
        platoId: comanda.platoId ?? comanda.PlatoId,
        platoDescripcion: comanda.descripcionPlato ?? comanda.DescripcionPlato ?? comanda.platoDescripcion ?? comanda.PlatoDescripcion ?? '-',
        turnoId: comanda.turnoId ?? comanda.TurnoId,
        turnoNombre: comanda.turnoNombre ?? comanda.TurnoNombre ?? comanda.turno_nombre ?? comanda.Turno_Nombre ?? comanda.Turno?.Nombre ?? comanda.Turno?.nombre ?? comanda.turno?.Nombre ?? comanda.turno?.nombre ?? comanda.Comanda?.Turno?.Nombre ?? comanda.Comanda?.turno?.Nombre ?? comanda.Pedido?.Turno?.Nombre ?? comanda.user_Pedido?.Turno?.Nombre ?? '-',
        planNutricional: comanda.planNutricional ?? comanda.PlanNutricional ?? '-',
        plantaId: comanda.plantaId ?? comanda.PlantaId,
        plantaNombre: comanda.plantaNombre ?? comanda.PlantaNombre ?? '-',
        centroCostoId: comanda.centroCostoId ?? comanda.CentroCostoId,
        centroCostoNombre: comanda.centroCostoNombre ?? comanda.CentroCostoNombre ?? '-',
        proyectoId: comanda.proyectoId ?? comanda.ProyectoId,
        proyectoNombre: comanda.proyectoNombre ?? comanda.ProyectoNombre ?? '-',
        jerarquiaId: comanda.jerarquiaId ?? comanda.JerarquiaId,
        jerarquiaNombre: comanda.jerarquiaNombre ?? comanda.JerarquiaNombre ?? '-',
        platoImporte: parseFloat(comanda.platoImporte ?? comanda.PlatoImporte ?? 0),
        foto: comanda.foto ?? comanda.Foto ?? null,
        descripcionPlato: comanda.descripcionPlato ?? comanda.DescripcionPlato ?? comanda.platoDescripcion ?? comanda.PlatoDescripcion ?? '-',
        plato: comanda.descripcionPlato ?? comanda.DescripcionPlato ?? comanda.platoDescripcion ?? comanda.PlatoDescripcion ?? '-'
      }));
      
      // Paginar el historial
      const historialPaginado = paginarHistorial(historialCompleto, 1);

      // Calcular métricas del resumen antes de crear el objeto reporteData
      // Contar cantidad de devueltos: solo platos con estado 'D', excluir cancelados ('C')
      const cantidadDevueltos = consumidos.filter(comanda => {
        const estado = (comanda.estado ?? comanda.Estado ?? '').toString().toUpperCase().trim();
        const esCancelado = estado === 'C' || comanda.Cancelado === true || comanda.cancelado === true;
        return estado === 'D' && !esCancelado;
      }).length;
      
      // Calcular costo total: sumar solo los platos con estado 'R' (Recibido)
      const costoTotal = consumidos
        .filter(comanda => {
          const estado = (comanda.estado ?? comanda.Estado ?? '').toString().toUpperCase();
          return estado === 'R';
        })
        .reduce((total, comanda) => {
          const monto = parseFloat(comanda.monto ?? comanda.Monto ?? comanda.platoImporte ?? comanda.PlatoImporte ?? 0);
          return total + monto;
        }, 0);

      // Normalizar los datos del reporte según la estructura del DTO
      const reporteData = {
        // Sección 1: Header con datos del usuario (desde data.usuario)
        usuario: {
          foto: usuarioData.foto ?? usuarioData.Foto ?? null,
          nombreCompleto: `${usuarioData.nombre ?? usuarioData.Nombre ?? ''} ${usuarioData.apellido ?? usuarioData.Apellido ?? ''}`.trim() || 
                         `${usuarioSeleccionado?.nombre || ''} ${usuarioSeleccionado?.apellido || ''}`.trim(),
          legajo: usuarioData.legajo ?? usuarioData.Legajo ?? legajo ?? usuarioSeleccionado?.legajo ?? '',
          dni: usuarioData.dni ?? usuarioData.Dni ?? usuarioData.DNI ?? usuarioSeleccionado?.dni ?? '',
          cuil: usuarioData.cuil ?? usuarioData.Cuil ?? usuarioData.CUIL ?? usuarioSeleccionado?.cuil ?? null,
          id: usuarioData.id ?? usuarioData.Id ?? usuarioData.ID
        },
        
        // Sección 2: Información organizacional (desde data.usuario)
        organizacion: {
          planta: usuarioData.plantaNombre ?? usuarioData.PlantaNombre ?? usuarioData.planta ?? usuarioData.Planta ?? usuarioSeleccionado?.planta_nombre ?? usuarioSeleccionado?.plantaNombre ?? '-',
          centroCosto: usuarioData.centroCostoNombre ?? usuarioData.CentroCostoNombre ?? usuarioData.centroCosto ?? usuarioData.CentroCosto ?? usuarioSeleccionado?.centrodecosto_nombre ?? usuarioSeleccionado?.centroDeCostoNombre ?? '-',
          proyecto: usuarioData.proyectoNombre ?? usuarioData.ProyectoNombre ?? usuarioData.proyecto ?? usuarioData.Proyecto ?? usuarioSeleccionado?.proyecto_nombre ?? usuarioSeleccionado?.proyectoNombre ?? '-',
          jerarquia: usuarioData.jerarquiaNombre ?? usuarioData.JerarquiaNombre ?? usuarioData.jerarquia ?? usuarioData.Jerarquia ?? usuarioSeleccionado?.jerarquia_nombre ?? usuarioSeleccionado?.jerarquiaNombre ?? '-',
          planNutricional: usuarioData.planNutricionalNombre ?? usuarioData.PlanNutricionalNombre ?? usuarioData.planNutricional ?? usuarioData.PlanNutricional ?? '-'
        },
        
        // Sección 3: Resumen (desde data.resumen)
        resumen: {
          cantidadPlatos: resumen.cantidadPlatos ?? resumen.CantidadPlatos ?? resumen.cantidad_platos ?? resumen.Cantidad_Platos ?? (consumidos.length > 0 ? consumidos.length : 0),
          promedioCalificacion: resumen.promedioCalificacion ?? resumen.PromedioCalificacion ?? resumen.promedio_calificacion ?? resumen.Promedio_Calificacion ?? 0,
          cantidadDevueltos: cantidadDevueltos,
          costoTotal: costoTotal
        },
        
        // Sección 4: Tabla de comandas (desde data.consumidos)
        comandas: historialCompleto.map(comanda => ({
          fecha: comanda.fecha,
          plato: comanda.descripcionPlato || comanda.platoDescripcion || comanda.plato || '-',
          monto: comanda.monto || 0,
          estado: comanda.estado || '-',
          bonificado: comanda.bonificado ? 'Sí' : 'No',
          invitado: comanda.invitado ? 'Sí' : 'No',
          calificacion: comanda.calificacion || null,
          comentario: comanda.comentario || null,
          npedido: comanda.npedido,
          turnoNombre: comanda.turnoNombre || '-',
          plantaNombre: comanda.plantaNombre || '-',
          centroCostoNombre: comanda.centroCostoNombre || '-',
          proyectoNombre: comanda.proyectoNombre || '-',
          jerarquiaNombre: comanda.jerarquiaNombre || '-',
          planNutricional: comanda.planNutricional || '-',
          platoImporte: comanda.platoImporte || 0
        })),
        
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
      npedido: comanda.npedido,
      plato: comanda.plato,
      descripcionPlato: comanda.plato,
      platoDescripcion: comanda.plato,
      monto: comanda.monto,
      estado: comanda.estado,
      bonificado: comanda.bonificado === 'Sí',
      invitado: comanda.invitado === 'Sí',
      turnoNombre: comanda.turnoNombre,
      plantaNombre: comanda.plantaNombre,
      centroCostoNombre: comanda.centroCostoNombre,
      proyectoNombre: comanda.proyectoNombre,
      jerarquiaNombre: comanda.jerarquiaNombre,
      planNutricional: comanda.planNutricional
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

  // Formatear fecha dd/mm/yy
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Formatear fecha con hora dd/mm/yy HH:mm:ss
  const formatearFechaHora = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatearMoneda = (valor) => formatearImporte(valor);

  // Traducir estado (reservado para uso futuro)
  // eslint-disable-next-line no-unused-vars
  const traducirEstado = (estado) => {
    if (!estado) return '-';
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
    if (!texto || texto === '-') return texto;
    const textoLimpio = texto.trim();
    // Verificar si comienza con "jerarquia" (case insensitive)
    const regex = /^jerarquia\s+/i;
    if (regex.test(textoLimpio)) {
      return textoLimpio.replace(regex, '').trim();
    }
    return textoLimpio;
  };

  // Obtener estado del pedido con badge de color (igual que en Despacho)
  const obtenerEstadoBadge = (estado) => {
    const estadoStr = (estado || '').toString().toUpperCase();
    const estados = {
      'P': { texto: 'Pendiente', color: '#ffffff', bgColor: '#ff9800' }, // Naranja con texto blanco
      'D': { texto: 'Devuelto', color: '#6c757d', bgColor: '#f5f5f5' }, // Gris
      'C': { texto: 'Cancelado', color: '#dc3545', bgColor: '#f8d7da' }, // Rojo
      'R': { texto: 'Recibido', color: '#28a745', bgColor: '#d4edda' }, // Verde
      'E': { texto: 'En Aceptación', color: '#007bff', bgColor: '#cce5ff' }, // Azul
    };
    
    const estadoInfo = estados[estadoStr] || { texto: estado || '-', color: '#6c757d', bgColor: '#f5f5f5' };
    
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

  // Función auxiliar para obtener el texto del estado (para PDF)
  const obtenerTextoEstado = (estado) => {
    const estadoStr = (estado || '').toString().toUpperCase();
    const estados = {
      'P': 'Pendiente',
      'D': 'Devuelto',
      'C': 'Cancelado',
      'R': 'Recibido',
      'E': 'En Aceptación',
    };
    return estados[estadoStr] || estado || '-';
  };

  // Exportar reporte a PDF
  const handleExportarPDF = async () => {
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
      const doc = new JSPDF('l', 'mm', 'a4'); // Orientación horizontal
      
      let yPos = await addPdfReportHeader(doc, 'Reporte por Comensal', 14, true);
      
      // Período del reporte
      const periodo = `${formatearFecha(formData.fechaDesde)} - ${formatearFecha(formData.fechaHasta)}`;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Período: ${periodo}`, 14, yPos);
      yPos += 8;
      
      // Información del Comensal
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Información del Comensal', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Fila 1: Nombre, Legajo, DNI en 3 columnas
      const col1 = 14;
      const col2 = 75;
      const col3 = 136;
      doc.text(`Nombre: ${reporte.usuario.nombreCompleto || '-'}`, col1, yPos);
      doc.text(`Legajo: ${reporte.usuario.legajo || '-'}`, col2, yPos);
      doc.text(`DNI: ${reporte.usuario.dni || '-'}`, col3, yPos);
      yPos += 6;
      if (reporte.usuario.cuil && String(reporte.usuario.cuil).trim()) {
        doc.text(`CUIL: ${reporte.usuario.cuil}`, col1, yPos);
        yPos += 6;
      }
      yPos += 4;
      
      // Fila 2: Planta, Centro de Costo, Proyecto en 3 columnas
      doc.text(`Planta: ${reporte.organizacion.planta}`, col1, yPos);
      doc.text(`Centro de Costo: ${reporte.organizacion.centroCosto}`, col2, yPos);
      doc.text(`Proyecto: ${reporte.organizacion.proyecto}`, col3, yPos);
      yPos += 6;
      
      // Fila 3: Jerarquía y Plan Nutricional
      doc.text(`Jerarquía: ${limpiarJerarquia(reporte.organizacion.jerarquia)}`, col1, yPos);
      doc.text(`Plan Nutricional: ${reporte.organizacion.planNutricional}`, col2, yPos);
      yPos += 10;
      
      // Resumen del Reporte: Cantidad platos, Cantidad devueltos, Costo total en 3 columnas
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen del Reporte', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Cantidad platos: ${reporte.resumen?.cantidadPlatos || reporte.comandas?.length || 0}`, col1, yPos);
      doc.text(`Cantidad devueltos: ${reporte.resumen?.cantidadDevueltos || 0}`, col2, yPos);
      doc.text(`Costo total: ${formatearMoneda(reporte.resumen?.costoTotal || 0)}`, col3, yPos);
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
            comanda.npedido || '-',
            comanda.descripcionPlato || comanda.plato || comanda.platoDescripcion || '-',
            comanda.turnoNombre || '-',
            obtenerTextoEstado(comanda.estado),
            comanda.bonificado === 'Sí' || comanda.bonificado === true ? 'Sí' : 'No',
            formatearMoneda(comanda.monto || comanda.platoImporte || 0)
          ];
        });
        
        doc.autoTable({
          startY: yPos,
          head: [['Fecha', 'Nº Pedido', 'Plato', 'Turno', 'Estado', 'Bonificación', 'Importe']],
          body: tableData,
          styles: { fontSize: 7 },
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
            doc.text(`• ${plato || '-'}`, 14, yPos);
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

      Swal.fire({
        title: 'Error',
        text: 'Error al exportar el reporte a PDF',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  };

  // Exportar reporte a Excel (usa exportAoaToExcel de excelReportHeader donde XLSX funciona)
  const handleExportarExcel = () => {
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
      const periodo = `${formatearFecha(formData.fechaDesde)} - ${formatearFecha(formData.fechaHasta)}`;

      const aoa = [
        [],
        [`Período: ${periodo}`],
        [],
        ['Información del Comensal'],
        ['Nombre', reporte.usuario.nombreCompleto || '-', 'Legajo', reporte.usuario.legajo || '-', 'DNI', reporte.usuario.dni || '-'],
        ['Planta', reporte.organizacion.planta, 'Centro de Costo', reporte.organizacion.centroCosto, 'Proyecto', reporte.organizacion.proyecto],
        ['Jerarquía', limpiarJerarquia(reporte.organizacion.jerarquia), 'Plan Nutricional', reporte.organizacion.planNutricional],
        [],
        ['Resumen del Reporte'],
        ['Cantidad platos', reporte.resumen?.cantidadPlatos || reporte.comandas?.length || 0, 'Cantidad devueltos', reporte.resumen?.cantidadDevueltos || 0, 'Costo total', formatearMoneda(reporte.resumen?.costoTotal || 0)],
        [],
        ['Fecha', 'Nº Pedido', 'Plato', 'Turno', 'Estado', 'Bonificación', 'Importe'],
        ...reporte.comandas.map((comanda) => [
          formatearFechaHora(comanda.fecha),
          comanda.npedido || '-',
          comanda.descripcionPlato || comanda.plato || comanda.platoDescripcion || '-',
          comanda.turnoNombre || '-',
          obtenerTextoEstado(comanda.estado),
          comanda.bonificado === 'Sí' || comanda.bonificado === true ? 'Sí' : 'No',
          formatearMoneda(comanda.monto || comanda.platoImporte || 0),
        ]),
      ];

      if (reporte.platosDistintos && reporte.platosDistintos.length > 0) {
        aoa.push([]);
        aoa.push(['Platos Distintos Consumidos']);
        reporte.platosDistintos.forEach((plato) => {
          aoa.push([plato || '-']);
        });
      }

      const nombreUsuario = (reporte.usuario.nombreCompleto || 'comensal').replace(/\s+/g, '_');
      const fechaArchivo = new Date().toISOString().split('T')[0];
      exportAoaToExcel(aoa, 'Reporte por Comensal', `reporte_${nombreUsuario}_${fechaArchivo}.xlsx`);

      Swal.fire({
        title: 'Exportado',
        text: 'El reporte se ha exportado correctamente en formato Excel',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al exportar el reporte a Excel',
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
                      {/* Primera fila: Nombre, DNI, Legajo, CUIL */}
                      <div className="row mb-3">
                        <div className="col-md-3">
                          <div>
                            <strong>Nombre:</strong> {reporte.usuario.nombreCompleto || '-'}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div>
                            <strong>DNI:</strong> {reporte.usuario.dni || '-'}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div>
                            <strong>Legajo:</strong> {reporte.usuario.legajo || '-'}
                          </div>
                        </div>
                        {reporte.usuario.cuil && String(reporte.usuario.cuil).trim() && (
                          <div className="col-md-3">
                            <div>
                              <strong>CUIL:</strong> {reporte.usuario.cuil}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Segunda fila: Planta, Proyecto (misma columna que DNI), Perfil nutricional, Jerarquía */}
                      <div className="row mb-3">
                        <div className="col-md-3">
                          <div>
                            <strong>Planta:</strong> {reporte.organizacion.planta || '-'}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div>
                            <strong>Proyecto:</strong> {reporte.organizacion.proyecto || '-'}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div>
                            <strong>Perfil nutricional:</strong> {reporte.organizacion.planNutricional || '-'}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div>
                            <strong>Jerarquía:</strong> {limpiarJerarquia(reporte.organizacion.jerarquia) || '-'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Cuarta fila: Resumen del reporte */}
                      <div className="row">
                        <div className="col-md-3">
                          <div>
                            <strong>Cantidad de platos:</strong> {reporte.resumen?.cantidadPlatos || reporte.comandas?.length || 0}
                          </div>
                        </div>
                        {reporte.resumen?.promedioCalificacion !== null && 
                         reporte.resumen?.promedioCalificacion !== undefined && 
                         reporte.resumen?.promedioCalificacion > 0 && (
                          <div className="col-md-3">
                            <div>
                              <strong>Promedio calificación:</strong> {reporte.resumen.promedioCalificacion.toFixed(2)}
                            </div>
                          </div>
                        )}
                        <div className="col-md-3">
                          <div>
                            <strong>Cantidad devueltos:</strong> {reporte.resumen?.cantidadDevueltos || 0}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div>
                            <strong>Costo total:</strong> {formatearMoneda(reporte.resumen?.costoTotal || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Foto del comensal - Columna derecha */}
                    <div className="col-md-3 text-center">
                      {(() => {
                        // Priorizar Foto que viene directamente de la base de datos en formato base64
                        // La foto viene como: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                        const foto = reporte.usuario.foto || reporte.usuario.Foto;
                        let fotoUrl = null;
                        
                        if (foto && foto.trim() !== '') {
                          const fotoTrimmed = foto.trim();
                          
                          // Si ya tiene el prefijo data:, usarlo directamente (caso más común desde la BD)
                          if (fotoTrimmed.startsWith('data:')) {
                            fotoUrl = fotoTrimmed;

                          }
                          // Si es una URL completa (http/https), usarla tal cual
                          else if (fotoTrimmed.startsWith('http://') || fotoTrimmed.startsWith('https://')) {
                            fotoUrl = fotoTrimmed;
                          }
                          // Si es base64 puro (viene directamente de la base de datos), agregar el prefijo
                          else if (typeof fotoTrimmed === 'string') {
                            // Limpiar posibles espacios y saltos de línea
                            const fotoLimpia = fotoTrimmed.replace(/\s/g, '');
                            
                            // Verificar si es base64 puro (caracteres válidos de base64: A-Z, a-z, 0-9, +, /, =)
                            // Base64 típicamente tiene al menos 100 caracteres para una imagen pequeña
                            if (/^[A-Za-z0-9+/=]+$/.test(fotoLimpia) && fotoLimpia.length > 50) {
                              // Agregar el prefijo data:image/jpeg;base64, para que el navegador pueda renderizarlo
                              fotoUrl = `data:image/jpeg;base64,${fotoLimpia}`;
                            }
                            // Si es una ruta de uploads/, construir la URL completa
                            else if (fotoTrimmed.startsWith('/uploads/') || fotoTrimmed.includes('uploads/')) {
                              const baseUrl = getApiBaseUrl();
                              
                              let rutaRelativa = fotoTrimmed;
                              if (fotoTrimmed.includes('uploads/') && !fotoTrimmed.startsWith('/uploads/')) {
                                const indiceUploads = fotoTrimmed.indexOf('uploads/');
                                rutaRelativa = `/${fotoTrimmed.substring(indiceUploads)}`;
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
                              const rutaNormalizada = fotoTrimmed.startsWith('/') ? fotoTrimmed : `/${fotoTrimmed}`;
                              fotoUrl = `${baseUrl}${rutaNormalizada}`;
                            }
                          }
                        }
                        
                        // Solo mostrar la imagen si hay una URL válida
                        if (fotoUrl) {
                          return (
                            <img
                              src={fotoUrl}
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
                                // Si falla la carga, ocultar la imagen y mostrar el fallback
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
                          );
                        }
                        
                        // Si no hay foto, mostrar icono por defecto
                        return (
                          <div
                            className="sin-foto-fallback"
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
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 5: Tabla de comandas */}
              <div className="form-section" style={{ marginBottom: '2rem' }}>
                <div className="page-title-bar" style={{ marginBottom: '1.5rem', borderRadius: '0.5rem 0.5rem 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, padding: '0.75rem 1.5rem', flex: 1 }}>
                    <i className="fa fa-utensils mr-2" aria-hidden="true"></i>
                    Historial de Pedidos ({formatearFecha(formData.fechaDesde)} - {formatearFecha(formData.fechaHasta)})
                  </h3>
                  {reporte.comandas && reporte.comandas.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={handleExportarPDF}
                        style={{
                          backgroundColor: '#dc3545',
                          border: 'none',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.25rem'
                        }}
                        title="Exportar reporte a PDF"
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#c82333';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#dc3545';
                        }}
                      >
                        <i className="fa fa-file-pdf"></i>
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={handleExportarExcel}
                        style={{
                          backgroundColor: '#28a745',
                          border: 'none',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.25rem'
                        }}
                        title="Exportar reporte a Excel"
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#218838';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#28a745';
                        }}
                      >
                        <i className="fa fa-file-excel"></i>
                      </button>
                    </div>
                  )}
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
                              <th>Nº Pedido</th>
                              <th>Plato</th>
                              <th>Turno</th>
                              <th>Estado</th>
                              <th>Bonificación</th>
                              <th>Importe</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reporte.historialPedidos.map((pedido, index) => (
                              <tr key={index}>
                                <td>{formatearFechaHora(pedido.fecha || pedido.Fecha || pedido.fechaPedido)}</td>
                                <td>{(pedido.npedido ?? pedido.Npedido ?? pedido.user_npedido ?? pedido.id ?? pedido.Id ?? '-').toString()}</td>
                                <td>{pedido.descripcionPlato || pedido.plato || pedido.platoDescripcion || '-'}</td>
                                <td>{pedido.turnoNombre || pedido.TurnoNombre || pedido.turno_nombre || '-'}</td>
                                <td>
                                  {obtenerEstadoBadge(pedido.estado)}
                                </td>
                                <td>{pedido.bonificado === 'Sí' || pedido.bonificado === true ? 'Sí' : 'No'}</td>
                                <td>{formatearMoneda(pedido.monto || pedido.platoImporte || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginación - estilo Usuarios */}
                      {reporte.totalItems > 0 && (
                        <div className="d-flex justify-content-between align-items-center mt-3 mb-4 flex-nowrap" style={{ gap: '1.5rem' }}>
                          <div className="d-flex align-items-center flex-nowrap" style={{ gap: '1.25rem' }}>
                            <label className="d-flex align-items-center gap-2 mb-0" style={{ whiteSpace: 'nowrap' }}>
                              <span className="text-muted small">Registros a mostrar:</span>
                              <select
                                className="form-control form-control-sm"
                                value={pageSize}
                                onChange={(e) => {
                                  const newPageSize = Number(e.target.value);
                                  setPageSize(newPageSize);
                                  setCurrentPage(1);
                                  if (reporte && reporte.comandas && reporte.comandas.length > 0) {
                                    const historialParaPaginacion = reporte.comandas.map(comanda => ({
                                      fecha: comanda.fecha,
                                      npedido: comanda.npedido,
                                      plato: comanda.plato,
                                      descripcionPlato: comanda.plato,
                                      platoDescripcion: comanda.plato,
                                      monto: comanda.monto,
                                      estado: comanda.estado,
                                      bonificado: comanda.bonificado === 'Sí',
                                      invitado: comanda.invitado === 'Sí',
                                      turnoNombre: comanda.turnoNombre,
                                      plantaNombre: comanda.plantaNombre,
                                      centroCostoNombre: comanda.centroCostoNombre,
                                      proyectoNombre: comanda.proyectoNombre,
                                      jerarquiaNombre: comanda.jerarquiaNombre,
                                      planNutricional: comanda.planNutricional
                                    }));
                                    const historialPaginado = paginarHistorial(historialParaPaginacion, 1, newPageSize);
                                    setReporte(prev => ({
                                      ...prev,
                                      historialPedidos: historialPaginado.items,
                                      totalItems: historialPaginado.totalItems,
                                      totalPages: historialPaginado.totalPages,
                                      currentPage: 1
                                    }));
                                  }
                                }}
                                style={{ width: 'auto', minWidth: '70px' }}
                              >
                                {opcionesPageSize.map((n) => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            </label>
                            <span className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                              Mostrando página {currentPage} de {reporte.totalPages} ({reporte.totalItems} registros)
                            </span>
                          </div>
                          <nav>
                            <ul className="pagination mb-0">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  Anterior
                                </button>
                              </li>
                              {[...Array(reporte.totalPages)].map((_, index) => {
                                const page = index + 1;
                                if (
                                  page === 1 ||
                                  page === reporte.totalPages ||
                                  (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
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
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                  return (
                                    <li key={page} className="page-item disabled">
                                      <span className="page-link">...</span>
                                    </li>
                                  );
                                }
                                return null;
                              })}
                              <li className={`page-item ${currentPage === reporte.totalPages ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(currentPage + 1)}
                                  disabled={currentPage === reporte.totalPages}
                                >
                                  Siguiente
                                </button>
                              </li>
                            </ul>
                          </nav>
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
                          {plato || '-'}
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
