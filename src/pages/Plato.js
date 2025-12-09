// src/pages/Plato.js
import React, { useState, useEffect, useCallback } from 'react';
import { apiService, getApiBaseUrl } from '../services/apiService';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Usuarios.css';

const Plato = () => {
  const [platos, setPlatos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [platoEditando, setPlatoEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [soloActivos, setSoloActivos] = useState(true); // Por defecto mostrar solo activos
  const [vista, setVista] = useState('lista'); // 'lista' | 'editar' | 'crear'
  const [planesNutricionales, setPlanesNutricionales] = useState([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isServerSidePagination, setIsServerSidePagination] = useState(false);
 
  // Form
  const [formData, setFormData] = useState({
    id: null,
    codigo: '',
    descripcion: '',
    costo: '',
    plannutricional_id: '',
    presentacion: '',
    ingredientes: '',
    imagen: null,
    imagenPreview: null,
    eliminarImagen: false,
  });

  // ===================== helpers =====================

  const getUsuarioLogueado = () => {
    try {
      // Ajustá esto según cómo guardás el usuario
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        return (
          u.username ||
          u.nombreUsuario ||
          u.NombreUsuario ||
          u.name ||
          u.Nombre ||
          ''
        );
      }
    } catch {
      // ignorar error de parseo
    }
    return (
      localStorage.getItem('username') ||
      localStorage.getItem('usuario') ||
      ''
    );
  };

  const generarCodigoDesdeDescripcion = (descripcion) => {
    if (!descripcion || descripcion.trim() === '') return '';

    const palabrasOmitir = [
      'con', 'de', 'la', 'el', 'los', 'las', 'del', 'y', 'a',
      'en', 'por', 'para', 'un', 'una', 'unos', 'unas',
    ];

    const limpiarTexto = (texto) => {
      return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
    };

    const textoLimpio = limpiarTexto(descripcion);
    const palabras = textoLimpio.split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return '';

    const significativas = palabras.filter(
      (p) => p.length > 2 && !palabrasOmitir.includes(p)
    );
    const usar = significativas.length > 0 ? significativas : palabras;

    const partes = usar.slice(0, 4).map((p) => p.substring(0, 3).toUpperCase());
    return partes.join('-');
  };

  // ===================== carga datos =====================

  const cargarPlanesNutricionales = useCallback(async () => {
    try {
      const data = await apiService.getPlanesNutricionales();
      const planesArray = Array.isArray(data)
        ? data
        : data.data || data.items || [];
      setPlanesNutricionales(planesArray);
    } catch (error) {
      console.error('Error al cargar planes nutricionales:', error);
      setPlanesNutricionales([]);
    }
  }, []);

  const cargarPlatos = useCallback(
    async (page = 1, searchTerm = '') => {
      try {
        setIsLoading(true);
        // Pasar el parámetro activo al backend (true por defecto, false si soloActivos está desmarcado)
        const data = await apiService.getPlatosLista(page, pageSize, searchTerm, soloActivos);

        // Verificar si el backend devuelve datos paginados o todos los datos
        let items = [];
        let totalItemsCount = 0;
        let totalPagesCount = 1;
        
        if (Array.isArray(data)) {
          // El backend devuelve un array completo (sin paginación del servidor)
          items = data;
          
          // Aplicar filtro local si hay búsqueda (el backend ya filtró por activos)
          if (searchTerm && searchTerm.trim()) {
            const termino = searchTerm.toLowerCase().trim();
            items = items.filter(plato => 
              (plato.codigo && plato.codigo.toString().toLowerCase().includes(termino)) ||
              (plato.descripcion && plato.descripcion.toLowerCase().includes(termino)) ||
              (plato.Codigo && plato.Codigo.toString().toLowerCase().includes(termino)) ||
              (plato.Descripcion && plato.Descripcion.toLowerCase().includes(termino))
            );
          }
          
          totalItemsCount = items.length;
          totalPagesCount = Math.ceil(items.length / pageSize);
          setIsServerSidePagination(false); // Usar paginación del cliente
        } else {
          // El backend devuelve datos paginados (ya filtrados por activos)
          items = data.items || data.Items || data.data || [];
          totalItemsCount = data.totalItems || data.TotalItems || data.total || items.length;
          totalPagesCount = data.totalPages || data.TotalPages || Math.ceil(totalItemsCount / pageSize);
          setIsServerSidePagination(true); // Usar paginación del servidor
        }
        
        // Debug: mostrar los platos cargados
        console.log('DEBUG cargarPlatos - Platos cargados:', {
          cantidad: items.length,
          soloActivos: soloActivos,
          platos: items.map(p => ({
            id: p.id || p.Id,
            descripcion: p.descripcion || p.Descripcion,
            DeleteMark: p.DeleteMark,
            deleteMark: p.deleteMark,
            delete_mark: p.delete_mark,
            todasLasPropiedades: Object.keys(p)
          }))
        });
        
        setPlatos(items);
        setCurrentPage(page);
        setTotalPages(totalPagesCount);
        setTotalItems(totalItemsCount);
      } catch (error) {
        console.error('Error al cargar platos:', error);

        if (!error.redirectToLogin) {
          Swal.fire({
            title: 'Error',
            text: error.message || 'Error al cargar los platos',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
        }

        setPlatos([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, soloActivos]
  );

  useEffect(() => {
    cargarPlanesNutricionales();
  }, [cargarPlanesNutricionales]);

  useEffect(() => {
    cargarPlatos(currentPage, filtro);
  }, [currentPage, filtro, soloActivos, cargarPlatos]);

  // ===================== handlers form =====================

  const handleGenerarCodigo = () => {
    if (!formData.descripcion || formData.descripcion.trim() === '') {
      Swal.fire({
        title: 'Atención',
        text: 'Debe ingresar una descripción antes de generar el código',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }
    
    const codigoGenerado = generarCodigoDesdeDescripcion(formData.descripcion);
    if (codigoGenerado) {
      setFormData((prev) => ({
        ...prev,
        codigo: codigoGenerado,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'imagen' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imagen: file,
          imagenPreview: reader.result,
          eliminarImagen: false,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => {
        const nuevo = { ...prev, [name]: value };
        // Removemos la generación automática, ahora será solo manual con el botón
        return nuevo;
      });
    }
  };

  const validarFormulario = () => {
    const errores = [];
    let primerCampoConError = '';

    const addError = (msg, fieldId) => {
      errores.push(msg);
      if (!primerCampoConError) primerCampoConError = fieldId;
    };

    if (!formData.codigo.trim()) addError('El código es requerido', 'codigo');
    if (!formData.descripcion.trim())
      addError('La descripción es requerida', 'descripcion');

    if (
      formData.costo === '' ||
      formData.costo === null ||
      formData.costo === undefined
    ) {
      addError('El costo es requerido', 'costo');
    } else {
      const costoNum = parseFloat(formData.costo);
      if (isNaN(costoNum)) addError('El costo debe ser un número válido', 'costo');
      else if (costoNum < 0)
        addError('El costo no puede ser negativo', 'costo');
    }

    if (errores.length > 0) {
      Swal.fire({
        title: 'Error de validación',
        html:
          '<div style="text-align: left;"><p>Los siguientes campos son obligatorios:</p><ul style="margin: 0; padding-left: 20px;">' +
          errores.map((e) => `<li>${e}</li>`).join('') +
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

  const handleCrearPlato = () => {
    setPlatoEditando(null);
    setFormData({
      id: null,
      codigo: '',
      descripcion: '',
      costo: '',
      plannutricional_id:
        planesNutricionales.length === 1
          ? String(planesNutricionales[0].id)
          : '',
      presentacion: '',
      ingredientes: '',
      imagen: null,
      imagenPreview: null,
      eliminarImagen: false,
    });
    setVista('crear');
  };

  const handleEditarPlato = async (plato) => {
    try {
      setIsLoading(true);

      const platoId = plato.id || plato.Id || plato.ID;
      if (!platoId) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener el ID del plato',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      const platoCompleto = await apiService.getPlatoPorId(platoId);
      const platoParaEditar = platoCompleto || plato;

      setPlatoEditando(platoParaEditar);

      const obtenerPlanId = () => {
        let planIdValue =
          platoParaEditar.plannutricional_id ||
          platoParaEditar.plannutricionalId ||
          platoParaEditar.plannutricional ||
          platoParaEditar.plan_nutricional_id ||
          platoParaEditar.planNutricionalId ||
          platoParaEditar.planNutricional ||
          platoParaEditar.planNutricional_id ||
          platoParaEditar.PlanNutricionalId ||
          platoParaEditar.PlanNutricional ||
          (platoParaEditar.planNutricional &&
            (platoParaEditar.planNutricional.id ||
              platoParaEditar.planNutricional.Id)) ||
          (platoParaEditar.PlanNutricional &&
            (platoParaEditar.PlanNutricional.id ||
              platoParaEditar.PlanNutricional.Id));

        if (
          (!planIdValue || planIdValue === '' || planIdValue === 0) &&
          planesNutricionales.length === 1
        ) {
          planIdValue = planesNutricionales[0].id;
        }

        return planIdValue !== null &&
          planIdValue !== undefined &&
          planIdValue !== ''
          ? String(planIdValue)
          : '';
      };

      const obtenerPresentacion = () =>
        platoParaEditar.presentacion ||
        platoParaEditar.Presentacion ||
        (platoParaEditar.presentacion &&
          typeof platoParaEditar.presentacion === 'object' &&
          (platoParaEditar.presentacion.nombre ||
            platoParaEditar.presentacion.descripcion)) ||
        '';

      const obtenerIngredientes = () =>
        platoParaEditar.ingredientes ||
        platoParaEditar.Ingredientes ||
        (platoParaEditar.ingredientes &&
          typeof platoParaEditar.ingredientes === 'object' &&
          (platoParaEditar.ingredientes.nombre ||
            platoParaEditar.ingredientes.descripcion)) ||
        '';

      const planId = obtenerPlanId();
      const presentacion = obtenerPresentacion();
      const ingredientes = obtenerIngredientes();

      // Obtener la imagen y construir la URL completa si es una ruta relativa
      const obtenerImagenPreview = () => {
        const foto = platoParaEditar.foto ||
                     platoParaEditar.Foto ||
                     platoParaEditar.imagen ||
                     platoParaEditar.Imagen ||
                     null;
        
        if (!foto) return null;
        
        // Si ya es una URL completa o base64, devolverla tal cual
        if (foto.startsWith('http') || foto.startsWith('data:')) {
          return foto;
        }
        
        // Si es una ruta relativa, construir la URL completa
        const baseUrl = getApiBaseUrl();
        return `${baseUrl}${foto.startsWith('/') ? '' : '/'}${foto}`;
      };

      setFormData({
        id: platoParaEditar.id || platoParaEditar.Id || platoParaEditar.ID,
        codigo:
          platoParaEditar.codigo ||
          platoParaEditar.Codigo ||
          platoParaEditar.cod_plato ||
          platoParaEditar.codPlato ||
          '',
        descripcion:
          platoParaEditar.descripcion || platoParaEditar.Descripcion || '',
        costo:
          platoParaEditar.costo ||
          platoParaEditar.Costo ||
          platoParaEditar.precio ||
          platoParaEditar.Precio ||
          '',
        plannutricional_id: planId,
        presentacion,
        ingredientes,
        imagen: null,
        imagenPreview: obtenerImagenPreview(),
        eliminarImagen: false,
      });

      setVista('editar');
    } catch (error) {
      console.error('Error al obtener el plato:', error);
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los datos del plato',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolverALista = () => {
    setPlatoEditando(null);
    setFormData({
      id: null,
      codigo: '',
      descripcion: '',
      costo: '',
      plannutricional_id: '',
      presentacion: '',
      ingredientes: '',
      imagen: null,
      imagenPreview: null,
      eliminarImagen: false,
    });
    setVista('lista');
  };

  const handleEliminarImagen = () => {
    setFormData((prev) => ({
      ...prev,
      imagen: null,
      imagenPreview: null,
      eliminarImagen: true,
    }));
  };

  // ===================== guardar (create/update) =====================

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      setIsLoading(true);

      const usuario = getUsuarioLogueado();

      const planNutricionalSeleccionado = planesNutricionales.find(
        (p) => String(p.id) === String(formData.plannutricional_id)
      );

      const plannutricionalId =
        formData.plannutricional_id && formData.plannutricional_id !== ''
          ? parseInt(formData.plannutricional_id)
          : planesNutricionales.length === 1
          ? planesNutricionales[0].id
          : 0;

      let fotoBase64 = null;
      let eliminarFoto = false;

      if (formData.eliminarImagen) {
        eliminarFoto = true;
      } else if (
        formData.imagenPreview &&
        formData.imagenPreview.startsWith('data:')
      ) {
        fotoBase64 = formData.imagenPreview;
      }

      if (platoEditando) {
        const platoData = {
          Id: parseInt(formData.id),
          Codigo: (formData.codigo || '').trim(),
          Ingredientes: (formData.ingredientes || '').trim(),
          Presentacion: (formData.presentacion || '').trim(),
          Plannutricional_id: plannutricionalId || null,
          Descripcion: (formData.descripcion || '').trim(),
          Costo:
            formData.costo && formData.costo !== ''
              ? parseFloat(formData.costo)
              : 0,
          FotoBase64: fotoBase64,
          EliminarFoto: eliminarFoto,
          UpdateUser:  getUsuarioLogueado(),
        };

        await apiService.actualizarPlato(platoData);

        Swal.fire({
          title: 'Éxito',
          text: 'Plato actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      } else {
        const platoData = {
          Codigo: (formData.codigo || '').trim(),
          Ingredientes: (formData.ingredientes || '').trim(),
          Presentacion: (formData.presentacion || '').trim(),
          Plannutricional_id: plannutricionalId || null,
          Descripcion: (formData.descripcion || '').trim(),
          Costo:
            formData.costo && formData.costo !== ''
              ? parseFloat(formData.costo)
              : 0,
          FotoBase64: fotoBase64,
          CreateUser:  getUsuarioLogueado(),
        };

        await apiService.crearPlato(platoData);

        Swal.fire({
          title: 'Éxito',
          text: 'Plato creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }

      await cargarPlatos(currentPage, filtro);
      handleVolverALista();
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text:
            error.message ||
            `Error al ${platoEditando ? 'actualizar' : 'crear'} el plato`,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ===================== export / delete / pag =====================

  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Listado de Platos', 14, 15);

      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.setFontSize(10);
      doc.text(`Generado el: ${fecha}`, 14, 22);

      const tableData = platos.map((plato) => {
        const planNombre =
          plato.plannutricional_nombre ||
          plato.Plannutricional_nombre ||
          plato.planNutricional_nombre ||
          plato.planNutricionalNombre ||
          plato.plan_nutricional_nombre ||
          (plato.planNutricional &&
            (plato.planNutricional.nombre ||
              plato.planNutricional.Nombre)) ||
          (plato.PlanNutricional &&
            (plato.PlanNutricional.nombre ||
              plato.PlanNutricional.Nombre)) ||
          '-';

        return [
          plato.codigo || plato.Codigo || '-',
          plato.descripcion || plato.Descripcion || '-',
          planNombre,
          `$${parseFloat(plato.costo || plato.Costo || 0).toFixed(2)}`,
        ];
      });

      doc.autoTable({
        startY: 28,
        head: [['Código', 'Descripción', 'Plan Nutricional', 'Costo']],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [52, 58, 64] },
      });

      doc.save('platos.pdf');
    } catch {
      Swal.fire({
        title: 'Error',
        text: 'Error al generar el PDF',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  };

  const handleExportarExcel = () => {
    try {
      const worksheetData = [
        ['Código', 'Descripción', 'Plan Nutricional', 'Costo'],
        ...platos.map((plato) => {
          const planNombre =
            plato.plannutricional_nombre ||
            plato.Plannutricional_nombre ||
            plato.planNutricional_nombre ||
            plato.planNutricionalNombre ||
            plato.plan_nutricional_nombre ||
            (plato.planNutricional &&
              (plato.planNutricional.nombre ||
                plato.planNutricional.Nombre)) ||
            (plato.PlanNutricional &&
              (plato.PlanNutricional.nombre ||
                plato.PlanNutricional.Nombre)) ||
            '-';
          return [
            plato.codigo || plato.Codigo || '-',
            plato.descripcion || plato.Descripcion || '-',
            planNombre,
            parseFloat(plato.costo || plato.Costo || 0).toFixed(2),
          ];
        }),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Platos');
      XLSX.writeFile(workbook, 'platos.xlsx');
    } catch {
      Swal.fire({
        title: 'Error',
        text: 'Error al generar el archivo Excel',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handleFiltroChange = (value) => {
    setFiltro(value);
    setCurrentPage(1);
  };

  // Función helper para determinar si un plato está inactivo
// Función helper para determinar si un plato está inactivo
const esPlatoInactivo = (plato) => {
  if (!plato) return false;

  // Buscar el campo Deletemark / DeleteMark en varias variantes posibles
  const rawDeleteMark =
    plato.Deletemark !== undefined ? plato.Deletemark : // 👈 la que te devuelve el backend
    plato.DeleteMark !== undefined ? plato.DeleteMark :
    plato.deletemark !== undefined ? plato.deletemark :
    plato.deleteMark !== undefined ? plato.deleteMark :
    plato.delete_mark !== undefined ? plato.delete_mark :
    false;

  // Convertir a boolean si viene como string o número
  const isInactivo =
    rawDeleteMark === true ||
    rawDeleteMark === 1 ||
    rawDeleteMark === '1' ||
    (typeof rawDeleteMark === 'string' &&
      rawDeleteMark.toLowerCase() === 'true');

  return isInactivo;
};


  const handleActivarPlato = async (plato) => {
  try {
    setIsLoading(true);
    const platoId = plato.id || plato.Id || plato.ID;
    
    if (!platoId) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener el ID del plato',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    const usuario = getUsuarioLogueado();

    // 👉 ahora llamamos directo al endpoint /api/plato/Activar
    await apiService.activarPlato(platoId, usuario || null);

    Swal.fire({
      title: 'Éxito',
      text: 'Plato activado correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#F34949',
    });
    
    await cargarPlatos(currentPage, filtro);
  } catch (error) {
    if (!error.redirectToLogin) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al activar el plato',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  } finally {
    setIsLoading(false);
  }
};


  // ===================== render =====================

  if (vista === 'lista') {
    return (
      <div className="container-fluid" style={{ padding: 0 }}>
        {/* Barra negra título */}
        <div
          style={{
            backgroundColor: '#343A40',
            color: 'white',
            padding: '0.5rem 0',
            width: '100%',
            minHeight: 'auto',
          }}
        >
          <h3
            style={{
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
              alignItems: 'center',
            }}
          >
            <i
              className="fa fa-fish mr-2"
              style={{ fontSize: '0.9em' }}
              aria-hidden="true"
            ></i>
            Platos
          </h3>
        </div>

        <div
          style={{
            paddingTop: '1.5rem',
            paddingLeft: '3rem',
            paddingRight: '3rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Botón Agregar */}
          <div style={{ marginBottom: '1rem' }}>
            <AgregarButton onClick={handleCrearPlato} />
          </div>

          {/* Buscador + export */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1', minWidth: '300px' }}>
              <Buscador
                filtro={filtro}
                setFiltro={handleFiltroChange}
                placeholder="Filtrar por código, descripción..."
              />
            </div>

            {/* Filtro de platos activos */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.375rem 0.75rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ced4da',
                borderRadius: '0.25rem',
                height: '38px',
              }}
            >
              <input
                type="checkbox"
                id="soloActivos"
                checked={soloActivos}
                onChange={(e) => {
                  setSoloActivos(e.target.checked);
                  setCurrentPage(1);
                }}
                style={{
                  marginRight: '0.5rem',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="soloActivos"
                style={{
                  margin: 0,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#495057',
                  userSelect: 'none',
                }}
              >
                Platos activos
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                onClick={handleExportarPDF}
                disabled={platos.length === 0}
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
                  fontSize: '1rem',
                }}
              >
                <i className="fa fa-file-pdf" aria-hidden="true"></i>
              </button>

              <button
                type="button"
                className="btn"
                onClick={handleExportarExcel}
                disabled={platos.length === 0}
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
                  fontSize: '1rem',
                }}
              >
                <i className="fa fa-file-excel" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          {/* Tabla */}
          <DataTable
            columns={[
              {
                key: 'foto',
                field: 'foto',
                label: 'Foto',
                render: (value, row) => {
                  const foto =
                    row.foto || row.Foto || row.imagen || row.Imagen || null;
                  if (foto) {
                    let fotoUrl = foto;
                    if (!foto.startsWith('http') && !foto.startsWith('data:')) {
                      const baseUrl = getApiBaseUrl();
                      fotoUrl = `${baseUrl}${
                        foto.startsWith('/') ? '' : '/'
                      }${foto}`;
                    }
                    return (
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                        }}
                      >
                        <img
                          src={fotoUrl}
                          alt={row.descripcion || row.Descripcion || 'Plato'}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '0.25rem',
                            border: '1px solid #dee2e6',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              const fallback =
                                parent.querySelector('.sin-foto-fallback') ||
                                document.createElement('span');
                              if (
                                !parent.querySelector('.sin-foto-fallback')
                              ) {
                                fallback.className = 'sin-foto-fallback';
                                fallback.style.cssText =
                                  'color: #6c757d; font-style: italic; display: inline-block;';
                                fallback.innerHTML =
                                  '<i class="fa fa-image mr-1"></i>Sin foto';
                                parent.appendChild(fallback);
                              } else {
                                fallback.style.display = 'inline-block';
                              }
                            }
                          }}
                        />
                        <span
                          className="sin-foto-fallback"
                          style={{
                            display: 'none',
                            color: '#6c757d',
                            fontStyle: 'italic',
                          }}
                        >
                          <i className="fa fa-image mr-1"></i>Sin foto
                        </span>
                      </div>
                    );
                  }
                  return (
                    <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      <i className="fa fa-image mr-1"></i>Sin foto
                    </span>
                  );
                },
              },
              {
                key: 'codigo',
                field: 'codigo',
                label: 'Código',
                render: (v, row) =>
                  row.codigo ||
                  row.Codigo ||
                  row.cod_plato ||
                  row.codPlato ||
                  '-',
              },
              {
                key: 'descripcion',
                field: 'descripcion',
                label: 'Descripción',
                render: (v, row) =>
                  row.descripcion || row.Descripcion || '-',
              },
              {
                key: 'plannutricional',
                field: 'plannutricional',
                label: 'Plan Nutricional',
                render: (v, row) => {
                  const planNombre =
                    row.plannutricional_nombre ||
                    row.Plannutricional_nombre ||
                    row.planNutricional_nombre ||
                    row.planNutricionalNombre ||
                    row.plan_nutricional_nombre ||
                    (row.planNutricional &&
                      (row.planNutricional.nombre ||
                        row.planNutricional.Nombre)) ||
                    (row.PlanNutricional &&
                      (row.PlanNutricional.nombre ||
                        row.PlanNutricional.Nombre)) ||
                    '-';
                  return planNombre;
                },
              },
              {
                key: 'costo',
                field: 'costo',
                label: 'Costo',
                render: (v, row) => {
                  const costo =
                    row.costo ||
                    row.Costo ||
                    row.precio ||
                    row.Precio ||
                    0;
                  return `$${parseFloat(costo).toFixed(2)}`;
                },
              },
            ]}
            data={platos}
            isLoading={isLoading}
            emptyMessage={
              filtro
                ? 'No se encontraron platos que coincidan con la búsqueda'
                : 'No hay platos registrados'
            }
            onEdit={handleEditarPlato}
            canEdit={(plato) => {
              // No permitir editar si el plato está inactivo
              return !esPlatoInactivo(plato);
            }}
            onDelete={(plato) => {
              Swal.fire({
                title: '¿Está seguro?',
                text: `¿Desea eliminar el plato ${
                  plato.descripcion ||
                  plato.Descripcion ||
                  plato.codigo ||
                  plato.Codigo
                }?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#F34949',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
              }).then(async (result) => {
                if (result.isConfirmed) {
                  try {
                    setIsLoading(true);
                    const platoId = plato.id || plato.Id || plato.ID;
                    await apiService.eliminarPlato(platoId);
                    Swal.fire({
                      title: 'Eliminado',
                      text: 'Plato eliminado correctamente',
                      icon: 'success',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                    cargarPlatos(currentPage, filtro);
                  } catch (error) {
                    if (!error.redirectToLogin) {
                      Swal.fire({
                        title: 'Error',
                        text:
                          error.message || 'Error al eliminar el plato',
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#F34949',
                      });
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }
              });
            }}
            canDelete={(plato) => {
              // Solo permitir eliminar si el plato está activo (sin importar la cantidad de platos)
              return !esPlatoInactivo(plato);
            }}
            renderActions={(plato) => {
              // Verificar si el plato está inactivo
              const isInactivo = esPlatoInactivo(plato);
              
              console.log('DEBUG renderActions - Ejecutándose para plato:', {
                id: plato.id || plato.Id,
                descripcion: plato.descripcion || plato.Descripcion,
                isInactivo: isInactivo,
                vaARenderizarBoton: isInactivo
              });
              
              // Si el plato está inactivo, mostrar SOLO el botón de activar
              if (isInactivo) {
                console.log('DEBUG renderActions - Renderizando botón Activar');
                return (
                  <button
                    className="btn btn-sm"
                    onClick={() => handleActivarPlato(plato)}
                    title="Activar plato"
                    disabled={isLoading}
                    style={{ 
                      backgroundColor: '#6c757d', 
                      borderColor: '#6c757d', 
                      color: 'white',
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '400',
                      borderRadius: '0.25rem',
                      transition: 'all 0.2s ease',
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.backgroundColor = '#5a6268';
                        e.target.style.borderColor = '#5a6268';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.target.style.backgroundColor = '#6c757d';
                        e.target.style.borderColor = '#6c757d';
                      }
                    }}
                  >
                    <i className="fa fa-check mr-1" style={{ fontSize: '0.8rem' }}></i> Activar
                  </button>
                );
              }
              
              console.log('DEBUG renderActions - No renderizando botón (plato activo)');
              // Si está activo, no renderizar nada aquí (se mostrarán los botones de editar y eliminar por defecto)
              return null;
            }}
            // Paginación: solo pasar props del servidor si está habilitada
            {...(isServerSidePagination ? {
              currentPage: currentPage,
              totalPages: totalPages,
              totalItems: totalItems,
              onPageChange: handlePageChange
            } : {})}
            enablePagination={true}
          />
        </div>
      </div>
    );
  }

  // ===== formulario crear/editar =====
  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      <div
        style={{
          backgroundColor: '#343A40',
          color: 'white',
          padding: '0.5rem 0',
          width: '100%',
          minHeight: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '1.5rem',
          }}
        >
          <button
            type="button"
            className="btn btn-link text-white mr-3"
            onClick={handleVolverALista}
            style={{
              padding: 0,
              textDecoration: 'none',
              fontSize: '1.2rem',
              border: 'none',
              background: 'none',
            }}
          >
            <i className="fa fa-arrow-left"></i>
          </button>
          <h3
            style={{
              fontSize: '1.75rem',
              fontWeight: 'normal',
              margin: 0,
              fontFamily: 'sans-serif',
              color: 'white',
              textAlign: 'left',
              paddingTop: '0',
              paddingBottom: '0',
              lineHeight: '1.5',
            }}
          >
            {vista === 'editar' ? 'Editar Plato' : 'Nuevo Plato'}
          </h3>
        </div>
      </div>

      {/* Barra informativa para creación */}
      {vista === 'crear' && (
        <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
          <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
          <span style={{ color: '#0097A7' }}>Creando nuevo plato - Complete los campos obligatorios para guardar.</span>
        </div>
      )}

      {/* Barra informativa para edición */}
      {vista === 'editar' && (
        <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
          <i className="fa fa-pencil-alt" style={{ color: '#0097A7' }}></i>
          <span style={{ color: '#0097A7' }}>Editando plato - Modifique los campos necesarios y guarde los cambios.</span>
        </div>
      )}

      <div className="usuarios-form-container">
        <form>
          <div className="form-section">
            <div className="form-section-title">
              <i
                className="fa fa-fish mr-2"
                style={{ fontSize: '0.8em' }}
              ></i>
              <span>Información del Plato</span>
            </div>
            <div className="form-section-content">
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label htmlFor="codigo">
                      Código <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                      <input
                        type="text"
                        className="form-control"
                        id="codigo"
                        name="codigo"
                        value={formData.codigo || ''}
                        onChange={handleInputChange}
                        required
                        placeholder="Ingrese el código del plato"
                        disabled={vista === 'editar'}
                        style={{ 
                          flex: 1,
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          borderRight: 'none',
                        }}
                      />
                      {vista !== 'editar' && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleGenerarCodigo}
                          title="Generar código desde la descripción"
                          style={{
                            borderColor: '#ced4da',
                            color: '#6c757d',
                            whiteSpace: 'nowrap',
                            padding: '0.375rem 0.75rem',
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderLeft: 'none',
                            backgroundColor: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="fa fa-magic"></i>
                        </button>
                      )}
                    </div>
                    {vista === 'editar' ? (
                      <small
                        className="form-text text-muted"
                        style={{
                          fontSize: '0.85rem',
                          marginTop: '0.25rem',
                        }}
                      >
                        El código no se puede modificar
                      </small>
                    ) : (
                      <small
                        className="form-text text-muted"
                        style={{
                          fontSize: '0.85rem',
                          marginTop: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <i className="fa fa-info-circle mr-1"></i>
                        Presione el botón para generar el código automáticamente desde la descripción. Puede modificarlo manualmente si lo desea.
                      </small>
                    )}
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="form-group">
                    <label htmlFor="descripcion">
                      Descripción{' '}
                      <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="descripcion"
                      name="descripcion"
                      value={formData.descripcion || ''}
                      onChange={handleInputChange}
                      required
                      placeholder="Ingrese la descripción del plato"
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label htmlFor="costo">
                      Costo <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      id="costo"
                      name="costo"
                      value={formData.costo || ''}
                      onChange={handleInputChange}
                      required
                      placeholder="0.00"
                    />
                    <small
                      className="form-text text-muted"
                      style={{
                        fontSize: '0.85rem',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <i className="fa fa-info-circle mr-1"></i>
                      Si el plato no tiene costo, colocarse 0.
                    </small>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label htmlFor="plannutricional_id">
                      Plan Nutricional
                    </label>
                    <select
                      className="form-control"
                      id="plannutricional_id"
                      name="plannutricional_id"
                      value={formData.plannutricional_id || ''}
                      onChange={handleInputChange}
                      disabled={planesNutricionales.length <= 1}
                      style={
                        planesNutricionales.length <= 1
                          ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }
                          : {}
                      }
                    >
                      {planesNutricionales.length > 0 ? (
                        planesNutricionales.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.nombre ||
                              plan.Nombre ||
                              plan.descripcion ||
                              plan.Descripcion}
                          </option>
                        ))
                      ) : (
                        <option value="">
                          Cargando planes nutricionales...
                        </option>
                      )}
                    </select>
                    {planesNutricionales.length <= 1 &&
                      planesNutricionales.length > 0 && (
                        <small
                          className="form-text text-muted"
                          style={{
                            fontSize: '0.85rem',
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <i className="fa fa-info-circle mr-1"></i>
                          Solo hay una opción disponible
                        </small>
                      )}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="presentacion">Presentación</label>
                    <textarea
                      className="form-control"
                      id="presentacion"
                      name="presentacion"
                      value={formData.presentacion || ''}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Ingrese la presentación del plato"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="imagen">Imagen</label>
                    <input
                      type="file"
                      className="form-control-file"
                      id="imagen"
                      name="imagen"
                      accept="image/*"
                      onChange={handleInputChange}
                    />
                    {formData.imagenPreview && (
                      <div style={{ marginTop: '1rem' }}>
                        <img
                          src={formData.imagenPreview}
                          alt="Vista previa"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: '0.25rem',
                            marginBottom: '0.5rem',
                          }}
                        />
                        <br />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={handleEliminarImagen}
                        >
                          <i className="fa fa-trash"></i> Eliminar imagen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="ingredientes">Ingredientes</label>
                    <textarea
                      className="form-control"
                      id="ingredientes"
                      name="ingredientes"
                      value={formData.ingredientes || ''}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Ingrese los ingredientes del plato"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="row mt-3">
            <div className="col-md-12 d-flex justify-content-end">
              <button
                type="button"
                className="btn mr-2"
                onClick={handleVolverALista}
                style={{
                  backgroundColor: '#F34949',
                  borderColor: '#F34949',
                  color: 'white',
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
                  color: 'white',
                }}
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Plato;
