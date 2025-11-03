# 📚 Guía: Cómo Correr el Frontend de SmartLunch

## 🎯 Requisitos Previos

1. **Python instalado** (viene con Windows 10/11, o descargar de python.org)
2. **Backend corriendo en `http://localhost:8000`** (debe estar iniciado primero)

---

## 🚀 Método 1: Usando Python (Recomendado - Más Simple)

### Paso 1: Abrir Terminal/PowerShell
- Presiona `Win + R`
- Escribe `cmd` o `powershell`
- Presiona Enter

### Paso 2: Navegar a la Carpeta del Proyecto
```bash
cd C:\Noelia\smartLuchFront\Views
```

### Paso 3: Iniciar Servidor HTTP Simple
```bash
# Python 3 (recomendado)
python -m http.server 4200

# Si no funciona, prueba con:
python3 -m http.server 4200

# O si tienes Python 2:
python -m SimpleHTTPServer 4200
```

### Paso 4: Abrir en el Navegador
1. Abre tu navegador (Chrome, Firefox, Edge)
2. Ve a: `http://localhost:4200`
3. Deberías ver la página de login o inicio

---

## 🚀 Método 2: Usando Node.js (si lo tienes instalado)

### Paso 1: Instalar http-server globalmente (solo una vez)
```bash
npm install -g http-server
```

### Paso 2: Navegar a la Carpeta
```bash
cd C:\Noelia\smartLuchFront\Views
```

### Paso 3: Iniciar Servidor
```bash
http-server -p 4200
```

### Paso 4: Abrir en el Navegador
Ve a: `http://localhost:4200`

---

## 🚀 Método 3: Usando Visual Studio Code Live Server

### Paso 1: Instalar Extension
1. Abre Visual Studio Code
2. Ve a Extensiones (Ctrl + Shift + X)
3. Busca "Live Server"
4. Instala la extensión

### Paso 2: Iniciar Servidor
1. Abre la carpeta `Views` en VS Code
2. Clic derecho en `index.html`
3. Selecciona "Open with Live Server"

---

## ⚠️ IMPORTANTE: Configuración del Backend

**El frontend necesita que el backend esté corriendo en:**
```
http://localhost:8000
```

**Asegúrate de que:**
1. El backend esté iniciado
2. Las APIs estén disponibles en `http://localhost:8000/api/...`
3. Si el backend usa otro puerto, debes cambiar las URLs en los archivos JavaScript:
   - `Views/js/Index.js`
   - `Views/js/menudeldia.js`
   - `Views/js/despacho.js`
   - Y otros archivos `.js` en `Views/js/`

**Buscar y reemplazar:**
```javascript
// Buscar todas las ocurrencias de:
'http://localhost:8000'

// Y cambiarlas por el puerto correcto si es necesario
```

---

## 🔧 Solución de Problemas

### Error: "Python no se reconoce como comando"
- **Solución**: Instala Python desde python.org
- O usa el Método 2 (Node.js) o Método 3 (VS Code)

### Error: "Puerto 4200 ya está en uso"
- **Solución**: Usa otro puerto:
```bash
python -m http.server 4201
```
- Y luego abre: `http://localhost:4201`

### Error: "No se puede conectar a la API"
- **Solución**: Verifica que el backend esté corriendo en `http://localhost:8000`
- Revisa la consola del navegador (F12) para ver los errores

### Error: "Archivos CSS/JS no se cargan"
- **Solución**: Asegúrate de estar en la carpeta `Views` cuando inicias el servidor
- Las rutas en los archivos HTML son relativas desde `Views/`

---

## 📝 Notas Importantes

1. **Rutas relativas**: Los archivos HTML están configurados para trabajar desde la carpeta `Views/`
2. **CORS**: Si el backend está en otro puerto, asegúrate de que tenga CORS habilitado
3. **Archivos estáticos**: El servidor solo sirve archivos estáticos (HTML, CSS, JS, imágenes)
4. **Hot reload**: Los métodos 1 y 2 NO tienen hot reload. Si cambias código, recarga la página manualmente (F5)

---

## ✅ Verificación

Para verificar que todo funciona:

1. ✅ Servidor corriendo en `http://localhost:4200`
2. ✅ Backend corriendo en `http://localhost:8000`
3. ✅ Navegador abierto en `http://localhost:4200`
4. ✅ Puedes ver la página de login o inicio
5. ✅ La consola del navegador (F12) no muestra errores de red

---

## 🎉 ¡Listo!

Si todo está correcto, deberías poder usar la aplicación normalmente.

Para detener el servidor, presiona `Ctrl + C` en la terminal.

