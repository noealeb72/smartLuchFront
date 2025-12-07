# 📐 Arquitectura del Proyecto React - SmartLunch

## 🎯 Introducción

Este documento explica cómo está organizada la arquitectura del proyecto React, comparándola con la estructura típica de un backend (C#/.NET) para facilitar la comprensión.

---

## 📊 Comparación: Backend vs Frontend

### Backend (C#/.NET)
```
Controllers/     → Endpoints HTTP (rutas)
Services/        → Lógica de negocio
Models/          → Entidades/DTOs
Repositories/    → Acceso a datos
```

### React (Frontend)
```
pages/           → Componentes de página (similar a Controllers)
components/      → Componentes reutilizables (UI)
services/        → Llamadas a API (similar a Services)
contexts/        → Estado global (similar a servicios singleton)
models/ o types/ → Interfaces/Tipos (similar a DTOs)
utils/           → Funciones auxiliares
hooks/           → Lógica reutilizable (custom hooks)
```

---

## 📁 Estructura del Proyecto SmartLunch

```
src/
├── pages/              # Páginas (rutas principales) - "Controllers" de la UI
│   ├── Login.js
│   ├── Index.js
│   ├── Usuarios.js
│   ├── Platos.js
│   ├── Turnos.js
│   └── ...
│
├── components/         # Componentes reutilizables
│   ├── Layout.js
│   ├── Navbar.js
│   ├── DataTable.js
│   ├── Buscador.js
│   └── ...
│
├── services/           # Servicios de API (llamadas HTTP)
│   ├── apiClient.js          # Cliente base de axios (configuración)
│   ├── configService.js      # Configuración local (config.json)
│   ├── authService.js        # Autenticación
│   ├── usuariosService.js    # CRUD de usuarios
│   ├── platosService.js      # CRUD de platos
│   ├── turnosService.js      # CRUD de turnos
│   ├── comandasService.js    # CRUD de comandas/pedidos
│   ├── plantasService.js     # CRUD de plantas
│   ├── centrosDeCostoService.js
│   ├── proyectosService.js
│   ├── planesNutricionalesService.js
│   ├── jerarquiasService.js
│   ├── catalogosService.js   # Catálogos (listas simples)
│   ├── dashboardService.js   # Dashboard
│   ├── menuService.js        # Menú del día
│   ├── configApiService.js   # Configuración del servidor
│   ├── apiService.js         # Wrapper de compatibilidad (deprecated)
│   └── index.js              # Exportación centralizada
│
├── contexts/           # Estado global (React Context)
│   ├── AuthContext.js  # Autenticación
│   ├── ConfigContext.js
│   └── DashboardContext.js
│
├── models/             # Modelos/Interfaces (estructura de datos)
│   ├── Usuario.js
│   ├── Plato.js
│   ├── Turno.js
│   ├── Comanda.js
│   └── index.js
│
├── hooks/              # Custom hooks (lógica reutilizable)
│   ├── useAuth.js
│   ├── useApi.js
│   ├── useDebounce.js
│   └── ...
│
├── utils/              # Utilidades/helpers
│   ├── validators.js
│   ├── formatters.js
│   └── performance.js
│
└── styles/             # Estilos CSS
    └── ...
```

---

## 🔄 Comparación Detallada con Backend

### 1. Controllers → Pages/Components

**Backend:**
```csharp
[Route("api/login")]
public class LoginController {
    [HttpPost("Autentificar")]
    public HttpResponseMessage Authenticate(...)
}
```

**React:**
```javascript
// pages/Login.js - Maneja la UI y llama al servicio
const Login = () => {
  const { login } = useAuth();
  // UI del formulario
}
```

**Responsabilidad:**
- Manejar la UI (interfaz de usuario)
- Orquestar llamadas a servicios
- Manejar estado local de la página

---

### 2. Services → Services

**Backend:**
```csharp
public class AuthService {
    public LoginResult Login(string username, string password) {
        // Lógica de autenticación
    }
}
```

**React (Estructura actual):**
```javascript
// services/authService.js - Servicio específico de autenticación
export const authService = {
  login: async (user, pass) => {
    const response = await api.post('/api/login/Autentificar', {
      Username: user,
      Password: pass
    });
    return response.data;
  }
}

// services/usuariosService.js - Servicio específico de usuarios
export const usuariosService = {
  getUsuarios: async (page, pageSize, searchTerm) => { ... },
  crearUsuario: async (usuarioData) => { ... },
  // ...
}
```

**Responsabilidad:**
- Hacer llamadas HTTP al backend
- Un servicio por módulo/dominio
- Transformar datos si es necesario
- Manejar errores de red

**Estructura de servicios:**
- `apiClient.js` - Cliente base de axios (configuración, interceptores)
- `authService.js` - Autenticación
- `usuariosService.js` - Usuarios
- `platosService.js` - Platos
- `turnosService.js` - Turnos
- `comandasService.js` - Comandas/Pedidos
- Y así por cada módulo...

---

### 3. Models/DTOs → Models/Types

**Backend:**
```csharp
public class UsuarioDto {
    public int Id { get; set; }
    public string Nombre { get; set; }
    // ...
}
```

**React (JavaScript):**
```javascript
// models/Usuario.js
export const UsuarioModel = {
  id: null,
  nombre: '',
  apellido: '',
  legajo: '',
  // ...
}

// Función helper para crear usuarios
export const createUsuario = (data = {}) => {
  return { ...UsuarioModel, ...data };
};
```

**React (TypeScript):**
```typescript
// types/Usuario.ts
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  legajo: string;
}
```

**Responsabilidad:**
- Definir la estructura de datos
- Validar tipos (en TypeScript)
- Documentar qué datos se esperan
- Proporcionar valores por defecto

---

### 4. Repositories → Services (API calls)

**Backend:**
```csharp
public class UsuarioRepository {
    public Usuario GetById(int id) {
        // Acceso a BD
    }
}
```

**React:**
```javascript
// services/apiClient.js - Cliente base
const api = axios.create({
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});
// Interceptores para token, errores, caché, etc.

// services/usuariosService.js - Servicio específico
export const usuariosService = {
  getUsuarioById: async (id) => {
    const response = await api.get(`/api/usuario/${id}`);
    return response.data;
  }
}
```

**Responsabilidad:**
- `apiClient.js`: Abstraer las llamadas HTTP, centralizar configuración de Axios, manejar interceptores
- Servicios específicos: Agrupar llamadas por dominio/módulo

---

## 🎯 Separación de Responsabilidades

### Pages (Controllers)
- ✅ **Responsabilidad:** UI y orquestación
- ❌ **NO debe:** Hacer llamadas HTTP directas, contener lógica de negocio compleja
- ✅ **Debe:** Usar servicios, usar hooks, manejar estado local de UI

### Services (API)
- ✅ **Responsabilidad:** Comunicación con el backend
- ❌ **NO debe:** Manejar estado de React, renderizar UI
- ✅ **Debe:** Hacer llamadas HTTP, transformar datos, manejar errores de red

### Contexts (Estado global)
- ✅ **Responsabilidad:** Estado compartido entre componentes
- ❌ **NO debe:** Hacer llamadas HTTP directamente (usa servicios)
- ✅ **Debe:** Proveer estado, proveer funciones, manejar persistencia

### Models/Types
- ✅ **Responsabilidad:** Definir estructuras de datos
- ❌ **NO debe:** Contener lógica
- ✅ **Debe:** Definir interfaces, validar estructura

---

## 🔄 Ejemplo de Flujo Completo

```
Usuario hace clic en "Login"
    ↓
pages/Login.js (UI)
    ↓ llama a
contexts/AuthContext.js (orquestación)
    ↓ llama a
services/apiService.js (HTTP)
    ↓ hace POST a
Backend API
    ↓ devuelve
UsuarioDto + Token
    ↓ se guarda en
contexts/AuthContext (estado)
    ↓ se usa en
pages/Login.js (redirige)
```

### Código del Flujo:

**1. pages/Login.js (UI)**
```javascript
const Login = () => {
  const { login } = useAuth(); // Usa el contexto
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password); // Llama al contexto
    } catch (error) {
      // Maneja error
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

**2. contexts/AuthContext.js (Orquestación)**
```javascript
const login = async (username, password) => {
  const response = await apiService.login(username, password); // Llama al servicio
  localStorage.setItem('token', response.token);
  setUser(response.UsuarioDto);
};
```

**3. services/apiService.js (HTTP)**
```javascript
export const apiService = {
  login: async (user, pass) => {
    const response = await api.post('/api/login/Autentificar', {
      Username: user,
      Password: pass
    });
    return response.data;
  }
};
```

---

## ✅ Buenas Prácticas

### 1. Separación Clara
- **Pages:** Solo UI
- **Services:** Solo HTTP
- **Contexts:** Solo estado
- **Models:** Solo datos

### 2. Reutilización
- **Componentes reutilizables** en `components/`
- **Lógica reutilizable** en `hooks/`
- **Utilidades** en `utils/`

### 3. Mantenibilidad
- **Un servicio por dominio** (ej: `usuariosService.js`, `comandasService.js`)
- **Un contexto por dominio** (ej: `AuthContext`, `DashboardContext`)
- **Modelos claros** con nombres de dominio (Usuario, Plato, Turno, Comanda)
- **Separación clara** entre cliente base (`apiClient.js`) y servicios específicos

---

## 🏗️ Estructura Avanzada (Opcional)

Para proyectos más grandes, puedes organizar por **funcionalidad** (Feature-based):

```
src/
├── features/           # Por funcionalidad
│   ├── auth/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   ├── usuarios/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── pedidos/
│       ├── components/
│       ├── services/
│       ├── hooks/
│       └── types/
│
├── shared/             # Código compartido
│   ├── components/
│   ├── hooks/
│   └── utils/
│
└── ...
```

**Ventajas:**
- Todo relacionado con una funcionalidad está junto
- Más fácil de encontrar código relacionado
- Mejor para equipos grandes

**Desventajas:**
- Puede haber duplicación
- Más complejo para proyectos pequeños

---

## 📝 Resumen

| Backend | Frontend React | Propósito |
|---------|----------------|-----------|
| Controllers | Pages | Manejar rutas/UI |
| Services | Services | Lógica de negocio / HTTP |
| Models/DTOs | Models/Types | Estructura de datos |
| Repositories | Services (API) | Acceso a datos / HTTP |
| - | Contexts | Estado global |
| - | Hooks | Lógica reutilizable |
| - | Utils | Funciones auxiliares |

---

## 🎓 Conceptos Clave

### Contexts (React Context)
- Similar a servicios singleton en backend
- Provee estado y funciones a toda la app
- Se usa con `useContext()` o hooks personalizados

### Hooks
- Funciones que empiezan con `use`
- Permiten reutilizar lógica entre componentes
- Ejemplos: `useState`, `useEffect`, `useAuth` (custom)

### Services
- Funciones puras que hacen llamadas HTTP
- No tienen estado de React
- Retornan promesas con los datos

---

## 📚 Recursos Adicionales

- [React Context API](https://react.dev/reference/react/useContext)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React Folder Structure](https://reactjs.org/docs/faq-structure.html)

---

**Última actualización:** Diciembre 2025

