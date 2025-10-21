// Script para manejar el navbar de forma directa
(function() {
    'use strict';
    
    // Función para obtener el rol del usuario
    function getUserRole() {
        var role = localStorage.getItem('role') || '';
        // Limpiar espacios en blanco al inicio y final
        role = role.trim();
        console.log('Obteniendo rol del localStorage:', role);
        console.log('Tipo de dato del rol:', typeof role);
        console.log('Longitud del rol:', role.length);
        console.log('Rol con trim:', role.trim());
        return role;
    }
    
    // Función para obtener el nombre del usuario
    function getUserName() {
        var nombre = localStorage.getItem('nombre') || '';
        var apellido = localStorage.getItem('apellido') || '';
        return (nombre + ' ' + apellido).trim();
    }
    
    // Función para mostrar información del usuario
    function showUserInfo() {
        console.log('=== showUserInfo() ejecutándose ===');
        
        var userInfo = document.getElementById('user-info');
        var userName = document.getElementById('user-name');
        var userRole = document.getElementById('user-role');
        
        // Información en el navbar (nuevo)
        var userInfoNavbar = document.getElementById('user-info-navbar');
        var userRoleNavbar = document.getElementById('user-role-navbar');
        
        console.log('Elementos encontrados:', {
            userInfoNavbar: userInfoNavbar,
            userRoleNavbar: userRoleNavbar
        });
        
        if (userInfo && userName && userRole) {
            var name = getUserName();
            var role = getUserRole();
            
            console.log('Mostrando información del usuario:', {name: name, role: role});
            
            if (role) {
                userName.textContent = name;
                userRole.textContent = role;
                userInfo.style.display = 'block';
            } else {
                userInfo.style.display = 'none';
            }
        } else {
            console.log('Elementos del navbar no encontrados');
        }
        
        // Mostrar información en el navbar (al lado del logo)
        if (userInfoNavbar && userRoleNavbar) {
            var role = getUserRole();
            console.log('Mostrando información en navbar:', {role: role, userInfoNavbar: userInfoNavbar, userRoleNavbar: userRoleNavbar});
            
            if (role && role.trim() !== '') {
                userRoleNavbar.textContent = role;
                userInfoNavbar.style.display = 'inline-block';
                console.log('Rol mostrado en navbar:', role);
                console.log('Contenido del elemento userRoleNavbar:', userRoleNavbar.textContent);
            } else {
                userInfoNavbar.style.display = 'none';
                console.log('Sin rol o rol vacío, ocultando navbar. Rol:', role);
            }
        } else {
            console.log('Elementos del navbar no encontrados:', {userInfoNavbar: userInfoNavbar, userRoleNavbar: userRoleNavbar});
        }
    }
    
    // Función para crear un elemento de menú
    function createMenuItem(text, href, icon, isDropdown) {
        var li = document.createElement('li');
        li.className = 'nav-item active';
        
        if (isDropdown) {
            var a = document.createElement('a');
            a.className = 'nav-link dropdown-toggle active';
            a.href = '#';
            a.setAttribute('role', 'button');
            a.setAttribute('data-toggle', 'dropdown');
            a.setAttribute('aria-haspopup', 'true');
            a.setAttribute('aria-expanded', 'false');
            a.innerHTML = '<i class="fa ' + icon + ' mr-1"></i> ' + text;
            
            var dropdownId = 'dd' + text.replace(/\s+/g, '');
            a.id = dropdownId;
            
            var div = document.createElement('div');
            div.className = 'dropdown-menu';
            div.setAttribute('aria-labelledby', dropdownId);
            
            li.appendChild(a);
            li.appendChild(div);
        } else {
            var a = document.createElement('a');
            a.className = 'nav-link';
            a.href = href;
            a.innerHTML = '<i class="fa ' + icon + ' mr-1"></i> ' + text;
            li.appendChild(a);
        }
        
        return li;
    }
    
    // Función para agregar elementos al dropdown
    function addDropdownItem(dropdown, text, href) {
        var a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = href;
        a.textContent = text;
        dropdown.appendChild(a);
    }
    
    // Función para cargar el menú según el rol
    function loadNavbarMenu(retryCount) {
        retryCount = retryCount || 0;
        var menuContainer = document.getElementById('navbar-menu');
        if (!menuContainer) {
            if (retryCount < 10) {
                console.log('Contenedor del menú no encontrado, reintentando en 100ms... (' + (retryCount + 1) + '/10)');
                setTimeout(function() { loadNavbarMenu(retryCount + 1); }, 100);
                return;
            } else {
                console.error('No se pudo encontrar el contenedor del menú después de 10 intentos');
                return;
            }
        }
        
        // Limpiar menú existente
        menuContainer.innerHTML = '';
        
        var role = getUserRole();
        console.log('Cargando menú para rol:', role);
        console.log('Comparación exacta con "Comensal":', role === 'Comensal');
        console.log('Comparación con trim:', role.trim() === 'Comensal');
        
        // Menú común para todos los roles
        if (role !== 'Comensal') {
            var inicio = createMenuItem('Inicio', 'index.html', 'fa-home', false);
            menuContainer.appendChild(inicio);
        }
        
        // Menú específico por rol
        switch(role) {
            case 'Cocina':
                var despacho = createMenuItem('Despacho de plato', 'despacho.html', 'fa-edit', false);
                menuContainer.appendChild(despacho);
                
                var cocina = createMenuItem('Cocina', '#', 'fa-boxes', true);
                var cocinaDropdown = cocina.querySelector('.dropdown-menu');
                addDropdownItem(cocinaDropdown, 'Platos', 'plato.html');
                addDropdownItem(cocinaDropdown, 'Menu del Día', 'menudeldia.html');
                menuContainer.appendChild(cocina);
                break;
                
            case 'Comensal':
                console.log('=== EJECUTANDO CASO COMENSAL ===');
                // Menú para Comensal
                var pedidos = createMenuItem('Mis Pedidos', 'pedidos.html', 'fa-shopping-cart', false);
                menuContainer.appendChild(pedidos);
                console.log('Agregado: Mis Pedidos');
                
                var menu = createMenuItem('Menú', 'menu.html', 'fa-utensils', false);
                menuContainer.appendChild(menu);
                console.log('Agregado: Menú');
                break;
                
            case 'Gerencia':
                // Reportes de Gestión
                var reportes = createMenuItem('Reportes de Gestión', '#', 'fa-chart-bar', true);
                var reportesDropdown = reportes.querySelector('.dropdown-menu');
                addDropdownItem(reportesDropdown, 'Reporte por Comensal', 'reportegcomensales.html');
                addDropdownItem(reportesDropdown, 'Reporte de Gestión', 'reporteggestion.html');
                menuContainer.appendChild(reportes);
                
                // Gestión
                var gestion = createMenuItem('Gestión', '#', 'fa-users', true);
                var gestionDropdown = gestion.querySelector('.dropdown-menu');
                addDropdownItem(gestionDropdown, 'Usuarios', 'usuarios.html');
                addDropdownItem(gestionDropdown, 'Plantas', 'planta.html');
                addDropdownItem(gestionDropdown, 'Centros de Costo', 'centrodecosto.html');
                addDropdownItem(gestionDropdown, 'Proyectos', 'proyecto.html');
                addDropdownItem(gestionDropdown, 'Perfiles Nutricionales', 'plan-nutricional.html');
                addDropdownItem(gestionDropdown, 'Jerarquías', 'jerarquia.html');
                addDropdownItem(gestionDropdown, 'Turnos', 'turno.html');
                menuContainer.appendChild(gestion);
                break;
                
            case 'Admin':
                // Configuración para Admin
                var config = createMenuItem('Configuración', '#', 'fa-cog', true);
                var configDropdown = config.querySelector('.dropdown-menu');
                addDropdownItem(configDropdown, 'Usuarios', 'usuarios.html');
                addDropdownItem(configDropdown, 'Planta', 'planta.html');
                addDropdownItem(configDropdown, 'Centro de Costo', 'centrodecosto.html');
                addDropdownItem(configDropdown, 'Proyecto', 'proyecto.html');
                addDropdownItem(configDropdown, 'Perfil Nutricional', 'plan-nutricional.html');
                addDropdownItem(configDropdown, 'Jerarquia', 'jerarquia.html');
                addDropdownItem(configDropdown, 'Turnos', 'turno.html');
                menuContainer.appendChild(config);
                break;
                
            default:
                // Para roles no definidos, mostrar menú básico
                console.log('=== EJECUTANDO CASO DEFAULT ===');
                console.log('Rol no definido:', role);
                console.log('Tipo de rol:', typeof role);
                console.log('Rol con JSON.stringify:', JSON.stringify(role));
                var inicio = createMenuItem('Inicio', 'index.html', 'fa-home', false);
                menuContainer.appendChild(inicio);
                break;
        }
        
        // Botón de logout
        var logout = createMenuItem('', 'login.html', 'fa-sign-out-alt', false);
        menuContainer.appendChild(logout);
    }
    
    // Función para inicializar el navbar
    function initNavbar() {
        console.log('Inicializando navbar directo...');
        
        // Limpiar datos del localStorage antes de procesar
        cleanLocalStorage();
        
        console.log('Rol actual:', getUserRole());
        showUserInfo();
        
        // Esperar un poco más para que el navbar se cargue completamente
        setTimeout(function() {
            loadNavbarMenu();
        }, 200);
    }
    
    // Inicializar cuando el DOM esté listo
    function startInit() {
        // Esperar un poco más para que Angular incluya el navbar
        setTimeout(initNavbar, 500);
    }
    
    // Función para forzar la inicialización
    function forceInit() {
        console.log('Forzando inicialización del navbar...');
        initNavbar();
    }
    
    // Función para recargar el navbar manualmente
    function reloadNavbar() {
        console.log('=== RECARGANDO NAVBAR MANUALMENTE ===');
        console.log('Rol actual en localStorage:', localStorage.getItem('role'));
        showUserInfo();
        loadNavbarMenu();
    }
    
    // Función para limpiar datos del localStorage
    function cleanLocalStorage() {
        console.log('Limpiando datos del localStorage...');
        var keys = ['role', 'nombre', 'apellido', 'planta', 'centrodecosto', 'proyecto', 'plannutricional', 'bonificacion', 'dni'];
        keys.forEach(function(key) {
            var value = localStorage.getItem(key);
            if (value) {
                localStorage.setItem(key, value.trim());
                console.log('Limpiado ' + key + ':', value.trim());
            }
        });
    }
    
    // Función para forzar limpieza y recarga completa
    function forceCleanAndReload() {
        console.log('=== FORZANDO LIMPIEZA Y RECARGA COMPLETA ===');
        
        // Limpiar todos los datos
        cleanLocalStorage();
        
        // Esperar un poco y recargar navbar
        setTimeout(function() {
            reloadNavbar();
        }, 100);
    }
    
    // Función para forzar la corrección del navbar
    function forceFixNavbar() {
        console.log('=== FORZANDO CORRECCIÓN DEL NAVBAR ===');
        
        // Limpiar datos primero
        cleanLocalStorage();
        
        // Obtener rol limpio
        var role = getUserRole();
        console.log('Rol limpio obtenido:', role);
        
        // Mostrar información del usuario
        showUserInfo();
        
        // Cargar menú
        loadNavbarMenu();
        
        // Verificar y corregir después de un tiempo
        setTimeout(checkAndFixNavbar, 500);
    }
    
    // Exponer funciones globalmente para debugging
    window.reloadNavbar = reloadNavbar;
    window.cleanLocalStorage = cleanLocalStorage;
    window.forceCleanAndReload = forceCleanAndReload;
    window.forceFixNavbar = forceFixNavbar;
    window.checkAndFixNavbar = checkAndFixNavbar;
    
    // Función para verificar y corregir el navbar
    function checkAndFixNavbar() {
        console.log('=== VERIFICANDO Y CORRIGIENDO NAVBAR ===');
        
        // Verificar si el rol se está mostrando
        var userRoleNavbar = document.getElementById('user-role-navbar');
        var userInfoNavbar = document.getElementById('user-info-navbar');
        
        if (userRoleNavbar && userInfoNavbar) {
            var currentRole = localStorage.getItem('role');
            var cleanRole = currentRole ? currentRole.trim() : '';
            
            console.log('Rol actual en localStorage:', JSON.stringify(currentRole));
            console.log('Rol limpio:', JSON.stringify(cleanRole));
            console.log('Contenido actual del elemento:', JSON.stringify(userRoleNavbar.textContent));
            
            if (cleanRole && cleanRole !== userRoleNavbar.textContent) {
                console.log('Corrigiendo rol en navbar...');
                userRoleNavbar.textContent = cleanRole;
                userInfoNavbar.style.display = 'inline-block';
                console.log('Rol corregido a:', cleanRole);
            }
        } else {
            console.log('Elementos del navbar no encontrados');
        }
        
        // Recargar menú si es necesario
        var role = getUserRole();
        if (role) {
            console.log('Recargando menú para rol:', role);
            loadNavbarMenu();
        }
    }
    
    // Ejecutar verificación múltiples veces
    function startMultipleChecks() {
        startInit();
        
        // Verificar después de 1 segundo
        setTimeout(checkAndFixNavbar, 1000);
        
        // Verificar después de 2 segundos
        setTimeout(checkAndFixNavbar, 2000);
        
        // Verificar después de 3 segundos
        setTimeout(checkAndFixNavbar, 3000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMultipleChecks);
    } else {
        startMultipleChecks();
    }
    
    // También intentar inicializar después de un tiempo adicional
    setTimeout(function() {
        if (!document.getElementById('navbar-menu') || document.getElementById('navbar-menu').children.length === 0) {
            console.log('Navbar no cargado, intentando inicializar nuevamente...');
            forceInit();
        }
    }, 2000);
    
    // Función de prueba para mostrar el rol
    function testShowRole() {
        console.log('=== PRUEBA DE ROL ===');
        console.log('Rol en localStorage:', localStorage.getItem('role'));
        console.log('Función getUserRole():', getUserRole());
        
        var userInfoNavbar = document.getElementById('user-info-navbar');
        var userRoleNavbar = document.getElementById('user-role-navbar');
        
        console.log('Elementos encontrados:', {userInfoNavbar: userInfoNavbar, userRoleNavbar: userRoleNavbar});
        
        if (userInfoNavbar && userRoleNavbar) {
            userRoleNavbar.textContent = 'TEST';
            userInfoNavbar.style.display = 'inline-block';
            console.log('Elementos de prueba mostrados');
        }
    }
    
    // Hacer funciones disponibles globalmente
    window.loadNavbarMenu = loadNavbarMenu;
    window.showUserInfo = showUserInfo;
    window.getUserRole = getUserRole;
    window.initNavbar = initNavbar;
    window.forceInit = forceInit;
    window.testShowRole = testShowRole;
    
})();
