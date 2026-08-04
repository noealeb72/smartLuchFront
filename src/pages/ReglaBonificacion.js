import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { reglaBonificacionService } from '../services/reglaBonificacionService';
import { turnosService } from '../services/turnosService';
import { catalogosService } from '../services/catalogosService';
import { platosService } from '../services/platosService';
import MultiSelectBuscador from '../components/MultiSelectBuscador';
import BotonAyuda from '../components/BotonAyuda';
import SelectorRegistros from '../components/SelectorRegistros';
import { usePaginacion } from '../hooks/usePaginacion';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import './Usuarios.css';

const POSICION_LABELS = {
  1: 'Primero',
  2: 'Segundo',
  3: 'Tercero en adelante',
};

const TIPO_EFECTO_LABELS = {
  Porcentaje: 'Porcentaje',
  MontoFijo: 'Monto fijo',
  CostoCero: 'Costo cero',
};

const formatearEfecto = (tipoEfecto, valorEfecto) => {
  if (tipoEfecto === 'CostoCero') return 'Costo cero';
  if (valorEfecto === null || valorEfecto === undefined || valorEfecto === '') return '-';
  const valor = parseFloat(valorEfecto);
  if (isNaN(valor)) return '-';
  if (tipoEfecto === 'Porcentaje') return `${valor}%`;
  if (tipoEfecto === 'MontoFijo') return `$${valor}`;
  return '-';
};

const formatearVigencia = (fechaDesde, fechaHasta) => {
  if (!fechaDesde && !fechaHasta) return 'Siempre';
  const f = (d) => (d ? new Date(d).toLocaleDateString() : '...');
  return `${f(fechaDesde)} - ${f(fechaHasta)}`;
};

// Contenido del manual de ayuda: una sola fuente para el popup (JSX) y el PDF descargable,
// para que no se puedan desincronizar entre sí.
const MANUAL_CONTENIDO = [
  {
    tipo: 'parrafo',
    texto:
      'El motor de reglas de bonificación decide automáticamente qué descuento le corresponde a cada ' +
      'pedido — el comensal no elige nada. Cuando se confirma un pedido, el sistema busca todas las ' +
      'reglas activas cuyas condiciones coincidan con ese pedido puntual y aplica el efecto de la que ' +
      'tenga mayor prioridad. Si ninguna regla coincide, se cobra el 100% del precio de venta.',
  },
  { tipo: 'subtitulo', texto: 'Condiciones de una regla' },
  {
    tipo: 'parrafo',
    texto:
      'Cada regla tiene condiciones opcionales. Una condición dejada en "Todos" no filtra por ese ' +
      'campo: la regla aplica sin importar el valor que tenga el pedido en esa condición.',
  },
  {
    tipo: 'tabla',
    head: ['Condición', 'Qué evalúa'],
    body: [
      ['Turno', 'En qué turno se hace el pedido (se pueden elegir varios)'],
      ['Jerarquía', 'La jerarquía del comensal que pide'],
      ['Comedor', 'En qué planta/comedor se hace el pedido'],
      ['Plan Nutricional', 'El plan nutricional del plato pedido'],
      ['Producto', 'Uno o varios platos puntuales (se pueden elegir varios)'],
      ['Posición del pedido', 'Si es el primer, segundo o tercer pedido en adelante que hace el comensal ese día'],
      ['Invitado', 'Si el pedido es para un invitado o no'],
      ['Vigencia', 'Rango de fechas en el que la regla está activa'],
    ],
  },
  { tipo: 'subtitulo', texto: 'Efecto de la regla' },
  { tipo: 'parrafo', texto: 'Cuando una regla matchea, se le aplica uno de estos efectos al precio del plato:' },
  {
    tipo: 'tabla',
    head: ['Tipo de efecto', 'Qué hace'],
    body: [
      ['Porcentaje', 'Descuenta un % del precio de venta (ej: 50% → el comensal paga la mitad)'],
      ['Monto fijo', 'El comensal paga un monto fijo, sin importar el precio de venta del plato'],
      ['Costo cero', 'El pedido sale gratis para el comensal'],
    ],
  },
  { tipo: 'subtitulo', texto: 'Prioridad: qué pasa si varias reglas coinciden' },
  {
    tipo: 'parrafo',
    texto:
      'Si un mismo pedido matchea las condiciones de más de una regla activa, gana la de mayor ' +
      'Prioridad (un número: cuanto más alto, más gana). Conviene usar prioridades distintas entre ' +
      'reglas que puedan superponerse, para que quede claro cuál manda.',
  },
  { tipo: 'subtitulo', texto: 'Ejemplos prácticos' },
  {
    tipo: 'lista',
    items: [
      'Subsidiar el primer pedido del día al 50%: Posición del pedido = Primero, Efecto = Porcentaje 50, sin otras condiciones.',
      'Excluir un producto puntual de cualquier descuento: elegir ese Producto, Efecto = Porcentaje 0, con Prioridad más alta que las demás reglas.',
      'Bonificar solo a una jerarquía en un comedor puntual: elegir Jerarquía y Comedor, dejar el resto en "Todos".',
      'Regla vigente solo un día especial: usar Vigente desde / Vigente hasta con la misma fecha.',
    ],
  },
  { tipo: 'subtitulo', texto: 'Cómo administrar las reglas' },
  {
    tipo: 'lista',
    items: [
      'Agregar: botón "+ Agregar" arriba del listado.',
      'Editar: ícono de lápiz en la fila de la regla.',
      'Dar de baja / Activar: ícono de tacho o de check — una regla dada de baja deja de evaluarse, pero no se borra.',
      'Buscar: el buscador de arriba filtra por nombre de regla.',
      'Exportar: los botones de PDF/Excel exportan el listado completo con el filtro de Estado aplicado.',
    ],
  },
];

