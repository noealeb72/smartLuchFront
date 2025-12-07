# 📁 Estructura del Proyecto SmartLunch

## Organización Actual

El proyecto está organizado siguiendo las mejores prácticas de React, separando responsabilidades de manera similar a un backend.

---

## 📂 Estructura de Carpetas

```
src/
├── pages/              # "Controllers" de la UI (pantallas completas)
│   ├── Login.js
│   ├── Index.js
│   ├── Usuarios.js
│   ├── Platos.js
│   ├── Turnos.js
│   ├── Comandas/
│   └── ...
│
├── components/         # Componentes reutilizables
│   ├── Layout.js
│   ├── Navbar.js
│   ├── DataTable.js
│   ├── Buscador.js
│   ├── AgregarButton.js
│   └── ...
│
├── services/           # Llamadas a API / lógica de datos
│   ├── apiClient.js          # Cliente base de axios
│   ├── configService.js     # Configuración local
│   ├── authService.js        # Autenticación
│   ├── usuariosService.js    # CRUD usuarios
│   ├── platosService.js      # CRUD platos
│   ├── turnosService.js      # CRUD turnos
│   ├── comandasService.js    # CRUD comandas/pedidos
│   ├── plantasService.js     # CRUD plantas
│   ├── centrosDeCostoService.js
│   ├── proyectosService.js
│   ├── planesNutricionalesService.js
│   ├── jerarquiasService.js
│   ├── catalogosService.js   # Catálogos (listas simples)
│   ├── dashboardService.js   # Dashboard
│   ├── menuService.js        # Menú del día
│   ├── configApiService.js   # Config del servidor
│   ├── apiService.js         # Wrapper compatibilidad
│   └── index.js              # Exportación centralizada
│
├── contexts/           # Estado global
│   ├── AuthContext.js
│   ├── ConfigContext.js
│   └── DashboardContext.js
│
├── models/             # Interfaces / tipos (User, Plato, Turno...)
│   ├── Usuario.js
│   ├── Plato.js
│   ├── Turno.js
│   ├── Comanda.js
│   └── index.js
│
├── hooks/              # Custom hooks reutilizables
│   ├── useAuth.js
│   ├── useApi.js
│   ├── useDebounce.js
│   ├── useLocalStorage.js
│   └── useMemoizedCallback.js
│
├── utils/              # Helpers (formatDate, parseMoney, etc.)
│   └── performance.js
│
└── styles/             # Estilos CSS
    └── smartstyle.css
```

---

## 🎯 Separación por Responsabilidades

### Pages (Controllers de la UI)
**Ubicación:** `src/pages/`

**Responsabilidad:**
- Manejar la UI completa de una pantalla
- Orquestar llamadas a servicios
- Manejar estado local de la página

**Ejemplo:**
```javascript
// pages/Usuarios.js
import { usuariosService } from '../services/usuariosService';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  
  const cargarUsuarios = async () => {
    const data = await usuariosService.getUsuarios();
    setUsuarios(data);
  };
  
  return <div>...</div>;
};
```

---

### Components (Componentes Reutilizables)
**Ubicación:** `src/components/`

**Responsabilidad:**
- Componentes UI reutilizables
- No contienen lógica de negocio
- Reciben props y renderizan

**Ejemplo:**
```javascript
// components/DataTable.js
const DataTable = ({ data, columns, onEdit, onDelete }) => {
  return <table>...</table>;
};
```

---

### Services (Llamadas a API)
**Ubicación:** `src/services/`

**Estructura:**
- **`apiClient.js`**: Cliente base de axios (configuración, interceptores)
- **Servicios específicos**: Un archivo por módulo/dominio

**Responsabilidad:**
- Hacer llamadas HTTP al backend
- Agrupar por dominio (usuarios, platos, turnos, etc.)
- No manejan estado de React

