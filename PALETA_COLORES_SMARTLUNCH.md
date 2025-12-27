# 🎨 Paleta de Colores - SmartLunch

## 📋 Índice
1. [Colores Primarios](#colores-primarios)
2. [Colores Secundarios](#colores-secundarios)
3. [Colores de Estado](#colores-de-estado)
4. [Colores Neutros](#colores-neutros)
5. [Colores de Acento](#colores-de-acento)
6. [Colores de Fondo](#colores-de-fondo)
7. [Uso en CSS](#uso-en-css)

---

## 🔴 Colores Primarios

### Rojo Principal (Actual)
- **Primary**: `#F34949` - Color principal de la marca
- **Primary Dark**: `#E63939` - Hover, estados activos
- **Primary Darker**: `#C92A2A` - Estados presionados, bordes
- **Primary Light**: `#FF6B6B` - Fondos suaves, highlights
- **Primary Lighter**: `#FF9999` - Fondos muy suaves
- **Primary Background**: `#FFE5E5` - Fondos de secciones

### Alternativas de Rojo
- **Rojo Coral**: `#FF6B6B`
- **Rojo Tomate**: `#FF6347`
- **Rojo Fuego**: `#FF4500`
- **Rojo Carmesí**: `#DC143C`

---

## 🟠 Colores Secundarios

### Naranja (Complementario)
- **Orange**: `#FF8C42` - Acciones secundarias
- **Orange Dark**: `#E67E3A` - Hover
- **Orange Light**: `#FFA366` - Fondos suaves
- **Orange Background**: `#FFF4ED` - Fondos de secciones

### Amarillo (Acento)
- **Yellow**: `#FFC107` - Alertas, destacados
- **Yellow Dark**: `#FFB300` - Hover
- **Yellow Light**: `#FFD54F` - Fondos suaves
- **Yellow Background**: `#FFF9E6` - Fondos de secciones

---

## ✅ Colores de Estado

### Éxito (Success)
- **Success**: `#28A745` - Operaciones exitosas
- **Success Dark**: `#218838` - Hover
- **Success Light**: `#4CAF50` - Variante clara
- **Success Background**: `#E8F5E9` - Fondos de mensajes

### Error (Danger)
- **Danger**: `#DC3545` - Errores, eliminaciones
- **Danger Dark**: `#C82333` - Hover
- **Danger Light**: `#F44336` - Variante clara
- **Danger Background**: `#FFEBEE` - Fondos de mensajes

### Advertencia (Warning)
- **Warning**: `#FFC107` - Advertencias
- **Warning Dark**: `#FFB300` - Hover
- **Warning Light**: `#FFD54F` - Variante clara
- **Warning Background**: `#FFF9E6` - Fondos de mensajes

### Información (Info)
- **Info**: `#17A2B8` - Información general
- **Info Dark**: `#138496` - Hover
- **Info Light**: `#03A9F4` - Variante clara
- **Info Background**: `#E0F7FA` - Fondos de mensajes

---

## ⚫ Colores Neutros

### Grises
- **Gray Dark**: `#343A40` - Textos principales, headers
- **Gray**: `#495057` - Textos secundarios
- **Gray Medium**: `#6C757D` - Textos terciarios, placeholders
- **Gray Light**: `#ADB5BD` - Bordes, separadores
- **Gray Lighter**: `#E9ECEF` - Fondos de inputs
- **Gray Lightest**: `#F8F9FA` - Fondos de secciones

### Blanco y Negro
- **White**: `#FFFFFF` - Fondos principales
- **Black**: `#000000` - Textos muy oscuros
- **Off White**: `#FAFAFA` - Fondos alternativos

---

## 🎨 Colores de Acento

### Verde Esmeralda
- **Emerald**: `#10B981` - Acciones positivas
- **Emerald Dark**: `#059669` - Hover
- **Emerald Light**: `#34D399` - Variante clara

### Azul Cielo
- **Sky Blue**: `#0EA5E9` - Links, enlaces
- **Sky Blue Dark**: `#0284C7` - Hover
- **Sky Blue Light**: `#38BDF8` - Variante clara

### Púrpura
- **Purple**: `#8B5CF6` - Elementos especiales
- **Purple Dark**: `#7C3AED` - Hover
- **Purple Light**: `#A78BFA` - Variante clara

### Rosa
- **Pink**: `#EC4899` - Elementos destacados
- **Pink Dark**: `#DB2777` - Hover
- **Pink Light**: `#F472B6` - Variante clara

---

## 🎭 Colores de Fondo

### Fondos Principales
- **Background Primary**: `#FFFFFF` - Fondo principal
- **Background Secondary**: `#F8F9FA` - Fondos alternativos
- **Background Tertiary**: `#E9ECEF` - Fondos de secciones
- **Background Dark**: `#343A40` - Fondos oscuros

### Fondos con Color
- **Background Red**: `#FFE5E5` - Fondos con tinte rojo
- **Background Orange**: `#FFF4ED` - Fondos con tinte naranja
- **Background Yellow**: `#FFF9E6` - Fondos con tinte amarillo
- **Background Green**: `#E8F5E9` - Fondos con tinte verde
- **Background Blue**: `#E0F7FA` - Fondos con tinte azul

---

## 💻 Uso en CSS

### Variables CSS (Recomendado)
```css
:root {
  /* Colores Primarios */
  --smart-primary: #F34949;
  --smart-primary-dark: #E63939;
  --smart-primary-darker: #C92A2A;
  --smart-primary-light: #FF6B6B;
  --smart-primary-lighter: #FF9999;
  --smart-primary-bg: #FFE5E5;
  
  /* Colores Secundarios */
  --smart-orange: #FF8C42;
  --smart-orange-dark: #E67E3A;
  --smart-yellow: #FFC107;
  --smart-yellow-dark: #FFB300;
  
  /* Colores de Estado */
  --smart-success: #28A745;
  --smart-success-dark: #218838;
  --smart-danger: #DC3545;
  --smart-danger-dark: #C82333;
  --smart-warning: #FFC107;
  --smart-warning-dark: #FFB300;
  --smart-info: #17A2B8;
  --smart-info-dark: #138496;
  
  /* Colores Neutros */
  --smart-gray-dark: #343A40;
  --smart-gray: #495057;
  --smart-gray-medium: #6C757D;
  --smart-gray-light: #ADB5BD;
  --smart-gray-lighter: #E9ECEF;
  --smart-gray-lightest: #F8F9FA;
  
  /* Colores de Acento */
  --smart-emerald: #10B981;
  --smart-sky-blue: #0EA5E9;
  --smart-purple: #8B5CF6;
  --smart-pink: #EC4899;
  
  /* Fondos */
  --smart-bg-primary: #FFFFFF;
  --smart-bg-secondary: #F8F9FA;
  --smart-bg-tertiary: #E9ECEF;
  --smart-bg-dark: #343A40;
}
```

### Ejemplos de Uso

```css
/* Botón Primario */
.btn-primary {
  background-color: var(--smart-primary);
  color: white;
  border-color: var(--smart-primary);
}

.btn-primary:hover {
  background-color: var(--smart-primary-dark);
  border-color: var(--smart-primary-dark);
}

/* Botón Secundario */
.btn-secondary {
  background-color: var(--smart-gray);
  color: white;
}

/* Botón de Éxito */
.btn-success {
  background-color: var(--smart-success);
  color: white;
}

/* Botón de Peligro */
.btn-danger {
  background-color: var(--smart-danger);
  color: white;
}

/* Fondo de Sección */
.section-bg {
  background-color: var(--smart-primary-bg);
}

/* Texto Principal */
.text-primary {
  color: var(--smart-primary);
}

/* Texto Secundario */
.text-secondary {
  color: var(--smart-gray);
}
```

---

## 📊 Tabla de Colores

| Color | Hex | RGB | Uso |
|-------|-----|-----|-----|
| Primary | `#F34949` | rgb(243, 73, 73) | Botones principales, navbar |
| Primary Dark | `#E63939` | rgb(230, 57, 57) | Hover, estados activos |
| Success | `#28A745` | rgb(40, 167, 69) | Operaciones exitosas |
| Danger | `#DC3545` | rgb(220, 53, 69) | Errores, eliminaciones |
| Warning | `#FFC107` | rgb(255, 193, 7) | Advertencias |
| Info | `#17A2B8` | rgb(23, 162, 184) | Información |
| Gray Dark | `#343A40` | rgb(52, 58, 64) | Textos principales |
| Gray | `#495057` | rgb(73, 80, 87) | Textos secundarios |

---

## 🎯 Recomendaciones de Uso

1. **Navbar y Headers**: Usar `--smart-primary` como color principal
2. **Botones Primarios**: `--smart-primary` con hover en `--smart-primary-dark`
3. **Botones Secundarios**: `--smart-gray` o `--smart-gray-medium`
4. **Mensajes de Éxito**: `--smart-success` con fondo `--smart-success-bg`
5. **Mensajes de Error**: `--smart-danger` con fondo `--smart-danger-bg`
6. **Fondos de Secciones**: `--smart-gray-lightest` o `--smart-primary-bg`
7. **Bordes**: `--smart-gray-light` o `--smart-gray-lighter`
8. **Textos**: `--smart-gray-dark` para principales, `--smart-gray` para secundarios

---

## 🔄 Paleta Alternativa (Opcional)

Si deseas cambiar el color principal, aquí tienes algunas opciones:

### Opción 1: Azul Profesional
- Primary: `#2563EB`
- Primary Dark: `#1D4ED8`
- Primary Light: `#3B82F6`

### Opción 2: Verde Natural
- Primary: `#10B981`
- Primary Dark: `#059669`
- Primary Light: `#34D399`

### Opción 3: Naranja Energético
- Primary: `#F97316`
- Primary Dark: `#EA580C`
- Primary Light: `#FB923C`

---

**Nota**: Esta paleta está diseñada para mantener consistencia visual y accesibilidad en toda la aplicación SmartLunch.

