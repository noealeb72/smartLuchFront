import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import { mapUsuarios } from '../utils/dataMapper';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Usuarios.css';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('activo'); // 'activo' o 'inactivo' o 'todos'
  const [vista, setVista] = useState('lista'); // 'lista' o 'editar' o 'crear'
  const [plantas, setPlantas] = useState([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [jerarquias, setJerarquias] = useState([]);
  const [planesNutricionales, setPlanesNutricionales] = useState([]);
  
  // Estado para controlar qué tab está activa (solapas)
  const [tabActivo, setTabActivo] = useState('personal');
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: null,
    username: '',
    nombre: '',
    apellido: '',
    legajo: '',
    dni: '',
    cuil: '',
    email: '',
    telefono: '',
    planta_id: '',
    centrodecosto_id: '',
    proyecto_id: '',
    jerarquia_id: '',
    plannutricional_id: '',
    fecha_ingreso: '',
    contrato: '',
    contraseña: '',
    confirmarContraseña: '',
    foto: null,
    fotoPreview: null,
  });

  // Cargar usuarios usando /api/usuario/lista con paginación
  const cargarUsuarios = useCallback(async (page = 1, searchTerm = '', soloActivos = true) => {
    try {
      setIsLoading(true);
      
      // Si hay término de búsqueda, usar pageSize=100 y page=1 para obtener todos los resultados
      // Si no hay búsqueda, usar la paginación normal
      const pageToUse = (searchTerm && searchTerm.trim()) ? 1 : page;
      const pageSizeToUse = (searchTerm && searchTerm.trim()) ? 100 : pageSize;
      
      // Convertir el filtro a boolean para el backend
      // true = solo activos, false = inactivos
      const soloActivosParam = soloActivos === true;
      
      const data = await apiService.getUsuarios(pageToUse, pageSizeToUse, searchTerm, soloActivosParam);
      
      // El backend devuelve estructura paginada: { page, pageSize, totalItems, totalPages, items: [...] }
      let usuariosArray = [];
      
      if (data.items && Array.isArray(data.items)) {
        usuariosArray = data.items;
      } else if (Array.isArray(data)) {
        usuariosArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        usuariosArray = data.data;
      }
      
      // Usar los valores de paginación del backend
      const totalItemsBackend = data.totalItems || usuariosArray.length;
      const totalPagesBackend = data.totalPages || Math.ceil(totalItemsBackend / pageSize);
      
      if (usuariosArray.length > 0) {
        // Mapear usuarios del formato del backend al formato esperado
        const usuariosMapeados = mapUsuarios(usuariosArray);
        setUsuarios(usuariosMapeados);
      } else {
        setUsuarios(usuariosArray);
      }
      
      setTotalPages(totalPagesBackend);
      setTotalItems(totalItemsBackend);
    } catch (error) {
      // Error al cargar usuarios
      
      // Si hay error de conexión, el interceptor ya redirige automáticamente
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar los usuarios',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      
      setUsuarios([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Cargar datos de referencia (plantas, centros de costo, etc.)
  const cargarDatosReferencia = useCallback(async () => {
    try {
      const [
        jerarquiasData,
        plantasData,
        centrosData,
        proyectosData,
        planesData,
      ] = await Promise.all([
        apiService.getJerarquias(),
        apiService.getPlantas(),
        apiService.getCentrosDeCosto(),
        apiService.getProyectos(),
        apiService.getPlanesNutricionales(),
      ]);
  
      const jerarquiasArray = jerarquiasData || [];
      const plantasArray = plantasData || [];
      const centrosArray = centrosData || [];
      const proyectosArray = proyectosData || [];
      const planesArray = planesData || [];
  
      setJerarquias(jerarquiasArray);
      setPlantas(plantasArray);
      setCentrosDeCosto(centrosArray);
      setProyectos(proyectosArray);
      setPlanesNutricionales(planesArray);

      // Si estamos creando un nuevo usuario y solo hay una opción, seleccionarla automáticamente
      if (vista === 'crear' && !usuarioEditando) {
        setFormData((prev) => {
          const updated = { ...prev };
          if (jerarquiasArray.length === 1 && !prev.jerarquia_id) {
            updated.jerarquia_id = jerarquiasArray[0].id;
          }
          if (plantasArray.length === 1 && !prev.planta_id) {
            updated.planta_id = plantasArray[0].id;
          }
          if (centrosArray.length === 1 && !prev.centrodecosto_id) {
            updated.centrodecosto_id = centrosArray[0].id;
          }
          if (proyectosArray.length === 1 && !prev.proyecto_id) {
            updated.proyecto_id = proyectosArray[0].id;
          }
          if (planesArray.length === 1 && !prev.plannutricional_id) {
            updated.plannutricional_id = planesArray[0].id;
          }
          return updated;
        });
      }
    } catch (error) {
      // Error al cargar datos de referencia
      // Opcional: mostrar Swal si querés
      // Swal.fire({ ... });
    }
  }, [vista, usuarioEditando]);
  
  // Asignar automáticamente valores únicos cuando hay una sola opción disponible
  // Esto se ejecuta cuando cambian los arrays de opciones o cuando cambia formData
  useEffect(() => {
    if (vista === 'crear' || vista === 'editar') {
      setFormData((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        // Asignar jerarquía si hay una sola opción y no está asignada
        if (jerarquias.length === 1 && (!prev.jerarquia_id || prev.jerarquia_id === '' || prev.jerarquia_id === 0)) {
          updated.jerarquia_id = jerarquias[0].id;
          hasChanges = true;
        }

        // Asignar planta si hay una sola opción y no está asignada
        if (plantas.length === 1 && (!prev.planta_id || prev.planta_id === '' || prev.planta_id === 0)) {
          updated.planta_id = plantas[0].id;
          hasChanges = true;
        }

        // Asignar centro de costo si hay una sola opción y no está asignada
        if (centrosDeCosto.length === 1 && (!prev.centrodecosto_id || prev.centrodecosto_id === '' || prev.centrodecosto_id === 0)) {
          updated.centrodecosto_id = centrosDeCosto[0].id;
          hasChanges = true;
        }

        // Asignar proyecto si hay una sola opción y no está asignada
        if (proyectos.length === 1 && (!prev.proyecto_id || prev.proyecto_id === '' || prev.proyecto_id === 0)) {
          updated.proyecto_id = proyectos[0].id;
          hasChanges = true;
        }

        // Asignar plan nutricional si hay una sola opción y no está asignada
        if (planesNutricionales.length === 1 && (!prev.plannutricional_id || prev.plannutricional_id === '' || prev.plannutricional_id === 0)) {
          updated.plannutricional_id = planesNutricionales[0].id;
          hasChanges = true;
        }

        return hasChanges ? updated : prev;
      });
    }
  }, [jerarquias, plantas, centrosDeCosto, proyectos, planesNutricionales, vista]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosReferencia();
    cargarUsuarios(1, '', filtroActivo === 'activo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // Función para volver a la lista
  const handleVolverALista = () => {
    setVista('lista');
    setUsuarioEditando(null);
    setFormData({
      id: null,
      username: '',
      nombre: '',
      apellido: '',
      legajo: '',
      dni: '',
      cuil: '',
      email: '',
      telefono: '',
      planta_id: '',
      centrodecosto_id: '',
      proyecto_id: '',
      jerarquia_id: '',
      plannutricional_id: '',
      fecha_ingreso: '',
      contrato: '',
      contraseña: '',
      confirmarContraseña: '',
      foto: null,
      fotoPreview: null,
    });
  };

  // Abrir página para crear nuevo usuario
  const handleCrearUsuario = () => {
    setUsuarioEditando(null);
    
    // Preparar formData inicial con valores automáticos si hay una sola opción disponible
    const nuevoFormData = {
      id: null,
      username: '',
      nombre: '',
      apellido: '',
      legajo: '',
      dni: '',
      cuil: '',
      email: '',
      telefono: '',
      planta_id: plantas.length === 1 ? plantas[0].id : '',
      centrodecosto_id: centrosDeCosto.length === 1 ? centrosDeCosto[0].id : '',
      proyecto_id: proyectos.length === 1 ? proyectos[0].id : '',
      jerarquia_id: jerarquias.length === 1 ? jerarquias[0].id : '',
      plannutricional_id: planesNutricionales.length === 1 ? planesNutricionales[0].id : '',
      contraseña: '',
      confirmarContraseña: '',
      foto: null,
      fotoPreview: null,
    };
    
    setFormData(nuevoFormData);
    setVista('crear');
  };

  // Abrir página para editar usuario
  const handleEditarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    
    // Función auxiliar para obtener el ID correctamente, buscando en múltiples variantes
    const obtenerId = (valor, arrayOpciones, campoNombre) => {
      // Buscar en múltiples variantes de nombres
      let idValue = valor || 
                   usuario[`${campoNombre}_id`] || 
                   usuario[campoNombre] || 
                   usuario[`${campoNombre}Id`] || 
                   usuario[`${campoNombre}ID`] ||
                   usuario[`${campoNombre}_Id`] ||
                   usuario[`${campoNombre}_ID`];
      
      // Si hay un solo valor disponible, usarlo automáticamente
      if ((!idValue || idValue === '' || idValue === 0) && arrayOpciones.length === 1) {
        idValue = arrayOpciones[0].id;
      }
      
      // Convertir a número si es posible, para que coincida con el value del option (que es número)
      if (idValue !== null && idValue !== undefined && idValue !== '') {
        const numValue = parseInt(idValue, 10);
        return isNaN(numValue) ? idValue : numValue;
      }
      return '';
    };
    
    // Obtener IDs con conversión a string
    const jerarquiaId = obtenerId(usuario.jerarquia_id, jerarquias, 'jerarquia');
    const planId = obtenerId(usuario.plannutricional_id, planesNutricionales, 'plannutricional');
    const plantaId = obtenerId(usuario.planta_id, plantas, 'planta');
    const centroId = obtenerId(usuario.centrodecosto_id, centrosDeCosto, 'centrodecosto');
    const proyectoId = obtenerId(usuario.proyecto_id, proyectos, 'proyecto');
    
    setFormData({
      id: usuario.id,
      username: usuario.username || '',
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      legajo: usuario.legajo || '',
      dni: usuario.dni || '',
      cuil: usuario.cuil || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      planta_id: plantaId,
      centrodecosto_id: centroId,
      proyecto_id: proyectoId,
      jerarquia_id: jerarquiaId,
      plannutricional_id: planId,
      fecha_ingreso: usuario.fecha_ingreso || usuario.fechaIngreso || '',
      contrato: usuario.contrato || '',
      contraseña: '', // Siempre vacío al editar
      confirmarContraseña: '', // Siempre vacío al editar
      foto: null,
      fotoPreview: usuario.foto || null,
    });
    setVista('editar');
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Debug: verificar cuando se cambia centro de costo
    if (name === 'centrodecosto_id') {
      console.log('DEBUG centrodecosto_id cambiado:', {
        name,
        value,
        valueType: typeof value,
      });
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text('Listado de Usuarios', 14, 15);
      
      // Fecha de exportación
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Exportado el: ${fecha}`, 14, 22);
      
      // Preparar datos para la tabla
      const tableData = usuarios.map(usuario => [
        usuario.username || '-',
        usuario.nombre || '-',
        usuario.apellido || '-',
        usuario.legajo || '-',
        usuario.dni || '-',
        usuario.cuil || '-',
        usuario.jerarquia_nombre || usuario.jerarquia || '-',
        usuario.plannutricional_nombre || usuario.plannutricional || '-'
      ]);
      
      // Crear tabla
      doc.autoTable({
        startY: 28,
        head: [['Username', 'Nombre', 'Apellido', 'Legajo', 'DNI', 'CUIL', 'Jerarquía', 'Plan Nutricional']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 28 }
      });
      
      // Guardar archivo
      const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
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
      // Preparar datos para Excel
      const datosExcel = usuarios.map(usuario => ({
        'Username': usuario.username || '',
        'Nombre': usuario.nombre || '',
        'Apellido': usuario.apellido || '',
        'Legajo': usuario.legajo || '',
        'DNI': usuario.dni || '',
        'CUIL': usuario.cuil || '',
        'Jerarquía': usuario.jerarquia_nombre || usuario.jerarquia || '',
        'Plan Nutricional': usuario.plannutricional_nombre || usuario.plannutricional || ''
      }));
      
      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
      
      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // Username
        { wch: 15 }, // Nombre
        { wch: 15 }, // Apellido
        { wch: 10 }, // Legajo
        { wch: 12 }, // DNI
        { wch: 15 }, // CUIL
        { wch: 15 }, // Jerarquía
        { wch: 20 }  // Plan Nutricional
      ];
      ws['!cols'] = colWidths;
      
      // Guardar archivo
      const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  // Manejar cambio de archivo (foto)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Error',
          text: 'El archivo debe ser una imagen',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }
      
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Error',
          text: 'La imagen no debe superar los 5MB',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          foto: file,
          fotoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar foto
  const handleEliminarFoto = () => {
    setFormData((prev) => ({
      ...prev,
      foto: null,
      fotoPreview: null,
    }));
    // Limpiar el input file
    const fileInput = document.getElementById('foto');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Validar formulario
  const validarFormulario = (datosAValidar = formData) => {
    const errores = [];
    let primerCampoConError = null;

    // Asegurarse de que datosAValidar tenga todas las propiedades necesarias
    const datos = {
      username: datosAValidar?.username || '',
      nombre: datosAValidar?.nombre || '',
      apellido: datosAValidar?.apellido || '',
      legajo: datosAValidar?.legajo || '',
      dni: datosAValidar?.dni || '',
      cuil: datosAValidar?.cuil || '',
      jerarquia_id: datosAValidar?.jerarquia_id || '',
      plannutricional_id: datosAValidar?.plannutricional_id || '',
      planta_id: datosAValidar?.planta_id || '',
      centrodecosto_id: datosAValidar?.centrodecosto_id || '',
      proyecto_id: datosAValidar?.proyecto_id || '',
      contraseña: datosAValidar?.contraseña || '',
      confirmarContraseña: datosAValidar?.confirmarContraseña || '',
    };

    // Validar username solo al crear
    if (!usuarioEditando && !datos.username.trim()) {
      errores.push('El username es requerido');
      if (!primerCampoConError) primerCampoConError = 'username';
    }

    // Validar nombre
    if (!datos.nombre.trim()) {
      errores.push('El nombre es requerido');
      if (!primerCampoConError) primerCampoConError = 'nombre';
    }

    // Validar apellido
    if (!datos.apellido.trim()) {
      errores.push('El apellido es requerido');
      if (!primerCampoConError) primerCampoConError = 'apellido';
    }

    // Validar legajo
    if (!datos.legajo || datos.legajo.toString().trim() === '') {
      errores.push('El legajo es requerido');
      if (!primerCampoConError) primerCampoConError = 'legajo';
    }

    // Validar DNI
    if (!datos.dni || datos.dni.toString().trim() === '') {
      errores.push('El DNI es requerido');
      if (!primerCampoConError) primerCampoConError = 'dni';
    }

    // Validar CUIL
    if (!datos.cuil || datos.cuil.trim() === '') {
      errores.push('El CUIL es requerido');
      if (!primerCampoConError) primerCampoConError = 'cuil';
    }

    // Validar jerarquía (solo si hay más de una opción disponible y no es root)
    if (!datos.jerarquia_id || datos.jerarquia_id === '') {
      // Si solo hay una opción, no validar (se seleccionará automáticamente)
      if (jerarquias.length > 1 && datos.username !== 'root') {
        errores.push('La jerarquía es requerida');
        if (!primerCampoConError) primerCampoConError = 'jerarquia_id';
      }
    }

    // Validar plan nutricional (solo si hay más de una opción disponible)
    // Si hay un solo plan nutricional, no validar porque se asignará automáticamente
    if (planesNutricionales.length > 1) {
      // Convertir a string para comparación consistente (los valores de select vienen como string)
      const planNutricionalValue = String(datos.plannutricional_id || '').trim();
      if (!planNutricionalValue || planNutricionalValue === '' || planNutricionalValue === '0' || planNutricionalValue === 'null' || planNutricionalValue === 'undefined') {
        errores.push('El plan nutricional es requerido');
        if (!primerCampoConError) primerCampoConError = 'plannutricional_id';
      }
    }

    // Validar planta (solo si hay más de una opción disponible)
    if (!datos.planta_id || datos.planta_id === '') {
      // Si solo hay una opción, no validar (se seleccionará automáticamente)
      if (plantas.length > 1) {
        errores.push('La planta es requerida');
        if (!primerCampoConError) primerCampoConError = 'planta_id';
      }
    }

    // Validar centro de costo (solo si hay más de una opción disponible)
    // Si hay un solo centro de costo, no validar porque se asignará automáticamente
    if (centrosDeCosto.length > 1) {
      // Convertir a string para comparación consistente (los valores de select vienen como string)
      const centroCostoValue = String(datos.centrodecosto_id || '').trim();
      if (!centroCostoValue || centroCostoValue === '' || centroCostoValue === '0' || centroCostoValue === 'null' || centroCostoValue === 'undefined') {
        errores.push('El centro de costo es requerido');
        if (!primerCampoConError) primerCampoConError = 'centrodecosto_id';
      }
    }
    // Si hay un solo centro de costo, asegurarse de que esté asignado (se hará automáticamente en handleGuardar)

    // Validar proyecto (solo si hay más de una opción disponible)
    if (!datos.proyecto_id || datos.proyecto_id === '') {
      // Si solo hay una opción, no validar (se seleccionará automáticamente)
      if (proyectos.length > 1) {
        errores.push('El proyecto es requerido');
        if (!primerCampoConError) primerCampoConError = 'proyecto_id';
      }
    }

      // Validar contraseña solo si es nuevo usuario o si se está cambiando
    if (!usuarioEditando) {
      // Al crear, la contraseña es obligatoria
      const passwordValue = datos.contraseña?.trim() || '';
      if (!passwordValue || passwordValue.length < 6) {
        errores.push('La contraseña es requerida y debe tener al menos 6 caracteres');
        if (!primerCampoConError) primerCampoConError = 'contraseña';
      }
    }

    // Validar que las contraseñas coincidan si se está creando o cambiando
    if (datos.contraseña && datos.contraseña.trim() !== '') {
      const passwordValue = datos.contraseña.trim();
      const confirmPasswordValue = datos.confirmarContraseña?.trim() || '';
      if (passwordValue !== confirmPasswordValue) {
        errores.push('Las contraseñas no coinciden');
        if (!primerCampoConError) primerCampoConError = 'confirmarContraseña';
      }
    }

    // Mostrar todos los errores
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
        // Después de cerrar el modal, mover el foco al primer campo con error
        if (primerCampoConError) {
          const campo = document.getElementById(primerCampoConError);
          if (campo) {
            // Hacer scroll suave hasta el campo
            campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Esperar un poco para que termine el scroll y luego enfocar
            setTimeout(() => {
              campo.focus();
              // Si es un select, abrirlo
              if (campo.tagName === 'SELECT') {
                campo.click();
              }
            }, 300);
          }
        }
      });
      return false;
    }

    return true;
  };

  // Guardar usuario (crear o actualizar)
  const handleGuardar = async () => {
    // Preparar datos actualizados con valores automáticos si hay un solo valor disponible
    // IMPORTANTE: Hacer una copia profunda para asegurar que todos los valores se copien correctamente
    const datosActualizados = {
      ...formData,
      contraseña: formData.contraseña || '', // Asegurar que la contraseña se copie explícitamente
      confirmarContraseña: formData.confirmarContraseña || '', // Asegurar que la confirmación se copie explícitamente
    };
    
    // Si hay un solo valor disponible, asignarlo automáticamente SIEMPRE (incluso si está vacío, es 0, o es string vacío)
    // Para jerarquía, usar exactamente la misma lógica que planta
    if ((!datosActualizados.jerarquia_id || datosActualizados.jerarquia_id === '' || datosActualizados.jerarquia_id === 0) && jerarquias.length === 1) {
      datosActualizados.jerarquia_id = jerarquias[0].id;
    }
    // Si no hay valor asignado pero hay jerarquías disponibles, usar el valor del formData o el primero (igual que planta)
    if ((!datosActualizados.jerarquia_id || datosActualizados.jerarquia_id === '' || datosActualizados.jerarquia_id === 0) && jerarquias.length > 0) {
      datosActualizados.jerarquia_id = formData.jerarquia_id || jerarquias[0].id;
    }
    // Plan nutricional: SIEMPRE usar el valor seleccionado en el formulario si existe
    // Prioridad: 1) Valor seleccionado en formData (SIEMPRE tiene prioridad), 2) Valor único disponible, 3) null
    // Convertir a string para comparación consistente (los valores de select vienen como string)
    const planNutricionalFormValue = String(formData.plannutricional_id || '').trim();
    
    // SIEMPRE priorizar el valor del select si existe (incluso si hay múltiples opciones)
    if (planNutricionalFormValue && planNutricionalFormValue !== '' && planNutricionalFormValue !== '0' && planNutricionalFormValue !== 'null' && planNutricionalFormValue !== 'undefined') {
      // Si hay un valor seleccionado en el formulario, SIEMPRE usarlo (sin importar si hay uno o múltiples)
      datosActualizados.plannutricional_id = planNutricionalFormValue;
    } else if (planesNutricionales.length === 1) {
      // Si no hay valor seleccionado pero hay solo uno disponible, asignarlo automáticamente
      datosActualizados.plannutricional_id = String(planesNutricionales[0].id);
    }
    if ((!datosActualizados.planta_id || datosActualizados.planta_id === '' || datosActualizados.planta_id === 0) && plantas.length === 1) {
      datosActualizados.planta_id = plantas[0].id;
    }
    // Centro de costo: SIEMPRE usar el valor seleccionado en el formulario si existe
    // Prioridad: 1) Valor seleccionado en formData (SIEMPRE tiene prioridad), 2) Valor único disponible, 3) null
    // Convertir a string para comparación consistente (los valores de select vienen como string)
    const centroCostoFormValue = String(formData.centrodecosto_id || '').trim();
    
    // SIEMPRE priorizar el valor del select si existe (incluso si hay múltiples opciones)
    if (centroCostoFormValue && centroCostoFormValue !== '' && centroCostoFormValue !== '0' && centroCostoFormValue !== 'null' && centroCostoFormValue !== 'undefined') {
      // Si hay un valor seleccionado en el formulario, SIEMPRE usarlo (sin importar si hay uno o múltiples)
      datosActualizados.centrodecosto_id = centroCostoFormValue;
    } else if (centrosDeCosto.length === 1) {
      // Si no hay valor seleccionado pero hay solo uno disponible, asignarlo automáticamente
      datosActualizados.centrodecosto_id = String(centrosDeCosto[0].id);
    }
    if ((!datosActualizados.proyecto_id || datosActualizados.proyecto_id === '' || datosActualizados.proyecto_id === 0) && proyectos.length === 1) {
      datosActualizados.proyecto_id = proyectos[0].id;
    }
    
    // Actualizar el estado con los valores automáticos
    setFormData(datosActualizados);
    
    // Debug: verificar valores antes de validar
    console.log('DEBUG antes de validar:', {
      formData_plannutricional_id: formData.plannutricional_id,
      formData_centrodecosto_id: formData.centrodecosto_id,
      datosActualizados_plannutricional_id: datosActualizados.plannutricional_id,
      datosActualizados_centrodecosto_id: datosActualizados.centrodecosto_id,
      planesNutricionales_length: planesNutricionales.length,
      centrosDeCosto_length: centrosDeCosto.length,
    });
    
    // Validar con los datos actualizados (pasar datosActualizados como parámetro)
    if (!validarFormulario(datosActualizados)) {
      return;
    }

    try {
      setIsLoading(true);

      const usuarioData = {
        id: datosActualizados.id,
        username: datosActualizados.username.trim(),
        nombre: datosActualizados.nombre.trim(),
        apellido: datosActualizados.apellido.trim(),
        legajo: parseInt(datosActualizados.legajo),
        dni: datosActualizados.dni ? parseInt(datosActualizados.dni) : null,
        cuil: datosActualizados.cuil || null,
        email: datosActualizados.email || null,
        telefono: datosActualizados.telefono || null,
        planta_id: datosActualizados.planta_id ? parseInt(datosActualizados.planta_id) : null,
        centrodecosto_id: (() => {
          // Usar directamente datosActualizados que ya tiene el valor procesado correctamente
          const valorActualizado = String(datosActualizados.centrodecosto_id || '').trim();
          
          if (valorActualizado && valorActualizado !== '' && valorActualizado !== '0' && valorActualizado !== 'null' && valorActualizado !== 'undefined') {
            const valor = parseInt(valorActualizado);
            if (!isNaN(valor)) {
              return valor;
            }
          }
          // Si hay solo un centro de costo disponible, usar ese
          if (centrosDeCosto.length === 1) {
            const valor = parseInt(centrosDeCosto[0].id);
            if (!isNaN(valor)) {
              return valor;
            }
          }
          return null;
        })(),
        proyecto_id: datosActualizados.proyecto_id ? parseInt(datosActualizados.proyecto_id) : null,
        jerarquia_id: datosActualizados.jerarquia_id ? parseInt(datosActualizados.jerarquia_id) : null,
        plannutricional_id: (() => {
          // Usar directamente datosActualizados que ya tiene el valor procesado correctamente
          const valorActualizado = String(datosActualizados.plannutricional_id || '').trim();
          
          if (valorActualizado && valorActualizado !== '' && valorActualizado !== '0' && valorActualizado !== 'null' && valorActualizado !== 'undefined') {
            const valor = parseInt(valorActualizado);
            if (!isNaN(valor)) {
              return valor;
            }
          }
          // Si hay solo un plan nutricional disponible, usar ese
          if (planesNutricionales.length === 1) {
            const valor = parseInt(planesNutricionales[0].id);
            if (!isNaN(valor)) {
              return valor;
            }
          }
          return null;
        })(),
        fecha_ingreso: datosActualizados.fecha_ingreso || null,
        contrato: datosActualizados.contrato || null,
      };

      // Obtener el valor de la contraseña (puede estar en datosActualizados o formData)
      const passwordValue = (datosActualizados.contraseña || formData.contraseña || '').trim();
      
      // Debug: verificar valores de contraseña antes de enviar
      console.log('DEBUG contraseña antes de enviar:', {
        usuarioEditando: usuarioEditando,
        datosActualizados_contraseña: datosActualizados.contraseña,
        formData_contraseña: formData.contraseña,
        passwordValue: passwordValue,
        passwordValue_length: passwordValue.length,
        passwordValue_isEmpty: passwordValue === '',
      });

      // Solo incluir contraseña si se está creando o si se está cambiando
      if (!usuarioEditando) {
        // Al crear, la contraseña es obligatoria
        if (!passwordValue || passwordValue.length < 6) {
          Swal.fire({
            title: 'Error de validación',
            text: 'La contraseña es requerida y debe tener al menos 6 caracteres',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          }).then(() => {
            const campo = document.getElementById('contraseña');
            if (campo) {
              campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
              campo.focus();
            }
          });
          setIsLoading(false);
          return;
        }
        usuarioData.contraseña = passwordValue;
      } else if (passwordValue && passwordValue.length > 0) {
        // Al editar, solo incluir si se está cambiando (no vacía)
        if (passwordValue.length < 6) {
          Swal.fire({
            title: 'Error de validación',
            text: 'La contraseña debe tener al menos 6 caracteres',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          }).then(() => {
            const campo = document.getElementById('contraseña');
            if (campo) {
              campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
              campo.focus();
            }
          });
          setIsLoading(false);
          return;
        }
        usuarioData.contraseña = passwordValue;
      }
      
      // Verificar que la contraseña esté presente si es necesario
      if (!usuarioEditando && !usuarioData.contraseña) {
        Swal.fire({
          title: 'Error',
          text: 'Error interno: La contraseña no se capturó correctamente. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        setIsLoading(false);
        return;
      }
      
      if (usuarioEditando) {
        await apiService.actualizarUsuario(usuarioData);
        Swal.fire({
          title: 'Éxito',
          text: 'Usuario actualizado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      } else {
        await apiService.crearUsuario(usuarioData);
        Swal.fire({
          title: 'Éxito',
          text: 'Usuario creado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        });
      }

      handleVolverALista();
      cargarUsuarios(currentPage, filtro, filtroActivo === 'activo');
    } catch (error) {
      // Si hay error de conexión, el interceptor ya redirige automáticamente
      // Solo mostrar el error si no es un error de conexión
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al guardar el usuario',
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
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      // El useEffect se encargará de recargar los datos automáticamente
    }
  };

  // Cambiar tab activa
  const cambiarTab = (tab) => {
    setTabActivo(tab);
  };

  // Cuando cambia el filtro o filtroActivo, resetear a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, filtroActivo]);

  // Cuando cambia la página, el filtro o filtroActivo, recargar desde el servidor
  useEffect(() => {
    // Si filtroActivo es 'todos', enviar false para obtener todos
    // Si es 'activo', enviar true para solo activos
    // Si es 'inactivo', enviar false (el backend debería tener un parámetro para inactivos, pero por ahora usamos false)
    const soloActivos = filtroActivo === 'activo';
    cargarUsuarios(currentPage, filtro, soloActivos);
  }, [currentPage, filtro, filtroActivo, cargarUsuarios]);

  // Renderizar vista de formulario (editar o crear)
  if (vista === 'editar' || vista === 'crear') {
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
              {vista === 'editar' ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
          </div>
        </div>
        
        {/* Barra informativa para creación */}
        {vista === 'crear' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
            <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Creando nuevo usuario - Complete los campos obligatorios para guardar.</span>
          </div>
        )}

        {/* Barra informativa para edición */}
        {vista === 'editar' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
            <i className="fa fa-pencil-alt" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>Editando usuario - Modifique los campos necesarios y guarde los cambios.</span>
          </div>
        )}
        
        <div className="usuarios-form-container" style={{ 
          width: '100%', 
          boxSizing: 'border-box', 
          maxWidth: '1200px', 
          margin: '0 auto'
        }}>
          <form style={{ width: '100%' }}>
            {/* Navegación de Tabs */}
            <div style={{ 
              borderBottom: '2px solid #dee2e6',
              marginBottom: '1.5rem'
            }}>
              <ul style={{
                display: 'flex',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                flexWrap: 'wrap'
              }}>
                <li style={{ marginRight: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => cambiarTab('personal')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderBottom: tabActivo === 'personal' ? '3px solid #F34949' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      color: tabActivo === 'personal' ? '#F34949' : '#6c757d',
                      fontWeight: tabActivo === 'personal' ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa fa-user mr-2"></i>Información Personal
                  </button>
                </li>
                <li style={{ marginRight: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => cambiarTab('identificacion')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderBottom: tabActivo === 'identificacion' ? '3px solid #F34949' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      color: tabActivo === 'identificacion' ? '#F34949' : '#6c757d',
                      fontWeight: tabActivo === 'identificacion' ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa fa-id-card mr-2"></i>Identificación
                  </button>
                </li>
                <li style={{ marginRight: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => cambiarTab('contacto')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderBottom: tabActivo === 'contacto' ? '3px solid #F34949' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      color: tabActivo === 'contacto' ? '#F34949' : '#6c757d',
                      fontWeight: tabActivo === 'contacto' ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa fa-envelope mr-2"></i>Contacto
                  </button>
                </li>
                <li style={{ marginRight: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => cambiarTab('organizacion')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderBottom: tabActivo === 'organizacion' ? '3px solid #F34949' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      color: tabActivo === 'organizacion' ? '#F34949' : '#6c757d',
                      fontWeight: tabActivo === 'organizacion' ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa fa-building mr-2"></i>Organización
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => cambiarTab('seguridad')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderBottom: tabActivo === 'seguridad' ? '3px solid #F34949' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      color: tabActivo === 'seguridad' ? '#F34949' : '#6c757d',
                      fontWeight: tabActivo === 'seguridad' ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa fa-lock mr-2"></i>Seguridad
                  </button>
                </li>
              </ul>
            </div>

            {/* Contenido de Tabs */}
            {/* Tab: Información Personal */}
            {tabActivo === 'personal' && (
              <div className="form-section">
                <div className="form-section-content">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username || ''}
                      onChange={handleInputChange}
                      required
                      disabled={!!usuarioEditando}
                      style={usuarioEditando ? {
                        backgroundColor: '#e9ecef',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      } : {}}
                    />
                    {usuarioEditando && (
                      <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        El username no puede ser modificado
                      </small>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="foto">Foto del Usuario</label>
                    <input
                      type="file"
                      className="form-control-file"
                      id="foto"
                      name="foto"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '0.25rem',
                        width: '100%',
                        fontSize: '0.9rem'
                      }}
                    />
                    {(formData.fotoPreview || (usuarioEditando && usuarioEditando.foto && !formData.fotoPreview)) && (
                      <div className="mt-2">
                        {formData.fotoPreview ? (
                          <>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Vista previa:</p>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img
                                src={formData.fotoPreview}
                                alt="Vista previa"
                                style={{
                                  maxWidth: '150px',
                                  maxHeight: '150px',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #ced4da',
                                  padding: '0.25rem'
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={handleEliminarFoto}
                                style={{
                                  position: 'absolute',
                                  top: '0.25rem',
                                  right: '0.25rem',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '50%',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.875rem'
                                }}
                                title="Eliminar foto"
                              >
                                <i className="fa fa-times"></i>
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Foto actual:</p>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img
                                src={usuarioEditando.foto}
                                alt="Foto actual"
                                style={{
                                  maxWidth: '150px',
                                  maxHeight: '150px',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #ced4da',
                                  padding: '0.25rem'
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={handleEliminarFoto}
                                style={{
                                  position: 'absolute',
                                  top: '0.25rem',
                                  right: '0.25rem',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '50%',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.875rem'
                                }}
                                title="Eliminar foto"
                              >
                                <i className="fa fa-times"></i>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="apellido">
                      Apellido <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
                </div>
              </div>
            )}

            {/* Tab: Identificación */}
            {tabActivo === 'identificacion' && (
              <div className="form-section">
                <div className="form-section-content">
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="legajo">
                      Legajo <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="legajo"
                      name="legajo"
                      value={formData.legajo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="dni">
                      DNI <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="cuil">
                      CUIL <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="cuil"
                      name="cuil"
                      value={formData.cuil}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
                </div>
              </div>
            )}

            {/* Tab: Contacto */}
            {tabActivo === 'contacto' && (
              <div className="form-section">
                <div className="form-section-content">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
                </div>
              </div>
            )}

            {/* Tab: Organización */}
            {tabActivo === 'organizacion' && (
              <div className="form-section">
                <div className="form-section-content">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="jerarquia_id">
                      Jerarquía <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      id="jerarquia_id"
                      name="jerarquia_id"
                      value={formData.jerarquia_id || ''}
                      onChange={handleInputChange}
                      required
                    >
                      {jerarquias.length > 0 ? (
                        jerarquias.map((jer) => (
                          <option key={jer.id} value={jer.id}>
                            {jer.nombre || jer.descripcion}
                          </option>
                        ))
                      ) : (
                        <option value="">Sin opciones disponibles</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="plannutricional_id">
                      Plan Nutricional <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      id="plannutricional_id"
                      name="plannutricional_id"
                      value={formData.plannutricional_id || (planesNutricionales.length === 1 ? planesNutricionales[0].id : '')}
                      onChange={handleInputChange}
                      disabled={planesNutricionales.length <= 1}
                      required
                      style={planesNutricionales.length <= 1 ? {
                        backgroundColor: '#e9ecef',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      } : {}}
                    >
                      {planesNutricionales.length > 0 ? (
                        planesNutricionales.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.nombre || plan.descripcion}
                          </option>
                        ))
                      ) : (
                        <option value="">Sin opciones disponibles</option>
                      )}
                    </select>
                    {planesNutricionales.length <= 1 && planesNutricionales.length > 0 && (
                      <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                        <i className="fa fa-info-circle mr-1"></i>
                        Solo hay una opción disponible
                      </small>
                    )}
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4">
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
                      disabled={plantas.length <= 1}
                      required
                      style={plantas.length <= 1 ? {
                        backgroundColor: '#e9ecef',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      } : {}}
                    >
                      {plantas.length > 0 ? (
                        plantas.map((planta) => (
                          <option key={planta.id} value={planta.id}>
                            {planta.nombre || planta.descripcion}
                          </option>
                        ))
                      ) : (
                        <option value="">Sin opciones disponibles</option>
                      )}
                    </select>
                    {plantas.length <= 1 && plantas.length > 0 && (
                      <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                        <i className="fa fa-info-circle mr-1"></i>
                        Solo hay una opción disponible
                      </small>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="centrodecosto_id">
                      Centro de Costo <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      id="centrodecosto_id"
                      name="centrodecosto_id"
                      value={formData.centrodecosto_id || (centrosDeCosto.length === 1 ? centrosDeCosto[0].id : '')}
                      onChange={handleInputChange}
                      disabled={centrosDeCosto.length <= 1}
                      required
                      style={centrosDeCosto.length <= 1 ? {
                        backgroundColor: '#e9ecef',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      } : {}}
                    >
                      {centrosDeCosto.length > 0 ? (
                        centrosDeCosto.map((cc) => (
                          <option key={cc.id} value={cc.id}>
                            {cc.nombre || cc.descripcion}
                          </option>
                        ))
                      ) : (
                        <option value="">Sin opciones disponibles</option>
                      )}
                    </select>
                    {centrosDeCosto.length <= 1 && centrosDeCosto.length > 0 && (
                      <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                        <i className="fa fa-info-circle mr-1"></i>
                        Solo hay una opción disponible
                      </small>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="proyecto_id">
                      Proyecto <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      id="proyecto_id"
                      name="proyecto_id"
                      value={formData.proyecto_id || ''}
                      onChange={handleInputChange}
                      disabled={proyectos.length <= 1}
                      required
                      style={proyectos.length <= 1 ? {
                        backgroundColor: '#e9ecef',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      } : {}}
                    >
                      {proyectos.length > 0 ? (
                        proyectos.map((proj) => (
                          <option key={proj.id} value={proj.id}>
                            {proj.nombre || proj.descripcion}
                          </option>
                        ))
                      ) : (
                        <option value="">Sin opciones disponibles</option>
                      )}
                    </select>
                    {proyectos.length <= 1 && proyectos.length > 0 && (
                      <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                        <i className="fa fa-info-circle mr-1"></i>
                        Solo hay una opción disponible
                      </small>
                    )}
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="fecha_ingreso">Fecha de Ingreso</label>
                    <input
                      type="date"
                      className="form-control"
                      id="fecha_ingreso"
                      name="fecha_ingreso"
                      value={formData.fecha_ingreso || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="contrato">Contrato</label>
                    <input
                      type="text"
                      className="form-control"
                      id="contrato"
                      name="contrato"
                      value={formData.contrato || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: Indefinido, Temporal, etc."
                    />
                  </div>
                </div>
                </div>
              </div>
              </div>
            )}

            {/* Tab: Seguridad */}
            {tabActivo === 'seguridad' && (
              <div className="form-section">
                <div className="form-section-content">
                {/* Campos señuelo para que el navegador use el autocompletado */}
                <input
                  type="text"
                  name="fake-username"
                  autoComplete="username"
                  style={{ display: 'none' }}
                />
                <input
                  type="password"
                  name="fake-password"
                  autoComplete="new-password"
                  style={{ display: 'none' }}
                />

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="contraseña">
                        {usuarioEditando
                          ? 'Nueva Contraseña (dejar vacío para no cambiar)'
                          : 'Contraseña *'}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="contraseña"
                        name="contraseña"
                        autoComplete="new-password"
                        value={formData.contraseña || ''}
                        onChange={handleInputChange}
                        required={!usuarioEditando}
                        minLength={usuarioEditando && !formData.contraseña ? 0 : 6}
                        placeholder={usuarioEditando ? 'Escriba la nueva contraseña' : ''}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="confirmarContraseña">
                        {usuarioEditando ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña'}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmarContraseña"
                        name="confirmarContraseña"
                        autoComplete="new-password"
                        value={formData.confirmarContraseña || ''}
                        onChange={handleInputChange}
                        required={!usuarioEditando || formData.contraseña}
                        placeholder={usuarioEditando ? 'Confirme la nueva contraseña' : ''}
                      />
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Botones de acción */}
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
      {/* Barra negra con título Usuarios */}
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
          <i className="fa fa-users mr-2" aria-hidden="true"></i>Usuarios
        </h3>
      </div>
      
      <div style={{ paddingTop: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Botón Agregar */}
        <div style={{ marginBottom: '1rem' }}>
          <AgregarButton onClick={handleCrearUsuario} />
        </div>

        {/* Filtro de búsqueda con botones de exportación */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <Buscador 
              filtro={filtro}
              setFiltro={setFiltro}
              placeholder="Filtrar por nombre, apellido, legajo..."
            />
          </div>
          
          {/* Filtro Activo/Inactivo y Botones de exportación */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Selector de estado Activo/Inactivo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ margin: 0, fontSize: '0.9rem', color: '#495057', whiteSpace: 'nowrap' }}>
                Estado:
              </label>
              <select
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
            
            <button
              type="button"
              className="btn"
              onClick={handleExportarPDF}
              disabled={usuarios.length === 0}
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
              disabled={usuarios.length === 0}
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

        {/* Tabla de usuarios */}
        <DataTable
          columns={[
            { key: 'username', field: 'username', label: 'Username' },
            { key: 'nombre', field: 'nombre', label: 'Nombre' },
            { key: 'apellido', field: 'apellido', label: 'Apellido' },
            { key: 'legajo', field: 'legajo', label: 'Legajo' },
            { key: 'dni', field: 'dni', label: 'DNI' },
            { key: 'cuil', field: 'cuil', label: 'CUIL' },
            { 
              key: 'jerarquia', 
              field: 'jerarquia_nombre', 
              label: 'Jerarquía',
              render: (value, row) => row.jerarquia_nombre || row.jerarquia || '-'
            },
            { 
              key: 'plannutricional', 
              field: 'plannutricional_nombre', 
              label: 'Plan Nutricional',
              render: (value, row) => row.plannutricional_nombre || row.plannutricional || '-'
            },
          ]}
          data={usuarios}
          isLoading={isLoading}
          emptyMessage={
            filtro 
              ? 'No se encontraron usuarios que coincidan con la búsqueda' 
              : filtroActivo === 'activo' 
                ? 'No hay usuarios registrados Activos' 
                : filtroActivo === 'inactivo' 
                  ? 'No hay usuarios registrados Inactivos' 
                  : 'No hay usuarios registrados'
          }
          onEdit={handleEditarUsuario}
          onDelete={(usuario) => {
            // No permitir eliminar al usuario root
            if (usuario.username === 'root') {
              Swal.fire({
                title: 'No permitido',
                text: 'No se puede eliminar al usuario root porque es un usuario del sistema.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949',
              });
              return;
            }
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea dar de baja al usuario ${usuario.nombre} ${usuario.apellido}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, dar de baja',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await apiService.eliminarUsuario(usuario.id);
                  Swal.fire({
                    title: 'Dado de baja',
                    text: 'Usuario dado de baja correctamente',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    allowOutsideClick: true,
                  });
                  cargarUsuarios(currentPage, filtro, filtroActivo === 'activo');
                } catch (error) {
                  // Si hay error de conexión, el interceptor ya redirige automáticamente
                  if (!error.redirectToLogin) {
                    Swal.fire({
                      title: 'Error',
                      text: error.message || 'Error al dar de baja el usuario',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                  }
                }
              }
            });
          }}
          canDelete={(row) => {
            // No permitir eliminar al usuario root
            if (row.username === 'root') {
              return false;
            }
            
            // No permitir eliminar si el usuario está inactivo
            // Función helper para determinar si un usuario está inactivo
            const rawActivo = row.activo !== undefined ? row.activo :
                             row.isActive !== undefined ? row.isActive :
                             row.Activo !== undefined ? row.Activo :
                             row.deletemark !== undefined ? !row.deletemark :
                             row.Deletemark !== undefined ? !row.Deletemark :
                             row.deleteMark !== undefined ? !row.deleteMark :
                             undefined;
            
            // Convertir a boolean si viene como string o número
            let isInactivo = false;
            if (rawActivo !== undefined) {
              isInactivo = rawActivo === false ||
                          rawActivo === 0 ||
                          rawActivo === '0' ||
                          rawActivo === 'false' ||
                          (typeof rawActivo === 'string' && rawActivo.toLowerCase() === 'false');
            } else {
              // Si no hay campo activo y estamos viendo inactivos, asumir que está inactivo
              isInactivo = filtroActivo === 'inactivo';
            }
            
            // Si está inactivo, no mostrar botón de eliminar
            return !isInactivo;
          }}
          renderActions={(usuario) => {
            // Función helper para determinar si un usuario está inactivo
            // Buscar el campo en varias variantes posibles
            const rawActivo = usuario.activo !== undefined ? usuario.activo :
                             usuario.isActive !== undefined ? usuario.isActive :
                             usuario.Activo !== undefined ? usuario.Activo :
                             usuario.deletemark !== undefined ? !usuario.deletemark :
                             usuario.Deletemark !== undefined ? !usuario.Deletemark :
                             usuario.deleteMark !== undefined ? !usuario.deleteMark :
                             undefined;
            
            // Convertir a boolean si viene como string o número
            let isInactivo = false;
            if (rawActivo !== undefined) {
              isInactivo = rawActivo === false ||
                          rawActivo === 0 ||
                          rawActivo === '0' ||
                          rawActivo === 'false' ||
                          (typeof rawActivo === 'string' && rawActivo.toLowerCase() === 'false');
            } else {
              // Si no hay campo activo y estamos viendo inactivos, asumir que está inactivo
              isInactivo = filtroActivo === 'inactivo';
            }
            
            // Si el usuario está inactivo, mostrar botón de activar
            if (isInactivo) {
              return (
                <button
                  className="btn btn-sm btn-success"
                  onClick={async () => {
                    Swal.fire({
                      title: '¿Está seguro?',
                      text: `¿Desea activar al usuario ${usuario.nombre || ''} ${usuario.apellido || ''}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#28a745',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: 'Sí, activar',
                      cancelButtonText: 'Cancelar',
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          await apiService.activarUsuario(usuario.id);
                          Swal.fire({
                            title: 'Activado',
                            text: 'Usuario activado correctamente',
                            icon: 'success',
                            timer: 3000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            allowOutsideClick: true,
                          });
                          cargarUsuarios(currentPage, filtro, filtroActivo === 'activo');
                        } catch (error) {
                          // Si hay error de conexión, el interceptor ya redirige automáticamente
                          if (!error.redirectToLogin) {
                            Swal.fire({
                              title: 'Error',
                              text: error.message || 'Error al activar el usuario',
                              icon: 'error',
                              confirmButtonText: 'Aceptar',
                              confirmButtonColor: '#F34949',
                            });
                          }
                        }
                      }
                    });
                  }}
                  title="Activar usuario"
                  style={{ marginRight: '0.5rem' }}
                >
                  <i className="fa fa-check-circle"></i>
                </button>
              );
            }
            return null;
          }}
          enablePagination={false}
          pageSize={pageSize}
        />
        
        {/* Controles de paginación del servidor (siempre que haya más de una página) */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <span className="text-muted">
                Mostrando página {currentPage} de {totalPages} ({totalItems} usuarios)
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

export default Usuarios;
