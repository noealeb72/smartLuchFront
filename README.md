# SmartLunch - React PWA

Sistema de Gestión de Comedores migrado a React con soporte PWA.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Build para producción
npm run build
```

## 📁 Estructura del Proyecto

```
smartLuchFront-react/
├── public/              # Archivos públicos
│   ├── Views/
│   │   ├── config.json  # Configuración de la API
│   │   └── img/         # Imágenes del proyecto
│   ├── index.html       # HTML principal
│   ├── manifest.json    # Configuración PWA
│   └── service-worker.js
├── src/                 # Código fuente React
│   ├── components/      # Componentes reutilizables
│   ├── contexts/       # Contextos de React
│   ├── pages/          # Páginas de la aplicación
│   ├── services/       # Servicios de API
│   └── styles/        # Estilos CSS
└── package.json
```

## ⚙️ Configuración

Edita `public/Views/config.json` para configurar la URL de la API:

```json
{
  "API_BASE_URL": "http://localhost:8000",
  "URL_HOME": "http://localhost:3000",
  "BLOQUEO_USUARIOS": {
    "Admin": false,
    "Cocina": false,
    "Comensal": false,
    "Gerencia": false
  }
}
```

## 📱 PWA

La aplicación es una Progressive Web App (PWA) que puede:
- ✅ Instalarse en dispositivos móviles, tablets y computadoras
- ✅ Funcionar offline (con caché)
- ✅ Ofrecer experiencia similar a una app nativa

## 🎨 Características

- **React 18** con hooks modernos
- **React Router** para navegación
- **Context API** para manejo de estado global
- **Axios** para llamadas HTTP
- **PWA** completamente funcional
- **Diseño responsive** (móvil, tablet, desktop)
- **Mismo diseño** que la versión original

## 📚 Documentación Adicional

- [README_REACT.md](README_REACT.md) - Detalles técnicos de la migración
- [README_INSTALACION.md](README_INSTALACION.md) - Guía de instalación detallada

## 🔧 Tecnologías

- React 18.2.0
- React Router 6.20.0
- Axios 1.6.2
- SweetAlert2 11.10.3
- Bootstrap 4.5.0
- qrcode.react 3.1.0

## 📝 Notas

- El diseño se mantiene idéntico al original
- Compatible con el backend existente
- Todas las imágenes están en `public/Views/img/`
- La configuración está en `public/Views/config.json`

