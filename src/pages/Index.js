import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MenuItem from '../components/MenuItem';
import PedidoVigente from '../components/PedidoVigente';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';
import { inicioService } from '../services/inicioService';
import { menuService } from '../services/menuService';
import { comandasService } from '../services/comandasService';
import { getApiBaseUrl } from '../services/configService';
import Swal from 'sweetalert2';
import './Index.css';
import '../styles/smartstyle.css';

const Index = () => {
  const { user } = useAuth();
  const { turnos, pedidosHoy, menuDelDia, usuarioData, actualizarDatos } = useDashboard();
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
        return;
      }
      
      // Verificar que haya token antes de hacer la petición
      const token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        requestInProgressRef.current = false;
        setIsLoading(false);
        return;
      }
      
      requestInProgressRef.current = true;
      
      try {
        setIsLoading(true);
        
        // Obtener el id del usuario: puede venir como parámetro, del estado, o del token
        let usuarioId = usuarioIdParam || user?.id || usuarioData?.id;
        
        // Si no hay id, no podemos hacer la llamada
        // Esto puede pasar si se recarga la página y solo hay token en localStorage
        if (!usuarioId) {
          requestInProgressRef.current = false;
          setIsLoading(false);
          // NO redirigir automáticamente, solo esperar
          return;
        }
        
        // Siempre llamar a inicioService pasando el id del usuario
        const data = await inicioService.getInicioWeb(usuarioId);
        
        if (!isMountedRef.current) {
          requestInProgressRef.current = false;
          setIsLoading(false); // Asegurar que se quite el loading
          return;
        }
        
        // Actualizar el contexto con los datos recibidos
        try {
          actualizarDatos(data);
        } catch (errorActualizar) {
          // Continuar aunque haya error en actualizarDatos
        }
        
        // Guardar nombre y apellido del Usuario para mostrar en "Bienvenido"
        if (data.Usuario) {
          const nombre = data.Usuario.Nombre || data.Usuario.nombre || '';
          const apellido = data.Usuario.Apellido || data.Usuario.apellido || '';
          setUsuarioNombre(nombre);
          setUsuarioApellido(apellido);
        }
        
        // Sincronizar pedidosVigentes con PlatosPedidos de la respuesta
        const pedidosData = data.PlatosPedidos || data.platosPedidos || data.PedidosHoy || data.pedidosHoy || [];
        setPedidosVigentes(Array.isArray(pedidosData) ? pedidosData : []);
      } catch (error) {
        if (!isMountedRef.current) {
          requestInProgressRef.current = false;
          setIsLoading(false); // Asegurar que se quite el loading
          return;
        }
        
        // Si el error tiene redirectToLogin, evitar que se redirija automáticamente
        // y manejar el error aquí en lugar de dejar que el interceptor lo haga
        if (error.redirectToLogin) {
          error.redirectToLogin = false; // Evitar redirección automática
        }
        
        // Solo mostrar error si no es un error de autenticación que requiere logout
        if (error.response?.status === 401) {
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
        // Siempre quitar el loading, incluso si el componente está desmontado
        // React puede manejar actualizaciones de estado en componentes desmontados
        setIsLoading(false);
        requestInProgressRef.current = false;
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
        }
      } catch (error) {
        // Error al decodificar token
      }
    }
    
    const usuarioIdFinal = tieneUsuarioId || usuarioIdDesdeToken;
    
    // Ejecutar si hay token Y (usuario con id O id desde token) Y no hay una petición en progreso
    if (tieneToken && usuarioIdFinal && !requestInProgressRef.current) {
      // Pasar el usuarioIdFinal a la función
      cargarDatosInicio(usuarioIdFinal);
    } else if (!usuarioIdFinal && tieneToken && !requestInProgressRef.current) {
      // Si hay token pero no id, intentar decodificar el token nuevamente con más campos
      // Intentar decodificar el token una vez más con más campos posibles
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
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
          
          if (posiblesIds.length > 0) {
            const idEncontrado = posiblesIds[0];
            // Intentar cargar datos con este ID
            cargarDatosInicio(idEncontrado);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); // Asegurar que no se quede en loading
    }
    
    return () => {
      isMountedRef.current = false;
      // No resetear requestInProgressRef aquí porque puede estar en medio de una petición
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Solo ejecutar cuando cambie el id del usuario (no usuarioData?.id para evitar loops)

  // Sincronizar pedidosHoy del contexto con el estado local
  useEffect(() => {
    setPedidosVigentes(pedidosHoy);
  }, [pedidosHoy]);

  // Actualización periódica cada 2 segundos usando /api/inicio/web-actualizado
  useEffect(() => {
    // Verificar que haya usuario autenticado
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      return;
    }

    const usuarioId = user?.id || usuarioData?.id;
    if (!usuarioId) {
      return;
    }

    // Función para actualizar datos
    const actualizarDatosPeriodicamente = async () => {
      // Evitar múltiples llamadas simultáneas
      if (requestInProgressRef.current) {
        return;
      }

      try {
        // Obtener fecha del día en formato 'YYYY-MM-DD'
        const hoy = new Date();
        const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        
        // Obtener turnoId si hay un turno seleccionado
        const turnoId = selectedTurno?.id || selectedTurno?.Id || selectedTurno?.ID || null;
        
        // Llamar al endpoint de actualización con la fecha del día
        const data = await inicioService.getInicioWebActualizado(usuarioId, fechaHoy, turnoId);
        
        // Si hay datos, actualizar el contexto
        if (data && isMountedRef.current) {
          try {
            actualizarDatos(data);
            
            // Actualizar pedidos vigentes solo si hay cambios
            const pedidosData = data.PlatosPedidos || data.platosPedidos || data.PedidosHoy || data.pedidosHoy || [];
            const nuevosPedidos = Array.isArray(pedidosData) ? pedidosData : [];
            
            // Solo actualizar si los datos realmente cambiaron (comparación profunda)
            setPedidosVigentes(prevPedidos => {
              if (!prevPedidos || prevPedidos.length !== nuevosPedidos.length) {
                return nuevosPedidos;
              }
              // Comparar por ID/Npedido para evitar actualizaciones innecesarias
              const prevIds = new Set(prevPedidos.map(p => p?.Id || p?.id || p?.Npedido || p?.npedido).filter(Boolean));
              const nuevosIds = new Set(nuevosPedidos.map(p => p?.Id || p?.id || p?.Npedido || p?.npedido).filter(Boolean));
              if (prevIds.size !== nuevosIds.size) {
                return nuevosPedidos;
              }
              for (const id of prevIds) {
                if (!nuevosIds.has(id)) {
                  return nuevosPedidos;
                }
              }
              // Si los IDs son iguales, mantener la referencia anterior para evitar re-render
              return prevPedidos;
            });
          } catch (errorActualizar) {
            // Continuar aunque haya error en actualizarDatos
          }
        }
      } catch (error) {
        // Silenciar errores de actualización periódica (excepto 401)
        if (error.response?.status === 401) {
          // En caso de 401, limpiar y redirigir
          localStorage.clear();
          window.location.href = '/login';
        }
        // Para otros errores, simplemente ignorar y continuar
      }
    };

    // Ejecutar inmediatamente la primera vez
    actualizarDatosPeriodicamente();

    // Configurar intervalo para ejecutar cada 2 segundos
    const intervalId = setInterval(() => {
      actualizarDatosPeriodicamente();
    }, 2000);

    // Limpiar intervalo al desmontar o cuando cambien las dependencias
    return () => {
      clearInterval(intervalId);
    };
  }, [user?.id, usuarioData?.id, selectedTurno, actualizarDatos]);


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

  // Cargar menú cuando hay un turno seleccionado, usando menuDelDia del contexto
  useEffect(() => {
    if (selectedTurno && menuDelDia && menuDelDia.length > 0) {
      const turnoId = selectedTurno.id || selectedTurno.Id || selectedTurno.ID;
      if (!turnoId) {
        setMenuItems([]);
        return;
      }
      
      // Filtrar menuDelDia por el turno seleccionado
      const menuFiltrado = menuDelDia.filter(menu => {
        const menuTurnoId = menu.TurnoId || menu.turnoId || menu.Turno?.Id || menu.turno?.id;
        return menuTurnoId === turnoId;
      });

      if (menuFiltrado.length > 0) {
        const platosMap = new Map();
        const platos = [];

        for (const menuItem of menuFiltrado) {
          // Usar PlatoId como código único, pero si es 0, usar el Id del menú
          // Verificar explícitamente si existe (incluyendo 0)
          let codigo = menuItem.PlatoId !== undefined ? menuItem.PlatoId : (menuItem.platoId !== undefined ? menuItem.platoId : null);
          
          // Si PlatoId es 0 o no existe, usar el Id del menú como código
          if (codigo === null || codigo === 0 || codigo === '0') {
            codigo = menuItem.Id || menuItem.id;
            if (!codigo) {
              // Si tampoco hay Id, generar uno único basado en el índice
              codigo = `menu_item_${platos.length}`;
            }
          }
          
          // Convertir a string para usar como clave
          const codigoStr = String(codigo);
          
          // Si ya existe este código, agregar un sufijo único con el Id del menú
          let codigoFinal = codigoStr;
          if (platosMap.has(codigoStr)) {
            const menuId = menuItem.Id || menuItem.id || platos.length;
            codigoFinal = `${codigoStr}_${menuId}`;
          }

          platosMap.set(codigoFinal, true);

          // Obtener la foto del menú del día
          let fotoUrl = defaultImage;
          const foto = menuItem.Foto || menuItem.foto || menuItem.Imagen || menuItem.imagen || null;
          
          if (foto && foto.trim() !== '') {
            // Si es una URL completa (http/https) o base64, usarla tal cual
            if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
              fotoUrl = foto;
            } else if (foto.startsWith('/uploads/platos/') || foto.includes('uploads/platos/')) {
              // Si es una ruta de uploads/platos/, construir la URL completa
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
                  // Error al decodificar
                }
              }
              
              // Codificar solo si hay espacios o caracteres especiales
              if (nombreArchivo.includes(' ') || /[^a-zA-Z0-9._-]/.test(nombreArchivo)) {
                nombreArchivo = encodeURIComponent(nombreArchivo);
              }
              
              fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivo}`;
            } else {
              // Si es solo un nombre de archivo, construir la ruta completa
              const baseUrl = getApiBaseUrl();
              fotoUrl = `${baseUrl}/uploads/platos/${foto}`;
            }
          }

          const costo = parseFloat(
            menuItem.costo || 
            menuItem.Costo || 
            menuItem.monto || 
            menuItem.Monto || 
            menuItem.importe || 
            menuItem.Importe || 
            menuItem.precio || 
            menuItem.Precio || 
            menuItem.ImportePlato ||
            menuItem.importePlato ||
            0
          ) || 0;

          // Obtener el PlatoId real (si es 0, usar el Id del menú)
          const platoIdReal = (menuItem.PlatoId !== undefined && menuItem.PlatoId !== 0) 
            ? menuItem.PlatoId 
            : (menuItem.platoId !== undefined && menuItem.platoId !== 0)
            ? menuItem.platoId
            : (menuItem.Id || menuItem.id);

          const plato = {
            codigo: codigoFinal,
            platoId: platoIdReal, // Guardar el PlatoId para usarlo al crear la comanda
            menuId: menuItem.Id || menuItem.id, // Guardar el ID del menú para usarlo al crear la comanda
            descripcion: menuItem.PlatoNombre || menuItem.platoNombre || menuItem.descripcion || menuItem.Descripcion || 'Sin descripción',
            costo: costo,
            plannutricional: menuItem.NutricionalNombre || menuItem.nutricionalNombre || menuItem.PlanNutricionalNombre || menuItem.planNutricionalNombre || null,
            presentacion: fotoUrl,
            ingredientes: null,
            cantidadDisponible: menuItem.Cantidad !== undefined ? parseInt(menuItem.Cantidad) : (menuItem.cantidad !== undefined ? parseInt(menuItem.cantidad) : 0),
            aplicarBonificacion: false,
            precioFinal: costo,
          };

          platos.push(plato);
        }

        setMenuItems(platos);
      } else {
        setMenuItems([]);
      }
    } else if (selectedTurno && (!menuDelDia || menuDelDia.length === 0)) {
      // Si hay turno seleccionado pero no hay menuDelDia, intentar cargar desde el API
      cargarMenuDesdeAPI();
    } else if (!selectedTurno) {
      setMenuItems([]);
    }
  }, [selectedTurno, menuDelDia, defaultImage]);

  const cargarMenuDesdeAPI = useCallback(async () => {
    if (!selectedTurno) return;

    try {
      setIsLoading(true);

      const turnoId = selectedTurno.id || selectedTurno.Id || selectedTurno.ID;
      if (!turnoId) {
        setMenuItems([]);
        return;
      }
      
      let data;
      try {
        // Intentar primero con getMenuByTurnoId
        data = await menuService.getMenuByTurnoId(turnoId);
      } catch (error) {
        // Si falla, usar getMenuByTurno como fallback
        const hoy = new Date().toISOString().split('T')[0];
        const planta = usuarioData?.plantaId || user?.plantaId || '';
        const centro = usuarioData?.centroCostoId || user?.centroCostoId || '';
        const jerarquia = usuarioData?.jerarquiaId || user?.jerarquiaId || '';
        const proyecto = usuarioData?.proyectoId || user?.proyectoId || '';
        const turnoNombre = selectedTurno.Nombre || selectedTurno.nombre || selectedTurno.Descripcion || selectedTurno.descripcion || '';
        
        data = await menuService.getMenuByTurno(planta, centro, jerarquia, proyecto, turnoNombre, hoy);
      }

      if (Array.isArray(data)) {
        const platosMap = new Map();
        const platos = [];

        for (const menuItem of data) {
          const codigo = menuItem.codigo || menuItem.cod_plato || menuItem.Codigo || menuItem.Cod_Plato || menuItem.PlatoId || menuItem.platoId;
          if (!codigo || platosMap.has(codigo)) continue;

          platosMap.set(codigo, true);

          // Obtener la foto del menú del día
          let fotoUrl = defaultImage;
          const foto = menuItem.Foto || menuItem.foto || menuItem.Imagen || menuItem.imagen || null;
          
          if (foto && foto.trim() !== '') {
            // Si es una URL completa (http/https) o base64, usarla tal cual
            if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
              fotoUrl = foto;
            } else if (foto.startsWith('/uploads/platos/') || foto.includes('uploads/platos/')) {
              // Si es una ruta de uploads/platos/, construir la URL completa
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
                  // Error al decodificar
                }
              }
              
              // Codificar solo si hay espacios o caracteres especiales
              if (nombreArchivo.includes(' ') || /[^a-zA-Z0-9._-]/.test(nombreArchivo)) {
                nombreArchivo = encodeURIComponent(nombreArchivo);
              }
              
              fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivo}`;
            } else {
              // Si es solo un nombre de archivo, construir la ruta completa
              const baseUrl = getApiBaseUrl();
              fotoUrl = `${baseUrl}/uploads/platos/${foto}`;
            }
          }

          const costo = parseFloat(
            menuItem.costo || 
            menuItem.Costo || 
            menuItem.monto || 
            menuItem.Monto || 
            menuItem.importe || 
            menuItem.Importe || 
            menuItem.precio || 
            menuItem.Precio || 
            menuItem.ImportePlato ||
            menuItem.importePlato ||
            0
          ) || 0;

          const plato = {
            codigo: codigo,
            platoId: menuItem.PlatoId || menuItem.platoId || menuItem.Id || menuItem.id, // Guardar el PlatoId para usarlo al crear la comanda
            menuId: menuItem.Id || menuItem.id, // Guardar el ID del menú para usarlo al crear la comanda
            descripcion: menuItem.descripcion || menuItem.Descripcion || menuItem.plato || menuItem.Plato || menuItem.PlatoNombre || menuItem.platoNombre || 'Sin descripción',
            costo: costo,
            plannutricional: menuItem.NutricionalNombre || menuItem.nutricionalNombre || menuItem.PlanNutricionalNombre || menuItem.planNutricionalNombre || menuItem.plannutricional || menuItem.PlanNutricional || menuItem.plan_nutricional || null,
            presentacion: fotoUrl,
            ingredientes: menuItem.ingredientes || menuItem.Ingredientes || menuItem.ingrediente || menuItem.Ingrediente || null,
            cantidadDisponible: menuItem.Cantidad !== undefined ? parseInt(menuItem.Cantidad) : (menuItem.cantidad !== undefined ? parseInt(menuItem.cantidad) : 0),
            aplicarBonificacion: false,
            precioFinal: costo,
          };

          platos.push(plato);
        }

        setMenuItems(platos);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
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
  }, [selectedTurno, defaultImage, usuarioData, user]);


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
      // Obtener IDs necesarios
      const usuarioId = usuarioData?.id || user?.id || null;
      if (!usuarioId) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener el ID del usuario',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      // Obtener PlatoId y MenuddId (Id del menú del día) del pedido seleccionado (ya lo guardamos en el objeto plato)
      let platoId = pedidoSeleccionado.platoId || null;
      let menuId = pedidoSeleccionado.menuId || null; // Este será el MenuddId en el DTO
      
      // Si no está en el objeto, buscar en menuDelDia por código
      if (!platoId || platoId === 0 || !menuId) {
        const menuItemEncontrado = menuDelDia.find(item => {
          const itemCodigo = item.codigo || item.cod_plato || item.Codigo || item.Cod_Plato || '';
          return String(itemCodigo) === String(pedidoSeleccionado.codigo);
        });

        if (menuItemEncontrado) {
          // Obtener el ID del menú
          if (!menuId) {
            menuId = menuItemEncontrado.Id || menuItemEncontrado.id;
          }
          
          // Priorizar PlatoId, pero si es 0, usar el Id del menú
          if (!platoId || platoId === 0) {
            const platoIdEncontrado = menuItemEncontrado.PlatoId || menuItemEncontrado.platoId;
            if (platoIdEncontrado && platoIdEncontrado !== 0) {
              platoId = platoIdEncontrado;
            } else {
              // Si PlatoId es 0, usar el Id del menú del día
              platoId = menuItemEncontrado.Id || menuItemEncontrado.id;
            }
          }
        } else {
          // Si no se encuentra, intentar usar el código directamente si es numérico
          if (!platoId || platoId === 0) {
            const codigoNum = parseInt(pedidoSeleccionado.codigo);
            if (!isNaN(codigoNum) && codigoNum > 0) {
              platoId = codigoNum;
            }
          }
        }
      }

      if (!platoId || platoId === 0) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener el ID del plato. Por favor, recarga la página e intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!menuId) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener el ID del menú. Por favor, recarga la página e intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      if (!menuId) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener el ID del menú. Por favor, recarga la página e intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      // Obtener TurnoId
      const turnoId = selectedTurno?.id || selectedTurno?.Id || selectedTurno?.ID || null;
      if (!turnoId) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener el ID del turno',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      // Obtener IDs de planta, centro de costo, proyecto y jerarquía
      const plantaId = usuarioData?.plantaId || user?.plantaId || null;
      const centroDeCostoId = usuarioData?.centroCostoId || user?.centroCostoId || null;
      const proyectoId = usuarioData?.proyectoId || user?.proyectoId || null;
      const jerarquiaId = usuarioData?.jerarquiaId || user?.jerarquiaId || null;

      if (!plantaId || !centroDeCostoId || !proyectoId || !jerarquiaId) {
        Swal.fire({
          title: 'Error',
          text: 'Faltan datos del usuario (planta, centro de costo, proyecto o jerarquía)',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        return;
      }

      // Fecha actual en formato DateTime
      const fecha = new Date();

      // Monto (precio final)
      const monto = parseFloat(pedidoSeleccionado.precioFinal || pedidoSeleccionado.costo || 0);

      // Bonificado (si aplicó bonificación)
      const bonificado = !!pedidoSeleccionado.aplicarBonificacion && bonificacionDisponible && cantidadBonificacionesHoy < 1;

      // Construir el DTO según ComandaCreateDto
      // Id y Npedido: No se envían, el backend los genera automáticamente
      // UsuarioId: Se envía como parámetro separado en la URL, no en el DTO
      const comandaDto = {
        PlatoId: parseInt(platoId),
        MenuddId: parseInt(menuId), // ID del menú del día (Id del objeto del menú del día)
        TurnoId: parseInt(turnoId),
        Fecha: fecha.toISOString(), // DateTime en formato ISO
        Monto: monto,
        Bonificado: bonificado,
        Invitado: false,
        Calificacion: 0,
        Estado: 'P', // Estado inicial: P = Pendiente
        Comentario: pedidoComentario || null,
        PlantaId: parseInt(plantaId),
        CentroDeCostoId: parseInt(centroDeCostoId),
        ProyectoId: parseInt(proyectoId),
        JerarquiaId: parseInt(jerarquiaId),
        PlatoImporte: monto, // Importe del plato (usualmente igual a Monto)
      };

      await comandasService.crearPedido(comandaDto, parseInt(usuarioId));

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
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // Cerrar modal y recargar datos
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
    } catch (error) {
      // Si hay error de conexión, el interceptor ya redirige automáticamente
      if (!error.redirectToLogin) {
        let errorTitle = 'Error';
        let errorMessage = error.message || 'Error al crear el pedido';
        let errorHtml = null;
        
        // Verificar si el backend devolvió errores de validación en formato JSON
        if (error.response && error.response.data) {
          const responseData = error.response.data;
          
          // Si hay un array de errores, mostrarlos todos
          if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
            errorTitle = responseData.message || 'Errores de validación';
            errorHtml = '<div style="text-align: left;"><p>Los siguientes errores fueron encontrados:</p><ul style="margin: 0; padding-left: 20px;">' +
              responseData.errors.map(err => {
                const fieldName = err.field ? err.field.replace('dto.', '').replace('Dto.', '') : 'Campo desconocido';
                return `<li><strong>${fieldName}:</strong> ${err.message || 'Error de validación'}</li>`;
              }).join('') +
              '</ul></div>';
          } else if (responseData.error) {
            // Si hay un campo "error" con el mensaje
            errorTitle = 'Error';
            errorMessage = responseData.error;
          } else if (responseData.message) {
            // Si solo hay un mensaje general
            errorTitle = responseData.message || 'Error de validación';
            errorMessage = typeof responseData.message === 'string' ? responseData.message : 'Error al crear el pedido';
          } else if (typeof responseData === 'string') {
            // Si la respuesta es directamente un string
            errorMessage = responseData;
          }
        }
        
        if (errorHtml) {
        Swal.fire({
            title: errorTitle,
            html: errorHtml,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
        } else {
          Swal.fire({
            title: errorTitle,
            text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#F34949',
        });
        }
      }
    }
  }, [pedidoSeleccionado, user, pedidoComentario, bonificacionDisponible, cantidadBonificacionesHoy, porcentajeBonificacion, selectedTurno, actualizarDatos]);

  const actualizaPedido = useCallback(async (nuevoEstado) => {
    if (!pedidoSeleccionado) {
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
      // Obtener Npedido de múltiples ubicaciones posibles (priorizando las más comunes)
      const npedido = pedidoSeleccionado.Npedido || 
                     pedidoSeleccionado.npedido || 
                     pedidoSeleccionado.user_npedido ||
                     pedidoSeleccionado.user_Pedido?.npedido || 
                     pedidoSeleccionado.user_Pedido?.Npedido || 
                     pedidoSeleccionado.user_Pedido?.id ||
                     pedidoSeleccionado.user_Pedido?.Id ||
                     pedidoSeleccionado.Id ||
                     pedidoSeleccionado.id;
      
      // Si el estado es 'C' (Cancelar), usar el endpoint específico de cancelar
      if (nuevoEstado === 'C') {
        if (!npedido || npedido <= 0 || isNaN(parseInt(npedido))) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo obtener el número de pedido.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
          return;
        }

        const npedidoInt = parseInt(npedido);
        await comandasService.cancelarPedido(npedidoInt);
      } else if (nuevoEstado === 'D') {
        // Si el estado es 'D' (Devolver), usar el endpoint específico de devolver
        if (!npedido || npedido <= 0 || isNaN(parseInt(npedido))) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo obtener el número de pedido.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
          return;
        }

        const npedidoInt = parseInt(npedido);
        await comandasService.devolverPedido(npedidoInt);
      } else if (nuevoEstado === 'R') {
        // Si el estado es 'R' (Recibir), usar el endpoint específico de recibir
        if (!npedido || npedido <= 0 || isNaN(parseInt(npedido))) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo obtener el número de pedido.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
          return;
        }

        const npedidoInt = parseInt(npedido);
        // Enviar la calificación del select al backend
        await comandasService.recibirPedido(npedidoInt, pedidoCalificacion);
      } else {
        // Para otros estados, usar el método actualizarPedido
        const pedidoId = pedidoSeleccionado.user_Pedido?.id || 
                        pedidoSeleccionado.user_Pedido?.Id ||
                        pedidoSeleccionado.Id ||
                        pedidoSeleccionado.id;
        
        if (!pedidoId) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo obtener el ID del pedido.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F34949',
          });
          return;
        }
        
      await comandasService.actualizarPedido(
          pedidoId,
        nuevoEstado,
        pedidoCalificacion,
        ''
      );
      }

      Swal.fire({
        title: 'Operación correcta',
        text: '',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // Cerrar modales y recargar datos
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
      // No mostrar loading para que la actualización sea más suave
      
      // Actualizar inmediatamente con el nuevo turnoId
      const usuarioId = user?.id || usuarioData?.id;
      if (usuarioId) {
        try {
          // Obtener fecha del día en formato 'YYYY-MM-DD'
          const hoy = new Date();
          const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
          
          const data = await inicioService.getInicioWebActualizado(usuarioId, fechaHoy, turnoId);
          if (data) {
            actualizarDatos(data);
            const pedidosData = data.PlatosPedidos || data.platosPedidos || data.PedidosHoy || data.pedidosHoy || [];
            const nuevosPedidos = Array.isArray(pedidosData) ? pedidosData : [];
            
            // Solo actualizar si los datos realmente cambiaron (comparación profunda)
            setPedidosVigentes(prevPedidos => {
              if (!prevPedidos || prevPedidos.length !== nuevosPedidos.length) {
                return nuevosPedidos;
              }
              // Comparar por ID/Npedido para evitar actualizaciones innecesarias
              const prevIds = new Set(prevPedidos.map(p => p?.Id || p?.id || p?.Npedido || p?.npedido).filter(Boolean));
              const nuevosIds = new Set(nuevosPedidos.map(p => p?.Id || p?.id || p?.Npedido || p?.npedido).filter(Boolean));
              if (prevIds.size !== nuevosIds.size) {
                return nuevosPedidos;
              }
              for (const id of prevIds) {
                if (!nuevosIds.has(id)) {
                  return nuevosPedidos;
                }
              }
              // Si los IDs son iguales, mantener la referencia anterior para evitar re-render
              return prevPedidos;
            });
          }
        } catch (error) {
          // Silenciar error, continuar con la carga del menú
        }
      }
      
      try {
        // Siempre llamar a getMenuByTurno (por-turno)
          const hoy = new Date().toISOString().split('T')[0];
          const planta = usuarioData?.plantaId || user?.plantaId || '';
          const centro = usuarioData?.centroCostoId || user?.centroCostoId || '';
          const jerarquia = usuarioData?.jerarquiaId || user?.jerarquiaId || '';
          const proyecto = usuarioData?.proyectoId || user?.proyectoId || '';
        const turnoIdParam = turnoId; // Usar el turnoId que ya tenemos
          
        const menuData = await menuService.getMenuByTurno(planta, centro, jerarquia, proyecto, turnoIdParam, hoy);
        
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

            // Obtener la foto del menú del día
            let fotoUrl = defaultImage;
            const foto = menuItem.Foto || menuItem.foto || menuItem.Imagen || menuItem.imagen || null;
            
            if (foto && foto.trim() !== '') {
              // Si es una URL completa (http/https) o base64, usarla tal cual
              if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
                fotoUrl = foto;
              } else if (foto.startsWith('/uploads/platos/') || foto.includes('uploads/platos/')) {
                // Si es una ruta de uploads/platos/, construir la URL completa
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
                    // Error al decodificar
                  }
                }
                
                // Codificar solo si hay espacios o caracteres especiales
                if (nombreArchivo.includes(' ') || /[^a-zA-Z0-9._-]/.test(nombreArchivo)) {
                  nombreArchivo = encodeURIComponent(nombreArchivo);
                }
                
                fotoUrl = `${baseUrl}${rutaBase}/${nombreArchivo}`;
              } else {
                // Si es solo un nombre de archivo, construir la ruta completa
                const baseUrl = getApiBaseUrl();
                fotoUrl = `${baseUrl}/uploads/platos/${foto}`;
              }
            }

            // Extraer los campos con todas las variantes posibles
            const descripcion = menuItem.descripcion || menuItem.Descripcion || menuItem.plato || menuItem.Plato || menuItem.PlatoNombre || menuItem.platoNombre || 'Sin descripción';
            const costo = parseFloat(
              menuItem.costo || 
              menuItem.Costo || 
              menuItem.monto || 
              menuItem.Monto || 
              menuItem.importe || 
              menuItem.Importe || 
              menuItem.precio || 
              menuItem.Precio || 
              menuItem.ImportePlato ||
              menuItem.importePlato ||
              0
            ) || 0;
            const plannutricional = menuItem.NutricionalNombre || menuItem.nutricionalNombre || menuItem.PlanNutricionalNombre || menuItem.planNutricionalNombre || menuItem.plannutricional || menuItem.PlanNutricional || menuItem.plan_nutricional || null;
            const ingredientes = menuItem.ingredientes || menuItem.Ingredientes || menuItem.ingrediente || menuItem.Ingrediente || null;
            const cantidad = menuItem.Cantidad !== undefined ? parseInt(menuItem.Cantidad) : (menuItem.cantidad !== undefined ? parseInt(menuItem.cantidad) : 0);

            // Obtener el PlatoId real
            const platoIdReal = (menuItem.PlatoId !== undefined && menuItem.PlatoId !== 0) 
              ? menuItem.PlatoId 
              : (menuItem.platoId !== undefined && menuItem.platoId !== 0)
              ? menuItem.platoId
              : (menuItem.Id || menuItem.id);

            const plato = {
              codigo: codigo,
              platoId: platoIdReal, // Guardar el PlatoId para usarlo al crear la comanda
              menuId: menuItem.Id || menuItem.id, // Guardar el ID del menú para usarlo al crear la comanda
              descripcion: descripcion,
              costo: costo,
              plannutricional: plannutricional,
              presentacion: fotoUrl,
              ingredientes: ingredientes,
              cantidadDisponible: cantidad,
              aplicarBonificacion: false,
              precioFinal: costo,
            };

            platos.push(plato);
          }

          setMenuItems(platos);
        } else {
          setMenuItems([]);
        }
      } catch (error) {
        setMenuItems([]);
        // Silenciar error para que la actualización sea más suave, solo mostrar si es crítico
        if (!error.redirectToLogin && error.message && !error.message.includes('401')) {
          // Solo mostrar error si no es de autenticación
          console.error('Error al cargar menú:', error);
        }
      }
    }
  }, [turnos, usuarioData, user, defaultImage]);

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

      <section id="gtco-welcome" className="bg-white section-padding" aria-live="polite" style={{ paddingTop: '3rem', marginTop: '1rem' }}>
          <div className="container">
            <div className="section-content">
              <div className="row">
                {/* Bienvenida - Desktop */}
                <div className="container-fluid mt-4 row ocultar-en-movil" style={{ marginLeft: 0, marginRight: 0, paddingLeft: '1rem', paddingRight: '1rem', marginTop: '2rem' }}>
                  <div className="col-sm-6 col-12 bienvenida">
                    <h3>
                      Bienvenido {usuarioNombre || usuarioData?.nombre || user?.nombre || ''} {usuarioApellido || usuarioData?.apellido || user?.apellido || ''}
                    </h3>
                    {(usuarioData?.planNutricionalNombre || usuarioData?.PlanNutricionalNombre || user?.planNutricionalNombre || user?.plannutricional) && (
                      <h5 style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                        Plan Nutricional: {usuarioData?.planNutricionalNombre || usuarioData?.PlanNutricionalNombre || user?.planNutricionalNombre || user?.plannutricional || '-'}
                      </h5>
                    )}
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

                  <div className="col-sm-6" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', display: 'flex', alignItems: 'flex-end', flexWrap: 'nowrap' }}>
                    <label className="mb-0" htmlFor="turno" style={{ paddingRight: '0.75rem', flexShrink: 0, textAlign: 'right', minWidth: 'fit-content', whiteSpace: 'nowrap' }}>
                      Ver opciones para turno:
                    </label>

                    {turnos.length > 0 ? (
                      <div style={{ flex: '1 1 auto', minWidth: 0, maxWidth: '100%' }}>
                        <select
                          id="turno"
                          className="form-control"
                          value={selectedTurno?.Id || selectedTurno?.id || ''}
                          onChange={onTurnoChanged}
                          style={{ 
                            width: '100%', 
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            overflow: 'visible',
                            paddingRight: '2.5rem',
                            border: '1px solid #ced4da',
                            borderLeft: '1px solid #ced4da',
                            borderRight: '1px solid #ced4da',
                            borderTop: '1px solid #ced4da',
                            borderBottom: '1px solid #ced4da'
                          }}
                        >
                          {turnos.map((t, index) => (
                            <option key={t.Id || t.id || `turno-${index}`} value={t.Id || t.id}>
                              {t.Nombre || t.nombre || t.descripcion || t.Descripcion}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-muted ml-2">Sin turnos disponibles para hoy.</span>
                    )}
                  </div>
                </div>

                {/* Bienvenida - Mobile */}
                <div className="container-fluid mt-4 row d-block d-md-none" style={{ marginLeft: 0, marginRight: 0, paddingLeft: '1rem', paddingRight: '1rem' }}>
                  <div className="col-sm-12 bienvenida">
                    <h3>
                      <i className="lnr lnr-user"></i> Bienvenido {usuarioData?.nombre || user?.nombre || ''} {usuarioData?.apellido || user?.apellido || ''}
                    </h3>
                    {(usuarioData?.planNutricionalNombre || usuarioData?.PlanNutricionalNombre || user?.planNutricionalNombre || user?.plannutricional) && (
                      <h5 style={{ color: '#6c757d', marginTop: '0.5rem' }}>
                        <i className="lnr lnr-heart"></i>&nbsp;&nbsp;
                        Plan Nutricional: {usuarioData?.planNutricionalNombre || usuarioData?.PlanNutricionalNombre || user?.planNutricionalNombre || user?.plannutricional || '-'}
                      </h5>
                    )}
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

                  <div className="col-sm-12 d-flex flex-column align-items-start" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', width: '100%' }}>
                    <label className="w-100 text-left mb-1" htmlFor="selectedTurno" style={{ margin: 0, padding: 0 }}>
                      Ver opciones para turno:
                    </label>

                    {turnos.length > 0 ? (
                      <div style={{ width: '100%', maxWidth: '100%' }}>
                        <select
                          className="form-control"
                          id="selectedTurno"
                          value={selectedTurno?.Id || selectedTurno?.id || ''}
                          onChange={onTurnoChanged}
                          style={{ 
                            width: '100%', 
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            overflow: 'visible',
                            paddingRight: '2.5rem',
                            border: '1px solid #ced4da',
                            borderLeft: '1px solid #ced4da',
                            borderRight: '1px solid #ced4da',
                            borderTop: '1px solid #ced4da',
                            borderBottom: '1px solid #ced4da'
                          }}
                        >
                          {turnos.map((t, index) => (
                            <option key={t.Id || t.id || `turno-${index}`} value={t.Id || t.id}>
                              {t.Nombre || t.nombre || t.descripcion || t.Descripcion}
                            </option>
                          ))}
                        </select>
                      </div>
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
                  <h4 className="mt-4 text-smart-primary">Tu próximo pedido reservado</h4>

                  {(() => {
                    // Filtrar pedidos que tienen Estado 'E' (En Aceptación) o 'P' (Pendiente)
                    const pedidosFiltrados = pedidosVigentes.filter((pedido) => {
                      const estado = pedido.Estado || pedido.estado;
                      return estado === 'E' || estado === 'P';
                    });

                    return pedidosFiltrados.length === 0 ? (
                    <div className="card mt-2 pl-2" role="status" aria-live="polite">
                      <div className="card-body text-center py-4">
                        <h5 className="text-muted" style={{ fontWeight: 'bold' }}>No hay pedidos vigentes</h5>
                        <p className="text-muted mb-0">No tienes pedidos pendientes de recibir o cancelar en este momento.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="card mt-2 pl-2">
                        {pedidosFiltrados.map((pedido, index) => (
                        <PedidoVigente
                            key={pedido.Id || pedido.id || pedido.Npedido || pedido.npedido || pedido.user_npedido || pedido.user_Pedido?.id || index}
                          pedido={pedido}
                          index={index}
                          defaultImage={defaultImage}
                          onCancelar={handleCancelarPedido}
                          onRecibir={handleRecibirPedido}
                            isLast={index === pedidosFiltrados.length - 1}
                        />
                      ))}
                    </div>
                    );
                  })()}

                  {turnoDisponible && (
                    <>
                      <h4 className="mt-4" style={{ color: '#343a40' }}>Menú del día</h4>
                      {!isLoading && menuItems.length === 0 && (
                        <div 
                          className="alert mt-3" 
                          role="alert" 
                          aria-live="polite"
                          style={{
                            backgroundColor: 'var(--smart-primary-bg)',
                            borderColor: 'var(--smart-primary-dark)',
                            color: 'var(--smart-primary)',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                        >
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
          <div 
            className="modal fade show" 
            style={{ 
              display: 'flex',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1050,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              overflow: 'auto',
              padding: '20px',
              boxSizing: 'border-box',
            }} 
            tabIndex="-1" 
            role="dialog"
          >
            <div 
              className="modal-dialog" 
              role="document"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                margin: 'auto',
                transform: 'none',
                top: 'auto',
                left: 'auto',
                right: 'auto',
                bottom: 'auto',
                alignSelf: 'center',
                flexShrink: 0,
              }}
            >
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
                      <span>
                        {usuarioData?.plantaNombre || 
                         usuarioData?.PlantaNombre || 
                         user?.plantaNombre || 
                         user?.planta || 
                         '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Centro de costo</span>
                      <span>
                        {usuarioData?.centroCostoNombre || 
                         usuarioData?.CentroCostoNombre || 
                         user?.centroCostoNombre || 
                         user?.centrodecosto || 
                         '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Proyecto</span>
                      <span>
                        {usuarioData?.proyectoNombre || 
                         usuarioData?.ProyectoNombre || 
                         user?.proyectoNombre || 
                         user?.proyecto || 
                         '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Jerarquia</span>
                      <span>
                        {usuarioData?.jerarquiaNombre || 
                         usuarioData?.JerarquiaNombre || 
                         user?.jerarquiaNombre || 
                         user?.jerarquia || 
                         '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Perfil Nutricional</span>
                      <span>
                        {usuarioData?.planNutricionalNombre || 
                         usuarioData?.PlanNutricionalNombre || 
                         user?.planNutricionalNombre || 
                         user?.plannutricional || 
                         '-'}
                      </span>
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
          <div 
            className="modal fade show" 
            style={{ 
              display: 'flex',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1050,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              overflow: 'auto',
              padding: '20px',
              boxSizing: 'border-box',
            }} 
            tabIndex="-1" 
            role="dialog"
          >
            <div 
              className="modal-dialog" 
              role="document"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                margin: 'auto',
                transform: 'none',
                top: 'auto',
                left: 'auto',
                right: 'auto',
                bottom: 'auto',
                alignSelf: 'center',
                flexShrink: 0,
              }}
            >
              <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: '#343a40', color: 'white', padding: '10px 15px' }}>
                  <h5 className="modal-title" style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: 500 }}>
                    Cancelar pedido
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => {
                      setShowCancelModal(false);
                      setPedidoSeleccionado(null);
                    }}
                    style={{ color: 'white' }}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body row">
                  <div className="col-12 mb-3">
                    <div className="alert alert-warning" style={{ fontSize: '0.9em', padding: '0.75rem' }}>
                      <i className="fas fa-exclamation-triangle"></i>
                      ¿Está seguro de que desea cancelar este pedido?
                </div>
                  </div>
                  <div className="col-8 pl-4">
                    <div className="container row d-flex align-items-start">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        Plato
                      </span>
                      <span style={{ wordWrap: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                        {pedidoSeleccionado.PlatoDescripcion || pedidoSeleccionado.platoDescripcion || pedidoSeleccionado.descripcion || pedidoSeleccionado.Descripcion || '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Nº Pedido</span>
                      <span>
                        {pedidoSeleccionado.Npedido || pedidoSeleccionado.npedido || pedidoSeleccionado.user_npedido || (pedidoSeleccionado.user_Pedido && pedidoSeleccionado.user_Pedido.id) || '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Turno</span>
                      <span>
                        {pedidoSeleccionado.TurnoNombre || pedidoSeleccionado.turnoNombre || pedidoSeleccionado.turno || '-'}
                      </span>
                    </div>
                    <div className="container row">
                      <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Plan Nutricional</span>
                      <span>
                        {pedidoSeleccionado.NutricionalNombre || pedidoSeleccionado.nutricionalNombre || pedidoSeleccionado.PlanNutricional || pedidoSeleccionado.planNutricional || pedidoSeleccionado.plannutricional || '-'}
                      </span>
                    </div>
                    {(pedidoSeleccionado.Comentario || pedidoSeleccionado.comentario) && (pedidoSeleccionado.Comentario || pedidoSeleccionado.comentario).trim() !== '' && (
                      <div className="container row mt-2">
                        <span className="pr-2" style={{ color: 'black', fontWeight: 'bold' }}>Comentario</span>
                        <span style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {pedidoSeleccionado.Comentario || pedidoSeleccionado.comentario}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-4 pl-0 mx-auto mt-5">
                    <img
                      className="round-img mr-4"
                      style={{ width: '100%', borderRadius: '50%', objectFit: 'cover', aspectRatio: 1 }}
                      src={pedidoSeleccionado.Foto ? (() => {
                        const foto = pedidoSeleccionado.Foto || pedidoSeleccionado.foto || pedidoSeleccionado.presentacion;
                        if (!foto || foto.trim() === '') return defaultImage;
                        if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) return foto;
                        if (foto.startsWith('/uploads/platos/') || foto.includes('uploads/platos/')) {
                          const baseUrl = getApiBaseUrl();
                          let rutaRelativa = foto;
                          if (foto.includes('uploads/platos/') && !foto.startsWith('/uploads/platos/')) {
                            const indiceUploads = foto.indexOf('uploads/platos/');
                            rutaRelativa = `/${foto.substring(indiceUploads)}`;
                          }
                          const partes = rutaRelativa.split('/');
                          let nombreArchivo = partes.pop();
                          const rutaBase = partes.join('/');
                          if (nombreArchivo.includes('%') && !nombreArchivo.includes(' ')) {
                            try {
                              nombreArchivo = decodeURIComponent(nombreArchivo);
                            } catch (e) {}
                          }
                          if (nombreArchivo.includes(' ') || /[^a-zA-Z0-9._-]/.test(nombreArchivo)) {
                            nombreArchivo = encodeURIComponent(nombreArchivo);
                          }
                          return `${baseUrl}${rutaBase}/${nombreArchivo}`;
                        }
                        return `${getApiBaseUrl()}/uploads/platos/${foto}`;
                      })() : defaultImage}
                      alt={pedidoSeleccionado.PlatoDescripcion || pedidoSeleccionado.platoDescripcion || pedidoSeleccionado.descripcion || 'Imagen del plato'}
                      onError={(e) => {
                        e.target.src = defaultImage;
                      }}
                    />
                  </div>
                  <div className="col-12 modal-footer">
                  <button
                    type="button"
                      className="btn btn-secondary mr-2"
                    onClick={() => {
                      setShowCancelModal(false);
                      setPedidoSeleccionado(null);
                    }}
                  >
                      Mantener pedido
                  </button>
                    <button type="button" className="btn btn-danger" onClick={() => actualizaPedido('C')}>
                      Cancelar pedido
                  </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Recibir */}
        {showReceiveModal && pedidoSeleccionado && (
          <div 
            className="modal fade show" 
            style={{ 
              display: 'flex',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1050,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              overflow: 'auto',
              padding: '20px',
              boxSizing: 'border-box',
              margin: '0 !important',
            }} 
            tabIndex="-1" 
            role="dialog"
          >
            <div 
              className="modal-dialog modal-lg" 
              role="document"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                margin: 'auto !important',
                transform: 'none',
                top: 'auto',
                left: 'auto',
                right: 'auto',
                bottom: 'auto',
                alignSelf: 'center',
                flexShrink: 0,
                minHeight: 'auto',
              }}
            >
              <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: '#343a40', color: 'white', padding: '10px 15px' }}>
                  <h5 className="modal-title" style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: 500 }}>
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
                    <small style={{ color: '#000000' }}>
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
                    style={{ 
                      fontSize: '18px', 
                      border: '1px solid #ddd', 
                      boxShadow: 'none', 
                      backgroundColor: '#fff',
                      color: '#000000',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#000000';
                      e.target.style.borderColor = '#ddd';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#000000';
                      e.target.style.borderColor = '#ddd';
                    }}
                  >
                    <option key="calificacion-1" value="1" style={{ color: '#000000' }}>⭐ 1 estrella</option>
                    <option key="calificacion-2" value="2" style={{ color: '#000000' }}>⭐⭐ 2 estrellas</option>
                    <option key="calificacion-3" value="3" style={{ color: '#000000' }}>⭐⭐⭐ 3 estrellas</option>
                    <option key="calificacion-4" value="4" style={{ color: '#000000' }}>⭐⭐⭐⭐ 4 estrellas</option>
                    <option key="calificacion-5" value="5" style={{ color: '#000000' }}>⭐⭐⭐⭐⭐ 5 estrellas</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setShowReceiveModal(false);
                      setPedidoSeleccionado(null);
                      setPedidoCalificacion(1);
                    }}
                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: 'white' }}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => actualizaPedido('D')}
                    style={{ backgroundColor: '#343a40', borderColor: '#343a40', color: 'white' }}
                  >
                    Devolver pedido
                  </button>
                  <button 
                    type="button" 
                    className="btn"
                    onClick={() => actualizaPedido('R')}
                    style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' }}
                  >
                    Recibir pedido
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