const ReglaBonificacion = () => {
  const [reglas, setReglas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reglaEditando, setReglaEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('activo');
  const [vista, setVista] = useState('lista'); // 'lista' | 'editar' | 'crear'

  // Catálogos para los selects de condiciones
  const [turnos, setTurnos] = useState([]);
  const [jerarquias, setJerarquias] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [planesNutricionales, setPlanesNutricionales] = useState([]);
  const [platos, setPlatos] = useState([]);
  const turnosOpciones = useMemo(
    () =>
      turnos.map((t) => ({
        id: t.id || t.Id || t.ID,
        label: t.nombre || t.Nombre || t.descripcion || t.Descripcion || '',
      })),
    [turnos]
  );
  const platosOpciones = useMemo(
    () =>
      platos.map((p) => ({
        id: p.id || p.Id || p.ID,
        label: p.descripcion || p.Descripcion || p.nombre || p.Nombre || '',
      })),
    [platos]
  );

  // Paginación
  const {
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    totalPages, setTotalPages,
    totalItems, setTotalItems,
    opcionesPageSize,
    handlePageChange,
  } = usePaginacion(5);

  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    prioridad: '0',
    turnoIds: [],
    jerarquiaId: '',
    plantaId: '',
    plannutricionalId: '',
    platoIds: [],
    posicionPedido: '',
    esInvitado: '',
    fechaDesde: '',
    fechaHasta: '',
    tipoEfecto: 'Porcentaje',
    valorEfecto: '',
  });

  const formVacio = {
    id: null,
    nombre: '',
    prioridad: '0',
    turnoIds: [],
    jerarquiaId: '',
    plantaId: '',
    plannutricionalId: '',
    platoIds: [],
    posicionPedido: '',
    esInvitado: '',
    fechaDesde: '',
    fechaHasta: '',
    tipoEfecto: 'Porcentaje',
    valorEfecto: '',
  };

  // ===================== catálogos =====================

  const cargarCatalogos = useCallback(async () => {
    try {
      const [turnosData, jerarquiasData, plantasData, planesData, platosData] = await Promise.all([
        turnosService.getTurnosDisponibles().catch(() => []),
        catalogosService.getJerarquias().catch(() => []),
        catalogosService.getPlantas().catch(() => []),
        catalogosService.getPlanesNutricionales().catch(() => []),
        platosService.obtenerPlatosLista(1, 500, '', true).catch(() => []),
      ]);
      const aArray = (d) => (Array.isArray(d) ? d : d?.items || d?.data || []);
      setTurnos(aArray(turnosData));
      setJerarquias(aArray(jerarquiasData));
      setPlantas(aArray(plantasData));
      setPlanesNutricionales(aArray(planesData));
      setPlatos(aArray(platosData));
    } catch (error) {
      // Si fallan los catálogos, los selects de condiciones quedan solo con "Todos"
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // ===================== listado =====================

  const cargarReglas = useCallback(
    async (page = 1, searchTerm = '', mostrarActivos = true) => {
      try {
        setIsLoading(true);
        const data = await reglaBonificacionService.getReglasLista(page, pageSize, searchTerm, mostrarActivos);

        let items = [];
        if (data.items && Array.isArray(data.items)) items = data.items;
        else if (Array.isArray(data)) items = data;
        else if (data.data && Array.isArray(data.data)) items = data.data;

        const normalizadas = items.map((r) => ({
          id: r.Id ?? r.id,
          nombre: r.Nombre ?? r.nombre ?? '',
          prioridad: r.Prioridad ?? r.prioridad ?? 0,
          turnoIds: r.TurnoIds ?? r.turnoIds ?? [],
          turnoNombres: r.TurnoNombres ?? r.turnoNombres ?? [],
          jerarquiaId: r.JerarquiaId ?? r.jerarquiaId ?? null,
          jerarquiaNombre: r.JerarquiaNombre ?? r.jerarquiaNombre ?? null,
          plantaId: r.PlantaId ?? r.plantaId ?? null,
          plantaNombre: r.PlantaNombre ?? r.plantaNombre ?? null,
          plannutricionalId: r.PlannutricionalId ?? r.plannutricionalId ?? null,
          plannutricionalNombre: r.PlannutricionalNombre ?? r.plannutricionalNombre ?? null,
          platoIds: r.PlatoIds ?? r.platoIds ?? [],
          platoNombres: r.PlatoNombres ?? r.platoNombres ?? [],
          posicionPedido: r.PosicionPedido ?? r.posicionPedido ?? null,
          esInvitado: r.EsInvitado ?? r.esInvitado ?? null,
          fechaDesde: r.FechaDesde ?? r.fechaDesde ?? null,
          fechaHasta: r.FechaHasta ?? r.fechaHasta ?? null,
          tipoEfecto: r.TipoEfecto ?? r.tipoEfecto ?? 'Porcentaje',
          valorEfecto: r.ValorEfecto ?? r.valorEfecto ?? null,
          activo: !(r.Deletemark ?? r.deletemark ?? false),
        }));

        const totalItemsBackend = data.totalItems ?? normalizadas.length;
        const totalPagesBackend = data.totalPages ?? (Math.ceil(Number(totalItemsBackend) / pageSize) || 1);

        setReglas(normalizadas);
        setTotalPages(totalPagesBackend);
        setTotalItems(totalItemsBackend);
      } catch (error) {
        if (!error.redirectToLogin) {
          Swal.fire({
            title: 'Error',
            text: error.message || 'Error al cargar las reglas de bonificación',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
        }
        setReglas([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, filtroActivo]);

  useEffect(() => {
    const soloActivos = filtroActivo === 'activo';
    cargarReglas(currentPage, filtro, soloActivos);
  }, [currentPage, filtro, filtroActivo, cargarReglas]);

  // ===================== form handlers =====================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    const errores = [];
    let primerCampoConError = '';
    const addError = (msg, fieldId) => {
      errores.push(msg);
      if (!primerCampoConError) primerCampoConError = fieldId;
    };

    if (!formData.nombre.trim()) addError('El nombre es requerido', 'nombre');

    if (formData.tipoEfecto !== 'CostoCero') {
      if (formData.valorEfecto === '' || formData.valorEfecto === null) {
        addError('El valor del efecto es requerido salvo que el tipo sea Costo cero', 'valorEfecto');
      } else {
        const valorNum = parseFloat(formData.valorEfecto);
        if (isNaN(valorNum) || valorNum < 0) addError('El valor del efecto debe ser un número válido', 'valorEfecto');
        else if (formData.tipoEfecto === 'Porcentaje' && valorNum > 100) addError('El porcentaje no puede ser mayor a 100', 'valorEfecto');
      }
    }

    if (errores.length > 0) {
      Swal.fire({
        title: 'Error de validación',
        html:
          '<div style="text-align: left;"><p>Revisá lo siguiente:</p><ul style="margin: 0; padding-left: 20px;">' +
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

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      setIsLoading(true);

      const dataToSend = {
        Nombre: formData.nombre.trim(),
        Prioridad: parseInt(formData.prioridad) || 0,
        TurnoIds: (formData.turnoIds || []).map((id) => parseInt(id)).filter((n) => !isNaN(n)),
        JerarquiaId: formData.jerarquiaId ? parseInt(formData.jerarquiaId) : null,
        PlantaId: formData.plantaId ? parseInt(formData.plantaId) : null,
        PlannutricionalId: formData.plannutricionalId ? parseInt(formData.plannutricionalId) : null,
        PlatoIds: (formData.platoIds || []).map((id) => parseInt(id)).filter((n) => !isNaN(n)),
        PosicionPedido: formData.posicionPedido ? parseInt(formData.posicionPedido) : null,
        EsInvitado: formData.esInvitado === '' ? null : formData.esInvitado === 'true',
        FechaDesde: formData.fechaDesde || null,
        FechaHasta: formData.fechaHasta || null,
        TipoEfecto: formData.tipoEfecto,
        ValorEfecto:
          formData.tipoEfecto === 'CostoCero'
            ? null
            : (formData.valorEfecto !== '' ? parseFloat(formData.valorEfecto) : null),
      };

      if (reglaEditando) {
        await reglaBonificacionService.actualizarRegla({ ...dataToSend, Id: formData.id });
        Swal.fire({
          title: 'Éxito',
          text: 'Regla actualizada correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        await reglaBonificacionService.crearRegla(dataToSend);
        Swal.fire({
          title: 'Éxito',
          text: 'Regla creada correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }

      handleVolverALista();
      const soloActivos = filtroActivo === 'activo';
      cargarReglas(currentPage, filtro, soloActivos);
    } catch (error) {
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Error al guardar la regla',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearRegla = () => {
    setReglaEditando(null);
    setFormData(formVacio);
    setVista('crear');
  };

  const handleEditarRegla = (regla) => {
    setReglaEditando(regla);
    setFormData({
      id: regla.id,
      nombre: regla.nombre || '',
      prioridad: String(regla.prioridad ?? 0),
      turnoIds: (regla.turnoIds || []).map(String),
      jerarquiaId: regla.jerarquiaId ? String(regla.jerarquiaId) : '',
      plantaId: regla.plantaId ? String(regla.plantaId) : '',
      plannutricionalId: regla.plannutricionalId ? String(regla.plannutricionalId) : '',
      platoIds: (regla.platoIds || []).map(String),
      posicionPedido: regla.posicionPedido ? String(regla.posicionPedido) : '',
      esInvitado: regla.esInvitado === null || regla.esInvitado === undefined ? '' : String(regla.esInvitado),
      fechaDesde: regla.fechaDesde ? regla.fechaDesde.substring(0, 10) : '',
      fechaHasta: regla.fechaHasta ? regla.fechaHasta.substring(0, 10) : '',
      tipoEfecto: regla.tipoEfecto || 'Porcentaje',
      valorEfecto: regla.valorEfecto !== null && regla.valorEfecto !== undefined ? String(regla.valorEfecto) : '',
    });
    setVista('editar');
  };

  const handleVolverALista = () => {
    setReglaEditando(null);
    setFormData(formVacio);
    setVista('lista');
  };

  // ===================== render: formulario =====================

  if (vista === 'crear' || vista === 'editar') {
    return (
      <div className="container-fluid" style={{ padding: 0, backgroundColor: 'white' }}>
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
            <h3>{vista === 'editar' ? 'Editar Regla de Bonificación' : 'Nueva Regla de Bonificación'}</h3>
          </div>
        </div>

        {vista === 'crear' && (
          <div className="usuarios-info-bar" style={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #0097A7' }}>
            <i className="fa fa-info-circle" style={{ color: '#0097A7' }}></i>
            <span style={{ color: '#0097A7' }}>
              Dejá una condición en "Todos" para que no filtre por ese campo. Si dos reglas matchean el mismo
              pedido, gana la de mayor prioridad.
            </span>
          </div>
        )}

        <div className="usuarios-form-container">
          <form>
            <div className="form-section">
              <div className="form-section-title">
                <i className="fa fa-percentage mr-2"></i>
                <span>Datos generales</span>
              </div>
              <div className="form-section-content">
                <div className="row">
                  <div className="col-md-8">
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
                        placeholder="Ej: Primer pedido del día"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="prioridad">Prioridad</label>
                      <input
                        type="number"
                        step="1"
                        className="form-control"
                        id="prioridad"
                        name="prioridad"
                        value={formData.prioridad}
                        onChange={handleInputChange}
                      />
                      <small className="form-text text-muted">Si dos reglas matchean el mismo pedido, gana la de mayor prioridad.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section mt-3">
              <div className="form-section-title">
                <i className="fa fa-filter mr-2"></i>
                <span>Condiciones (opcionales — "Todos" no filtra por ese campo)</span>
              </div>
              <div className="form-section-content">
                <div className="row">
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="turnoBuscador">Turno</label>
                      <MultiSelectBuscador
                        options={turnosOpciones}
                        selectedIds={formData.turnoIds}
                        onChange={(ids) => setFormData((prev) => ({ ...prev, turnoIds: ids }))}
                        placeholder="Buscar turno..."
                        emptyLabel="Todos"
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="jerarquiaId">Jerarquía</label>
                      <select className="form-control" id="jerarquiaId" name="jerarquiaId" value={formData.jerarquiaId} onChange={handleInputChange}>
                        <option value="">Todos</option>
                        {jerarquias.map((j) => {
                          const id = j.id || j.Id || j.ID;
                          const nombre = j.nombre || j.Nombre || j.descripcion || j.Descripcion || '';
                          return <option key={id} value={String(id)}>{nombre}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="plantaId">Comedor (Planta)</label>
                      <select className="form-control" id="plantaId" name="plantaId" value={formData.plantaId} onChange={handleInputChange}>
                        <option value="">Todos</option>
                        {plantas.map((p) => {
                          const id = p.id || p.Id || p.ID;
                          const nombre = p.nombre || p.Nombre || p.descripcion || p.Descripcion || '';
                          return <option key={id} value={String(id)}>{nombre}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="plannutricionalId">Plan Nutricional</label>
                      <select className="form-control" id="plannutricionalId" name="plannutricionalId" value={formData.plannutricionalId} onChange={handleInputChange}>
                        <option value="">Todos</option>
                        {planesNutricionales.map((pn) => {
                          const id = pn.id || pn.Id || pn.ID;
                          const nombre = pn.nombre || pn.Nombre || pn.descripcion || pn.Descripcion || '';
                          return <option key={id} value={String(id)}>{nombre}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="platoBuscador">Productos (Platos)</label>
                      <MultiSelectBuscador
                        options={platosOpciones}
                        selectedIds={formData.platoIds}
                        onChange={(ids) => setFormData((prev) => ({ ...prev, platoIds: ids }))}
                        placeholder="Buscar producto por nombre..."
                        emptyLabel="Todos (no se eligió ningún producto puntual)"
                      />
                      <small className="form-text text-muted">
                        Podés elegir varios. Para excluir productos de cualquier descuento: elegilos
                        acá, Efecto = Porcentaje 0%, y una Prioridad más alta que tus otras reglas.
                      </small>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="posicionPedido">Posición del pedido</label>
                      <select className="form-control" id="posicionPedido" name="posicionPedido" value={formData.posicionPedido} onChange={handleInputChange}>
                        <option value="">Todos</option>
                        <option value="1">Primero</option>
                        <option value="2">Segundo</option>
                        <option value="3">Tercero en adelante</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="esInvitado">Invitado</label>
                      <select className="form-control" id="esInvitado" name="esInvitado" value={formData.esInvitado} onChange={handleInputChange}>
                        <option value="">Todos</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="fechaDesde">Vigente desde</label>
                      <input type="date" className="form-control" id="fechaDesde" name="fechaDesde" value={formData.fechaDesde} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="fechaHasta">Vigente hasta</label>
                      <input type="date" className="form-control" id="fechaHasta" name="fechaHasta" value={formData.fechaHasta} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section mt-3">
              <div className="form-section-title">
                <i className="fa fa-tags mr-2"></i>
                <span>Efecto</span>
              </div>
              <div className="form-section-content">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="tipoEfecto">
                        Tipo de efecto <span style={{ color: '#F34949' }}>*</span>
                      </label>
                      <select className="form-control" id="tipoEfecto" name="tipoEfecto" value={formData.tipoEfecto} onChange={handleInputChange}>
                        <option value="Porcentaje">Porcentaje de descuento</option>
                        <option value="MontoFijo">Monto fijo</option>
                        <option value="CostoCero">Costo cero</option>
                      </select>
                    </div>
                  </div>
                  {formData.tipoEfecto !== 'CostoCero' && (
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="valorEfecto">
                          {formData.tipoEfecto === 'Porcentaje' ? 'Porcentaje (%)' : 'Monto ($)'}{' '}
                          <span style={{ color: '#F34949' }}>*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={formData.tipoEfecto === 'Porcentaje' ? '100' : undefined}
                          className="form-control"
                          id="valorEfecto"
                          name="valorEfecto"
                          value={formData.valorEfecto}
                          onChange={handleInputChange}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Leyenda de campos requeridos */}
            <div className="row mt-2">
              <div className="col-12">
                <small style={{ color: '#6c757d' }}>
                  <i className="fa fa-exclamation-triangle mr-1" style={{ color: '#ffc107' }} aria-hidden="true"></i>
                  Los campos con * son requeridos
                </small>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-12 d-flex justify-content-end">
                <button
                  type="button"
                  className="btn mr-2"
                  onClick={handleVolverALista}
                  disabled={isLoading}
                  style={{ backgroundColor: '#F34949', borderColor: '#F34949', color: 'white' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleGuardar}
                  disabled={isLoading}
                  style={{ backgroundColor: '#343A40', borderColor: '#343A40', color: 'white' }}
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

  // ===================== render: listado =====================

  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      <div className="page-title-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>
          <i className="fa fa-percentage mr-2" aria-hidden="true"></i>Reglas de Bonificación
        </h3>
        <BotonAyuda
          titulo="Manual — Reglas de Bonificación"
          contenido={MANUAL_CONTENIDO}
          nombreArchivo="manual_reglas_bonificacion.pdf"
        />
      </div>

      <div style={{ paddingTop: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '1rem' }}>
          <AgregarButton onClick={handleCrearRegla} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <Buscador filtro={filtro} setFiltro={setFiltro} placeholder="Filtrar por nombre..." />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ margin: 0, fontSize: '0.9rem', color: '#495057', whiteSpace: 'nowrap' }}>Estado:</label>
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
                minWidth: '120px',
              }}
            >
              <option value="activo">Activas</option>
              <option value="inactivo">Inactivas</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={[
            { key: 'nombre', field: 'nombre', label: 'Nombre', render: (v, r) => r.nombre || '-' },
            { key: 'prioridad', field: 'prioridad', label: 'Prioridad', align: 'center' },
            {
              key: 'turno',
              field: 'turno',
              label: 'Turno',
              render: (v, r) => (r.turnoNombres && r.turnoNombres.length > 0 ? r.turnoNombres.join(', ') : 'Todos'),
            },
            { key: 'jerarquia', field: 'jerarquia', label: 'Jerarquía', render: (v, r) => r.jerarquiaNombre || 'Todos' },
            { key: 'planta', field: 'planta', label: 'Comedor', render: (v, r) => r.plantaNombre || 'Todos' },
            {
              key: 'plato',
              field: 'plato',
              label: 'Producto',
              render: (v, r) =>
                r.platoNombres && r.platoNombres.length > 0 ? r.platoNombres.join(', ') : 'Todos',
            },
            {
              key: 'posicion',
              field: 'posicion',
              label: 'Posición',
              render: (v, r) => (r.posicionPedido ? POSICION_LABELS[r.posicionPedido] : 'Todos'),
            },
            {
              key: 'vigencia',
              field: 'vigencia',
              label: 'Vigencia',
              render: (v, r) => formatearVigencia(r.fechaDesde, r.fechaHasta),
            },
            {
              key: 'efecto',
              field: 'efecto',
              label: 'Efecto',
              render: (v, r) => (
                <span>
                  {TIPO_EFECTO_LABELS[r.tipoEfecto] || r.tipoEfecto}: <strong>{formatearEfecto(r.tipoEfecto, r.valorEfecto)}</strong>
                </span>
              ),
            },
          ]}
          data={reglas}
          isLoading={isLoading}
          emptyMessage={
            filtro
              ? 'No se encontraron reglas que coincidan con la búsqueda'
              : filtroActivo === 'activo'
              ? 'No hay reglas activas — mientras no haya reglas, todos los pedidos se cobran al 100%'
              : 'No hay reglas inactivas'
          }
          onEdit={handleEditarRegla}
          canEdit={(r) => r.activo}
          onDelete={(regla) => {
            Swal.fire({
              title: '¿Está seguro?',
              text: `¿Desea dar de baja la regla "${regla.nombre}"?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#F34949',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sí, dar de baja',
              cancelButtonText: 'Cancelar',
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await reglaBonificacionService.eliminarRegla(regla.id);
                  Swal.fire({
                    title: 'Éxito',
                    text: 'Regla dada de baja correctamente',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                  });
                  const soloActivos = filtroActivo === 'activo';
                  cargarReglas(currentPage, filtro, soloActivos);
                } catch (error) {
                  if (!error.redirectToLogin) {
                    Swal.fire({
                      title: 'Error',
                      text: error.message || 'Error al dar de baja la regla',
                      icon: 'error',
                      confirmButtonText: 'Aceptar',
                      confirmButtonColor: '#F34949',
                    });
                  }
                }
              }
            });
          }}
          canDelete={(r) => r.activo}
          renderActions={(regla) => {
            if (regla.activo) return null;
            return (
              <button
                className="btn btn-sm btn-success"
                onClick={() => {
                  Swal.fire({
                    title: '¿Está seguro?',
                    text: `¿Desea activar la regla "${regla.nombre}"?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#28a745',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, activar',
                    cancelButtonText: 'Cancelar',
                  }).then(async (result) => {
                    if (result.isConfirmed) {
                      try {
                        await reglaBonificacionService.activarRegla(regla.id);
                        Swal.fire({
                          title: 'Activada',
                          text: 'Regla activada correctamente',
                          icon: 'success',
                          timer: 3000,
                          timerProgressBar: true,
                          showConfirmButton: false,
                        });
                        const soloActivos = filtroActivo === 'activo';
                        cargarReglas(currentPage, filtro, soloActivos);
                      } catch (error) {
                        if (!error.redirectToLogin) {
                          Swal.fire({
                            title: 'Error',
                            text: error.message || 'Error al activar la regla',
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
          }}
          pageSize={pageSize}
          enablePagination={false}
        />

        {totalItems > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3 mb-4 flex-nowrap" style={{ gap: '1.5rem' }}>
            <div className="d-flex align-items-center flex-nowrap" style={{ gap: '1.25rem' }}>
              <SelectorRegistros pageSize={pageSize} opciones={opcionesPageSize} onChange={setPageSize} className="d-flex align-items-center" />
              <span className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                Mostrando página {currentPage} de {totalPages} ({totalItems} reglas)
              </span>
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    Anterior
                  </button>
                </li>
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(page)}>
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
                  <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
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

export default ReglaBonificacion;
