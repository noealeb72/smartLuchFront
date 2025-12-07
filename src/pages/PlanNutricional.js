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

const PlanNutricional = () => {
  const [planes, setPlanes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [planEditando, setPlanEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
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

  // Cargar planes nutricionales con paginación y búsqueda
  const cargarPlanes = useCallback(async (page = 1, searchTerm = '') => {
    try {
      setIsLoading(true);
      const data = await apiService.getPlanesNutricionalesLista(page, pageSize, searchTerm);
      
      if (Array.isArray(data)) {
        setPlanes(data);
        setTotalPages(1);
        setTotalItems(data.length);
      } else if (data.data && Array.isArray(data.data)) {
        setPlanes(data.data);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || data.total || data.data.length);
      } else if (data.items && Array.isArray(data.items)) {
        setPlanes(data.items);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || data.total || data.items.length);
      } else {
        setPlanes([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error al cargar planes nutricionales:', error);
      
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los planes nutricionales',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      
      setPlanes([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Cargar planes cuando cambia la página o el filtro
  useEffect(() => {
    cargarPlanes(currentPage, filtro);
  }, [currentPage, filtro, cargarPlanes]);

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

  // Guardar plan nutricional (crear o actualizar)
  const handleGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setIsLoading(true);

      const planData = {
        id: formData.id,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
      };

      if (planEditando) {
        console.log('Actualizando plan nutricional - Datos:', planData);
        await apiService.actualizarPlanNutricional(planData);
        Swal.fire({
          title: 'Éxito',
          text: 'Plan nutricional actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      } else {
        await apiService.crearPlanNutricional(planData);
        Swal.fire({
          title: 'Éxito',
          text: 'Plan nutricional creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }

      handleVolverALista();
      cargarPlanes(currentPage, filtro);
    } catch (error) {
      console.error('Error al guardar plan nutricional:', error);
      console.error('Error response:', error.response);
      
      if (!error.redirectToLogin) {
        // Extraer el mensaje del error del backend
        let errorMessage = 'Error al guardar el plan nutricional';
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

  // Crear nuevo plan nutricional
  const handleCrearPlan = () => {
    setPlanEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
    });
    setVista('crear');
  };

  // Editar plan nutricional
  const handleEditarPlan = (plan) => {
    setPlanEditando(plan);
    // Extraer el ID del plan (puede venir en diferentes formatos)
    const planId = plan.id || plan.Id || plan.ID;
    console.log('Editando plan nutricional - Plan completo:', plan, 'ID extraído:', planId);
    setFormData({
      id: planId,
      nombre: plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '',
      descripcion: plan.descripcion || plan.Descripcion || plan.descripcion_plan || plan.DescripcionPlan || '',
    });
    setVista('editar');
  };

  // Volver a la lista
  const handleVolverALista = () => {
    setPlanEditando(null);
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
      doc.text('Listado de Planes Nutricionales', 14, 15);
      
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Exportado el: ${fecha}`, 14, 22);
      
      const tableData = planes.map(plan => [
        plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '-',
        plan.descripcion || plan.Descripcion || plan.descripcion_plan || plan.DescripcionPlan || '-'
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
      
      const fileName = `planesnutricionales_${new Date().toISOString().split('T')[0]}.pdf`;
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
      const datosExcel = planes.map(plan => ({
        'Nombre': plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '',
        'Descripción': plan.descripcion || plan.Descripcion || plan.descripcion_plan || plan.DescripcionPlan || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Planes Nutricionales');
      
      const colWidths = [
        { wch: 20 },
        { wch: 40 }
      ];
      ws['!cols'] = colWidths;
      
      const fileName = `planesnutricionales_${new Date().toISOString().split('T')[0]}.xlsx`;
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
              {vista === 'editar' ? 'Editar Plan Nutricional' : 'Nuevo Plan Nutricional'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar">
            <i className="fa fa-pencil-alt"></i>
            <span>Editando plan nutricional - Modifique los campos necesarios y guarde los cambios.</span>
          </div>
        )}

        <div className="usuarios-form-container">
          <form>
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa fa-apple-alt mr-2"></i>
                <span>Información del Plan Nutricional</span>
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
                        placeholder="Ingrese el nombre del plan nutricional"
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
      {/* Barra negra con título Planes Nutricionales */}
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
          <i className="fa fa-apple-alt mr-2" aria-hidden="true"></i>Perfil Nutricional
        </h3>
      </div>
      
      <div style={{ paddingTop: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Botón Agregar */}
        <div style={{ marginBottom: '1rem' }}>
          <AgregarButton onClick={handleCrearPlan} />
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
              disabled={planes.length === 0}
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
              disabled={planes.length === 0}
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

        {/* Tabla de planes nutricionales */}
        <DataTable
          columns={[
            { key: 'nombre', field: 'nombre', label: 'Nombre', render: (value, plan) => {
              if (!plan) return '-';
              return plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '-';
            }},
            { key: 'descripcion', field: 'descripcion', label: 'Descripción', render: (value, plan) => {
              if (!plan) return '-';
              return plan.descripcion || plan.Descripcion || plan.descripcion_plan || plan.DescripcionPlan || '-';
            }},
          ]}
          data={planes}
          isLoading={isLoading}
          emptyMessage={filtro ? 'No se encontraron planes nutricionales que coincidan con la búsqueda' : 'No hay planes nutricionales registrados'}
          onEdit={handleEditarPlan}
          onDelete={(plan) => {
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea eliminar el plan nutricional ${plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || 'este plan'}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, eliminar',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  // Extraer el ID del plan (puede venir en diferentes formatos)
                  const planId = plan.id || plan.Id || plan.ID;
                  
                  if (!planId) {
                    Swal.fire({
                      title: 'Error',
                      text: 'No se pudo obtener el ID del plan nutricional',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                    return;
                  }
                  
                  console.log('Eliminando plan nutricional con ID:', planId);
                  await apiService.eliminarPlanNutricional(planId);
                  Swal.fire({
                    title: 'Eliminado',
                    text: 'Plan nutricional eliminado correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#F34949',
                  });
                  cargarPlanes(currentPage, filtro);
                } catch (error) {
                  console.error('Error al eliminar plan nutricional:', error);
                  if (!error.redirectToLogin) {
                    // Extraer el mensaje del error del backend
                    let errorMessage = 'Error al eliminar el plan nutricional';
                    if (error.message) {
                      errorMessage = error.message;
                    } else if (error.response?.data?.message) {
                      errorMessage = error.response.data.message;
                    } else if (error.response?.data?.Message) {
                      errorMessage = error.response.data.Message;
                    } else if (error.response?.data) {
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
                }
              }
            });
          }}
          canDelete={(plan) => {
            // No permitir eliminar si solo hay un plan nutricional
            return planes.length > 1;
          }}
          pageSize={pageSize}
          enablePagination={true}
        />
      </div>
    </div>
  );
};

export default PlanNutricional;
