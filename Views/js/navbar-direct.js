// Script para manejar el navbar de forma directa
(function() {
    'use strict';
    
    // Función para obtener el rol del usuario
    function getUserRole() {
        return localStorage.getItem('role') || '';
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
            
            if (role) {
                userRoleNavbar.textContent = role;
                userInfoNavbar.style.display = 'inline-block';
                console.log('Rol mostrado en navbar:', role);
            } else {
                userInfoNavbar.style.display = 'none';
                console.log('Sin rol, ocultando navbar');
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
        }
        
        // Botón de logout
        var logout = createMenuItem('', 'login.html', 'fa-sign-out-alt', false);
        menuContainer.appendChild(logout);
    }
    
    // Función para inicializar el navbar
    function initNavbar() {
        console.log('Inicializando navbar directo...');
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
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startInit);
    } else {
        startInit();
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
