import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { catalogosService } from '../services/catalogosService';
import { platosService } from '../services/platosService';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Usuarios.css';

const ReporteGGestion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isBuscando, setIsBuscando] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);
  
  // Estados para los catálogos
  const [plantas, setPlantas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState([]);
  const [jerarquias, setJerarquias] = useState([]);
  
  // Estados para búsqueda de plato
  const [busquedaPlato, setBusquedaPlato] = useState('');
  const [platosFiltrados, setPlatosFiltrados] = useState([]);
  const [mostrarDropdownPlato, setMostrarDropdownPlato] = useState(false);
  const [platoSeleccionado, setPlatoSeleccionado] = useState(null);
  const [isBuscandoPlatos, setIsBuscandoPlatos] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    fechaDesde: '',
    fechaHasta: '',
    platoId: '',
    centroDeCostoId: '',
    proyectoId: '',
    plantaId: '',
    jerarquiaId: '',
  });

  // Cargar catálogos desde el backend
  const cargarCatalogos = useCallback(async () => {
    try {
      setIsLoading(true);
      const [plantasData, proyectosData, centrosData, jerarquiasData] = await Promise.all([
        catalogosService.getPlantas(),
        catalogosService.getProyectos(),
        catalogosService.getCentrosDeCosto(),
        catalogosService.getJerarquias(),
      ]);

      // El backend devuelve: { id, nombre, descripcion }
      // Normalizar y asegurar que sean arrays
      console.log('📦 [ReporteGGestion] Datos recibidos de catálogos:', {
        plantas: plantasData,
        proyectos: proyectosData,
        centros: centrosData,
        jerarquias: jerarquiasData,
      });

      setPlantas(Array.isArray(plantasData) ? plantasData : []);
      setProyectos(Array.isArray(proyectosData) ? proyectosData : []);
      setCentrosDeCosto(Array.isArray(centrosData) ? centrosData : []);
      setJerarquias(Array.isArray(jerarquiasData) ? jerarquiasData : []);

      console.log('✅ [ReporteGGestion] Catálogos normalizados:', {
        plantas: plantas.length,
        proyectos: proyectos.length,
        centros: centrosDeCosto.length,
        jerarquias: jerarquias.length,
      });
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los catálogos. Por favor, intente de nuevo más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar catálogos al montar
  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Establecer fecha por defecto (hoy)
  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      fechaDesde: prev.fechaDesde || hoy,
      fechaHasta: prev.fechaHasta || hoy,
    }));
  }, []);

  // Buscar platos en la API cuando el usuario escribe
  useEffect(() => {
    // Debounce: esperar 300ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(async () => {
      const textoBusqueda = busquedaPlato.trim();
      
      // Si no hay texto, limpiar resultados
      if (!textoBusqueda) {
        setPlatosFiltrados([]);
        setMostrarDropdownPlato(false);
        setIsBuscandoPlatos(false);
        return;
      }

      // Validar que el texto tenga al menos 4 caracteres
      if (textoBusqueda.length < 4) {
        setPlatosFiltrados([]);
        setMostrarDropdownPlato(false);
        setIsBuscandoPlatos(false);
        return;
      }

      try {
        setIsBuscandoPlatos(true);
        const resultado = await platosService.buscarPlatosSimple(
          textoBusqueda,
          true, // soloActivos
          20   // maxResultados
        );

        // La respuesta es un array de objetos con codigo y nombre
        let platosArray = [];
        if (Array.isArray(resultado)) {
          platosArray = resultado;
        } else if (resultado?.data && Array.isArray(resultado.data)) {
          platosArray = resultado.data;
        } else if (resultado?.items && Array.isArray(resultado.items)) {
          platosArray = resultado.items;
        }

        setPlatosFiltrados(platosArray);
        setMostrarDropdownPlato(platosArray.length > 0);
      } catch (error) {
        console.error('Error al buscar platos:', error);
        setPlatosFiltrados([]);
        setMostrarDropdownPlato(false);
      } finally {
        setIsBuscandoPlatos(false);
      }
    }, 300); // Esperar 300ms antes de hacer la búsqueda

    return () => clearTimeout(timeoutId);
  }, [busquedaPlato]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.plato-buscador-container')) {
        setMostrarDropdownPlato(false);
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

  // Manejar búsqueda de plato
  const handleBusquedaPlato = (e) => {
    const valor = e.target.value;
    setBusquedaPlato(valor);
    if (valor.trim() && !mostrarDropdownPlato) {
      setMostrarDropdownPlato(true);
    }
  };

  // Seleccionar plato
  const handleSeleccionarPlato = (plato) => {
    const platoId = plato.id || plato.Id || plato.ID;
    setFormData(prev => ({
      ...prev,
      platoId: platoId,
    }));
    setPlatoSeleccionado(plato);
    setBusquedaPlato('');
    setMostrarDropdownPlato(false);
  };

  // Limpiar selección de plato
  const handleLimpiarPlato = () => {
    setFormData(prev => ({
      ...prev,
      platoId: '',
    }));
    setPlatoSeleccionado(null);
    setBusquedaPlato('');
    setMostrarDropdownPlato(false);
  };

  // Validar formulario
  const validarFormulario = () => {
    const errores = [];

    if (!formData.fechaDesde.trim()) {
      errores.push('La fecha desde es requerida');
    }

    if (!formData.fechaHasta.trim()) {
      errores.push('La fecha hasta es requerida');
    }

    if (formData.fechaDesde && formData.fechaHasta) {
      const fechaDesde = new Date(formData.fechaDesde);
      const fechaHasta = new Date(formData.fechaHasta);
      
      if (fechaDesde > fechaHasta) {
        errores.push('La fecha desde no puede ser mayor que la fecha hasta');
      }
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
      });
      return false;
    }

    return true;
  };

  // Estado para almacenar los resultados del reporte
  const [reporteData, setReporteData] = useState(null);

  // Exportar reporte a PDF
  const handleExportarPDF = useCallback(() => {
    if (!reporteData) {
      Swal.fire({
        title: 'Error',
        text: 'No hay datos para exportar',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    try {
      // Extraer detalles del reporte
      const detalles = Array.isArray(reporteData) 
        ? reporteData 
        : (reporteData.detalles || reporteData.detalle || reporteData.items || reporteData.data || []);

      if (detalles.length === 0) {
        Swal.fire({
          title: 'Error',
          text: 'No hay datos para exportar',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      const JSPDF = jsPDF.default || jsPDF;
      const doc = new JSPDF();
      
      // Título del reporte
      doc.setFontSize(16);
      doc.text('Reporte de Gestión', 14, 15);
      
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
      const periodo = `${formData.fechaDesde || '-'} - ${formData.fechaHasta || '-'}`;
      doc.text(`Período: ${periodo}`, 14, 28);
      
      let yPos = 38;
      
      // Función auxiliar para obtener el texto del estado
      const obtenerTextoEstado = (estado) => {
        const estadoStr = (estado || '').toString().toUpperCase();
        const estados = {
          'P': 'Pendiente',
          'D': 'Devuelto',
          'C': 'Cancelado',
          'R': 'Recibido',
          'E': 'En Aceptación',
        };
        return estados[estadoStr] || estado || 'N/A';
      };

      // Formatear fecha
      const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        try {
          const date = new Date(fecha);
          if (isNaN(date.getTime())) return fecha;
          const dia = String(date.getDate()).padStart(2, '0');
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const año = date.getFullYear();
          const horas = String(date.getHours()).padStart(2, '0');
          const minutos = String(date.getMinutes()).padStart(2, '0');
          const segundos = String(date.getSeconds()).padStart(2, '0');
          return `${dia}/${mes}/${año} - ${horas}:${minutos}:${segundos}`;
        } catch (e) {
          return fecha;
        }
      };

      // Formatear importe
      const formatearImporte = (importe) => {
        const num = parseFloat(importe || 0);
        if (isNaN(num)) return '$0.00';
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(num);
      };

      // Preparar datos de la tabla
      const tableData = detalles.map((item) => {
        const fecha = item.fecha || item.Fecha || item.fechaCreacion || item.FechaCreacion;
        const planta = item.plantaNombre || item.PlantaNombre || item.planta || item.Planta || '-';
        const centroCosto = item.centroCostoNombre || item.CentroCostoNombre || item.centroCosto || item.CentroCosto || item.CC || '-';
        const proyecto = item.proyectoNombre || item.ProyectoNombre || item.proyecto || item.Proyecto || '-';
        const jerarquia = item.jerarquiaNombre || item.JerarquiaNombre || item.jerarquia || item.Jerarquia || item.perfil || item.Perfil || '-';
        const legajo = item.legajo || item.Legajo || item.userLegajo || item.UserLegajo || '-';
        const nombreCompleto = item.nombreCompleto || item.NombreCompleto || 
          `${item.nombre || item.Nombre || ''} ${item.apellido || item.Apellido || ''}`.trim() || '-';
        const plato = item.platoDescripcion || item.PlatoDescripcion || item.plato || item.Plato || item.descripcion || item.Descripcion || '-';
        const estado = item.estado || item.Estado || '-';
        const bonificado = item.bonificado || item.Bonificado || false;
        const costo = item.costo || item.Costo || item.monto || item.Monto || item.importe || item.Importe || 0;

        return [
          formatearFecha(fecha),
          planta,
          centroCosto,
          proyecto,
          jerarquia,
          bonificado ? 'Sí' : 'No',
          legajo,
          nombreCompleto,
          plato,
          obtenerTextoEstado(estado),
          formatearImporte(costo)
        ];
      });
      
      doc.autoTable({
        startY: yPos,
        head: [['Fecha', 'Planta', 'CC', 'Proyecto', 'Perfil', 'Bonificación', 'Legajo', 'Nombre completo', 'Plato', 'Estado', 'Costo']],
        body: tableData,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: yPos }
      });
      
      // Nombre del archivo
      const fechaArchivo = new Date().toISOString().split('T')[0];
      const fileName = `reporte_gestion_${fechaArchivo}.pdf`;
      
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
  }, [reporteData, formData]);

  // Buscar reporte
  const handleBuscar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setIsBuscando(true);
      
      // Preparar parámetros para la API
      const params = {
        fechaDesde: formData.fechaDesde || null,
        fechaHasta: formData.fechaHasta || null,
        platoId: formData.platoId || null,
        proyectoId: formData.proyectoId || null,
        plantaId: formData.plantaId || null,
        jerarquiaId: formData.jerarquiaId || null,
        centrodecostoId: formData.centroDeCostoId || null, // Mapear centroDeCostoId a centrodecostoId
      };

      console.log('📤 [ReporteGGestion] Llamando a getReporteGeneral con parámetros:', params);

      const resultado = await apiService.getReporteGeneral(
        params.fechaDesde,
        params.fechaHasta,
        params.platoId,
        params.proyectoId,
        params.plantaId,
        params.jerarquiaId,
        params.centrodecostoId
      );

      console.log('✅ [ReporteGGestion] Reporte recibido:', resultado);
      console.log('✅ [ReporteGGestion] Estructura completa del reporte:', JSON.stringify(resultado, null, 2));
      setReporteData(resultado);
    } catch (error) {
      console.error('Error al buscar reporte:', error);
      
      let mensajeError = 'Error al buscar el reporte';
      if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
      } else if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      Swal.fire({
        title: 'Error',
        text: mensajeError,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setIsBuscando(false);
    }
  };

  // Obtener nombre del plato para mostrar
  // La respuesta de la API devuelve objetos con codigo y nombre
  const obtenerNombrePlato = (plato) => {
    if (!plato) return '';
    const codigo = plato.codigo || plato.Codigo || '';
    const nombre = plato.nombre || plato.Nombre || plato.descripcion || plato.Descripcion || '';
    return codigo ? `${codigo} - ${nombre}` : nombre;
  };

  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      {/* Barra negra con título */}
      <div className="page-title-bar">
        <h3>
          <i className="fa fa-chart-bar mr-2" aria-hidden="true"></i>
          Reporte de Gestión
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
                <h3 style={{ margin: 0, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <i className="fa fa-filter mr-2" aria-hidden="true"></i>
                    Filtros de búsqueda
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
                  padding: '1.5rem 2rem',
                  animation: 'fadeIn 0.3s ease',
                  overflow: 'visible'
                }}
              >
                <div className="row" style={{ marginLeft: 0, marginRight: 0 }}>
                  {/* Primera fila */}
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="fechaDesde">
                        Fecha desde
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fechaDesde"
                        name="fechaDesde"
                        value={formData.fechaDesde || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="fechaHasta">
                        Fecha hasta
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fechaHasta"
                        name="fechaHasta"
                        value={formData.fechaHasta || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="busquedaPlato">
                        Plato
                      </label>
                      <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                        <div className="plato-buscador-container" style={{ position: 'relative', flex: 1 }}>
                          {platoSeleccionado ? (
                            <input
                              type="text"
                              className="form-control"
                              id="busquedaPlato"
                              value={obtenerNombrePlato(platoSeleccionado)}
                              readOnly
                              disabled={isLoading}
                              style={{ backgroundColor: '#e9ecef', cursor: 'default' }}
                            />
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              id="busquedaPlato"
                              name="busquedaPlato"
                              value={busquedaPlato}
                              onChange={handleBusquedaPlato}
                              onFocus={() => {
                                if (busquedaPlato.trim() && platosFiltrados.length > 0) {
                                  setMostrarDropdownPlato(true);
                                }
                              }}
                              placeholder="Ingrese al menos 4 caracteres para buscar..."
                              disabled={isLoading || isBuscandoPlatos}
                              autoComplete="off"
                            />
                          )}
                          {busquedaPlato.trim().length > 0 && busquedaPlato.trim().length < 4 && (
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
                              <div className="dropdown-item-text text-muted" style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem' }}>
                                Ingrese al menos 4 caracteres para buscar
                              </div>
                            </div>
                          )}
                          {isBuscandoPlatos && (
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
                                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                Buscando...
                              </div>
                            </div>
                          )}
                          {!isBuscandoPlatos && mostrarDropdownPlato && platosFiltrados.length > 0 && (
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
                              {platosFiltrados.map((plato) => {
                                const platoId = plato.id || plato.Id || plato.ID;
                                return (
                                  <button
                                    key={platoId}
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => handleSeleccionarPlato(plato)}
                                    style={{ textAlign: 'left', cursor: 'pointer' }}
                                  >
                                    <div>
                                      <strong>{obtenerNombrePlato(plato)}</strong>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {!isBuscandoPlatos && mostrarDropdownPlato && busquedaPlato.trim() && platosFiltrados.length === 0 && (
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
                                No se encontraron platos
                              </div>
                            </div>
                          )}
                        </div>
                        {platoSeleccionado && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleLimpiarPlato}
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
                        {busquedaPlato && !platoSeleccionado && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setBusquedaPlato('');
                              setMostrarDropdownPlato(false);
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
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row mt-3" style={{ marginLeft: 0, marginRight: 0 }}>
                  {/* Segunda fila */}
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="proyectoId">
                        Proyecto
                      </label>
                      <select
                        className="form-control"
                        id="proyectoId"
                        name="proyectoId"
                        value={formData.proyectoId || ''}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="">{isLoading ? 'Cargando...' : '-- Todos --'}</option>
                        {proyectos.length === 0 && !isLoading && (
                          <option value="" disabled>No hay proyectos disponibles</option>
                        )}
                        {proyectos.map((proyecto) => {
                          // El backend devuelve: { id, nombre, descripcion }
                          const proyectoId = proyecto.id || proyecto.Id || proyecto.ID;
                          const nombre = proyecto.nombre || proyecto.Nombre || proyecto.descripcion || proyecto.Descripcion || 'Sin nombre';
                          return (
                            <option key={proyectoId} value={proyectoId}>
                              {nombre}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="plantaId">
                        Planta
                      </label>
                      <select
                        className="form-control"
                        id="plantaId"
                        name="plantaId"
                        value={formData.plantaId || ''}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="">{isLoading ? 'Cargando...' : '-- Todas --'}</option>
                        {plantas.length === 0 && !isLoading && (
                          <option value="" disabled>No hay plantas disponibles</option>
                        )}
                        {plantas.map((planta) => {
                          // El backend devuelve: { id, nombre, descripcion }
                          const plantaId = planta.id || planta.Id || planta.ID;
                          const nombre = planta.nombre || planta.Nombre || planta.descripcion || planta.Descripcion || 'Sin nombre';
                          return (
                            <option key={plantaId} value={plantaId}>
                              {nombre}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="jerarquiaId">
                        Jerarquía
                      </label>
                      <select
                        className="form-control"
                        id="jerarquiaId"
                        name="jerarquiaId"
                        value={formData.jerarquiaId || ''}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="">{isLoading ? 'Cargando...' : '-- Todas --'}</option>
                        {jerarquias.length === 0 && !isLoading && (
                          <option value="" disabled>No hay jerarquías disponibles</option>
                        )}
                        {jerarquias.map((jerarquia) => {
                          // El backend devuelve: { id, nombre, descripcion }
                          const jerarquiaId = jerarquia.id || jerarquia.Id || jerarquia.ID;
                          const nombre = jerarquia.nombre || jerarquia.Nombre || jerarquia.descripcion || jerarquia.Descripcion || 'Sin nombre';
                          return (
                            <option key={jerarquiaId} value={jerarquiaId}>
                              {nombre}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="centroDeCostoId">
                        Centro de Costo
                      </label>
                      <select
                        className="form-control"
                        id="centroDeCostoId"
                        name="centroDeCostoId"
                        value={formData.centroDeCostoId || ''}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="">{isLoading ? 'Cargando...' : '-- Todos --'}</option>
                        {centrosDeCosto.length === 0 && !isLoading && (
                          <option value="" disabled>No hay centros de costo disponibles</option>
                        )}
                        {centrosDeCosto.map((centro) => {
                          // El backend devuelve: { id, nombre, descripcion }
                          const centroId = centro.id || centro.Id || centro.ID;
                          const nombre = centro.nombre || centro.Nombre || centro.descripcion || centro.Descripcion || 'Sin nombre';
                          return (
                            <option key={centroId} value={centroId}>
                              {nombre}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="row mt-3" style={{ marginLeft: 0, marginRight: 0 }}>
                  {/* Tercera fila - Botón Buscar */}
                  <div className="col-md-12 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn"
                      onClick={handleBuscar}
                      disabled={isBuscando || isLoading}
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
                      {isBuscando ? (
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
              )}
            </div>
          </form>

          {/* Sección de resultados del reporte */}
          {reporteData !== null && (
            <div className="form-section" style={{ marginTop: '3rem' }}>
              <div style={{ padding: 0 }}>
                {(() => {
                  // Extraer datos del reporte (puede venir en diferentes formatos)
                  const detalles = Array.isArray(reporteData) 
                    ? reporteData 
                    : (reporteData.detalles || reporteData.detalle || reporteData.items || reporteData.data || []);
                  
                  // Calcular resumen desde los detalles
                  const cantidadPlatos = detalles.length;
                  const cantidadDevueltos = detalles.filter(item => 
                    (item.estado === 'D' || item.Estado === 'D' || item.estado === 'Devuelto' || item.Estado === 'Devuelto')
                  ).length;
                  const costoTotal = detalles.reduce((sum, item) => {
                    const costo = parseFloat(item.costo || item.Costo || item.monto || item.Monto || item.importe || item.Importe || 0);
                    return sum + (isNaN(costo) ? 0 : costo);
                  }, 0);
                  const calificaciones = detalles
                    .map(item => parseFloat(item.calificacion || item.Calificacion || 0))
                    .filter(cal => !isNaN(cal) && cal > 0);
                  const promedioCalificacion = calificaciones.length > 0
                    ? (calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length).toFixed(1)
                    : '0';

                  // Formatear fecha
                  const formatearFecha = (fecha) => {
                    if (!fecha) return '-';
                    try {
                      const date = new Date(fecha);
                      if (isNaN(date.getTime())) return fecha;
                      const dia = String(date.getDate()).padStart(2, '0');
                      const mes = String(date.getMonth() + 1).padStart(2, '0');
                      const año = date.getFullYear();
                      const horas = String(date.getHours()).padStart(2, '0');
                      const minutos = String(date.getMinutes()).padStart(2, '0');
                      const segundos = String(date.getSeconds()).padStart(2, '0');
                      return `${dia}/${mes}/${año} - ${horas}:${minutos}:${segundos}`;
                    } catch (e) {
                      return fecha;
                    }
                  };

                  // Formatear importe
                  const formatearImporte = (importe) => {
                    const num = parseFloat(importe || 0);
                    if (isNaN(num)) return '$0.00';
                    return new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(num);
                  };

                  // Obtener estado con badge
                  const obtenerEstadoBadge = (estado) => {
                    const estadoStr = (estado || '').toString().toUpperCase();
                    const estados = {
                      'P': { texto: 'Pendiente', color: '#ffffff', bgColor: '#ff9800' },
                      'D': { texto: 'Devuelto', color: '#6c757d', bgColor: '#f5f5f5' },
                      'C': { texto: 'Cancelado', color: '#dc3545', bgColor: '#f8d7da' },
                      'R': { texto: 'Recibido', color: '#28a745', bgColor: '#d4edda' },
                      'E': { texto: 'En Aceptación', color: '#007bff', bgColor: '#cce5ff' },
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

                  return (
                    <>
                      {/* Resumen del Reporte */}
                      <div className="form-section" style={{ marginBottom: '2rem' }}>
                        <div className="page-title-bar" style={{ marginBottom: '0', borderRadius: '0.5rem 0.5rem 0 0' }}>
                          <h3 style={{ margin: 0, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center' }}>
                            <i className="fa fa-chart-bar mr-2" aria-hidden="true"></i>
                            Resumen del Reporte
                          </h3>
                        </div>
                        <div className="form-section-content" style={{ 
                          padding: '1.5rem', 
                          border: '1px solid #dee2e6', 
                          borderTop: 'none', 
                          borderRadius: '0 0 0.5rem 0.5rem', 
                          backgroundColor: 'white',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1.5rem',
                          justifyContent: 'space-around'
                        }}>
                          <div style={{ textAlign: 'center', minWidth: '150px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '0.5rem' }}>
                              {cantidadPlatos}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Cantidad de platos</div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: '150px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
                              {promedioCalificacion}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Promedio de calificación</div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: '150px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107', marginBottom: '0.5rem' }}>
                              {cantidadDevueltos}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Cantidad devueltos</div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: '150px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8', marginBottom: '0.5rem' }}>
                              {formatearImporte(costoTotal)}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Costo total</div>
                          </div>
                        </div>
                      </div>

                      {/* Detalle del Reporte */}
                      <div className="form-section">
                        <div className="page-title-bar" style={{ marginBottom: '0', borderRadius: '0.5rem 0.5rem 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: 0, padding: '0.75rem 1.5rem', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <i className="fa fa-table mr-2" aria-hidden="true"></i>
                            Detalle del Reporte
                          </h3>
                          {detalles.length > 0 && (
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
                                borderRadius: '0.25rem',
                                marginRight: '1rem'
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
                          )}
                        </div>
                        <div className="form-section-content" style={{ 
                          padding: '0', 
                          border: '1px solid #dee2e6', 
                          borderTop: 'none', 
                          borderRadius: '0 0 0.5rem 0.5rem', 
                          backgroundColor: 'white',
                          overflowX: 'auto'
                        }}>
                          {detalles.length === 0 ? (
                            <div className="alert alert-info text-center" style={{ margin: '1.5rem' }}>
                              <i className="fa fa-info-circle mr-2"></i>
                              No hay datos registrados para el reporte
                            </div>
                          ) : (
                            <table className="table table-striped table-hover" style={{ margin: 0 }}>
                              <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                  <th style={{ whiteSpace: 'nowrap' }}>Fecha</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Planta</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>CC</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Proyecto</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Perfil</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Bonificación</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Legajo</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Nombre completo</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Plato</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Estado</th>
                                  <th style={{ whiteSpace: 'nowrap' }}>Costo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detalles.map((item, index) => {
                                  const fecha = item.fecha || item.Fecha || item.fechaCreacion || item.FechaCreacion;
                                  const planta = item.plantaNombre || item.PlantaNombre || item.planta || item.Planta || '-';
                                  const centroCosto = item.centroCostoNombre || item.CentroCostoNombre || item.centroCosto || item.CentroCosto || item.CC || '-';
                                  const proyecto = item.proyectoNombre || item.ProyectoNombre || item.proyecto || item.Proyecto || '-';
                                  const jerarquia = item.jerarquiaNombre || item.JerarquiaNombre || item.jerarquia || item.Jerarquia || item.perfil || item.Perfil || '-';
                                  const legajo = item.legajo || item.Legajo || item.userLegajo || item.UserLegajo || '-';
                                  const nombreCompleto = item.nombreCompleto || item.NombreCompleto || 
                                    `${item.nombre || item.Nombre || ''} ${item.apellido || item.Apellido || ''}`.trim() || '-';
                                  const plato = item.platoDescripcion || item.PlatoDescripcion || item.plato || item.Plato || item.descripcion || item.Descripcion || '-';
                                  const estado = item.estado || item.Estado || '-';
                                  const bonificado = item.bonificado || item.Bonificado || false;
                                  const costo = item.costo || item.Costo || item.monto || item.Monto || item.importe || item.Importe || 0;

                                  return (
                                    <tr key={index}>
                                      <td style={{ whiteSpace: 'nowrap' }}>{formatearFecha(fecha)}</td>
                                      <td>{planta}</td>
                                      <td>{centroCosto}</td>
                                      <td>{proyecto}</td>
                                      <td>{jerarquia}</td>
                                      <td style={{ textAlign: 'center' }}>{bonificado ? '✓' : ''}</td>
                                      <td>{legajo}</td>
                                      <td>{nombreCompleto}</td>
                                      <td>{plato}</td>
                                      <td>{obtenerEstadoBadge(estado)}</td>
                                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatearImporte(costo)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporteGGestion;
