import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MenuItem from '../components/MenuItem';
import PedidoVigente from '../components/PedidoVigente';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';
import { inicioService } from '../services/inicioService';
import { menuService } from '../services/menuService';
import { comandasService } from '../services/comandasService';
import Swal from 'sweetalert2';
import './Index.css';
import '../styles/smartstyle.css';

const Index = () => {
  const { user } = useAuth();
  const { turnos, pedidosHoy, usuarioData, actualizarDatos } = useDashboard();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [pedidosVigentes, setPedidosVigentes] = useState(pedidosHoy);
  const [usuarioNombre, setUsuarioNombre] = useState('');
  const [usuarioApellido, setUsuarioApellido] = useState('');
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
  
  // Ref para evitar múltiples llamadas simultáneas
  const requestInProgressRef = useRef(false);
  // Ref para rastrear si el componente está montado
  const isMountedRef = useRef(true);

  // Cargar datos desde /api/inicio/web siempre que se monte el componente o se recargue la página
  useEffect(() => {
    isMountedRef.current = true;
    
    const cargarDatosInicio = async (usuarioIdParam = null) => {
      // Evitar múltiples llamadas simultáneas
      if (requestInProgressRef.current) {
        console.log('⚠️ [Index] Ya hay una petición en progreso, cancelando...');
        return;
      }
      
      // Verificar que haya token antes de hacer la petición
      const token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        console.error('❌ [Index] No hay token válido, no se puede cargar datos');
        requestInProgressRef.current = false;
        setIsLoading(false);
        return;
      }
      
      requestInProgressRef.current = true;
      
      try {
        setIsLoading(true);
        
        // Obtener el id del usuario: puede venir como parámetro, del estado, o del token
        let usuarioId = usuarioIdParam || user?.id || usuarioData?.id;
        
        console.log('🔍 [Index] Verificando usuarioId:', {
          userId: user?.id,
          usuarioDataId: usuarioData?.id,
          usuarioIdFinal: usuarioId,
          userCompleto: user,
          usuarioDataCompleto: usuarioData,
          tieneId: !!usuarioId
        });
        
        // Si no hay id, no podemos hacer la llamada
        // Esto puede pasar si se recarga la página y solo hay token en localStorage
        if (!usuarioId) {
          console.error('❌ [Index] No se encontró el ID del usuario');
          console.error('❌ [Index] Objeto user:', user);
          console.error('❌ [Index] usuarioData:', usuarioData);
          console.error('❌ [Index] Esperando a que se cargue el ID del usuario...');
          requestInProgressRef.current = false;
          setIsLoading(false);
          // NO redirigir automáticamente, solo esperar
          return;
        }
        
        // Siempre llamar a inicioService pasando el id del usuario
        console.log('📥 [Index] Llamando a api/inicio/web con usuarioId:', usuarioId);
        console.log('📥 [Index] Token disponible:', localStorage.getItem('token') ? '✅ Sí' : '❌ No');
        const data = await inicioService.getInicioWeb(usuarioId);
        console.log('✅ [Index] Datos recibidos de api/inicio/web:', data);
        console.log('✅ [Index] Estructura de datos:', {
          tieneUsuario: !!data.Usuario,
          tieneTurnos: !!data.Turnos,
          tieneMenuDelDia: !!data.MenuDelDia,
          tienePlatosPedidos: !!data.PlatosPedidos,
          cantidadTurnos: Array.isArray(data.Turnos) ? data.Turnos.length : 0,
          cantidadMenuDelDia: Array.isArray(data.MenuDelDia) ? data.MenuDelDia.length : 0,
          cantidadPlatosPedidos: Array.isArray(data.PlatosPedidos) ? data.PlatosPedidos.length : 0
        });
        
        if (!isMountedRef.current) {
          console.log('⚠️ [Index] Componente desmontado antes de actualizar estado');
          requestInProgressRef.current = false;
          setIsLoading(false); // Asegurar que se quite el loading
          return;
        }
        
        // Actualizar el contexto con los datos recibidos
        try {
          console.log('🔄 [Index] Llamando a actualizarDatos con:', data);
          actualizarDatos(data);
          console.log('✅ [Index] actualizarDatos completado');
        } catch (errorActualizar) {
          console.error('❌ [Index] Error al actualizar datos en el contexto:', errorActualizar);
          // Continuar aunque haya error en actualizarDatos
        }
        
        // Guardar nombre y apellido del Usuario para mostrar en "Bienvenido"
        if (data.Usuario) {
          console.log('👤 Datos del Usuario:', data.Usuario);
          const nombre = data.Usuario.Nombre || data.Usuario.nombre || '';
          const apellido = data.Usuario.Apellido || data.Usuario.apellido || '';
          setUsuarioNombre(nombre);
          setUsuarioApellido(apellido);
          console.log('👤 Usuario nombre y apellido guardados:', nombre, apellido);
        }
        
        // Sincronizar pedidosVigentes con PlatosPedidos de la respuesta
        const pedidosData = data.PlatosPedidos || data.platosPedidos || data.PedidosHoy || data.pedidosHoy || [];
        console.log('🍽️ PlatosPedidos recibidos:', pedidosData);
        setPedidosVigentes(Array.isArray(pedidosData) ? pedidosData : []);
        
        // Asegurar que se quite el loading después de procesar los datos
        console.log('✅ [Index] Procesamiento de datos completado, quitando loading...');
      } catch (error) {
        console.error('❌ [Index] Error en cargarDatosInicio:', error);
        if (!isMountedRef.current) {
          console.log('⚠️ [Index] Componente desmontado durante error');
          requestInProgressRef.current = false;
          setIsLoading(false); // Asegurar que se quite el loading
          return;
        }
        
        // Si el error tiene redirectToLogin, evitar que se redirija automáticamente
        // y manejar el error aquí en lugar de dejar que el interceptor lo haga
        if (error.redirectToLogin) {
          console.error('⚠️ [Index] Error con redirectToLogin detectado, evitando redirección automática');
          error.redirectToLogin = false; // Evitar redirección automática
        }
        
        // Solo mostrar error si no es un error de autenticación que requiere logout
        if (error.response?.status === 401) {
          console.error('❌ [Index] Error 401 - No autorizado, redirigiendo al login');
          // En caso de 401, sí redirigir al login
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        
        Swal.fire({
          title: 'Error al cargar datos',
          text: error.message || 'Error al cargar los datos iniciales',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
      } finally {
        console.log('🔄 [Index] Ejecutando finally, isMounted:', isMountedRef.current);
        // Siempre quitar el loading, incluso si el componente está desmontado
        // React puede manejar actualizaciones de estado en componentes desmontados
        console.log('✅ [Index] Quitando loading en finally...');
        setIsLoading(false);
        requestInProgressRef.current = false;
        console.log('✅ [Index] Loading quitado en finally');
      }
    };

    // Cargar datos si hay usuario autenticado con ID
    const token = localStorage.getItem('token');
    const tieneToken = token && token !== 'null' && token !== 'undefined';
    const tieneUsuarioId = user?.id || usuarioData?.id; // Puede venir de user o usuarioData
    
    // Intentar obtener el ID del token si no está disponible
    let usuarioIdDesdeToken = null;
    if (tieneToken && !tieneUsuarioId) {
      try {
        // Decodificar el token JWT para obtener el usuario ID
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          // Intentar diferentes nombres de campo que puede tener el ID del usuario en el token
          usuarioIdDesdeToken = payload.usuario || payload.usuarioId || payload.userId || payload.id || payload.sub || payload.nameid || null;
          if (usuarioIdDesdeToken) {
            console.log('✅ [Index] ID del usuario obtenido del token:', usuarioIdDesdeToken);
            console.log('📋 [Index] Payload completo del token:', payload);
          } else {
            console.warn('⚠️ [Index] No se encontró ID de usuario en el token. Payload:', payload);
          }
        }
      } catch (error) {
        console.warn('⚠️ [Index] No se pudo decodificar el token:', error);
      }
    }
    
    const usuarioIdFinal = tieneUsuarioId || usuarioIdDesdeToken;
    
    console.log('🔍 [Index] Verificando autenticación para cargar datos:', {
      tieneToken,
      tieneUsuarioId: !!tieneUsuarioId,
      usuarioIdDesdeToken,
      usuarioIdFinal: !!usuarioIdFinal,
      userId: user?.id,
      usuarioDataId: usuarioData?.id,
      requestInProgress: requestInProgressRef.current
    });
    
    // Ejecutar si hay token Y (usuario con id O id desde token) Y no hay una petición en progreso
    if (tieneToken && usuarioIdFinal && !requestInProgressRef.current) {
      console.log('✅ [Index] Usuario autenticado con ID, cargando datos desde api/inicio/web...');
      // Pasar el usuarioIdFinal a la función
      cargarDatosInicio(usuarioIdFinal);
    } else if (!usuarioIdFinal && tieneToken && !requestInProgressRef.current) {
      // Si hay token pero no id, intentar decodificar el token nuevamente con más campos
      console.log('⏳ [Index] Hay token pero falta ID del usuario');
      console.log('⏳ [Index] Token (primeros 20 chars):', token.substring(0, 20) + '...');
      console.log('⏳ [Index] Intentando decodificar token nuevamente con más campos...');
      
      // Intentar decodificar el token una vez más con más campos posibles
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('📋 [Index] Payload completo del token:', payload);
          console.log('📋 [Index] Todas las claves del payload:', Object.keys(payload));
          
          // Buscar el ID en diferentes campos comunes de JWT (más exhaustivo)
          const posiblesIds = [
            payload.usuario,
            payload.usuarioId,
            payload.userId,
            payload.id,
            payload.sub,
            payload.nameid,
            payload.unique_name,
            payload.name,
            payload.uid,
            payload.claim,
            payload.user_id,
            payload.user_id_int,
            // Intentar convertir cualquier valor numérico que parezca un ID
            ...Object.values(payload).filter(v => typeof v === 'number' && v > 0 && v < 1000000)
          ].filter(id => id !== undefined && id !== null && id !== '');
          
          console.log('🔍 [Index] Posibles IDs encontrados:', posiblesIds);
          
          if (posiblesIds.length > 0) {
            const idEncontrado = posiblesIds[0];
            console.log('✅ [Index] ID encontrado en el token, cargando datos con ID:', idEncontrado);
            // Intentar cargar datos con este ID
            cargarDatosInicio(idEncontrado);
          } else {
            console.warn('⚠️ [Index] No se pudo encontrar el ID del usuario en el token');
            console.warn('⚠️ [Index] El backend debería poder obtener el ID del token, pero no podemos llamar sin ID');
            console.warn('⚠️ [Index] Payload completo para depuración:', JSON.stringify(payload, null, 2));
            setIsLoading(false);
          }
        } else {
          console.error('❌ [Index] Token no tiene formato JWT válido (no tiene 3 partes)');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ [Index] Error al decodificar token:', error);
        console.error('❌ [Index] Error details:', error.message);
        setIsLoading(false);
      }
    } else if (requestInProgressRef.current) {
      console.log('⏭️ [Index] Ya hay una petición en progreso, esperando...');
    } else {
      console.log('⏳ [Index] Esperando autenticación...', { 
        tieneToken,
        tieneUsuarioId: !!tieneUsuarioId,
        usuarioIdDesdeToken
      });
      setIsLoading(false); // Asegurar que no se quede en loading
    }
    
    return () => {
      isMountedRef.current = false;
      // No resetear requestInProgressRef aquí porque puede estar en medio de una petición
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, usuarioData?.id]); // Ejecutar cuando cambie el id del usuario o usuarioData

  // Sincronizar pedidosHoy del contexto con el estado local
  useEffect(() => {
    setPedidosVigentes(pedidosHoy);
  }, [pedidosHoy]);

  // Seleccionar primer turno si hay turnos disponibles y no hay uno seleccionado
  useEffect(() => {
    if (turnos.length > 0 && !selectedTurno) {
      // Asegurar que el turno tenga la estructura correcta
      const primerTurno = turnos[0];
      setSelectedTurno({
        ...primerTurno,
        Id: primerTurno.Id || primerTurno.id,
        id: primerTurno.Id || primerTurno.id,
        Nombre: primerTurno.Nombre || primerTurno.nombre,
        nombre: primerTurno.Nombre || primerTurno.nombre
      });
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
      }
    }
    verificarBonificacionHoy();
  }, [user?.bonificacion, verificarBonificacionHoy]);

  useEffect(() => {
    inicializarBonificaciones();
  }, [inicializarBonificaciones]);

  // Cargar menú cuando hay un turno seleccionado (como en el totem)
  useEffect(() => {
    if (selectedTurno) {
      cargarMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTurno]);

  const cargarMenu = useCallback(async () => {
    if (!selectedTurno) return;

    try {
      setIsLoading(true);
      console.log('🔄 [Index] cargarMenu - Cargando menú para turno:', selectedTurno);

      const turnoId = selectedTurno.id || selectedTurno.Id || selectedTurno.ID;
      if (!turnoId) {
        console.error('❌ [Index] El turno seleccionado no tiene ID');
        setMenuItems([]);
        return;
      }

      console.log('📤 [Index] Llamando a menuService.getMenuByTurnoId con turnoId:', turnoId);
      const token = localStorage.getItem('token');
      console.log('🔑 [Index] Token disponible:', token ? '✅ Sí' : '❌ No');
      
      let data;
      try {
        // Intentar primero con getMenuByTurnoId
        data = await menuService.getMenuByTurnoId(turnoId);
        console.log('✅ [Index] Datos recibidos de getMenuByTurnoId:', data);
      } catch (error) {
        console.log('⚠️ [Index] Error con getMenuByTurnoId, intentando con getMenuByTurno:', error);
        // Si falla, usar getMenuByTurno como fallback
        const hoy = new Date().toISOString().split('T')[0];
        const planta = usuarioData?.plantaId || user?.plantaId || '';
        const centro = usuarioData?.centroCostoId || user?.centroCostoId || '';
        const jerarquia = usuarioData?.jerarquiaId || user?.jerarquiaId || '';
        const proyecto = usuarioData?.proyectoId || user?.proyectoId || '';
        const turnoNombre = selectedTurno.Nombre || selectedTurno.nombre || selectedTurno.Descripcion || selectedTurno.descripcion || '';
        
        data = await menuService.getMenuByTurno(planta, centro, jerarquia, proyecto, turnoNombre, hoy);
        console.log('✅ [Index] Datos recibidos de getMenuByTurno:', data);
      }

      if (Array.isArray(data)) {
        const platosMap = new Map();
        const platos = [];

        for (const menuItem of data) {
          const codigo = menuItem.codigo || menuItem.cod_plato || menuItem.Codigo || menuItem.Cod_Plato || menuItem.PlatoId || menuItem.platoId;
          if (!codigo || platosMap.has(codigo)) continue;

          platosMap.set(codigo, true);

          const plato = {
            codigo: codigo,
            descripcion: menuItem.descripcion || menuItem.Descripcion || menuItem.plato || menuItem.Plato || menuItem.PlatoNombre || menuItem.platoNombre || 'Sin descripción',
            costo: parseFloat(menuItem.costo || menuItem.Costo || menuItem.monto || menuItem.Monto || 0) || 0,
            plannutricional: menuItem.plannutricional || menuItem.PlanNutricional || menuItem.plan_nutricional || null,
            presentacion: menuItem.presentacion || menuItem.Presentacion || menuItem.imagen || menuItem.Imagen || defaultImage,
            ingredientes: menuItem.ingredientes || menuItem.Ingredientes || menuItem.ingrediente || menuItem.Ingrediente || null,
            cantidadDisponible: menuItem.cantidad_disponible !== undefined ? parseInt(menuItem.cantidad_disponible) : (menuItem.cantidadDisponible !== undefined ? parseInt(menuItem.cantidadDisponible) : 0),
            aplicarBonificacion: false,
            precioFinal: parseFloat(menuItem.costo || menuItem.Costo || menuItem.monto || menuItem.Monto || 0) || 0,
          };

          platos.push(plato);
        }

        console.log('✅ [Index] Platos procesados:', platos.length);
        setMenuItems(platos);
      } else {
        console.log('⚠️ [Index] getMenuDelDia no devolvió un array');
        setMenuItems([]);
      }
    } catch (error) {
      console.error('❌ [Index] Error al cargar menú:', error);
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


  // Ya no se necesita cargarMenu, se usa MenuDelDia del contexto


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

      await comandasService.crearPedido(jsonForm);

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
      }).then(async () => {
        setShowConfirmModal(false);
        setPedidoComentario('');
        // Recargar datos desde /api/inicio/web
        try {
          setIsLoading(true);
          // Usar inicioService pasando el id del usuario
          const usuarioId = user?.id;
          if (!usuarioId) {
            throw new Error('No se encontró el ID del usuario');
          }
          const data = await inicioService.getInicioWeb(usuarioId);
          actualizarDatos(data);
          const pedidosData = data.PlatosPedidos || data.platosPedidos || data.PedidosHoy || data.pedidosHoy || [];
          setPedidosVigentes(Array.isArray(pedidosData) ? pedidosData : []);
        } catch (error) {
          // Error silencioso, ya se mostrará en el siguiente render
        } finally {
          setIsLoading(false);
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
  }, [pedidoSeleccionado, user, pedidoComentario, bonificacionDisponible, cantidadBonificacionesHoy, porcentajeBonificacion, selectedTurno, actualizarDatos]);

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
      await comandasService.actualizarPedido(
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
      }).then(async () => {
        setShowCancelModal(false);
        setShowReceiveModal(false);
        setPedidoCalificacion(1);
        // Recargar datos desde /api/inicio/web después de actualizar pedido
        try {
          setIsLoading(true);
          // Usar inicioService pasando el id del usuario
          const usuarioId = user?.id;
          if (!usuarioId) {
            throw new Error('No se encontró el ID del usuario');
          }
          const data = await inicioService.getInicioWeb(usuarioId);
          actualizarDatos(data);
          const pedidosData = data.PlatosPedidos || data.platosPedidos || data.PedidosHoy || data.pedidosHoy || [];
          setPedidosVigentes(Array.isArray(pedidosData) ? pedidosData : []);
        } catch (error) {
          // Error silencioso, ya se mostrará en el siguiente render
        } finally {
          setIsLoading(false);
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
  }, [pedidoSeleccionado, pedidoCalificacion, selectedTurno, actualizarDatos]);

  const onTurnoChanged = useCallback(async (e) => {
    const turnoId = parseInt(e.target.value);
    const turnoSeleccionado = turnos.find(t => (t.id || t.Id || t.ID) === turnoId);
    if (turnoSeleccionado) {
      setSelectedTurno(turnoSeleccionado);
      setMenuItems([]); // Limpiar menú anterior mientras carga el nuevo
      setIsLoading(true);
      
      try {
        console.log('🔄 [Index] Cambio de turno, cargando menú para turnoId:', turnoId);
        
        // Llamar a getMenuByTurnoId en lugar de getMenuDelDia (no usar dashboardService)
        let menuData;
        try {
          menuData = await menuService.getMenuByTurnoId(turnoId);
          console.log('✅ [Index] Menú recibido de getMenuByTurnoId:', menuData);
        } catch (error) {
          console.log('⚠️ [Index] Error con getMenuByTurnoId, intentando con getMenuByTurno:', error);
          // Si falla, usar getMenuByTurno como fallback
          const hoy = new Date().toISOString().split('T')[0];
          const planta = usuarioData?.plantaId || user?.plantaId || '';
          const centro = usuarioData?.centroCostoId || user?.centroCostoId || '';
          const jerarquia = usuarioData?.jerarquiaId || user?.jerarquiaId || '';
          const proyecto = usuarioData?.proyectoId || user?.proyectoId || '';
          const turnoNombre = turnoSeleccionado.Nombre || turnoSeleccionado.nombre || turnoSeleccionado.Descripcion || turnoSeleccionado.descripcion || '';
          
          menuData = await menuService.getMenuByTurno(planta, centro, jerarquia, proyecto, turnoNombre, hoy);
          console.log('✅ [Index] Menú recibido de getMenuByTurno:', menuData);
        }
        
        // Procesar los datos recibidos
        if (Array.isArray(menuData) && menuData.length > 0) {
          const platosMap = new Map();
          const platos = [];

          for (const menuItem of menuData) {
            // Usar codigo o cod_plato como código único (como en el totem)
            const codigo = menuItem.codigo || menuItem.cod_plato || menuItem.Codigo || menuItem.Cod_Plato || menuItem.PlatoId || menuItem.platoId;
            
            if (!codigo || platosMap.has(codigo)) {
              continue;
            }

            platosMap.set(codigo, true);

            // Extraer los campos con todas las variantes posibles
            const descripcion = menuItem.descripcion || menuItem.Descripcion || menuItem.plato || menuItem.Plato || menuItem.PlatoNombre || menuItem.platoNombre || 'Sin descripción';
            const costo = parseFloat(menuItem.costo || menuItem.Costo || menuItem.monto || menuItem.Monto || 0) || 0;
            const plannutricional = menuItem.plannutricional || menuItem.PlanNutricional || menuItem.plan_nutricional || null;
            const ingredientes = menuItem.ingredientes || menuItem.Ingredientes || menuItem.ingrediente || menuItem.Ingrediente || null;
            const disponible = menuItem.cantidad_disponible !== undefined ? parseInt(menuItem.cantidad_disponible) : 0;

            const plato = {
              codigo: codigo,
              descripcion: descripcion,
              costo: costo,
              plannutricional: plannutricional,
              presentacion: menuItem.presentacion || menuItem.Presentacion || menuItem.imagen || menuItem.Imagen || defaultImage,
              ingredientes: ingredientes,
              cantidadDisponible: disponible,
              aplicarBonificacion: false,
              precioFinal: costo,
            };

            platos.push(plato);
          }

          console.log('✅ [Index] Platos procesados:', platos.length);
          setMenuItems(platos);
        } else {
          console.log('⚠️ [Index] No hay items en el menú recibido');
          setMenuItems([]);
        }
      } catch (error) {
        console.error('❌ [Index] Error al cargar menú por turno:', error);
        setMenuItems([]);
        if (!error.redirectToLogin) {
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo cargar el menú del turno seleccionado',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
        }
      } finally {
        setIsLoading(false);
      }
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
                      Bienvenido {usuarioNombre || usuarioData?.nombre || user?.nombre || ''} {usuarioApellido || usuarioData?.apellido || user?.apellido || ''}
                    </h3>
                    {usuarioData?.bonificaciones !== undefined && usuarioData?.bonificaciones !== null && parseInt(usuarioData.bonificaciones) > 0 && (
                      <h5 style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                        Bonificaciones por día: {usuarioData.bonificaciones}
                      </h5>
                    )}
                    {usuarioData?.bonificacionesInvitado !== undefined && usuarioData?.bonificacionesInvitado !== null && parseInt(usuarioData.bonificacionesInvitado) > 0 && (
                      <h5 style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                        Bonificaciones Invitados: {usuarioData.bonificacionesInvitado}
                      </h5>
                    )}
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
                        value={selectedTurno?.Id || selectedTurno?.id || ''}
                        onChange={onTurnoChanged}
                      >
                        {turnos.map((t, index) => (
                          <option key={t.Id || t.id || `turno-${index}`} value={t.Id || t.id}>
                            {t.Nombre || t.nombre || t.descripcion || t.Descripcion}
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
                      <i className="lnr lnr-user"></i> Bienvenido {usuarioData?.nombre || user?.nombre || ''} {usuarioData?.apellido || user?.apellido || ''}
                    </h3>
                    {usuarioData?.bonificaciones !== undefined && usuarioData?.bonificaciones !== null && usuarioData?.bonificaciones !== '' && parseInt(usuarioData.bonificaciones) > 0 && (
                      <h5 style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                        <i className="lnr lnr-gift"></i>&nbsp;&nbsp;
                        Bonificaciones por día: {usuarioData.bonificaciones}
                      </h5>
                    )}
                    {usuarioData?.bonificacionesInvitado !== undefined && usuarioData?.bonificacionesInvitado !== null && usuarioData?.bonificacionesInvitado !== '' && parseInt(usuarioData.bonificacionesInvitado) > 0 && (
                      <h5 style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                        <i className="lnr lnr-gift"></i>&nbsp;&nbsp;
                        Bonificaciones Invitados: {usuarioData.bonificacionesInvitado}
                      </h5>
                    )}
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
                        value={selectedTurno?.Id || selectedTurno?.id || ''}
                        onChange={onTurnoChanged}
                      >
                        {turnos.map((t, index) => (
                          <option key={t.Id || t.id || `turno-${index}`} value={t.Id || t.id}>
                            {t.Nombre || t.nombre || t.descripcion || t.Descripcion}
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
                  <img 
                    className="sticky-image rised-image w-100" 
                    src={`${process.env.PUBLIC_URL || ''}/Views/img/hero-2.jpg`} 
                    alt="Imagen decorativa de comida"
                    onError={(e) => {
                      // Si la imagen no carga, ocultarla o usar una imagen alternativa
                      e.target.style.display = 'none';
                    }}
                  />
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
                    {usuarioData?.bonificaciones !== undefined && usuarioData?.bonificaciones !== null && usuarioData?.bonificaciones !== '' && parseInt(usuarioData.bonificaciones) > 0 && (
                      <div className="container row">
                        <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Bonificaciones</span>
                        <span>{usuarioData.bonificaciones}</span>
                      </div>
                    )}
                    {usuarioData?.bonificacionesInvitado !== undefined && usuarioData?.bonificacionesInvitado !== null && usuarioData?.bonificacionesInvitado !== '' && parseInt(usuarioData.bonificacionesInvitado) > 0 && (
                      <div className="container row">
                        <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Bonificaciones Invitados</span>
                        <span>{usuarioData.bonificacionesInvitado}</span>
                      </div>
                    )}
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
                    <option key="calificacion-1" value="1">⭐ 1 estrella</option>
                    <option key="calificacion-2" value="2">⭐⭐ 2 estrellas</option>
                    <option key="calificacion-3" value="3">⭐⭐⭐ 3 estrellas</option>
                    <option key="calificacion-4" value="4">⭐⭐⭐⭐ 4 estrellas</option>
                    <option key="calificacion-5" value="5">⭐⭐⭐⭐⭐ 5 estrellas</option>
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

