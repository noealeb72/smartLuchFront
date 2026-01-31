import React, { useState, useEffect, useCallback } from 'react';
import { jerarquiasService } from '../services/jerarquiasService';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Usuarios.css';

const Jerarquia = () => {
  const [jerarquias, setJerarquias] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jerarquiaEditando, setJerarquiaEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('activo'); // 'activo' o 'inactivo'
  const [vista, setVista] = useState('lista'); // 'lista' o 'editar' o 'crear'
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [, setTotalPages] = useState(1);
  const [, setTotalItems] = useState(0);

  // Jerarquías protegidas que no se pueden eliminar ni modificar el nombre
  const jerarquiasProtegidas = ['Admin', 'Cocina', 'Comensal', 'Gerencia'];
  
  // Verificar si una jerarquía está protegida
  const esJerarquiaProtegida = (jerarquia) => {
    const nombre = jerarquia?.nombre || jerarquia?.Nombre || '';
    return jerarquiasProtegidas.includes(nombre);
  };

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    bonificacion: '0',
  });

  // Cargar jerarquías usando /api/jerarquia/lista con paginación
  const cargarJerarquias = useCallback(async (page = 1, searchTerm = '', mostrarActivos = true) => {
    try {
      setIsLoading(true);
      
      // Si hay término de búsqueda, usar pageSize=100 y page=1 para obtener todos los resultados
      // Si no hay búsqueda, usar la paginación normal
      const pageToUse = (searchTerm && searchTerm.trim()) ? 1 : page;
      const pageSizeToUse = (searchTerm && searchTerm.trim()) ? 100 : pageSize;
      
      const data = await jerarquiasService.getJerarquiasLista(pageToUse, pageSizeToUse, searchTerm, mostrarActivos);
      
      // El backend devuelve estructura paginada: { page, pageSize, totalItems, totalPages, items: [...] }
      let jerarquiasData = [];
      
      if (data.items && Array.isArray(data.items)) {
        jerarquiasData = data.items;
      } else if (Array.isArray(data)) {
        jerarquiasData = data;
      } else if (data.data && Array.isArray(data.data)) {
        jerarquiasData = data.data;
      }
      
      // Normalizar los datos del DTO (PascalCase a camelCase) para consistencia
      const jerarquiasNormalizadas = jerarquiasData.map(jerarquia => ({
        id: jerarquia.Id || jerarquia.id || jerarquia.ID || null,
        nombre: jerarquia.Nombre || jerarquia.nombre || '',
        descripcion: jerarquia.Descripcion || jerarquia.descripcion || '',
        bonificacion: jerarquia.Bonificacion !== undefined ? jerarquia.Bonificacion : (jerarquia.bonificacion !== undefined ? jerarquia.bonificacion : null),
        activo: jerarquia.Activo !== undefined ? jerarquia.Activo : (jerarquia.activo !== undefined ? jerarquia.activo : (jerarquia.Deletemark !== undefined ? !jerarquia.Deletemark : true)),
        // Mantener también los valores originales para compatibilidad
        Nombre: jerarquia.Nombre || jerarquia.nombre || '',
        Descripcion: jerarquia.Descripcion || jerarquia.descripcion || '',
        Bonificacion: jerarquia.Bonificacion !== undefined ? jerarquia.Bonificacion : (jerarquia.bonificacion !== undefined ? jerarquia.bonificacion : null),
      }));
      
      // Usar los valores de paginación del backend
      const totalItemsBackend = data.totalItems || jerarquiasNormalizadas.length;
      const totalPagesBackend = data.totalPages || Math.ceil(totalItemsBackend / pageSize);
      
      setJerarquias(jerarquiasNormalizadas);
      setTotalPages(totalPagesBackend);
      setTotalItems(totalItemsBackend);
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar las jerarquías',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      
      setJerarquias([]);
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

  // Cargar jerarquías cuando cambia la página, el filtro o el filtroActivo
  useEffect(() => {
    const soloActivos = filtroActivo === 'activo';
    cargarJerarquias(currentPage, filtro, soloActivos);
  }, [currentPage, filtro, filtroActivo, cargarJerarquias]);

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

  // Guardar jerarquía (crear o actualizar)
  const handleGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setIsLoading(true);

      // Si es una jerarquía protegida, usar el nombre original (no permitir modificar)
      let nombreFinal = formData.nombre.trim();
      if (jerarquiaEditando && esJerarquiaProtegida(jerarquiaEditando)) {
        // Mantener el nombre original de la jerarquía protegida
        nombreFinal = jerarquiaEditando.nombre || jerarquiaEditando.Nombre || formData.nombre.trim();
      }

      // Preparar datos para el backend
      // El backend espera Bonificacion como decimal (no null), usar 0 si está vacío
      const bonificacionValue = formData.bonificacion && formData.bonificacion.trim() !== '' 
        ? parseFloat(formData.bonificacion) 
        : 0;
      
      const jerarquiaData = {
        id: formData.id,
        nombre: nombreFinal,
        descripcion: formData.descripcion?.trim() || null,
        bonificacion: isNaN(bonificacionValue) ? 0 : bonificacionValue,
      };

      if (jerarquiaEditando) {
        await jerarquiasService.actualizarJerarquia(jerarquiaData);
        Swal.fire({
          title: 'Éxito',
          text: 'Jerarquía actualizada correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      } else {
        await jerarquiasService.crearJerarquia(jerarquiaData);
        Swal.fire({
          title: 'Éxito',
          text: 'Jerarquía creada correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      }

      handleVolverALista();
      const soloActivos = filtroActivo === 'activo';
      cargarJerarquias(currentPage, filtro, soloActivos);
    } catch (error) {
      
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al guardar la jerarquía',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nueva jerarquía
  const handleCrearJerarquia = () => {
    setJerarquiaEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
      bonificacion: '0',
    });
    setVista('crear');
  };

  // Editar jerarquía
  const handleEditarJerarquia = (jerarquia) => {
    setJerarquiaEditando(jerarquia);
    
    // Obtener valores con múltiples variantes de nombres (PascalCase y camelCase)
    const jerarquiaId = jerarquia.id || jerarquia.Id || jerarquia.ID || null;
    const nombre = jerarquia.nombre || jerarquia.Nombre || '';
    const descripcion = jerarquia.descripcion || jerarquia.Descripcion || '';
    const bonificacion = jerarquia.bonificacion !== undefined && jerarquia.bonificacion !== null 
      ? jerarquia.bonificacion 
      : (jerarquia.Bonificacion !== undefined && jerarquia.Bonificacion !== null 
          ? jerarquia.Bonificacion 
          : null);
    
    setFormData({
      id: jerarquiaId,
      nombre: nombre,
      descripcion: descripcion,
      bonificacion: bonificacion !== null && bonificacion !== undefined ? String(bonificacion) : '0',
    });
    setVista('editar');
  };

  // Volver a la lista
  const handleVolverALista = () => {
    setJerarquiaEditando(null);
    setFormData({
      id: null,
      nombre: '',
      descripcion: '',
      bonificacion: '0',
    });
    setVista('lista');
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Listado de Jerarquías', 14, 15);
      
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Exportado el: ${fecha}`, 14, 22);
      
      const tableData = jerarquias.map(jerarquia => [
        jerarquia.nombre || '-',
        jerarquia.descripcion || '-'
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
      
      const fileName = `jerarquias_${new Date().toISOString().split('T')[0]}.pdf`;
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
      const datosExcel = jerarquias.map(jerarquia => ({
        'Nombre': jerarquia.nombre || '',
        'Descripción': jerarquia.descripcion || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jerarquías');
      
      const colWidths = [
        { wch: 20 },
        { wch: 40 }
      ];
      ws['!cols'] = colWidths;
      
      const fileName = `jerarquias_${new Date().toISOString().split('T')[0]}.xlsx`;
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
              {vista === 'editar' ? 'Editar Jerarquía' : 'Nueva Jerarquía'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para creación */}
        {vista === 'crear' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Creando nueva jerarquía - Complete los campos obligatorios para guardar.</span>
          </div>
        )}

        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-pencil-alt" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Editando jerarquía - Modifique los campos necesarios y guarde los cambios.</span>
          </div>
        )}

        <div className="usuarios-form-container">
          <form>
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa fa-sitemap mr-2"></i>
                <span>Información de la Jerarquía</span>
              </div>
              <div className="form-section-content">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="nombre">
                        Nombre <span style={{ color: '#F34949' }}>*</span>
                        {vista === 'editar' && jerarquiaEditando && esJerarquiaProtegida(jerarquiaEditando) && (
                          <span style={{ fontSize: '0.875rem', color: '#6c757d', marginLeft: '0.5rem', fontStyle: 'italic' }}>
                            (No se puede modificar)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre || ''}
                        onChange={handleInputChange}
                        required
                        disabled={vista === 'editar' && jerarquiaEditando && esJerarquiaProtegida(jerarquiaEditando)}
                        placeholder="Ingrese el nombre de la jerarquía"
                        style={vista === 'editar' && jerarquiaEditando && esJerarquiaProtegida(jerarquiaEditando) ? {
                          backgroundColor: '#e9ecef',
                          cursor: 'not-allowed'
                        } : {}}
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
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="bonificacion">Bonificación (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="form-control"
                        id="bonificacion"
                        name="bonificacion"
                        value={formData.bonificacion || ''}
                        onChange={handleInputChange}
                        placeholder="Ingrese el porcentaje de bonificación (opcional)"
                      />
                      <small className="form-text text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        <i className="fa fa-info-circle mr-1"></i>
                        Este porcentaje de bonificación se aplicará a los usuarios de esta jerarquía al momento de consumir un plato en el comedor.
                      </small>
                      <small className="form-text text-muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem', fontStyle: 'italic', display: 'block' }}>
                        <strong>Nota:</strong> La bonificación aplicada dependerá de la jerarquía asignada al comensal.
                      </small>
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
      {/* Barra negra con título Jerarquías */}
      <div className="page-title-bar">
        <h3>
          <i className="fa fa-sitemap mr-2" aria-hidden="true"></i>Jerarquías
        </h3>
      </div>
      
      <div style={{ paddingTop: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Botón Agregar */}
        <div style={{ marginBottom: '1rem' }}>
          <AgregarButton onClick={handleCrearJerarquia} />
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
              disabled={jerarquias.length === 0}
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
              disabled={jerarquias.length === 0}
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

        {/* Tabla de jerarquías */}
        <DataTable
          columns={[
            { key: 'nombre', field: 'nombre', label: 'Nombre' },
            { key: 'descripcion', field: 'descripcion', label: 'Descripción' },
            { 
              key: 'bonificacion', 
              field: 'bonificacion', 
              label: 'Bonificación',
              render: (value, row) => {
                const bonificacion = row?.bonificacion !== undefined && row?.bonificacion !== null 
                  ? row.bonificacion 
                  : (row?.Bonificacion !== undefined && row?.Bonificacion !== null 
                      ? row.Bonificacion 
                      : null);
                if (bonificacion !== null && bonificacion !== undefined) {
                  const valor = parseFloat(bonificacion);
                  if (isNaN(valor)) {
                    return '-';
                  }
                  // Si es 0 o 0.00, mostrar solo "0%"
                  if (valor === 0) {
                    return '0%';
                  }
                  // Si es un número entero, mostrarlo sin decimales
                  if (Number.isInteger(valor)) {
                    return `${valor}%`;
                  }
                  // Si tiene decimales, mostrarlos con 2 decimales
                  return `${valor.toFixed(2)}%`;
                }
                return '-';
              }
            },
          ]}
          data={jerarquias}
          isLoading={isLoading}
          emptyMessage={
            filtro 
              ? 'No se encontraron jerarquías que coincidan con la búsqueda' 
              : filtroActivo === 'activo' 
                ? 'No hay jerarquías registradas Activas' 
                : 'No hay jerarquías registradas Inactivas'
          }
          onEdit={handleEditarJerarquia}
          canEdit={(jerarquia) => {
            // No permitir editar si la jerarquía está inactiva
            const rawActivo = jerarquia.activo !== undefined ? jerarquia.activo :
                             jerarquia.isActive !== undefined ? jerarquia.isActive :
                             jerarquia.Activo !== undefined ? jerarquia.Activo :
                             jerarquia.deletemark !== undefined ? !jerarquia.deletemark :
                             jerarquia.Deletemark !== undefined ? !jerarquia.Deletemark :
                             jerarquia.deleteMark !== undefined ? !jerarquia.deleteMark :
                             undefined;
            let isInactivo = false;
            if (rawActivo !== undefined) {
              isInactivo = rawActivo === false ||
                          rawActivo === 0 ||
                          rawActivo === 'false' ||
                          rawActivo === '0' ||
                          String(rawActivo).toLowerCase() === 'false';
            }
            // Solo permitir editar si está activa
            return !isInactivo;
          }}
          onDelete={(jerarquia) => {
            // Verificar si es una jerarquía protegida
            if (esJerarquiaProtegida(jerarquia)) {
              Swal.fire({
                title: 'No permitido',
                text: `No se puede dar de baja la jerarquía "${jerarquia.nombre || jerarquia.Nombre}" porque es una jerarquía del sistema.`,
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949',
              });
              return;
            }
            
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea dar de baja la jerarquía ${jerarquia.nombre || jerarquia.Nombre}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, dar de baja',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await jerarquiasService.eliminarJerarquia(jerarquia.id);
                  Swal.fire({
                    title: 'Éxito',
                    text: 'Jerarquía dada de baja correctamente',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    allowOutsideClick: true,
                  });
                  const soloActivos = filtroActivo === 'activo';
                  cargarJerarquias(currentPage, filtro, soloActivos);
                } catch (error) {
                  if (!error.redirectToLogin) {
                    Swal.fire({
                      title: 'Error',
                      text: error.message || 'Error al dar de baja la jerarquía',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                  }
                }
              }
            });
          }}
          canDelete={(jerarquia) => {
            // No permitir eliminar jerarquías protegidas
            if (esJerarquiaProtegida(jerarquia)) {
              return false;
            }
            // No permitir eliminar si la jerarquía está inactiva
            const rawActivo = jerarquia.activo !== undefined ? jerarquia.activo :
                             jerarquia.isActive !== undefined ? jerarquia.isActive :
                             jerarquia.Activo !== undefined ? jerarquia.Activo :
                             jerarquia.deletemark !== undefined ? !jerarquia.deletemark :
                             jerarquia.Deletemark !== undefined ? !jerarquia.Deletemark :
                             jerarquia.deleteMark !== undefined ? !jerarquia.deleteMark :
                             undefined;
            let isInactivo = false;
            if (rawActivo !== undefined) {
              isInactivo = rawActivo === false ||
                          rawActivo === 0 ||
                          rawActivo === 'false' ||
                          rawActivo === '0' ||
                          String(rawActivo).toLowerCase() === 'false';
            }
            return !isInactivo;
          }}
          renderActions={(jerarquia) => {
            const rawActivo = jerarquia.activo !== undefined ? jerarquia.activo :
                             jerarquia.isActive !== undefined ? jerarquia.isActive :
                             jerarquia.Activo !== undefined ? jerarquia.Activo :
                             jerarquia.deletemark !== undefined ? !jerarquia.deletemark :
                             jerarquia.Deletemark !== undefined ? !jerarquia.Deletemark :
                             jerarquia.deleteMark !== undefined ? !jerarquia.deleteMark :
                             undefined;
            let isInactivo = false;
            if (rawActivo !== undefined) {
              isInactivo = rawActivo === false ||
                          rawActivo === 0 ||
                          rawActivo === 'false' ||
                          rawActivo === '0' ||
                          String(rawActivo).toLowerCase() === 'false';
            }
            if (isInactivo) {
              return (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    Swal.fire({
                      title: '¿Está seguro?',
                      text: `¿Desea activar la jerarquía ${jerarquia.nombre}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#28a745',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: 'Sí, activar',
                      cancelButtonText: 'Cancelar',
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          const jerarquiaId = jerarquia.id || jerarquia.Id || jerarquia.ID;
                          await jerarquiasService.activarJerarquia(jerarquiaId);
                          Swal.fire({
                            title: 'Activado',
                            text: 'Jerarquía activada correctamente',
                            icon: 'success',
                            timer: 3000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            allowOutsideClick: true,
                          });
                          const soloActivos = filtroActivo === 'activo';
                          cargarJerarquias(currentPage, filtro, soloActivos);
                        } catch (error) {
                          if (!error.redirectToLogin) {
                            Swal.fire({
                              title: 'Error',
                              text: error.message || 'Error al activar la jerarquía',
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

export default Jerarquia;
