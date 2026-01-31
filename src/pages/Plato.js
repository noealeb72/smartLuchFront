// src/pages/Plato.js
import React, { useState, useEffect, useCallback } from 'react';
import { platosService } from '../services/platosService';
import { catalogosService } from '../services/catalogosService';
import { getApiBaseUrl } from '../services/configService';
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
  const [filtroActivo, setFiltroActivo] = useState('activo'); // 'activo', 'inactivo', 'todos'
  const [vista, setVista] = useState('lista'); // 'lista' | 'editar' | 'crear'
  const [planesNutricionales, setPlanesNutricionales] = useState([]);

  // Estados para el modal de impresión
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState({
    codigo: true,
    descripcion: true,
    plannutricional: true,
    importe: true,
    presentacion: false,
    ingredientes: false,
    estado: false,
  });
  const [filtrosImpresion, setFiltrosImpresion] = useState({
    planNutricionalId: '',
    activo: null, // null = todos, true = solo activos, false = solo inactivos
  });

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
    Plannutricional_id: '',
    presentacion: '',
    ingredientes: '',
    Foto: null,
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
      const data = await catalogosService.getPlanesNutricionales();
      const planesArray = Array.isArray(data)
        ? data
        : data.data || data.items || [];
      setPlanesNutricionales(planesArray);
    } catch (error) {
      setPlanesNutricionales([]);
    }
  }, []);

  const cargarPlatos = useCallback(
    async (page = 1, searchTerm = '') => {
      try {
        setIsLoading(true);
        // Convertir filtroActivo a boolean para el backend
        // 'activo' -> true, 'inactivo' -> false, 'todos' -> null
        const soloActivos = filtroActivo === 'activo' ? true : filtroActivo === 'inactivo' ? false : null;
        // Pasar el parámetro activo al backend
        const data = await platosService.obtenerPlatosLista(page, pageSize, searchTerm, soloActivos);

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
        
        setPlatos(items);
        setCurrentPage(page);
        setTotalPages(totalPagesCount);
        setTotalItems(totalItemsCount);
      } catch (error) {

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
    [pageSize, filtroActivo]
  );

  useEffect(() => {
    cargarPlanesNutricionales();
  }, [cargarPlanesNutricionales]);

  useEffect(() => {
    cargarPlatos(currentPage, filtro);
  }, [currentPage, filtro, filtroActivo, cargarPlatos]);

  // Auto-seleccionar plan nutricional si hay solo uno disponible
  useEffect(() => {
    if (
      planesNutricionales.length === 1 &&
      (vista === 'crear' || vista === 'editar')
    ) {
      setFormData(prev => {
        const idExacto = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
        const idExactoString = String(idExacto);
        
        // Actualizar siempre si el valor actual no coincide con el plan único disponible
        // Esto asegura que el valor por defecto se guarde en formData
        if (prev.Plannutricional_id !== idExactoString) {

          return {
            ...prev,
            Plannutricional_id: idExactoString
          };
        }
        return prev;
      });
    }
  }, [planesNutricionales, vista]);

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

    // Si es el select de plan nutricional y hay un solo plan disponible,
    // asegurarse de que el valor se guarde correctamente
    if (name === 'Plannutricional_id') {
      const planValue = value || (planesNutricionales.length === 1 ? String(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID) : '');
      setFormData((prev) => ({
        ...prev,
        [name]: planValue,
      }));

      return;
    }

    if (name === 'Foto' && files && files[0]) {
      const file = files[0];
      
      // Validar tipo de archivo (solo JPG y PNG)
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
      const extensionesPermitidas = ['.jpg', '.jpeg', '.png'];
      const nombreArchivo = file.name.toLowerCase();
      const extensionArchivo = nombreArchivo.substring(nombreArchivo.lastIndexOf('.'));
      
      if (!tiposPermitidos.includes(file.type) && !extensionesPermitidas.includes(extensionArchivo)) {
        Swal.fire({
          title: 'Error',
          text: 'El archivo debe ser una imagen en formato JPG o PNG',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        // Limpiar el input
        e.target.value = '';
        return;
      }
      
      // Validar tamaño máximo (5MB = 5 * 1024 * 1024 bytes)
      const tamañoMaximo = 5 * 1024 * 1024; // 5MB
      if (file.size > tamañoMaximo) {
        Swal.fire({
          title: 'Error',
          text: `El archivo es demasiado grande. El tamaño máximo permitido es de 5MB. El archivo seleccionado tiene ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        // Limpiar el input
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          Foto: file,
          imagenPreview: reader.result,
          eliminarImagen: false,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => {
        const nuevo = { ...prev, [name]: value };
        // Asegurar que se preserve la imagenPreview y Foto cuando se cambian otros campos
        // El spread operator ya debería preservarlos, pero lo hacemos explícito para mayor seguridad
        if (prev.imagenPreview) {
          nuevo.imagenPreview = prev.imagenPreview;
        }
        if (prev.Foto) {
          nuevo.Foto = prev.Foto;
        }
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

    // Validar plan nutricional
    /*const plannutricionalIdValue = formData.Plannutricional_id && formData.Plannutricional_id !== ''
      ? parseInt(formData.Plannutricional_id)
      : planesNutricionales.length === 1
      ? planesNutricionales[0].id
      : null;
    
    if (!plannutricionalIdValue || plannutricionalIdValue <= 0) {
      addError('Debe seleccionar un plan nutricional', 'Plannutricional_id');
    }
*/
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
      Plannutricional_id:
        planesNutricionales.length === 1
          ? String(planesNutricionales[0].id)
          : '',
      presentacion: '',
      ingredientes: '',
      Foto: null,
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

      const platoCompleto = await platosService.obtenerPlatoPorId(platoId);
      const platoParaEditar = platoCompleto || plato;

      setPlatoEditando(platoParaEditar);

      const obtenerPlanId = () => {
        // Según el DTO del backend (PlatoDetalleDto), el campo es Plannutricional_id (snake_case, int)
        // También puede venir en otras variantes por compatibilidad
        let planIdValue =
          platoParaEditar.Plannutricional_id || // snake_case (DTO del backend)
          platoParaEditar.plannutricional_id || // snake_case minúscula
          platoParaEditar.PlanNutricionalId || // PascalCase
          platoParaEditar.planNutricionalId || // camelCase
          platoParaEditar.plan_nutricional_id || // snake_case con guión bajo
          platoParaEditar.plannutricionalId || // variante
          platoParaEditar.planNutricional_id || // variante
          platoParaEditar.plannutricional || // sin sufijo
          platoParaEditar.planNutricional || // sin sufijo PascalCase
          // Si viene como objeto anidado
          (platoParaEditar.planNutricional &&
            (platoParaEditar.planNutricional.id ||
              platoParaEditar.planNutricional.Id ||
              platoParaEditar.planNutricional.ID)) ||
          (platoParaEditar.PlanNutricional &&
            (platoParaEditar.PlanNutricional.id ||
              platoParaEditar.PlanNutricional.Id ||
              platoParaEditar.PlanNutricional.ID)) ||
          // Si viene como objeto con nombre diferente
          (platoParaEditar.planNutricional_id &&
            typeof platoParaEditar.planNutricional_id === 'object' &&
            (platoParaEditar.planNutricional_id.id ||
              platoParaEditar.planNutricional_id.Id ||
              platoParaEditar.planNutricional_id.ID));

        // Si no se encontró un plan y hay solo uno disponible, auto-seleccionarlo
        if (
          (!planIdValue || planIdValue === '' || planIdValue === 0 || planIdValue === null) &&
          planesNutricionales.length === 1
        ) {
          planIdValue = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
        }

        // Convertir a string y validar
        let planIdFinal = '';
        if (planIdValue !== null && planIdValue !== undefined && planIdValue !== '' && planIdValue !== 0) {
          planIdFinal = String(planIdValue);
        }

        return planIdFinal;
      };

      const obtenerPresentacion = () => {
        // Según el DTO del backend (PlatoDetalleDto), el campo es Presentacion (string)
        return platoParaEditar.Presentacion ||
        platoParaEditar.presentacion ||
        (platoParaEditar.presentacion &&
          typeof platoParaEditar.presentacion === 'object' &&
          (platoParaEditar.presentacion.nombre ||
            platoParaEditar.presentacion.descripcion)) ||
        '';
      };

      const obtenerIngredientes = () => {
        // Según el DTO del backend (PlatoDetalleDto), el campo es Ingredientes (string)
        return platoParaEditar.Ingredientes ||
        platoParaEditar.ingredientes ||
        (platoParaEditar.ingredientes &&
          typeof platoParaEditar.ingredientes === 'object' &&
          (platoParaEditar.ingredientes.nombre ||
            platoParaEditar.ingredientes.descripcion)) ||
        '';
      };

      const planId = obtenerPlanId();
      const presentacion = obtenerPresentacion();
      const ingredientes = obtenerIngredientes();

      // Obtener la imagen: usar la variable Foto directamente y construir URL del servidor backend
      const obtenerImagenPreview = () => {
        // Usar directamente el campo Foto del DTO del backend
        const foto = platoParaEditar.Foto || // PascalCase (DTO del backend)
                     platoParaEditar.foto || // camelCase
                     platoParaEditar.imagen || // español
                     platoParaEditar.Imagen || // español PascalCase
                     null;

        if (!foto || foto.trim() === '') {

          return null;
        }
        
        // Si ya es una URL completa (http/https), devolverla tal cual
        if (foto.startsWith('http://') || foto.startsWith('https://')) {

          return foto;
        }
        
        // Si es base64, devolverla tal cual
        if (foto.startsWith('data:')) {

          return foto;
        }
        
        // Obtener la URL base del backend
        const baseUrl = getApiBaseUrl();

        // Si es una ruta absoluta del sistema de archivos, extraer solo la parte relativa después de 'uploads/platos/'
        if (foto.includes('uploads/platos/')) {

          // Buscar 'uploads/platos/' en la ruta
          const indiceUploads = foto.indexOf('uploads/platos/');
          if (indiceUploads !== -1) {
            // Extraer todo después de 'uploads/platos/' incluyendo el nombre del archivo
            const parteRelativa = foto.substring(indiceUploads);
            // Construir la ruta relativa: /uploads/platos/nombre_archivo
            const rutaRelativa = `/${parteRelativa}`;

            // Decodificar primero para obtener el nombre original, luego codificar solo si es necesario
            const partes = rutaRelativa.split('/');
            let nombreArchivo = partes.pop();
            const rutaBase = partes.join('/');
            
            // Si el nombre ya está codificado (contiene % pero no espacios), decodificarlo primero
            if (nombreArchivo.includes('%') && !nombreArchivo.includes(' ')) {
              try {
                nombreArchivo = decodeURIComponent(nombreArchivo);
              } catch (e) {
                // Si falla la decodificación, usar el nombre tal cual

              }
            }
            
            // Codificar solo si tiene espacios o caracteres especiales que necesiten codificación
            let nombreArchivoCodificado = nombreArchivo;
            if (nombreArchivo.includes(' ') || (!nombreArchivo.includes('%') && /[^a-zA-Z0-9._-]/.test(nombreArchivo))) {
              nombreArchivoCodificado = encodeURIComponent(nombreArchivo);
            }
            
            // Construir la URL completa del servidor backend
            const fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivoCodificado}`;

            return fotoUrl;
          }
        }
        
        // Si es una ruta relativa que empieza con /uploads/platos/, construir URL del servidor backend
        if (foto.startsWith('/uploads/platos/')) {
          // Decodificar primero para obtener el nombre original, luego codificar solo si es necesario
          const partes = foto.split('/');
          let nombreArchivo = partes.pop();
          const rutaBase = partes.join('/');
          
          // Si el nombre ya está codificado (contiene % pero no espacios), decodificarlo primero
          if (nombreArchivo.includes('%') && !nombreArchivo.includes(' ')) {
            try {
              nombreArchivo = decodeURIComponent(nombreArchivo);
            } catch (e) {
              // Si falla la decodificación, usar el nombre tal cual

            }
          }
          
          // Codificar solo si tiene espacios o caracteres especiales que necesiten codificación
          let nombreArchivoCodificado = nombreArchivo;
          if (nombreArchivo.includes(' ') || (!nombreArchivo.includes('%') && /[^a-zA-Z0-9._-]/.test(nombreArchivo))) {
            nombreArchivoCodificado = encodeURIComponent(nombreArchivo);
          }
          
          // Construir la URL completa del servidor backend
          const fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivoCodificado}`;

          return fotoUrl;
        }
        
        // Si es otra ruta relativa, construir URL del servidor backend
        const rutaNormalizada = foto.startsWith('/') ? foto : `/${foto}`;
        const fotoUrl = `${baseUrl}${rutaNormalizada}`;
        return fotoUrl;
      };

      // Verificar que el planId existe en los planes nutricionales disponibles y normalizarlo
      let planIdFinal = planId;
      if (planId && planId !== '') {
        const planIdNum = parseInt(planId);
        
        // Buscar el plan en los planes disponibles y usar el ID exacto que tiene el plan
        const planEncontrado = planesNutricionales.find(p => {
          const pId = p.id || p.Id || p.ID;
          return (
            pId === planIdNum ||
            pId === planId ||
            String(pId) === String(planIdNum) ||
            String(pId) === String(planId)
          );
        });
        
        if (planEncontrado) {
          // Usar el ID exacto del plan encontrado (puede ser id, Id, o ID)
          const idExacto = planEncontrado.id || planEncontrado.Id || planEncontrado.ID;
          planIdFinal = String(idExacto);

        } else {
          // Si no se encuentra y hay un solo plan disponible, usar ese
          if (planesNutricionales.length === 1) {
            const idExacto = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
            planIdFinal = String(idExacto);

          } else {
            planIdFinal = ''; // Si no se encuentra y hay múltiples planes, dejar vacío
          }
        }
      } else if (planesNutricionales.length === 1) {
        // Si no hay planId pero hay un solo plan disponible, usar ese
        const idExacto = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
        planIdFinal = String(idExacto);

      }

      // Obtener la imagen preview antes de asignar al formData
      const imagenPreviewValue = obtenerImagenPreview();


      // Mapear según el DTO del backend (PlatoDetalleDto)
      setFormData({
        id: platoParaEditar.Id || platoParaEditar.id || platoParaEditar.ID,
        codigo: platoParaEditar.Codigo || platoParaEditar.codigo || platoParaEditar.cod_plato || platoParaEditar.codPlato || '',
        descripcion: platoParaEditar.Descripcion || platoParaEditar.descripcion || '',
        costo: platoParaEditar.Costo || platoParaEditar.costo || platoParaEditar.precio || platoParaEditar.Precio || '',
        Plannutricional_id: planIdFinal,
        presentacion,
        ingredientes,
        imagen: null,
        imagenPreview: imagenPreviewValue, // Obtener la ruta de la imagen
        eliminarImagen: false,
      });

      setVista('editar');
    } catch (error) {
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
      Plannutricional_id: '',
      presentacion: '',
      ingredientes: '',
      Foto: null,
      imagenPreview: null,
      eliminarImagen: false,
    });
    setVista('lista');
  };

  const handleEliminarImagen = async () => {
    // Obtener la ruta de la imagen actual para eliminarla del servidor
    const rutaImagenActual = formData.imagenPreview || platoEditando?.Foto || platoEditando?.foto;
    
    if (rutaImagenActual) {
      try {
        // Eliminar el archivo del servidor
        await platosService.eliminarFotoPlato(rutaImagenActual);

      } catch (error) {

        // No bloquear el flujo si falla la eliminación del archivo
      }
    }

    setFormData((prev) => ({
      ...prev,
      Foto: null,
      imagenPreview: null,
      eliminarImagen: true,
    }));
  };

  // ===================== guardar (create/update) =====================

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      setIsLoading(true);

      // Calcular el ID del plan nutricional (opcional)
      // Si hay un solo plan disponible, se selecciona automáticamente
      // Si hay múltiples planes o ninguno, puede ser null
      let plannutricionalId = null;
      
      // Primero intentar obtener el valor del formData
      if (formData.Plannutricional_id && formData.Plannutricional_id !== '') {
        const parsedId = parseInt(formData.Plannutricional_id);
        if (!isNaN(parsedId) && parsedId > 0) {
          plannutricionalId = parsedId;

        }
      }
      
      // Si no hay plan en formData pero hay un solo plan disponible, usar ese plan
      if (!plannutricionalId && planesNutricionales.length === 1) {
        const planId = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
        if (planId && planId > 0) {
          plannutricionalId = planId;
          // Actualizar formData para que el select muestre el valor correcto
          setFormData(prev => ({
            ...prev,
            Plannutricional_id: String(planId)
          }));
        }
      }
      
      // Validar que si hay un plan seleccionado, sea válido (> 0)
      // Según el DTO: [Range(1, int.MaxValue)], así que debe ser > 0
      if (plannutricionalId !== null && plannutricionalId <= 0) {

        plannutricionalId = null;
      }

      // Manejo de la foto: usar la ruta del archivo en la carpeta public/uploads/platos/
      let fotoRuta = null;
      let eliminarFoto = false;

      if (formData.eliminarImagen) {
        // Si se marcó eliminar imagen, enviar flag para eliminar
        eliminarFoto = true;
        fotoRuta = null;

        // Obtener la ruta de la imagen actual para eliminarla del servidor
        const rutaImagenActual = platoEditando?.Foto || platoEditando?.foto;
        if (rutaImagenActual) {
          try {
            await platosService.eliminarFotoPlato(rutaImagenActual);

          } catch (error) {

          }
        }
      } else if (formData.Foto && formData.Foto instanceof File) {
        // Si hay un archivo nuevo, primero eliminar la imagen anterior si existe
        const rutaImagenAnterior = platoEditando?.Foto || platoEditando?.foto || 
                                   (formData.imagenPreview && formData.imagenPreview.includes('uploads/platos/') ? formData.imagenPreview : null);
        
        if (rutaImagenAnterior && !formData.imagenPreview?.startsWith('data:')) {
          try {

            await platosService.eliminarFotoPlato(rutaImagenAnterior);

          } catch (error) {

          }
        }
        
        // Si hay un archivo nuevo, enviarlo al backend para que lo guarde
        try {




          // El backend recibirá el archivo, lo guardará en public/uploads/platos/ y retornará la ruta
          fotoRuta = await platosService.subirFotoPlato(formData.Foto);

          // Actualizar imagenPreview con la ruta retornada para que se muestre en la vista previa
          // Construir la URL completa para la vista previa
          const fotoUrlParaPreview = fotoRuta.startsWith('/') 
            ? `${process.env.PUBLIC_URL || ''}${fotoRuta}` 
            : `${process.env.PUBLIC_URL || ''}/${fotoRuta}`;
          
          setFormData((prev) => ({
            ...prev,
            imagenPreview: fotoUrlParaPreview,
            Foto: null, // Ya no necesitamos el File, solo la ruta
          }));

        } catch (error) {

          Swal.fire({
            title: 'Error al subir imagen',
            html: `No se pudo subir la imagen al servidor.<br><br>
                   <strong>El backend debe:</strong><br>
                   1. Recibir el archivo en /api/plato/subir-foto<br>
                   2. Guardarlo en public/uploads/platos/<br>
                   3. Retornar la ruta relativa (ej: "/uploads/platos/imagen.jpg")<br><br>
                   <strong>Error:</strong> ${error.message || error}`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
            width: '600px'
          });
          setIsLoading(false);
          return;
        }
      } else if (formData.imagenPreview) {
        // Si hay imagenPreview, extraer la ruta si es una URL completa
        if (formData.imagenPreview.startsWith('/uploads/platos/')) {
          // Ya es una ruta relativa, usarla directamente
          fotoRuta = formData.imagenPreview;

        } else if (formData.imagenPreview.startsWith('http')) {
          // Si es una URL completa, extraer la ruta relativa si es del backend
          const baseUrl = getApiBaseUrl();
          if (formData.imagenPreview.startsWith(baseUrl)) {
            fotoRuta = formData.imagenPreview.replace(baseUrl, '');

            // Asegurar que si es /uploads/platos/, se use directamente
            if (!fotoRuta.startsWith('/uploads/platos/')) {

            }
          } else {
            // Si es una URL externa, no podemos usarla

            fotoRuta = null;
          }
        } else if (formData.imagenPreview.startsWith('data:')) {
          // Si es base64, no podemos usarla como ruta

          fotoRuta = null;
        } else if (formData.imagenPreview.startsWith('uploads/')) {
          // Si es una ruta sin / inicial, normalizarla
          fotoRuta = `/${formData.imagenPreview}`;

        } else {
          // Cualquier otra cosa, asumir que es una ruta relativa
          fotoRuta = formData.imagenPreview.startsWith('/') ? formData.imagenPreview : `/${formData.imagenPreview}`;

        }
      } else {
        // No hay imagen para enviar

        fotoRuta = null;
      }

      if (platoEditando) {
        const platoData = {
          Id: parseInt(formData.id),
          Codigo: (formData.codigo || '').trim(),
          Ingredientes: (formData.ingredientes || '').trim() || null,
          Presentacion: (formData.presentacion || '').trim() || null,
          Plannutricional_id: plannutricionalId && plannutricionalId > 0 ? plannutricionalId : null,
          Descripcion: (formData.descripcion || '').trim(),
          Costo: formData.costo && formData.costo !== '' && !isNaN(parseFloat(formData.costo))
              ? parseFloat(formData.costo)
              : 0,
          Foto: fotoRuta || null, // El backend espera Foto (string), ruta del archivo (ej: /uploads/platos/imagen.jpg)
          EliminarFoto: eliminarFoto,
        };

        await platosService.actualizarPlato(platoData);

        Swal.fire({
          title: 'Éxito',
          text: 'Plato actualizado correctamente',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        const platoData = {
          Codigo: (formData.codigo || '').trim(),
          Ingredientes: (formData.ingredientes || '').trim() || null,
          Presentacion: (formData.presentacion || '').trim() || null,
          Plannutricional_id: plannutricionalId && plannutricionalId > 0 ? plannutricionalId : null,
          Descripcion: (formData.descripcion || '').trim(),
          Costo: formData.costo && formData.costo !== '' && !isNaN(parseFloat(formData.costo))
              ? parseFloat(formData.costo)
              : 0,
          Foto: fotoRuta || null, // El backend espera Foto (string), ruta del archivo (ej: /uploads/platos/imagen.jpg)
        };

        await platosService.crearPlato(platoData);

        Swal.fire({
          title: 'Éxito',
          text: 'Plato creado correctamente',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      }

      await cargarPlatos(currentPage, filtro);
      handleVolverALista();
    } catch (error) {
      if (!error.redirectToLogin) {
        // Extraer el mensaje de error del backend si está disponible
        let errorMessage = `Error al ${platoEditando ? 'actualizar' : 'crear'} el plato`;
        
        if (error.backendMessage) {
          errorMessage = error.backendMessage;
        } else if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.Message) {
            errorMessage = error.response.data.Message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.Error) {
            errorMessage = error.response.data.Error;
          }
        } else if (error.message) {
          errorMessage = error.message;
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

  // ===================== export / delete / pag =====================

  const handleExportarPDF = async (columnas = null, filtros = null) => {
    const cols = columnas || columnasSeleccionadas;
    const filtrosAplicar = filtros || filtrosImpresion;
    
    try {
      setIsLoading(true);
      
      // Mapear columnas seleccionadas al formato del endpoint
      const columnasRequest = {
        incluirCodigo: cols.codigo || false,
        incluirDescripcion: cols.descripcion || false,
        incluirPlanNutricional: cols.plannutricional || false,
        incluirImporte: cols.importe || false,
        incluirPresentacion: cols.presentacion || false,
        incluirIngredientes: cols.ingredientes || false,
        incluirEstado: cols.estado || false,
      };

      // Mapear filtros al formato del endpoint
      const filtrosRequest = {
        planNutricionalId: filtrosAplicar.planNutricionalId ? parseInt(filtrosAplicar.planNutricionalId) : null,
        estado: filtrosAplicar.activo === null ? null : (filtrosAplicar.activo ? 'Activo' : 'Inactivo'),
      };

      // Llamar al endpoint de impresión
      const requestData = {
        ...columnasRequest,
        ...filtrosRequest,
      };
      
      const platosFiltrados = await platosService.getImpresion(requestData);

      if (!platosFiltrados || platosFiltrados.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay platos que coincidan con los filtros seleccionados',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      const doc = new jsPDF();

      // Título centrado
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(14);
      const titulo = 'Listado de Platos';
      const tituloWidth = doc.getTextWidth(titulo);
      const tituloX = (pageWidth - tituloWidth) / 2;
      doc.text(titulo, tituloX, 15);

      // Fecha centrada con letra más chica
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.setFontSize(9);
      const fechaTexto = `Generado el: ${fecha}`;
      const fechaWidth = doc.getTextWidth(fechaTexto);
      const fechaX = (pageWidth - fechaWidth) / 2;
      doc.text(fechaTexto, fechaX, 22);

      // Obtener headers y datos desde la respuesta del API
      const headers = [];
      const tableData = [];
      
      // Mapeo de nombres de columnas del API (PascalCase) a labels
      const columnLabels = {
        Codigo: 'Código',
        codigo: 'Código',
        Descripcion: 'Descripción',
        descripcion: 'Descripción',
        PlanNutricional: 'Plan Nutricional',
        planNutricional: 'Plan Nutricional',
        Importe: 'Importe ($)',
        importe: 'Importe ($)',
        Costo: 'Importe ($)',
        costo: 'Importe ($)',
        Presentacion: 'Presentación',
        presentacion: 'Presentación',
        Ingredientes: 'Ingredientes',
        ingredientes: 'Ingredientes',
        Estado: 'Estado',
        estado: 'Estado',
      };

      // Construir headers basado en las columnas que tienen datos
      if (platosFiltrados.length > 0) {
        const primerPlato = platosFiltrados[0];
        Object.keys(primerPlato).forEach(key => {
          if (primerPlato[key] !== null && columnLabels[key]) {
            headers.push(columnLabels[key]);
          }
        });
      }

      // Construir datos de la tabla manteniendo el orden de los headers
      const columnasOrdenadas = headers.map(header => {
        // Encontrar la clave que corresponde a este header
        for (const [key, label] of Object.entries(columnLabels)) {
          if (label === header) {
            return key;
          }
        }
        return null;
      }).filter(key => key !== null);

      platosFiltrados.forEach((plato) => {
        const fila = [];
        columnasOrdenadas.forEach(key => {
          // Buscar la propiedad en el objeto (puede ser PascalCase o camelCase)
          const valor = plato[key] || plato[key.charAt(0).toUpperCase() + key.slice(1)] || null;
          fila.push(valor !== null ? String(valor) : '-');
        });
        tableData.push(fila);
      });

      doc.autoTable({
        startY: 28,
        head: [headers],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [52, 58, 64], fontStyle: 'bold', halign: 'center' },
      });

      doc.save('platos.pdf');
      
      if (columnas || filtros) {
        setMostrarModalImpresion(false);
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al generar el PDF',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportarExcel = async (columnas = null, filtros = null) => {
    const cols = columnas || columnasSeleccionadas;
    const filtrosAplicar = filtros || filtrosImpresion;
    
    try {
      setIsLoading(true);
      
      // Mapear columnas seleccionadas al formato del endpoint
      const columnasRequest = {
        incluirCodigo: cols.codigo || false,
        incluirDescripcion: cols.descripcion || false,
        incluirPlanNutricional: cols.plannutricional || false,
        incluirImporte: cols.importe || false,
        incluirPresentacion: cols.presentacion || false,
        incluirIngredientes: cols.ingredientes || false,
        incluirEstado: cols.estado || false,
      };

      // Mapear filtros al formato del endpoint
      const filtrosRequest = {
        planNutricionalId: filtrosAplicar.planNutricionalId ? parseInt(filtrosAplicar.planNutricionalId) : null,
        estado: filtrosAplicar.activo === null ? null : (filtrosAplicar.activo ? 'Activo' : 'Inactivo'),
      };

      // Llamar al endpoint de impresión
      const requestData = {
        ...columnasRequest,
        ...filtrosRequest,
      };
      
      const platosFiltrados = await platosService.getImpresion(requestData);
      
      if (!platosFiltrados || platosFiltrados.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay platos que coincidan con los filtros seleccionados',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      // Obtener headers y datos desde la respuesta del API
      const headers = [];
      
      // Mapeo de nombres de columnas del API (PascalCase) a labels
      const columnLabels = {
        Codigo: 'Código',
        codigo: 'Código',
        Descripcion: 'Descripción',
        descripcion: 'Descripción',
        PlanNutricional: 'Plan Nutricional',
        planNutricional: 'Plan Nutricional',
        Importe: 'Importe ($)',
        importe: 'Importe ($)',
        Costo: 'Importe ($)',
        costo: 'Importe ($)',
        Presentacion: 'Presentación',
        presentacion: 'Presentación',
        Ingredientes: 'Ingredientes',
        ingredientes: 'Ingredientes',
        Estado: 'Estado',
        estado: 'Estado',
      };

      // Construir headers basado en las columnas que tienen datos
      if (platosFiltrados.length > 0) {
        const primerPlato = platosFiltrados[0];
        Object.keys(primerPlato).forEach(key => {
          if (primerPlato[key] !== null && columnLabels[key]) {
            headers.push(columnLabels[key]);
          }
        });
      }

      // Construir datos de la tabla manteniendo el orden de los headers
      const columnasOrdenadas = headers.map(header => {
        // Encontrar la clave que corresponde a este header
        for (const [key, label] of Object.entries(columnLabels)) {
          if (label === header) {
            return key;
          }
        }
        return null;
      }).filter(key => key !== null);

      // Construir datos con todos los campos
      const worksheetData = platosFiltrados.map((plato) => {
        const fila = [];
        columnasOrdenadas.forEach(key => {
          // Buscar la propiedad en el objeto (puede ser PascalCase o camelCase)
          const valor = plato[key] || plato[key.charAt(0).toUpperCase() + key.slice(1)] || null;
          fila.push(valor !== null ? String(valor) : '-');
        });
        return fila;
      });

      // Obtener fecha formateada
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const numColumnas = headers.length;
      
      // Crear datos con título y fecha
      const datosConTitulo = [
        [], // Fila vacía
        ['Listado de Platos'], // Título
        [`Generado el: ${fecha}`], // Fecha
        [], // Fila vacía
        headers, // Headers
        ...worksheetData, // Datos
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(datosConTitulo);
      
      // Fusionar celdas para centrar título y fecha
      worksheet['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: numColumnas - 1 } }, // Título centrado
        { s: { r: 2, c: 0 }, e: { r: 2, c: numColumnas - 1 } }, // Fecha centrada
        { s: { r: 3, c: 0 }, e: { r: 3, c: numColumnas - 1 } }, // Fila vacía
      ];
      
      // Ajustar el ancho de las columnas
      const colWidths = headers.map(() => ({ wch: 18 }));
      worksheet['!cols'] = colWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Platos');
      XLSX.writeFile(workbook, 'platos.xlsx');
      
      if (columnas || filtros) {
        setMostrarModalImpresion(false);
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al generar el archivo Excel',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setIsLoading(false);
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
    await platosService.activarPlato(platoId, usuario || null);

    Swal.fire({
      title: 'Éxito',
      text: 'Plato activado correctamente',
      icon: 'success',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
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
        <div className="page-title-bar">
          <h3>
            <i className="fa fa-fish mr-2" aria-hidden="true"></i>
            <span>Platos</span>
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
              alignItems: 'center',
              gap: '8.0rem',
              marginBottom: '1rem',
              flexWrap: 'nowrap',
            }}
          >
            <div style={{ flex: '1', minWidth: '200px', maxWidth: '100%' }}>
              <Buscador
                filtro={filtro}
                setFiltro={handleFiltroChange}
                placeholder="Filtrar por código, descripción..."
              />
            </div>

            <div style={{ display: 'flex', gap: '5.0rem', alignItems: 'center', flexShrink: 0, flexWrap: 'nowrap' }}>
              {/* Filtro de platos activos/inactivos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                <label style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  color: '#495057', 
                  whiteSpace: 'nowrap',
                  fontWeight: 'normal'
                }}>
                  Estado:
                </label>
                <select
                  className="form-control"
                  value={filtroActivo}
                  onChange={(e) => {
                    setFiltroActivo(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.85rem',
                    border: '1px solid #ced4da',
                    borderRadius: '0.25rem',
                    backgroundColor: 'white',
                    color: '#495057',
                    cursor: 'pointer',
                    width: 'auto',
                    minWidth: 'fit-content',
                    height: '38px',
                    flexShrink: 0,
                  }}
                >
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setMostrarModalImpresion(true)}
                disabled={platos.length === 0}
                title="Opciones de impresión"
                style={{
                  backgroundColor: '#007bff',
                  borderColor: '#007bff',
                  color: 'white',
                  padding: '0.375rem 0.5rem',
                  width: '36px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                <i className="fa fa-print" aria-hidden="true"></i>
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
                  // Buscar el campo Foto en todas sus variantes posibles
                  let foto =
                    row.Foto || // PascalCase (según DTO del backend)
                    row.foto || // camelCase
                    row.imagen || // español
                    row.Imagen || // español PascalCase
                    null;

                  if (foto && foto.trim() !== '') {
                    // Si es una ruta absoluta del sistema de archivos, extraer solo el nombre del archivo
                    if (foto.includes('\\') || (foto.includes('/') && (foto.includes('C:') || foto.includes('D:') || foto.includes('api/plato/imagen')))) {

                      // Extraer el nombre del archivo de la ruta
                      let nombreArchivo = foto.split('\\').pop().split('/').pop();
                      // Decodificar URL encoding solo si está codificado (contiene % pero no espacios)
                      if (nombreArchivo.includes('%') && !nombreArchivo.includes(' ')) {
                        try {
                          nombreArchivo = decodeURIComponent(nombreArchivo);
                        } catch (e) {
                          // Si falla la decodificación, usar el nombre tal cual

                        }
                      }
                      // Construir la ruta relativa para el frontend
                      foto = `/uploads/platos/${nombreArchivo}`;

                    }
                    
                    let fotoUrl = foto;
                    
                    // Si es una URL completa (http/https) o base64, usarla tal cual
                    if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
                      fotoUrl = foto;

                    } else if (foto.startsWith('/uploads/platos/') || foto.includes('uploads/platos/')) {
                      // Si es una ruta de uploads/platos/, construir la URL completa apuntando al servidor backend
                      const baseUrl = getApiBaseUrl();
                      
                      // Si contiene 'uploads/platos/' pero no empieza con '/', extraer la parte relativa
                      let rutaRelativa = foto;
                      if (foto.includes('uploads/platos/') && !foto.startsWith('/uploads/platos/')) {
                        const indiceUploads = foto.indexOf('uploads/platos/');
                        rutaRelativa = `/${foto.substring(indiceUploads)}`;
                      }
                      
                      // Decodificar primero para obtener el nombre original, luego codificar solo si es necesario
                      const partes = rutaRelativa.split('/');
                      let nombreArchivo = partes.pop();
                      const rutaBase = partes.join('/');
                      
                      // Si el nombre ya está codificado (contiene % pero no espacios), decodificarlo primero
                      if (nombreArchivo.includes('%') && !nombreArchivo.includes(' ')) {
                        try {
                          nombreArchivo = decodeURIComponent(nombreArchivo);
                        } catch (e) {
                          // Si falla la decodificación, usar el nombre tal cual

                        }
                      }
                      
                      // Codificar solo si tiene espacios o caracteres especiales que necesiten codificación
                      let nombreArchivoCodificado = nombreArchivo;
                      if (nombreArchivo.includes(' ') || (!nombreArchivo.includes('%') && /[^a-zA-Z0-9._-]/.test(nombreArchivo))) {
                        nombreArchivoCodificado = encodeURIComponent(nombreArchivo);
                      }
                      
                      fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivoCodificado}`;
                    } else {
                      // Si es otra ruta relativa, construir URL del servidor backend
                      const baseUrl = getApiBaseUrl();
                      const rutaNormalizada = foto.startsWith('/') ? foto : `/${foto}`;
                      fotoUrl = `${baseUrl}${rutaNormalizada}`;

                    }

                    return (
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '50px',
                          height: '50px',
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
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onClick={() => {
                            const titulo = row.descripcion || row.Descripcion || 'Imagen del plato';
                            const tituloEsc = (titulo || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                            const urlEsc = fotoUrl.replace(/"/g, '&quot;');
                            Swal.fire({
                              title: '',
                              html: `
                                <div class="swal-imagen-plato-body">
                                  <p class="swal-imagen-plato-descripcion">${tituloEsc}</p>
                                  <div class="swal-imagen-plato-contenido">
                                    <img src="${urlEsc}" alt="${tituloEsc}" class="swal-imagen-plato-img" />
                                  </div>
                                </div>
                              `,
                              showConfirmButton: false,
                              showCloseButton: true,
                              width: '520px',
                              customClass: { popup: 'swal-popup-imagen-plato' },
                            });
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = '0.8';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = '1';
                          }}
                          onError={(e) => {
                            // Si la imagen falla al cargar, mostrar el fallback
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.sin-foto-fallback');
                              if (fallback) {
                                fallback.style.display = 'inline-flex';
                              }
                            }
                          }}
                          onLoad={(e) => {
                            // Si la imagen carga correctamente, ocultar el fallback
                            const parent = e.target.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.sin-foto-fallback');
                              if (fallback) {
                                fallback.style.display = 'none';
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
                            fontSize: '0.75rem',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="fa fa-image mr-1"></i>Sin foto
                        </span>
                      </div>
                    );
                  }
                  
                  // Si no hay foto, mostrar el mensaje "Sin foto"
                  return (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '50px',
                        height: '50px',
                        color: '#6c757d',
                        fontStyle: 'italic',
                        fontSize: '0.75rem',
                      }}
                    >
                      <i className="fa fa-image mr-1"></i>Sin foto
                    </div>
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
                  // Primero intentar obtener el nombre directamente
                  let planNombre = 
                    row.plannutricional_nombre ||
                    row.Plannutricional_nombre ||
                    row.planNutricional_nombre ||
                    row.planNutricionalNombre ||
                    row.plan_nutricional_nombre;
                  
                  // Si no hay nombre directo, intentar desde el objeto anidado
                  if (!planNombre) {
                    if (row.planNutricional && typeof row.planNutricional === 'object') {
                      planNombre = row.planNutricional.nombre || row.planNutricional.Nombre || row.planNutricional.descripcion || row.planNutricional.Descripcion;
                    } else if (row.PlanNutricional && typeof row.PlanNutricional === 'object') {
                      planNombre = row.PlanNutricional.nombre || row.PlanNutricional.Nombre || row.PlanNutricional.descripcion || row.PlanNutricional.Descripcion;
                    }
                  }
                  
                  // Asegurar que siempre retornamos un string
                  return planNombre || '-';
                },
              },
              {
                key: 'costo',
                field: 'costo',
                label: 'Importe ($)',
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
                text: `¿Desea dar de baja el plato ${
                  plato.descripcion ||
                  plato.Descripcion ||
                  plato.codigo ||
                  plato.Codigo
                }?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#F34949',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, dar de baja',
                cancelButtonText: 'Cancelar',
              }).then(async (result) => {
                if (result.isConfirmed) {
                  try {
                    setIsLoading(true);
                    const platoId = plato.id || plato.Id || plato.ID;
                    await platosService.eliminarPlato(platoId);
                    Swal.fire({
                      title: 'Dado de baja',
                      text: 'El plato ha sido dado de baja correctamente',
                      icon: 'success',
                      showConfirmButton: false,
                      timer: 2000,
                      timerProgressBar: true,
                    });
                    cargarPlatos(currentPage, filtro);
                  } catch (error) {
                    if (!error.redirectToLogin) {
                      Swal.fire({
                        title: 'Error',
                        text:
                          error.message || 'Error al dar de baja el plato',
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
              
              // Si el plato está inactivo, mostrar SOLO el botón de activar (tilde verde)
              if (isInactivo) {
                return (
                  <button
                    className="btn btn-sm"
                    onClick={() => handleActivarPlato(plato)}
                    title="Activar plato"
                    disabled={isLoading}
                    style={{ 
                      backgroundColor: '#28a745', 
                      borderColor: '#28a745', 
                      color: 'white',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '400',
                      borderRadius: '0.25rem',
                      transition: 'all 0.2s ease',
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      minWidth: '32px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.backgroundColor = '#218838';
                        e.target.style.borderColor = '#218838';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.target.style.backgroundColor = '#28a745';
                        e.target.style.borderColor = '#28a745';
                      }
                    }}
                    aria-label="Activar plato"
                  >
                    <i className="fa fa-check" style={{ fontSize: '0.9rem' }} title="Activar plato" aria-hidden="true"></i>
                  </button>
                );
              }
              
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

        {/* Modal de opciones de impresión */}
        {mostrarModalImpresion && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '1rem',
            }}
            onClick={() => setMostrarModalImpresion(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '0.25rem',
                padding: '1.5rem',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0 }}>Opciones de Impresión</h4>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setMostrarModalImpresion(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: '#6c757d',
                    cursor: 'pointer',
                    padding: 0,
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              {/* Selección de columnas */}
              <div style={{ marginBottom: '2rem' }}>
                <h5 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                  Columnas a incluir:
                </h5>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem 1rem',
                    maxWidth: '50%',
                    justifyContent: 'start',
                  }}
                >
                  {Object.keys(columnasSeleccionadas).map((columna) => {
                    const labels = {
                      codigo: 'Código',
                      descripcion: 'Descripción',
                      plannutricional: 'Plan Nutricional',
                      importe: 'Importe',
                      presentacion: 'Presentación',
                      ingredientes: 'Ingredientes',
                      estado: 'Estado',
                    };

                    const labelTexto = labels[columna] || columna;

                    return (
                      <label
                        key={columna}
                        htmlFor={`col-${columna}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          margin: 0,
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`col-${columna}`}
                          checked={columnasSeleccionadas[columna] || false}
                          onChange={(e) => {
                            setColumnasSeleccionadas((prev) => ({
                              ...prev,
                              [columna]: e.target.checked,
                            }));
                          }}
                          style={{
                            margin: 0,
                            flexShrink: 0,
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                          }}
                        />
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {labelTexto}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Filtros */}
              <div style={{ marginBottom: '2rem' }}>
                <h5 style={{ 
                  marginBottom: '1rem', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: '#333'
                }}>Filtros:</h5>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      marginBottom: '0.5rem', 
                      display: 'block',
                      fontWeight: '500',
                      color: '#555'
                    }}>Plan Nutricional:</label>
                    <select
                      className="form-control"
                      value={filtrosImpresion.planNutricionalId}
                      onChange={(e) => setFiltrosImpresion(prev => ({ ...prev, planNutricionalId: e.target.value }))}
                      style={{ 
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Todos</option>
                      {planesNutricionales.map((plan) => {
                        const planId = plan.id || plan.Id || plan.ID;
                        const planNombre = plan.nombre || plan.Nombre || plan.descripcion || plan.Descripcion || '';
                        return (
                          <option key={planId} value={String(planId)}>
                            {planNombre}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      marginBottom: '0.5rem', 
                      display: 'block',
                      fontWeight: '500',
                      color: '#555'
                    }}>Estado:</label>
                    <select
                      className="form-control"
                      value={filtrosImpresion.activo === null ? '' : filtrosImpresion.activo ? 'activo' : 'inactivo'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFiltrosImpresion(prev => ({
                          ...prev,
                          activo: value === '' ? null : value === 'activo',
                        }));
                      }}
                      style={{ 
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="activo">Solo Activos</option>
                      <option value="inactivo">Solo Inactivos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                justifyContent: 'flex-end',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e0e0e0'
              }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setMostrarModalImpresion(false)}
                  style={{
                    backgroundColor: '#6c757d',
                    borderColor: '#6c757d',
                    color: 'white',
                    padding: '0.625rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a6268';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#6c757d';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleExportarPDF(columnasSeleccionadas, filtrosImpresion)}
                  style={{
                    backgroundColor: '#dc3545',
                    borderColor: '#dc3545',
                    color: 'white',
                    padding: '0.625rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c82333';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fa fa-file-pdf mr-2"></i>
                  Exportar PDF
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleExportarExcel(columnasSeleccionadas, filtrosImpresion)}
                  style={{
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    color: 'white',
                    padding: '0.625rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#218838';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#28a745';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fa fa-file-excel mr-2"></i>
                  Exportar Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== formulario crear/editar =====
  return (
    <div className="container-fluid" style={{ padding: 0, backgroundColor: 'white' }}>
      <div className="page-title-bar">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '1.5rem',
            color: 'white',
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
              color: 'white',
            }}
          >
            <i className="fa fa-arrow-left" style={{ color: 'white' }}></i>
          </button>
          <h3>
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

      <div className="usuarios-form-container" style={{ padding: '1.5rem 2rem', maxWidth: '1800px', margin: '0 auto' }}>
        <form>
          <div className="form-section" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
            <div className="form-section-title" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>
              <i
                className="fa fa-fish mr-2"
                style={{ fontSize: '0.85em' }}
              ></i>
              <span>Información del Plato</span>
            </div>
            <div className="form-section-content" style={{ padding: '0' }}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <label htmlFor="codigo" style={{ marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: '500', height: '20px', display: 'flex', alignItems: 'center' }}>
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
                          maxWidth: '100%',
                          fontSize: '0.875rem',
                          padding: '0.4rem 0.75rem',
                          height: '38px',
                          minHeight: '38px',
                          boxSizing: 'border-box',
                          lineHeight: '1.5',
                          border: '1px solid #ced4da',
                        }}
                      />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleGenerarCodigo}
                          title="Generar código desde la descripción"
                          style={{
                          borderColor: '#495057',
                          color: '#fff',
                            whiteSpace: 'nowrap',
                            padding: '0',
                            margin: '0',
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderLeft: 'none',
                            borderTop: '1px solid #495057',
                            borderRight: '1px solid #495057',
                            borderBottom: '1px solid #495057',
                          backgroundColor: '#495057',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '38px',
                            minHeight: '38px',
                            maxHeight: '38px',
                            width: '38px',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                            lineHeight: '1',
                            flexShrink: 0,
                          }}
                        >
                          <i className="fa fa-magic"></i>
                        </button>
                    </div>
                    <small className="form-text text-muted" style={{ fontSize: '0.7rem', marginTop: '0.25rem', display: 'block', height: '18px', lineHeight: '18px' }}>
                        <i className="fa fa-info-circle mr-1"></i>
                      Presione el botón para generar
                      </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group" style={{ marginBottom: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <label htmlFor="descripcion" style={{ marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: '500', height: '20px', display: 'flex', alignItems: 'center' }}>
                      Descripción <span style={{ color: '#F34949' }}>*</span>
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
                      style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem', height: '38px', boxSizing: 'border-box' }}
                    />
                    <div style={{ height: '18px', marginTop: '0.25rem' }}></div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group" style={{ marginBottom: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <label htmlFor="costo" style={{ marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: '500', height: '20px', display: 'flex', alignItems: 'center' }}>
                      Importe ($) <span style={{ color: '#F34949' }}>*</span>
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
                      style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem', height: '38px', boxSizing: 'border-box' }}
                    />
                    <div style={{ height: '18px', marginTop: '0.25rem' }}></div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <label htmlFor="Plannutricional_id" style={{ marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: '500', height: '20px', display: 'flex', alignItems: 'center' }}>
                      Plan Nutricional
                    </label>
                    <select
                      className="form-control"
                      id="Plannutricional_id"
                      name="Plannutricional_id"
                      value={formData.Plannutricional_id || (planesNutricionales.length === 1 ? String(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID) : '')}
                      onChange={handleInputChange}
                      disabled={planesNutricionales.length <= 1}
                      style={{
                        fontSize: '0.875rem',
                        padding: '0.4rem 0.75rem',
                        height: '38px',
                        boxSizing: 'border-box',
                        lineHeight: '1.5',
                        ...(planesNutricionales.length <= 1
                          ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }
                          : {})
                      }}
                    >
                      {planesNutricionales.length === 0 ? (
                        <option value="">Cargando...</option>
                      ) : planesNutricionales.length === 1 ? (
                        <option value={String(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID)}>
                          {planesNutricionales[0].nombre ||
                            planesNutricionales[0].Nombre ||
                            planesNutricionales[0].descripcion ||
                            planesNutricionales[0].Descripcion}
                        </option>
                      ) : (
                        <>
                          <option value="">-- Seleccionar --</option>
                          {planesNutricionales.map((plan) => {
                            const planId = plan.id || plan.Id || plan.ID;
                            return (
                              <option key={planId} value={String(planId)}>
                            {plan.nombre ||
                              plan.Nombre ||
                              plan.descripcion ||
                              plan.Descripcion}
                          </option>
                            );
                          })}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="row" style={{ marginTop: '1.5rem' }}>
                <div className="col-md-4">
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="presentacion" style={{ marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: '500' }}>Presentación</label>
                    <textarea
                      className="form-control"
                      id="presentacion"
                      name="presentacion"
                      value={formData.presentacion || ''}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Ingrese la presentación del plato"
                      style={{ maxWidth: '100%', resize: 'vertical', fontSize: '0.875rem', padding: '0.4rem 0.75rem', minHeight: '80px' }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="ingredientes" style={{ marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: '500' }}>Ingredientes</label>
                    <textarea
                      className="form-control"
                      id="ingredientes"
                      name="ingredientes"
                      value={formData.ingredientes || ''}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Ingrese los ingredientes del plato"
                      style={{ maxWidth: '100%', resize: 'vertical', fontSize: '0.875rem', padding: '0.4rem 0.75rem', minHeight: '80px' }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="Foto" style={{ marginBottom: '0.35rem', fontSize: '0.875rem', fontWeight: '500' }}>Imagen</label>
                    {!formData.imagenPreview && (
                    <input
                      type="file"
                      className="form-control-file"
                        id="Foto"
                        name="Foto"
                      accept="image/*"
                      onChange={handleInputChange}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0' }}
                    />
                    )}
                    {formData.imagenPreview && (
                      <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '200px' }}>
                        <img
                          src={formData.imagenPreview}
                          alt="Vista previa"
                          style={{
                              width: '100%',
                            height: '95px',
                            minHeight: '95px',
                            borderRadius: '0.25rem',
                            border: '1px solid #ced4da',
                            padding: '0.4rem',
                              objectFit: 'cover',
                              display: 'block',
                            boxSizing: 'border-box',
                            }}
                            onError={() => {
                              // Error silencioso al cargar imagen
                            }}
                            onLoad={() => {
                              // Imagen cargada exitosamente
                            }}
                          />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={handleEliminarImagen}
                          style={{ 
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            padding: '0',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: '#F34949',
                            color: 'white',
                            zIndex: 10,
                            transform: 'translate(50%, -50%)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          }}
                          title="Eliminar imagen"
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="row" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
            <div className="col-md-12 d-flex justify-content-end" style={{ gap: '0.75rem' }}>
              <button
                type="button"
                className="btn"
                onClick={handleVolverALista}
                style={{
                  backgroundColor: '#F34949',
                  borderColor: '#F34949',
                  color: 'white',
                  fontSize: '0.875rem',
                  padding: '0.5rem 1.25rem',
                  minWidth: '100px',
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
                  fontSize: '0.875rem',
                  padding: '0.5rem 1.25rem',
                  minWidth: '100px',
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
