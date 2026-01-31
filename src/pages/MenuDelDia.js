// src/pages/MenuDelDia.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { menuService } from '../services/menuService';
import { catalogosService } from '../services/catalogosService';
import { turnosService } from '../services/turnosService';
import { platosService } from '../services/platosService';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Usuarios.css';

const MenuDelDia = () => {
  useAuth();
  
  // Función para obtener la fecha local en formato YYYY-MM-DD
  const obtenerFechaLocal = () => {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };
  
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('activo');
  const [vista, setVista] = useState('lista'); // 'lista' | 'editar' | 'crear'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaLocal()); // Fecha de hoy por defecto
  
  // Estados para el modal de impresión
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState({
    plato: true,
    plannutricional: true,
    turno: true,
    jerarquia: true,
    proyecto: true,
    centroCosto: true,
    planta: true,
    cantidad: true,
    comandadas: true,
    fecha: false,
    estado: false,
  });
  const [filtrosImpresion, setFiltrosImpresion] = useState({
    fecha: obtenerFechaLocal(),
    turnoId: '',
    planNutricionalId: '',
    jerarquiaId: '',
    proyectoId: '',
    centroCostoId: '',
    plantaId: '',
    activo: null, // null = todos, true = solo activos, false = solo inactivos
  });

  // Estados para el buscador de plato
  const [busquedaPlato, setBusquedaPlato] = useState('');
  const [mostrarDropdownPlato, setMostrarDropdownPlato] = useState(false);
  const [, setPlatoSeleccionadoNombre] = useState('');
  
  // Ref para rastrear el plan nutricional anterior y evitar limpiar el plato en la primera carga
  const planNutricionalAnteriorRef = useRef(null);
  // Ref para rastrear si estamos cargando un menú para editar
  const cargandoParaEditarRef = useRef(false);

  // Catálogos
  const [turnos, setTurnos] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [platosPorPlan, setPlatosPorPlan] = useState([]); // Platos filtrados por plan nutricional desde el API
  const [jerarquias, setJerarquias] = useState([]);
  const [planesNutricionales, setPlanesNutricionales] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState([]);
  const [plantas, setPlantas] = useState([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Form
  const [formData, setFormData] = useState({
    id: null,
    platoId: '',
    turnoId: '',
    jerarquiaId: '',
    plannutricional_id: '',
    proyectoId: '',
    centroCostoId: '',
    plantaId: '',
    cantidad: '1',
    comandadas: 0, // platos ya asignados/comandados (solo al editar; al crear es 0)
    fecha: obtenerFechaLocal(), // Fecha actual en formato YYYY-MM-DD
    activo: true,
  });

  // ===================== carga datos =====================

  const cargarCatalogos = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        turnosData,
        platosData,
        jerarquiasData,
        planesData,
        proyectosData,
        centrosData,
        plantasData,
      ] = await Promise.all([
        turnosService.getTurnosLista(1, 1000, '', true), // Obtener todos los turnos activos
        platosService.obtenerPlatosLista(1, 1000, '', true), // Obtener todos los platos activos
        catalogosService.getJerarquias(),
        catalogosService.getPlanesNutricionales(),
        catalogosService.getProyectos(),
        catalogosService.getCentrosDeCosto(),
        catalogosService.getPlantas(),
      ]);

      // El backend devuelve: { id, nombre, descripcion }
      // Normalizar y asegurar que sean arrays
      // getTurnosLista devuelve un objeto con items, totalItems, etc.
      const turnosArray = Array.isArray(turnosData) ? turnosData : (turnosData?.items || turnosData?.data || []);
      const platosArray = Array.isArray(platosData) ? (platosData.items || platosData.data || platosData) : [];
      
      setTurnos(turnosArray);
      setPlatos(platosArray);
      setJerarquias(Array.isArray(jerarquiasData) ? jerarquiasData : []);
      setPlanesNutricionales(Array.isArray(planesData) ? planesData : []);
      setProyectos(Array.isArray(proyectosData) ? proyectosData : []);
      setCentrosDeCosto(Array.isArray(centrosData) ? centrosData : []);
      setPlantas(Array.isArray(plantasData) ? plantasData : []);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los catálogos. Por favor, intente de nuevo más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cargarMenus = useCallback(
    async (page = 1, searchTerm = '', fecha = null) => {
      try {
        setIsLoading(true);
        
        // Usar la fecha proporcionada o la fecha seleccionada
        const fechaFiltro = fecha || fechaSeleccionada;
        
        // Solo pasar los parámetros que acepta el endpoint según la firma del método
        // public HttpResponseMessage ObtenerLista(int page, int pageSize, DateTime? fechaDesde, 
        // DateTime? fechaHasta, string search, bool activo)
        // Convertir filtroActivo a boolean para el backend
        // 'activo' -> true, 'inactivo' -> false
        const soloActivos = filtroActivo === 'activo' ? true : false;
        
        const filtros = {
          activo: soloActivos, // true para activos, false para de baja
          fechaDesde: fechaFiltro,
          fechaHasta: fechaFiltro,
          search: searchTerm && searchTerm.trim() ? searchTerm.trim() : null,
        };

        // Llamar a ObtenerLista de la API
        const data = await menuService.getLista(page, pageSize, filtros);

        let items = [];
        let totalItemsCount = 0;
        let totalPagesCount = 1;

        if (Array.isArray(data)) {
          items = data;
          totalItemsCount = items.length;
          totalPagesCount = Math.ceil(items.length / pageSize);
        } else {
          items = data.items || data.Items || data.data || [];
          totalItemsCount = data.totalItems || data.TotalItems || data.total || items.length;
          totalPagesCount = data.totalPages || data.TotalPages || Math.ceil(totalItemsCount / pageSize);
        }

        setMenus(items);
        setCurrentPage(page);
        setTotalPages(totalPagesCount);
        setTotalItems(totalItemsCount);
      } catch (error) {
        if (!error.redirectToLogin) {
          Swal.fire({
            title: 'Error',
            text: error.message || 'Error al cargar los menús del día',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
        }
        setMenus([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, filtroActivo, fechaSeleccionada]
  );

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Cargar menús al iniciar y cuando cambian los filtros
  useEffect(() => {
    // Cargar menús inmediatamente con la fecha de hoy, sin esperar a que los platos estén cargados
    cargarMenus(currentPage, filtro, fechaSeleccionada);
  }, [currentPage, filtro, filtroActivo, cargarMenus, fechaSeleccionada]);

  // Auto-seleccionar valores cuando hay un solo elemento disponible en los catálogos
  // SOLO en modo editar, NO en modo crear (en crear siempre debe estar "-- Seleccionar --")
  useEffect(() => {
    if (vista === 'editar') {
      setFormData(prev => {
        const nuevo = { ...prev };
        
        // Solo auto-seleccionar si el campo está vacío
        // Auto-seleccionar jerarquía si hay una sola
        if (jerarquias.length === 1 && !prev.jerarquiaId) {
          const jerarquiaId = jerarquias[0].id || jerarquias[0].Id || jerarquias[0].ID;
          nuevo.jerarquiaId = String(jerarquiaId);
        }
        
        // Auto-seleccionar turno si hay uno solo
        if (turnos.length === 1 && !prev.turnoId) {
          const turnoId = turnos[0].id || turnos[0].Id || turnos[0].ID;
          nuevo.turnoId = String(turnoId);
        }
        
        // Auto-seleccionar proyecto si hay uno solo
        if (proyectos.length === 1 && !prev.proyectoId) {
          const proyectoId = proyectos[0].id || proyectos[0].Id || proyectos[0].ID;
          nuevo.proyectoId = String(proyectoId);
        }
        
        // Auto-seleccionar centro de costo si hay uno solo
        if (centrosDeCosto.length === 1 && !prev.centroCostoId) {
          const centroId = centrosDeCosto[0].id || centrosDeCosto[0].Id || centrosDeCosto[0].ID;
          nuevo.centroCostoId = String(centroId);
        }
        
        // Auto-seleccionar planta si hay una sola
        if (plantas.length === 1 && !prev.plantaId) {
          const plantaId = plantas[0].id || plantas[0].Id || plantas[0].ID;
          nuevo.plantaId = String(plantaId);
        }
        
        // Auto-seleccionar plan nutricional si hay uno solo
        if (planesNutricionales.length === 1 && !prev.plannutricional_id) {
          const planId = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
          nuevo.plannutricional_id = String(planId);
        }
        
        return nuevo;
      });
    }
  }, [jerarquias, turnos, proyectos, centrosDeCosto, plantas, planesNutricionales, vista]);

  // Validar y corregir plan nutricional cuando se cargan los catálogos en modo edición
  useEffect(() => {
    if (vista === 'editar' && formData.plannutricional_id && planesNutricionales.length > 0) {
      const planIdActual = String(formData.plannutricional_id);
      const planExiste = planesNutricionales.some(
        (p) => String(p.id || p.Id || p.ID) === planIdActual
      );
      
      if (!planExiste) {
        // Intentar encontrar el plan por ID numérico
        const planIdNum = parseInt(planIdActual);
        const planEncontrado = planesNutricionales.find(
          (p) => (p.id || p.Id || p.ID) === planIdNum
        );
        
        if (planEncontrado) {
          const planIdCorrecto = String(planEncontrado.id || planEncontrado.Id || planEncontrado.ID);
          setFormData(prev => ({
            ...prev,
            plannutricional_id: planIdCorrecto
          }));
        }
      }
    }
  }, [vista, formData.plannutricional_id, planesNutricionales]);

  // ===================== handlers =====================

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Si se cambia el plan nutricional, limpiar la selección de plato
    if (name === 'plannutricional_id') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        platoId: '',
      }));
      setBusquedaPlato('');
      setPlatoSeleccionadoNombre('');
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Cargar platos desde el API cuando se seleccione un plan nutricional
  useEffect(() => {
    const cargarPlatosPorPlan = async () => {
      // Si hay un solo plan nutricional y no está seleccionado en formData, establecerlo
      let planIdParaUsar = formData.plannutricional_id;
      if (planesNutricionales.length === 1 && (!planIdParaUsar || planIdParaUsar === '')) {
        const planId = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
        planIdParaUsar = String(planId);
        setFormData(prev => ({
          ...prev,
          plannutricional_id: planIdParaUsar
        }));
      }
      
      if (!planIdParaUsar || planIdParaUsar === '' || planIdParaUsar === '-- Seleccionar --') {
        setPlatosPorPlan([]);
        return;
      }

      try {
        const planId = parseInt(planIdParaUsar);
        if (!Number.isInteger(planId) || planId <= 0) {
          setPlatosPorPlan([]);
          return;
        }

        setIsLoading(true);
        const platosData = await platosService.obtenerPorPlanNutricional(planId, true);
        
        // Normalizar la respuesta
        const platosArray = Array.isArray(platosData) 
          ? platosData 
          : (platosData?.items || platosData?.data || []);
        
        setPlatosPorPlan(platosArray);
      } catch (error) {
        setPlatosPorPlan([]);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar los platos del plan nutricional seleccionado.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      } finally {
        setIsLoading(false);
      }
    };

    cargarPlatosPorPlan();
  }, [formData.plannutricional_id, planesNutricionales]);

  // Actualizar el nombre del plato cuando se cargan los platosPorPlan y hay un platoId
  useEffect(() => {
    if (formData.platoId && platosPorPlan.length > 0) {
      const platoId = parseInt(formData.platoId);
      const plato = platosPorPlan.find(
        (p) => (p.id || p.Id || p.ID) === platoId
      );
      
      if (plato) {
        const nombre = plato.descripcion || plato.Descripcion || plato.nombre || plato.Nombre || '';
        // Solo actualizar si no hay nombre establecido o si el nombre actual está vacío
        if (!busquedaPlato || busquedaPlato.trim() === '') {
          setPlatoSeleccionadoNombre(nombre);
          setBusquedaPlato(nombre);
        }
      }
    }
  }, [platosPorPlan, formData.platoId, busquedaPlato]);

  // Filtrar platos según el plan nutricional seleccionado (ahora usa los datos del API)
  const platosFiltrados = useMemo(() => {
    if (!formData.plannutricional_id || formData.plannutricional_id === '' || formData.plannutricional_id === '-- Seleccionar --') {
      // Si no hay plan nutricional seleccionado, no mostrar ningún plato
      return [];
    }
    
    // Usar los platos cargados desde el API
    let platosDisponibles = platosPorPlan;
    
    // Si estamos editando y hay un plato seleccionado que no está en la lista del API,
    // agregarlo para que no se pierda la selección
    if (formData.platoId && vista === 'editar') {
      const platoSeleccionado = platos.find(
        (p) => (p.id || p.Id || p.ID) === parseInt(formData.platoId)
      );
      
      if (platoSeleccionado && !platosDisponibles.find(
        (p) => (p.id || p.Id || p.ID) === (platoSeleccionado.id || platoSeleccionado.Id || platoSeleccionado.ID)
      )) {
        // El plato seleccionado no está en la lista del API, agregarlo
        platosDisponibles = [platoSeleccionado, ...platosDisponibles];
      }
    }
    
    return platosDisponibles;
  }, [platosPorPlan, formData.plannutricional_id, formData.platoId, vista, platos]);

  // Filtrar platos según el texto de búsqueda
  const platosBuscados = useMemo(() => {
    if (!busquedaPlato.trim()) {
      return [];
    }
    
    const termino = busquedaPlato.toLowerCase().trim();
    return platosFiltrados.filter((plato) => {
      const nombre = (plato.descripcion || plato.Descripcion || plato.nombre || plato.Nombre || '').toLowerCase();
      const codigo = (plato.codigo || plato.Codigo || '').toString().toLowerCase();
      return nombre.includes(termino) || codigo.includes(termino);
    });
  }, [busquedaPlato, platosFiltrados]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.plato-buscador-container')) {
        setMostrarDropdownPlato(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Actualizar el nombre del plato seleccionado cuando cambia formData.platoId (solo al seleccionar/cargar, no al escribir)
  useEffect(() => {
    if (formData.platoId) {
      const platoId = parseInt(formData.platoId);
      
      // Buscar el plato en múltiples fuentes: platosPorPlan, platosFiltrados, y platos
      let plato = platosPorPlan.find(
        (p) => (p.id || p.Id || p.ID) === platoId
      );
      
      if (!plato) {
        plato = platosFiltrados.find(
          (p) => (p.id || p.Id || p.ID) === platoId
        );
      }
      
      if (!plato) {
        plato = platos.find(
          (p) => (p.id || p.Id || p.ID) === platoId
        );
      }
      
      if (plato) {
        const nombre = plato.descripcion || plato.Descripcion || plato.nombre || plato.Nombre || '';
        setPlatoSeleccionadoNombre(nombre);
        setBusquedaPlato(nombre);
      }
    } else {
      setPlatoSeleccionadoNombre('');
      setBusquedaPlato('');
    }
  }, [formData.platoId, platos, platosPorPlan, platosFiltrados]);

  // Limpiar búsqueda cuando cambia el plan nutricional
  useEffect(() => {
    // No limpiar si estamos cargando para editar
    if (cargandoParaEditarRef.current) {
      return;
    }
    
    const planActual = formData.plannutricional_id;
    const planAnterior = planNutricionalAnteriorRef.current;
    
    // Si no hay plan seleccionado o es el placeholder, limpiar
    if (!planActual || planActual === '' || planActual === '-- Seleccionar --') {
      // Solo limpiar si no estamos en modo editar con un platoId ya establecido
      if (vista !== 'editar' || !formData.platoId) {
        setBusquedaPlato('');
        setPlatoSeleccionadoNombre('');
        setFormData(prev => ({ ...prev, platoId: '' }));
      }
      planNutricionalAnteriorRef.current = planActual;
      return;
    }
    
    // Si el plan cambió (no es la primera carga) y NO estamos en modo editar con un plato ya seleccionado
    // Solo limpiar si el usuario cambió el plan manualmente, no cuando se carga para editar
    if (planAnterior !== null && planAnterior !== planActual) {
      // Si estamos en modo editar y hay un platoId, no limpiar (puede ser que se esté cargando el menú)
      if (vista !== 'editar' || !formData.platoId) {
        setBusquedaPlato('');
        setPlatoSeleccionadoNombre('');
        setFormData(prev => ({ ...prev, platoId: '' }));
      }
    }
    
    // Actualizar la referencia
    planNutricionalAnteriorRef.current = planActual;
  }, [formData.plannutricional_id, vista, formData.platoId]);

  const handleFiltroChange = (value) => {
    setFiltro(value);
    setCurrentPage(1);
  };

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    setFechaSeleccionada(nuevaFecha);
    setCurrentPage(1);
    // Recargar menús con la nueva fecha
    cargarMenus(1, filtro, nuevaFecha);
  };

  // Función auxiliar para obtener datos de un menú según las columnas seleccionadas (reservada para uso futuro)
  // eslint-disable-next-line no-unused-vars
  const obtenerDatosMenu = (menu, columnas) => {
    const datos = [];
    const headers = [];

    if (columnas.plato) {
      headers.push('Plato');
      const platoNombre =
        menu.platoNombre ||
        menu.PlatoNombre ||
        menu.plato_nombre ||
        menu.plato?.descripcion ||
        menu.Plato?.Descripcion ||
        '-';
      datos.push(platoNombre);
    }

    if (columnas.plannutricional) {
      headers.push('Plan Nutricional');
      const planNombre =
        menu.PlanNutricionalNombre ||
        menu.plannutricionalNombre ||
        menu.PlannutricionalNombre ||
        menu.plan_nutricional_nombre ||
        planesNutricionales.find((p) => (p.id || p.Id) === (menu.PlanNutricionalId || menu.planNutricionalId || menu.plannutricional_id || menu.Plannutricional_id))?.nombre ||
        planesNutricionales.find((p) => (p.id || p.Id) === (menu.PlanNutricionalId || menu.planNutricionalId || menu.plannutricional_id || menu.Plannutricional_id))?.Nombre ||
        menu.planNutricional?.nombre ||
        menu.PlanNutricional?.Nombre ||
        '-';
      datos.push(planNombre);
    }

    if (columnas.turno) {
      headers.push('Turno');
      const turnoNombre =
        menu.turnoNombre ||
        menu.TurnoNombre ||
        menu.turno_nombre ||
        turnos.find((t) => (t.id || t.Id) === (menu.turnoId || menu.TurnoId))?.nombre ||
        turnos.find((t) => (t.id || t.Id) === (menu.turnoId || menu.TurnoId))?.Nombre ||
        menu.turno?.nombre ||
        menu.Turno?.Nombre ||
        '-';
      datos.push(turnoNombre);
    }

    if (columnas.jerarquia) {
      headers.push('Jerarquía');
      const jerarquiaNombre =
        menu.jerarquiaNombre ||
        menu.JerarquiaNombre ||
        menu.jerarquia_nombre ||
        jerarquias.find((j) => (j.id || j.Id) === (menu.jerarquiaId || menu.JerarquiaId))?.nombre ||
        jerarquias.find((j) => (j.id || j.Id) === (menu.jerarquiaId || menu.JerarquiaId))?.Nombre ||
        menu.jerarquia?.nombre ||
        menu.Jerarquia?.Nombre ||
        '-';
      datos.push(jerarquiaNombre);
    }

    if (columnas.proyecto) {
      headers.push('Proyecto');
      const proyectoNombre =
        menu.proyectoNombre ||
        menu.ProyectoNombre ||
        menu.proyecto_nombre ||
        proyectos.find((p) => (p.id || p.Id) === (menu.proyectoId || menu.ProyectoId))?.nombre ||
        proyectos.find((p) => (p.id || p.Id) === (menu.proyectoId || menu.ProyectoId))?.Nombre ||
        menu.proyecto?.nombre ||
        menu.Proyecto?.Nombre ||
        '-';
      datos.push(proyectoNombre);
    }

    if (columnas.centroCosto) {
      headers.push('Centro de Costo');
      const centroNombre =
        menu.centroCostoNombre ||
        menu.CentroCostoNombre ||
        menu.centro_costo_nombre ||
        centrosDeCosto.find((c) => (c.id || c.Id) === (menu.centroCostoId || menu.CentroCostoId))?.nombre ||
        centrosDeCosto.find((c) => (c.id || c.Id) === (menu.centroCostoId || menu.CentroCostoId))?.Nombre ||
        menu.centroCosto?.nombre ||
        menu.CentroCosto?.Nombre ||
        '-';
      datos.push(centroNombre);
    }

    if (columnas.planta) {
      headers.push('Planta');
      const plantaNombre =
        menu.plantaNombre ||
        menu.PlantaNombre ||
        menu.planta_nombre ||
        plantas.find((p) => (p.id || p.Id) === (menu.plantaId || menu.PlantaId))?.nombre ||
        plantas.find((p) => (p.id || p.Id) === (menu.plantaId || menu.PlantaId))?.Nombre ||
        menu.planta?.nombre ||
        menu.Planta?.Nombre ||
        '-';
      datos.push(plantaNombre);
    }

    if (columnas.cantidad) {
      headers.push('Cantidad');
      const cantidad = menu.cantidad || menu.Cantidad || menu.Cant || 0;
      datos.push(cantidad.toString());
    }

    if (columnas.comandadas) {
      headers.push('Asignados');
      const comandadas = menu.Comandas || menu.comandas || menu.comandadas || 0;
      datos.push(comandadas.toString());
    }

    if (columnas.fecha) {
      headers.push('Fecha');
      const fechaMenu = menu.fecha 
        ? (menu.fecha.split('T')[0] || menu.fecha.split(' ')[0])
        : '-';
      datos.push(fechaMenu);
    }

    if (columnas.estado) {
      headers.push('Estado');
      const activo = menu.activo !== undefined ? menu.activo : menu.Activo !== undefined ? menu.Activo : true;
      datos.push(activo ? 'Activo' : 'Inactivo');
    }

    return { headers, datos };
  };

  // Función para filtrar menús según los filtros de impresión (reservada para uso futuro)
  // eslint-disable-next-line no-unused-vars
  const filtrarMenusParaImpresion = (menusList, filtros) => {
    return menusList.filter(menu => {
      // Filtro por fecha
      if (filtros.fecha) {
        const fechaMenu = menu.fecha ? (menu.fecha.split('T')[0] || menu.fecha.split(' ')[0]) : '';
        if (fechaMenu !== filtros.fecha) return false;
      }

      // Filtro por turno
      if (filtros.turnoId) {
        const turnoId = menu.turnoId || menu.TurnoId;
        if (String(turnoId) !== String(filtros.turnoId)) return false;
      }

      // Filtro por plan nutricional
      if (filtros.planNutricionalId) {
        const planId = menu.PlanNutricionalId || menu.planNutricionalId || menu.plannutricional_id || menu.Plannutricional_id;
        if (String(planId) !== String(filtros.planNutricionalId)) return false;
      }

      // Filtro por jerarquía
      if (filtros.jerarquiaId) {
        const jerarquiaId = menu.jerarquiaId || menu.JerarquiaId;
        if (String(jerarquiaId) !== String(filtros.jerarquiaId)) return false;
      }

      // Filtro por proyecto
      if (filtros.proyectoId) {
        const proyectoId = menu.proyectoId || menu.ProyectoId;
        if (String(proyectoId) !== String(filtros.proyectoId)) return false;
      }

      // Filtro por centro de costo
      if (filtros.centroCostoId) {
        const centroId = menu.centroCostoId || menu.CentroCostoId;
        if (String(centroId) !== String(filtros.centroCostoId)) return false;
      }

      // Filtro por planta
      if (filtros.plantaId) {
        const plantaId = menu.plantaId || menu.PlantaId;
        if (String(plantaId) !== String(filtros.plantaId)) return false;
      }

      // Filtro por estado
      if (filtros.activo !== null) {
        const activo = menu.activo !== undefined ? menu.activo : menu.Activo !== undefined ? menu.Activo : true;
        if (activo !== filtros.activo) return false;
      }

      return true;
    });
  };

  const handleExportarPDF = async (columnas = null, filtros = null) => {
    const cols = columnas || columnasSeleccionadas;
    const filtrosAplicar = filtros || filtrosImpresion;
    
    try {
      setIsLoading(true);
      
      // Mapear columnas seleccionadas al formato del endpoint
      const columnasRequest = {
        incluirPlato: cols.plato || false,
        incluirTurno: cols.turno || false,
        incluirProyecto: cols.proyecto || false,
        incluirPlanta: cols.planta || false,
        incluirFecha: cols.fecha || false,
        incluirPlanNutricional: cols.plannutricional || false,
        incluirJerarquia: cols.jerarquia || false,
        incluirCentroCosto: cols.centroCosto || false,
        incluirCantidad: cols.cantidad || false,
        incluirComandadas: cols.comandadas || false,
        incluirEstado: cols.estado || false,
      };

      // Mapear filtros al formato del endpoint
      const filtrosRequest = {
        fecha: filtrosAplicar.fecha || null,
        turnoId: filtrosAplicar.turnoId ? parseInt(filtrosAplicar.turnoId) : null,
        planNutricionalId: filtrosAplicar.planNutricionalId ? parseInt(filtrosAplicar.planNutricionalId) : null,
        jerarquiaId: filtrosAplicar.jerarquiaId ? parseInt(filtrosAplicar.jerarquiaId) : null,
        proyectoId: filtrosAplicar.proyectoId ? parseInt(filtrosAplicar.proyectoId) : null,
        centroCostoId: filtrosAplicar.centroCostoId ? parseInt(filtrosAplicar.centroCostoId) : null,
        plantaId: filtrosAplicar.plantaId ? parseInt(filtrosAplicar.plantaId) : null,
        estado: filtrosAplicar.activo === null ? null : (filtrosAplicar.activo ? 'Activo' : 'Inactivo'),
      };

      // Llamar al endpoint de impresión
      const requestData = {
        ...columnasRequest,
        ...filtrosRequest,
      };
      
      const menusFiltrados = await menuService.getImpresion(requestData);
      
      if (!menusFiltrados || menusFiltrados.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay menús que coincidan con los filtros seleccionados',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      const doc = new jsPDF();

      // Logo removido - no se muestra icono ni palabra SmartLunch
      let startY = 15; // Posición inicial del contenido

      // Título centrado debajo del logo
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(14);
      const titulo = 'Listado de Menú del Día';
      const tituloWidth = doc.getTextWidth(titulo);
      const tituloX = (pageWidth - tituloWidth) / 2; // Centrado
      doc.text(titulo, tituloX, startY);

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
      const fechaX = (pageWidth - fechaWidth) / 2; // Centrado
      doc.text(fechaTexto, fechaX, startY + 7);

      // Obtener headers y datos desde la respuesta del API
      const headers = [];
      const tableData = [];
      
      // Mapeo de nombres de columnas del API (PascalCase) a labels
      const columnLabels = {
        Plato: 'Plato',
        Turno: 'Turno',
        Proyecto: 'Proyecto',
        Planta: 'Planta',
        Fecha: 'Fecha',
        PlanNutricional: 'Plan Nutricional',
        Jerarquia: 'Jerarquía',
        CentroCosto: 'Centro de Costo',
        Cantidad: 'Cantidad',
        Comandadas: 'Asignados',
        Estado: 'Estado',
        // También soportar camelCase por si acaso
        plato: 'Plato',
        turno: 'Turno',
        proyecto: 'Proyecto',
        planta: 'Planta',
        fecha: 'Fecha',
        planNutricional: 'Plan Nutricional',
        jerarquia: 'Jerarquía',
        centroCosto: 'Centro de Costo',
        cantidad: 'Cantidad',
        comandadas: 'Asignados',
        estado: 'Estado',
      };

      // Construir headers basado en las columnas que tienen datos
      if (menusFiltrados.length > 0) {
        const primerMenu = menusFiltrados[0];
        Object.keys(primerMenu).forEach(key => {
          if (primerMenu[key] !== null && columnLabels[key]) {
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

      menusFiltrados.forEach((menu) => {
        const fila = [];
        columnasOrdenadas.forEach(key => {
          // Buscar la propiedad en el objeto (puede ser PascalCase o camelCase)
          const valor = menu[key] || menu[key.charAt(0).toUpperCase() + key.slice(1)] || null;
          fila.push(valor !== null ? String(valor) : '-');
        });
        tableData.push(fila);
      });

      // Calcular la posición inicial de la tabla (debajo del título y fecha)
      const tableStartY = startY + 15;
      
      doc.autoTable({
        startY: tableStartY,
        head: [headers],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64] },
      });

      doc.save('menus-del-dia.pdf');
      
      if (columnas || filtros) {
        setMostrarModalImpresion(false);
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al generar el PDF',
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
        incluirPlato: cols.plato || false,
        incluirTurno: cols.turno || false,
        incluirProyecto: cols.proyecto || false,
        incluirPlanta: cols.planta || false,
        incluirFecha: cols.fecha || false,
        incluirPlanNutricional: cols.plannutricional || false,
        incluirJerarquia: cols.jerarquia || false,
        incluirCentroCosto: cols.centroCosto || false,
        incluirCantidad: cols.cantidad || false,
        incluirComandadas: cols.comandadas || false,
        incluirEstado: cols.estado || false,
      };

      // Mapear filtros al formato del endpoint
      const filtrosRequest = {
        fecha: filtrosAplicar.fecha || null,
        turnoId: filtrosAplicar.turnoId ? parseInt(filtrosAplicar.turnoId) : null,
        planNutricionalId: filtrosAplicar.planNutricionalId ? parseInt(filtrosAplicar.planNutricionalId) : null,
        jerarquiaId: filtrosAplicar.jerarquiaId ? parseInt(filtrosAplicar.jerarquiaId) : null,
        proyectoId: filtrosAplicar.proyectoId ? parseInt(filtrosAplicar.proyectoId) : null,
        centroCostoId: filtrosAplicar.centroCostoId ? parseInt(filtrosAplicar.centroCostoId) : null,
        plantaId: filtrosAplicar.plantaId ? parseInt(filtrosAplicar.plantaId) : null,
        estado: filtrosAplicar.activo === null ? null : (filtrosAplicar.activo ? 'Activo' : 'Inactivo'),
      };

      // Llamar al endpoint de impresión
      const requestData = {
        ...columnasRequest,
        ...filtrosRequest,
      };
      
      const menusFiltrados = await menuService.getImpresion(requestData);
      
      if (!menusFiltrados || menusFiltrados.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay menús que coincidan con los filtros seleccionados',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      // Mapeo de nombres de columnas del API (PascalCase) a labels
      const columnLabels = {
        Plato: 'Plato',
        Turno: 'Turno',
        Proyecto: 'Proyecto',
        Planta: 'Planta',
        Fecha: 'Fecha',
        PlanNutricional: 'Plan Nutricional',
        Jerarquia: 'Jerarquía',
        CentroCosto: 'Centro de Costo',
        Cantidad: 'Cantidad',
        Comandadas: 'Asignados',
        Estado: 'Estado',
        // También soportar camelCase por si acaso
        plato: 'Plato',
        turno: 'Turno',
        proyecto: 'Proyecto',
        planta: 'Planta',
        fecha: 'Fecha',
        planNutricional: 'Plan Nutricional',
        jerarquia: 'Jerarquía',
        centroCosto: 'Centro de Costo',
        cantidad: 'Cantidad',
        comandadas: 'Asignados',
        estado: 'Estado',
      };

      // Construir headers basado en las columnas que tienen datos
      const headers = [];
      if (menusFiltrados.length > 0) {
        const primerMenu = menusFiltrados[0];
        Object.keys(primerMenu).forEach(key => {
          if (primerMenu[key] !== null && columnLabels[key]) {
            headers.push(columnLabels[key]);
          }
        });
      }

      // Construir datos de la hoja manteniendo el orden de los headers
      const columnasOrdenadas = headers.map(header => {
        // Encontrar la clave que corresponde a este header
        for (const [key, label] of Object.entries(columnLabels)) {
          if (label === header) {
            return key;
          }
        }
        return null;
      }).filter(key => key !== null);

      const worksheetData = menusFiltrados.map((menu) => {
        const fila = [];
        columnasOrdenadas.forEach(key => {
          // Buscar la propiedad en el objeto (puede ser PascalCase o camelCase)
          const valor = menu[key] || menu[key.charAt(0).toUpperCase() + key.slice(1)] || null;
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
        ['Listado de Menú del Día'], // Título
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Menús del Día');
      XLSX.writeFile(workbook, 'menus-del-dia.xlsx');
      
      if (columnas || filtros) {
        setMostrarModalImpresion(false);
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al generar el archivo Excel',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleExportarPDFOriginal = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Listado de Menús del Día', 14, 15);

      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.setFontSize(10);
      doc.text(`Generado el: ${fecha}`, 14, 22);

      const tableData = menus.map((menu) => {
        const platoNombre =
          menu.platoNombre ||
          menu.PlatoNombre ||
          menu.plato_nombre ||
          menu.plato?.descripcion ||
          menu.Plato?.Descripcion ||
          '-';

        const turnoNombre =
          menu.turnoNombre ||
          menu.TurnoNombre ||
          menu.turno_nombre ||
          turnos.find((t) => (t.id || t.Id) === (menu.turnoId || menu.TurnoId))?.nombre ||
          turnos.find((t) => (t.id || t.Id) === (menu.turnoId || menu.TurnoId))?.Nombre ||
          menu.turno?.nombre ||
          menu.Turno?.Nombre ||
          '-';

        const jerarquiaNombre =
          menu.jerarquiaNombre ||
          menu.JerarquiaNombre ||
          menu.jerarquia_nombre ||
          jerarquias.find((j) => (j.id || j.Id) === (menu.jerarquiaId || menu.JerarquiaId))?.nombre ||
          jerarquias.find((j) => (j.id || j.Id) === (menu.jerarquiaId || menu.JerarquiaId))?.Nombre ||
          menu.jerarquia?.nombre ||
          menu.Jerarquia?.Nombre ||
          '-';

        const planNombre =
          menu.plannutricionalNombre ||
          menu.PlannutricionalNombre ||
          menu.plan_nutricional_nombre ||
          planesNutricionales.find((p) => (p.id || p.Id) === (menu.plannutricional_id || menu.Plannutricional_id))?.nombre ||
          planesNutricionales.find((p) => (p.id || p.Id) === (menu.plannutricional_id || menu.Plannutricional_id))?.Nombre ||
          menu.planNutricional?.nombre ||
          menu.PlanNutricional?.Nombre ||
          '-';

        const proyectoNombre =
          menu.proyectoNombre ||
          menu.ProyectoNombre ||
          menu.proyecto_nombre ||
          proyectos.find((p) => (p.id || p.Id) === (menu.proyectoId || menu.ProyectoId))?.nombre ||
          proyectos.find((p) => (p.id || p.Id) === (menu.proyectoId || menu.ProyectoId))?.Nombre ||
          menu.proyecto?.nombre ||
          menu.Proyecto?.Nombre ||
          '-';

        const centroNombre =
          menu.centroCostoNombre ||
          menu.CentroCostoNombre ||
          menu.centro_costo_nombre ||
          centrosDeCosto.find((c) => (c.id || c.Id) === (menu.centroCostoId || menu.CentroCostoId))?.nombre ||
          centrosDeCosto.find((c) => (c.id || c.Id) === (menu.centroCostoId || menu.CentroCostoId))?.Nombre ||
          menu.centroCosto?.nombre ||
          menu.CentroCosto?.Nombre ||
          '-';

        const plantaNombre =
          menu.plantaNombre ||
          menu.PlantaNombre ||
          menu.planta_nombre ||
          plantas.find((p) => (p.id || p.Id) === (menu.plantaId || menu.PlantaId))?.nombre ||
          plantas.find((p) => (p.id || p.Id) === (menu.plantaId || menu.PlantaId))?.Nombre ||
          menu.planta?.nombre ||
          menu.Planta?.Nombre ||
          '-';

        const cantidad = menu.cantidad || menu.Cantidad || menu.Cant || 0;
        const fechaMenu = menu.fecha 
          ? (menu.fecha.split('T')[0] || menu.fecha.split(' ')[0])
          : '-';
        const activo = menu.activo !== undefined ? menu.activo : menu.Activo !== undefined ? menu.Activo : true;

        return [
          platoNombre,
          turnoNombre,
          jerarquiaNombre,
          planNombre,
          proyectoNombre,
          centroNombre,
          plantaNombre,
          cantidad.toString(),
          fechaMenu,
          activo ? 'Activo' : 'Inactivo',
        ];
      });

      doc.autoTable({
        startY: 28,
        head: [['Plato', 'Turno', 'Jerarquía', 'Plan Nutricional', 'Proyecto', 'Centro de Costo', 'Planta', 'Cantidad', 'Fecha', 'Estado']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 58, 64] },
      });

      doc.save('menus-del-dia.pdf');
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

  // eslint-disable-next-line no-unused-vars
  const handleExportarExcelOriginal = () => {
    try {
      const worksheetData = [
        ['Plato', 'Turno', 'Jerarquía', 'Plan Nutricional', 'Proyecto', 'Centro de Costo', 'Planta', 'Cantidad', 'Fecha', 'Estado'],
        ...menus.map((menu) => {
          const platoNombre =
            menu.platoNombre ||
            menu.PlatoNombre ||
            menu.plato_nombre ||
            menu.plato?.descripcion ||
            menu.Plato?.Descripcion ||
            '-';

          const turnoNombre =
            menu.turnoNombre ||
            menu.TurnoNombre ||
            menu.turno_nombre ||
            turnos.find((t) => (t.id || t.Id) === (menu.turnoId || menu.TurnoId))?.nombre ||
            turnos.find((t) => (t.id || t.Id) === (menu.turnoId || menu.TurnoId))?.Nombre ||
            menu.turno?.nombre ||
            menu.Turno?.Nombre ||
            '-';

          const jerarquiaNombre =
            menu.jerarquiaNombre ||
            menu.JerarquiaNombre ||
            menu.jerarquia_nombre ||
            jerarquias.find((j) => (j.id || j.Id) === (menu.jerarquiaId || menu.JerarquiaId))?.nombre ||
            jerarquias.find((j) => (j.id || j.Id) === (menu.jerarquiaId || menu.JerarquiaId))?.Nombre ||
            menu.jerarquia?.nombre ||
            menu.Jerarquia?.Nombre ||
            '-';

          const planNombre =
            menu.plannutricionalNombre ||
            menu.PlannutricionalNombre ||
            menu.plan_nutricional_nombre ||
            planesNutricionales.find((p) => (p.id || p.Id) === (menu.plannutricional_id || menu.Plannutricional_id))?.nombre ||
            planesNutricionales.find((p) => (p.id || p.Id) === (menu.plannutricional_id || menu.Plannutricional_id))?.Nombre ||
            menu.planNutricional?.nombre ||
            menu.PlanNutricional?.Nombre ||
            '-';

          const proyectoNombre =
            menu.proyectoNombre ||
            menu.ProyectoNombre ||
            menu.proyecto_nombre ||
            proyectos.find((p) => (p.id || p.Id) === (menu.proyectoId || menu.ProyectoId))?.nombre ||
            proyectos.find((p) => (p.id || p.Id) === (menu.proyectoId || menu.ProyectoId))?.Nombre ||
            menu.proyecto?.nombre ||
            menu.Proyecto?.Nombre ||
            '-';

          const centroNombre =
            menu.centroCostoNombre ||
            menu.CentroCostoNombre ||
            menu.centro_costo_nombre ||
            centrosDeCosto.find((c) => (c.id || c.Id) === (menu.centroCostoId || menu.CentroCostoId))?.nombre ||
            centrosDeCosto.find((c) => (c.id || c.Id) === (menu.centroCostoId || menu.CentroCostoId))?.Nombre ||
            menu.centroCosto?.nombre ||
            menu.CentroCosto?.Nombre ||
            '-';

          const plantaNombre =
            menu.plantaNombre ||
            menu.PlantaNombre ||
            menu.planta_nombre ||
            plantas.find((p) => (p.id || p.Id) === (menu.plantaId || menu.PlantaId))?.nombre ||
            plantas.find((p) => (p.id || p.Id) === (menu.plantaId || menu.PlantaId))?.Nombre ||
            menu.planta?.nombre ||
            menu.Planta?.Nombre ||
            '-';

          const cantidad = menu.cantidad || menu.Cantidad || menu.Cant || 0;
          const fechaMenu = menu.fecha 
            ? (menu.fecha.split('T')[0] || menu.fecha.split(' ')[0])
            : '-';
          const activo = menu.activo !== undefined ? menu.activo : menu.Activo !== undefined ? menu.Activo : true;

          return [
            platoNombre,
            turnoNombre,
            jerarquiaNombre,
            planNombre,
            proyectoNombre,
            centroNombre,
            plantaNombre,
            cantidad.toString(),
            fechaMenu,
            activo ? 'Activo' : 'Inactivo',
          ];
        }),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Menús del Día');
      XLSX.writeFile(workbook, 'menus-del-dia.xlsx');
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

  const handleCrearMenu = () => {
    setVista('crear');
    
    // Todos los select deben comenzar con "-- Seleccionar --" (valor vacío)
    const nuevoFormData = {
      id: null,
      platoId: '',
      turnoId: '',
      jerarquiaId: '',
      plannutricional_id: '',
      proyectoId: '',
      centroCostoId: '',
      plantaId: '',
      cantidad: '1',
      comandadas: 0,
      fecha: obtenerFechaLocal(),
      activo: true,
    };
    
    setFormData(nuevoFormData);
    // Limpiar también el buscador de plato
    setBusquedaPlato('');
    setPlatoSeleccionadoNombre('');
  };

  const handleEditarMenu = async (menu) => {
    try {
      setIsLoading(true);
      cargandoParaEditarRef.current = true; // Marcar que estamos cargando para editar
      const menuCompleto = await menuService.getPorId(menu.id || menu.Id || menu.ID);
      
      // Obtener el plan nutricional ID - PlanNutricionalId es el campo que trae el DTO
      let planNutricionalId = '';
      
      if (menuCompleto.PlanNutricionalId !== undefined && menuCompleto.PlanNutricionalId !== null) {
        planNutricionalId = menuCompleto.PlanNutricionalId;
      } else if (menuCompleto.planNutricionalId !== undefined && menuCompleto.planNutricionalId !== null) {
        planNutricionalId = menuCompleto.planNutricionalId;
      } else if (menuCompleto.plannutricional_id !== undefined && menuCompleto.plannutricional_id !== null) {
        planNutricionalId = menuCompleto.plannutricional_id;
      } else if (menuCompleto.Plannutricional_id !== undefined && menuCompleto.Plannutricional_id !== null) {
        planNutricionalId = menuCompleto.Plannutricional_id;
      } else if (menuCompleto.plan_nutricional_id !== undefined && menuCompleto.plan_nutricional_id !== null) {
        planNutricionalId = menuCompleto.plan_nutricional_id;
      } else if (menuCompleto.planNutricional?.id !== undefined && menuCompleto.planNutricional?.id !== null) {
        planNutricionalId = menuCompleto.planNutricional.id;
      } else if (menuCompleto.PlanNutricional?.Id !== undefined && menuCompleto.PlanNutricional?.Id !== null) {
        planNutricionalId = menuCompleto.PlanNutricional.Id;
      } else if (menuCompleto.planNutricional?.ID !== undefined && menuCompleto.planNutricional?.ID !== null) {
        planNutricionalId = menuCompleto.planNutricional.ID;
      }
      
      // Convertir a string y validar que exista en planesNutricionales
      if (planNutricionalId !== '' && planNutricionalId !== null && planNutricionalId !== undefined) {
        // Convertir a número primero para normalizar
        const planIdNum = parseInt(planNutricionalId);
        if (!isNaN(planIdNum) && planIdNum > 0) {
          // Buscar el plan en la lista
          const planEncontrado = planesNutricionales.find(
            (p) => {
              const pId = p.id || p.Id || p.ID;
              return pId === planIdNum || parseInt(pId) === planIdNum;
            }
          );
          
          if (planEncontrado) {
            planNutricionalId = String(planEncontrado.id || planEncontrado.Id || planEncontrado.ID);

          } else {

            planNutricionalId = '';
          }
        } else {

          planNutricionalId = '';
        }
      } else {

        planNutricionalId = '';
      }
      
      // Obtener el platoId y el nombre del plato si está disponible
      const platoId = menuCompleto.PlatoId || menuCompleto.platoId || menuCompleto.plato_id || '';
      // PlatoNombre es la propiedad que trae el nombre del plato desde el API
      const platoNombre = menuCompleto.PlatoNombre || 
                          menuCompleto.platoNombre || 
                          menuCompleto.plato_nombre ||
                          menuCompleto.plato?.descripcion ||
                          menuCompleto.Plato?.Descripcion ||
                          menuCompleto.plato?.nombre ||
                          menuCompleto.Plato?.Nombre ||
                          '';
      
      // Establecer el nombre del plato ANTES de establecer formData
      if (platoNombre) {
        setPlatoSeleccionadoNombre(platoNombre);
        setBusquedaPlato(platoNombre);
      }
      
      // Comandadas/asignados: del API o de la fila de la tabla por si el getPorId no lo trae
      const comandadas = Number(
        menuCompleto.Comandas ?? menuCompleto.comandas ?? menuCompleto.comandadas ??
        menu?.Comandas ?? menu?.comandas ?? menu?.comandadas ?? 0
      ) || 0;
      setFormData({
        id: menuCompleto.id || menuCompleto.Id || menuCompleto.ID,
        platoId: platoId ? String(platoId) : '',
        turnoId: menuCompleto.turnoId || menuCompleto.TurnoId || menuCompleto.turno_id || '',
        jerarquiaId: menuCompleto.jerarquiaId || menuCompleto.JerarquiaId || menuCompleto.jerarquia_id || '',
        plannutricional_id: planNutricionalId,
        proyectoId: menuCompleto.proyectoId || menuCompleto.ProyectoId || menuCompleto.proyecto_id || '',
        centroCostoId: menuCompleto.centroCostoId || menuCompleto.CentroCostoId || menuCompleto.centro_costo_id || '',
        plantaId: menuCompleto.plantaId || menuCompleto.PlantaId || menuCompleto.planta_id || '',
        cantidad: menuCompleto.cantidad || menuCompleto.Cantidad || menuCompleto.Cant || '',
        comandadas,
        fecha: menuCompleto.fecha 
          ? (menuCompleto.fecha.split('T')[0] || menuCompleto.fecha.split(' ')[0])
          : obtenerFechaLocal(),
        activo: menuCompleto.activo !== undefined ? menuCompleto.activo : menuCompleto.Activo !== undefined ? menuCompleto.Activo : true,
      });
      
      setVista('editar');
      
      // Establecer el nombre del plato después de cambiar la vista como respaldo
      setTimeout(() => {
        if (platoNombre) {
          setPlatoSeleccionadoNombre(platoNombre);
          setBusquedaPlato(platoNombre);
        } else if (platoId) {
          // Si no hay nombre pero sí hay platoId, intentar buscarlo en las listas disponibles
          const platoIdNum = parseInt(platoId);
          let plato = platos.find((p) => (p.id || p.Id || p.ID) === platoIdNum);
          
          if (!plato && platosPorPlan.length > 0) {
            plato = platosPorPlan.find((p) => (p.id || p.Id || p.ID) === platoIdNum);
          }
          
          if (plato) {
            const nombre = plato.descripcion || plato.Descripcion || plato.nombre || plato.Nombre || '';
            setPlatoSeleccionadoNombre(nombre);
            setBusquedaPlato(nombre);
          }
        }
        // Marcar que terminamos de cargar para editar
        setTimeout(() => {
          cargandoParaEditarRef.current = false;
        }, 500);
      }, 300);
    } catch (error) {
      cargandoParaEditarRef.current = false; // Resetear en caso de error
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al cargar el menú del día',
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
    setVista('lista');
    cargarMenus(currentPage, filtro, fechaSeleccionada);
  };

  const handleGuardar = async () => {
    try {
      // Asignar automáticamente valores únicos si hay un solo valor disponible
      const datosActualizados = { ...formData };
      
      // Plan nutricional
      if (!datosActualizados.plannutricional_id && planesNutricionales.length === 1) {
        const planId = planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID;
        datosActualizados.plannutricional_id = String(planId);
      }
      
      // Proyecto
      if (!datosActualizados.proyectoId && proyectos.length === 1) {
        const proyectoId = proyectos[0].id || proyectos[0].Id || proyectos[0].ID;
        datosActualizados.proyectoId = String(proyectoId);
      }
      
      // Centro de costo
      if (!datosActualizados.centroCostoId && centrosDeCosto.length === 1) {
        const centroId = centrosDeCosto[0].id || centrosDeCosto[0].Id || centrosDeCosto[0].ID;
        datosActualizados.centroCostoId = String(centroId);
      }
      
      // Planta
      if (!datosActualizados.plantaId && plantas.length === 1) {
        const plantaId = plantas[0].id || plantas[0].Id || plantas[0].ID;
        datosActualizados.plantaId = String(plantaId);
      }
      
      // Actualizar formData con los valores asignados automáticamente
      setFormData(datosActualizados);
      
      // Validaciones
      if (!datosActualizados.plannutricional_id) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar un plan nutricional',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!datosActualizados.platoId) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar un plato',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!datosActualizados.turnoId) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar un turno',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      const cantidadNum = parseFloat(datosActualizados.cantidad);
      const comandadasNum = Number(datosActualizados.comandadas ?? 0) || 0;
      if (datosActualizados.cantidad === '' || datosActualizados.cantidad === null || datosActualizados.cantidad === undefined || isNaN(cantidadNum) || cantidadNum < 0) {
        Swal.fire({
          title: 'Error',
          text: 'La cantidad no es válida',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }
      if (comandadasNum > 0 && cantidadNum < comandadasNum) {
        Swal.fire({
          title: 'Error',
          text: `No puede tener cantidad ${cantidadNum} si ya hay ${comandadasNum} plato(s) asignado(s). La cantidad debe ser al menos ${comandadasNum}.`,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }
      if (comandadasNum > 0 && cantidadNum === 0) {
        Swal.fire({
          title: 'Error',
          text: `No puede tener cantidad 0 si ya hay ${comandadasNum} plato(s) asignado(s). La cantidad debe ser al menos ${comandadasNum}.`,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }
      if (comandadasNum === 0 && cantidadNum <= 0) {
        Swal.fire({
          title: 'Error',
          text: 'La cantidad debe ser mayor a 0',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!datosActualizados.fecha) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar una fecha válida',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!datosActualizados.jerarquiaId) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar una jerarquía',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!datosActualizados.proyectoId) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar un proyecto',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!datosActualizados.centroCostoId) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar un centro de costo',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!datosActualizados.plantaId) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar una planta',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      setIsLoading(true);

      const menuData = {
        PlatoId: parseInt(datosActualizados.platoId),
        TurnoId: parseInt(datosActualizados.turnoId),
        JerarquiaId: datosActualizados.jerarquiaId ? parseInt(datosActualizados.jerarquiaId) : null,
        Plannutricional_id: datosActualizados.plannutricional_id ? parseInt(datosActualizados.plannutricional_id) : null,
        ProyectoId: datosActualizados.proyectoId ? parseInt(datosActualizados.proyectoId) : null,
        CentroCostoId: datosActualizados.centroCostoId ? parseInt(datosActualizados.centroCostoId) : null,
        PlantaId: datosActualizados.plantaId ? parseInt(datosActualizados.plantaId) : null,
        Cantidad: parseInt(datosActualizados.cantidad),
        Fecha: datosActualizados.fecha,
      };

      if (vista === 'editar') {
        menuData.Id = parseInt(formData.id);
        await menuService.actualizarMenu(menuData);
        Swal.fire({
          title: 'Éxito',
          text: 'Menú del día actualizado correctamente',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        await menuService.crearMenu(menuData);
        Swal.fire({
          title: 'Éxito',
          text: 'Menú del día creado correctamente',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      }

      await cargarMenus(currentPage, filtro);
      handleVolverALista();
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al guardar el menú del día',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivarMenu = async (menuId) => {
    try {
      setIsLoading(true);
      await menuService.activarMenu(menuId);
      Swal.fire({
        title: 'Éxito',
        text: 'Menú del día activado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      await cargarMenus(currentPage, filtro);
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al activar el menú del día',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const esMenuInactivo = (menu) => {
    return menu.activo === false || menu.Activo === false;
  };

  // ===================== render =====================

  if (vista === 'lista') {
    return (
      <div className="container-fluid" style={{ padding: 0 }}>
        {/* Barra negra título */}
        <div className="page-title-bar">
          <h3>
            <i className="fa fa-calendar-day mr-2" aria-hidden="true"></i>
            <span>Menú del Día</span>
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
            <AgregarButton onClick={handleCrearMenu} />
          </div>

          {/* Buscador, Fecha, Estado e Impresión en la misma línea horizontal debajo de Agregar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ flex: '1 1 0%', minWidth: '200px', maxWidth: '65%' }}>
              <Buscador
                filtro={filtro}
                setFiltro={handleFiltroChange}
                placeholder="Filtrar por plato, turno..."
              />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              {/* Calendario */}
              <div style={{ width: '170px', height: '38px' }}>
                <input
                  type="date"
                  className="form-control menudeldia-fecha-input"
                  value={fechaSeleccionada}
                  onChange={handleFechaChange}
                  style={{
                    height: '38px',
                    minHeight: '38px',
                    maxHeight: '38px',
                    boxSizing: 'border-box',
                    fontSize: '0.9rem',
                    lineHeight: '1.25',
                    padding: '0.25rem 0.5rem 0.25rem 0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '0.25rem',
                    width: '100%',
                  }}
                  title="Seleccionar fecha"
                />
              </div>
              {/* Estado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <label style={{ margin: 0, fontSize: '0.875rem', color: '#495057', whiteSpace: 'nowrap', fontWeight: 'normal' }}>
                  Estado:
                </label>
                <select
                  className="form-control menudeldia-estado-select"
                  value={filtroActivo}
                  onChange={(e) => {
                    setFiltroActivo(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    height: '38px',
                    minHeight: '38px',
                    maxHeight: '38px',
                    boxSizing: 'border-box',
                    padding: '0.25rem 0.5rem 0.25rem 0.75rem',
                    fontSize: '0.9rem',
                    lineHeight: '1.25',
                    border: '1px solid #ced4da',
                    borderRadius: '0.25rem',
                    backgroundColor: 'white',
                    color: '#495057',
                    cursor: 'pointer',
                    width: 'auto',
                    minWidth: 'fit-content',
                  }}
                >
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
              {/* Botón impresión */}
              <button
                type="button"
                className="btn"
                onClick={() => setMostrarModalImpresion(true)}
                disabled={menus.length === 0}
                title="Opciones de impresión"
                style={{
                  backgroundColor: '#007bff',
                  borderColor: '#007bff',
                  color: 'white',
                  padding: 0,
                  width: '38px',
                  height: '38px',
                  minHeight: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              >
                <i className="fa fa-print" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div style={{ 
            width: '100%', 
            overflowX: 'auto',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
          <DataTable
            columns={[
              {
                key: 'plato',
                field: 'plato',
                label: 'Plato',
                render: (v, row) => {
                  const platoNombre =
                    row.platoNombre ||
                    row.PlatoNombre ||
                    row.plato_nombre ||
                    row.platos?.find((p) => (p.id || p.Id) === (row.platoId || row.PlatoId))?.descripcion ||
                    row.plato?.descripcion ||
                    row.Plato?.Descripcion ||
                    '-';
                  return platoNombre;
                },
              },
              {
                key: 'plannutricional',
                field: 'plannutricional',
                label: 'Plan Nutricional',
                render: (v, row) => {
                  const planNombre =
                    row.PlanNutricionalNombre ||
                    row.planNutricionalNombre ||
                    row.plannutricionalNombre ||
                    row.PlannutricionalNombre ||
                    row.plan_nutricional_nombre ||
                    planesNutricionales.find((p) => (p.id || p.Id) === (row.PlanNutricionalId || row.planNutricionalId || row.plannutricional_id || row.Plannutricional_id))?.nombre ||
                    planesNutricionales.find((p) => (p.id || p.Id) === (row.PlanNutricionalId || row.planNutricionalId || row.plannutricional_id || row.Plannutricional_id))?.Nombre ||
                    row.planNutricional?.nombre ||
                    row.PlanNutricional?.Nombre ||
                    '-';
                  return planNombre;
                },
              },
              {
                key: 'turno',
                field: 'turno',
                label: 'Turno',
                render: (v, row) => {
                  const turnoNombre =
                    row.turnoNombre ||
                    row.TurnoNombre ||
                    row.turno_nombre ||
                    turnos.find((t) => (t.id || t.Id) === (row.turnoId || row.TurnoId))?.nombre ||
                    turnos.find((t) => (t.id || t.Id) === (row.turnoId || row.TurnoId))?.Nombre ||
                    row.turno?.nombre ||
                    row.Turno?.Nombre ||
                    '-';
                  return turnoNombre;
                },
              },
              {
                key: 'jerarquia',
                field: 'jerarquia',
                label: 'Jerarquía',
                render: (v, row) => {
                  const jerarquiaNombre =
                    row.jerarquiaNombre ||
                    row.JerarquiaNombre ||
                    row.jerarquia_nombre ||
                    jerarquias.find((j) => (j.id || j.Id) === (row.jerarquiaId || row.JerarquiaId))?.nombre ||
                    jerarquias.find((j) => (j.id || j.Id) === (row.jerarquiaId || row.JerarquiaId))?.Nombre ||
                    row.jerarquia?.nombre ||
                    row.Jerarquia?.Nombre ||
                    '-';
                  return jerarquiaNombre;
                },
              },
              {
                key: 'proyecto',
                field: 'proyecto',
                label: 'Proyecto',
                render: (v, row) => {
                  const proyectoNombre =
                    row.proyectoNombre ||
                    row.ProyectoNombre ||
                    row.proyecto_nombre ||
                    proyectos.find((p) => (p.id || p.Id) === (row.proyectoId || row.ProyectoId))?.nombre ||
                    proyectos.find((p) => (p.id || p.Id) === (row.proyectoId || row.ProyectoId))?.Nombre ||
                    row.proyecto?.nombre ||
                    row.Proyecto?.Nombre ||
                    '-';
                  return proyectoNombre;
                },
              },
              {
                key: 'centroCosto',
                field: 'centroCosto',
                label: 'Centro de costo',
                render: (v, row) => {
                  const centroNombre =
                    row.centroCostoNombre ||
                    row.CentroCostoNombre ||
                    row.centro_costo_nombre ||
                    centrosDeCosto.find((c) => (c.id || c.Id) === (row.centroCostoId || row.CentroCostoId))?.nombre ||
                    centrosDeCosto.find((c) => (c.id || c.Id) === (row.centroCostoId || row.CentroCostoId))?.Nombre ||
                    row.centroCosto?.nombre ||
                    row.CentroCosto?.Nombre ||
                    '-';
                  return centroNombre;
                },
              },
              {
                key: 'planta',
                field: 'planta',
                label: 'Planta',
                render: (v, row) => {
                  const plantaNombre =
                    row.plantaNombre ||
                    row.PlantaNombre ||
                    row.planta_nombre ||
                    plantas.find((p) => (p.id || p.Id) === (row.plantaId || row.PlantaId))?.nombre ||
                    plantas.find((p) => (p.id || p.Id) === (row.plantaId || row.PlantaId))?.Nombre ||
                    row.planta?.nombre ||
                    row.Planta?.Nombre ||
                    '-';
                  return plantaNombre;
                },
              },
              {
                key: 'cantidad',
                field: 'cantidad',
                label: 'Cantidad',
                align: 'center',
                render: (v, row) => {
                  const cantidad = row.cantidad || row.Cantidad || row.Cant || 0;
                  const comandadas = row.Comandas || row.comandas || row.comandadas || 0;
                  const disponible = Math.max(0, cantidad - comandadas);
                  
                  // Si asignados es mayor a 0, mostrar cantidad tachada y resultado al lado
                  if (comandadas > 0) {
                  return (
                      <span>
                    <span
                      style={{
                            position: 'relative',
                            color: '#6c757d', 
                            marginRight: '8px',
                            display: 'inline-block'
                          }}
                        >
                          {cantidad}
                          <span
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: 0,
                              right: 0,
                              height: '2px',
                              background: '#6c757d',
                              transform: 'rotate(-15deg)',
                              transformOrigin: 'center',
                            }}
                          />
                        </span>
                        <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                          {disponible}
                        </span>
                      </span>
                    );
                  }
                  
                  // Si asignados es 0, solo mostrar la cantidad sin tachar
                  return (
                    <span>
                      {cantidad}
                    </span>
                  );
                },
              },
              {
                key: 'comandadas',
                field: 'comandadas',
                label: 'Asignados',
                align: 'center',
                render: (v, row) => row.Comandas || row.comandas || row.comandadas || 0,
              },
            ]}
            data={menus}
            isLoading={isLoading}
            emptyMessage={
              filtro
                ? 'No se encontraron menús que coincidan con la búsqueda'
                : 'No hay menús del día registrados'
            }
            onEdit={handleEditarMenu}
            canEdit={(menu) => !esMenuInactivo(menu)}
            onDelete={(menu) => {
              Swal.fire({
                title: '¿Está seguro?',
                text: `¿Desea dar de baja este menú del día?`,
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
                    const menuId = menu.id || menu.Id || menu.ID;
                    await menuService.eliminarMenu(menuId);
                    Swal.fire({
                      title: 'Dado de baja',
                      text: 'El menú del día ha sido dado de baja correctamente',
                      icon: 'success',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                    cargarMenus(currentPage, filtro, fechaSeleccionada);
                  } catch (error) {
                    if (!error.redirectToLogin) {
                      Swal.fire({
                        title: 'Error',
                        text: error.message || 'Error al dar de baja el menú del día',
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
            canDelete={(menu) => !esMenuInactivo(menu)}
            renderActions={(menu) => {
              const isInactivo = esMenuInactivo(menu);
              
              if (isInactivo) {
                return (
                  <button
                    className="btn btn-sm"
                    onClick={() => handleActivarMenu(menu.id || menu.Id || menu.ID)}
                    style={{
                      backgroundColor: '#28A745',
                      borderColor: '#28A745',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.875rem',
                    }}
                    title="Activar menú"
                  >
                    <i className="fa fa-check"></i>
                  </button>
                );
              }
              
              return null; // Los botones de editar y eliminar se muestran por defecto
            }}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            enablePagination={true}
          />
        </div>
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
                      plato: 'Plato',
                      plannutricional: 'Plan Nutricional',
                      turno: 'Turno',
                      jerarquia: 'Jerarquía',
                      proyecto: 'Proyecto',
                      centroCosto: 'Centro de Costo',
                      planta: 'Planta',
                      cantidad: 'Cantidad',
                      comandadas: 'Asignados',
                      fecha: 'Fecha',
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
                    }}>Fecha:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filtrosImpresion.fecha}
                      onChange={(e) => setFiltrosImpresion(prev => ({ ...prev, fecha: e.target.value }))}
                      style={{ 
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      marginBottom: '0.5rem', 
                      display: 'block',
                      fontWeight: '500',
                      color: '#555'
                    }}>Turno:</label>
                    <select
                      className="form-control"
                      value={filtrosImpresion.turnoId}
                      onChange={(e) => setFiltrosImpresion(prev => ({ ...prev, turnoId: e.target.value }))}
                      style={{ 
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Todos</option>
                      {turnos.map((turno) => {
                        const turnoId = turno.id || turno.Id || turno.ID;
                        const turnoNombre = turno.nombre || turno.Nombre || turno.descripcion || turno.Descripcion || '';
                        return (
                          <option key={turnoId} value={String(turnoId)}>
                            {turnoNombre}
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
                    }}>Jerarquía:</label>
                    <select
                      className="form-control"
                      value={filtrosImpresion.jerarquiaId}
                      onChange={(e) => setFiltrosImpresion(prev => ({ ...prev, jerarquiaId: e.target.value }))}
                      style={{ 
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Todas</option>
                      {jerarquias.map((jerarquia) => {
                        const jerarquiaId = jerarquia.id || jerarquia.Id || jerarquia.ID;
                        const jerarquiaNombre = jerarquia.nombre || jerarquia.Nombre || jerarquia.descripcion || jerarquia.Descripcion || '';
                        return (
                          <option key={jerarquiaId} value={String(jerarquiaId)}>
                            {jerarquiaNombre}
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
                    }}>Proyecto:</label>
                    <select
                      className="form-control"
                      value={filtrosImpresion.proyectoId}
                      onChange={(e) => setFiltrosImpresion(prev => ({ ...prev, proyectoId: e.target.value }))}
                      style={{ 
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Todos</option>
                      {proyectos.map((proyecto) => {
                        const proyectoId = proyecto.id || proyecto.Id || proyecto.ID;
                        const proyectoNombre = proyecto.nombre || proyecto.Nombre || proyecto.descripcion || proyecto.Descripcion || '';
                        return (
                          <option key={proyectoId} value={String(proyectoId)}>
                            {proyectoNombre}
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
                    }}>Centro de Costo:</label>
                    <select
                      className="form-control"
                      value={filtrosImpresion.centroCostoId}
                      onChange={(e) => setFiltrosImpresion(prev => ({ ...prev, centroCostoId: e.target.value }))}
                      style={{ 
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Todos</option>
                      {centrosDeCosto.map((centro) => {
                        const centroId = centro.id || centro.Id || centro.ID;
                        const centroNombre = centro.nombre || centro.Nombre || centro.descripcion || centro.Descripcion || '';
                        return (
                          <option key={centroId} value={String(centroId)}>
                            {centroNombre}
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
                    }}>Planta:</label>
                    <select
                      className="form-control"
                      value={filtrosImpresion.plantaId}
                      onChange={(e) => setFiltrosImpresion(prev => ({ ...prev, plantaId: e.target.value }))}
                      style={{ 
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <option value="">Todas</option>
                      {plantas.map((planta) => {
                        const plantaId = planta.id || planta.Id || planta.ID;
                        const plantaNombre = planta.nombre || planta.Nombre || planta.descripcion || planta.Descripcion || '';
                        return (
                          <option key={plantaId} value={String(plantaId)}>
                            {plantaNombre}
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
            {vista === 'editar' ? 'Editar Menú del Día' : 'Nuevo Menú del Día'}
          </h3>
        </div>
      </div>

      {/* Barra informativa para creación */}
      {vista === 'crear' && (
        <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
          <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
          <span style={{ color: '#0097A7' }}>Creando nuevo menú del día - Complete los campos obligatorios para guardar.</span>
        </div>
      )}

      {/* Barra informativa para edición */}
      {vista === 'editar' && (
        <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
          <i className="fa fa-pencil-alt" style={{ color: '#0097A7' }}></i>
          <span style={{ color: '#0097A7' }}>Editando menú del día - Modifique los campos necesarios y guarde los cambios.</span>
        </div>
      )}

      <div className="usuarios-form-container">
        <form>
          <div className="form-section" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-section-title" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', fontSize: '1rem' }}>
              <i
                className="fa fa-calendar-day mr-2"
                style={{ fontSize: '0.8em' }}
              ></i>
              <span>Información del Menú del Día</span>
            </div>
            <div className="form-section-content" style={{ padding: '0' }}>
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="plannutricional_id" style={{ marginBottom: '0.25rem' }}>
                      Plan Nutricional {planesNutricionales.length > 1 && <span style={{ color: '#F34949' }}>*</span>}
                    </label>
                    <select
                      className="form-control"
                      id="plannutricional_id"
                      name="plannutricional_id"
                      value={formData.plannutricional_id || (planesNutricionales.length === 1 ? String(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID) : '')}
                      onChange={handleInputChange}
                      disabled={isLoading || planesNutricionales.length === 1}
                      required
                      style={{
                        ...(planesNutricionales.length === 1
                          ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }
                          : {})
                      }}
                    >
                      {planesNutricionales.length === 0 ? (
                        <option value="">{isLoading ? 'Cargando...' : (vista === 'crear' ? '-- Seleccionar --' : '')}</option>
                      ) : planesNutricionales.length === 1 ? (
                        <option value={String(planesNutricionales[0].id || planesNutricionales[0].Id || planesNutricionales[0].ID)}>
                          {planesNutricionales[0].nombre || planesNutricionales[0].Nombre || planesNutricionales[0].descripcion || planesNutricionales[0].Descripcion}
                        </option>
                      ) : (
                        <>
                          {vista === 'crear' && <option value="">-- Seleccionar --</option>}
                      {planesNutricionales.map((plan) => {
                        const planId = plan.id || plan.Id || plan.ID;
                        const planNombre = plan.nombre || plan.Nombre || plan.descripcion || plan.Descripcion || '';
                        return (
                          <option key={planId} value={String(planId)}>
                            {planNombre}
                          </option>
                        );
                      })}
                        </>
                      )}
                    </select>
                    {planesNutricionales.length === 1 && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i 
                          className="fa fa-info-circle" 
                          title="Solo hay una opción disponible"
                          style={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            cursor: 'help',
                          }}
                          aria-hidden="true"
                        ></i>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                        }}>
                          Solo hay una opción disponible
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group" style={{ marginBottom: '0.25rem', position: 'relative' }}>
                    <label htmlFor="platoId" style={{ marginBottom: '0.25rem' }}>
                      Plato <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <div className="plato-buscador-container" style={{ position: 'relative' }}>
                      <div className="input-group">
                        <input
                          type="text"
                      className="form-control"
                      id="platoId"
                      name="platoId"
                          value={busquedaPlato}
                          onChange={(e) => {
                            const valor = e.target.value;
                            setBusquedaPlato(valor);
                            // Si se borra el texto, limpiar la selección
                            if (!valor.trim()) {
                              setFormData(prev => ({ ...prev, platoId: '' }));
                              setPlatoSeleccionadoNombre('');
                              setMostrarDropdownPlato(false);
                            } else {
                              // Mostrar dropdown si hay texto de búsqueda
                              setMostrarDropdownPlato(true);
                            }
                          }}
                          onFocus={() => {
                            if (busquedaPlato.trim()) {
                              setMostrarDropdownPlato(true);
                            }
                          }}
                          placeholder={(!formData.plannutricional_id || formData.plannutricional_id === '') && planesNutricionales.length !== 1
                            ? 'Primero seleccione un Plan Nutricional' 
                            : 'Buscar plato por nombre o código...'}
                          disabled={(!formData.plannutricional_id || formData.plannutricional_id === '') && planesNutricionales.length !== 1}
                      required
                          style={{
                            fontSize: '0.875rem',
                            padding: '0.4rem 0.75rem',
                            height: '38px',
                            boxSizing: 'border-box',
                            lineHeight: '1.5',
                            ...( (!formData.plannutricional_id || formData.plannutricional_id === '') && planesNutricionales.length !== 1 ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            } : {})
                          }}
                        />
                        {busquedaPlato && (
                          <div className="input-group-append">
                            <button
                              type="button"
                              className="btn"
                              onClick={() => {
                                setBusquedaPlato('');
                                setPlatoSeleccionadoNombre('');
                                setFormData(prev => ({ ...prev, platoId: '' }));
                                setMostrarDropdownPlato(false);
                              }}
                              style={{
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #ced4da',
                                borderLeft: 'none',
                                color: '#6c757d',
                                padding: '0.375rem 0.75rem',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="Limpiar búsqueda"
                            >
                              <i className="fa fa-times" aria-hidden="true"></i>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Dropdown con resultados */}
                      {mostrarDropdownPlato && platosBuscados.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            backgroundColor: 'white',
                            border: '1px solid #ced4da',
                            borderTop: 'none',
                            borderRadius: '0 0 0.25rem 0.25rem',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            marginTop: '-1px',
                          }}
                        >
                          {platosBuscados.map((plato) => {
                        const platoId = plato.id || plato.Id || plato.ID;
                        const platoNombre = plato.descripcion || plato.Descripcion || plato.nombre || plato.Nombre || '';
                            const platoCodigo = plato.codigo || plato.Codigo || '';
                        return (
                              <div
                                key={platoId}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, platoId: String(platoId) }));
                                  setPlatoSeleccionadoNombre(platoNombre);
                                  setBusquedaPlato(platoNombre);
                                  setMostrarDropdownPlato(false);
                                }}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0',
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#f8f9fa';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'white';
                                }}
                              >
                                <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{platoNombre}</div>
                                {platoCodigo && (
                                  <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                    Código: {platoCodigo}
                                  </div>
                                )}
                              </div>
                        );
                      })}
                  </div>
                      )}
                      
                      {/* Mensaje cuando no hay resultados */}
                      {busquedaPlato.trim() && platosBuscados.length === 0 && mostrarDropdownPlato && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            backgroundColor: 'white',
                            border: '1px solid #ced4da',
                            borderTop: 'none',
                            borderRadius: '0 0 0.25rem 0.25rem',
                            padding: '0.75rem',
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            marginTop: '-1px',
                          }}
                        >
                          No se encontraron platos que coincidan con "{busquedaPlato}"
                </div>
                      )}
                    </div>
                    
                    {/* Input oculto para validación HTML5 */}
                    <input
                      type="hidden"
                      value={formData.platoId || ''}
                      required
                    />
                    
                    {(!formData.plannutricional_id || formData.plannutricional_id === '') && planesNutricionales.length !== 1 && (
                      <div style={{ marginTop: '0.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i 
                          className="fa fa-info-circle" 
                          title="Debe seleccionar el plan nutricional para poder buscar y agregar platos"
                          style={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            cursor: 'help',
                          }}
                          aria-hidden="true"
                        ></i>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                        }}>
                          Debe seleccionar primero un plan nutricional para poder buscar un plato
                        </span>
                      </div>
                    )}
                    {planesNutricionales.length === 1 && (
                      <div style={{ marginTop: '0.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i 
                          className="fa fa-info-circle" 
                          title="El plan nutricional está seleccionado automáticamente"
                          style={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            cursor: 'help',
                          }}
                          aria-hidden="true"
                        ></i>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                        }}>
                          Seleccionar solamente el plato porque el plan nutricional es {planesNutricionales[0].nombre || planesNutricionales[0].Nombre || planesNutricionales[0].descripcion || planesNutricionales[0].Descripcion || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-2" style={{ maxWidth: '120px' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="cantidad" style={{ marginBottom: '0.25rem' }}>
                      Cantidad <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="cantidad"
                      name="cantidad"
                      value={formData.cantidad || ''}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        const valor = e.target.value;
                        const num = parseFloat(valor);
                        const comandadas = Number(formData.comandadas ?? 0) || 0;
                        const minCantidad = comandadas > 0 ? comandadas : 0;
                        if (valor === '' || isNaN(num) || num < minCantidad) {
                          setFormData((prev) => ({
                            ...prev,
                            cantidad: String(minCantidad > 0 ? minCantidad : 1),
                          }));
                        }
                      }}
                      required
                      min={formData.comandadas > 0 ? formData.comandadas : 0}
                      placeholder={formData.comandadas > 0 ? String(formData.comandadas) : '1'}
                      style={{
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-2" style={{ maxWidth: '170px' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="fecha" style={{ marginBottom: '0.25rem' }}>
                      Fecha <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="fecha"
                      name="fecha"
                      value={formData.fecha || ''}
                      onChange={handleInputChange}
                      required
                      style={{
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="row" style={{ marginTop: '1.5rem' }}>
                <div className="col-md-2">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="jerarquiaId" style={{ marginBottom: '0.25rem' }}>
                      Jerarquía {jerarquias.length > 1 && <span style={{ color: '#F34949' }}>*</span>}
                    </label>
                    <select
                      className="form-control"
                      id="jerarquiaId"
                      name="jerarquiaId"
                      value={formData.jerarquiaId || (jerarquias.length === 1 ? String(jerarquias[0].id || jerarquias[0].Id || jerarquias[0].ID) : '')}
                      onChange={handleInputChange}
                      disabled={isLoading || jerarquias.length === 1}
                      required
                      style={{
                        ...(jerarquias.length === 1
                          ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }
                          : {})
                      }}
                    >
                      {jerarquias.length === 0 ? (
                        <option value="">{isLoading ? 'Cargando...' : (vista === 'crear' ? '-- Seleccionar --' : '')}</option>
                      ) : jerarquias.length === 1 ? (
                        <option value={String(jerarquias[0].id || jerarquias[0].Id || jerarquias[0].ID)}>
                          {jerarquias[0].nombre || jerarquias[0].Nombre || jerarquias[0].descripcion || jerarquias[0].Descripcion}
                        </option>
                      ) : (
                        <>
                          {vista === 'crear' && <option value="">-- Seleccionar --</option>}
                      {jerarquias.map((jerarquia) => {
                        const jerarquiaId = jerarquia.id || jerarquia.Id || jerarquia.ID;
                        const jerarquiaNombre = jerarquia.nombre || jerarquia.Nombre || jerarquia.descripcion || jerarquia.Descripcion || '';
                        return (
                          <option key={jerarquiaId} value={String(jerarquiaId)}>
                            {jerarquiaNombre}
                          </option>
                        );
                      })}
                        </>
                      )}
                    </select>
                    {jerarquias.length === 1 && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i 
                          className="fa fa-info-circle" 
                          title="Solo hay una opción disponible"
                          style={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            cursor: 'help',
                          }}
                          aria-hidden="true"
                        ></i>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                        }}>
                          Solo hay una opción disponible
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="turnoId" style={{ marginBottom: '0.25rem' }}>
                      Turno {turnos.length > 1 && <span style={{ color: '#F34949' }}>*</span>}
                    </label>
                    <select
                      className="form-control"
                      id="turnoId"
                      name="turnoId"
                      value={formData.turnoId || (turnos.length === 1 ? String(turnos[0].id || turnos[0].Id || turnos[0].ID) : '')}
                      onChange={handleInputChange}
                      disabled={turnos.length === 1}
                      required
                      style={{
                        ...(turnos.length === 1
                          ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }
                          : {})
                      }}
                    >
                      {turnos.length === 0 ? (
                        <option value="">Cargando...</option>
                      ) : turnos.length === 1 ? (
                        <option value={String(turnos[0].id || turnos[0].Id || turnos[0].ID)}>
                          {turnos[0].nombre || turnos[0].Nombre || turnos[0].descripcion || turnos[0].Descripcion}
                        </option>
                      ) : (
                        <>
                          {vista === 'crear' && <option value="">-- Seleccionar --</option>}
                      {turnos.map((turno) => {
                        const turnoId = turno.id || turno.Id || turno.ID;
                        const turnoNombre = turno.nombre || turno.Nombre || turno.descripcion || turno.Descripcion || '';
                        return (
                          <option key={turnoId} value={String(turnoId)}>
                            {turnoNombre}
                          </option>
                        );
                      })}
                        </>
                      )}
                    </select>
                    {turnos.length === 1 && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i 
                          className="fa fa-info-circle" 
                          title="Solo hay una opción disponible"
                          style={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            cursor: 'help',
                          }}
                          aria-hidden="true"
                        ></i>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                        }}>
                          Solo hay una opción disponible
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="proyectoId" style={{ marginBottom: '0.25rem' }}>
                      Proyecto {proyectos.length > 1 && <span style={{ color: '#F34949' }}>*</span>}
                    </label>
                    <select
                      className="form-control"
                      id="proyectoId"
                      name="proyectoId"
                      value={formData.proyectoId || (proyectos.length === 1 ? String(proyectos[0].id || proyectos[0].Id || proyectos[0].ID) : '')}
                      onChange={handleInputChange}
                      disabled={isLoading || proyectos.length === 1}
                      required
                      style={{
                        ...(proyectos.length === 1
                          ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }
                          : {})
                      }}
                    >
                      {proyectos.length === 0 ? (
                        <option value="">{isLoading ? 'Cargando...' : (vista === 'crear' ? '-- Seleccionar --' : '')}</option>
                      ) : proyectos.length === 1 ? (
                        <option value={String(proyectos[0].id || proyectos[0].Id || proyectos[0].ID)}>
                          {proyectos[0].nombre || proyectos[0].Nombre || proyectos[0].descripcion || proyectos[0].Descripcion}
                        </option>
                      ) : (
                        <>
                          {vista === 'crear' && <option value="">-- Seleccionar --</option>}
                      {proyectos.map((proyecto) => {
                        const proyectoId = proyecto.id || proyecto.Id || proyecto.ID;
                        const proyectoNombre = proyecto.nombre || proyecto.Nombre || proyecto.descripcion || proyecto.Descripcion || '';
                        return (
                          <option key={proyectoId} value={String(proyectoId)}>
                            {proyectoNombre}
                          </option>
                        );
                      })}
                        </>
                      )}
                    </select>
                    {proyectos.length === 1 && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i 
                          className="fa fa-info-circle" 
                          title="Solo hay una opción disponible"
                          style={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            cursor: 'help',
                          }}
                          aria-hidden="true"
                        ></i>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                        }}>
                          Solo hay una opción disponible
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="centroCostoId" style={{ marginBottom: '0.25rem' }}>
                      Centro de costo {centrosDeCosto.length > 1 && <span style={{ color: '#F34949' }}>*</span>}
                    </label>
                    <select
                      className="form-control"
                      id="centroCostoId"
                      name="centroCostoId"
                      value={formData.centroCostoId || (centrosDeCosto.length === 1 ? String(centrosDeCosto[0].id || centrosDeCosto[0].Id || centrosDeCosto[0].ID) : '')}
                      onChange={handleInputChange}
                      disabled={isLoading || centrosDeCosto.length === 1}
                      required
                      style={{
                        ...(centrosDeCosto.length === 1
                          ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }
                          : {})
                      }}
                    >
                      {centrosDeCosto.length === 0 ? (
                        <option value="">{isLoading ? 'Cargando...' : (vista === 'crear' ? '-- Seleccionar --' : '')}</option>
                      ) : centrosDeCosto.length === 1 ? (
                        <option value={String(centrosDeCosto[0].id || centrosDeCosto[0].Id || centrosDeCosto[0].ID)}>
                          {centrosDeCosto[0].nombre || centrosDeCosto[0].Nombre || centrosDeCosto[0].descripcion || centrosDeCosto[0].Descripcion}
                        </option>
                      ) : (
                        <>
                          {vista === 'crear' && <option value="">-- Seleccionar --</option>}
                      {centrosDeCosto.map((centro) => {
                        const centroId = centro.id || centro.Id || centro.ID;
                        const centroNombre = centro.nombre || centro.Nombre || centro.descripcion || centro.Descripcion || '';
                        return (
                          <option key={centroId} value={String(centroId)}>
                            {centroNombre}
                          </option>
                        );
                      })}
                        </>
                      )}
                    </select>
                    {centrosDeCosto.length === 1 && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i 
                          className="fa fa-info-circle" 
                          title="Solo hay una opción disponible"
                          style={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            cursor: 'help',
                          }}
                          aria-hidden="true"
                        ></i>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                        }}>
                          Solo hay una opción disponible
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="plantaId" style={{ marginBottom: '0.25rem' }}>
                      Planta {plantas.length > 1 && <span style={{ color: '#F34949' }}>*</span>}
                    </label>
                    <select
                      className="form-control"
                      id="plantaId"
                      name="plantaId"
                      value={formData.plantaId || (plantas.length === 1 ? String(plantas[0].id || plantas[0].Id || plantas[0].ID) : '')}
                      onChange={handleInputChange}
                      disabled={isLoading || plantas.length === 1}
                      required
                      style={{
                        ...(plantas.length === 1
                          ? {
                              backgroundColor: '#e9ecef',
                              cursor: 'not-allowed',
                              opacity: 0.7,
                            }
                          : {})
                      }}
                    >
                      {plantas.length === 0 ? (
                        <option value="">{isLoading ? 'Cargando...' : (vista === 'crear' ? '-- Seleccionar --' : '')}</option>
                      ) : plantas.length === 1 ? (
                        <option value={String(plantas[0].id || plantas[0].Id || plantas[0].ID)}>
                          {plantas[0].nombre || plantas[0].Nombre || plantas[0].descripcion || plantas[0].Descripcion}
                        </option>
                      ) : (
                        <>
                          {vista === 'crear' && <option value="">-- Seleccionar --</option>}
                      {plantas.map((planta) => {
                        const plantaId = planta.id || planta.Id || planta.ID;
                        const plantaNombre = planta.nombre || planta.Nombre || planta.descripcion || planta.Descripcion || '';
                        return (
                          <option key={plantaId} value={String(plantaId)}>
                            {plantaNombre}
                          </option>
                        );
                      })}
                        </>
                      )}
                    </select>
                    {plantas.length === 1 && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i 
                          className="fa fa-info-circle" 
                          title="Solo hay una opción disponible"
                          style={{ 
                            color: '#6c757d',
                            fontSize: '0.875rem',
                            cursor: 'help',
                          }}
                          aria-hidden="true"
                        ></i>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                        }}>
                          Solo hay una opción disponible
                        </span>
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

export default MenuDelDia;