**Ejemplo:**
```javascript
// services/usuariosService.js
import api from './apiClient';
import { getApiBaseUrl } from './configService';
import { clearApiCache } from './apiClient';

export const usuariosService = {
  getUsuarios: async (page, pageSize, searchTerm) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/usuario/lista`, {
      params: { page, pageSize, search: searchTerm }
    });
    return response.data;
  },
  
  crearUsuario: async (usuarioData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/usuario/Create`, usuarioData);
    clearApiCache();
    return response.data;
  }
};
```

**Servicios disponibles:**
- `authService.js` - Autenticación
- `usuariosService.js` - Usuarios
- `platosService.js` - Platos
- `turnosService.js` - Turnos
- `comandasService.js` - Comandas/Pedidos
- `plantasService.js` - Plantas
- `centrosDeCostoService.js` - Centros de Costo
- `proyectosService.js` - Proyectos
- `planesNutricionalesService.js` - Planes Nutricionales
- `jerarquiasService.js` - Jerarquías
- `catalogosService.js` - Catálogos (listas simples)
- `dashboardService.js` - Dashboard
- `menuService.js` - Menú del día
- `configApiService.js` - Configuración del servidor

---

### Contexts (Estado Global)
**Ubicación:** `src/contexts/`

**Responsabilidad:**
- Estado compartido entre componentes
- Proveer funciones y datos globales
- Manejar persistencia (localStorage)

**Ejemplo:**
```javascript
// contexts/AuthContext.js
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const login = async (username, password) => {
    const response = await authService.login(username, password);
    setUser(response.UsuarioDto);
  };
  
  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

### Models (Interfaces / Tipos)
**Ubicación:** `src/models/`

**Responsabilidad:**
- Definir estructura de datos
- Proporcionar valores por defecto
- Documentar qué datos se esperan

**Ejemplo:**
```javascript
// models/Usuario.js
export const UsuarioModel = {
  id: null,
  nombre: '',
  apellido: '',
  legajo: '',
  // ...
};

export const createUsuario = (data = {}) => {
  return { ...UsuarioModel, ...data };
};
```

**Modelos disponibles:**
- `Usuario.js` - Estructura de usuario
- `Plato.js` - Estructura de plato
- `Turno.js` - Estructura de turno
- `Comanda.js` - Estructura de comanda/pedido

---

### Hooks (Custom Hooks)
**Ubicación:** `src/hooks/`

**Responsabilidad:**
- Lógica reutilizable entre componentes
- Encapsular estado y efectos
- Facilitar reutilización

**Ejemplo:**
```javascript
// hooks/useAuth.js
export const useAuth = () => {
  const { user, login, logout } = useContext(AuthContext);
  return { user, login, logout };
};
```

**Hooks disponibles:**
- `useAuth.js` - Autenticación
- `useApi.js` - Llamadas API
- `useDebounce.js` - Debounce
- `useLocalStorage.js` - LocalStorage
- `useMemoizedCallback.js` - Callbacks memoizados

---

### Utils (Helpers)
**Ubicación:** `src/utils/`

**Responsabilidad:**
- Funciones auxiliares puras
- Formateo de datos
- Validaciones
- Utilidades generales

**Ejemplo:**
```javascript
// utils/formatters.js
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES');
};

export const parseMoney = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};
```

---

## 🔄 Flujo de Datos

```
Usuario interactúa con la UI
    ↓
pages/Componente.js (UI)
    ↓ llama a
contexts/Context.js (orquestación)
    ↓ llama a
services/Service.js (HTTP)
    ↓ hace petición a
Backend API
    ↓ devuelve datos
services/Service.js (transforma si es necesario)
    ↓ retorna
contexts/Context.js (guarda en estado)
    ↓ actualiza
pages/Componente.js (re-renderiza UI)
```

---

## 📝 Convenciones de Nombres

### Servicios
- **Formato:** `[dominio]Service.js` (camelCase)
- **Ejemplos:** `usuariosService.js`, `platosService.js`, `turnosService.js`
- **Export:** `export const usuariosService = { ... }`

### Modelos
- **Formato:** `[Entidad].js` (PascalCase)
- **Ejemplos:** `Usuario.js`, `Plato.js`, `Turno.js`
- **Export:** `export const UsuarioModel = { ... }`

### Pages
- **Formato:** `[Nombre].js` (PascalCase)
- **Ejemplos:** `Usuarios.js`, `Login.js`, `Index.js`

### Components
- **Formato:** `[Nombre].js` (PascalCase)
- **Ejemplos:** `DataTable.js`, `Navbar.js`, `Layout.js`

---

## 🚀 Cómo Usar los Servicios

### Opción 1: Importar servicio específico (Recomendado)
```javascript
import { usuariosService } from '../services/usuariosService';

const Usuarios = () => {
  const cargarUsuarios = async () => {
    const data = await usuariosService.getUsuarios(1, 10, '');
  };
};
```

### Opción 2: Importar desde index (Centralizado)
```javascript
import { usuariosService, platosService } from '../services';

const Componente = () => {
  // Usar servicios
};
```

### Opción 3: Usar wrapper de compatibilidad (Deprecated)
```javascript
import { apiService } from '../services/apiService';

// Funciona pero se recomienda migrar a servicios específicos
const data = await apiService.getUsuarios();
```

---

## 📚 Estructura Futura (Feature-based)

Cuando el proyecto crezca mucho, se puede organizar por feature:

```
src/
├── features/
│   ├── menuDia/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── models/
│   ├── usuarios/
│   └── pedidos/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
│
└── ...
```

---

## ✅ Ventajas de esta Estructura

1. **Separación clara** de responsabilidades
2. **Fácil de encontrar** código relacionado
3. **Escalable** - fácil agregar nuevos módulos
4. **Mantenible** - cambios aislados por módulo
5. **Testeable** - servicios independientes
6. **Similar al backend** - fácil de entender para desarrolladores backend

---

**Última actualización:** Diciembre 2025

