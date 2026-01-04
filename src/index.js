import React from 'react';
import ReactDOM from 'react-dom/client';
// Importar CSS críticos primero para evitar FOUC (Flash of Unstyled Content)
// El orden es importante: primero variables, luego estilos globales, luego específicos
import './index.css';
import './styles/globalStyles.css';
import './styles/smartstyle.css';
import './App.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Preload de recursos críticos (solo cuando realmente se necesiten)
// Se elimina el preload automático para evitar warnings del navegador
// Las imágenes se cargarán cuando se usen en los componentes

// Crear root una sola vez
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizar la aplicación
// Los imports de CSS arriba se procesan síncronamente antes de este punto
// Esto asegura que los estilos críticos estén disponibles antes del renderizado
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar el service worker para PWA (solo en producción)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register();
}

// Performance monitoring en desarrollo
if (process.env.NODE_ENV === 'development') {
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS(console.log);
    onFID(console.log);
    onFCP(console.log);
    onLCP(console.log);
    onTTFB(console.log);
  });
}
