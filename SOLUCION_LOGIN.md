# Solución: Siempre Abrir en Login

## Problema
La aplicación abre directamente en la página del menú (index.html) en lugar de abrir siempre en el login.

## ✅ Solución Implementada

### 1. **Archivo de Redirección**
- Creé `default.html` que redirige automáticamente al login
- Configuré el servidor para usar este archivo como página inicial

### 2. **Limpieza Automática de Datos**
- El login ahora limpia automáticamente todos los datos de usuario
- Evita que la aplicación piense que ya hay un usuario logueado

### 3. **Verificación de Autenticación**
- Agregué `auth-check.js` que verifica si hay usuario logueado
- Redirige al login si no hay autenticación

### 4. **Configuración del Servidor**
- Modifiqué `Web.config` para que siempre abra en login
- Configuré redirección automática

## 🚀 Cómo Funciona Ahora

### Flujo Normal:
1. **Abrir aplicación** → Siempre va a `Views/login.html`
2. **Login exitoso** → Redirige a `Views/index.html`
3. **Sin login** → Permanece en login

### Archivos Creados/Modificados:

#### Nuevos archivos:
- ✅ `default.html` - Redirección automática al login
- ✅ `Views/js/auth-check.js` - Verificación de autenticación
- ✅ `Views/js/auto-logout.js` - Limpieza automática de datos

#### Archivos modificados:
- ✅ `Web.config` - Configuración del servidor
- ✅ `Views/js/login.js` - Limpieza automática de datos
- ✅ `Views/js/login-demo.js` - Sin redirección automática

## 🔍 Verificación

Para confirmar que funciona:

1. **Abrir la aplicación** → Debería ir a `Views/login.html`
2. **Hacer login** → Debería ir a `Views/index.html`
3. **Cerrar y abrir de nuevo** → Debería volver a `Views/login.html`

## 🛠️ Configuración

### Para cambiar el comportamiento:
- **Siempre login**: Ya está configurado por defecto
- **Recordar usuario**: Comentar las líneas de `localStorage.clear()` en `login.js`

### Para deshabilitar verificación de autenticación:
- Comentar la inclusión de `auth-check.js` en `index.html`

## ✅ Resultado

- ✅ **Siempre abre en login** por defecto
- ✅ **No recuerda usuarios** entre sesiones
- ✅ **Redirección automática** al login
- ✅ **Limpieza automática** de datos de usuario
- ✅ **Verificación de autenticación** en páginas protegidas

**La aplicación ahora siempre abrirá en el login como solicitaste.**
