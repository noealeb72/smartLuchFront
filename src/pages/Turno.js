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

const Turno = () => {
  const [turnos, setTurnos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [turnoEditando, setTurnoEditando] = useState(null);
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
    hora_desde: '',
    hora_hasta: '',
  });

  // Cargar turnos con paginación y búsqueda
  const cargarTurnos = useCallback(async (page = 1, searchTerm = '') => {
    try {
      setIsLoading(true);
      const data = await apiService.getTurnosLista(page, pageSize, searchTerm);
      
      // Función auxiliar para convertir hora a minutos para comparación numérica
      const horaAMinutos = (horaString) => {
        if (!horaString) return Infinity; // Los turnos sin hora van al final
        if (typeof horaString === 'string') {
          const parts = horaString.split(':');
          if (parts.length >= 2) {
            const horas = parseInt(parts[0]) || 0;
            const minutos = parseInt(parts[1]) || 0;
            return horas * 60 + minutos;
          }
        }
        return Infinity;
      };

      // Función auxiliar para ordenar turnos por hora desde y hora hasta
      const ordenarTurnos = (turnosArray) => {
        return [...turnosArray].sort((a, b) => {
          // Obtener hora_desde de ambos turnos
          const horaDesdeA = a.hora_desde || a.horaDesde || a.horadesde || a.HoraDesde || '';
          const horaDesdeB = b.hora_desde || b.horaDesde || b.horadesde || b.HoraDesde || '';
          
          // Convertir a minutos para comparación numérica
          const minutosDesdeA = horaAMinutos(horaDesdeA);
          const minutosDesdeB = horaAMinutos(horaDesdeB);
          
          // Comparar primero por hora_desde
          if (minutosDesdeA !== minutosDesdeB) {
            return minutosDesdeA - minutosDesdeB;
          }
          
          // Si hora_desde es igual, comparar por hora_hasta
          const horaHastaA = a.hora_hasta || a.horaHasta || a.horahasta || a.HoraHasta || '';
          const horaHastaB = b.hora_hasta || b.horaHasta || b.horahasta || b.HoraHasta || '';
          
          const minutosHastaA = horaAMinutos(horaHastaA);
          const minutosHastaB = horaAMinutos(horaHastaB);
          
          return minutosHastaA - minutosHastaB;
        });
      };

      if (Array.isArray(data)) {
        // Si el backend devuelve un array directo, calcular paginación del lado del cliente
        const turnosOrdenados = ordenarTurnos(data);
        const totalItemsCount = turnosOrdenados.length;
        const calculatedTotalPages = Math.ceil(totalItemsCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = turnosOrdenados.slice(startIndex, endIndex);
        
        setTurnos(paginatedData);
        setTotalPages(calculatedTotalPages);
        setTotalItems(totalItemsCount);
      } else if (data.data && Array.isArray(data.data)) {
        const turnosOrdenados = ordenarTurnos(data.data);
        setTurnos(turnosOrdenados);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || data.total || data.data.length);
      } else if (data.items && Array.isArray(data.items)) {
        const turnosOrdenados = ordenarTurnos(data.items);
        setTurnos(turnosOrdenados);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || data.total || data.items.length);
      } else {
        setTurnos([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error);
      
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los turnos',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      
      setTurnos([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Cargar turnos cuando cambia la página o el filtro
  useEffect(() => {
    cargarTurnos(currentPage, filtro);
  }, [currentPage, filtro, cargarTurnos]);

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

    if (!formData.hora_desde) {
      addError('La hora de inicio es requerida', 'hora_desde');
    }

    if (!formData.hora_hasta) {
      addError('La hora de fin es requerida', 'hora_hasta');
    }

    if (formData.hora_desde && formData.hora_hasta) {
      // Convertir horas a minutos para comparación numérica
      const convertirHoraAMinutos = (horaString) => {
        if (!horaString) return 0;
        const parts = horaString.split(':');
        if (parts.length >= 2) {
          const horas = parseInt(parts[0]) || 0;
          const minutos = parseInt(parts[1]) || 0;
          return horas * 60 + minutos;
        }
        return 0;
      };
      
      const minutosDesde = convertirHoraAMinutos(formData.hora_desde);
      const minutosHasta = convertirHoraAMinutos(formData.hora_hasta);
      
      if (minutosDesde >= minutosHasta) {
        addError('La hora de inicio debe ser menor que la hora de fin', 'hora_desde');
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

  // Guardar turno (crear o actualizar)
  const handleGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setIsLoading(true);

      // Asegurar que las horas tengan el formato HH:mm:ss para el backend
      const formatearHoraParaBackend = (horaString) => {
        if (!horaString) return '';
        // Si ya tiene segundos, devolverlo tal cual
        if (horaString.split(':').length === 3) {
          return horaString;
        }
        // Si solo tiene HH:mm, agregar :00 para los segundos
        if (horaString.split(':').length === 2) {
          return `${horaString}:00`;
        }
        return horaString;
      };

      // El backend espera un DTO con los campos en formato PascalCase (común en C#)
      // Asegurar que el ID se envíe correctamente cuando se está editando
      const turnoId = turnoEditando 
        ? (formData.id || turnoEditando.id || turnoEditando.Id || turnoEditando.ID)
        : null;
      
      const turnoData = {
        Id: turnoId ? parseInt(turnoId) : null,
        Nombre: formData.nombre.trim(),
        HoraDesde: formatearHoraParaBackend(formData.hora_desde),
        HoraHasta: formatearHoraParaBackend(formData.hora_hasta),
      };

      // Debug: verificar valores antes de enviar
      console.log('DEBUG turnoData antes de enviar:', {
        turnoEditando,
        formData_id: formData.id,
        turnoId,
        turnoData,
        hora_desde_original: formData.hora_desde,
        hora_hasta_original: formData.hora_hasta,
        hora_desde_formateada: turnoData.HoraDesde,
        hora_hasta_formateada: turnoData.HoraHasta,
      });

      if (turnoEditando) {
        await apiService.actualizarTurno(turnoData);
        Swal.fire({
          title: 'Éxito',
          text: 'Turno actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      } else {
        await apiService.crearTurno(turnoData);
        Swal.fire({
          title: 'Éxito',
          text: 'Turno creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }

      handleVolverALista();
      cargarTurnos(currentPage, filtro);
    } catch (error) {
      console.error('Error al guardar turno:', error);
      
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al guardar el turno',
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

  // Crear nuevo turno
  const handleCrearTurno = () => {
    setTurnoEditando(null);
    setFormData({
      id: null,
      nombre: '',
      hora_desde: '',
      hora_hasta: '',
    });
    setVista('crear');
  };

  // Editar turno
  const handleEditarTurno = (turno) => {
    setTurnoEditando(turno);
    
    // Formatear horas para el input type="time" (debe ser HH:mm)
    const formatearHoraParaInput = (horaValue) => {
      if (!horaValue) return '';
      
      // Si es un objeto (TimeSpan de C#), extraer horas y minutos
      if (typeof horaValue === 'object' && horaValue !== null) {
        const horas = horaValue.hours || horaValue.Hours || horaValue.h || 0;
        const minutos = horaValue.minutes || horaValue.Minutes || horaValue.m || 0;
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
      }
      
      // Si es string, parsear y formatear
      if (typeof horaValue === 'string') {
        // Remover espacios
        const horaLimpia = horaValue.trim();
        
        // Si contiene ':', extraer solo horas y minutos
        if (horaLimpia.includes(':')) {
          const parts = horaLimpia.split(':');
          const horas = parseInt(parts[0]) || 0;
          const minutos = parseInt(parts[1]) || 0;
          // Asegurar formato HH:mm con padding
          return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
        }
        
        // Si no tiene ':', intentar parsear como número o devolver vacío
        return '';
      }
      
      return '';
    };
    
    // Obtener valores de hora con múltiples variantes de nombres
    const horaDesdeRaw = turno.hora_desde || turno.horaDesde || turno.horadesde || turno.HoraDesde || turno.Hora_Desde || '';
    const horaHastaRaw = turno.hora_hasta || turno.horaHasta || turno.horahasta || turno.HoraHasta || turno.Hora_Hasta || '';
    
    // Obtener el ID con múltiples variantes de nombres
    const turnoId = turno.id || turno.Id || turno.ID || null;
    
    console.log('DEBUG handleEditarTurno - Valores originales:', {
      turno,
      turnoId,
      horaDesdeRaw,
      horaHastaRaw,
      horaDesdeFormateada: formatearHoraParaInput(horaDesdeRaw),
      horaHastaFormateada: formatearHoraParaInput(horaHastaRaw),
    });
    
    setFormData({
      id: turnoId,
      nombre: turno.nombre || turno.Nombre || '',
      hora_desde: formatearHoraParaInput(horaDesdeRaw),
      hora_hasta: formatearHoraParaInput(horaHastaRaw),
    });
    setVista('editar');
  };

  // Volver a la lista
  const handleVolverALista = () => {
    setTurnoEditando(null);
    setFormData({
      id: null,
      nombre: '',
      hora_desde: '',
      hora_hasta: '',
    });
    setVista('lista');
  };

  // Formatear hora para mostrar (solo horas y minutos)
  const formatearHora = (horaString) => {
    if (!horaString) return '-';
    // Si es un objeto TimeSpan o similar, extraer la hora
    if (typeof horaString === 'object' && horaString !== null) {
      const hours = horaString.hours || horaString.Hours || horaString.h || 0;
      const minutes = horaString.minutes || horaString.Minutes || horaString.m || 0;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    // Si es string, formatear
    if (typeof horaString === 'string') {
      const parts = horaString.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return horaString;
    }
    return '-';
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Listado de Turnos', 14, 15);
      
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Exportado el: ${fecha}`, 14, 22);
      
      const tableData = turnos.map(turno => [
        turno.nombre || turno.Nombre || '-',
        formatearHora(turno.hora_desde || turno.horaDesde || turno.horadesde),
        formatearHora(turno.hora_hasta || turno.horaHasta || turno.horahasta)
      ]);
      
      doc.autoTable({
        startY: 28,
        head: [['Nombre', 'Hora Desde', 'Hora Hasta']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 28 }
      });
      
      const fileName = `turnos_${new Date().toISOString().split('T')[0]}.pdf`;
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
      const datosExcel = turnos.map(turno => ({
        'Nombre': turno.nombre || turno.Nombre || '',
        'Hora Desde': formatearHora(turno.hora_desde || turno.horaDesde || turno.horadesde),
        'Hora Hasta': formatearHora(turno.hora_hasta || turno.horaHasta || turno.horahasta)
      }));
      
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Turnos');
      
      const colWidths = [
        { wch: 20 },
        { wch: 15 },
        { wch: 15 }
      ];
      ws['!cols'] = colWidths;
      
      const fileName = `turnos_${new Date().toISOString().split('T')[0]}.xlsx`;
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
              {vista === 'editar' ? 'Editar Turno' : 'Nuevo Turno'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar">
            <i className="fa fa-pencil-alt"></i>
            <span>Editando turno - Modifique los campos necesarios y guarde los cambios.</span>
          </div>
        )}

        <div className="usuarios-form-container">
          <form>
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa fa-clock mr-2"></i>
                <span>Información del Turno</span>
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
                        placeholder="Ingrese el nombre del turno"
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="hora_desde">
                        Hora Desde <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <input
                        type="time"
                        className="form-control"
                        id="hora_desde"
                        name="hora_desde"
                        value={formData.hora_desde || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="hora_hasta">
                        Hora Hasta <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <input
                        type="time"
                        className="form-control"
                        id="hora_hasta"
                        name="hora_hasta"
                        value={formData.hora_hasta || ''}
                        onChange={handleInputChange}
                        required
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
      {/* Barra negra con título Turnos */}
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
          <i className="fa fa-clock mr-2" aria-hidden="true"></i>Turnos
        </h3>
      </div>
      
      <div style={{ paddingTop: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Botón Agregar */}
        <div style={{ marginBottom: '1rem' }}>
          <AgregarButton onClick={handleCrearTurno} />
        </div>

        {/* Filtro de búsqueda con botones de exportación */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <Buscador 
              filtro={filtro}
              setFiltro={setFiltro}
              placeholder="Filtrar por nombre..."
            />
          </div>
          
          {/* Botones de exportación (solo iconos) */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn"
              onClick={handleExportarPDF}
              disabled={turnos.length === 0}
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
              disabled={turnos.length === 0}
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

        {/* Tabla de turnos */}
        <DataTable
          columns={[
            { key: 'nombre', field: 'nombre', label: 'Nombre', render: (value, row) => row.nombre || row.Nombre || '-' },
            { 
              key: 'hora_desde', 
              field: 'hora_desde', 
              label: 'Hora Desde',
              render: (value, row) => {
                if (!row) return '-';
                // Buscar en diferentes formatos posibles
                const horaDesde = row.hora_desde || row.horaDesde || row.horadesde || row.HoraDesde || row.Hora_Desde || row.horaDesde || value;
                console.log('Hora Desde - Row:', row, 'Valor encontrado:', horaDesde);
                return formatearHora(horaDesde);
              }
            },
            { 
              key: 'hora_hasta', 
              field: 'hora_hasta', 
              label: 'Hora Hasta',
              render: (value, row) => {
                if (!row) return '-';
                // Buscar en diferentes formatos posibles
                const horaHasta = row.hora_hasta || row.horaHasta || row.horahasta || row.HoraHasta || row.Hora_Hasta || row.horaHasta || value;
                console.log('Hora Hasta - Row:', row, 'Valor encontrado:', horaHasta);
                return formatearHora(horaHasta);
              }
            },
          ]}
          data={turnos}
          isLoading={isLoading}
          emptyMessage={filtro ? 'No se encontraron turnos que coincidan con la búsqueda' : 'No hay turnos registrados'}
          onEdit={handleEditarTurno}
          onDelete={(turno) => {
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea eliminar el turno ${turno.nombre || turno.Nombre}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, eliminar',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  // Extraer el ID del turno (puede venir en diferentes formatos)
                  const turnoId = turno.id || turno.Id || turno.ID;
                  
                  if (!turnoId) {
                    Swal.fire({
                      title: 'Error',
                      text: 'No se pudo obtener el ID del turno',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                    return;
                  }
                  
                  console.log('Eliminando turno con ID:', turnoId);
                  await apiService.eliminarTurno(turnoId);
                  Swal.fire({
                    title: 'Eliminado',
                    text: 'Turno eliminado correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#F34949',
                  });
                  cargarTurnos(currentPage, filtro);
                } catch (error) {
                  console.error('Error al eliminar turno:', error);
                  if (!error.redirectToLogin) {
                    // Extraer el mensaje del error del backend
                    let errorMessage = 'Error al eliminar el turno';
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
          canDelete={(turno) => {
            // No permitir eliminar si solo hay un turno
            return turnos.length > 1;
          }}
          enablePagination={false}
          pageSize={pageSize}
        />
        
        {/* Controles de paginación del servidor (siempre que haya más de una página o más de 5 registros) */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <span className="text-muted">
                Mostrando página {currentPage} de {totalPages} ({totalItems} turnos)
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

export default Turno;
