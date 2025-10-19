// Toast personalizado que no mueve la página
window.CustomToast = {
    show: function(message, type = 'warning') {
        // Crear el toast
        var toast = document.createElement('div');
        toast.className = 'custom-toast custom-toast-' + type;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="toast-message">${message}</div>
                <div class="toast-close" onclick="CustomToast.hide(this.parentElement.parentElement)">×</div>
            </div>
        `;
        
        // Agregar estilos inline para asegurar posicionamiento
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 400px;
            padding: 16px;
            font-family: Arial, sans-serif;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Agregar al body
        document.body.appendChild(toast);
        
        // Auto-ocultar después de 3 segundos
        setTimeout(function() {
            CustomToast.hide(toast);
        }, 3000);
        
        return toast;
    },
    
    hide: function(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }
};

// Agregar estilos CSS dinámicamente
var style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .custom-toast {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 9999 !important;
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .toast-icon {
        color: #f39c12;
        font-size: 18px;
    }
    
    .toast-message {
        flex: 1;
        font-size: 14px;
        color: #333;
    }
    
    .toast-close {
        cursor: pointer;
        font-size: 18px;
        color: #999;
        font-weight: bold;
    }
    
    .toast-close:hover {
        color: #666;
    }
`;
document.head.appendChild(style);
