# Instrucciones de Instalación - SmartLunch React

## Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Backend API corriendo en `http://localhost:8000`

## Pasos de Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar la API:**
   - Asegúrate de que el archivo `/Views/config.json` existe y tiene la configuración correcta:
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

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm start
   ```

   La aplicación se abrirá automáticamente en `http://localhost:3000`

## Build para Producción

```bash
npm run build
```

Esto creará una carpeta `build` con los archivos optimizados para producción.

## Características PWA

La aplicación está configurada como PWA (Progressive Web App), lo que significa:

- ✅ Puede instalarse en dispositivos móviles, tablets y computadoras
- ✅ Funciona offline (con caché)
- ✅ Service Worker configurado
- ✅ Manifest.json para instalación

### Instalación en Dispositivos

**En móviles/tablets:**
- Abre la aplicación en el navegador
- Busca la opción "Agregar a pantalla de inicio" o "Instalar app"
- La aplicación se instalará como una app nativa

**En computadoras:**
- En Chrome/Edge: Busca el ícono de instalación en la barra de direcciones
- En Firefox: Usa el menú de opciones del navegador

## Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
├── contexts/        # Contextos de React (Auth, Config)
├── pages/           # Páginas de la aplicación
├── services/        # Servicios de API
└── styles/          # Estilos CSS
```

## Notas Importantes

- El diseño se mantiene idéntico al original
- La lógica de conexión a la API se mantiene igual
- Compatible con el backend existente
- Las imágenes deben estar en `/public/Views/img/` o `/Views/img/`

## Solución de Problemas

**Error de conexión con la API:**
- Verifica que el backend esté corriendo en `http://localhost:8000`
- Verifica la configuración en `/Views/config.json`
- Revisa la consola del navegador para más detalles

**Error de CORS:**
- Asegúrate de que el backend tenga configurado CORS correctamente
- Verifica que la URL de la API sea correcta

**PWA no funciona:**
- Asegúrate de estar usando HTTPS en producción (o localhost en desarrollo)
- Verifica que el service worker esté registrado correctamente

