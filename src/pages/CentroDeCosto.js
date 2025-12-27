import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { clearApiCache } from '../services/apiClient';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Usuarios.css';

const CentroDeCosto = () => {
  const [centros, setCentros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [centroEditando, setCentroEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('activo'); // 'activo' o 'inactivo'
  const [vista, setVista] = useState('lista'); // 'lista' o 'editar' o 'crear'
  const [plantas, setPlantas] = useState([]);
  
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
  });

  // Cargar centros de costo usando /api/centrodecosto/lista con paginación
  const cargarCentros = useCallback(async (page = 1, searchTerm = '', mostrarActivos = true) => {
    try {
      setIsLoading(true);
      
      // Si hay término de búsqueda, usar pageSize=100 y page=1 para obtener todos los resultados
      // Si no hay búsqueda, usar la paginación normal
      const pageToUse = (searchTerm && searchTerm.trim()) ? 1 : page;
      const pageSizeToUse = (searchTerm && searchTerm.trim()) ? 100 : pageSize;
      
      const data = await apiService.getCentrosDeCostoLista(
        pageToUse,      // page: 1 si hay búsqueda, sino usar el page actual
        pageSizeToUse,  // pageSize: 100 si hay búsqueda, sino usar 5
        searchTerm,     // término de búsqueda
        mostrarActivos  // activo = true o false según el combo
      );
      
      // El backend devuelve estructura paginada: { page, pageSize, totalItems, totalPages, items: [...] }
      let centrosData = [];
      
      if (data.items && Array.isArray(data.items)) {
        centrosData = data.items;
      } else if (Array.isArray(data)) {
        centrosData = data;
      } else if (data.data && Array.isArray(data.data)) {
        centrosData = data.data;
      }
      
      // Normalizar los datos del DTO (PascalCase a minúsculas) para consistencia
      // El backend devuelve PlantaNombre y PlantaId, mapearlos para facilitar el acceso
      const centrosNormalizados = centrosData.map(centro => ({
        ...centro,
        id: centro.Id || centro.id,
        nombre: centro.Nombre || centro.nombre || '',
        descripcion: centro.Descripcion || centro.descripcion || '',
        planta_id: centro.PlantaId || centro.plantaId || centro.planta_id || centro.planta?.id || centro.planta || null,
        planta_nombre: centro.PlantaNombre || centro.plantaNombre || centro.planta_nombre || centro.planta?.nombre || centro.planta?.Nombre || '',
        PlantaNombre: centro.PlantaNombre || centro.plantaNombre || centro.planta_nombre || centro.planta?.nombre || centro.planta?.Nombre || '',
        PlantaId: centro.PlantaId || centro.plantaId || centro.planta_id || centro.planta?.id || centro.planta || null,
        activo: centro.Deletemark !== undefined ? !centro.Deletemark : (centro.activo !== undefined ? centro.activo : true),
      }));
      
      // Usar los valores de paginación del backend
      const totalItemsBackend = data.totalItems || centrosNormalizados.length;
      const totalPagesBackend = data.totalPages || Math.ceil(totalItemsBackend / pageSize);
      
      setCentros(centrosNormalizados);
      setTotalPages(totalPagesBackend);
      setTotalItems(totalItemsBackend);
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los centros de costo',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      
      setCentros([]);
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
      setPlantas([]);
    }
  }, []);

  // Cuando cambia el filtro o filtroActivo, resetear a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, filtroActivo]);

  // Cargar centros cuando cambia la página, el filtro o el filtroActivo
  useEffect(() => {
    const soloActivos = filtroActivo === 'activo';
    // Limpiar caché antes de cargar para asegurar datos frescos cuando cambia el filtro
    clearApiCache();
    // Forzar recarga cuando cambia el filtroActivo
    cargarCentros(currentPage, filtro, soloActivos);
  }, [currentPage, filtro, filtroActivo, cargarCentros]);

  // Cargar plantas cuando se abre el formulario
  useEffect(() => {
    if (vista === 'crear' || vista === 'editar') {
      cargarPlantas();
    }
  }, [vista, cargarPlantas]);

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
    // Si hay solo una, se asignará automáticamente antes de guardar
    if (plantas.length > 1 && (!formData.planta_id || formData.planta_id === '')) {
      addError('La planta es requerida', 'planta_id');
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

  // Guardar centro de costo (crear o actualizar)
  const handleGuardar = async () => {
    // Asignar automáticamente planta_id si solo hay una opción disponible
    const datosActualizados = { ...formData };
    if (plantas.length === 1 && !datosActualizados.planta_id) {
      datosActualizados.planta_id = plantas[0].id;
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

      // Asegurar que planta_id tenga un valor válido
      const plantaIdValue = datosActualizados.planta_id 
        ? parseInt(datosActualizados.planta_id) 
        : (plantas.length === 1 ? plantas[0].id : null);

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

      const centroData = {
        id: datosActualizados.id,
        nombre: datosActualizados.nombre.trim(),
        descripcion: datosActualizados.descripcion?.trim() || null,
        planta_id: plantaIdValue,
      };

      if (centroEditando) {
        await apiService.actualizarCentroDeCosto(centroData);
        Swal.fire({
          title: 'Éxito',
          text: 'Centro de costo actualizado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      } else {
        await apiService.crearCentroDeCosto(centroData);
        Swal.fire({
          title: 'Éxito',
          text: 'Centro de costo creado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      }

      handleVolverALista();
      const soloActivos = filtroActivo === 'activo';
      cargarCentros(currentPage, filtro, soloActivos);
    } catch (error) {
      
      if (!error.redirectToLogin) {
        // Extraer el mensaje del error del backend
        let errorMessage = 'Error al guardar el centro de costo';
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

  // Crear nuevo centro de costo
  const handleCrearCentro = () => {
    setCentroEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
      planta_id: plantas.length === 1 ? plantas[0].id : '',
    });
    setVista('crear');
  };

  // Editar centro de costo
  const handleEditarCentro = (centro) => {
    setCentroEditando(centro);
    
    // Obtener el planta_id del centro normalizado
    // El backend devuelve PlantaId (PascalCase), que ya está mapeado en la normalización
    const plantaId = centro.planta_id || centro.PlantaId || centro.plantaId || centro.planta?.id || centro.planta || '';
    
    setFormData({
      id: centro.id || centro.Id || centro.ID,
      nombre: centro.nombre || centro.Nombre || '',
      descripcion: centro.descripcion || centro.Descripcion || '',
      // Asegurar que planta_id sea string y tenga un valor válido
      // Si no hay planta_id pero solo hay una planta disponible, asignarla automáticamente
      planta_id: plantaId ? String(plantaId) : (plantas.length === 1 ? String(plantas[0].id) : ''),
    });
    setVista('editar');
  };

  // Volver a la lista
  const handleVolverALista = () => {
    setCentroEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
      planta_id: '',
    });
    setVista('lista');
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Listado de Centros de Costo', 14, 15);
      
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Exportado el: ${fecha}`, 14, 22);
      
          const tableData = centros.map(centro => [
            centro.nombre || '-',
            centro.PlantaNombre || centro.plantaNombre || centro.planta_nombre || centro.planta?.nombre || centro.planta?.Nombre || '-',
            centro.descripcion || '-'
          ]);
      
      doc.autoTable({
        startY: 28,
        head: [['Nombre', 'Planta', 'Descripción']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 28 }
      });
      
      const fileName = `centrosdecosto_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      Swal.fire({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato PDF',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } catch (error) {
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
          const datosExcel = centros.map(centro => ({
            'Nombre': centro.nombre || '',
            'Planta': centro.PlantaNombre || centro.plantaNombre || centro.planta_nombre || centro.planta?.nombre || centro.planta?.Nombre || '',
            'Descripción': centro.descripcion || ''
          }));
      
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Centros de Costo');
      
      const colWidths = [
        { wch: 20 },
        { wch: 20 },
        { wch: 40 }
      ];
      ws['!cols'] = colWidths;
      
      const fileName = `centrosdecosto_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      Swal.fire({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato Excel',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } catch (error) {
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
      <div className="container-fluid" style={{ padding: 0, backgroundColor: 'white' }}>
        {/* Barra negra con título */}
        <div className="page-title-bar">
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-link text-white mr-3"
              onClick={handleVolverALista}
              style={{ padding: 0, textDecoration: 'none', fontSize: '1.2rem', border: 'none', background: 'none' }}
            >
              <i className="fa fa-arrow-left"></i>
            </button>
            <h3>
              {vista === 'editar' ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para creación */}
        {vista === 'crear' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Creando nuevo centro de costo - Complete los campos obligatorios para guardar.</span>
          </div>
        )}

        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-pencil-alt" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Editando centro de costo - Modifique los campos necesarios y guarde los cambios.</span>
          </div>
        )}

        <div className="usuarios-form-container">
          <form>
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa fa-dollar-sign mr-2"></i>
                <span>Información del Centro de Costo</span>
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
                        placeholder="Ingrese el nombre del centro de costo"
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
                        required={plantas.length > 1}
                      >
                        {plantas.length === 0 ? (
                          <option value="">Cargando plantas...</option>
                        ) : plantas.length === 1 ? (
                          <option value={plantas[0].id}>{plantas[0].nombre || plantas[0].Nombre || plantas[0].descripcion || plantas[0].Descripcion}</option>
                        ) : (
                          <>
                            {/* Solo mostrar "Seleccionar planta" si estamos creando y no hay valor seleccionado */}
                            {!centroEditando && !formData.planta_id && (
                              <option value="">Seleccionar planta</option>
                            )}
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
              <div className="col-12 d-flex justify-content-end">
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
      {/* Barra negra con título Centros de Costo */}
      <div className="page-title-bar">
        <h3>
          <i className="fa fa-dollar-sign mr-2" aria-hidden="true"></i>Centros de Costo
        </h3>
      </div>
      
      <div style={{ paddingTop: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Botón Agregar */}
        <div style={{ marginBottom: '1rem' }}>
          <AgregarButton onClick={handleCrearCentro} />
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
          
          {/* Filtro de estado Activo/Inactivo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ margin: 0, fontSize: '0.9rem', color: '#495057', whiteSpace: 'nowrap' }}>
              Estado:
            </label>
            <select
              id="filtroActivo"
              value={filtroActivo}
              onChange={(e) => {
                const nuevoValor = e.target.value;
                setFiltroActivo(nuevoValor);
              }}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.9rem',
                border: '1px solid #ced4da',
                borderRadius: '0.25rem',
                backgroundColor: 'white',
                color: '#495057',
                cursor: 'pointer',
                minWidth: '120px'
              }}
            >
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
          
          {/* Botones de exportación (solo iconos) */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn"
              onClick={handleExportarPDF}
              disabled={centros.length === 0}
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
              disabled={centros.length === 0}
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

        {/* Tabla de centros de costo */}
        <DataTable
          columns={[
            { key: 'nombre', field: 'nombre', label: 'Nombre' },
            { key: 'planta', field: 'planta', label: 'Planta', render: (value, centro) => {
              if (!centro) return '-';
              return centro.PlantaNombre || centro.plantaNombre || centro.planta_nombre || centro.planta?.nombre || centro.planta?.Nombre || '-';
            }},
            { key: 'descripcion', field: 'descripcion', label: 'Descripción' },
          ]}
          data={centros}
          isLoading={isLoading}
          emptyMessage={
            filtro 
              ? 'No se encontraron centros de costo que coincidan con la búsqueda' 
              : filtroActivo === 'activo' 
                ? 'No hay centros de costo registrados Activos' 
                : 'No hay centros de costo registrados Inactivos'
          }
          onEdit={handleEditarCentro}
          canEdit={(centro) => {
            // Si estamos en el filtro de "Inactivos", no mostrar el botón de editar
            if (filtroActivo === 'inactivo') {
              return false;
            }
            // Si estamos en el filtro de "Activos", todos los centros mostrados están activos
            if (filtroActivo === 'activo') {
              return true;
            }
            // Por defecto, usar el campo normalizado 'activo'
            const isActivo = centro.activo === true || centro.activo === 1 || centro.activo === 'true' || centro.activo === '1';
            return isActivo; // Solo se puede editar si está activo
          }}
          onDelete={(centro) => {
            // No permitir eliminar si solo hay un centro de costo
            if (centros.length === 1) {
              Swal.fire({
                title: 'No permitido',
                text: 'No se puede dar de baja el único centro de costo disponible. Debe haber al menos uno en el sistema.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949',
              });
              return;
            }
            
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea dar de baja el centro de costo ${centro.nombre}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, dar de baja',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await apiService.eliminarCentroDeCosto(centro.id);
                  Swal.fire({
                    title: 'Éxito',
                    text: 'Centro de costo dado de baja correctamente',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    allowOutsideClick: true,
                  });
                  const soloActivos = filtroActivo === 'activo';
                  cargarCentros(currentPage, filtro, soloActivos);
                } catch (error) {
                  if (!error.redirectToLogin) {
                    Swal.fire({
                      title: 'Error',
                      text: error.message || 'Error al dar de baja el centro de costo',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                  }
                }
              }
            });
          }}
          canDelete={(centro) => {
            // Si estamos en el filtro de "Inactivos", no mostrar el botón de eliminar
            if (filtroActivo === 'inactivo') {
              return false;
            }
            // Si estamos en el filtro de "Activos", todos los centros mostrados están activos
            if (filtroActivo === 'activo') {
              // Siempre mostrar el icono de eliminar si está activo (la validación se hace en onDelete)
              return true;
            }
            // Por defecto, usar el campo normalizado 'activo'
            const isActivo = centro.activo === true || centro.activo === 1 || centro.activo === 'true' || centro.activo === '1';
            if (!isActivo) {
              return false; // No se puede eliminar si está inactivo
            }
            // Siempre mostrar el icono si está activo (la validación se hace en onDelete)
            return true;
          }}
          renderActions={(centro) => {
            // Si estamos en el filtro de "Inactivos", mostrar el botón verde de activar
            if (filtroActivo === 'inactivo') {
              // Todos los centros mostrados están inactivos, mostrar botón verde
              return (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    Swal.fire({
                      title: '¿Está seguro?',
                      text: `¿Desea activar el centro de costo ${centro.nombre || centro.Nombre || 'este centro'}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#28a745',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: 'Sí, activar',
                      cancelButtonText: 'Cancelar',
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          const centroId = centro.id || centro.Id || centro.ID;
                          await apiService.activarCentroDeCosto(centroId);
                          Swal.fire({
                            title: 'Activado',
                            text: 'Centro de costo activado correctamente',
                            icon: 'success',
                            timer: 3000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            allowOutsideClick: true,
                          });
                          const soloActivos = filtroActivo === 'activo';
                          cargarCentros(currentPage, filtro, soloActivos);
                        } catch (error) {
                          if (!error.redirectToLogin) {
                            Swal.fire({
                              title: 'Error',
                              text: error.message || 'Error al activar el centro de costo',
                              icon: 'error',
                              confirmButtonText: 'Aceptar',
                              confirmButtonColor: '#F34949',
                            });
                          }
                        }
                      }
                    });
                  }}
                  title="Activar"
                  style={{ marginRight: '0.5rem' }}
                >
                  <i className="fa fa-check"></i>
                </button>
              );
            }
            // Si está activo, no mostrar nada adicional (los botones de editar y eliminar se muestran automáticamente)
            return null;
          }}
          enablePagination={false}
          pageSize={pageSize}
        />
        
        {/* Controles de paginación del servidor (siempre que haya más de una página) */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
            <div>
              <span className="text-muted">
                Mostrando página {currentPage} de {totalPages} ({totalItems} centros de costo)
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

export default CentroDeCosto;
