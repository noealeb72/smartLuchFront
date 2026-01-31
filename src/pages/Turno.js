import React, { useState, useEffect, useCallback } from 'react';
import { turnosService } from '../services/turnosService';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import TimePicker from '../components/TimePicker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Usuarios.css';

const Turno = () => {
  const [turnos, setTurnos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [turnoEditando, setTurnoEditando] = useState(null);
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
    hora_desde: '',
    hora_hasta: '',
  });

  // Cargar turnos usando /api/turno/lista con paginación
  const cargarTurnos = useCallback(async (page = 1, searchTerm = '', mostrarActivos = true) => {
    try {
      setIsLoading(true);
      
      // Si hay término de búsqueda, usar pageSize=100 y page=1 para obtener todos los resultados
      // Si no hay búsqueda, usar la paginación normal
      const pageToUse = (searchTerm && searchTerm.trim()) ? 1 : page;
      const pageSizeToUse = (searchTerm && searchTerm.trim()) ? 100 : pageSize;
      
      const data = await turnosService.getTurnosLista(pageToUse, pageSizeToUse, searchTerm, mostrarActivos);
      
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

      // El backend devuelve estructura paginada: { page, pageSize, totalItems, totalPages, items: [...] }
      let turnosData = [];
      
      if (data.items && Array.isArray(data.items)) {
        turnosData = data.items;
      } else if (Array.isArray(data)) {
        turnosData = data;
      } else if (data.data && Array.isArray(data.data)) {
        turnosData = data.data;
      }
      
      // Ordenar los turnos por hora
      const turnosOrdenados = ordenarTurnos(turnosData);
      
      // Usar los valores de paginación del backend
      const totalItemsBackend = data.totalItems || turnosOrdenados.length;
      const totalPagesBackend = data.totalPages || Math.ceil(totalItemsBackend / pageSize);
      
      setTurnos(turnosOrdenados);
      setTotalPages(totalPagesBackend);
      setTotalItems(totalItemsBackend);
    } catch (error) {
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

  // Cuando cambia el filtro o filtroActivo, resetear a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, filtroActivo]);

  // Cargar turnos cuando cambia la página, el filtro o el filtroActivo
  useEffect(() => {
    const soloActivos = filtroActivo === 'activo';
    cargarTurnos(currentPage, filtro, soloActivos);
  }, [currentPage, filtro, filtroActivo, cargarTurnos]);


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

    // Validar hora de inicio
    if (!formData.hora_desde || formData.hora_desde.trim() === '') {
      addError('La hora de inicio es requerida', 'hora_desde');
    } else {
      // Validar formato de hora de inicio (HH:mm)
      const horaDesdeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!horaDesdeRegex.test(formData.hora_desde.trim())) {
        addError('La hora de inicio debe tener el formato HH:mm (ej: 20:00)', 'hora_desde');
      }
    }

    // Validar hora de fin
    if (!formData.hora_hasta || formData.hora_hasta.trim() === '') {
      addError('La hora de fin es requerida', 'hora_hasta');
    } else {
      // Validar formato de hora de fin (HH:mm)
      const horaHastaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!horaHastaRegex.test(formData.hora_hasta.trim())) {
        addError('La hora de fin debe tener el formato HH:mm (ej: 00:00)', 'hora_hasta');
      }
    }

    // Si ambas horas están presentes y tienen formato válido, validar lógica
    if (formData.hora_desde && formData.hora_desde.trim() !== '' && 
        formData.hora_hasta && formData.hora_hasta.trim() !== '') {
      const horaDesdeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const horaHastaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (horaDesdeRegex.test(formData.hora_desde.trim()) && 
          horaHastaRegex.test(formData.hora_hasta.trim())) {
        // Convertir horas a minutos para comparación numérica
        const convertirHoraAMinutos = (horaString) => {
          if (!horaString) return 0;
          const parts = horaString.trim().split(':');
          if (parts.length >= 2) {
            const horas = parseInt(parts[0]) || 0;
            const minutos = parseInt(parts[1]) || 0;
            return horas * 60 + minutos;
          }
          return 0;
        };
        
        const minutosDesde = convertirHoraAMinutos(formData.hora_desde);
        const minutosHasta = convertirHoraAMinutos(formData.hora_hasta);
        
        // Permitir turnos que cruzan la medianoche (ej: 20:00 a 00:00)
        // Si minutosHasta < minutosDesde, significa que el turno cruza la medianoche y es válido
        // Si minutosHasta > minutosDesde, es un turno normal dentro del mismo día y es válido
        // Solo rechazar si son iguales (no tiene sentido un turno de 0 minutos)
        if (minutosDesde === minutosHasta) {
          addError('La hora de inicio no puede ser igual a la hora de fin', 'hora_desde');
        }
        // Si minutosHasta < minutosDesde, el turno cruza la medianoche (válido)
        // Si minutosHasta > minutosDesde, el turno es normal (válido)
        // No necesitamos validar más, ambos casos son válidos
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

      // Asegurar que las horas tengan el formato HH:mm:ss para el backend (TimeSpan en C#)
      const formatearHoraParaBackend = (horaString) => {
        if (!horaString || horaString.trim() === '') {
          throw new Error('La hora es obligatoria');
        }
        
        // Validar formato básico
        const parts = horaString.trim().split(':');
        if (parts.length < 2) {
          throw new Error('Formato de hora inválido. Debe ser HH:mm');
        }
        
        const horas = parseInt(parts[0]) || 0;
        const minutos = parseInt(parts[1]) || 0;
        
        // Validar rangos
        if (horas < 0 || horas > 23) {
          throw new Error('Las horas deben estar entre 00 y 23');
        }
        if (minutos < 0 || minutos > 59) {
          throw new Error('Los minutos deben estar entre 00 y 59');
        }
        
        // Formatear como HH:mm:ss (TimeSpan en C# acepta este formato)
        const horasFormateadas = String(horas).padStart(2, '0');
        const minutosFormateados = String(minutos).padStart(2, '0');
        
        // Si ya tiene segundos, mantenerlos, sino agregar :00
        if (parts.length === 3) {
          const segundos = parseInt(parts[2]) || 0;
          if (segundos < 0 || segundos > 59) {
            throw new Error('Los segundos deben estar entre 00 y 59');
          }
          return `${horasFormateadas}:${minutosFormateados}:${String(segundos).padStart(2, '0')}`;
        }
        
        return `${horasFormateadas}:${minutosFormateados}:00`;
      };

      // Validar que las horas estén presentes antes de formatear
      if (!formData.hora_desde || formData.hora_desde.trim() === '') {
        Swal.fire({
          title: 'Error de validación',
          text: 'La hora de inicio es obligatoria',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        setIsLoading(false);
        return;
      }

      if (!formData.hora_hasta || formData.hora_hasta.trim() === '') {
        Swal.fire({
          title: 'Error de validación',
          text: 'La hora de fin es obligatoria',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        setIsLoading(false);
        return;
      }

      // El backend espera un DTO con los campos en formato PascalCase (común en C#)
      // Asegurar que el ID se envíe correctamente cuando se está editando
      const turnoId = turnoEditando 
        ? (formData.id || turnoEditando.id || turnoEditando.Id || turnoEditando.ID)
        : null;
      
      // Formatear las horas para el backend
      let horaDesdeFormateada;
      let horaHastaFormateada;
      
      try {
        horaDesdeFormateada = formatearHoraParaBackend(formData.hora_desde);
        horaHastaFormateada = formatearHoraParaBackend(formData.hora_hasta);
      } catch (error) {
        Swal.fire({
          title: 'Error de validación',
          text: error.message || 'Error al formatear las horas',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        setIsLoading(false);
        return;
      }
      
      // Validación final antes de enviar (doble verificación)
      if (!horaDesdeFormateada || horaDesdeFormateada.trim() === '') {
        Swal.fire({
          title: 'Error de validación',
          text: 'La hora de inicio es obligatoria para ' + (turnoEditando ? 'actualizar' : 'crear') + ' el turno',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        setIsLoading(false);
        return;
      }

      if (!horaHastaFormateada || horaHastaFormateada.trim() === '') {
        Swal.fire({
          title: 'Error de validación',
          text: 'La hora de fin es obligatoria para ' + (turnoEditando ? 'actualizar' : 'crear') + ' el turno',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        setIsLoading(false);
        return;
      }

      // Preparar datos según si es crear o actualizar
      let turnoData;
      
      if (turnoEditando) {
        // Para actualizar, incluir el ID
        turnoData = {
          Id: parseInt(turnoId),
          Nombre: formData.nombre.trim(),
          HoraDesde: horaDesdeFormateada,
          HoraHasta: horaHastaFormateada,
        };
        await turnosService.actualizarTurno(turnoData);
        Swal.fire({
          title: 'Éxito',
          text: 'Turno actualizado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      } else {
        // Para crear, NO incluir el ID
        turnoData = {
          Nombre: formData.nombre.trim(),
          HoraDesde: horaDesdeFormateada,
          HoraHasta: horaHastaFormateada,
        };
        
        await turnosService.crearTurno(turnoData);
        Swal.fire({
          title: 'Éxito',
          text: 'Turno creado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      }

      handleVolverALista();
      const soloActivos = filtroActivo === 'activo';
      cargarTurnos(currentPage, filtro, soloActivos);
    } catch (error) {
      
      if (!error.redirectToLogin) {
        // Extraer el mensaje del error del backend
        let errorMessage = 'Error al guardar el turno';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.Message) {
          errorMessage = error.response.data.Message;
        } else if (error.response?.data) {
          errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || error.response.data.Message || error.response.data.error || errorMessage;
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
    
    // Formatear horas para mantener formato 24h (HH:mm)
    const formatearHoraParaInput = (horaValue) => {
      if (!horaValue) return '';
      
      // Si es un objeto (TimeSpan de C#), extraer horas y minutos
      if (typeof horaValue === 'object' && horaValue !== null) {
        const horas = horaValue.hours || horaValue.Hours || horaValue.h || 0;
        const minutos = horaValue.minutes || horaValue.Minutes || horaValue.m || 0;
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
      }
      
      // Si es string, parsear y formatear manteniendo formato 24h
      if (typeof horaValue === 'string') {
        // Remover espacios
        const horaLimpia = horaValue.trim();
        
        // Si contiene ':', extraer solo horas y minutos (mantener formato 24h)
        if (horaLimpia.includes(':')) {
          const parts = horaLimpia.split(':');
          const horas = parseInt(parts[0]) || 0;
          const minutos = parseInt(parts[1]) || 0;
          // Mantener formato 24h: 20:00 sigue siendo 20:00, no convertir a 08:00 PM
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
    
    // Formatear horas en formato 24h para el backend (mantener formato HH:mm)
    const horaDesde24hString = formatearHoraParaInput(horaDesdeRaw);
    const horaHasta24hString = formatearHoraParaInput(horaHastaRaw);
    
    setFormData({
      id: turnoId,
      nombre: turno.nombre || turno.Nombre || '',
      hora_desde: horaDesde24hString,
      hora_hasta: horaHasta24hString,
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
      
      const tableData = turnos.map(turno => {
        // Buscar horaDesde en diferentes formatos posibles (igual que en la tabla)
        const horaDesde = turno.hora_desde || turno.horaDesde || turno.horadesde || turno.HoraDesde || turno.Hora_Desde || turno.horaDesde || '';
        // Buscar horaHasta en diferentes formatos posibles (igual que en la tabla)
        const horaHasta = turno.hora_hasta || turno.horaHasta || turno.horahasta || turno.HoraHasta || turno.Hora_Hasta || turno.horaHasta || '';
        
        return [
          turno.nombre || turno.Nombre || '-',
          formatearHora(horaDesde),
          formatearHora(horaHasta)
        ];
      });
      
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
      const datosExcel = turnos.map(turno => {
        // Buscar horaDesde en diferentes formatos posibles (igual que en la tabla)
        const horaDesde = turno.hora_desde || turno.horaDesde || turno.horadesde || turno.HoraDesde || turno.Hora_Desde || turno.horaDesde || '';
        // Buscar horaHasta en diferentes formatos posibles (igual que en la tabla)
        const horaHasta = turno.hora_hasta || turno.horaHasta || turno.horahasta || turno.HoraHasta || turno.Hora_Hasta || turno.horaHasta || '';
        
        return {
          'Nombre': turno.nombre || turno.Nombre || '',
          'Hora Desde': formatearHora(horaDesde),
          'Hora Hasta': formatearHora(horaHasta)
        };
      });
      
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
              {vista === 'editar' ? 'Editar Turno' : 'Nuevo Turno'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para creación */}
        {vista === 'crear' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Creando nuevo turno - Complete los campos obligatorios para guardar.</span>
          </div>
        )}

        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-pencil-alt" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Editando turno - Modifique los campos necesarios y guarde los cambios.</span>
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
                  <div className="col-md-4">
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
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="hora_desde">
                        Hora Desde <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <TimePicker
                        id="hora_desde"
                        name="hora_desde"
                        value={formData.hora_desde || ''}
                        onChange={handleInputChange}
                        placeholder="HH:mm (ej: 20:00)"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="hora_hasta">
                        Hora Hasta <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <TimePicker
                        id="hora_hasta"
                        name="hora_hasta"
                        value={formData.hora_hasta || ''}
                        onChange={handleInputChange}
                        placeholder="HH:mm (ej: 00:00)"
                        required
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
      {/* Barra negra con título Turnos */}
      <div className="page-title-bar">
        <h3>
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
                return formatearHora(horaHasta);
              }
            },
          ]}
          data={turnos}
          isLoading={isLoading}
          emptyMessage={
            filtro 
              ? 'No se encontraron turnos que coincidan con la búsqueda' 
              : filtroActivo === 'activo' 
                ? 'No hay turnos registrados Activos' 
                : 'No hay turnos registrados Inactivos'
          }
          onEdit={handleEditarTurno}
          canEdit={(turno) => {
            // Solo se puede editar si el turno está activo
            const rawActivo = turno.activo !== undefined ? turno.activo :
                             turno.isActive !== undefined ? turno.isActive :
                             turno.Activo !== undefined ? turno.Activo :
                             turno.deletemark !== undefined ? !turno.deletemark :
                             turno.Deletemark !== undefined ? !turno.Deletemark :
                             turno.deleteMark !== undefined ? !turno.deleteMark :
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
          onDelete={(turno) => {
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea dar de baja el turno ${turno.nombre || turno.Nombre}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, dar de baja',
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
                  
                  await turnosService.eliminarTurno(turnoId);
                  Swal.fire({
                    title: 'Éxito',
                    text: 'Turno dado de baja correctamente',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    allowOutsideClick: true,
                  });
                  const soloActivos = filtroActivo === 'activo';
                  cargarTurnos(currentPage, filtro, soloActivos);
                } catch (error) {
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
            if (turnos.length <= 1) {
              return false;
            }
            // No permitir eliminar si el turno está inactivo
            const rawActivo = turno.activo !== undefined ? turno.activo :
                             turno.isActive !== undefined ? turno.isActive :
                             turno.Activo !== undefined ? turno.Activo :
                             turno.deletemark !== undefined ? !turno.deletemark :
                             turno.Deletemark !== undefined ? !turno.Deletemark :
                             turno.deleteMark !== undefined ? !turno.deleteMark :
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
          renderActions={(turno) => {
            const rawActivo = turno.activo !== undefined ? turno.activo :
                             turno.isActive !== undefined ? turno.isActive :
                             turno.Activo !== undefined ? turno.Activo :
                             turno.deletemark !== undefined ? !turno.deletemark :
                             turno.Deletemark !== undefined ? !turno.Deletemark :
                             turno.deleteMark !== undefined ? !turno.deleteMark :
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
                      text: `¿Desea activar el turno ${turno.nombre || turno.Nombre}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#28a745',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: 'Sí, activar',
                      cancelButtonText: 'Cancelar',
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          const turnoId = turno.id || turno.Id || turno.ID;
                          await turnosService.activarTurno(turnoId);
                          Swal.fire({
                            title: 'Activado',
                            text: 'Turno activado correctamente',
                            icon: 'success',
                            timer: 3000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            allowOutsideClick: true,
                          });
                          const soloActivos = filtroActivo === 'activo';
                          cargarTurnos(currentPage, filtro, soloActivos);
                        } catch (error) {
                          if (!error.redirectToLogin) {
                            Swal.fire({
                              title: 'Error',
                              text: error.message || 'Error al activar el turno',
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
          enablePagination={false}
          pageSize={pageSize}
        />
        
        {/* Controles de paginación del servidor (siempre que haya más de una página o más de 5 registros) */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
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
