# 🛠️ Stack Tecnológico del Frontend - SmartLunch

## 📋 Resumen

El frontend de SmartLunch está desarrollado como una **Single Page Application (SPA)** usando tecnologías web estándar, principalmente **AngularJS** (versión 1.x) con HTML5, CSS3 y JavaScript puro.

---

## 🔧 Tecnologías Principales

### 1. **Framework JavaScript**
- **AngularJS 1.x** (versión legacy)
  - Módulo: `AngujarJS` (nota: el nombre tiene un typo intencional o histórico)
  - Usa controladores y directivas de AngularJS
  - Data binding bidireccional con `$scope`
  - Sistema de rutas básico (aunque parece usar navegación por archivos HTML)

### 2. **Bibliotecas Core**

#### JavaScript
- **jQuery 3.6.0** - Manipulación del DOM y utilidades
- **Bootstrap 4.6.2** - Framework CSS y componentes
- **Popper.js 1.16.0** - Para tooltips y popovers de Bootstrap
- **Moment.js 2.22.2** - Manipulación de fechas y horas
- **SweetAlert2 11** - Alertas y modales modernos

#### AngularJS Extensions
- **angular-qr** - Generación de códigos QR
- **ja.qr** - Otra librería de QR (módulo de AngularJS)

#### Otras Utilidades
- **QRCode.js** - Generación de códigos QR
- **JsBarcode 3.11.5** - Generación de códigos de barras
- **Modernizr 2.8.3** - Detección de características del navegador

### 3. **CSS y Estilos**

#### Frameworks CSS
- **Bootstrap 4.5.0** - Framework principal
- **Bootstrap Theme** - Tema personalizado

#### Librerías de UI
- **Font Awesome 5.8.1** - Iconos vectoriales
- **Linearicons** - Set de iconos adicional
- **Select2** - Select boxes mejorados
- **Owl Carousel** - Carruseles y sliders
- **Tempus Dominus Bootstrap 4** - Selector de fecha/hora
- **Featherlight** - Lightbox/modales ligeros

#### Fuentes
- **Google Fonts**
  - Open Sans (300, 400, 700)
  - Josefin Sans (300, 400, 700)

### 4. **Arquitectura del Proyecto**

```
Views/
├── *.html          # Templates HTML (una por cada vista/página)
├── js/             # JavaScript organizado por funcionalidad
│   ├── index.js    # Controlador principal
│   ├── menudeldia.js
│   ├── despacho.js
│   ├── bonificaciones-service.js
│   └── ...
├── css/            # Estilos personalizados
├── img/            # Imágenes y assets
├── vendor/         # Librerías locales
└── ...
```

---

## 🏗️ Estructura de la Aplicación

### Tipo: **Multi-Page Application (MPA)**
- Cada sección tiene su propio archivo HTML
- Ejemplos: `index.html`, `menudeldia.html`, `despacho.html`, etc.
- Navegación entre páginas mediante enlaces directos

### Patrón de Controladores
Cada página HTML tiene su controlador AngularJS correspondiente:
- `index.html` → Controlador `Index`
- `menudeldia.html` → Controlador `Menudeldia`
- `despacho.html` → Controlador `Despacho`
- etc.

### Servicios
- **BonificacionesService** - Lógica de bonificaciones y descuentos
- Servicios API mediante `$http` de AngularJS

---

## 📡 Comunicación con el Backend

### API REST
- Todas las llamadas usan `$http` de AngularJS
- Base URL: `http://localhost:8000/api/`
- Endpoints principales:
  - `/api/comanda/` - Gestión de pedidos
  - `/api/plato/` - Gestión de platos
  - `/api/menudd/` - Menú del día
  - `/api/jerarquia/` - Jerarquías y bonificaciones
  - `/api/turno/` - Turnos disponibles
  - etc.

