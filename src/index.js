import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Preload de recursos críticos
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Preload de imágenes críticas
    const criticalImages = [
      '/Views/img/logo-preview.png',
      '/Views/img/hero-2.jpg',
    ];
    criticalImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));

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
