# Logo SmartLunch – Cómo armarlo

## Dónde está el logo

- **Imágenes:** `public/Views/img/`
  - `logo.png` – logo principal
  - `logo-circular-rojo.png` – logo circular rojo
  - `logo-preview.png` – vista previa (usado como fallback de platos)
- **Componente:** `src/components/Logo.js` – logo reutilizable en toda la app.

## Cómo se usa

El logo se muestra en:

1. **Navbar** (barra superior) – icono + texto "SmartLunch"
2. **Login** – icono + texto "Smart Lunch" (en columna)
3. **Footer** – solo texto "SmartLunch" (si usas el componente ahí)

### Usar icono + texto (actual)

```jsx
import Logo from '../components/Logo';

<Logo variant="navbar" />        // Barra superior
<Logo variant="login" text="Smart Lunch" />  // Login
<Logo variant="footer" />        // Pie
```

### Usar imagen en lugar de icono + texto

```jsx
import Logo, { LOGO_IMAGE, LOGO_CIRCULAR } from '../components/Logo';

// Logo rectangular (logo.png)
<Logo variant="navbar" useImage />
<Logo variant="login" useImage />

// Logo circular rojo
<Logo variant="navbar" useImage imageSrc={LOGO_CIRCULAR} />
```

Ruta por defecto de la imagen: `/Views/img/logo.png`. Para el circular: `imageSrc={LOGO_CIRCULAR}`.

### Cambiar la imagen del logo

1. Sustituye el archivo en `public/Views/img/logo.png` (o el que uses en `imageSrc`).
2. O pasa otra ruta: `<Logo useImage imageSrc="/ruta/a/mi-logo.png" />`.

### Favicon y PWA

- **Favicon:** `public/favicon.ico` (referenciado en `public/index.html`).
- **PWA:** `public/manifest.json` usa `logo192.png` y `logo512.png`; si no existen, créalos en `public/` o actualiza las rutas en el manifest.