### Almacenamiento Local
- **localStorage** - Almacenamiento de:
  - Datos de usuario (nombre, apellido, rol, DNI, etc.)
  - Configuración de sesión
  - Preferencias del usuario

---

## 🎨 Características del Frontend

### 1. **Responsive Design**
- Bootstrap 4 para diseño adaptable
- Media queries personalizadas
- Optimizado para móviles y tablets

### 2. **Componentes Reutilizables**
- `navbar.html` - Navbar compartido (usado con `ng-include`)
- `footer.html` - Footer compartido

### 3. **Validación**
- jQuery Validate para formularios
- Validaciones personalizadas con AngularJS
- Feedback visual con SweetAlert2

### 4. **Gestión de Estado**
- `$scope` de AngularJS para estado local
- `localStorage` para persistencia entre páginas
- No usa un sistema de gestión de estado global (como Redux)

---

## 🔌 Dependencias Externas (CDN)

### Librerías desde CDN:
- Bootstrap (CSS y JS)
- jQuery
- AngularJS
- Font Awesome
- Google Fonts
- SweetAlert2
- Moment.js
- Y otras...

### Librerías Locales:
- AngularJS minificado local
- Código JavaScript personalizado en `Views/js/`
- Estilos personalizados en `Views/css/`

---

## ⚙️ Tecnologías No Utilizadas

Este proyecto **NO usa**:
- ❌ React, Vue, Angular (2+) u otros frameworks modernos
- ❌ TypeScript (solo JavaScript puro)
- ❌ Build tools (Webpack, Vite, etc.)
- ❌ Package managers (npm, yarn) para el frontend
- ❌ Preprocesadores CSS (SASS, LESS) - solo CSS puro
- ❌ Transpiladores (Babel)

---

## 📝 Observaciones Importantes

### 1. **AngularJS Legacy**
- AngularJS 1.x es una tecnología legacy (última versión en 2016)
- No se recomienda para proyectos nuevos
- Pero este proyecto ya está funcionando con esta tecnología

### 2. **Sin Build Process**
- No hay compilación/transpilación
- Los archivos `.js` se ejecutan directamente en el navegador
- Estructura simple y directa

### 3. **Servidor Estático**
- Solo necesita un servidor HTTP estático
- No requiere Node.js, PHP, o servidor de aplicaciones para el frontend
- El backend (C#/ASP.NET) corre por separado en el puerto 8000

---

## 🎯 Resumen Técnico

| Aspecto | Tecnología |
|---------|-----------|
| **Framework JS** | AngularJS 1.x |
| **Librería DOM** | jQuery 3.6.0 |
| **CSS Framework** | Bootstrap 4.5.0 |
| **Alertas** | SweetAlert2 |
| **Fechas** | Moment.js |
| **Tipo de App** | Multi-Page Application (MPA) |
| **Build Tool** | Ninguno (archivos estáticos) |
| **Package Manager** | Ninguno |
| **Servidor** | HTTP estático simple |
| **Backend** | C#/ASP.NET Web API (puerto 8000) |

---

## 🚀 Ventajas de este Stack

✅ **Simple de entender** - No requiere conocimiento de build tools  
✅ **Rápido de ejecutar** - Solo sirve archivos estáticos  
✅ **Fácil de modificar** - Edición directa de HTML/JS/CSS  
✅ **Compatible** - Funciona en navegadores modernos  

## ⚠️ Desventajas

❌ **Tecnología legacy** - AngularJS 1.x está en mantenimiento final  
❌ **Sin bundling** - Carga múltiples archivos JS  
❌ **Sin optimización** - No hay minificación automática  
❌ **Mantenimiento** - Puede ser difícil escalar  

---

## 📚 Conclusión

El frontend está construido con tecnologías web tradicionales, centrado en **AngularJS 1.x** y **Bootstrap 4**. Es una aplicación simple, sin procesos de build, que funciona bien para el propósito actual, pero usa tecnologías que están en desuso para proyectos nuevos.

