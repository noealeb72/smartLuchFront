import { useEffect } from 'react';

/**
 * Hook para forzar la aplicación de estilos después del montaje del componente
 * Esto ayuda a prevenir problemas de FOUC (Flash of Unstyled Content)
 * especialmente en componentes lazy-loaded
 */
export const useForceStyles = () => {
  useEffect(() => {
    // Forzar re-aplicación de estilos después del montaje
    const forceStyleApplication = () => {
      // Obtener todos los inputs y selects del documento
      const inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), textarea, select');
      
      inputs.forEach((element) => {
        // Solo aplicar si no está en el login
        if (!element.closest('.login-container') && !element.closest('.user_card')) {
          // Forzar recálculo de estilos
          const computedStyle = window.getComputedStyle(element);
          
          // Aplicar estilos críticos si no están aplicados
          if (!computedStyle.fontFamily || computedStyle.fontFamily === 'initial') {
            element.style.fontFamily = 'var(--smart-font-primary)';
          }
          
          if (!computedStyle.border || computedStyle.border === 'none' || computedStyle.border === '0px') {
            element.style.border = '1px solid var(--smart-gray-light)';
          }
          
          if (!computedStyle.backgroundColor || computedStyle.backgroundColor === 'transparent') {
            element.style.backgroundColor = 'var(--smart-white)';
          }
          
          // Para selects específicamente
          if (element.tagName === 'SELECT') {
            element.style.paddingRight = '2.5rem';
            element.style.minHeight = 'calc(1.5em + 0.75rem + 2px)';
            element.style.appearance = 'auto';
            element.style.webkitAppearance = 'menulist';
            element.style.mozAppearance = 'menulist';
          }
        }
      });
    };

    // Ejecutar inmediatamente
    forceStyleApplication();

    // Ejecutar después de un pequeño delay para asegurar que el DOM esté completamente renderizado
    const timeoutId = setTimeout(forceStyleApplication, 100);

    // Ejecutar también después de que todas las imágenes y recursos se hayan cargado
    if (document.readyState === 'complete') {
      forceStyleApplication();
    } else {
      window.addEventListener('load', forceStyleApplication);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('load', forceStyleApplication);
    };
  }, []);
};

