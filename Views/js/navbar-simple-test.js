// Script simplificado para probar el navbar
(function() {
    'use strict';
    
    console.log('=== NAVBAR SIMPLE TEST CARGADO ===');
    
    // Función para obtener el rol del usuario
    function getUserRole() {
        var role = localStorage.getItem('role') || '';
        role = role.trim();
        console.log('Obteniendo rol:', role);
        return role;
    }
    
    // Función para mostrar información del usuario
    function showUserInfo() {
        console.log('=== showUserInfo() ejecutándose ===');
        
        var userInfoNavbar = document.getElementById('user-info-navbar');
        var userRoleNavbar = document.getElementById('user-role-navbar');
        
        console.log('Elementos encontrados:', {
            userInfoNavbar: userInfoNavbar,
            userRoleNavbar: userRoleNavbar
        });
        
        if (userInfoNavbar && userRoleNavbar) {
            var role = getUserRole();
            console.log('Mostrando información en navbar:', {role: role});
            
            if (role && role.trim() !== '') {
                userRoleNavbar.textContent = role;
                userInfoNavbar.style.display = 'inline-block';
                console.log('Rol mostrado en navbar:', role);
            } else {
                userInfoNavbar.style.display = 'none';
                console.log('Sin rol, ocultando navbar');
            }
        } else {
            console.log('Elementos del navbar no encontrados');
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
    
    // Función para agregar elemento al dropdown
    function addDropdownItem(dropdown, text, href) {
        var a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = href;
        a.textContent = text;
        dropdown.appendChild(a);
    }
    
    // Función para cargar el menú del navbar
    function loadNavbarMenu() {
        console.log('=== loadNavbarMenu() ejecutándose ===');
        
        var menuContainer = document.getElementById('navbar-menu');
        if (!menuContainer) {
            console.log('Contenedor del menú no encontrado');
            return;
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
                
            case 'Comensal':
                console.log('=== EJECUTANDO CASO COMENSAL ===');
                var pedidos = createMenuItem('Mis Pedidos', 'pedidos.html', 'fa-shopping-cart', false);
                menuContainer.appendChild(pedidos);
                console.log('Agregado: Mis Pedidos');
                
                var menu = createMenuItem('Menú', 'menu.html', 'fa-utensils', false);
                menuContainer.appendChild(menu);
                console.log('Agregado: Menú');
                break;
                
            case 'Gerencia':
                var reportes = createMenuItem('Reportes de Gestión', '#', 'fa-chart-bar', true);
                var reportesDropdown = reportes.querySelector('.dropdown-menu');
                addDropdownItem(reportesDropdown, 'Reporte por Comensal', 'reportegcomensales.html');
                addDropdownItem(reportesDropdown, 'Reporte de Gestión', 'reporteggestion.html');
                menuContainer.appendChild(reportes);
                
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
                console.log('=== EJECUTANDO CASO DEFAULT ===');
                console.log('Rol no definido:', role);
                var inicio = createMenuItem('Inicio', 'index.html', 'fa-home', false);
                menuContainer.appendChild(inicio);
                break;
        }
        
        // Botón de logout
        var logout = createMenuItem('', 'login.html', 'fa-sign-out-alt', false);
        menuContainer.appendChild(logout);
        
        console.log('Menú cargado para rol:', role);
    }
    
    // Función para inicializar el navbar
    function initNavbar() {
        console.log('=== INICIALIZANDO NAVBAR SIMPLE ===');
        showUserInfo();
        loadNavbarMenu();
    }
    
    // Función para forzar la corrección
    function forceFix() {
        console.log('=== FORZANDO CORRECCIÓN ===');
        showUserInfo();
        loadNavbarMenu();
    }
    
    // Exponer funciones globalmente
    window.forceFix = forceFix;
    window.initNavbar = initNavbar;
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbar);
    } else {
        initNavbar();
    }
    
    // También intentar después de un tiempo
    setTimeout(initNavbar, 1000);
    
})();

