import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usuariosService } from '../services/usuariosService';
import { catalogosService } from '../services/catalogosService';
import { esJerarquiaAdmin } from '../constants/jerarquias';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import { mapUsuarios } from '../utils/dataMapper';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addPdfReportHeader } from '../utils/pdfReportHeader';
import ExcelJS from 'exceljs';
import { addExcelReportHeader } from '../utils/excelReportHeader';
import './Usuarios.css';
import '../components/CambiarContraseñaModal.css';

const MIN_PASSWORD_LENGTH = 8;

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
  
  // Estado para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const usernameInputRef = useRef(null);
  const legajoInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const jerarquiaInputRef = useRef(null);
  const contraseñaInputRef = useRef(null);

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
    bonificaciones: '0',
    bonificaciones_invitado: '0',
  });

  // Requisitos de contraseña (igual que CambiarContraseñaModal) - después de formData
  const passwordNueva = formData.contraseña || '';
  const reqMinLength = useMemo(() => (passwordNueva || '').length >= MIN_PASSWORD_LENGTH, [passwordNueva]);
  const reqMayuscula = useMemo(() => /[A-Z]/.test(passwordNueva || ''), [passwordNueva]);
  const reqNumeroEspecial = useMemo(() => /[0-9]|[^A-Za-z0-9]/.test(passwordNueva || ''), [passwordNueva]);
  const allPasswordReqs = reqMinLength && reqMayuscula && reqNumeroEspecial;
  const passwordStrength = useMemo(() => {
    const p = passwordNueva || '';
    if (p.length < MIN_PASSWORD_LENGTH) return 0;
    let s = 0;
    if (p.length >= MIN_PASSWORD_LENGTH) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]|[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [passwordNueva]);
  const passwordStrengthLabel = passwordStrength === 0 ? 'Débil' : passwordStrength === 1 ? 'Débil' : passwordStrength === 2 ? 'Medio' : 'Fuerte';

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
      
      const data = await usuariosService.getUsuarios(pageToUse, pageSizeToUse, searchTerm, soloActivosParam);
      
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
        // No mostrar el usuario smartTime en la lista (solo se gestiona desde Habilitar SmartTime)
        const sinSmartTime = usuariosMapeados.filter((u) => {
          const login = (u.username ?? u.Usuario ?? u.userName ?? '').toString().trim().toLowerCase();
          return login !== 'smarttime';
        });
        setUsuarios(sinSmartTime);
      } else {
        setUsuarios(usuariosArray);
      }
      
      setTotalPages(totalPagesBackend);
      setTotalItems(totalItemsBackend);
    } catch (error) {
      // Error al cargar usuarios
      
      // Si hay error de conexión, el interceptor ya redirige automáticamente
      if (!error.redirectToLogin) {
        Swal.fire(configurarSwal({
          title: 'Error',
          text: error.message || 'Error al cargar los usuarios',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
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
        catalogosService.getJerarquias(),
        catalogosService.getPlantas(),
        catalogosService.getCentrosDeCosto(),
        catalogosService.getProyectos(),
        catalogosService.getPlanesNutricionales(),
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

        // Asignar jerarquía SOLO si hay una sola opción y no está asignada
        if (jerarquias.length === 1 && (!prev.jerarquia_id || prev.jerarquia_id === '' || prev.jerarquia_id === 0)) {
          updated.jerarquia_id = jerarquias[0].id;
          hasChanges = true;
        }

        // Asignar planta SOLO si hay una sola opción y no está asignada
        if (plantas.length === 1 && (!prev.planta_id || prev.planta_id === '' || prev.planta_id === 0)) {
          updated.planta_id = plantas[0].id;
          hasChanges = true;
        }

        // Asignar centro de costo SOLO si hay una sola opción y no está asignada
        if (centrosDeCosto.length === 1 && (!prev.centrodecosto_id || prev.centrodecosto_id === '' || prev.centrodecosto_id === 0)) {
          updated.centrodecosto_id = centrosDeCosto[0].id;
          hasChanges = true;
        }

        // Asignar proyecto SOLO si hay una sola opción y no está asignada
        if (proyectos.length === 1 && (!prev.proyecto_id || prev.proyecto_id === '' || prev.proyecto_id === 0)) {
          updated.proyecto_id = proyectos[0].id;
          hasChanges = true;
        }

        // Asignar plan nutricional SOLO si hay una sola opción y no está asignada
        if (planesNutricionales.length === 1 && (!prev.plannutricional_id || prev.plannutricional_id === '' || prev.plannutricional_id === 0)) {
          const planId = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
          if (planId) {
            updated.plannutricional_id = planId;
            hasChanges = true;
          }
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

  // Enfocar campo nombre usuario al agregar nuevo usuario
  useEffect(() => {
    if (vista === 'crear' && usernameInputRef.current) {
      const timer = setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vista]);

  // Enfocar campo Legajo al ir al tab Identificación
  useEffect(() => {
    if (tabActivo === 'identificacion' && legajoInputRef.current) {
      const timer = setTimeout(() => {
        legajoInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [tabActivo]);

  // Enfocar campo Email al ir al tab Contacto
  useEffect(() => {
    if (tabActivo === 'contacto' && emailInputRef.current) {
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [tabActivo]);

  // Enfocar campo Contraseña al ir al tab Seguridad
  useEffect(() => {
    if (tabActivo === 'seguridad' && contraseñaInputRef.current) {
      const timer = setTimeout(() => {
        contraseñaInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [tabActivo]);

  // Función para volver a la lista
  const handleVolverALista = () => {
    setVista('lista');
    setUsuarioEditando(null);
    setTabActivo('personal'); // Resetear tab para próxima vez
    setShowPassword(false);
    setShowConfirmPassword(false);
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
      bonificaciones: '0',
      bonificaciones_invitado: '0',
    });
  };

  // Abrir página para crear nuevo usuario
  const handleCrearUsuario = () => {
    setUsuarioEditando(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTabActivo('personal'); // Siempre mostrar Información personal por defecto
    
    // Preparar formData inicial con valores automáticos SOLO si hay una sola opción disponible
    // Si hay múltiples opciones, dejar vacío para que aparezca "Seleccionar..."
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
      bonificaciones: '0',
      bonificaciones_invitado: '0',
    };
    
    setFormData(nuevoFormData);
    setVista('crear');
  };

  // Determina si un usuario es el administrador (no se puede editar ni eliminar, solo ver en el listado)
  // Jerarquías del backend: Admin, Cocina, Comensal, Gerencia (id 1-4)
  const esUsuarioAdministrador = (usuario) => {
    if (!usuario) return false;
    const username = (usuario.username || usuario.Username || '').toString().trim().toLowerCase();
    if (username === 'root' || username === 'admin') return true;
    // Jerarquía como string (API envía nombre: "Admin", "Cocina", "Comensal", "Gerencia")
    const jerarquiaStr = (usuario.jerarquia_nombre || usuario.jerarquiaNombre || usuario.jerarquia || usuario.Jerarquia || '');
    if (typeof jerarquiaStr === 'string' && esJerarquiaAdmin(jerarquiaStr)) return true;
    // Jerarquía como objeto anidado (ej. Jerarquia: { id, nombre: "Admin" })
    const jerarquiaObj = usuario.Jerarquia || usuario.jerarquia;
    if (jerarquiaObj && typeof jerarquiaObj === 'object') {
      const nombre = jerarquiaObj.nombre || jerarquiaObj.Nombre || jerarquiaObj.descripcion || jerarquiaObj.Descripcion || '';
      if (nombre && esJerarquiaAdmin(String(nombre))) return true;
    }
    return false;
  };

  // Obtiene el nombre de la jerarquía para mostrar (API puede enviar string u objeto anidado)
  const obtenerNombreJerarquia = (row) => {
    if (!row) return '-';
    const str = row.jerarquia_nombre || row.jerarquiaNombre || row.jerarquia || row.Jerarquia;
    if (str && typeof str === 'string' && str.trim()) return str.trim();
    const obj = row.Jerarquia || row.jerarquia;
    if (obj && typeof obj === 'object') {
      const nombre = obj.nombre || obj.Nombre || obj.descripcion || obj.Descripcion;
      if (nombre && typeof nombre === 'string' && nombre.trim()) return nombre.trim();
    }
    return '-';
  };

  // Abrir página para editar usuario
  const handleEditarUsuario = async (usuario) => {
    if (esUsuarioAdministrador(usuario)) {
      Swal.fire(configurarSwal({
        title: 'No permitido',
        text: 'El administrador no puede ser modificado. Solo puede verse en el listado.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      }));
      return;
    }
    try {
      setIsLoading(true);
      
      // Obtener el ID del usuario
      const usuarioId = usuario.id || usuario.Id || usuario.ID;
      if (!usuarioId) {
        Swal.fire(configurarSwal({
          title: 'Error',
          text: 'No se pudo obtener el ID del usuario',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }

      // Llamar al endpoint para obtener los datos completos del usuario
      const usuarioCompleto = await usuariosService.getUsuarioPorId(usuarioId);
      const usuarioParaEditar = usuarioCompleto || usuario;

      setUsuarioEditando(usuarioParaEditar);
    
      // Función auxiliar para obtener el ID correctamente, buscando en múltiples variantes
      const obtenerId = (arrayOpciones, campoNombre) => {
        // Buscar en múltiples variantes de nombres (camelCase, snake_case, PascalCase)
        let variantes = [
          `${campoNombre}_id`,
          `${campoNombre}Id`,
          `${campoNombre}ID`,
          `${campoNombre}_Id`,
          `${campoNombre}_ID`,
          campoNombre,
          // PascalCase específicos
          campoNombre === 'jerarquia' ? 'JerarquiaId' : 
          campoNombre === 'plannutricional' ? 'PlanNutricionalId' :
          campoNombre === 'planta' ? 'PlantaId' :
          campoNombre === 'centrodecosto' ? 'CentroCostoId' :
          campoNombre === 'proyecto' ? 'ProyectoId' : null
        ].filter(v => v !== null);
        
        // Agregar variantes adicionales específicas para plan nutricional
        if (campoNombre === 'plannutricional') {
          variantes = [
            ...variantes,
            'plannutricional_id',
            'planNutricionalId',
            'PlanNutricionalId',
            'PLANNUTRICIONAL_ID',
            'plan_nutricional_id',
            'planNutricional_id',
            'PlanNutricional_id',
            'plannutricionalId',
            'PlannutricionalId',
            'Plannutricional_id'
          ];
        }
        
        let idValue = null;
        for (const variante of variantes) {
          if (usuarioParaEditar[variante] !== undefined && usuarioParaEditar[variante] !== null && usuarioParaEditar[variante] !== '') {
            idValue = usuarioParaEditar[variante];

            break;
          }
        }
        
        // Si no se encontró en las variantes directas, buscar en objetos anidados (solo para plan nutricional)
        if (!idValue && campoNombre === 'plannutricional') {
          const planNutricionalObj = usuarioParaEditar.PlanNutricional || usuarioParaEditar.planNutricional || usuarioParaEditar.plan_nutricional || null;
          if (planNutricionalObj && typeof planNutricionalObj === 'object') {
            idValue = planNutricionalObj.id || planNutricionalObj.Id || planNutricionalObj.ID || null;
            if (idValue) {

            }
          }
        }
        
        // Validar que el ID encontrado existe en las opciones disponibles
        if (idValue !== null && idValue !== undefined && idValue !== '') {
          const idValueStr = String(idValue);
          const idValueNum = parseInt(idValue);
          
          // Buscar coincidencia en las opciones disponibles
          const opcionEncontrada = arrayOpciones.find(opcion => {
            const opcionId = String(opcion.id || opcion.Id || opcion.ID || '');
            const opcionIdNum = parseInt(opcion.id || opcion.Id || opcion.ID || 0);
            return opcionId === idValueStr || opcionIdNum === idValueNum;
          });
          
          if (opcionEncontrada) {

            return idValueStr;
          } else {

            idValue = null; // Invalidar el ID si no existe en las opciones
          }
        }
        
        // NO asignar automáticamente si hay múltiples opciones - solo si realmente no se encontró y hay una sola opción
        // Esto evita asignar "Diabético" cuando hay otros planes disponibles
        if ((!idValue || idValue === '' || idValue === 0) && arrayOpciones.length === 1) {

          idValue = arrayOpciones[0].id || arrayOpciones[0].Id || arrayOpciones[0].ID;
          return String(idValue);
        } else if (!idValue && arrayOpciones.length > 1) {

        }
        
        return '';
      };
      
      // Obtener IDs como strings
      const jerarquiaId = obtenerId(jerarquias, 'jerarquia');
      const planId = obtenerId(planesNutricionales, 'plannutricional');

      const plantaId = obtenerId(plantas, 'planta');
      const centroId = obtenerId(centrosDeCosto, 'centrodecosto');
      const proyectoId = obtenerId(proyectos, 'proyecto');
      
      
      // Buscar la foto en diferentes variantes de nombres (priorizar Foto con mayúscula)
      const fotoUsuario = usuarioParaEditar.Foto || usuarioParaEditar.foto || usuarioParaEditar.fotoUrl || usuarioParaEditar.foto_url || usuarioParaEditar.fotoBase64 || usuarioParaEditar.foto_base64 || null;
      
      // Si la foto es base64, asegurarse de que tenga el prefijo correcto para mostrarla
      let fotoParaMostrar = fotoUsuario;
      if (fotoUsuario && typeof fotoUsuario === 'string' && !fotoUsuario.startsWith('data:') && !fotoUsuario.startsWith('http')) {
        // Si es base64 puro, agregar el prefijo
        fotoParaMostrar = `data:image/jpeg;base64,${fotoUsuario}`;
      }
      
      // Convertir fecha de ingreso al formato YYYY-MM-DD para el input date
      let fechaIngresoFormateada = '';
      const fechaIngresoRaw = usuarioParaEditar.fecha_ingreso || usuarioParaEditar.fechaIngreso || usuarioParaEditar.FechaIngreso || '';
      if (fechaIngresoRaw) {
        try {
          // Si viene en formato ISO (con hora), extraer solo la fecha
          const fecha = new Date(fechaIngresoRaw);
          if (!isNaN(fecha.getTime())) {
            // Formatear a YYYY-MM-DD
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            fechaIngresoFormateada = `${año}-${mes}-${dia}`;
          } else if (typeof fechaIngresoRaw === 'string' && fechaIngresoRaw.includes('-')) {
            // Si ya viene en formato YYYY-MM-DD o similar, extraer solo la parte de la fecha
            fechaIngresoFormateada = fechaIngresoRaw.split('T')[0].split(' ')[0];
          }
        } catch (e) {

        }
      }
      
      setFormData({
        id: usuarioParaEditar.id || usuarioParaEditar.Id || usuarioParaEditar.ID,
        username: usuarioParaEditar.username || usuarioParaEditar.Username || '',
        nombre: usuarioParaEditar.nombre || usuarioParaEditar.Nombre || '',
        apellido: usuarioParaEditar.apellido || usuarioParaEditar.Apellido || '',
        legajo: usuarioParaEditar.legajo || usuarioParaEditar.Legajo || '',
        dni: usuarioParaEditar.dni || usuarioParaEditar.Dni || usuarioParaEditar.DNI || '',
        cuil: usuarioParaEditar.cuil || usuarioParaEditar.Cuil || usuarioParaEditar.CUIL || '',
        email: usuarioParaEditar.email || usuarioParaEditar.Email || '',
        telefono: usuarioParaEditar.telefono || usuarioParaEditar.Telefono || '',
        planta_id: plantaId,
        centrodecosto_id: centroId,
        proyecto_id: proyectoId,
        jerarquia_id: jerarquiaId,
        plannutricional_id: planId,
        fecha_ingreso: fechaIngresoFormateada,
        contrato: usuarioParaEditar.contrato || usuarioParaEditar.Contrato || '',
        contraseña: '', // Siempre vacío al editar
        confirmarContraseña: '', // Siempre vacío al editar
        foto: null, // No hay archivo nuevo, solo preview
        fotoPreview: fotoParaMostrar || null,
        bonificaciones: usuarioParaEditar.bonificaciones || usuarioParaEditar.Bonificaciones ? String(usuarioParaEditar.bonificaciones || usuarioParaEditar.Bonificaciones) : '0',
        bonificaciones_invitado: usuarioParaEditar.bonificaciones_invitado || usuarioParaEditar.BonificacionesInvitado ? String(usuarioParaEditar.bonificaciones_invitado || usuarioParaEditar.BonificacionesInvitado) : '0',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
      setTabActivo('personal'); // Siempre mostrar Información personal por defecto
      setVista('editar');
    } catch (error) {
      Swal.fire(configurarSwal({
        title: 'Error',
        text: error.message || 'Error al cargar los datos del usuario',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // DNI, Legajo y CUIL tienen sus propios handlers específicos, no usar handleInputChange para ellos
    if (name === 'dni' || name === 'legajo' || name === 'cuil') {
      return; // Estos campos tienen handlers específicos en el JSX
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Exportar a PDF (todos los usuarios activos, sin paginación)
  const handleExportarPDF = async () => {
    try {
      const data = await usuariosService.getUsuarios(1, 99999, '', true);
      const usuariosArray = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
      const usuariosMapeados = mapUsuarios(usuariosArray);
      const usuariosParaExportar = usuariosMapeados.filter((u) => {
        const login = (u.username ?? u.Usuario ?? u.userName ?? '').toString().trim().toLowerCase();
        return login !== 'smarttime';
      });

      const doc = new jsPDF();
      const startY = await addPdfReportHeader(doc, 'Listado de Usuarios');
      
      const tableData = usuariosParaExportar.map(usuario => [
        usuario.username || '-',
        usuario.nombre || '-',
        usuario.apellido || '-',
        usuario.legajo || '-',
        usuario.dni || '-',
        obtenerNombreJerarquia(usuario),
        usuario.plannutricional_nombre || usuario.plannutricional || '-'
      ]);
      
      // Crear tabla
      doc.autoTable({
        startY,
        head: [['Username', 'Nombre', 'Apellido', 'Legajo', 'DNI', 'Jerarquía', 'Plan Nutricional']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
      
      // Guardar archivo
      const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      Swal.fire(configurarSwal({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato PDF',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: true,
      }));
    } catch (error) {
      // Error al exportar PDF
        Swal.fire(configurarSwal({
          title: 'Error',
          text: 'Error al exportar el listado a PDF',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
    }
  };

  // Exportar a Excel (todos los usuarios activos, sin paginación)
  const handleExportarExcel = async () => {
    try {
      const data = await usuariosService.getUsuarios(1, 99999, '', true);
      const usuariosArray = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
      const usuariosMapeados = mapUsuarios(usuariosArray);
      const usuariosParaExportar = usuariosMapeados.filter((u) => {
        const login = (u.username ?? u.Usuario ?? u.userName ?? '').toString().trim().toLowerCase();
        return login !== 'smarttime';
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Usuarios');
      const startRow = await addExcelReportHeader(workbook, worksheet, 'Listado de Usuarios');

      const headers = ['Username', 'Nombre', 'Apellido', 'Legajo', 'DNI', 'Jerarquía', 'Plan Nutricional'];
      const headerRow = worksheet.getRow(startRow);
      headerRow.values = headers;
      headerRow.font = { bold: true };

      usuariosParaExportar.forEach(usuario => {
        worksheet.addRow([
          usuario.username || '',
          usuario.nombre || '',
          usuario.apellido || '',
          usuario.legajo || '',
          usuario.dni || '',
          obtenerNombreJerarquia(usuario),
          usuario.plannutricional_nombre || usuario.plannutricional || ''
        ]);
      });

      worksheet.columns = [
        { width: 15 }, { width: 15 }, { width: 15 }, { width: 10 },
        { width: 12 }, { width: 15 }, { width: 20 }
      ];

      const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      Swal.fire(configurarSwal({
        title: 'Éxito',
        text: 'El listado se ha exportado correctamente en formato Excel',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: true,
      }));
    } catch (error) {
      // Error al exportar Excel
        Swal.fire(configurarSwal({
          title: 'Error',
          text: 'Error al exportar el listado a Excel',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
    }
  };

  // Manejar cambio de archivo (foto)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        Swal.fire(configurarSwal({
          title: 'Error',
          text: 'El archivo debe ser una imagen',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        return;
      }
      
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire(configurarSwal({
          title: 'Error',
          text: 'La imagen no debe superar los 5MB',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
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

  // Función helper para configurar Swal.fire() sin campos de formulario
  const configurarSwal = (config) => {
    return {
      ...config,
      input: false,
      inputAttributes: {},
      inputOptions: {},
      inputValidator: null,
      inputValue: '',
      didOpen: () => {
        // Ocultar cualquier elemento de formulario que SweetAlert2 pueda crear
        setTimeout(() => {
          const swalInputs = document.querySelectorAll('.swal2-input, .swal2-select, .swal2-textarea, .swal2-file, .swal2-file-label');
          swalInputs.forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.height = '0';
            el.style.width = '0';
            el.style.padding = '0';
            el.style.margin = '0';
            el.style.opacity = '0';
            el.style.position = 'absolute';
            el.style.left = '-9999px';
          });
        }, 10);
        // Ejecutar didOpen personalizado si existe
        if (config.didOpen) {
          config.didOpen();
        }
      },
    };
  };

  // Validar formulario
  const validarFormulario = (datosAValidar = formData) => {
    const errores = [];
    let primerCampoConError = null;

    // Asegurarse de que datosAValidar tenga todas las propiedades necesarias
    // IMPORTANTE: Convertir a string para comparación consistente, pero preservar valores numéricos válidos
    const datos = {
      username: datosAValidar?.username || '',
      nombre: datosAValidar?.nombre || '',
      apellido: datosAValidar?.apellido || '',
      legajo: datosAValidar?.legajo || '',
      dni: datosAValidar?.dni || '',
      cuil: datosAValidar?.cuil || '',
      jerarquia_id: datosAValidar?.jerarquia_id !== undefined && datosAValidar?.jerarquia_id !== null ? String(datosAValidar.jerarquia_id) : '',
      plannutricional_id: datosAValidar?.plannutricional_id !== undefined && datosAValidar?.plannutricional_id !== null ? String(datosAValidar.plannutricional_id) : '',
      planta_id: datosAValidar?.planta_id !== undefined && datosAValidar?.planta_id !== null ? String(datosAValidar.planta_id) : '',
      centrodecosto_id: datosAValidar?.centrodecosto_id !== undefined && datosAValidar?.centrodecosto_id !== null ? String(datosAValidar.centrodecosto_id) : '',
      proyecto_id: datosAValidar?.proyecto_id !== undefined && datosAValidar?.proyecto_id !== null ? String(datosAValidar.proyecto_id) : '',
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
    if (plantas.length > 1) {
      // Convertir a string para comparación consistente
      const plantaValue = String(datos.planta_id || '').trim();
      if (!plantaValue || plantaValue === '' || plantaValue === '0' || plantaValue === 'null' || plantaValue === 'undefined') {
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

    // Validar proyecto (solo si hay más de una opción disponible)
    if (proyectos.length > 1) {
      // Convertir a string para comparación consistente
      const proyectoValue = String(datos.proyecto_id || '').trim();
      if (!proyectoValue || proyectoValue === '' || proyectoValue === '0' || proyectoValue === 'null' || proyectoValue === 'undefined') {
        errores.push('El proyecto es requerido');
        if (!primerCampoConError) primerCampoConError = 'proyecto_id';
      }
    }

      // Validar contraseña solo si es nuevo usuario o si se está cambiando
    if (!usuarioEditando) {
      // Al crear, la contraseña es obligatoria y debe cumplir requisitos
      const passwordValue = datos.contraseña?.trim() || '';
      if (!passwordValue) {
        errores.push('La contraseña es requerida');
        if (!primerCampoConError) primerCampoConError = 'contraseña';
      } else if (passwordValue.length < MIN_PASSWORD_LENGTH || !/[A-Z]/.test(passwordValue) || !/[0-9]|[^A-Za-z0-9]/.test(passwordValue)) {
        errores.push('La contraseña debe tener mínimo 8 caracteres, una letra mayúscula y un número o carácter especial');
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
      // Mapeo de mensajes de error a nombres de campos en español
      const nombresCampos = {
        'El legajo es requerido': 'Legajo',
        'El DNI es requerido': 'DNI',
        'El CUIL es requerido': 'CUIL',
        'La jerarquía es requerida': 'Jerarquía',
        'El plan nutricional es requerido': 'Plan Nutricional',
        'La planta es requerida': 'Planta',
        'El centro de costo es requerido': 'Centro de Costo',
        'El proyecto es requerido': 'Proyecto',
        'La contraseña es requerida': 'Contraseña',
        'La contraseña debe tener mínimo 8 caracteres, una letra mayúscula y un número o carácter especial': 'Contraseña',
        'Las contraseñas no coinciden': 'Confirmar Contraseña',
        'El nombre es requerido': 'Nombre',
        'El apellido es requerido': 'Apellido',
      };

      // Crear lista de errores con viñetas (bullets)
      const erroresFormateados = errores.map(error => {
        const nombreCampo = nombresCampos[error] || error.replace('El ', '').replace('La ', '').replace(' es requerido', '').replace(' es requerida', '').replace(' y debe tener al menos 6 caracteres', '');
        return `<li style="margin-bottom: 6px;">${nombreCampo}</li>`;
      });

      // Si hay más de 5 errores, mostrar en dos columnas
      let htmlErrores;
      if (errores.length > 5) {
        const mitad = Math.ceil(erroresFormateados.length / 2);
        const columna1 = erroresFormateados.slice(0, mitad).join('');
        const columna2 = erroresFormateados.slice(mitad).join('');
        htmlErrores = `
          <div style="display: flex; gap: 20px;">
            <ul style="list-style-type: disc; padding-left: 20px; margin: 0; flex: 1;">${columna1}</ul>
            <ul style="list-style-type: disc; padding-left: 20px; margin: 0; flex: 1;">${columna2}</ul>
          </div>
        `;
      } else {
        htmlErrores = `<ul style="list-style-type: disc; padding-left: 20px; margin: 0;">${erroresFormateados.join('')}</ul>`;
      }

      const htmlMensaje = `
        <div style="text-align: left; margin-top: 10px;">
          <div style="margin-bottom: 10px;">Los siguientes campos son obligatorios:</div>
          ${htmlErrores}
        </div>
      `;
      
      Swal.fire(configurarSwal({
        title: 'Error de validación',
        html: htmlMensaje,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
        allowOutsideClick: false,
        allowEscapeKey: true,
        width: errores.length > 5 ? '600px' : '500px',
        backdrop: true,
        target: document.body,
        customClass: {
          container: 'swal2-container-custom',
          popup: 'swal2-popup-custom'
        },
        didOpen: () => {
          // Asegurar que el popup esté completamente aislado del formulario
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) {
            swalContainer.style.zIndex = '99999';
            swalContainer.style.position = 'fixed';
          }
          // Ocultar cualquier elemento del formulario que pueda estar visible
          const formInputs = document.querySelectorAll('form input, form select, form textarea, form button[type="file"]');
          formInputs.forEach(input => {
            if (input.style) {
              input.setAttribute('data-original-display', input.style.display || '');
              input.style.display = 'none';
            }
          });
        },
        willClose: () => {
          // Restaurar elementos del formulario
          const formInputs = document.querySelectorAll('form input, form select, form textarea, form button[type="file"]');
          formInputs.forEach(input => {
            const originalDisplay = input.getAttribute('data-original-display');
            if (originalDisplay !== null) {
              input.style.display = originalDisplay;
              input.removeAttribute('data-original-display');
            } else if (input.style) {
              input.style.display = '';
            }
          });
        }
      })).then(() => {
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
      bonificaciones: formData.bonificaciones || '0', // Asegurar que bonificaciones se copie explícitamente
      bonificaciones_invitado: formData.bonificaciones_invitado || '0', // Asegurar que bonificaciones_invitado se copie explícitamente
    };

    // Jerarquía: asignar automáticamente si hay una sola opción (solo si no es root)
    if (jerarquias.length === 1 && formData.username !== 'root') {
      // SIEMPRE asignar si hay una sola opción, incluso si ya hay un valor
      datosActualizados.jerarquia_id = String(jerarquias[0].id);
    } else {
      // Si hay múltiples opciones o es root, usar el valor del formulario
      const jerarquiaFormValue = String(formData.jerarquia_id || '').trim();
      if (jerarquiaFormValue && jerarquiaFormValue !== '' && jerarquiaFormValue !== '0' && jerarquiaFormValue !== 'null' && jerarquiaFormValue !== 'undefined') {
        datosActualizados.jerarquia_id = jerarquiaFormValue;
      }
    }
    // Plan nutricional: asignar automáticamente SOLO si hay una sola opción
    if (planesNutricionales.length === 1) {
      // SIEMPRE asignar si hay una sola opción
      datosActualizados.plannutricional_id = String(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID);
    } else {
      // Si hay múltiples opciones, usar el valor del formulario
      const planNutricionalFormValue = String(formData.plannutricional_id || '').trim();

      if (planNutricionalFormValue && planNutricionalFormValue !== '' && planNutricionalFormValue !== '0' && planNutricionalFormValue !== 'null' && planNutricionalFormValue !== 'undefined') {
        datosActualizados.plannutricional_id = planNutricionalFormValue;

      } else {
        // Si no hay valor válido, dejar vacío para que la validación lo detecte
        datosActualizados.plannutricional_id = '';

      }
    }
    // Planta: asignar automáticamente SOLO si hay una sola opción
    if (plantas.length === 1) {
      // SIEMPRE asignar si hay una sola opción, incluso si ya hay un valor
      datosActualizados.planta_id = String(plantas[0].id);
    } else {
      // Si hay múltiples opciones, usar el valor del formulario
      const plantaFormValue = String(formData.planta_id || '').trim();
      if (plantaFormValue && plantaFormValue !== '' && plantaFormValue !== '0' && plantaFormValue !== 'null' && plantaFormValue !== 'undefined') {
        datosActualizados.planta_id = plantaFormValue;
      } else {
        // Si no hay valor válido, dejar vacío para que la validación lo detecte
        datosActualizados.planta_id = '';
      }
    }
    // Centro de costo: asignar automáticamente SOLO si hay una sola opción
    if (centrosDeCosto.length === 1) {
      // SIEMPRE asignar si hay una sola opción, incluso si ya hay un valor
      datosActualizados.centrodecosto_id = String(centrosDeCosto[0].id);
    } else {
      // Si hay múltiples opciones, usar el valor del formulario
      const centroCostoFormValue = String(formData.centrodecosto_id || '').trim();
      if (centroCostoFormValue && centroCostoFormValue !== '' && centroCostoFormValue !== '0' && centroCostoFormValue !== 'null' && centroCostoFormValue !== 'undefined') {
        datosActualizados.centrodecosto_id = centroCostoFormValue;
      } else {
        // Si no hay valor válido, dejar vacío para que la validación lo detecte
        datosActualizados.centrodecosto_id = '';
      }
    }
    // Proyecto: asignar automáticamente SOLO si hay una sola opción
    if (proyectos.length === 1) {
      // SIEMPRE asignar si hay una sola opción, incluso si ya hay un valor
      datosActualizados.proyecto_id = String(proyectos[0].id);
    } else {
      // Si hay múltiples opciones, usar el valor del formulario
      const proyectoFormValue = String(formData.proyecto_id || '').trim();
      if (proyectoFormValue && proyectoFormValue !== '' && proyectoFormValue !== '0' && proyectoFormValue !== 'null' && proyectoFormValue !== 'undefined') {
        datosActualizados.proyecto_id = proyectoFormValue;
      } else {
        // Si no hay valor válido, dejar vacío para que la validación lo detecte
        datosActualizados.proyecto_id = '';
      }
    }
    
    // Validar con los datos actualizados (pasar datosActualizados como parámetro)
    // IMPORTANTE: No actualizar formData antes de validar para evitar re-renders innecesarios

    const validacion = validarFormulario(datosActualizados);

    if (!validacion) {

      return;
    }

    try {
      setIsLoading(true);

      // Validar que todos los IDs requeridos estén presentes
      const jerarquiaId = datosActualizados.jerarquia_id ? parseInt(datosActualizados.jerarquia_id) : (jerarquias.length === 1 ? parseInt(jerarquias[0].id) : null);
      const planNutricionalId = datosActualizados.plannutricional_id && datosActualizados.plannutricional_id !== '' ? parseInt(datosActualizados.plannutricional_id) : (planesNutricionales.length === 1 ? parseInt(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID) : null);

      const plantaId = datosActualizados.planta_id ? parseInt(datosActualizados.planta_id) : (plantas.length === 1 ? parseInt(plantas[0].id) : null);
      const centroCostoId = datosActualizados.centrodecosto_id ? parseInt(datosActualizados.centrodecosto_id) : (centrosDeCosto.length === 1 ? parseInt(centrosDeCosto[0].id) : null);
      const proyectoId = datosActualizados.proyecto_id ? parseInt(datosActualizados.proyecto_id) : (proyectos.length === 1 ? parseInt(proyectos[0].id) : null);

      // Validar que los IDs requeridos no sean null y sean números válidos mayores a 0
      // Solo validar si hay múltiples opciones disponibles (si hay una sola opción, ya se asignó automáticamente)
      if (jerarquias.length > 1 && (!jerarquiaId || isNaN(jerarquiaId) || jerarquiaId <= 0)) {

        Swal.fire(configurarSwal({
          title: 'Error de validación',
          text: 'La jerarquía es requerida. Por favor, seleccione una jerarquía.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }
      if (planesNutricionales.length > 1 && (!planNutricionalId || isNaN(planNutricionalId) || planNutricionalId <= 0)) {

        Swal.fire(configurarSwal({
          title: 'Error de validación',
          text: 'El plan nutricional es requerido. Por favor, seleccione un plan nutricional.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }
      if (plantas.length > 1 && (!plantaId || isNaN(plantaId) || plantaId <= 0)) {
        Swal.fire(configurarSwal({
          title: 'Error de validación',
          text: 'La planta es requerida. Por favor, seleccione una planta.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }
      if (centrosDeCosto.length > 1 && (!centroCostoId || isNaN(centroCostoId) || centroCostoId <= 0)) {
        Swal.fire(configurarSwal({
          title: 'Error de validación',
          text: 'El centro de costo es requerido. Por favor, seleccione un centro de costo.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }
      if (proyectos.length > 1 && (!proyectoId || isNaN(proyectoId) || proyectoId <= 0)) {
        Swal.fire(configurarSwal({
          title: 'Error de validación',
          text: 'El proyecto es requerido. Por favor, seleccione un proyecto.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }
      
      // Validar que Legajo y Dni sean válidos
      const legajoValue = parseInt(datosActualizados.legajo);
      if (!legajoValue || isNaN(legajoValue) || legajoValue <= 0) {
        Swal.fire(configurarSwal({
          title: 'Error de validación',
          text: 'El legajo debe ser un número mayor a 0',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }
      
      const dniValue = datosActualizados.dni ? parseInt(datosActualizados.dni) : 0;
      if (!dniValue || isNaN(dniValue) || dniValue < 1000000 || dniValue > 99999999) {
        Swal.fire(configurarSwal({
          title: 'Error de validación',
          text: 'El DNI debe ser un número válido entre 1000000 y 99999999',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }

      // Convertir fecha_ingreso a formato DateTime si está presente
      let fechaIngresoFormatted = null;
      if (datosActualizados.fecha_ingreso && datosActualizados.fecha_ingreso.trim() !== '') {
        try {
          // Si viene en formato YYYY-MM-DD, convertir a ISO string
          const fecha = new Date(datosActualizados.fecha_ingreso);
          if (!isNaN(fecha.getTime())) {
            fechaIngresoFormatted = fecha.toISOString();
          }
        } catch (e) {
          // Error al formatear fecha de ingreso
        }
      }

      // Convertir foto a base64 si es un archivo
      let fotoBase64 = null;
      if (formData.foto && formData.foto instanceof File) {
        try {
          const reader = new FileReader();
          const filePromise = new Promise((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result;
              // Si el resultado incluye el prefijo data:image, mantenerlo completo
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(formData.foto);
          });
          fotoBase64 = await filePromise;
        } catch (e) {
          // Error al convertir foto a base64
        }
      } else if (formData.foto && typeof formData.foto === 'string') {
        // Si ya es un string (base64 o URL), usarlo directamente
        fotoBase64 = formData.foto;
      } else if (usuarioEditando && usuarioEditando.foto && !formData.foto) {
        // Si se está editando y no se cambió la foto, mantener la foto existente
        fotoBase64 = usuarioEditando.foto;
      } else if (formData.fotoPreview && !formData.foto) {
        // Si hay preview pero no hay archivo nuevo, usar el preview (puede ser base64 o URL)
        fotoBase64 = formData.fotoPreview;
      }

      // Construir objeto en PascalCase según el DTO del backend
      const usuarioData = {
        Username: datosActualizados.username ? datosActualizados.username.trim() : null,
        Nombre: datosActualizados.nombre.trim(),
        Apellido: datosActualizados.apellido.trim(),
        Legajo: legajoValue,
        Dni: dniValue,
        Cuil: datosActualizados.cuil ? datosActualizados.cuil.trim() : null,
        Domicilio: datosActualizados.domicilio ? datosActualizados.domicilio.trim() : null,
        FechaIngreso: fechaIngresoFormatted,
        Contrato: datosActualizados.contrato ? datosActualizados.contrato.trim() : null,
        Plannutricional_id: planNutricionalId || (planesNutricionales.length > 0 ? parseInt(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID) : null),
        PlantaId: plantaId,
        CentroCostoId: centroCostoId,
        ProyectoId: proyectoId,
        JerarquiaId: jerarquiaId,
        Bonificaciones: (() => {
          // Tomar el valor directamente de formData (estado actual del formulario)
          const valor = formData.bonificaciones !== undefined && formData.bonificaciones !== null && formData.bonificaciones !== '' 
            ? String(formData.bonificaciones).trim() 
            : (datosActualizados.bonificaciones !== undefined && datosActualizados.bonificaciones !== null && datosActualizados.bonificaciones !== ''
              ? String(datosActualizados.bonificaciones).trim()
              : '0');

          const parsed = parseInt(valor, 10);
          const resultado = isNaN(parsed) ? 0 : parsed;

          return resultado;
        })(),
        BonificacionesInvitado: (() => {
          // Tomar el valor directamente de formData (estado actual del formulario)
          const valor = formData.bonificaciones_invitado !== undefined && formData.bonificaciones_invitado !== null && formData.bonificaciones_invitado !== ''
            ? String(formData.bonificaciones_invitado).trim()
            : (datosActualizados.bonificaciones_invitado !== undefined && datosActualizados.bonificaciones_invitado !== null && datosActualizados.bonificaciones_invitado !== ''
              ? String(datosActualizados.bonificaciones_invitado).trim()
              : '0');

          const parsed = parseInt(valor, 10);
          const resultado = isNaN(parsed) ? 0 : parsed;

          return resultado;
        })(),
        Email: datosActualizados.email ? datosActualizados.email.trim() : null,
        Telefono: datosActualizados.telefono ? datosActualizados.telefono.trim() : null,
        Foto: fotoBase64,
        OrigenDatos: datosActualizados.origenDatos || null,
      };
      
      // Si es actualización, agregar el ID
      if (usuarioEditando && datosActualizados.id) {
        usuarioData.Id = parseInt(datosActualizados.id);
      }


      // Obtener el valor de la contraseña (puede estar en datosActualizados o formData)
      const passwordValue = (datosActualizados.contraseña || formData.contraseña || '').trim();

      // Solo incluir contraseña si se está creando o si se está cambiando
      if (!usuarioEditando) {
        // Al crear, la contraseña es obligatoria y debe cumplir requisitos
        const hasMinLen = passwordValue.length >= MIN_PASSWORD_LENGTH;
        const hasMayuscula = /[A-Z]/.test(passwordValue);
        const hasNumeroEspecial = /[0-9]|[^A-Za-z0-9]/.test(passwordValue);
        if (!passwordValue) {
          Swal.fire(configurarSwal({
            title: 'Error de validación',
            text: 'La contraseña es requerida',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          })).then(() => {
            const campo = document.getElementById('contraseña');
            if (campo) {
              campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
              campo.focus();
            }
          });
          setIsLoading(false);
          return;
        }
        if (!hasMinLen || !hasMayuscula || !hasNumeroEspecial) {
          Swal.fire(configurarSwal({
            title: 'Error de validación',
            text: 'La contraseña debe tener mínimo 8 caracteres, una letra mayúscula y un número o carácter especial',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          })).then(() => {
            const campo = document.getElementById('contraseña');
            if (campo) {
              campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
              campo.focus();
            }
          });
          setIsLoading(false);
          return;
        }
        usuarioData.Password = passwordValue;
      } else if (passwordValue && passwordValue.length > 0) {
        // Al editar, solo incluir si se está cambiando (no vacía)
        if (passwordValue.length < MIN_PASSWORD_LENGTH || !/[A-Z]/.test(passwordValue) || !/[0-9]|[^A-Za-z0-9]/.test(passwordValue)) {
          Swal.fire(configurarSwal({
            title: 'Error de validación',
            text: 'La contraseña debe tener mínimo 8 caracteres, una letra mayúscula y un número o carácter especial',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          })).then(() => {
            const campo = document.getElementById('contraseña');
            if (campo) {
              campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
              campo.focus();
            }
          });
          setIsLoading(false);
          return;
        }
        usuarioData.Password = passwordValue;
      }
      
      // Verificar que la contraseña esté presente si es necesario
      if (!usuarioEditando && !usuarioData.Password) {
        Swal.fire(configurarSwal({
          title: 'Error',
          text: 'Error interno: La contraseña no se capturó correctamente. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        }));
        setIsLoading(false);
        return;
      }
      
      if (usuarioEditando) {
        await usuariosService.actualizarUsuario(usuarioData);
        Swal.fire(configurarSwal({
          title: 'Éxito',
          text: 'Usuario actualizado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        }));
      } else {
        await usuariosService.crearUsuario(usuarioData);
        Swal.fire(configurarSwal({
          title: 'Éxito',
          text: 'Usuario creado correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: true,
        }));
      }

      handleVolverALista();
      cargarUsuarios(currentPage, filtro, filtroActivo === 'activo');
    } catch (error) {
      // Detectar errores de timeout
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Tiempo de espera');
      
      // Si hay error de conexión o timeout con redirectToLogin=true, el interceptor ya redirige automáticamente
      // En ese caso, no mostrar popup ni logs detallados porque el usuario será redirigido al login
      if (error.redirectToLogin) {
        // El interceptor se encarga de la redirección, no hacer nada más aquí
        return;
      }
      
      // Solo mostrar logs y popup si no hay redirección



      if (!error.redirectToLogin) {
        let errorTitle = 'Error';
        let errorMessage = error.message || 'Error al guardar el usuario';
        let erroresArray = null;
        
        // Si es un timeout, mostrar mensaje específico
        if (isTimeout) {
          errorTitle = 'Tiempo de espera agotado';
          errorMessage = 'El servidor está tardando demasiado en responder. Por favor, verifica tu conexión y que el backend esté funcionando correctamente.';
        }
        
        // Verificar si el backend devolvió errores de validación en formato JSON
        if (error.response && error.response.data) {
          const responseData = error.response.data;
          
          // Si hay un array de errores, mostrarlos todos
          if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
            errorTitle = responseData.message || 'Errores de validación';
            erroresArray = responseData.errors;
          } else if (responseData.error) {
            // Si hay un campo "error" con el mensaje (ej: "Ya existe un usuario con el mismo legajo.")
            errorTitle = 'Error';
            errorMessage = responseData.error;
          } else if (responseData.message) {
            // Si solo hay un mensaje general
            errorTitle = 'Error de validación';
            errorMessage = responseData.message;
          } else if (typeof responseData === 'string') {
            // Si la respuesta es directamente un string
            errorMessage = responseData;
          }
        }
        
        if (erroresArray && Array.isArray(erroresArray) && erroresArray.length > 0) {
          // Crear texto plano con los errores para evitar que se muestren campos del formulario
          const errorText = erroresArray.map(err => {
            const fieldName = err.field ? err.field.replace('dto.', '').replace('Dto.', '').replace('Dto', '') : 'Campo desconocido';
            return `${fieldName}: ${err.message || 'Error de validación'}`;
          }).join('\n');
          
          Swal.fire(configurarSwal({
            title: errorTitle,
            text: `Los siguientes errores fueron encontrados:\n\n${errorText}`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
            allowOutsideClick: false,
            allowEscapeKey: true,
            width: '500px',
            backdrop: true,
            target: document.body,
            customClass: {
              container: 'swal2-container-custom',
              popup: 'swal2-popup-custom'
            },
            didOpen: () => {
              // Asegurar que el popup esté completamente aislado del formulario
              const swalContainer = document.querySelector('.swal2-container');
              if (swalContainer) {
                swalContainer.style.zIndex = '99999';
                swalContainer.style.position = 'fixed';
              }
              // Ocultar cualquier elemento del formulario que pueda estar visible
              const formInputs = document.querySelectorAll('form input, form select, form textarea, form button[type="file"]');
              formInputs.forEach(input => {
                if (input.style) {
                  input.setAttribute('data-original-display', input.style.display || '');
                  input.style.display = 'none';
                }
              });
            },
            willClose: () => {
              // Restaurar elementos del formulario
              const formInputs = document.querySelectorAll('form input, form select, form textarea, form button[type="file"]');
              formInputs.forEach(input => {
                const originalDisplay = input.getAttribute('data-original-display');
                if (originalDisplay !== null) {
                  input.style.display = originalDisplay;
                  input.removeAttribute('data-original-display');
                } else if (input.style) {
                  input.style.display = '';
                }
              });
            }
          }));
        } else {
          Swal.fire(configurarSwal({
            title: errorTitle,
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
            backdrop: true,
            target: document.body,
            customClass: {
              container: 'swal2-container-custom',
              popup: 'swal2-popup-custom'
            },
            didOpen: () => {
              // Asegurar que el popup esté completamente aislado del formulario
              const swalContainer = document.querySelector('.swal2-container');
              if (swalContainer) {
                swalContainer.style.zIndex = '99999';
                swalContainer.style.position = 'fixed';
              }
              // Ocultar cualquier elemento del formulario que pueda estar visible
              const formInputs = document.querySelectorAll('form input, form select, form textarea, form button[type="file"]');
              formInputs.forEach(input => {
                if (input.style) {
                  input.setAttribute('data-original-display', input.style.display || '');
                  input.style.display = 'none';
                }
              });
            },
            willClose: () => {
              // Restaurar elementos del formulario
              const formInputs = document.querySelectorAll('form input, form select, form textarea, form button[type="file"]');
              formInputs.forEach(input => {
                const originalDisplay = input.getAttribute('data-original-display');
                if (originalDisplay !== null) {
                  input.style.display = originalDisplay;
                  input.removeAttribute('data-original-display');
                } else if (input.style) {
                  input.style.display = '';
                }
              });
            }
          }));
        }
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
          maxWidth: '95%', 
          margin: '0 auto',
          paddingLeft: '2rem',
          paddingRight: '2rem'
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
              {/* Primera línea: Nombre usuario, Nombre y Apellido */}
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label htmlFor="username">
                      Nombre usuario <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      ref={usernameInputRef}
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
                        opacity: 0.7,
                        borderRadius: '0'
                      } : {
                        borderRadius: '0'
                      }}
                    />
                    {usuarioEditando && (
                      <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        El nombre de usuario no puede ser modificado
                      </small>
                    )}
                  </div>
                </div>
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
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-5">
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
              {/* Segunda línea: Foto del Usuario */}
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="foto">Foto del Usuario</label>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: '1' }}>
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
                      </div>
                      {(formData.fotoPreview || (usuarioEditando && (usuarioEditando.Foto || usuarioEditando.foto))) && (
                        <div style={{ flexShrink: 0, marginTop: '0' }}>
                          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', marginTop: '0', paddingTop: '0' }}>
                            {formData.foto && formData.foto instanceof File ? 'Vista previa:' : 'Foto actual:'}
                          </p>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                              src={(() => {
                                // Si hay preview en formData, usarlo
                                if (formData.fotoPreview) {
                                  return formData.fotoPreview;
                                }
                                // Si no, buscar en usuarioEditando
                                const fotoOriginal = usuarioEditando?.Foto || usuarioEditando?.foto;
                                if (fotoOriginal) {
                                  // Si ya tiene el prefijo data:, usarlo directamente
                                  if (fotoOriginal.startsWith('data:') || fotoOriginal.startsWith('http')) {
                                    return fotoOriginal;
                                  }
                                  // Si es base64 puro, agregar el prefijo
                                  return `data:image/jpeg;base64,${fotoOriginal}`;
                                }
                                return '';
                              })()}
                              alt={formData.foto && formData.foto instanceof File ? "Vista previa" : "Foto actual"}
                              style={{
                                maxWidth: '150px',
                                maxHeight: '150px',
                                borderRadius: '0.25rem',
                                border: '1px solid #ced4da',
                                padding: '0.25rem',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
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
                                fontSize: '0.875rem',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              title="Eliminar foto"
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
                      ref={legajoInputRef}
                      type="text"
                      className="form-control"
                      id="legajo"
                      name="legajo"
                      value={formData.legajo}
                      onChange={(e) => {
                        // Solo permitir números, eliminar letras y símbolos
                        const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({
                          ...prev,
                          legajo: soloNumeros,
                        }));
                      }}
                      required
                      placeholder="Ingrese solo números"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="dni">
                      DNI <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={(e) => {
                        // Solo permitir números, eliminar letras y símbolos
                        const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({
                          ...prev,
                          dni: soloNumeros,
                        }));
                      }}
                      required
                      placeholder="Ingrese solo números"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="cuil">
                      CUIL
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="cuil"
                      name="cuil"
                      value={formData.cuil}
                      onChange={(e) => {
                        // Solo permitir números, eliminar guiones y otros caracteres
                        const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({
                          ...prev,
                          cuil: soloNumeros,
                        }));
                      }}
                      placeholder="Ingrese solo números sin guiones"
                    />
                    <small className="form-text text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      <i className="fa fa-info-circle" style={{ marginRight: '0.25rem' }}></i>
                      Ingrese el CUIL solo con números, sin guiones ni espacios
                    </small>
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
                      ref={emailInputRef}
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
              {/* Primera línea: Jerarquía, Plan Nutricional, Planta */}
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="jerarquia_id">
                      Jerarquía <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      ref={jerarquiaInputRef}
                      className="form-control"
                      id="jerarquia_id"
                      name="jerarquia_id"
                      value={formData.jerarquia_id || ''}
                      onChange={handleInputChange}
                      required
                      disabled={formData.username === 'root'}
                      style={formData.username === 'root' ? {
                        backgroundColor: '#e9ecef',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      } : {}}
                    >
                      {jerarquias.length === 0 ? (
                        <option value="">Sin opciones disponibles</option>
                      ) : jerarquias.length === 1 ? (
                        <option value={String(jerarquias[0].id)}>
                          {jerarquias[0].nombre || jerarquias[0].descripcion}
                        </option>
                      ) : (
                        <>
                          {!usuarioEditando && <option value="">Seleccionar jerarquía</option>}
                          {jerarquias.map((jer) => (
                            <option key={jer.id} value={String(jer.id)}>
                              {jer.nombre || jer.descripcion}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {formData.username === 'root' && (
                      <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        La jerarquía del usuario root no puede ser modificada
                      </small>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="plannutricional_id">
                      Plan Nutricional <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      id="plannutricional_id"
                      name="plannutricional_id"
                      value={formData.plannutricional_id || (planesNutricionales.length === 1 ? String(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID) : '')}
                      onChange={handleInputChange}
                      disabled={planesNutricionales.length <= 1}
                      required
                      style={planesNutricionales.length <= 1 ? {
                        backgroundColor: '#e9ecef',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      } : {}}
                    >
                      {planesNutricionales.length === 0 ? (
                        <option value="">Sin opciones disponibles</option>
                      ) : planesNutricionales.length === 1 ? (
                        <option value={String(planesNutricionales[0].id)}>
                          {planesNutricionales[0].nombre || planesNutricionales[0].descripcion}
                        </option>
                      ) : (
                        <>
                          {!usuarioEditando && <option value="">Seleccionar plan nutricional</option>}
                          {planesNutricionales.map((plan) => (
                            <option key={plan.id} value={String(plan.id)}>
                              {plan.nombre || plan.descripcion}
                            </option>
                          ))}
                        </>
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
                      {plantas.length === 0 ? (
                        <option value="">Sin opciones disponibles</option>
                      ) : plantas.length === 1 ? (
                        <option value={String(plantas[0].id)}>
                          {plantas[0].nombre || plantas[0].descripcion}
                        </option>
                      ) : (
                        <>
                          {!usuarioEditando && <option value="">Seleccionar planta</option>}
                          {plantas.map((planta) => (
                            <option key={planta.id} value={String(planta.id)}>
                              {planta.nombre || planta.descripcion}
                            </option>
                          ))}
                        </>
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
              </div>
              {/* Segunda línea: Centro de Costo, Proyecto, Fecha de Ingreso */}
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="centrodecosto_id">
                      Centro de Costo <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      id="centrodecosto_id"
                      name="centrodecosto_id"
                      value={formData.centrodecosto_id || (centrosDeCosto.length === 1 ? String(centrosDeCosto[0].id) : '')}
                      onChange={handleInputChange}
                      disabled={centrosDeCosto.length <= 1}
                      required
                      style={centrosDeCosto.length <= 1 ? {
                        backgroundColor: '#e9ecef',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      } : {}}
                    >
                      {centrosDeCosto.length === 0 ? (
                        <option value="">Sin opciones disponibles</option>
                      ) : centrosDeCosto.length === 1 ? (
                        <option value={String(centrosDeCosto[0].id)}>
                          {centrosDeCosto[0].nombre || centrosDeCosto[0].descripcion}
                        </option>
                      ) : (
                        <>
                          {!usuarioEditando && <option value="">Seleccionar centro de costo</option>}
                          {centrosDeCosto.map((cc) => (
                            <option key={cc.id} value={String(cc.id)}>
                              {cc.nombre || cc.descripcion}
                            </option>
                          ))}
                        </>
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
                      {proyectos.length === 0 ? (
                        <option value="">Sin opciones disponibles</option>
                      ) : proyectos.length === 1 ? (
                        <option value={String(proyectos[0].id)}>
                          {proyectos[0].nombre || proyectos[0].descripcion}
                        </option>
                      ) : (
                        <>
                          {!usuarioEditando && <option value="">Seleccionar proyecto</option>}
                          {proyectos.map((proj) => (
                            <option key={proj.id} value={String(proj.id)}>
                              {proj.nombre || proj.descripcion}
                            </option>
                          ))}
                        </>
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
              </div>
              {/* Tercera línea: Contrato, Bonificaciones, Bonificaciones Invitados */}
              <div className="row">
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
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="bonificaciones">Bonificaciones</label>
                    <input
                      type="number"
                      className="form-control"
                      id="bonificaciones"
                      name="bonificaciones"
                      value={formData.bonificaciones || '0'}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({
                          ...prev,
                          bonificaciones: value || '0',
                        }));
                      }}
                      min="0"
                      placeholder="0"
                    />
                    <small className="form-text text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                      <i className="fa fa-info-circle mr-1" style={{ color: '#6c757d' }}></i>
                      La cantidad de bonificaciones que se den serán tomadas por día
                    </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="bonificaciones_invitado">Bonificaciones Invitados</label>
                    <input
                      type="number"
                      className="form-control"
                      id="bonificaciones_invitado"
                      name="bonificaciones_invitado"
                      value={formData.bonificaciones_invitado || '0'}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({
                          ...prev,
                          bonificaciones_invitado: value || '0',
                        }));
                      }}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              </div>
              </div>
            )}

            {/* Tab: Seguridad - igual que CambiarContraseñaModal */}
            {tabActivo === 'seguridad' && (
              <div className="form-section">
                <div className="form-section-content">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group cambiar-contrasena-field">
                      <label htmlFor="contraseña">
                        {usuarioEditando
                          ? 'Nueva Contraseña (dejar vacío para no cambiar)'
                          : <><span className="cambiar-contrasena-asterisco">*</span> Nueva contraseña</>}
                      </label>
                      <div className="cambiar-contrasena-input-wrap">
                        <input
                          ref={contraseñaInputRef}
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          id="contraseña"
                          name="contraseña"
                          autoComplete="new-password"
                          value={formData.contraseña || ''}
                          onChange={handleInputChange}
                          required={!usuarioEditando}
                          minLength={usuarioEditando && !formData.contraseña ? 0 : MIN_PASSWORD_LENGTH}
                          placeholder="Mínimo 8 caracteres"
                        />
                        <button type="button" className="cambiar-contrasena-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                          <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="cambiar-contrasena-strength">
                        <span>Fortaleza: </span>
                        <span className={`cambiar-contrasena-strength-label strength-${passwordStrength}`}>{passwordStrengthLabel}</span>
                        <div className="cambiar-contrasena-strength-bar">
                          <div className={`cambiar-contrasena-strength-fill strength-${passwordStrength}`} style={{ width: passwordStrength === 0 ? '25%' : passwordStrength === 1 ? '25%' : passwordStrength === 2 ? '50%' : '100%' }} />
                        </div>
                      </div>
                      <ul className="cambiar-contrasena-reqs">
                        <li className={reqMinLength ? 'ok' : ''}>
                          <i className={`fa ${reqMinLength ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                          Mínimo 8 caracteres
                        </li>
                        <li className={reqMayuscula ? 'ok' : ''}>
                          <i className={`fa ${reqMayuscula ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                          Una letra mayúscula
                        </li>
                        <li className={reqNumeroEspecial ? 'ok' : ''}>
                          <i className={`fa ${reqNumeroEspecial ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                          Un número o carácter especial
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group cambiar-contrasena-field">
                      <label htmlFor="confirmarContraseña">
                        {usuarioEditando ? 'Confirmar Nueva Contraseña' : <><span className="cambiar-contrasena-asterisco">*</span> Confirmar nueva contraseña</>}
                      </label>
                      <div className="cambiar-contrasena-input-wrap">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="form-control"
                          id="confirmarContraseña"
                          name="confirmarContraseña"
                          autoComplete="new-password"
                          value={formData.confirmarContraseña || ''}
                          onChange={handleInputChange}
                          required={!usuarioEditando || formData.contraseña}
                          placeholder="Repita la nueva contraseña"
                          minLength={usuarioEditando && !formData.contraseña ? 0 : MIN_PASSWORD_LENGTH}
                        />
                        <button type="button" className="cambiar-contrasena-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}>
                          <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      {formData.contraseña && formData.confirmarContraseña && formData.contraseña !== formData.confirmarContraseña && (
                        <p className="cambiar-contrasena-error">
                          <i className="fa fa-exclamation-circle"></i> Las contraseñas no coinciden
                        </p>
                      )}
                      {formData.contraseña && formData.confirmarContraseña && formData.contraseña === formData.confirmarContraseña && allPasswordReqs && (
                        <small style={{ color: '#28a745', display: 'flex', alignItems: 'center', marginTop: '0.25rem', textAlign: 'left' }}>
                          <i className="fa fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                          Las contraseñas coinciden
                        </small>
                      )}
                      {!formData.contraseña && !formData.confirmarContraseña && (
                        <small style={{ color: '#6c757d', display: 'flex', alignItems: 'center', marginTop: '0.25rem', fontStyle: 'italic', textAlign: 'left' }}>
                          <i className="fa fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                          Las contraseñas deben ser iguales
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Botones de acción */}
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
      {/* Barra negra con título Usuarios */}
      <div className="page-title-bar">
        <h3>
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
            { 
              key: 'jerarquia', 
              field: 'jerarquia_nombre', 
              label: 'Jerarquía',
              render: (value, row) => obtenerNombreJerarquia(row)
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
          canEdit={(usuario) => {
            // El administrador solo puede verse en el listado, no editarse ni eliminarse
            if (esUsuarioAdministrador(usuario)) {
              return false;
            }
            // Si estamos en el filtro de "Inactivos", no mostrar el botón de editar
            if (filtroActivo === 'inactivo') {
              return false;
            }
            // Si estamos en el filtro de "Activos", todos los usuarios mostrados están activos
            if (filtroActivo === 'activo') {
              return true;
            }
            // Por defecto, usar el campo normalizado 'activo'
            const isActivo = usuario.activo === true || usuario.activo === 1 || usuario.activo === 'true' || usuario.activo === '1';
            return isActivo; // Solo se puede editar si está activo
          }}
          onDelete={(usuario) => {
            // El administrador no puede ser eliminado; solo puede verse en el listado
            if (esUsuarioAdministrador(usuario)) {
              Swal.fire(configurarSwal({
                title: 'No permitido',
                text: 'El administrador no puede ser modificado ni eliminado. Solo puede verse en el listado.',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#F34949',
              }));
              return;
            }
            Swal.fire(configurarSwal({
              title: '¿Está seguro?',
              text: `¿Desea dar de baja al usuario ${usuario.nombre} ${usuario.apellido}?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, dar de baja',
              cancelButtonText: 'Cancelar',
            })).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await usuariosService.eliminarUsuario(usuario.id);
                  Swal.fire(configurarSwal({
                    title: 'Dado de baja',
                    text: 'Usuario dado de baja correctamente',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    allowOutsideClick: true,
                  }));
                  cargarUsuarios(currentPage, filtro, filtroActivo === 'activo');
                } catch (error) {
                  // Si hay error de conexión, el interceptor ya redirige automáticamente
                  if (!error.redirectToLogin) {
                    Swal.fire(configurarSwal({
                      title: 'Error',
                      text: error.message || 'Error al dar de baja el usuario',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    }));
                  }
                }
              }
            });
          }}
          canDelete={(row) => {
            // El administrador no puede ser eliminado; solo puede verse en el listado
            if (esUsuarioAdministrador(row)) {
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
                  onClick={async () => {
                    Swal.fire(configurarSwal({
                      title: '¿Está seguro?',
                      text: `¿Desea activar al usuario ${usuario.nombre || ''} ${usuario.apellido || ''}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#28a745',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: 'Sí, activar',
                      cancelButtonText: 'Cancelar',
                    })).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          await usuariosService.activarUsuario(usuario.id);
                          Swal.fire(configurarSwal({
                            title: 'Activado',
                            text: 'Usuario activado correctamente',
                            icon: 'success',
                            timer: 3000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            allowOutsideClick: true,
                          }));
                          cargarUsuarios(currentPage, filtro, filtroActivo === 'activo');
                        } catch (error) {
                          // Si hay error de conexión, el interceptor ya redirige automáticamente
                          if (!error.redirectToLogin) {
                            Swal.fire(configurarSwal({
                              title: 'Error',
                              text: error.message || 'Error al activar el usuario',
                              icon: 'error',
                              confirmButtonText: 'Aceptar',
                              confirmButtonColor: '#F34949',
                            }));
                          }
                        }
                      }
                    });
                  }}
                  title="Activar usuario"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#28a745',
                    border: 'none',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    marginRight: '0.5rem'
                  }}
                >
                  <i className="fa fa-check" style={{ color: 'white', fontSize: '16px' }}></i>
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
          <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
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
