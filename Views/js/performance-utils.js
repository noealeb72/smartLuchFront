/**
 * Utilidades de rendimiento para SmartLunch
 * - Debounce/Throttle
 * - Cache de API
 * - Lazy loading helpers
 */

(function() {
    'use strict';

    // ============================================
    // DEBOUNCE - Para búsquedas y filtros
    // ============================================
    window.debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    // ============================================
    // THROTTLE - Para scroll y resize
    // ============================================
    window.throttle = function(func, limit) {
        var inThrottle;
        return function() {
            var args = arguments;
            var context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() {
                    inThrottle = false;
                }, limit);
            }
        };
    };

    // ============================================
    // CACHE SIMPLE DE API
    // ============================================
    window.apiCache = {
        cache: {},
        maxAge: 5 * 60 * 1000, // 5 minutos por defecto
        
        get: function(key) {
            var item = this.cache[key];
            if (!item) return null;
            
            if (Date.now() - item.timestamp > this.maxAge) {
                delete this.cache[key];
                return null;
            }
            
            return item.data;
        },
        
        set: function(key, data) {
            this.cache[key] = {
                data: data,
                timestamp: Date.now()
            };
        },
        
        clear: function() {
            this.cache = {};
        },
        
        // Limpiar entradas expiradas
        clean: function() {
            var now = Date.now();
            for (var key in this.cache) {
                if (this.cache.hasOwnProperty(key)) {
                    if (now - this.cache[key].timestamp > this.maxAge) {
                        delete this.cache[key];
                    }
                }
            }
        }
    };

    // Limpiar cache cada 10 minutos
    setInterval(function() {
        window.apiCache.clean();
    }, 10 * 60 * 1000);

    // ============================================
    // LAZY LOADING DE IMÁGENES
    // ============================================
    window.lazyLoadImages = function() {
        if ('IntersectionObserver' in window) {
            var imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px'
            });

            var lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(function(img) {
                imageObserver.observe(img);
            });
        } else {
            // Fallback para navegadores antiguos
            var lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(function(img) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    };

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.lazyLoadImages);
    } else {
        window.lazyLoadImages();
    }

    // ============================================
    // LOGGER CONDICIONAL (solo en desarrollo)
    // ============================================
    window.isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('dev');

    window.perfLog = function() {
        if (window.isDevelopment && window.console && window.console.log) {
            window.console.log.apply(window.console, arguments);
        }
    };

    window.perfWarn = function() {
        if (window.isDevelopment && window.console && window.console.warn) {
            window.console.warn.apply(window.console, arguments);
        }
    };

    window.perfError = function() {
        // Los errores siempre se muestran
        if (window.console && window.console.error) {
            window.console.error.apply(window.console, arguments);
        }
    };

})();





