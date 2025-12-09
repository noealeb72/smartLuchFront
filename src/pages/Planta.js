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

const Planta = () => {
  const [plantas, setPlantas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [plantaEditando, setPlantaEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('activo'); // 'activo' o 'inactivo'
  const [vista, setVista] = useState('lista'); // 'lista' o 'editar' o 'crear'
  
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
  });

  // Cargar plantas usando /api/planta/lista con paginación
  const cargarPlantas = useCallback(async (page = 1, searchTerm = '', mostrarActivos = true) => {
    try {
      setIsLoading(true);
      
      // Siempre usar pageSize=100 para obtener todos los resultados
      // page=1 siempre para búsquedas
      const data = await apiService.getPlantasLista(
        1,              // page siempre 1 para búsquedas
        100,            // pageSize máximo
        searchTerm,     // término de búsqueda
        mostrarActivos  // activo = true o false según el combo
      );
      
      // El backend devuelve estructura paginada: { page, pageSize, totalItems, totalPages, items: [...] }
      let plantasData = [];
      if (data.items && Array.isArray(data.items)) {
        plantasData = data.items;
      } else if (Array.isArray(data)) {
        plantasData = data;
      } else if (data.data && Array.isArray(data.data)) {
        plantasData = data.data;
      }
      
      // Normalizar los datos del DTO (PascalCase a minúsculas) para consistencia
      const plantasNormalizadas = plantasData.map(planta => ({
        id: planta.Id || planta.id,
        nombre: planta.Nombre || planta.nombre || '',
        descripcion: planta.Descripcion || planta.descripcion || '',
        activo: planta.Deletemark !== undefined ? !planta.Deletemark : (planta.activo !== undefined ? planta.activo : true),
        Deletemark: planta.Deletemark,
      }));
      
      // Usar los valores de paginación del backend
      const totalItemsBackend = data.totalItems || plantasNormalizadas.length;
      const totalPagesBackend = data.totalPages || Math.ceil(totalItemsBackend / pageSize);
      
      setPlantas(plantasNormalizadas);
      setTotalPages(totalPagesBackend);
      setTotalItems(totalItemsBackend);
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar las plantas',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      
      setPlantas([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Cuando cambia el filtro o filtroActivo, resetear a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, filtroActivo]);

  // Cargar plantas cuando cambia la página, el filtro o el filtroActivo
  useEffect(() => {
    const soloActivos = filtroActivo === 'activo';
    cargarPlantas(currentPage, filtro, soloActivos);
  }, [currentPage, filtro, filtroActivo, cargarPlantas]);

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

  // Guardar planta (crear o actualizar)
  const handleGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setIsLoading(true);

      const plantaData = {
        id: formData.id,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
      };

      if (plantaEditando) {
        await apiService.actualizarPlanta(plantaData);
        Swal.fire({
          title: 'Éxito',
          text: 'Planta actualizada correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      } else {
        await apiService.crearPlanta(plantaData);
        Swal.fire({
          title: 'Éxito',
          text: 'Planta creada correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      }

      handleVolverALista();
      const soloActivos = filtroActivo === 'activo';
      cargarPlantas(currentPage, filtro, soloActivos);
    } catch (error) {
      // Error al guardar planta
      
      if (!error.redirectToLogin) {
        // Extraer el mensaje del error del backend
        let errorMessage = 'Error al guardar la planta';
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

  // Crear nueva planta
  const handleCrearPlanta = () => {
    setPlantaEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
    });
    setVista('crear');
  };

  // Editar planta
  const handleEditarPlanta = async (planta) => {
    try {
      setIsLoading(true);
      // Obtener el ID de la planta
      const plantaId = planta.id || planta.Id || planta.ID || planta.planta_id || planta.PlantaId;
      
      if (!plantaId) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener el ID de la planta',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }
      
      // Cargar los datos completos desde el endpoint
      const plantaData = await apiService.getPlantaPorId(plantaId);
      
      // El backend devuelve datos en PascalCase, extraer solo id, nombre y descripcion
      setPlantaEditando(plantaData);
      setFormData({
        id: plantaData.Id || plantaData.id || plantaId,
        nombre: plantaData.Nombre || plantaData.nombre || '',
        descripcion: plantaData.Descripcion || plantaData.descripcion || '',
      });
      setVista('editar');
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los datos de la planta',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Volver a la lista
  const handleVolverALista = () => {
    setPlantaEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
    });
    setVista('lista');
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Listado de Plantas', 14, 15);
      
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Exportado el: ${fecha}`, 14, 22);
      
      const tableData = plantas.map(planta => [
        planta.nombre || '-',
        planta.descripcion || '-'
      ]);
      
      doc.autoTable({
        startY: 28,
        head: [['Nombre', 'Descripción']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 28 }
      });
      
      const fileName = `plantas_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      Swal.fire({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato PDF',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } catch (error) {
      // Error al exportar PDF
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
      const datosExcel = plantas.map(planta => ({
        'Nombre': planta.nombre || '',
        'Descripción': planta.descripcion || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantas');
      
      const colWidths = [
        { wch: 20 },
        { wch: 40 }
      ];
      ws['!cols'] = colWidths;
      
      const fileName = `plantas_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      Swal.fire({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato Excel',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } catch (error) {
      // Error al exportar Excel
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
              {vista === 'editar' ? 'Editar Planta' : 'Nueva Planta'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para creación */}
        {vista === 'crear' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Creando nueva planta - Complete los campos obligatorios para guardar.</span>
          </div>
        )}

        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-pencil-alt" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Editando planta - Modifique los campos necesarios y guarde los cambios.</span>
          </div>
        )}

        <div className="usuarios-form-container">
          <form>
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa fa-building mr-2"></i>
                <span>Información de la Planta</span>
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
                        placeholder="Ingrese el nombre de la planta"
                      />
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
      {/* Barra negra con título Plantas */}
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
          <i className="fa fa-building mr-2" aria-hidden="true"></i>Plantas
        </h3>
      </div>
      
      <div style={{ paddingTop: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Botón Agregar */}
        <div style={{ marginBottom: '1rem' }}>
          <AgregarButton onClick={handleCrearPlanta} />
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
          
          {/* Filtro de estado (Activos/Inactivos) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label
              htmlFor="filtroActivo"
              style={{
                fontSize: '0.9rem',
                fontWeight: 'normal',
                color: '#495057',
                margin: 0,
                whiteSpace: 'nowrap'
              }}
            >
              Estado:
            </label>
            <select
              id="filtroActivo"
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
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
              disabled={plantas.length === 0}
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
              disabled={plantas.length === 0}
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

        {/* Tabla de plantas */}
        <DataTable
          columns={[
            { key: 'nombre', field: 'nombre', label: 'Nombre' },
            { key: 'descripcion', field: 'descripcion', label: 'Descripción' },
          ]}
          data={plantas}
          isLoading={isLoading}
          emptyMessage={
            filtro 
              ? 'No se encontraron plantas que coincidan con la búsqueda' 
              : filtroActivo === 'activo' 
                ? 'No hay plantas registradas Activas' 
                : filtroActivo === 'inactivo' 
                  ? 'No hay plantas registradas Inactivas' 
                  : 'No hay plantas registradas'
          }
          onEdit={handleEditarPlanta}
          canEdit={(planta) => {
            // Si estamos en el filtro de "Inactivos", no mostrar el botón de editar
            if (filtroActivo === 'inactivo') {
              return false;
            }
            // Si estamos en el filtro de "Activos", todos las plantas mostradas están activas
            if (filtroActivo === 'activo') {
              return true;
            }
            // Por defecto, usar el campo normalizado 'activo'
            const isActivo = planta.activo === true || planta.activo === 1 || planta.activo === 'true' || planta.activo === '1';
            return isActivo; // Solo se puede editar si está activo
          }}
          onDelete={(planta) => {
            // No permitir eliminar si solo hay una planta
            if (plantas.length === 1) {
              Swal.fire({
                title: 'No permitido',
                text: 'No se puede eliminar la única planta disponible. Debe haber al menos una planta en el sistema.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949',
              });
              return;
            }
            
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea dar de baja la planta ${planta.nombre}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, dar de baja',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  // Intentar obtener el ID de diferentes formas posibles
                  const plantaId = planta.id || planta.Id || planta.ID || planta.planta_id || planta.PlantaId;
                  
                  if (!plantaId && plantaId !== 0) {
                    Swal.fire({
                      title: 'Error',
                      text: 'No se pudo obtener el ID de la planta. Por favor, intente nuevamente.',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                    return;
                  }
                  
                  await apiService.eliminarPlanta(plantaId);
                  Swal.fire({
                    title: 'Éxito',
                    text: 'Planta dada de baja correctamente',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                  });
                  const soloActivos = filtroActivo === 'activo';
                  cargarPlantas(currentPage, filtro, soloActivos);
                } catch (error) {
                  if (!error.redirectToLogin) {
                    Swal.fire({
                      title: 'Error',
                      text: error.message || 'Error al dar de baja la planta',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                  }
                }
              }
            });
          }}
              canDelete={(planta) => {
                // No permitir eliminar si la planta está inactiva
                // Función helper para determinar si una planta está inactiva
                const rawActivo = planta.activo !== undefined ? planta.activo :
                                 planta.isActive !== undefined ? planta.isActive :
                                 planta.Activo !== undefined ? planta.Activo :
                                 planta.deletemark !== undefined ? !planta.deletemark :
                                 planta.Deletemark !== undefined ? !planta.Deletemark :
                                 planta.deleteMark !== undefined ? !planta.deleteMark :
                                 undefined;
                
                // Convertir a boolean si viene como string o número
                let isInactivo = false;
                if (rawActivo !== undefined) {
                  isInactivo = rawActivo === false ||
                              rawActivo === 0 ||
                              rawActivo === 'false' ||
                              rawActivo === '0' ||
                              String(rawActivo).toLowerCase() === 'false';
                } else {
                  // Si no hay información, asumir activo (mostrar botón eliminar)
                  isInactivo = false;
                }
                
                // Si está inactivo, no mostrar botón de eliminar
                return !isInactivo;
              }}
              renderActions={(planta) => {
                // Función helper para determinar si una planta está inactiva
                const rawActivo = planta.activo !== undefined ? planta.activo :
                                 planta.isActive !== undefined ? planta.isActive :
                                 planta.Activo !== undefined ? planta.Activo :
                                 planta.deletemark !== undefined ? !planta.deletemark :
                                 planta.Deletemark !== undefined ? !planta.Deletemark :
                                 planta.deleteMark !== undefined ? !planta.deleteMark :
                                 undefined;
                
                // Convertir a boolean si viene como string o número
                let isInactivo = false;
                if (rawActivo !== undefined) {
                  isInactivo = rawActivo === false ||
                              rawActivo === 0 ||
                              rawActivo === 'false' ||
                              rawActivo === '0' ||
                              String(rawActivo).toLowerCase() === 'false';
                }
                
                // Si está inactivo, mostrar botón de activar
                if (isInactivo) {
                  return (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => {
                        Swal.fire({
                          title: '¿Está seguro?',
                          text: `¿Desea activar la planta ${planta.nombre}?`,
                          icon: 'question',
                          showCancelButton: true,
                          confirmButtonColor: '#28a745',
                          cancelButtonColor: '#6c757d',
                          confirmButtonText: 'Sí, activar',
                          cancelButtonText: 'Cancelar',
                        }).then(async (result) => {
                          if (result.isConfirmed) {
                            try {
                              const plantaId = planta.id || planta.Id || planta.ID || planta.planta_id || planta.PlantaId;
                              await apiService.activarPlanta(plantaId);
                              Swal.fire({
                                title: 'Activado',
                                text: 'Planta activada correctamente',
                                icon: 'success',
                                timer: 3000,
                                timerProgressBar: true,
                                showConfirmButton: false,
                                allowOutsideClick: true,
                              });
                              const soloActivos = filtroActivo === 'activo';
                              cargarPlantas(currentPage, filtro, soloActivos);
                            } catch (error) {
                              if (!error.redirectToLogin) {
                                Swal.fire({
                                  title: 'Error',
                                  text: error.message || 'Error al activar la planta',
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
                return null;
              }}
          pageSize={pageSize}
          enablePagination={true}
        />
      </div>
    </div>
  );
};

export default Planta;
