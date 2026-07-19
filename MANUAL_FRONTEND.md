# Manual de Usuario - SmartLunch Frontend

**Versión:** 1.0  
**Fecha:** Febrero 2026

---

## 1. Introducción

SmartLunch es una aplicación web para la gestión de menús del día, comandas, despacho de platos y reportes en comedores industriales. Este manual describe el uso del frontend (interfaz de usuario) de la aplicación.

### 1.1 Roles de usuario

| Rol | Acceso |
|-----|--------|
| **Comensal** | Inicio (ver menú del día, seleccionar plato) |
| **Cocina** | Inicio, Despacho de plato, Plato, Menú del día |
| **Gerencia** | Inicio, Reportes, Catálogos, Configuración |
| **Admin** | Acceso completo a todos los módulos |

---

## 2. Acceso al sistema

### 2.1 Pantalla de login

Para acceder a SmartLunch, ingrese la URL de la aplicación en el navegador. Se mostrará la pantalla de inicio de sesión.

**[IMAGEN: Pantalla de login con campos Usuario y Contraseña]**

**Pasos:**
1. Ingrese su **usuario** (o correo electrónico, según configuración).
2. Ingrese su **contraseña**.
3. Haga clic en **Iniciar sesión**.

Si las credenciales son incorrectas, se mostrará un mensaje de error.

### 2.2 Cambio de contraseña obligatorio

Si el sistema requiere que cambie su contraseña al primer ingreso, será redirigido automáticamente a la pantalla de cambio de contraseña.

**[IMAGEN: Pantalla de cambio de contraseña obligatorio]**

Complete los campos y guarde. Una vez cambiada la contraseña, podrá acceder al resto de la aplicación.

---

## 3. Navegación principal

### 3.1 Barra superior (Navbar)

La barra superior muestra:
- **Logo** de SmartLunch (izquierda).
- **Jerarquía del usuario** y **fecha/hora actual** (centro, en pantallas grandes).
- **Menú de navegación** (derecha).

**[IMAGEN: Navbar completo en desktop]**

En dispositivos móviles, el menú se despliega mediante un botón de hamburguesa (☰).

**[IMAGEN: Navbar en móvil con menú colapsado]**

### 3.2 Menú según rol

- **Cocina:** Inicio, Despacho de plato, Plato, Menú del día, Reportes, Cambiar contraseña, Cerrar sesión.
- **Gerencia/Admin:** Inicio, Usuarios, Catálogos (Planta, Centro de costo, Proyecto, Plan nutricional, Jerarquía, Turno), Reportes, Configuración, Cambiar contraseña, Cerrar sesión.
- **Comensal:** Inicio, Cambiar contraseña, Cerrar sesión.

---

## 4. Inicio (Comensal / Cocina)

La pantalla de Inicio permite a los comensales ver el menú del día y seleccionar su plato según su turno, planta, centro de costo, proyecto y jerarquía.

**[IMAGEN: Pantalla de Inicio con menú del día visible]**

**Funcionalidad:**
- Selección automática de datos según el usuario logueado.
- Visualización de platos disponibles para el turno y fecha actual.
- Selección de plato y confirmación de la comanda.

---

## 5. Despacho de plato (Cocina)

Módulo para que Cocina registre el despacho/entrega de platos a los comensales.

**[IMAGEN: Pantalla de Despacho de plato]**

**Funcionalidad:**
- Listado de comandas pendientes de despacho.
- Marcar platos como despachados.
- Filtros por fecha, turno, planta, centro de costo, proyecto, jerarquía.

---

## 6. Menú del día (Cocina)

Módulo para crear y gestionar los menús del día.

**[IMAGEN: Pantalla de listado de Menú del día]**

### 6.1 Crear menú

1. Haga clic en **Nuevo**.

**[IMAGEN: Botón Nuevo en Menú del día]**

2. Complete el formulario:
   - **Plan nutricional** (obligatorio).
   - **Plato** (obligatorio).
   - **Cantidad** (obligatorio).
   - **Fecha** (obligatorio).
   - **Jerarquía** (uno o varios según modal).
   - **Turno** (uno o varios según modal).
   - **Proyecto** (uno o varios según modal).
   - **Centro de costo** (uno o varios según modal).
   - **Planta** (uno o varios según modal).

