import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MenuItem from '../components/MenuItem';
import PedidoVigente from '../components/PedidoVigente';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';
import { apiService } from '../services/apiService';
import Swal from 'sweetalert2';
import './Index.css';
import '../styles/smartstyle.css';

const Index = () => {
  const { user } = useAuth();
  const { turnos, pedidosHoy, loading: dashboardLoading, error: dashboardError, recargar: recargarDashboard } = useDashboard();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [pedidosVigentes, setPedidosVigentes] = useState(pedidosHoy);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [pedidoComentario, setPedidoComentario] = useState('');
  const [pedidoCalificacion, setPedidoCalificacion] = useState(1);
  const [bonificacionDisponible, setBonificacionDisponible] = useState(false);
  const [cantidadBonificacionesHoy, setCantidadBonificacionesHoy] = useState(0);
  const [porcentajeBonificacion, setPorcentajeBonificacion] = useState(0);
  const [pedidosRestantes, setPedidosRestantes] = useState(0);
  const [turnoDisponible, setTurnoDisponible] = useState(true);
  const defaultImage = '/Views/img/logo-preview.png';

  // Sincronizar pedidosHoy del contexto con el estado local
  useEffect(() => {
    setPedidosVigentes(pedidosHoy);
  }, [pedidosHoy]);

  // Mostrar error del dashboard si ocurre
  useEffect(() => {
    if (dashboardError) {
      console.error('Error del dashboard:', dashboardError);
      Swal.fire({
        title: 'Error al cargar datos',
        text: dashboardError,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
    }
  }, [dashboardError]);

  // Seleccionar primer turno si hay turnos disponibles y no hay uno seleccionado
  useEffect(() => {
    if (turnos.length > 0 && !selectedTurno) {
      setSelectedTurno(turnos[0]);
    }
    
    if (turnos.length === 0) {
      setTurnoDisponible(false);
    } else {
      setTurnoDisponible(true);
    }
  }, [turnos, selectedTurno]);

  const verificarBonificacionHoy = useCallback(() => {
    const hoy = new Date().toISOString().split('T')[0];
    const bonificacionHoy = localStorage.getItem(`bonificacion_${hoy}`);
    if (bonificacionHoy === 'true') {
      setCantidadBonificacionesHoy(1);
      setPedidosRestantes(0);
    } else {
      setCantidadBonificacionesHoy(0);
    }
  }, []);

  const inicializarBonificaciones = useCallback(() => {
    const bonificacion = user?.bonificacion;
    if (bonificacion && bonificacion !== 'null' && bonificacion !== 'undefined') {
      try {
        const bonifData = JSON.parse(bonificacion);
        setBonificacionDisponible(true);
        setPorcentajeBonificacion(bonifData.porcentaje || 0);
        setPedidosRestantes(bonifData.cantidad || 0);
      } catch (e) {
        console.error('Error parseando bonificación:', e);
      }
    }
    verificarBonificacionHoy();
  }, [user?.bonificacion, verificarBonificacionHoy]);

  useEffect(() => {
    inicializarBonificaciones();
  }, [inicializarBonificaciones]);

  useEffect(() => {
    if (selectedTurno) {
      cargarMenu();
    }
  }, [selectedTurno]); // eslint-disable-line react-hooks/exhaustive-deps


  const cargarMenu = useCallback(async () => {
    if (!selectedTurno) return;

    try {
      setIsLoading(true);
      
      // Obtener el ID del turno seleccionado
      const turnoId = selectedTurno.id || selectedTurno.Id || selectedTurno.ID;
      
      if (!turnoId) {
        console.error('El turno seleccionado no tiene ID');
        setMenuItems([]);
        return;
      }

      // Opcional: pasar fecha si se necesita (por defecto es hoy)
      // const fecha = new Date().toISOString().split('T')[0]; // formato: YYYY-MM-DD
      
      const data = await apiService.getMenuDelDia(turnoId);

      if (Array.isArray(data)) {
        // Procesar datos del menú de forma optimizada
        const platosMap = new Map();
        const platos = [];

        for (const menuItem of data) {
          const codigo = menuItem.codigo || menuItem.cod_plato || menuItem.Codigo || menuItem.Cod_Plato;
          if (!codigo || platosMap.has(codigo)) continue;

          platosMap.set(codigo, true);

          const plato = {
            codigo: codigo,
            descripcion: menuItem.descripcion || menuItem.Descripcion || menuItem.plato || menuItem.Plato || 'Sin descripción',
            costo: parseFloat(menuItem.costo || menuItem.Costo || menuItem.monto || menuItem.Monto || 0) || 0,
            plannutricional: menuItem.plannutricional || menuItem.PlanNutricional || menuItem.plan_nutricional || null,
            presentacion: menuItem.presentacion || menuItem.Presentacion || menuItem.imagen || menuItem.Imagen || defaultImage,
            ingredientes: menuItem.ingredientes || menuItem.Ingredientes || menuItem.ingrediente || menuItem.Ingrediente || null,
            cantidadDisponible: menuItem.cantidad_disponible !== undefined ? parseInt(menuItem.cantidad_disponible) : 0,
            aplicarBonificacion: false,
            precioFinal: parseFloat(menuItem.costo || menuItem.Costo || menuItem.monto || menuItem.Monto || 0) || 0,
          };

          platos.push(plato);
        }

        setMenuItems(platos);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error al cargar menú:', error);
      // Si hay error de conexión, el interceptor ya redirige automáticamente
      if (!error.redirectToLogin) {
        const errorMessage = error.message || 'Error al cargar el menú del día';
        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTurno, defaultImage]);


  const calcularPrecioConBonificacion = useCallback((precio, aplicar) => {
    if (!aplicar || !bonificacionDisponible || cantidadBonificacionesHoy >= 1) {
      return { precioFinal: precio, bonificado: 0 };
    }

    const descuento = (precio * porcentajeBonificacion) / 100;
    return {
      precioFinal: precio - descuento,
      bonificado: descuento,
    };
  }, [bonificacionDisponible, cantidadBonificacionesHoy, porcentajeBonificacion]);

  const aplicarBonificacion = useCallback((item, aplicar) => {
    const calculo = calcularPrecioConBonificacion(item.costo, aplicar);
    setMenuItems((prevItems) =>
      prevItems.map((menuItem) =>
        menuItem.codigo === item.codigo
          ? {
              ...menuItem,
              precioFinal: calculo.precioFinal,
              bonificado: calculo.bonificado,
              aplicarBonificacion: aplicar,
            }
          : menuItem
      )
    );
  }, [calcularPrecioConBonificacion]);

  const hacerPedido = useCallback((item) => {
    if (!selectedTurno) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha seleccionado un turno válido.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    // Verificar si ya tiene pedido en el mismo turno
    const fechaHoy = new Date().toISOString().split('T')[0];
    const turnoActual = selectedTurno.nombre || selectedTurno.Nombre || selectedTurno.descripcion || selectedTurno.Descripcion;
    
    const pedidoMismoTurno = pedidosVigentes.find((pedido) => {
      if (!pedido.user_Pedido) return false;
      const fechaPedido = pedido.user_Pedido.fecha_hora 
        ? new Date(pedido.user_Pedido.fecha_hora).toISOString().split('T')[0]
        : null;
      return fechaPedido === fechaHoy;
    });

    if (pedidoMismoTurno) {
      Swal.fire({
        title: 'Ya tienes un pedido en este turno',
        text: 'No es posible hacer más de un pedido en el mismo turno del mismo día.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    setPedidoSeleccionado(item);
    setShowConfirmModal(true);
  }, [selectedTurno, pedidosVigentes]);

  const confirmaPedido = useCallback(async () => {
    if (!pedidoSeleccionado) return;

    try {
      const ahora = new Date();
      const dia = ahora.getDay();
      const mes = ahora.getMonth();
      const anio = ahora.getFullYear();
      const hora = ahora.getHours();
      const minuto = ahora.getMinutes();
      const fecha = `${hora}:${minuto} ${dia}/${mes}/${anio}`;

      const jsonForm = {
        cod_plato: pedidoSeleccionado.codigo,
        monto: pedidoSeleccionado.precioFinal || pedidoSeleccionado.costo,
        estado: 'P',
        calificacion: 1,
        planta: user?.planta,
        proyecto: user?.proyecto,
        centrodecosto: user?.centrodecosto,
        user_id: user?.dni,
        user_name: user?.nombre,
        user_lastName: user?.apellido,
        user_fileNumber: user?.legajo,
        invitado: false,
        comentario: pedidoComentario,
        fecha_hora: fecha,
        precio_original: pedidoSeleccionado.costo,
        bonificado: pedidoSeleccionado.bonificado || 0,
        porcentaje_bonificacion: porcentajeBonificacion,
        aplicar_bonificacion: !!pedidoSeleccionado.aplicarBonificacion,
      };

      await apiService.crearPedido(jsonForm);

      // Consumir bonificación si aplica
      if (pedidoSeleccionado.aplicarBonificacion && bonificacionDisponible && cantidadBonificacionesHoy < 1) {
        const hoy = new Date().toISOString().split('T')[0];
        localStorage.setItem(`bonificacion_${hoy}`, 'true');
        setCantidadBonificacionesHoy(1);
        setPedidosRestantes(0);
      }

      Swal.fire({
        title: '¡Pedido Enviado!',
        text: '',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => {
        setShowConfirmModal(false);
        setPedidoComentario('');
        // Recargar datos del dashboard (pedidos y menú si hay turno seleccionado)
        recargarDashboard();
        if (selectedTurno) {
          cargarMenu();
        }
      });
    } catch (error) {
      // Si hay error de conexión, el interceptor ya redirige automáticamente
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Operación Incorrecta',
          text: error.message || 'Error al crear el pedido',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    }
  }, [pedidoSeleccionado, user, pedidoComentario, bonificacionDisponible, cantidadBonificacionesHoy, porcentajeBonificacion, selectedTurno, recargarDashboard, cargarMenu]);

  const actualizaPedido = useCallback(async (nuevoEstado) => {
    if (!pedidoSeleccionado || !pedidoSeleccionado.user_Pedido) {
      Swal.fire({
        title: 'Error',
        text: 'No hay un pedido seleccionado.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      });
      return;
    }

    try {
      await apiService.actualizarPedido(
        pedidoSeleccionado.user_Pedido.id,
        nuevoEstado,
        pedidoCalificacion,
        ''
      );

      Swal.fire({
        title: 'Operación correcta',
        text: '',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#F34949',
      }).then(() => {
        setShowCancelModal(false);
        setShowReceiveModal(false);
        setPedidoCalificacion(1);
        // Recargar datos del dashboard (pedidos y menú si hay turno seleccionado)
        recargarDashboard();
        if (selectedTurno) {
          cargarMenu();
        }
      });
    } catch (error) {
      // Si hay error de conexión, el interceptor ya redirige automáticamente
      if (!error.redirectToLogin) {
        Swal.fire({
          title: 'Operación Incorrecta',
          text: error.message || 'Error al actualizar el pedido',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      }
    }
  }, [pedidoSeleccionado, pedidoCalificacion, selectedTurno, recargarDashboard, cargarMenu]);

  const onTurnoChanged = useCallback((e) => {
    const turnoId = parseInt(e.target.value);
    const turnoSeleccionado = turnos.find(t => (t.id || t.Id || t.ID) === turnoId);
    if (turnoSeleccionado) {
      setSelectedTurno(turnoSeleccionado);
      setMenuItems([]); // Limpiar menú anterior mientras carga el nuevo
      // El useEffect se encargará de cargar el menú cuando cambie selectedTurno
    }
  }, [turnos]);

  // Memoizar handlers para evitar recrearlos
  const handleCancelarPedido = useCallback((pedido) => {
    setPedidoSeleccionado(pedido);
    setShowCancelModal(true);
  }, []);

  const handleRecibirPedido = useCallback((pedido) => {
    setPedidoSeleccionado(pedido);
    setShowReceiveModal(true);
  }, []);

  // Memoizar valores calculados
  const fechaHoy = useMemo(() => {
    const ahora = new Date();
    return ahora.getFullYear() + '-' +
      String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
      String(ahora.getDate()).padStart(2, '0');
  }, []);

  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      {isLoading && (
        <div className="se-pre-con">
          <span className="sr-only">Cargando contenido, por favor espere...</span>
        </div>
      )}

      <section id="gtco-welcome" className="bg-white section-padding" aria-live="polite">
          <div className="container">
            <div className="section-content">
              <div className="row">
                {/* Bienvenida - Desktop */}
                <div className="container-fluid mt-4 pr-0 mr-0 row ocultar-en-movil">
                  <div className="col-sm-6 col-12 bienvenida">
                    <h3>
                      Bienvenido {user?.nombre} {user?.apellido}
                    </h3>
                    {bonificacionDisponible && turnoDisponible && menuItems.length > 0 && (
                      <h5 style={{ color: '#6c757d' }}>
                        {pedidosRestantes === 0 && 'Te quedan 0 platos bonificados el día de hoy'}
                        {pedidosRestantes === 1 && 'Te queda 1 plato bonificado el día de hoy'}
                      </h5>
                    )}
                  </div>

                  <div className="col-sm-6 pr-0 d-flex align-items-end">
                    <label className="col-6 text-right mb-0" htmlFor="turno">
                      Ver opciones para turno:
                    </label>

                    {turnos.length > 0 ? (
                      <select
                        id="turno"
                        className="form-control"
                        value={selectedTurno?.id || ''}
                        onChange={onTurnoChanged}
                      >
                        {turnos.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre || t.Nombre || t.descripcion || t.Descripcion}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted ml-2">Sin turnos disponibles para hoy.</span>
                    )}
                  </div>
                </div>

                {/* Bienvenida - Mobile */}
                <div className="container-fluid mt-4 pr-0 mr-0 row d-block d-md-none">
                  <div className="col-sm-12 bienvenida">
                    <h3>
                      <i className="lnr lnr-user"></i> Bienvenido {user?.nombre} {user?.apellido}
                    </h3>
                    {bonificacionDisponible && turnoDisponible && menuItems.length > 0 && (
                      <h5 style={{ color: '#6c757d' }}>
                        <i className="lnr lnr-dinner"></i>&nbsp;&nbsp;
                        Te quedan {pedidosRestantes} {pedidosRestantes === 1 ? 'plato bonificado' : 'platos bonificados'}
                      </h5>
                    )}
                  </div>

                  <div className="col-sm-12 pr-0 d-flex flex-column align-items-start">
                    <label className="w-100 text-left mb-1" htmlFor="selectedTurno" style={{ margin: 0, padding: 0 }}>
                      Ver opciones para turno:
                    </label>

                    {turnos.length > 0 ? (
                      <select
                        className="form-control"
                        id="selectedTurno"
                        value={selectedTurno?.id || ''}
                        onChange={onTurnoChanged}
                      >
                        {turnos.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre || t.Nombre || t.descripcion || t.Descripcion}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted mt-1">Sin turnos disponibles para hoy.</span>
                    )}
                  </div>
                </div>

                {/* Imagen decorativa - Desktop */}
                <div className="col-sm-4 pt-5 imagen-escondida">
                  <img className="sticky-image rised-image w-100" src="/Views/img/hero-2.jpg" alt="Imagen decorativa de comida" />
                </div>

                {/* Contenido principal */}
                <div className="col-12 col-md-8 pt-3 mx-auto">
                  <h4 className="mt-4 text-danger">Tu próximo pedido reservado</h4>

                  {pedidosVigentes.length === 0 ? (
                    <div className="card mt-2 pl-2" role="status" aria-live="polite">
                      <div className="card-body text-center py-4">
                        <h5 className="text-muted">No hay pedidos vigentes</h5>
                        <p className="text-muted mb-0">No tienes pedidos pendientes de recibir o cancelar en este momento.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="card mt-2 pl-2">
                      {pedidosVigentes.map((pedido, index) => (
                        <PedidoVigente
                          key={pedido.user_npedido || pedido.user_Pedido?.id || index}
                          pedido={pedido}
                          index={index}
                          defaultImage={defaultImage}
                          onCancelar={handleCancelarPedido}
                          onRecibir={handleRecibirPedido}
                          isLast={index === pedidosVigentes.length - 1}
                        />
                      ))}
                    </div>
                  )}

                  {turnoDisponible && (
                    <>
                      <h4 className="mt-4" style={{ color: '#343a40' }}>Menú del día</h4>
                      {!isLoading && menuItems.length === 0 && (
                        <div className="alert alert-warning mt-3" role="alert" aria-live="polite">
                          No hay platos disponibles para este turno.
                        </div>
                      )}
                      {menuItems.map((item, index) => (
                        <MenuItem
                          key={item.codigo || index}
                          item={item}
                          index={index}
                          defaultImage={defaultImage}
                          bonificacionDisponible={bonificacionDisponible}
                          cantidadBonificacionesHoy={cantidadBonificacionesHoy}
                          porcentajeBonificacion={porcentajeBonificacion}
                          turnoDisponible={turnoDisponible}
                          onHacerPedido={hacerPedido}
                          onAplicarBonificacion={aplicarBonificacion}
                        />
                      ))}
                    </>
                  )}

                  {!turnoDisponible && (
                    <div>
                      <h4 style={{ color: '#6c757d' }}>Menú del día</h4>
                      <p className="text-muted">Sin turnos no hay menú.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Modales */}
        {/* Modal Confirmar Pedido */}
        {showConfirmModal && pedidoSeleccionado && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: '#343a40', color: 'white', padding: '10px 15px' }}>
                  <h5 className="modal-title" style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: 500 }}>
                    Confirmar pedido
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPedidoComentario('');
                    }}
                    style={{ color: 'white' }}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body row">
                  <div className="col-8 pl-4">
                    <div className="container row d-flex align-items-start">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        Plato
                      </span>
                      <span style={{ wordWrap: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                        {pedidoSeleccionado.descripcion}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Importe</span>
                      {pedidoSeleccionado.aplicarBonificacion && bonificacionDisponible && cantidadBonificacionesHoy < 1 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#6c757d' }}>
                            ${pedidoSeleccionado.costo.toFixed(2)}
                          </span>
                          <span className="text-success font-weight-bold ml-2">
                            ${pedidoSeleccionado.precioFinal.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span>${pedidoSeleccionado.precioFinal.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Planta</span>
                      <span>{user?.planta}</span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Centro de costo</span>
                      <span>{user?.centrodecosto}</span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Proyecto</span>
                      <span>{user?.proyecto}</span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Jerarquia</span>
                      <span>{user?.jerarquia}</span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Perfil Nutricional</span>
                      <span>{user?.plannutricional}</span>
                    </div>
                  </div>
                  <div className="col-4 pl-0 mx-auto mt-5">
                    <img
                      className="round-img mr-4"
                      style={{ width: '100%', borderRadius: '50%', objectFit: 'cover', aspectRatio: 1 }}
                      src={pedidoSeleccionado.presentacion || defaultImage}
                      alt={pedidoSeleccionado.descripcion || 'Imagen del plato seleccionado'}
                    />
                  </div>
                  {pedidoSeleccionado.aplicarBonificacion && bonificacionDisponible && cantidadBonificacionesHoy < 1 && (
                    <div className="col-12 mt-4 pl-4">
                      <div className="alert alert-success" style={{ fontSize: '0.9em', padding: '0.5rem' }}>
                        <i className="fas fa-percentage"></i>
                        Bonificación aplicada: {porcentajeBonificacion}% de descuento
                      </div>
                    </div>
                  )}
                  <div className="col-12 mt-4 pl-4">
                    <div className="form-group">
                      <label htmlFor="pedidoComentario">Comentario</label>
                      <textarea
                        className="form-control w-100"
                        id="pedidoComentario"
                        value={pedidoComentario}
                        onChange={(e) => setPedidoComentario(e.target.value)}
                        rows="2"
                        maxLength="200"
                      />
                      <small className="form-text text-muted">Máximo 200 caracteres</small>
                    </div>
                  </div>
                  <div className="col-12 modal-footer">
                    <button
                      type="button"
                      className="btn btn-danger mr-2"
                      onClick={() => {
                        setShowConfirmModal(false);
                        setPedidoComentario('');
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="button" className="btn btn-dark" onClick={confirmaPedido}>
                      Enviar pedido
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cancelar */}
        {showCancelModal && pedidoSeleccionado && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Cancelar pedido</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => {
                      setShowCancelModal(false);
                      setPedidoSeleccionado(null);
                    }}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <p>¿Está seguro de que quieres cancelar el pedido?</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setShowCancelModal(false);
                      setPedidoSeleccionado(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-dark" onClick={() => actualizaPedido('C')}>
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Recibir */}
        {showReceiveModal && pedidoSeleccionado && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document" style={{ maxWidth: '600px' }}>
              <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: '#343a40', color: 'white' }}>
                  <h5 className="modal-title" style={{ color: 'white' }}>
                    Recepción del pedido
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => {
                      setShowReceiveModal(false);
                      setPedidoSeleccionado(null);
                      setPedidoCalificacion(1);
                    }}
                    style={{ color: 'white' }}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="fa fa-info-circle mr-1" aria-hidden="true"></i>
                      Tu calificación nos ayuda a mejorar la calidad del servicio y los platos que ofrecemos.
                    </small>
                  </div>
                  <label htmlFor="pedidoCalificacion" className="sr-only">
                    Califica tu pedido
                  </label>
                  <select
                    className="form-control"
                    id="pedidoCalificacion"
                    value={pedidoCalificacion}
                    onChange={(e) => setPedidoCalificacion(parseInt(e.target.value))}
                    style={{ fontSize: '18px', border: '1px solid #ddd', boxShadow: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="1">⭐ 1 estrella</option>
                    <option value="2">⭐⭐ 2 estrellas</option>
                    <option value="3">⭐⭐⭐ 3 estrellas</option>
                    <option value="4">⭐⭐⭐⭐ 4 estrellas</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 estrellas</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => actualizaPedido('D')}
                  >
                    Devolver pedido
                  </button>
                  <button type="button" className="btn btn-dark" onClick={() => actualizaPedido('R')}>
                    Aceptar plato
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backdrop para modales */}
        {(showConfirmModal || showCancelModal || showReceiveModal) && (
          <div
            className="modal-backdrop fade show"
            onClick={() => {
              setShowConfirmModal(false);
              setShowCancelModal(false);
              setShowReceiveModal(false);
              setPedidoComentario('');
              setPedidoCalificacion(1);
            }}
          ></div>
        )}
    </div>
  );
};

export default Index;

