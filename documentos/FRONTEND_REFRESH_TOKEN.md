# Guía: Refresh Token en el Frontend SmartLunch

Esta guía describe cómo el frontend usa el refresh token para renovar el JWT automáticamente ante un 401, evitando desloguear al usuario mientras el refresh token sea válido.

---

## Flujo general

1. **Login** → El backend devuelve `token` (JWT) y `refreshToken`. El frontend guarda ambos.
2. **Petición API** → Se envía el JWT en el header `Authorization: Bearer <token>`.
3. **401 Unauthorized** → El interceptor de `apiClient` intenta renovar el token con `POST /api/login/Refresh`.
4. **Refresh exitoso** → Se guarda el nuevo JWT y refresh token, se reintenta la petición original.
5. **Refresh fallido** → Se limpia la sesión y se redirige a `/login?session=expired`.

---

## Endpoints del backend

### Login (POST /api/login/Autentificar)

**Request:**
```json
{
  "username": "usuario",
  "password": "clave"
}
```

**Response (200):**
```json
{
  "ok": true,
  "token": "eyJhbGc...",
  "refreshToken": "a1b2c3d4e5f6...",
  "usuarioId": 1,
  "username": "...",
  ...
}
```

El frontend guarda:
- `token` → `localStorage.token`
- `refreshToken` → `sessionStorage.refreshToken`

### Refresh (POST /api/login/Refresh)

**Request:**
```json
{
  "refreshToken": "<valor recibido en el login>"
}
```

**Response (200):**
```json
{
  "token": "<nuevo JWT>",
  "refreshToken": "<nuevo refresh token>"
}
```

**Response (401):** Refresh token inválido o expirado → el frontend desloguea y redirige a login.

---

## Archivos del frontend

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/contexts/AuthContext.js` | Guarda `refreshToken` en sessionStorage tras el login |
| `src/services/apiClient.js` | Interceptor: ante 401 llama a tryRefreshToken, reintenta o redirige |
| `src/services/authService.js` | Función `refreshToken()` (usada por apiClient) |

---

## Validación

1. **¿Se guarda el refresh token?**  
   Tras login → F12 → Application → Session Storage → clave `refreshToken`.

2. **¿Funciona el refresh?**  
   Usar `?tokenDebug=1` en la URL y esperar a que expire el JWT. Si no redirige a login, el refresh está funcionando.

3. **¿Redirección correcta?**  
   Si el refresh falla → `/login?session=expired` con mensaje "Tu sesión ha expirado. Por favor, ingresa de nuevo."
