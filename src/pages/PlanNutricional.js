import React, { useState, useEffect, useCallback } from 'react';
import { planesNutricionalesService } from '../services/planesNutricionalesService';
import { catalogosService } from '../services/catalogosService';
import { useSmartTime } from '../contexts/SmartTimeContext';
import { clearApiCache } from '../services/apiClient';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { addPdfReportHeader } from '../utils/pdfReportHeader';
import { createExcelSheetWithHeaderXLSX } from '../utils/excelReportHeader';
import './Usuarios.css';

const PlanNutricional = () => {
  const [planes, setPlanes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [planEditando, setPlanEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('activo'); // 'activo' o 'inactivo'
  const [vista, setVista] = useState('lista'); // 'lista' o 'editar' o 'crear'
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    descripcion: '',
  });

  // SmartTime: si está habilitado, se muestra campo por defecto y opción de establecerlo (validado al entrar)
  const { smarTimeHabilitado } = useSmartTime();

  // Cargar planes nutricionales usando /api/plannutricional/lista con paginación
  const cargarPlanes = useCallback(async (page = 1, searchTerm = '', mostrarActivos = true) => {
    try {
      setIsLoading(true);
      
      // Limpiar caché antes de cargar para asegurar datos frescos
      clearApiCache();
      
      // Si hay término de búsqueda, usar pageSize=100 y page=1 para obtener todos los resultados
      // Si no hay búsqueda, usar la paginación normal
      const pageToUse = (searchTerm && searchTerm.trim()) ? 1 : page;
      const pageSizeToUse = (searchTerm && searchTerm.trim()) ? 100 : pageSize;
      
      const data = await planesNutricionalesService.getPlanesNutricionalesLista(pageToUse, pageSizeToUse, searchTerm, mostrarActivos);
      
      // El backend devuelve estructura paginada: { page, pageSize, totalItems, totalPages, items: [...] }
      let planesData = [];
      
      if (data.items && Array.isArray(data.items)) {
        planesData = data.items;
      } else if (Array.isArray(data)) {
        planesData = data;
      } else if (data.data && Array.isArray(data.data)) {
        planesData = data.data;
      }
      
      // Normalizar los datos del DTO (PascalCase a minúsculas) para consistencia
      // El backend devuelve Nombre, Descripcion, Activo, Deletemark
      const planesNormalizados = planesData.map(plan => ({
        ...plan,
        id: plan.Id || plan.id,
        nombre: plan.Nombre || plan.nombre || '',
        descripcion: plan.Descripcion || plan.descripcion || '',
        // Normalizar el campo activo: puede venir como Activo (PascalCase), activo (camelCase), o Deletemark (inverso)
        activo: plan.Activo !== undefined ? plan.Activo : 
               (plan.activo !== undefined ? plan.activo : 
               (plan.Deletemark !== undefined ? !plan.Deletemark : 
               (plan.deletemark !== undefined ? !plan.deletemark : true))),
        // Mantener también los campos originales para compatibilidad
        Activo: plan.Activo !== undefined ? plan.Activo : 
               (plan.activo !== undefined ? plan.activo : 
               (plan.Deletemark !== undefined ? !plan.Deletemark : 
               (plan.deletemark !== undefined ? !plan.deletemark : true))),
        is_default: plan.Is_default === 1 || plan.Is_default === true || plan.is_default === 1 || plan.is_default === true || plan.IsDefault === 1 || plan.IsDefault === true,
      }));
      
      setPlanes(planesNormalizados);
    } catch (error) {
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
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Cuando cambia el filtro o filtroActivo, resetear a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, filtroActivo]);

  // Cargar planes cuando cambia la página, el filtro o el filtroActivo
  useEffect(() => {
    const soloActivos = filtroActivo === 'activo';
    cargarPlanes(currentPage, filtro, soloActivos);
  }, [currentPage, filtro, filtroActivo, cargarPlanes]);

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
        await planesNutricionalesService.actualizarPlanNutricional(planData);
        Swal.fire({
          title: 'Éxito',
          text: 'Plan nutricional actualizado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      } else {
        await planesNutricionalesService.crearPlanNutricional(planData);
        Swal.fire({
          title: 'Éxito',
          text: 'Plan nutricional creado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      }

      handleVolverALista();
      const soloActivos = filtroActivo === 'activo';
      cargarPlanes(currentPage, filtro, soloActivos);
    } catch (error) {
      
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

  // Exportar a PDF (todos los datos, sin paginación)
  const handleExportarPDF = async () => {
    try {
      const soloActivos = filtroActivo === 'activo';
      const data = await planesNutricionalesService.getPlanesNutricionalesLista(1, 99999, filtro, soloActivos);
      const planesData = data?.items && Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []));
      const planesParaExportar = planesData.map(plan => ({
        ...plan,
        nombre: plan.Nombre || plan.nombre || plan.nombre_plan || plan.NombrePlan || '',
        descripcion: plan.Descripcion || plan.descripcion || plan.descripcion_plan || plan.DescripcionPlan || '',
        is_default: plan.Is_default === 1 || plan.Is_default === true || plan.is_default === 1 || plan.is_default === true || plan.IsDefault === 1 || plan.IsDefault === true,
      }));

      const doc = new jsPDF();
      const startY = await addPdfReportHeader(doc, 'Listado de Planes Nutricionales');

      const tableData = planesParaExportar.map(plan => [
        (smarTimeHabilitado && plan.is_default ? (plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '-') + ' (campo por defecto)' : (plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '-')),
        plan.descripcion || plan.Descripcion || plan.descripcion_plan || plan.DescripcionPlan || '-'
      ]);
      
      doc.autoTable({
        startY,
        head: [['Nombre', 'Descripción']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
      
      const fileName = `planesnutricionales_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      Swal.fire({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato PDF',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: true,
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

  // Exportar a Excel (todos los datos, sin paginación)
  const handleExportarExcel = async () => {
    try {
      const soloActivos = filtroActivo === 'activo';
      const data = await planesNutricionalesService.getPlanesNutricionalesLista(1, 99999, filtro, soloActivos);
      const planesData = data?.items && Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []));
      const planesParaExportar = planesData.map(plan => ({
        ...plan,
        nombre: plan.Nombre || plan.nombre || plan.nombre_plan || plan.NombrePlan || '',
        descripcion: plan.Descripcion || plan.descripcion || plan.descripcion_plan || plan.DescripcionPlan || '',
        is_default: plan.Is_default === 1 || plan.Is_default === true || plan.is_default === 1 || plan.is_default === true || plan.IsDefault === 1 || plan.IsDefault === true,
      }));
      const datosExcel = planesParaExportar.map(plan => ({
        'Nombre': (smarTimeHabilitado && plan.is_default ? (plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '') + ' (campo por defecto)' : (plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '')),
        'Descripción': plan.descripcion || plan.Descripcion || plan.descripcion_plan || plan.DescripcionPlan || ''
      }));

      const ws = createExcelSheetWithHeaderXLSX(datosExcel, 'Listado de Planes Nutricionales');
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
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: true,
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
              {vista === 'editar' ? 'Editar Perfil Nutricional' : 'Nuevo Perfil Nutricional'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para creación */}
        {vista === 'crear' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Creando nuevo plan nutricional - Complete los campos obligatorios para guardar.</span>
          </div>
        )}

        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-pencil-alt" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Editando plan nutricional - Modifique los campos necesarios y guarde los cambios.</span>
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
                        placeholder="Ingrese el nombre del perfil nutricional"
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
      {/* Barra negra con título Planes Nutricionales */}
      <div className="page-title-bar">
        <h3>
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
          
          {/* Filtro de estado Activo/Inactivo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ margin: 0, fontSize: '0.9rem', color: '#495057', whiteSpace: 'nowrap' }}>
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
            {
              key: 'nombre',
              field: 'nombre',
              label: 'Nombre',
              render: (val, plan) => {
                if (!plan) return '-';
                const esDefault = plan.is_default === 1 || plan.is_default === true || plan.Is_default === 1 || plan.Is_default === true || plan.isDefault === 1 || plan.isDefault === true;
                const nombre = plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || '-';
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    {smarTimeHabilitado && esDefault && (
                      <span className="badge" style={{ backgroundColor: '#e6a23c', color: 'white', fontSize: '0.7rem', fontWeight: 'normal', padding: '0.2rem 0.4rem' }} title="Campo por defecto">
                        <i className="fa fa-star" aria-hidden="true"></i>
                      </span>
                    )}
                    {nombre}
                  </span>
                );
              },
            },
            { key: 'descripcion', field: 'descripcion', label: 'Descripción', render: (value, plan) => {
              if (!plan) return '-';
              return plan.descripcion || plan.Descripcion || plan.descripcion_plan || plan.DescripcionPlan || '-';
            }},
          ]}
          data={planes}
          isLoading={isLoading}
          emptyMessage={
            filtro 
              ? 'No se encontraron planes nutricionales que coincidan con la búsqueda' 
              : filtroActivo === 'activo' 
                ? 'No hay planes nutricionales registrados Activos' 
                : 'No hay planes nutricionales registrados Inactivos'
          }
          onEdit={handleEditarPlan}
          canEdit={(plan) => {
            // Si estamos en el filtro de "Inactivos", ningún plan se puede editar
            if (filtroActivo === 'inactivo') {
              return false;
            }
            
            // Si estamos en el filtro de "Activos", todos los planes se pueden editar
            if (filtroActivo === 'activo') {
              return true;
            }
            
            // Por defecto, verificar el estado del plan
            // Verificar múltiples campos posibles para asegurar detección correcta
            const rawActivo = plan.activo !== undefined ? plan.activo :
                             plan.isActive !== undefined ? plan.isActive :
                             plan.Activo !== undefined ? plan.Activo :
                             plan.deletemark !== undefined ? !plan.deletemark :
                             plan.Deletemark !== undefined ? !plan.Deletemark :
                             plan.deleteMark !== undefined ? !plan.deleteMark :
                             undefined;
            let isInactivo = false;
            if (rawActivo !== undefined) {
              isInactivo = rawActivo === false ||
                          rawActivo === 0 ||
                          rawActivo === 'false' ||
                          rawActivo === '0' ||
                          String(rawActivo).toLowerCase() === 'false';
            }
            
            return !isInactivo; // Solo se puede editar si NO está inactivo
          }}
          onDelete={(plan) => {
            // No permitir eliminar si es campo por defecto (solo cuando SmartTime está habilitado)
            const esDefault = smarTimeHabilitado && (plan.is_default === 1 || plan.is_default === true || plan.Is_default === 1 || plan.Is_default === true);
            if (esDefault) {
              Swal.fire({
                title: 'No permitido',
                text: 'Este campo está por defecto, no puede darse de baja.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949',
              });
              return;
            }
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea dar de baja el plan nutricional ${plan.nombre || plan.Nombre || plan.nombre_plan || plan.NombrePlan || 'este plan'}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, dar de baja',
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
                  
                  await planesNutricionalesService.eliminarPlanNutricional(planId);
                  Swal.fire({
                    title: 'Éxito',
                    text: 'Plan nutricional dado de baja correctamente',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    allowOutsideClick: true,
                  });
                  const soloActivos = filtroActivo === 'activo';
                  cargarPlanes(currentPage, filtro, soloActivos);
                } catch (error) {
                  if (!error.redirectToLogin) {
                    // Extraer el mensaje del error del backend
                    let errorMessage = 'Error al dar de baja el plan nutricional';
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
            // Usar el campo normalizado 'activo' que ya viene del mapeo
            // Si estamos en el filtro de "Activos", todos los planes mostrados están activos
            if (filtroActivo === 'activo') {
              return true;
            }
            // Si estamos en el filtro de "Inactivos", no mostrar el botón de eliminar
            if (filtroActivo === 'inactivo') {
              return false;
            }
            // Por defecto, usar el campo normalizado 'activo'
            const isActivo = plan.activo === true || plan.activo === 1 || plan.activo === 'true' || plan.activo === '1';
            return isActivo; // Solo se puede eliminar si está activo
          }}
          renderActions={(plan) => {
            // Si estamos en el filtro de "Inactivos", mostrar el botón verde de activar
            if (filtroActivo === 'inactivo') {
              // Todos los planes mostrados están inactivos, mostrar botón verde
              return (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    Swal.fire({
                      title: '¿Está seguro?',
                      text: `¿Desea activar el plan nutricional ${plan.nombre || plan.Nombre || 'este plan'}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#28a745',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: 'Sí, activar',
                      cancelButtonText: 'Cancelar',
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          const planId = plan.id || plan.Id || plan.ID;
                          await planesNutricionalesService.activarPlanNutricional(planId);
                          Swal.fire({
                            title: 'Activado',
                            text: 'Plan nutricional activado correctamente',
                            icon: 'success',
                            timer: 3000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            allowOutsideClick: true,
                          });
                          const soloActivos = filtroActivo === 'activo';
                          cargarPlanes(currentPage, filtro, soloActivos);
                        } catch (error) {
                          if (!error.redirectToLogin) {
                            Swal.fire({
                              title: 'Error',
                              text: error.message || 'Error al activar el plan nutricional',
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
            
            // Si está activo y no es por defecto, mostrar botón estrella para establecer como por defecto
            const esDefault = plan.is_default === 1 || plan.is_default === true || plan.Is_default === 1 || plan.Is_default === true;
            if (smarTimeHabilitado && !esDefault) {
              return (
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    Swal.fire({
                      title: 'Campo por defecto',
                      text: `¿Desea establecer "${plan.nombre || plan.Nombre || 'este plan'}" como plan nutricional por defecto?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#F34949',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: 'Sí, establecer',
                      cancelButtonText: 'Cancelar',
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          const planId = plan.id || plan.Id || plan.ID;
                          await catalogosService.setDefault('plannutricional', planId);
                          Swal.fire({
                            title: 'Establecido',
                            text: 'Plan nutricional establecido como por defecto',
                            icon: 'success',
                            timer: 3000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            allowOutsideClick: true,
                          });
                          const soloActivos = filtroActivo === 'activo';
                          cargarPlanes(currentPage, filtro, soloActivos);
                        } catch (error) {
                          if (!error.redirectToLogin) {
                            Swal.fire({
                              title: 'Error',
                              text: error.message || 'Error al establecer el plan nutricional por defecto',
                              icon: 'error',
                              confirmButtonText: 'Aceptar',
                              confirmButtonColor: '#F34949',
                            });
                          }
                        }
                      }
                    });
                  }}
                  title="Establecer como por defecto"
                  style={{ width: '31px', height: '31px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e6a23c', color: 'white', borderColor: '#e6a23c', flexShrink: 0 }}
                >
                  <i className="fa fa-star" aria-hidden="true"></i>
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

export default PlanNutricional;
