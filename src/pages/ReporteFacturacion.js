import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { reportesService } from '../services/reportesService';
import { catalogosService } from '../services/catalogosService';
import Swal from 'sweetalert2';
import { exportAoaToExcel } from '../utils/excelReportHeader';
import { formatearImporte } from '../utils/formatearImporte';
import './Usuarios.css';
import '../styles/smartstyle.css';

const ReporteFacturacion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isBuscando, setIsBuscando] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);

  const [plantas, setPlantas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState([]);

  const [formData, setFormData] = useState({
    fechaDesde: '',
    fechaHasta: '',
    plantaId: '',
    proyectoId: '',
    centroDeCostoId: '',
  });

  const [reporteData, setReporteData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const OPCIONES_BASE = [5, 10, 25, 50];

  const cargarCatalogos = useCallback(async () => {
    try {
      setIsLoading(true);
      const [plantasData, proyectosData, centrosData] = await Promise.all([
        catalogosService.getPlantas(),
        catalogosService.getProyectos(),
        catalogosService.getCentrosDeCosto(),
      ]);
      setPlantas(Array.isArray(plantasData) ? plantasData : []);
      setProyectos(Array.isArray(proyectosData) ? proyectosData : []);
      setCentrosDeCosto(Array.isArray(centrosData) ? centrosData : []);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los catálogos.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      fechaDesde: prev.fechaDesde || hoy,
      fechaHasta: prev.fechaHasta || hoy,
    }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    const errores = [];
    if (!formData.fechaDesde.trim()) errores.push('La fecha desde es requerida');
    if (!formData.fechaHasta.trim()) errores.push('La fecha hasta es requerida');
    if (formData.fechaDesde && formData.fechaHasta && new Date(formData.fechaDesde) > new Date(formData.fechaHasta)) {
      errores.push('La fecha desde no puede ser mayor que la fecha hasta');
    }
    if (errores.length > 0) {
      Swal.fire({
        title: 'Error de validación',
        html: '<div style="text-align: left;"><ul style="margin: 0; padding-left: 20px;">' +
              errores.map(err => `<li>${err}</li>`).join('') +
              '</ul></div>',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return false;
    }
    return true;
  };

  const detalles = useMemo(() => {
    if (!reporteData) return [];
    return Array.isArray(reporteData)
      ? reporteData
      : (reporteData.detalles || reporteData.detalle || reporteData.items || reporteData.data || []);
  }, [reporteData]);

  const totalItemsReporte = detalles.length;

  const opcionesPageSize = useMemo(() => {
    if (totalItemsReporte <= 0) return [10];
    const filtradas = OPCIONES_BASE.filter(n => n <= totalItemsReporte);
    if (!filtradas.includes(totalItemsReporte) && totalItemsReporte > 5) {
      filtradas.push(totalItemsReporte);
      filtradas.sort((a, b) => a - b);
    }
    return filtradas.length > 0 ? filtradas : [totalItemsReporte];
  }, [totalItemsReporte]);

  useEffect(() => { setCurrentPage(1); }, [reporteData]);

  useEffect(() => {
    if (totalItemsReporte <= 0) return;
    if (!opcionesPageSize.includes(pageSize) || pageSize > totalItemsReporte) {
      setPageSize(opcionesPageSize[0] ?? 10);
    }
  }, [totalItemsReporte, pageSize, opcionesPageSize]);

  const paginado = useMemo(() => {
    if (detalles.length === 0) return { items: [], totalPages: 1 };
    const start = (currentPage - 1) * pageSize;
    return {
      items: detalles.slice(start, start + pageSize),
      totalPages: Math.ceil(detalles.length / pageSize),
    };
  }, [detalles, currentPage, pageSize]);

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return '-';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return fecha;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
    } catch { return fecha; }
  };

  const formatearHora = (fecha) => {
    if (!fecha) return '-';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '-';
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    } catch { return '-'; }
  };

  const extraerCampos = (item) => {
    const fecha = item.fecha || item.Fecha;
    const legajo = item.legajo || item.Legajo || '-';
    const apellido = item.apellido || item.Apellido || '';
    const nombre = item.nombre || item.Nombre || '';
    const nombreCompleto = `${apellido} ${nombre}`.trim() || '-';
    const montoEmpleado = parseFloat(item.montoEmpleado || item.MontoEmpleado || 0);
    const montoEmpresa = parseFloat(item.montoEmpresa || item.MontoEmpresa || 0);

    return { fecha, legajo, nombreCompleto, montoEmpleado, montoEmpresa };
  };

  const handleBuscar = async () => {
    if (!validarFormulario()) return;
    try {
      setIsBuscando(true);
      const resultado = await reportesService.getReporteFacturacion(
        formData.fechaDesde || null,
        formData.fechaHasta || null,
        formData.plantaId || null,
        formData.proyectoId || null,
        formData.centroDeCostoId || null
      );
      setReporteData(resultado);
    } catch (error) {
      let msg = 'Error al buscar el reporte';
      if (error.response?.data?.error) msg = error.response.data.error;
      else if (error.response?.data?.message) msg = error.response.data.message;
      else if (error.message) msg = error.message;
      Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonText: 'Aceptar', confirmButtonColor: '#F34949' });
    } finally {
      setIsBuscando(false);
    }
  };

  const handleExportarExcel = useCallback(() => {
    if (!detalles || detalles.length === 0) {
      Swal.fire({ title: 'Error', text: 'No hay datos para exportar', icon: 'error', confirmButtonText: 'Aceptar', confirmButtonColor: '#F34949' });
      return;
    }
    try {
      const periodo = `${formatearFechaCorta(formData.fechaDesde)} - ${formatearFechaCorta(formData.fechaHasta)}`;

      let totalEmpleado = 0;
      let totalEmpresa = 0;

      const filas = detalles.map(item => {
        const c = extraerCampos(item);
        totalEmpleado += c.montoEmpleado;
        totalEmpresa += c.montoEmpresa;
        return [
          c.legajo,
          c.nombreCompleto,
          formatearFechaCorta(c.fecha),
          formatearHora(c.fecha),
          formatearImporte(c.montoEmpleado),
          formatearImporte(c.montoEmpresa),
        ];
      });

      const aoa = [
        [],
        [`Período: ${periodo}`],
        [],
        ['Nro. Legajo', 'Apellido y Nombre', 'Fecha', 'Hora', 'Monto Empleado', 'Monto Empresa'],
        ...filas,
        [],
        ['', '', '', 'TOTALES', formatearImporte(totalEmpleado), formatearImporte(totalEmpresa)],
      ];

      const fechaArchivo = new Date().toISOString().split('T')[0];
      exportAoaToExcel(aoa, 'Reporte de Facturación', `reporte_facturacion_${fechaArchivo}.xlsx`);

      Swal.fire({ title: 'Éxito', text: 'Reporte exportado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ title: 'Error', text: error.message || 'Error al exportar', icon: 'error', confirmButtonText: 'Aceptar', confirmButtonColor: '#F34949' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalles, formData]);

  // Totales para el resumen
  const resumen = useMemo(() => {
    let totalEmpleado = 0;
    let totalEmpresa = 0;
    detalles.forEach(item => {
      const c = extraerCampos(item);
      totalEmpleado += c.montoEmpleado;
      totalEmpresa += c.montoEmpresa;
    });
    return { totalEmpleado, totalEmpresa, cantidad: detalles.length };
  }, [detalles]);

  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      <div className="page-title-bar">
        <h3>
          <i className="fa fa-file-invoice-dollar mr-2" aria-hidden="true"></i>
          Reporte de Facturación
        </h3>
      </div>

      <div className="container-fluid" style={{ backgroundColor: 'white', padding: '2rem 3rem', minHeight: 'calc(100vh - 200px)' }}>
        <div className="usuarios-form-container" style={{ maxWidth: '95%', width: '100%', margin: '0 auto' }}>
          <form>
            <div className="form-section" style={{ marginBottom: '2rem' }}>
              <div
                className="page-title-bar"
                style={{
                  marginBottom: filtrosAbiertos ? '0' : '1.5rem',
                  borderRadius: filtrosAbiertos ? '0.5rem 0.5rem 0 0' : '0.5rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFiltrosAbiertos(!filtrosAbiertos); } }}
                aria-expanded={filtrosAbiertos}
              >
                <h3 style={{ margin: 0, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <i className="fa fa-filter mr-2" aria-hidden="true"></i>
                    Filtros de búsqueda
                  </span>
                  <i className={`fa ${filtrosAbiertos ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" style={{ fontSize: '0.9rem', marginLeft: '1rem', transition: 'transform 0.3s ease' }}></i>
                </h3>
              </div>
              {filtrosAbiertos && (
                <div className="form-section-content" style={{ border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 0.5rem 0.5rem', backgroundColor: 'white', padding: '1.5rem 2rem', overflow: 'visible' }}>
                  <div className="row" style={{ marginLeft: 0, marginRight: 0 }}>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="fechaDesde">Fecha desde</label>
                        <input type="date" className="form-control" id="fechaDesde" name="fechaDesde" value={formData.fechaDesde || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="fechaHasta">Fecha hasta</label>
                        <input type="date" className="form-control" id="fechaHasta" name="fechaHasta" value={formData.fechaHasta || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="form-group">
                        <label htmlFor="plantaId">Planta</label>
                        <select className="form-control" id="plantaId" name="plantaId" value={formData.plantaId || ''} onChange={handleInputChange} disabled={isLoading}>
                          <option value="">-- Todas --</option>
                          {plantas.map(p => {
                            const id = p.id || p.Id || p.ID;
                            return <option key={id} value={id}>{p.nombre || p.Nombre || 'Sin nombre'}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="form-group">
                        <label htmlFor="centroDeCostoId">Centro de Costo</label>
                        <select className="form-control" id="centroDeCostoId" name="centroDeCostoId" value={formData.centroDeCostoId || ''} onChange={handleInputChange} disabled={isLoading}>
                          <option value="">-- Todos --</option>
                          {centrosDeCosto.map(c => {
                            const id = c.id || c.Id || c.ID;
                            return <option key={id} value={id}>{c.nombre || c.Nombre || 'Sin nombre'}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="form-group">
                        <label style={{ visibility: 'hidden' }}>Buscar</label>
                        <button type="button" className="btn" onClick={handleBuscar} disabled={isBuscando || isLoading} style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: 'white', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', width: '100%' }}>
                          {isBuscando ? (<><span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>Buscando...</>) : (<><i className="fa fa-search mr-2"></i>Buscar</>)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          {reporteData !== null && (
            <div className="form-section" style={{ marginTop: '3rem' }}>
              {/* Resumen */}
              <div className="form-section" style={{ marginBottom: '2rem' }}>
                <div className="page-title-bar" style={{ marginBottom: '0', borderRadius: '0.5rem 0.5rem 0 0' }}>
                  <h3 style={{ margin: 0, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center' }}>
                    <i className="fa fa-chart-bar mr-2" aria-hidden="true"></i>
                    Resumen
                  </h3>
                </div>
                <div className="form-section-content" style={{ padding: '1.5rem', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 0.5rem 0.5rem', backgroundColor: 'white', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '0.5rem' }}>{resumen.cantidad}</div>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Consumos</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545', marginBottom: '0.5rem' }}>{formatearImporte(resumen.totalEmpleado)}</div>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total a facturar al empleado</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>{formatearImporte(resumen.totalEmpresa)}</div>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total a cargo de la empresa</div>
                  </div>
                </div>
              </div>

              {/* Detalle */}
              <div className="form-section">
                <div className="page-title-bar" style={{ marginBottom: '0', borderRadius: '0.5rem 0.5rem 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, padding: '0.75rem 1.5rem', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <i className="fa fa-table mr-2" aria-hidden="true"></i>
                    Detalle de Facturación
                  </h3>
                  {detalles.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                      <button type="button" className="btn" onClick={handleExportarExcel} style={{ backgroundColor: '#28a745', border: 'none', color: 'white', padding: '0.5rem 1rem', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.25rem' }} title="Exportar a Excel" onMouseEnter={(e) => { e.target.style.backgroundColor = '#218838'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#28a745'; }}>
                        <i className="fa fa-file-excel"></i>
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-section-content" style={{ padding: '0', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 0.5rem 0.5rem', backgroundColor: 'white', overflowX: 'auto' }}>
                  {detalles.length === 0 ? (
                    <div className="alert alert-info text-center" style={{ margin: '1.5rem' }}>
                      <i className="fa fa-info-circle mr-2"></i>
                      No hay datos registrados para el reporte
                    </div>
                  ) : (
                    <table className="table table-striped table-hover" style={{ margin: 0 }}>
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th style={{ whiteSpace: 'nowrap' }}>Nro. Legajo</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Apellido y Nombre</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Fecha</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Hora</th>
                          <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Monto Empleado</th>
                          <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Monto Empresa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginado.items.map((item, index) => {
                          const c = extraerCampos(item);
                          return (
                            <tr key={index}>
                              <td>{c.legajo}</td>
                              <td>{c.nombreCompleto}</td>
                              <td style={{ whiteSpace: 'nowrap' }}>{formatearFechaCorta(c.fecha)}</td>
                              <td style={{ whiteSpace: 'nowrap' }}>{formatearHora(c.fecha)}</td>
                              <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatearImporte(c.montoEmpleado)}</td>
                              <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatearImporte(c.montoEmpresa)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {detalles.length > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-3 mb-4 flex-nowrap" style={{ gap: '1.5rem', padding: '1rem 1.5rem' }}>
                      <div className="d-flex align-items-center flex-nowrap" style={{ gap: '1.25rem' }}>
                        <label className="d-flex align-items-center gap-2 mb-0" style={{ whiteSpace: 'nowrap' }}>
                          <span className="text-muted small">Registros a mostrar:</span>
                          <select className="form-control form-control-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ width: 'auto', minWidth: '70px' }}>
                            {opcionesPageSize.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </label>
                        <span className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                          Mostrando página {currentPage} de {paginado.totalPages} ({detalles.length} registros)
                        </span>
                      </div>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</button>
                          </li>
                          {[...Array(paginado.totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (page === 1 || page === paginado.totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                              return (
                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                  <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                </li>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return <li key={page} className="page-item disabled"><span className="page-link">...</span></li>;
                            }
                            return null;
                          })}
                          <li className={`page-item ${currentPage === paginado.totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(p => Math.min(paginado.totalPages, p + 1))} disabled={currentPage === paginado.totalPages}>Siguiente</button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporteFacturacion;
