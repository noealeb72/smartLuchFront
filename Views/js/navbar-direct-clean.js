// Script para manejar el navbar de forma directa
(function() {
    'use strict';
    
    // Función para obtener el rol del usuario
    function getUserRole() {
        var role = localStorage.getItem('role') || '';
        // Limpiar espacios en blanco al inicio y final
        role = role.trim();
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
        var userInfo = document.getElementById('user-info');
        var userName = document.getElementById('user-name');
        var userRole = document.getElementById('user-role');
        
        // Información en el navbar (nuevo)
        var userInfoNavbar = document.getElementById('user-info-navbar');
        var userRoleNavbar = document.getElementById('user-role-navbar');
        
        if (userInfo && userName && userRole) {
            var name = getUserName();
            var role = getUserRole();
            
            if (role) {
                userName.textContent = name;
                userRole.textContent = role;
                userInfo.style.display = 'block';
            } else {
                userInfo.style.display = 'none';
            }
        }
        
        // Mostrar información en el navbar (al lado del logo)
        if (userInfoNavbar && userRoleNavbar) {
            var role = getUserRole();
            
            if (role && role.trim() !== '') {
                userRoleNavbar.textContent = role;
                userInfoNavbar.style.display = 'inline-block';
            } else {
                userInfoNavbar.style.display = 'none';
            }
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
            
            if (icon) {
                var iconElement = document.createElement('i');
                iconElement.className = icon + ' mr-1';
                a.appendChild(iconElement);
            }
            
            a.appendChild(document.createTextNode(' ' + text));
            li.appendChild(a);
            
            var dropdown = document.createElement('div');
            dropdown.className = 'dropdown-menu';
            dropdown.setAttribute('aria-labelledby', 'dd' + text.replace(/\s+/g, ''));
            li.appendChild(dropdown);
            
            return { li: li, dropdown: dropdown };
        } else {
            var a = document.createElement('a');
            a.className = 'nav-link';
            a.href = href;
            
            if (icon) {
                var iconElement = document.createElement('i');
                iconElement.className = icon + ' mr-1';
                a.appendChild(iconElement);
            }
            
            a.appendChild(document.createTextNode(' ' + text));
            li.appendChild(a);
            
            return { li: li };
        }
    }
    
    // Función para agregar un elemento al dropdown
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
                setTimeout(function() { loadNavbarMenu(retryCount + 1); }, 100);
                return;
            } else {
                return;
            }
        }
        
        // Limpiar menú existente
        menuContainer.innerHTML = '';
        
        var role = getUserRole();
        
        // Elemento Inicio (solo si no es Comensal)
        if (role !== 'Comensal') {
            var inicio = createMenuItem('Inicio', 'index.html', 'fa fa-home');
            menuContainer.appendChild(inicio.li);
        }
        
        // Menú según el rol
        if (role === 'Cocina') {
            // Despacho de plato
            var despacho = createMenuItem('Despacho de plato', 'despacho.html', 'fa fa-edit');
            menuContainer.appendChild(despacho.li);
            
            // Dropdown Cocina
            var cocina = createMenuItem('Cocina', '#', 'fa fa-boxes', true);
            menuContainer.appendChild(cocina.li);
            addDropdownItem(cocina.dropdown, 'Platos', 'plato.html');
            addDropdownItem(cocina.dropdown, 'Menú del día', 'menudeldia.html');
        }
        
        if (role === 'Gerencia') {
            // Dropdown Reportes
            var reportes = createMenuItem('Reportes de Gestión', '#', 'fa fa-chart-bar', true);
            menuContainer.appendChild(reportes.li);
            addDropdownItem(reportes.dropdown, 'Reporte por Comensal', 'reportegcomensales.html');
            addDropdownItem(reportes.dropdown, 'Reporte de Gestión', 'reporteggestion.html');
        }
        
        if (role === 'Admin' || role === 'Gerencia') {
            // Dropdown Configuración
            var config = createMenuItem('Configuración', '#', 'fa fa-cog', true);
            menuContainer.appendChild(config.li);
            addDropdownItem(config.dropdown, 'Usuarios', 'usuarios.html');
            addDropdownItem(config.dropdown, 'Planta', 'planta.html');
            addDropdownItem(config.dropdown, 'Centro de Costo', 'centrodecosto.html');
            addDropdownItem(config.dropdown, 'Proyecto', 'proyecto.html');
            addDropdownItem(config.dropdown, 'Perfil Nutricional', 'plan-nutricional.html');
            addDropdownItem(config.dropdown, 'Jerarquia', 'jerarquia.html');
            addDropdownItem(config.dropdown, 'Turnos', 'turno.html');
        }
        
        // Botón de logout
        var logout = createMenuItem('', 'login.html', 'fa fa-sign-out-alt');
        menuContainer.appendChild(logout.li);
    }
    
    // Función principal de inicialización
    function initNavbar() {
        showUserInfo();
        loadNavbarMenu();
    }
    
    // Función para verificar y corregir el navbar
    function checkAndFixNavbar() {
        var menuContainer = document.getElementById('navbar-menu');
        if (menuContainer && menuContainer.children.length === 0) {
            initNavbar();
        }
    }
    
    // Función para forzar la inicialización
    function forceInit() {
        initNavbar();
    }
    
    // Función para iniciar múltiples verificaciones
    function startMultipleChecks() {
        initNavbar();
        
        // Verificar después de 1 segundo
        setTimeout(checkAndFixNavbar, 1000);
        
        // Verificar después de 2 segundos
        setTimeout(checkAndFixNavbar, 2000);
        
        // Verificar después de 3 segundos
        setTimeout(checkAndFixNavbar, 3000);
        
        // Verificar después de 5 segundos (para ng-include)
        setTimeout(checkAndFixNavbar, 5000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMultipleChecks);
    } else {
        startMultipleChecks();
    }
    
    // También intentar inicializar después de un tiempo adicional
    setTimeout(function() {
        if (!document.getElementById('navbar-menu') || document.getElementById('navbar-menu').children.length === 0) {
            forceInit();
        }
    }, 10000);
    
    // Hacer funciones disponibles globalmente
    window.initNavbar = initNavbar;
    window.forceInit = forceInit;
    
})();
