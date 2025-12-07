# Documentación: Cómo se llama a la API del Backend

## 📋 Resumen

El proyecto React usa **Axios** para hacer llamadas HTTP al backend. La configuración de la URL base se carga desde `public/Views/config.json`.

## 🔧 Configuración

### 1. Archivo de Configuración

La URL base de la API se define en: `public/Views/config.json`

```json
{
  "API_BASE_URL": "http://localhost:8000",
  "URL_HOME": "http://localhost:4200",
  "BLOQUEO_USUARIOS": {
    "Admin": false,
    "Cocina": false,
    "Comensal": false,
    "Gerencia": false
  }
}
```

### 2. Servicio de Configuración

El archivo `src/services/configService.js` carga esta configuración:

```javascript
// Carga la configuración desde /Views/config.json
export const loadConfig = async () => {
  const response = await fetch('/Views/config.json');
  const raw = await response.json();
  
  config = {
    apiBaseUrl: raw.API_BASE_URL.replace(/\/+$/, ''), // Elimina barras finales
    urlHome: raw.URL_HOME.replace(/\/+$/, '') + '/',
    bloqueos: raw.BLOQUEO_USUARIOS || {},
  };
  
  return config;
};
```

## 🌐 Servicio de API

### Archivo: `src/services/apiService.js`

Este archivo contiene todas las funciones para llamar al backend:

```javascript
import axios from 'axios';
import { getConfig } from './configService';

// Instancia de Axios con timeout de 8 segundos
const api = axios.create({
  timeout: 8000,
});

// Función para obtener la URL base
export const getApiBaseUrl = () => {
  const config = getConfig();
  return config ? config.apiBaseUrl : 'http://localhost:8000';
};

// Servicios disponibles
export const apiService = {
  // Login
  login: async (user, pass) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/login/Authorize`, {
      params: { user, pass },
    });
    return response.data;
  },

  // Obtener turnos disponibles
  getTurnosDisponibles: async () => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/turno/GetTurnosDisponibles`);
    return response.data;
  },

  // Obtener menú por turno
  getMenuByTurno: async (planta, centro, jerarquia, proyecto, turno, fecha) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/menudd/filtrarPorTurno`, {
      params: { planta, centro, jerarquia, proyecto, turno, fecha },
    });
    return response.data;
  },

  // Obtener pedidos vigentes
  getPedidosVigentes: async (userId) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.get(`${baseUrl}/api/comanda/GetPedidosVigentes`, {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Crear pedido
  crearPedido: async (pedidoData) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/comanda/Create`, pedidoData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    return response.data;
  },

  // Actualizar pedido
  actualizarPedido: async (pedidoId, estado, calificacion, comentario) => {
    const baseUrl = getApiBaseUrl();
    const response = await api.post(`${baseUrl}/api/comanda/Update`, {
      id: pedidoId,
      estado: estado,
      calificacion: calificacion,
      comentario: comentario,
    });
    return response.data;
  },
};
```

## 📝 Ejemplos de Uso

### Ejemplo 1: Login

```javascript
import { apiService } from '../services/apiService';

// En un componente
const handleLogin = async () => {
  try {
    const response = await apiService.login(username, password);
    // response contiene los datos del usuario
    console.log(response);
  } catch (error) {
    console.error('Error en login:', error);
  }
};
```

**Llamada real que se hace:**
```
GET http://localhost:8000/api/login/Authorize?user=usuario&pass=contraseña
```

### Ejemplo 2: Obtener Turnos

```javascript
import { apiService } from '../services/apiService';

const cargarTurnos = async () => {
  try {
    const turnos = await apiService.getTurnosDisponibles();
    setTurnos(turnos);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Llamada real:**
```
GET http://localhost:8000/api/turno/GetTurnosDisponibles
```

### Ejemplo 3: Obtener Menú

```javascript
const cargarMenu = async () => {
  const hoy = new Date().toISOString().split('T')[0];
  
  const menu = await apiService.getMenuByTurno(
    user.planta,
    user.centrodecosto,
    user.jerarquia,
    user.proyecto,
    selectedTurno.descripcion,
    hoy
  );
  
  setMenuItems(menu);
};
```

**Llamada real:**
```
GET http://localhost:8000/api/menudd/filtrarPorTurno?planta=X&centro=Y&jerarquia=Z&proyecto=W&turno=Almuerzo&fecha=2024-01-15
```

### Ejemplo 4: Crear Pedido (POST)

```javascript
const crearPedido = async () => {
  const pedidoData = {
    cod_plato: '123',
    monto: 1500.00,
    estado: 'P',
    planta: user.planta,
    // ... más datos
  };

  try {
    const resultado = await apiService.crearPedido(pedidoData);
    console.log('Pedido creado:', resultado);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Llamada real:**
```
POST http://localhost:8000/api/comanda/Create
Content-Type: application/json; charset=utf-8

{
  "cod_plato": "123",
  "monto": 1500.00,
  "estado": "P",
  ...
}
```

## 🔍 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/login/Authorize` | Autenticación de usuario |
| GET | `/api/turno/GetTurnosDisponibles` | Obtener turnos disponibles |
| GET | `/api/menudd/filtrarPorTurno` | Obtener menú filtrado por turno |
| GET | `/api/comanda/GetPedidosVigentes` | Obtener pedidos vigentes del usuario |
| POST | `/api/comanda/Create` | Crear un nuevo pedido |
| POST | `/api/comanda/Update` | Actualizar estado de pedido |
| GET | `/api/config/get` | Obtener configuración del servidor |

## 🛠️ Manejo de Errores

El servicio tiene interceptores para manejar errores:

```javascript
// Interceptor de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Tiempo de espera agotado';
      } else {
        error.message = 'Error de conexión con el servidor';
      }
    }
    return Promise.reject(error);
  }
);
```

## 📍 Ubicación de Archivos

- **Configuración:** `public/Views/config.json`
- **Servicio de Config:** `src/services/configService.js`
- **Servicio de API:** `src/services/apiService.js`
- **Uso en componentes:** `src/pages/Index.js`, `src/contexts/AuthContext.js`

## 🔄 Flujo Completo

1. **Inicio de la app:**
   - Se carga `config.json` desde `/Views/config.json`
   - Se obtiene `API_BASE_URL` (ej: `http://localhost:8000`)

2. **Llamada a API:**
   - El componente importa `apiService`
   - Llama a la función correspondiente (ej: `apiService.login()`)
   - `apiService` construye la URL completa: `http://localhost:8000/api/login/Authorize`
   - Axios hace la petición HTTP
   - Se retorna la respuesta o se lanza un error

3. **Manejo de respuesta:**
   - El componente recibe los datos
   - Actualiza el estado de React
   - La UI se re-renderiza con los nuevos datos

## ⚙️ Cambiar la URL de la API

Para cambiar la URL del backend, edita `public/Views/config.json`:

```json
{
  "API_BASE_URL": "http://tu-servidor:8000",
  ...
}
```

No necesitas cambiar código, solo el archivo de configuración.

