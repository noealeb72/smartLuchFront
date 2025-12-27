// src/pages/MenuDelDia.js
import React, { useState, useEffect, useCallback } from 'react';
import { menuService } from '../services/menuService';
import { catalogosService } from '../services/catalogosService';
import { turnosService } from '../services/turnosService';
import { platosService } from '../services/platosService';
import Swal from 'sweetalert2';
import AgregarButton from '../components/AgregarButton';
import Buscador from '../components/Buscador';
import DataTable from '../components/DataTable';
import './Usuarios.css';

const MenuDelDia = () => {
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const [vista, setVista] = useState('lista'); // 'lista' | 'editar' | 'crear'

  // Catálogos
  const [turnos, setTurnos] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [jerarquias, setJerarquias] = useState([]);
  const [planesNutricionales, setPlanesNutricionales] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState([]);
  const [plantas, setPlantas] = useState([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
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
    fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    activo: true,
  });

  // ===================== carga datos =====================

  const cargarCatalogos = useCallback(async () => {
    try {
      const [
        turnosData,
        platosData,
        jerarquiasData,
        planesData,
        proyectosData,
        centrosData,
        plantasData,
      ] = await Promise.all([
        turnosService.getTurnosDisponibles(),
        platosService.obtenerPlatosLista(1, 1000, '', true), // Obtener todos los platos activos
        catalogosService.getJerarquias(),
        catalogosService.getPlanesNutricionales(),
        catalogosService.getProyectos(),
        catalogosService.getCentrosDeCosto(),
        catalogosService.getPlantas(),
      ]);

      setTurnos(Array.isArray(turnosData) ? turnosData : []);
      setPlatos(Array.isArray(platosData) ? (platosData.items || platosData.data || platosData) : []);
      setJerarquias(Array.isArray(jerarquiasData) ? jerarquiasData : []);
      setPlanesNutricionales(Array.isArray(planesData) ? planesData : []);
      setProyectos(Array.isArray(proyectosData) ? proyectosData : []);
      setCentrosDeCosto(Array.isArray(centrosData) ? centrosData : []);
      setPlantas(Array.isArray(plantasData) ? plantasData : []);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  }, []);

  const cargarMenus = useCallback(
    async (page = 1, searchTerm = '') => {
      try {
        setIsLoading(true);
        const filtros = {
          activo: soloActivos,
        };

        if (searchTerm && searchTerm.trim()) {
          // Si hay búsqueda, podría filtrar por platoId si el término es un ID
          const platoEncontrado = platos.find(
            (p) =>
              (p.descripcion || p.Descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (p.codigo || p.Codigo || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (platoEncontrado) {
            filtros.platoId = platoEncontrado.id || platoEncontrado.Id;
          }
        }

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
    [pageSize, soloActivos, platos]
  );

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    if (platos.length > 0) {
      cargarMenus(currentPage, filtro);
    }
  }, [currentPage, filtro, soloActivos, cargarMenus, platos.length]);

  // ===================== handlers =====================

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCrearMenu = () => {
    setVista('crear');
    setFormData({
      id: null,
      platoId: '',
      turnoId: '',
      jerarquiaId: '',
      plannutricional_id: '',
      proyectoId: '',
      centroCostoId: '',
      plantaId: '',
      cantidad: '1',
      fecha: new Date().toISOString().split('T')[0],
      activo: true,
    });
  };

  const handleEditarMenu = async (menu) => {
    try {
      setIsLoading(true);
      const menuCompleto = await menuService.getPorId(menu.id || menu.Id || menu.ID);
      
      setFormData({
        id: menuCompleto.id || menuCompleto.Id || menuCompleto.ID,
        platoId: menuCompleto.platoId || menuCompleto.PlatoId || menuCompleto.plato_id || '',
        turnoId: menuCompleto.turnoId || menuCompleto.TurnoId || menuCompleto.turno_id || '',
        jerarquiaId: menuCompleto.jerarquiaId || menuCompleto.JerarquiaId || menuCompleto.jerarquia_id || '',
        plannutricional_id: menuCompleto.plannutricional_id || menuCompleto.Plannutricional_id || menuCompleto.planNutricionalId || '',
        proyectoId: menuCompleto.proyectoId || menuCompleto.ProyectoId || menuCompleto.proyecto_id || '',
        centroCostoId: menuCompleto.centroCostoId || menuCompleto.CentroCostoId || menuCompleto.centro_costo_id || '',
        plantaId: menuCompleto.plantaId || menuCompleto.PlantaId || menuCompleto.planta_id || '',
        cantidad: menuCompleto.cantidad || menuCompleto.Cantidad || menuCompleto.Cant || '',
        fecha: menuCompleto.fecha 
          ? (menuCompleto.fecha.split('T')[0] || menuCompleto.fecha.split(' ')[0])
          : new Date().toISOString().split('T')[0],
        activo: menuCompleto.activo !== undefined ? menuCompleto.activo : menuCompleto.Activo !== undefined ? menuCompleto.Activo : true,
      });
      
      setVista('editar');
    } catch (error) {
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
    cargarMenus(currentPage, filtro);
  };

  const handleGuardar = async () => {
    try {
      // Validaciones
      if (!formData.platoId) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar un plato',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!formData.turnoId) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar un turno',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!formData.cantidad || parseFloat(formData.cantidad) <= 0) {
        Swal.fire({
          title: 'Error',
          text: 'La cantidad debe ser mayor a 0',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!formData.fecha) {
        Swal.fire({
          title: 'Error',
          text: 'Debe seleccionar una fecha',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      setIsLoading(true);

      const menuData = {
        PlatoId: parseInt(formData.platoId),
        TurnoId: parseInt(formData.turnoId),
        JerarquiaId: formData.jerarquiaId ? parseInt(formData.jerarquiaId) : null,
        Plannutricional_id: formData.plannutricional_id ? parseInt(formData.plannutricional_id) : null,
        ProyectoId: formData.proyectoId ? parseInt(formData.proyectoId) : null,
        CentroCostoId: formData.centroCostoId ? parseInt(formData.centroCostoId) : null,
        PlantaId: formData.plantaId ? parseInt(formData.plantaId) : null,
        Cantidad: parseInt(formData.cantidad),
        Fecha: formData.fecha,
      };

      if (vista === 'editar') {
        menuData.Id = parseInt(formData.id);
        await menuService.actualizarMenu(menuData);
        Swal.fire({
          title: 'Éxito',
          text: 'Menú del día actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      } else {
        await menuService.crearMenu(menuData);
        Swal.fire({
          title: 'Éxito',
          text: 'Menú del día creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
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

          {/* Filtros */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Buscador
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrar por plato, turno..."
            />

            {/* Checkbox de menús activos */}
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
                {soloActivos ? 'Menús activos' : 'Menús de baja'}
              </label>
            </div>
          </div>

          {/* Tabla */}
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
                key: 'plannutricional',
                field: 'plannutricional',
                label: 'Plan Nutricional',
                render: (v, row) => {
                  const planNombre =
                    row.plannutricionalNombre ||
                    row.PlannutricionalNombre ||
                    row.plan_nutricional_nombre ||
                    planesNutricionales.find((p) => (p.id || p.Id) === (row.plannutricional_id || row.Plannutricional_id))?.nombre ||
                    planesNutricionales.find((p) => (p.id || p.Id) === (row.plannutricional_id || row.Plannutricional_id))?.Nombre ||
                    row.planNutricional?.nombre ||
                    row.PlanNutricional?.Nombre ||
                    '-';
                  return planNombre;
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
                key: 'estado',
                field: 'estado',
                label: 'Estado',
                render: (v, row) => {
                  const activo = row.activo !== undefined ? row.activo : row.Activo !== undefined ? row.Activo : true;
                  return (
                    <span
                      className={`badge ${activo ? 'badge-success' : 'badge-secondary'}`}
                      style={{
                        backgroundColor: activo ? '#28A745' : '#6C757D',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  );
                },
              },
              {
                key: 'cantidad',
                field: 'cantidad',
                label: 'Cantidad',
                render: (v, row) => row.cantidad || row.Cantidad || row.Cant || 0,
              },
              {
                key: 'fecha',
                field: 'fecha',
                label: 'Fecha',
                render: (v, row) => {
                  const fecha = row.fecha || row.Fecha;
                  if (!fecha) return '-';
                  // Formatear fecha a DD/MM/YYYY
                  try {
                    const date = new Date(fecha);
                    return date.toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });
                  } catch {
                    return fecha.split('T')[0] || fecha.split(' ')[0] || fecha;
                  }
                },
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
                    cargarMenus(currentPage, filtro);
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
                    <label htmlFor="plannutricional_id" style={{ marginBottom: '0.25rem' }}>Plan Nutricional</label>
                    <select
                      className="form-control"
                      id="plannutricional_id"
                      name="plannutricional_id"
                      value={formData.plannutricional_id || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione un plan nutricional</option>
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
                </div>
                <div className="col-md-5">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="platoId" style={{ marginBottom: '0.25rem' }}>
                      Plato <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      id="platoId"
                      name="platoId"
                      value={formData.platoId || ''}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccione un plato</option>
                      {platos.map((plato) => {
                        const platoId = plato.id || plato.Id || plato.ID;
                        const platoNombre = plato.descripcion || plato.Descripcion || plato.nombre || plato.Nombre || '';
                        return (
                          <option key={platoId} value={String(platoId)}>
                            {platoNombre}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="col-md-2">
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
                        if (!valor || valor === '0' || parseFloat(valor) <= 0) {
                          setFormData((prev) => ({
                            ...prev,
                            cantidad: '1',
                          }));
                        }
                      }}
                      required
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>
                <div className="col-md-2">
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
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-2">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="jerarquiaId" style={{ marginBottom: '0.25rem' }}>Jerarquía</label>
                    <select
                      className="form-control"
                      id="jerarquiaId"
                      name="jerarquiaId"
                      value={formData.jerarquiaId || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione una jerarquía</option>
                      {jerarquias.map((jerarquia) => {
                        const jerarquiaId = jerarquia.id || jerarquia.Id || jerarquia.ID;
                        const jerarquiaNombre = jerarquia.nombre || jerarquia.Nombre || '';
                        return (
                          <option key={jerarquiaId} value={String(jerarquiaId)}>
                            {jerarquiaNombre}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="turnoId" style={{ marginBottom: '0.25rem' }}>
                      Turno <span style={{ color: '#F34949' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      id="turnoId"
                      name="turnoId"
                      value={formData.turnoId || ''}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccione un turno</option>
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
                </div>
                <div className="col-md-2">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="proyectoId" style={{ marginBottom: '0.25rem' }}>Proyecto</label>
                    <select
                      className="form-control"
                      id="proyectoId"
                      name="proyectoId"
                      value={formData.proyectoId || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione un proyecto</option>
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
                </div>
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="centroCostoId" style={{ marginBottom: '0.25rem' }}>Centro de costo</label>
                    <select
                      className="form-control"
                      id="centroCostoId"
                      name="centroCostoId"
                      value={formData.centroCostoId || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione un centro de costo</option>
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
                </div>
                <div className="col-md-3">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor="plantaId" style={{ marginBottom: '0.25rem' }}>Planta</label>
                    <select
                      className="form-control"
                      id="plantaId"
                      name="plantaId"
                      value={formData.plantaId || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione una planta</option>
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
