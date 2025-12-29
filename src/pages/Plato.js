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
  const [soloActivos, setSoloActivos] = useState(true); // Por defecto mostrar solo activos
  const [vista, setVista] = useState('lista'); // 'lista' | 'editar' | 'crear'
  const [planesNutricionales, setPlanesNutricionales] = useState([]);
  const [imagenAmpliada, setImagenAmpliada] = useState(null); // URL de la imagen ampliada

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
        // Pasar el parámetro activo al backend (true por defecto, false si soloActivos está desmarcado)
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
        
        // Log para depuración: verificar qué datos vienen del backend
        console.log('📋 [Plato] Platos cargados:', items.length);
        if (items.length > 0) {
          console.log('📋 [Plato] Primer plato de ejemplo:', {
            id: items[0].id || items[0].Id,
            codigo: items[0].codigo || items[0].Codigo,
            descripcion: items[0].descripcion || items[0].Descripcion,
            Foto: items[0].Foto || items[0].foto || items[0].imagen || items[0].Imagen || 'NO HAY FOTO',
            todosLosCampos: Object.keys(items[0])
          });
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
    [pageSize, soloActivos]
  );

  useEffect(() => {
    cargarPlanesNutricionales();
  }, [cargarPlanesNutricionales]);

  useEffect(() => {
    cargarPlatos(currentPage, filtro);
  }, [currentPage, filtro, soloActivos, cargarPlatos]);

  // Cerrar modal de imagen ampliada con tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && imagenAmpliada) {
        setImagenAmpliada(null);
      }
    };

    if (imagenAmpliada) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [imagenAmpliada]);

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
          console.log('✅ [Plato] Auto-seleccionando plan nutricional único:', idExactoString);
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
      console.log('✅ [Plato] Plan nutricional seleccionado:', planValue);
      return;
    }

    if (name === 'Foto' && files && files[0]) {
      const file = files[0];
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

        console.log('🔍 [Plato] Obteniendo plan ID del plato (PlatoDetalleDto):', {
          platoParaEditar: platoParaEditar,
          Plannutricional_id: platoParaEditar.Plannutricional_id,
          plannutricional_id: platoParaEditar.plannutricional_id,
          Plannutricional_nombre: platoParaEditar.Plannutricional_nombre || platoParaEditar.plannutricional_nombre,
          planIdValueInicial: planIdValue,
          todasLasPropiedades: Object.keys(platoParaEditar).filter(k => 
            k.toLowerCase().includes('plan') || k.toLowerCase().includes('nutricional')
          ),
          cantidadPlanes: planesNutricionales.length
        });

        // Si no se encontró un plan y hay solo uno disponible, auto-seleccionarlo
        if (
          (!planIdValue || planIdValue === '' || planIdValue === 0 || planIdValue === null) &&
          planesNutricionales.length === 1
        ) {
          planIdValue = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
          console.log('✅ [Plato] Plan nutricional auto-seleccionado (único disponible):', planIdValue);
        }

        // Convertir a string y validar
        let planIdFinal = '';
        if (planIdValue !== null && planIdValue !== undefined && planIdValue !== '' && planIdValue !== 0) {
          planIdFinal = String(planIdValue);
        }

        console.log('✅ [Plato] Plan ID final:', planIdFinal);
        console.log('✅ [Plato] Plan ID final (número):', planIdFinal ? parseInt(planIdFinal) : null);
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
        
        console.log('🔍 [Plato] Obteniendo imagen preview desde Foto:', foto);
        
        if (!foto || foto.trim() === '') {
          console.log('⚠️ [Plato] No hay foto disponible en Foto');
          return null;
        }
        
        // Si ya es una URL completa (http/https), devolverla tal cual
        if (foto.startsWith('http://') || foto.startsWith('https://')) {
          console.log('✅ [Plato] Foto es URL completa, usando directamente:', foto);
          return foto;
        }
        
        // Si es base64, devolverla tal cual
        if (foto.startsWith('data:')) {
          console.log('✅ [Plato] Foto es base64, usando directamente');
          return foto;
        }
        
        // Obtener la URL base del backend
        const baseUrl = getApiBaseUrl();
        console.log('🔍 [Plato] URL base del backend:', baseUrl);
        
        // Si es una ruta absoluta del sistema de archivos, extraer solo la parte relativa después de 'uploads/platos/'
        if (foto.includes('uploads/platos/')) {
          console.log('⚠️ [Plato] Foto contiene ruta absoluta del servidor, extrayendo parte relativa...');
          // Buscar 'uploads/platos/' en la ruta
          const indiceUploads = foto.indexOf('uploads/platos/');
          if (indiceUploads !== -1) {
            // Extraer todo después de 'uploads/platos/' incluyendo el nombre del archivo
            const parteRelativa = foto.substring(indiceUploads);
            // Construir la ruta relativa: /uploads/platos/nombre_archivo
            const rutaRelativa = `/${parteRelativa}`;
            console.log('✅ [Plato] Ruta relativa extraída desde Foto:', rutaRelativa);
            
            // Codificar el nombre del archivo si tiene espacios o caracteres especiales
            const partes = rutaRelativa.split('/');
            const nombreArchivo = partes.pop();
            const rutaBase = partes.join('/');
            
            // Si el nombre del archivo tiene espacios o caracteres especiales, codificarlo
            let nombreArchivoCodificado = nombreArchivo;
            if (nombreArchivo.includes(' ') || nombreArchivo.includes('%')) {
              nombreArchivoCodificado = encodeURIComponent(nombreArchivo);
            }
            
            // Construir la URL completa del servidor backend
            const fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivoCodificado}`;
            console.log('✅ [Plato] URL final construida desde Foto (servidor backend):', fotoUrl);
            console.log('✅ [Plato] Ruta base:', rutaBase);
            console.log('✅ [Plato] Nombre archivo original:', nombreArchivo);
            console.log('✅ [Plato] Nombre archivo codificado:', nombreArchivoCodificado);
            return fotoUrl;
          }
        }
        
        // Si es una ruta relativa que empieza con /uploads/platos/, construir URL del servidor backend
        if (foto.startsWith('/uploads/platos/')) {
          // Codificar el nombre del archivo para manejar espacios y caracteres especiales
          const partes = foto.split('/');
          const nombreArchivo = partes.pop();
          const rutaBase = partes.join('/');
          
          // Si el nombre del archivo tiene espacios o caracteres especiales, codificarlo
          let nombreArchivoCodificado = nombreArchivo;
          if (nombreArchivo.includes(' ') || nombreArchivo.includes('%')) {
            nombreArchivoCodificado = encodeURIComponent(nombreArchivo);
          }
          
          // Construir la URL completa del servidor backend
          const fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivoCodificado}`;
          console.log('✅ [Plato] Usando Foto directamente (ruta relativa del servidor):', fotoUrl);
          return fotoUrl;
        }
        
        // Si es otra ruta relativa, construir URL del servidor backend
        const rutaNormalizada = foto.startsWith('/') ? foto : `/${foto}`;
        const fotoUrl = `${baseUrl}${rutaNormalizada}`;
        console.log('✅ [Plato] Usando Foto directamente (otra ruta relativa del servidor):', fotoUrl);
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
          console.log('✅ [Plato] Plan nutricional encontrado, ID normalizado:', planIdFinal, 'de plan:', planEncontrado);
        } else {
          console.warn('⚠️ [Plato] El plan nutricional ID', planId, 'no existe en los planes disponibles');
          console.warn('⚠️ [Plato] Planes disponibles:', planesNutricionales.map(p => {
            const pId = p.id || p.Id || p.ID;
            return { id: pId, nombre: p.nombre || p.Nombre || p.descripcion || p.Descripcion };
          }));
          // Si no se encuentra y hay un solo plan disponible, usar ese
          if (planesNutricionales.length === 1) {
            const idExacto = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
            planIdFinal = String(idExacto);
            console.log('✅ [Plato] Plan nutricional no encontrado, usando plan único disponible:', planIdFinal);
          } else {
            planIdFinal = ''; // Si no se encuentra y hay múltiples planes, dejar vacío
          }
        }
      } else if (planesNutricionales.length === 1) {
        // Si no hay planId pero hay un solo plan disponible, usar ese
        const idExacto = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
        planIdFinal = String(idExacto);
        console.log('✅ [Plato] No hay planId en el plato, usando plan único disponible:', planIdFinal);
      }

      console.log('🔍 [Plato] Asignando datos al formulario:', {
        planIdOriginal: planId,
        planIdFinal: planIdFinal,
        planesDisponibles: planesNutricionales.map(p => {
          const pId = p.id || p.Id || p.ID;
          return { id: pId, nombre: p.nombre || p.Nombre || p.descripcion || p.Descripcion };
        }),
        formDataPlanNutricionalId: planIdFinal
      });

      // Obtener la imagen preview antes de asignar al formData
      const imagenPreviewValue = obtenerImagenPreview();
      console.log('🖼️ [Plato] imagenPreview obtenido:', imagenPreviewValue);
      console.log('🖼️ [Plato] PUBLIC_URL:', process.env.PUBLIC_URL);

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
      
      console.log('✅ [Plato] FormData actualizado con datos del PlatoDetalleDto:', {
        id: platoParaEditar.Id || platoParaEditar.id,
        codigo: platoParaEditar.Codigo || platoParaEditar.codigo,
        descripcion: platoParaEditar.Descripcion || platoParaEditar.descripcion,
        costo: platoParaEditar.Costo || platoParaEditar.costo,
        Plannutricional_id: planIdFinal,
        imagenPreview: imagenPreviewValue,
        Plannutricional_nombre: platoParaEditar.Plannutricional_nombre || platoParaEditar.plannutricional_nombre,
        presentacion,
        ingredientes,
        Foto: platoParaEditar.Foto || platoParaEditar.foto
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
        console.log('✅ [Plato] Imagen eliminada del servidor:', rutaImagenActual);
      } catch (error) {
        console.warn('⚠️ [Plato] No se pudo eliminar la imagen del servidor, pero se continúa:', error);
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
          console.log('✅ [Plato] Plan nutricional obtenido de formData:', plannutricionalId);
        }
      }
      
      // Si no hay plan en formData pero hay un solo plan disponible, usar ese plan
      if (!plannutricionalId && planesNutricionales.length === 1) {
        const planId = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
        if (planId && planId > 0) {
          plannutricionalId = planId;
          console.log('✅ [Plato] Plan nutricional auto-seleccionado (único disponible):', plannutricionalId);
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
        console.warn('⚠️ [Plato] Plan nutricional ID inválido:', plannutricionalId);
        plannutricionalId = null;
      }

      console.log('🔍 [Plato] Plan nutricional:', {
        formDataPlannutricional_id: formData.Plannutricional_id,
        plannutricionalIdCalculado: plannutricionalId,
        cantidadPlanes: planesNutricionales.length,
        planesDisponibles: planesNutricionales.map(p => {
          const pId = p.id || p.Id || p.ID;
          return { id: pId, nombre: p.nombre || p.Nombre || p.descripcion || p.Descripcion };
        })
      });

      // Manejo de la foto: usar la ruta del archivo en la carpeta public/uploads/platos/
      let fotoRuta = null;
      let eliminarFoto = false;

      if (formData.eliminarImagen) {
        // Si se marcó eliminar imagen, enviar flag para eliminar
        eliminarFoto = true;
        fotoRuta = null;
        console.log('🗑️ [Plato] Se eliminará la imagen del plato');
        
        // Obtener la ruta de la imagen actual para eliminarla del servidor
        const rutaImagenActual = platoEditando?.Foto || platoEditando?.foto;
        if (rutaImagenActual) {
          try {
            await platosService.eliminarFotoPlato(rutaImagenActual);
            console.log('✅ [Plato] Imagen eliminada del servidor:', rutaImagenActual);
          } catch (error) {
            console.warn('⚠️ [Plato] No se pudo eliminar la imagen del servidor:', error);
          }
        }
      } else if (formData.Foto && formData.Foto instanceof File) {
        // Si hay un archivo nuevo, primero eliminar la imagen anterior si existe
        const rutaImagenAnterior = platoEditando?.Foto || platoEditando?.foto || 
                                   (formData.imagenPreview && formData.imagenPreview.includes('uploads/platos/') ? formData.imagenPreview : null);
        
        if (rutaImagenAnterior && !formData.imagenPreview?.startsWith('data:')) {
          try {
            console.log('🗑️ [Plato] Eliminando imagen anterior antes de subir la nueva:', rutaImagenAnterior);
            await platosService.eliminarFotoPlato(rutaImagenAnterior);
            console.log('✅ [Plato] Imagen anterior eliminada del servidor');
          } catch (error) {
            console.warn('⚠️ [Plato] No se pudo eliminar la imagen anterior, pero se continúa:', error);
          }
        }
        
        // Si hay un archivo nuevo, enviarlo al backend para que lo guarde
        try {
          console.log('💾 [Plato] Subiendo archivo al backend para guardarlo');
          console.log('📋 [Plato] Nombre del archivo:', formData.Foto.name);
          console.log('📋 [Plato] Tamaño del archivo:', formData.Foto.size, 'bytes');
          console.log('📋 [Plato] Tipo del archivo:', formData.Foto.type);
          
          // El backend recibirá el archivo, lo guardará en public/uploads/platos/ y retornará la ruta
          fotoRuta = await platosService.subirFotoPlato(formData.Foto);
          
          console.log('✅ [Plato] Archivo subido exitosamente, ruta retornada:', fotoRuta);
          
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
          
          console.log('✅ [Plato] imagenPreview actualizado con:', fotoUrlParaPreview);
        } catch (error) {
          console.error('❌ [Plato] Error al subir archivo:', error);
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
          console.log('✅ [Plato] Usando ruta relativa existente:', fotoRuta);
        } else if (formData.imagenPreview.startsWith('http')) {
          // Si es una URL completa, extraer la ruta relativa si es del backend
          const baseUrl = getApiBaseUrl();
          if (formData.imagenPreview.startsWith(baseUrl)) {
            fotoRuta = formData.imagenPreview.replace(baseUrl, '');
            console.log('✅ [Plato] Ruta extraída de URL del backend:', fotoRuta);
            // Asegurar que si es /uploads/platos/, se use directamente
            if (!fotoRuta.startsWith('/uploads/platos/')) {
              console.warn('⚠️ [Plato] La ruta extraída no es de uploads/platos/, puede no funcionar correctamente');
            }
          } else {
            // Si es una URL externa, no podemos usarla
            console.warn('⚠️ [Plato] URL externa, no se puede usar');
            fotoRuta = null;
          }
        } else if (formData.imagenPreview.startsWith('data:')) {
          // Si es base64, no podemos usarla como ruta
          console.warn('⚠️ [Plato] imagenPreview es base64, no se puede usar como ruta');
          fotoRuta = null;
        } else if (formData.imagenPreview.startsWith('uploads/')) {
          // Si es una ruta sin / inicial, normalizarla
          fotoRuta = `/${formData.imagenPreview}`;
          console.log('✅ [Plato] Ruta normalizada:', fotoRuta);
        } else {
          // Cualquier otra cosa, asumir que es una ruta relativa
          fotoRuta = formData.imagenPreview.startsWith('/') ? formData.imagenPreview : `/${formData.imagenPreview}`;
          console.log('✅ [Plato] Usando imagenPreview como ruta:', fotoRuta);
        }
      } else {
        // No hay imagen para enviar
        console.log('⚠️ [Plato] No hay imagen para enviar');
        fotoRuta = null;
      }

      console.log('🔍 [Plato] Estado final de la imagen:', {
        tieneFoto: !!formData.Foto,
        tieneImagenPreview: !!formData.imagenPreview,
        esFile: formData.Foto instanceof File,
        esURL: formData.imagenPreview && formData.imagenPreview.startsWith('http'),
        eliminarImagen: formData.eliminarImagen,
        fotoRutaEnviada: fotoRuta,
        eliminarFoto: eliminarFoto
      });

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

        console.log('📤 [Plato] DTO para actualizar:', platoData);

        await platosService.actualizarPlato(platoData);

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
          Ingredientes: (formData.ingredientes || '').trim() || null,
          Presentacion: (formData.presentacion || '').trim() || null,
          Plannutricional_id: plannutricionalId && plannutricionalId > 0 ? plannutricionalId : null,
          Descripcion: (formData.descripcion || '').trim(),
          Costo: formData.costo && formData.costo !== '' && !isNaN(parseFloat(formData.costo))
              ? parseFloat(formData.costo)
              : 0,
          Foto: fotoRuta || null, // El backend espera Foto (string), ruta del archivo (ej: /uploads/platos/imagen.jpg)
        };

        console.log('📤 [Plato] DTO para crear:', platoData);

        await platosService.crearPlato(platoData);

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
        
        console.error('❌ [Plato] Error completo:', error);
        console.error('❌ [Plato] Mensaje de error a mostrar:', errorMessage);
        
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
        head: [['Código', 'Descripción', 'Plan Nutricional', 'Importe ($)']],
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
        ['Código', 'Descripción', 'Plan Nutricional', 'Importe ($)'],
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
    await platosService.activarPlato(platoId, usuario || null);

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
              gap: '0.75rem',
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
                flexShrink: 0,
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
                  whiteSpace: 'nowrap',
                }}
              >
                {soloActivos ? 'Platos activos' : 'Platos de baja'}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
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
                  height: '38px',
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
                  height: '38px',
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
                  // Buscar el campo Foto en todas sus variantes posibles
                  let foto =
                    row.Foto || // PascalCase (según DTO del backend)
                    row.foto || // camelCase
                    row.imagen || // español
                    row.Imagen || // español PascalCase
                    null;

                  console.log('🖼️ [Plato] Renderizando imagen para plato:', {
                    id: row.id || row.Id,
                    codigo: row.codigo || row.Codigo,
                    foto: foto,
                    todosLosCampos: Object.keys(row)
                  });

                  if (foto && foto.trim() !== '') {
                    // Si es una ruta absoluta del sistema de archivos, extraer solo el nombre del archivo
                    if (foto.includes('\\') || (foto.includes('/') && (foto.includes('C:') || foto.includes('D:') || foto.includes('api/plato/imagen')))) {
                      console.log('⚠️ [Plato] Foto es ruta absoluta del sistema, extrayendo nombre del archivo...');
                      // Extraer el nombre del archivo de la ruta
                      const nombreArchivo = foto.split('\\').pop().split('/').pop();
                      // Decodificar URL encoding si existe
                      const nombreDecodificado = decodeURIComponent(nombreArchivo);
                      // Construir la ruta relativa para el frontend
                      foto = `/uploads/platos/${nombreDecodificado}`;
                      console.log('✅ [Plato] Ruta normalizada desde ruta absoluta:', foto);
                    }
                    
                    let fotoUrl = foto;
                    
                    // Si es una URL completa (http/https) o base64, usarla tal cual
                    if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
                      fotoUrl = foto;
                      console.log('✅ [Plato] Foto es URL completa o base64:', fotoUrl);
                    } else if (foto.startsWith('/uploads/platos/') || foto.includes('uploads/platos/')) {
                      // Si es una ruta de uploads/platos/, construir la URL completa apuntando al servidor backend
                      const baseUrl = getApiBaseUrl();
                      
                      // Si contiene 'uploads/platos/' pero no empieza con '/', extraer la parte relativa
                      let rutaRelativa = foto;
                      if (foto.includes('uploads/platos/') && !foto.startsWith('/uploads/platos/')) {
                        const indiceUploads = foto.indexOf('uploads/platos/');
                        rutaRelativa = `/${foto.substring(indiceUploads)}`;
                      }
                      
                      // Codificar el nombre del archivo para manejar espacios y caracteres especiales
                      const partes = rutaRelativa.split('/');
                      const nombreArchivo = partes.pop();
                      const rutaBase = partes.join('/');
                      
                      // Si el nombre del archivo tiene espacios o caracteres especiales, codificarlo
                      let nombreArchivoCodificado = nombreArchivo;
                      if (nombreArchivo.includes(' ') || nombreArchivo.includes('%')) {
                        nombreArchivoCodificado = encodeURIComponent(nombreArchivo);
                      }
                      
                      fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivoCodificado}`;
                      console.log('✅ [Plato] Usando ruta desde servidor backend:', fotoUrl);
                      console.log('✅ [Plato] Base URL del servidor:', baseUrl);
                      console.log('✅ [Plato] Nombre archivo original:', nombreArchivo);
                      console.log('✅ [Plato] Nombre archivo codificado:', nombreArchivoCodificado);
                    } else {
                      // Si es otra ruta relativa, construir URL del servidor backend
                      const baseUrl = getApiBaseUrl();
                      const rutaNormalizada = foto.startsWith('/') ? foto : `/${foto}`;
                      fotoUrl = `${baseUrl}${rutaNormalizada}`;
                      console.log('✅ [Plato] Usando ruta relativa del servidor backend:', fotoUrl);
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
                          onClick={() => setImagenAmpliada(fotoUrl)}
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
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
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
              
              // Si el plato está inactivo, mostrar SOLO el botón de activar
              if (isInactivo) {
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

        {/* Modal para imagen ampliada */}
        {imagenAmpliada && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              cursor: 'pointer',
            }}
            onClick={() => setImagenAmpliada(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setImagenAmpliada(null);
              }
            }}
            tabIndex={0}
          >
            <div
              style={{
                position: 'relative',
                width: '600px',
                height: '600px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imagenAmpliada}
                alt="Imagen ampliada del plato"
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '600px',
                  maxHeight: '600px',
                  objectFit: 'contain',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                }}
              />
              <button
                type="button"
                onClick={() => setImagenAmpliada(null)}
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '0',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#333',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                  e.target.style.transform = 'scale(1)';
                }}
                title="Cerrar (ESC)"
              >
                <i className="fa fa-times"></i>
              </button>
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

      <div className="usuarios-form-container">
        <form>
          <div className="form-section" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-section-title" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', fontSize: '1rem' }}>
              <i
                className="fa fa-fish mr-2"
                style={{ fontSize: '0.8em' }}
              ></i>
              <span>Información del Plato</span>
            </div>
            <div className="form-section-content" style={{ padding: '0' }}>
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="codigo" style={{ marginBottom: '0.25rem' }}>
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
                            padding: '0.375rem 0.75rem',
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderLeft: 'none',
                          backgroundColor: '#495057',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="fa fa-magic"></i>
                        </button>
                    </div>
                    <small className="form-text text-muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        <i className="fa fa-info-circle mr-1"></i>
                      Presione el botón para generar
                      </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="descripcion" style={{ marginBottom: '0.25rem' }}>
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
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="costo" style={{ marginBottom: '0.25rem' }}>
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
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="Plannutricional_id" style={{ marginBottom: '0.25rem' }}>
                      Plan Nutricional
                    </label>
                    <select
                      className="form-control"
                      id="Plannutricional_id"
                      name="Plannutricional_id"
                      value={formData.Plannutricional_id || (planesNutricionales.length === 1 ? String(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID) : '')}
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

              <div className="row">
                <div className="col-md-4">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="presentacion" style={{ marginBottom: '0.25rem' }}>Presentación</label>
                    <textarea
                      className="form-control"
                      id="presentacion"
                      name="presentacion"
                      value={formData.presentacion || ''}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Ingrese la presentación del plato"
                      style={{ maxWidth: '100%', resize: 'vertical' }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="ingredientes" style={{ marginBottom: '0.25rem' }}>Ingredientes</label>
                    <textarea
                      className="form-control"
                      id="ingredientes"
                      name="ingredientes"
                      value={formData.ingredientes || ''}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Ingrese los ingredientes del plato"
                      style={{ maxWidth: '100%', resize: 'vertical' }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group" style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="Foto" style={{ marginBottom: '0.25rem' }}>Imagen</label>
                    {!formData.imagenPreview && (
                    <input
                      type="file"
                      className="form-control-file"
                        id="Foto"
                        name="Foto"
                      accept="image/*"
                      onChange={handleInputChange}
                        style={{ fontSize: '0.875rem' }}
                    />
                    )}
                    {formData.imagenPreview && (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ 
                          width: '150px',
                          height: 'calc(3 * 1.5em + 0.75rem + 2px)', // Misma altura que el textarea de ingredientes
                          borderRadius: '0.25rem',
                          overflow: 'hidden',
                          border: '1px solid #ced4da',
                          backgroundColor: '#f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.5rem',
                          marginTop: '0', // Alineado con el textarea
                        }}>
                        <img
                          src={formData.imagenPreview}
                          alt="Vista previa"
                          style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                            onError={(e) => {
                              console.error('❌ [Plato] Error al cargar imagen en vista previa');
                              console.error('❌ [Plato] imagenPreview (desde Foto):', formData.imagenPreview);
                              console.error('❌ [Plato] URL intentada por el navegador:', e.target.src);
                              console.error('❌ [Plato] Verificar que la imagen exista en: public/uploads/platos/');
                            }}
                            onLoad={() => {
                              console.log('✅ [Plato] Imagen cargada correctamente en vista previa');
                              console.log('✅ [Plato] URL de la imagen (desde Foto):', formData.imagenPreview);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={handleEliminarImagen}
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.25rem 0.5rem',
                            width: '150px',
                            backgroundColor: '#F34949',
                            borderColor: '#F34949',
                            color: 'white'
                          }}
                        >
                          <i className="fa fa-trash"></i> Eliminar
                        </button>
                      </div>
                    )}
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