3. En modo **crear**, puede seleccionar varios turnos, jerarquías, proyectos, centros de costo y plantas mediante modales. Si hay una sola opción, se mostrará un select.

**[IMAGEN: Modal de selección de turnos]**

4. Haga clic en **Guardar**.

**Mensaje tras guardar:**
- Si todo se creó: *"X menús creados correctamente."*
- Si ninguno se creó (duplicados): *"Ningún menú se creó: los X ya existían (duplicados)."*
- Si algunos creados y otros no: *"✓ X creados. ✗ Y no creados (duplicados)."*

### 6.2 Editar menú

1. Haga clic en el botón **Editar** del menú deseado.
2. Modifique los campos necesarios (en editar se usan selects simples).
3. Haga clic en **Guardar**.

### 6.3 Eliminar / Dar de baja

1. Haga clic en **Eliminar** (o dar de baja) del menú.
2. Confirme la acción.

### 6.4 Reportes PDF y Excel

1. Haga clic en el botón de **PDF** o **Excel**.
2. En el modal, seleccione las columnas y filtros deseados.
3. La fecha se muestra arriba de la tabla. No se repite en las columnas.

**[IMAGEN: Modal de selección de columnas para reporte]**

---

## 7. Plato (Cocina)

Módulo para gestionar el catálogo de platos.

**[IMAGEN: Pantalla de listado de Platos]**

**Funcionalidad:**
- Crear, editar y dar de baja platos.
- Asociar platos a planes nutricionales.
- Exportar PDF y Excel.

---

## 8. Catálogos (Admin / Gerencia)

### 8.1 Usuarios

Gestión de usuarios del sistema.

**[IMAGEN: Pantalla de Usuarios]**

- Crear, editar y dar de baja usuarios.
- Asignar roles y permisos.
- Exportar reportes.

### 8.2 Planta

Catálogo de plantas.

**[IMAGEN: Pantalla de Planta]**

### 8.3 Centro de costo

Catálogo de centros de costo.

**[IMAGEN: Pantalla de Centro de costo]**

### 8.4 Proyecto

Catálogo de proyectos.

**[IMAGEN: Pantalla de Proyecto]**

### 8.5 Plan nutricional

Catálogo de planes nutricionales.

**[IMAGEN: Pantalla de Plan nutricional]**

### 8.6 Jerarquía

Catálogo de jerarquías (con porcentaje de bonificación en reportes).

**[IMAGEN: Pantalla de Jerarquía]**

### 8.7 Turno

Catálogo de turnos (Desayuno, Almuerzo, Media tarde, etc.).

**[IMAGEN: Pantalla de Turno]**

---

## 9. Reportes (Gerencia)

### 9.1 Reporte G Comensales

Reporte de comensales.

**[IMAGEN: Pantalla de Reporte G Comensales]**

### 9.2 Reporte G Gestión

Reporte de gestión.

**[IMAGEN: Pantalla de Reporte G Gestión]**

---

## 10. Configuración (Admin / Gerencia)

Pantalla de configuración del sistema (SmartTime, URL de API, etc.).

**[IMAGEN: Pantalla de Configuración]**

---

## 11. Cambiar contraseña

Desde el menú de usuario puede acceder a **Cambiar contraseña** para actualizar su contraseña de forma voluntaria.

**[IMAGEN: Pantalla de Cambiar contraseña]**

---

## 12. Cerrar sesión

Haga clic en **Cerrar sesión** en el menú de usuario para salir del sistema de forma segura.

---

## 13. Mensajes y avisos

La aplicación utiliza ventanas emergentes (Swal) para:
- **Éxito:** operaciones completadas correctamente.
- **Advertencia:** operaciones completadas con avisos (ej. menús duplicados no creados).
- **Error:** mensajes de error con descripción.

---

## 14. Notas técnicas

- **Navegadores:** Chrome, Firefox, Edge (versiones recientes).
- **Responsive:** la interfaz se adapta a móvil, tablet y desktop.
- **Accesibilidad:** se utilizan etiquetas ARIA y roles para mejorar la accesibilidad.

---

*Fin del manual. Para agregar imágenes, reemplace cada marcador **[IMAGEN: descripción]** por la imagen correspondiente.*
