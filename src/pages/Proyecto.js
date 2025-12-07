import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Usuarios.css';

const Proyecto = () => {
  const [proyectos, setProyectos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [vista, setVista] = useState('lista'); // 'lista' o 'editar' o 'crear'
  const [plantas, setPlantas] = useState([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState([]);
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    planta_id: '',
    centrodecosto_id: '',
  });

  // Cargar proyectos con paginación y búsqueda
  const cargarProyectos = useCallback(async (page = 1, searchTerm = '') => {
    try {
      setIsLoading(true);
      const data = await apiService.getProyectosLista(page, pageSize, searchTerm);
      
      if (Array.isArray(data)) {
        // Si el backend devuelve un array directo, calcular paginación del lado del cliente
        const totalItemsCount = data.length;
        const calculatedTotalPages = Math.ceil(totalItemsCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = data.slice(startIndex, endIndex);
        
        setProyectos(paginatedData);
        setTotalPages(calculatedTotalPages);
        setTotalItems(totalItemsCount);
      } else if (data.data && Array.isArray(data.data)) {
        setProyectos(data.data);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || data.total || data.data.length);
      } else if (data.items && Array.isArray(data.items)) {
        setProyectos(data.items);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || data.total || data.items.length);
      } else {
        setProyectos([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los proyectos',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      
      setProyectos([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Cargar plantas disponibles
  const cargarPlantas = useCallback(async () => {
    try {
      const data = await apiService.getPlantas();
      setPlantas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar plantas:', error);
      setPlantas([]);
    }
  }, []);

  // Cargar centros de costo disponibles
  const cargarCentrosDeCosto = useCallback(async () => {
    try {
      // Traer todos los centros de costo (usar un pageSize grande para obtener todos)
      const data = await apiService.getCentrosDeCostoLista(1, 1000, '');
      
      // Manejar diferentes formatos de respuesta
      let centrosArray = [];
      if (Array.isArray(data)) {
        centrosArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        centrosArray = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        centrosArray = data.items;
      }
      
      setCentrosDeCosto(centrosArray);
    } catch (error) {
      console.error('Error al cargar centros de costo:', error);
      setCentrosDeCosto([]);
    }
  }, []);

  // Cargar proyectos cuando cambia la página o el filtro
  useEffect(() => {
    cargarProyectos(currentPage, filtro);
  }, [currentPage, filtro, cargarProyectos]);

  // Cargar plantas y centros de costo cuando se abre el formulario
  useEffect(() => {
    if (vista === 'crear' || vista === 'editar') {
      cargarPlantas();
      cargarCentrosDeCosto();
    }
  }, [vista, cargarPlantas, cargarCentrosDeCosto]);

  // Auto-asignar valores si solo hay una opción disponible al crear
  useEffect(() => {
    if (vista === 'crear' && !proyectoEditando) {
      if (plantas.length === 1 && !formData.planta_id) {
        setFormData(prev => ({ ...prev, planta_id: plantas[0].id }));
      }
      if (centrosDeCosto.length === 1 && !formData.centrodecosto_id) {
        setFormData(prev => ({ ...prev, centrodecosto_id: centrosDeCosto[0].id }));
      }
    }
  }, [vista, plantas, centrosDeCosto, proyectoEditando, formData.planta_id, formData.centrodecosto_id]);

  // Manejar cambio de input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validar formulario
  const validarFormulario = () => {
    const errores = [];
    let primerCampoConError = '';

    const addError = (message, fieldId) => {
      errores.push(message);
      if (!primerCampoConError) primerCampoConError = fieldId;
    };

    if (!formData.nombre.trim()) {
      addError('El nombre es requerido', 'nombre');
    }

    // Solo validar planta_id si hay más de una opción disponible
    if (plantas.length > 1 && (!formData.planta_id || formData.planta_id === '')) {
      addError('La planta es requerida', 'planta_id');
    }

    // Solo validar centrodecosto_id si hay más de una opción disponible
    if (centrosDeCosto.length > 1 && (!formData.centrodecosto_id || formData.centrodecosto_id === '')) {
      addError('El centro de costo es requerido', 'centrodecosto_id');
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

  // Guardar proyecto (crear o actualizar)
  const handleGuardar = async () => {
    // Asignar automáticamente planta_id y centrodecosto_id si solo hay una opción disponible
    const datosActualizados = { ...formData };
    if (plantas.length === 1 && !datosActualizados.planta_id) {
      datosActualizados.planta_id = plantas[0].id;
    }
    if (centrosDeCosto.length === 1 && !datosActualizados.centrodecosto_id) {
      datosActualizados.centrodecosto_id = centrosDeCosto[0].id;
    }

    // Actualizar formData temporalmente para validación
    const formDataParaValidar = { ...formData, ...datosActualizados };
    const formDataOriginal = formData;
    setFormData(formDataParaValidar);

    if (!validarFormulario()) {
      setFormData(formDataOriginal);
      return;
    }

    try {
      setIsLoading(true);

      // Asegurar que planta_id y centrodecosto_id tengan valores válidos
      const plantaIdValue = datosActualizados.planta_id 
        ? parseInt(datosActualizados.planta_id) 
        : (plantas.length === 1 ? plantas[0].id : null);

      const centrodecostoIdValue = datosActualizados.centrodecosto_id 
        ? parseInt(datosActualizados.centrodecosto_id) 
        : (centrosDeCosto.length === 1 ? centrosDeCosto[0].id : null);

      if (!plantaIdValue) {
        Swal.fire({
          title: 'Error de validación',
          text: 'La planta es requerida',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }).then(() => {
          const campo = document.getElementById('planta_id');
          if (campo) {
            campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            campo.focus();
          }
        });
        setIsLoading(false);
        return;
      }

      if (!centrodecostoIdValue) {
        Swal.fire({
          title: 'Error de validación',
          text: 'El centro de costo es requerido',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }).then(() => {
          const campo = document.getElementById('centrodecosto_id');
          if (campo) {
            campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            campo.focus();
          }
        });
        setIsLoading(false);
        return;
      }

      const proyectoData = {
        id: datosActualizados.id,
        nombre: datosActualizados.nombre.trim(),
        descripcion: datosActualizados.descripcion?.trim() || null,
        planta_id: plantaIdValue,
        centrodecosto_id: centrodecostoIdValue,
      };

      if (proyectoEditando) {
        await apiService.actualizarProyecto(proyectoData);
        Swal.fire({
          title: 'Éxito',
          text: 'Proyecto actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      } else {
        await apiService.crearProyecto(proyectoData);
        Swal.fire({
          title: 'Éxito',
          text: 'Proyecto creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }

      handleVolverALista();
      cargarProyectos(currentPage, filtro);
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
      
      if (!error.redirectToLogin) {
        // Extraer el mensaje del error del backend
        let errorMessage = 'Error al guardar el proyecto';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.Message) {
          errorMessage = error.response.data.Message;
        } else if (error.response?.data) {
          // Si el backend devuelve el mensaje directamente en data
          errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || error.response.data.Message || errorMessage;
        }
        
        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Crear nuevo proyecto
  const handleCrearProyecto = () => {
    setProyectoEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
      planta_id: '',
      centrodecosto_id: '',
    });
    setVista('crear');
  };

  // Editar proyecto
  const handleEditarProyecto = (proyecto) => {
    setProyectoEditando(proyecto);
    
    // Extraer centrodecosto_id de diferentes posibles formatos
    let centrodecostoId = '';
    if (proyecto.centrodecosto_id) {
      centrodecostoId = proyecto.centrodecosto_id;
    } else if (proyecto.centrodecosto) {
      centrodecostoId = typeof proyecto.centrodecosto === 'object' ? proyecto.centrodecosto.id : proyecto.centrodecosto;
    } else if (proyecto.centroDeCosto) {
      centrodecostoId = typeof proyecto.centroDeCosto === 'object' ? proyecto.centroDeCosto.id : proyecto.centroDeCosto;
    }
    
    setFormData({
      id: proyecto.id,
      nombre: proyecto.nombre || '',
      descripcion: proyecto.descripcion || '',
      planta_id: proyecto.planta_id || (proyecto.planta && typeof proyecto.planta === 'object' ? proyecto.planta.id : proyecto.planta) || '',
      centrodecosto_id: centrodecostoId,
    });
    setVista('editar');
  };

  // Volver a la lista
  const handleVolverALista = () => {
    setProyectoEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
      planta_id: '',
      centrodecosto_id: '',
    });
    setVista('lista');
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Listado de Proyectos', 14, 15);
      
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Exportado el: ${fecha}`, 14, 22);
      
      const tableData = proyectos.map(proyecto => [
        proyecto.nombre || '-',
        proyecto.planta_nombre || proyecto.plantaNombre || proyecto.planta?.nombre || proyecto.planta?.Nombre || '-',
        proyecto.centrodecosto_nombre || proyecto.centroDeCostoNombre || proyecto.centrodecosto?.nombre || proyecto.centroDeCosto?.nombre || '-',
        proyecto.descripcion || '-'
      ]);
      
      doc.autoTable({
        startY: 28,
        head: [['Nombre', 'Planta', 'Centro de Costo', 'Descripción']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 28 }
      });
      
      const fileName = `proyectos_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      Swal.fire({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato PDF',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al exportar el listado a PDF',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  };

  // Exportar a Excel
  const handleExportarExcel = () => {
    try {
      const datosExcel = proyectos.map(proyecto => ({
        'Nombre': proyecto.nombre || '',
        'Planta': proyecto.planta_nombre || proyecto.plantaNombre || proyecto.planta?.nombre || proyecto.planta?.Nombre || '',
        'Centro de Costo': proyecto.centrodecosto_nombre || proyecto.centroDeCostoNombre || proyecto.centrodecosto?.nombre || proyecto.centroDeCosto?.nombre || '',
        'Descripción': proyecto.descripcion || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Proyectos');
      
      const colWidths = [
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 40 }
      ];
      ws['!cols'] = colWidths;
      
      const fileName = `proyectos_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      Swal.fire({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato Excel',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al exportar el listado a Excel',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  };

  // Renderizar vista de formulario (crear/editar)
  if (vista === 'crear' || vista === 'editar') {
    return (
      <div className="container-fluid" style={{ padding: 0 }}>
        {/* Barra negra con título */}
        <div style={{ backgroundColor: '#343A40', color: 'white', padding: '0.5rem 0', width: '100%', minHeight: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-link text-white mr-3"
              onClick={handleVolverALista}
              style={{ padding: 0, textDecoration: 'none', fontSize: '1.2rem', border: 'none', background: 'none' }}
            >
              <i className="fa fa-arrow-left"></i>
            </button>
            <h3 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 'normal', 
              margin: 0, 
              fontFamily: 'sans-serif', 
              color: 'white', 
              textAlign: 'left',
              paddingTop: '0',
              paddingBottom: '0',
              lineHeight: '1.5',
            }}>
              {vista === 'editar' ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar">
            <i className="fa fa-pencil-alt"></i>
            <span>Editando proyecto - Modifique los campos necesarios y guarde los cambios.</span>
          </div>
        )}

        <div className="usuarios-form-container">
          <form>
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa fa-project-diagram mr-2"></i>
                <span>Información del Proyecto</span>
              </div>
              <div className="form-section-content">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="nombre">
                        Nombre <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre || ''}
                        onChange={handleInputChange}
                        required
                        placeholder="Ingrese el nombre del proyecto"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="planta_id">
                        Planta <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        id="planta_id"
                        name="planta_id"
                        value={formData.planta_id || ''}
                        onChange={handleInputChange}
                        disabled={plantas.length === 1}
                        required
                      >
                        {plantas.length === 0 ? (
                          <option value="">Cargando plantas...</option>
                        ) : plantas.length === 1 ? (
                          <option value={plantas[0].id}>{plantas[0].nombre || plantas[0].Nombre || plantas[0].descripcion || plantas[0].Descripcion}</option>
                        ) : (
                          <>
                            <option value="">Seleccionar planta</option>
                            {plantas.map((planta) => (
                              <option key={planta.id} value={planta.id}>
                                {planta.nombre || planta.Nombre || planta.descripcion || planta.Descripcion}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {plantas.length === 1 && (
                        <small className="form-text text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          Solo hay una planta disponible
                        </small>
                      )}
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="centrodecosto_id">
                        Centro de Costo <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        id="centrodecosto_id"
                        name="centrodecosto_id"
                        value={formData.centrodecosto_id || ''}
                        onChange={handleInputChange}
                        disabled={centrosDeCosto.length === 1}
                        required
                      >
                        {centrosDeCosto.length === 0 ? (
                          <option value="">Cargando centros de costo...</option>
                        ) : centrosDeCosto.length === 1 ? (
                          <option value={centrosDeCosto[0].id}>{centrosDeCosto[0].nombre || centrosDeCosto[0].Nombre || centrosDeCosto[0].descripcion || centrosDeCosto[0].Descripcion}</option>
                        ) : (
                          <>
                            <option value="">Seleccionar centro de costo</option>
                            {centrosDeCosto.map((centro) => (
                              <option key={centro.id} value={centro.id}>
                                {centro.nombre || centro.Nombre || centro.descripcion || centro.Descripcion}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {centrosDeCosto.length === 1 && (
                        <small className="form-text text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          Solo hay un centro de costo disponible
                        </small>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="descripcion">Descripción</label>
                      <input
                        type="text"
                        className="form-control"
                        id="descripcion"
                        name="descripcion"
                        value={formData.descripcion || ''}
                        onChange={handleInputChange}
                        placeholder="Ingrese una descripción (opcional)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-12">
                <button
                  type="button"
                  className="btn mr-2"
                  onClick={handleVolverALista}
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#F34949',
                    borderColor: '#F34949',
                    color: 'white'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleGuardar}
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#343A40',
                    borderColor: '#343A40',
                    color: 'white'
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Renderizar vista de lista
  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      {/* Barra negra con título Proyectos */}
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
          <i className="fa fa-project-diagram mr-2" aria-hidden="true"></i>Proyectos
        </h3>
      </div>
      
      <div style={{ paddingTop: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Botón Agregar */}
        <div style={{ marginBottom: '1rem' }}>
          <AgregarButton onClick={handleCrearProyecto} />
        </div>

        {/* Filtro de búsqueda con botones de exportación */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <Buscador 
              filtro={filtro}
              setFiltro={setFiltro}
              placeholder="Filtrar por nombre, descripción..."
            />
          </div>
          
          {/* Botones de exportación (solo iconos) */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn"
              onClick={handleExportarPDF}
              disabled={proyectos.length === 0}
              title="Exportar a PDF"
              style={{
                backgroundColor: '#dc3545',
                borderColor: '#dc3545',
                color: 'white',
                padding: '0.375rem 0.5rem',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              <i className="fa fa-file-pdf" aria-hidden="true"></i>
            </button>
            
            <button
              type="button"
              className="btn"
              onClick={handleExportarExcel}
              disabled={proyectos.length === 0}
              title="Exportar a Excel"
              style={{
                backgroundColor: '#28a745',
                borderColor: '#28a745',
                color: 'white',
                padding: '0.375rem 0.5rem',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              <i className="fa fa-file-excel" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        {/* Tabla de proyectos */}
        <DataTable
          columns={[
            { key: 'nombre', field: 'nombre', label: 'Nombre' },
            { key: 'planta', field: 'planta', label: 'Planta', render: (value, proyecto) => {
              if (!proyecto) return '-';
              return proyecto.planta_nombre || proyecto.plantaNombre || proyecto.planta?.nombre || proyecto.planta?.Nombre || '-';
            }},
            { key: 'centrodecosto', field: 'centrodecosto', label: 'Centro de Costo', render: (value, proyecto) => {
              if (!proyecto) return '-';
              return proyecto.centrodecosto_nombre || proyecto.centroDeCostoNombre || proyecto.centrodecosto?.nombre || proyecto.centroDeCosto?.nombre || '-';
            }},
            { key: 'descripcion', field: 'descripcion', label: 'Descripción' },
          ]}
          data={proyectos}
          isLoading={isLoading}
          emptyMessage={filtro ? 'No se encontraron proyectos que coincidan con la búsqueda' : 'No hay proyectos registrados'}
          onEdit={handleEditarProyecto}
          onDelete={(proyecto) => {
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea eliminar el proyecto ${proyecto.nombre}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, eliminar',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await apiService.eliminarProyecto(proyecto.id);
                  Swal.fire({
                    title: 'Eliminado',
                    text: 'Proyecto eliminado correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#F34949',
                  });
                  cargarProyectos(currentPage, filtro);
                } catch (error) {
                  if (!error.redirectToLogin) {
                    Swal.fire({
                      title: 'Error',
                      text: error.message || 'Error al eliminar el proyecto',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                  }
                }
              }
            });
          }}
          canDelete={(proyecto) => {
            // No permitir eliminar si solo hay un proyecto
            return proyectos.length > 1;
          }}
          enablePagination={false}
          pageSize={pageSize}
        />
        
        {/* Controles de paginación del servidor (siempre que haya más de una página o más de 10 registros) */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <span className="text-muted">
                Mostrando página {currentPage} de {totalPages} ({totalItems} proyectos)
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
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Mostrar solo algunas páginas alrededor de la actual
                  if (
                    page === 1 ||
                    page === totalPages ||
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
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Proyecto;
