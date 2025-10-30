# Sistema de Bonificaciones - SmartLunch

## 🎯 **Descripción General**

Sistema implementado para aplicar bonificaciones automáticas basadas en la tabla `sl_jerarquia`, donde cada perfil tiene un porcentaje de descuento configurable. El sistema permite **un solo plato bonificado por día** por usuario.

## 📊 **Tabla de Configuración: `sl_jerarquia`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único de la jerarquía |
| `nombre` | VARCHAR | Nombre del perfil (Admin, Cocina, Comensal, Gerencia) |
| `descripcion` | VARCHAR | Descripción del perfil |
| `bonificacion` | INT | Porcentaje de bonificación (0-100) |
| `createdate` | DATETIME | Fecha de creación |
| `createuser` | VARCHAR | Usuario que creó el registro |
| `updatedate` | DATETIME | Fecha de última actualización |
| `updateuser` | VARCHAR | Usuario que actualizó el registro |
| `deletemark` | INT | Marca de eliminación (0=activo, 1=eliminado) |

## 🔧 **Configuración Actual**

Según la tabla mostrada:
- **Comensal**: 60% de descuento
- **Admin**: 0% de descuento  
- **Cocina**: 0% de descuento
- **Gerencia**: 0% de descuento

## 🚀 **Funcionamiento**

### 1. **Inicialización**
- Al cargar la página, se consulta la tabla `sl_jerarquia`
- Se obtiene el porcentaje de bonificación del perfil del usuario
- Se verifica si ya se usó la bonificación hoy

### 2. **Selección de Plato**
- Al hacer clic en "Ordenar", se aplica automáticamente la bonificación si:
  - El perfil tiene bonificación > 0%
  - No se ha usado la bonificación hoy
- Se muestra un checkbox para confirmar/cancelar la bonificación

### 3. **Modal de Confirmación**
- Muestra el precio original tachado
- Muestra el precio con descuento en verde
- Indica el monto del descuento
- Permite activar/desactivar la bonificación

### 4. **Guardado en `sl_comanda`**
Se guardan los siguientes campos adicionales:
- `precio_original`: Precio sin descuento
- `bonificado`: Monto del descuento aplicado
- `porcentaje_bonificacion`: Porcentaje usado
- `aplicar_bonificacion`: Boolean si se aplicó o no

## 📁 **Archivos Modificados**

### 1. **`Views/js/bonificaciones-service.js`** (NUEVO)
- Servicio para consultar bonificaciones desde `sl_jerarquia`
- Verificar si ya se usó la bonificación hoy
- Calcular precios con descuento

### 2. **`Views/js/Index.js`**
- Variables para manejar bonificaciones
- Función `inicializarBonificaciones()`
- Función `verificarBonificacionHoy()`
- Función `calcularPrecioConBonificacion()`
- Función `aplicarBonificacion()`
- Modificación de `hacerPedido()` para aplicar bonificación automática
- Modificación del `jsonForm` para incluir campos de bonificación

### 3. **`Views/index.html`**
- Checkbox para activar/desactivar bonificación
- Mensajes informativos según el estado
- Visualización del precio con descuento
- Inclusión del script de bonificaciones

## 🔄 **Flujo de Datos**

```
1. Usuario hace login → Se obtiene perfil del localStorage
2. Cargar página → BonificacionesService.obtenerBonificacion(perfil)
3. Consultar sl_jerarquia → Obtener porcentaje de bonificación
4. Verificar sl_comanda → ¿Ya se usó bonificación hoy?
5. Usuario selecciona plato → Aplicar bonificación automáticamente
6. Mostrar modal → Checkbox para confirmar/cancelar
7. Confirmar pedido → Guardar en sl_comanda con campos de bonificación
```

## 🎨 **Interfaz de Usuario**

### **Checkbox de Bonificación**
```html
☑️ Aplicar 60% de descuento (-$12.00)
```

### **Precio en Modal**
```html
Importe: ~~$20.00~~ $8.00 (-$12.00)
```

### **Mensajes Informativos**
- ✅ "Aplicar X% de descuento"
- ℹ️ "Ya utilizaste tu bonificación del día"
- ⚠️ "Tu perfil no tiene bonificación disponible"

## 🛠️ **Configuración del Backend**

### **Endpoint Requerido: `api/jerarquia/GetName`**
```json
GET /api/jerarquia/GetName?name=Comensal
Response: {
  "id": 3,
  "nombre": "Comensal",
  "descripcion": "asdf",
  "bonificacion": 60,
  "createdate": "2025-10-28 10:08:16.223",
  "createuser": "admin",
  "updatedate": "2025-10-29 09:52:01.857",
  "updateuser": "admin",
  "deletemark": 0
}
```

### **Endpoint Requerido: `api/comanda/getPedido/{dni}`**
```json
GET /api/comanda/getPedido/12345678
Response: [
  {
    "id": 1,
    "cod_plato": "PLATO001",
    "monto": 8.00,
    "bonificado": 12.00,
    "fecha_hora": "2025-01-15T12:00:00Z",
    "estado": "P"
  }
]
```

### **Endpoint Requerido: `api/comanda/Create`**
```json
POST /api/comanda/Create
Body: {
  "cod_plato": "PLATO001",
  "monto": 8.00,
  "precio_original": 20.00,
  "bonificado": 12.00,
  "porcentaje_bonificacion": 60,
  "aplicar_bonificacion": true,
  "estado": "P",
  "user_id": "12345678",
  "fecha_hora": "2025-01-15T12:00:00Z"
}
```

## ✅ **Validaciones Implementadas**

1. **Un plato por día**: Verifica en `sl_comanda` si ya hay un pedido con campo `bonificado > 0` hoy
2. **Perfil válido**: Solo aplica bonificación si el perfil tiene porcentaje > 0
3. **Precios correctos**: Calcula automáticamente descuento y precio final
4. **Estado persistente**: Recuerda si ya se usó la bonificación en la sesión
5. **"Te quedan platos bonificados"**: Siempre muestra 1 (si tiene bonificación) o 0 (si ya la usó o no tiene)

## 🧪 **Testing**

### **Casos de Prueba**
1. **Usuario Comensal** (60% descuento):
   - Primer plato del día → Debe aplicar 60% automáticamente
   - Segundo plato del día → No debe aplicar descuento
   
2. **Usuario Admin** (0% descuento):
   - Cualquier plato → No debe mostrar opción de bonificación
   
3. **Usuario sin perfil**:
   - Cualquier plato → No debe aplicar bonificación

### **Verificación en Base de Datos**
```sql
-- Verificar bonificaciones por día
SELECT user_id, DATE(fecha_hora) as fecha, COUNT(*) as platos_bonificados
FROM sl_comanda 
WHERE bonificado > 0 
  AND DATE(fecha_hora) = CURDATE()
GROUP BY user_id, DATE(fecha_hora);

-- Verificar configuración de jerarquías
SELECT nombre, bonificacion 
FROM sl_jerarquia 
WHERE deletemark = 0;
```

## 🚀 **Estado del Sistema**

- ✅ **Servicio de bonificaciones** implementado
- ✅ **Lógica de cálculo** implementada  
- ✅ **Interfaz de usuario** implementada
- ✅ **Validación de un plato por día** implementada
- ✅ **Guardado en sl_comanda** implementado
- ⏳ **Testing** pendiente
- ⏳ **Configuración de backend** pendiente

**El sistema está listo para funcionar una vez que el backend implemente los endpoints requeridos.**
