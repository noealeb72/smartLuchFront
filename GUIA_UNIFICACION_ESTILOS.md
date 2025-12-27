# 🎨 Guía de Unificación de Estilos - SmartLunch

## ✅ Cambios Realizados

### 1. Variables CSS Globales
Se han actualizado todas las variables CSS en `src/index.css` con la paleta completa de colores de SmartLunch:

- ✅ **Colores Primarios**: Primary, Primary Dark, Primary Darker, Primary Light, Primary Lighter, Primary Background
- ✅ **Colores Secundarios**: Orange, Yellow y sus variantes
- ✅ **Colores de Estado**: Success, Danger, Warning, Info y sus variantes
- ✅ **Colores Neutros**: Gray Dark, Gray, Gray Medium, Gray Light, Gray Lighter, Gray Lightest
- ✅ **Colores de Acento**: Emerald, Sky Blue, Purple, Pink
- ✅ **Fondos**: Primary, Secondary, Tertiary, Dark
- ✅ **Fuentes**: Primary (Open Sans), Headings (Josefin Sans), Monospace

### 2. Archivo de Estilos Globales
Se ha creado `src/styles/globalStyles.css` con estilos unificados para:

- ✅ **Tipografía**: Aplicación consistente de fuentes (Open Sans para texto, Josefin Sans para títulos)
- ✅ **Botones**: Estilos unificados para todos los tipos de botones (Primary, Secondary, Success, Danger, Warning, Info)
- ✅ **Formularios**: Estilos consistentes para inputs, textareas, selects y labels
- ✅ **Tablas**: Estilos unificados para headers, celdas, hover y striped
- ✅ **Alertas**: Estilos consistentes para mensajes de éxito, error, advertencia e información
- ✅ **Badges**: Estilos unificados para todas las etiquetas
- ✅ **Navbar**: Estilos consistentes usando variables CSS
- ✅ **Cards**: Estilos unificados para contenedores
- ✅ **Form Sections**: Estilos consistentes para secciones de formularios
- ✅ **Links**: Estilos unificados con hover y focus
- ✅ **Modales**: Estilos consistentes para headers, body y footer
- ✅ **Dropdowns**: Estilos unificados para menús desplegables

### 3. Archivos Actualizados

#### `src/index.css`
- ✅ Variables CSS completas de la paleta
- ✅ Fuentes unificadas (Open Sans para body, Josefin Sans para títulos)
- ✅ Clases utilitarias de colores (text-smart-*, bg-smart-*, border-smart-*)

#### `src/styles/smartstyle.css`
- ✅ Actualizado para usar variables CSS en lugar de colores hardcodeados
- ✅ Mantiene compatibilidad con estilos legacy

#### `src/pages/Login.css`
- ✅ Actualizado para usar variables CSS
- ✅ Colores hardcodeados reemplazados por variables
- ✅ Fuentes unificadas

#### `src/pages/Usuarios.css`
- ✅ Actualizado para usar variables CSS en tablas
- ✅ Colores hardcodeados reemplazados por variables

#### `src/index.js`
- ✅ Importado `globalStyles.css` para aplicar estilos globales

## 📋 Estándares de Uso

### Fuentes
- **Texto general**: `var(--smart-font-primary)` (Open Sans)
- **Títulos**: `var(--smart-font-headings)` (Josefin Sans)
- **Código**: `var(--smart-font-monospace)`

### Colores
- **Primario**: `var(--smart-primary)` - Botones principales, navbar
- **Éxito**: `var(--smart-success)` - Operaciones exitosas
- **Peligro**: `var(--smart-danger)` - Errores, eliminaciones
- **Advertencia**: `var(--smart-warning)` - Advertencias
- **Información**: `var(--smart-info)` - Información general
- **Grises**: Usar `var(--smart-gray-*)` según necesidad

### Botones
Usar las clases de Bootstrap con las variables CSS o las clases personalizadas:
- `.btn-primary` o `.btn-smart-primary`
- `.btn-success` o `.btn-smart-success`
- `.btn-danger` o `.btn-smart-danger`
- `.btn-warning` o `.btn-smart-warning`
- `.btn-info` o `.btn-smart-info`
- `.btn-secondary` o `.btn-smart-secondary`

### Formularios
- Inputs: Usar `var(--smart-gray-light)` para bordes
- Focus: Usar `var(--smart-primary)` con box-shadow
- Labels: Usar `var(--smart-gray-dark)` con font-weight 500

## 🔄 Próximos Pasos

Para completar la unificación en todas las pantallas, se recomienda:

1. **Revisar cada página** y reemplazar colores hardcodeados por variables CSS
2. **Asegurar fuentes consistentes** usando las variables de fuente
3. **Usar clases utilitarias** cuando sea posible (text-smart-*, bg-smart-*)
4. **Mantener consistencia** en espaciados y tamaños

## 📝 Ejemplo de Uso

```css
/* ❌ Antes (colores hardcodeados) */
.mi-boton {
  background-color: #F34949;
  color: #ffffff;
  font-family: 'Open Sans', sans-serif;
}

/* ✅ Después (usando variables CSS) */
.mi-boton {
  background-color: var(--smart-primary);
  color: var(--smart-white);
  font-family: var(--smart-font-primary);
}
```

```jsx
// ❌ Antes (estilos inline hardcodeados)
<button style={{ backgroundColor: '#F34949', color: '#fff' }}>
  Guardar
</button>

// ✅ Después (usando variables CSS o clases)
<button className="btn btn-smart-primary">
  Guardar
</button>
```

## 🎯 Beneficios

1. **Consistencia Visual**: Todas las pantallas usan la misma paleta de colores
2. **Mantenibilidad**: Cambios de colores centralizados en variables CSS
3. **Escalabilidad**: Fácil agregar nuevos colores o modificar existentes
4. **Accesibilidad**: Colores definidos con contraste adecuado
5. **Rendimiento**: Menos CSS duplicado, mejor caché del navegador

