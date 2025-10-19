// Panel de debug global para todas las páginas
(function() {
    'use strict';
    
    // Verificar si estamos en modo de desarrollo
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isDevelopment) return; // Solo mostrar en desarrollo
    
    // Crear el panel de debug global
    function createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'global-debug-panel';
        panel.innerHTML = `
            <div style="color: white; font-size: 12px; margin-bottom: 5px; cursor: move; user-select: none;">
                🔧 Debug Panel Global (Arrastra para mover)
            </div>
            <div style="color: white; font-size: 10px; margin-bottom: 5px;">Simular Login:</div>
            <button onclick="simulateLogin('Gerencia')" style="margin: 2px; padding: 5px; font-size: 10px;">Gerencia</button>
            <button onclick="simulateLogin('Admin')" style="margin: 2px; padding: 5px; font-size: 10px;">Admin</button>
            <button onclick="simulateLogin('Cocina')" style="margin: 2px; padding: 5px; font-size: 10px;">Cocina</button>
            <button onclick="simulateLogin('Comensal')" style="margin: 2px; padding: 5px; font-size: 10px;">Comensal</button>
            <button onclick="clearUserData()" style="margin: 2px; padding: 5px; font-size: 10px; background: red; color: white;">Limpiar</button>
            <br>
            <button onclick="showUserInfo()" style="margin: 2px; padding: 5px; font-size: 10px; background: blue; color: white;">Debug Info</button>
            <button onclick="initNavbar()" style="margin: 2px; padding: 5px; font-size: 10px; background: green; color: white;">Refresh Navbar</button>
            <button onclick="testShowRole()" style="margin: 2px; padding: 5px; font-size: 10px; background: orange; color: white;">Test Role</button>
            <button onclick="toggleGlobalDebugPanel()" style="margin: 2px; padding: 5px; font-size: 10px; background: gray; color: white;">Ocultar</button>
            <br>
            <button onclick="showCurrentPage()" style="margin: 2px; padding: 5px; font-size: 10px; background: purple; color: white;">Página Actual</button>
        `;
        
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 5px;
            cursor: move;
            user-select: none;
            font-family: Arial, sans-serif;
            min-width: 200px;
        `;
        
        document.body.appendChild(panel);
        return panel;
    }
    
    // Variables para el arrastre
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    // Función para iniciar el arrastre
    function startDrag(e) {
        if (e.target.tagName === 'BUTTON') return; // No arrastrar si se hace clic en un botón
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        const panel = document.getElementById('global-debug-panel');
        if (panel && (e.target === panel || panel.contains(e.target))) {
            isDragging = true;
        }
    }
    
    // Función para arrastrar
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            xOffset = currentX;
            yOffset = currentY;
            
            const panel = document.getElementById('global-debug-panel');
            if (panel) {
                panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        }
    }
    
    // Función para detener el arrastre
    function stopDrag() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }
    
    // Función para ocultar/mostrar el panel
    function toggleGlobalDebugPanel() {
        const panel = document.getElementById('global-debug-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    // Función para mostrar la página actual
    function showCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop();
        alert(`Página actual: ${currentPage}\nURL completa: ${window.location.href}`);
    }
    
    // Hacer funciones globales
    window.toggleGlobalDebugPanel = toggleGlobalDebugPanel;
    window.showCurrentPage = showCurrentPage;
    
    // Inicializar cuando el DOM esté listo
    function init() {
        // Crear el panel
        const panel = createDebugPanel();
        
        // Agregar event listeners
        panel.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        // Restaurar posición si existe en localStorage
        const savedPosition = localStorage.getItem('debug-panel-position');
        if (savedPosition) {
            const pos = JSON.parse(savedPosition);
            panel.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
            xOffset = pos.x;
            yOffset = pos.y;
        }
        
        // Guardar posición cuando se mueve
        panel.addEventListener('mouseup', function() {
            const transform = panel.style.transform;
            const match = transform.match(/translate3d\(([^,]+)px,\s*([^,]+)px/);
            if (match) {
                localStorage.setItem('debug-panel-position', JSON.stringify({
                    x: parseFloat(match[1]),
                    y: parseFloat(match[2])
                }));
            }
        });
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

