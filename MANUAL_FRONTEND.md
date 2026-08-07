# Manual de Usuario - SmartLunch Frontend

**Versión:** 2.0
**Alcance:** Cómo usar la aplicación web de SmartLunch según el rol de cada usuario: Comensal, Cocina, Gerencia y Admin.

---

## 1. Introducción

SmartLunch es la aplicación donde los empleados piden su comida del día,
la cocina despacha los pedidos, y Gerencia/Admin configuran el sistema y
consultan reportes.

### 1.1 Roles de usuario

Lo que ve cada persona al entrar depende de su **rol**:

| Rol | Para qué es | Pantalla principal al entrar |
|---|---|---|
| **Comensal** | Empleado que pide su comida | Inicio (menú del día) |
| **Cocina** | Prepara y despacha los pedidos | Despacho de plato |
| **Gerencia** | Consulta reportes y configura catálogos | Inicio, con acceso a Reportes y Configuración |
| **Admin** | Igual que Gerencia + configuración avanzada del sistema | Inicio, con acceso completo |

El rol de cada usuario lo asigna Admin o Gerencia desde **Configuración >
Usuarios** (ver sección 6.1) y no se puede cambiar uno mismo.

---

## 2. Ingresar al sistema

### 2.1 Iniciar sesión

En la pantalla de **Login**:

1. **Usuario**: es el legajo (o el nombre de usuario que haya dado el
   Admin).
2. **Contraseña**: el ícono del ojo permite mostrarla u ocultarla mientras
   se escribe.
3. Tildar **"Recordarme"** guarda el usuario (no la contraseña) para no
   tener que volver a escribirlo la próxima vez, en ese mismo dispositivo.
4. Botón **Ingresar**.

En pantallas angostas (celular) el logo del círculo se achica solo para
no romper el diseño.

Si la sesión expiró (por inactividad o porque venció el token), la
aplicación redirige sola al Login con un aviso — solo hay que volver a
ingresar la contraseña.

### 2.2 Primer ingreso / cambio de contraseña obligatorio

Si es la primera vez que se entra (o el Admin reseteó la contraseña), el
sistema **obliga** a cambiar la contraseña antes de dejar usar cualquier
otra pantalla. Aparece un formulario pidiendo:

- Contraseña actual (la temporal que dieron de alta).
- Nueva contraseña (mínimo 8 caracteres; un indicador muestra qué tan
  fuerte es).
- Confirmar nueva contraseña.

No se puede cerrar ni navegar a otro lado hasta completarlo.

### 2.3 Cambiar la contraseña cuando se quiera

Desde el menú, opción **"Cambiar contraseña"** (ícono de llave),
disponible para cualquier rol en cualquier momento — mismo formulario
que el del primer ingreso, pero opcional.

### 2.4 Cerrar sesión

Opción **"Salir"** en el menú, siempre visible.

---

## 3. Navegación principal (Navbar)

La barra superior muestra el logo, la jerarquía del usuario y la
fecha/hora actual (en pantallas grandes), y el menú de navegación. En
celular el menú se despliega con el botón de hamburguesa (☰).

Qué opciones aparecen depende del rol — ver el detalle en cada sección
de este manual, y el resumen completo en la sección 7.

---

## 4. Rol Comensal — Pedir la comida

### 4.1 Pantalla de Inicio

Al entrar se ve:

- **Bienvenida** con el nombre, el Plan Nutricional asignado y, si
  corresponde, la cantidad de bonificaciones disponibles.
- **Selector de Turno** ("Ver opciones para turno: ..."): si hay más de
  un turno configurado (ej. Turno Mañana / Turno Tarde), se elige cuál
  ver.
- **Selector de Comedor**: si la empresa tiene más de un comedor y ese
  turno tiene menú cargado en varios, se puede elegir cuál mirar (por
  defecto se muestra el comedor habitual del usuario).
- **Menú del día**: las tarjetas de los platos disponibles para el
  turno/comedor elegidos, con foto, descripción, Plan Nutricional al que
  pertenece cada uno, y el precio.

### 4.2 Hacer un pedido

1. Elegir el turno y el comedor (si aplica).
2. En la tarjeta del plato deseado, click en **Pedir**.
3. Se puede dejar un comentario opcional (por ejemplo, una aclaración
   para cocina).
4. Confirmar. Aparece "¡Pedido Enviado!" y el pedido pasa a la sección
   **Pedido vigente**, en estado **Pendiente**.

Si el precio mostrado tiene un descuento aplicado (por ejemplo, por ser
el primer pedido del día, según las reglas de bonificación vigentes —
ver sección 6.8), la tarjeta y el pedido vigente muestran el porcentaje
exacto que se descontó y el importe final a pagar. Si ninguna regla
aplica a ese pedido puntual, se cobra el precio completo.

### 4.3 Seguir el pedido — "Pedido vigente"

Cada pedido activo se muestra con su número, un código QR (para mostrar
en el mostrador de cocina si hace falta) y un botón que cambia según el
estado:

| Estado del pedido | Qué se ve | Acción disponible |
|---|---|---|
| **Pendiente** | Cocina todavía no lo despachó | Botón **Cancelar pedido** |
| **En Aceptación** | Cocina ya lo despachó, está listo para retirar | Botón **Recibir pedido** (confirma que se retiró) |
| **Recibido** | Ya se retiró | Deja de aparecer en "Pedido vigente" |
| **Devuelto** / **Cancelado** | Cocina lo devolvió o se canceló | Deja de aparecer en "Pedido vigente" |

**Cancelar un pedido** solo es posible mientras está Pendiente (cocina
todavía no lo tocó). Una vez que cocina lo despacha, ya no se puede
cancelar desde acá — hay que hablarlo directamente con cocina.

---

## 5. Rol Cocina

### 5.1 Despacho de plato

Es la pantalla principal para Cocina (a donde entra directo al loguearse).
Muestra la lista de pedidos del día:

- **Buscador**: por nombre, apellido, legajo, plato, número de pedido o
  comentario.
- **Filtro por estado**: Todos los estados, Pendiente, Devuelto,
  Cancelado, Recibido, En Aceptación (por defecto muestra Pendiente).
- **Lector de código de barras/QR**: hay un campo oculto que capta la
  lectura de una pistola lectora apuntando al número de pedido, para
  despachar sin buscar manualmente.
- Por cada pedido, click para ver el **detalle** (plato, comensal, turno,
  comentario) con botones para:
  - **Despachar**: marca el pedido como listo para retirar (pasa a "En
    Aceptación").
  - **Devolver**: si por algún motivo el pedido no se puede entregar.
- **Imprimir**: exporta a PDF/Excel el listado visible, con las columnas
  que se elijan en el modal de impresión.

### 5.2 Cocina > Platos

ABM (alta, baja, modificación) de los platos que después se pueden
ofrecer en el menú del día: descripción, ingredientes, foto, costo
interno, costo de venta, Plan Nutricional al que pertenece. Se puede
exportar el listado a PDF y Excel.

### 5.3 Cocina > Menú del día

Armado del menú: para una fecha y turno determinados, qué platos van a
estar disponibles (y en qué comedor, si aplica). Es lo que después ven
los Comensales en la pantalla de Inicio.

1. **Nuevo** para crear; se puede elegir varios turnos, jerarquías,
   proyectos, centros de costo y comedores a la vez mediante modales
   (si hay una sola opción de algo, se muestra directamente un select).
2. Completar Plan Nutricional, Plato, Cantidad y Fecha (obligatorios).
3. **Guardar**. Si algunos ya existían (duplicados), el sistema avisa
   cuáles se crearon y cuáles no.
4. **Editar** un menú existente usa selects simples (una sola opción por
   campo). **Eliminar** da de baja el registro (confirmación previa).
5. Exportar a PDF/Excel eligiendo columnas y filtros en el modal
   correspondiente.

---

## 6. Rol Gerencia y Admin — Configuración

Gerencia y Admin comparten el menú **Configuración**, con los catálogos
del sistema. Cada uno se administra igual: una tabla con los registros
existentes, buscador, paginación, y un botón para dar de alta uno nuevo;
cada fila permite editar o dar de baja (los catálogos no se borran
físicamente, se desactivan).

### 6.1 Usuarios

Alta y edición de las personas que usan el sistema: datos personales,
legajo, rol (Comensal/Cocina/Gerencia/Admin) y datos de organización
(Comedor, Centro de Costo, Proyecto, Jerarquía, Plan Nutricional). Desde
acá también se resetea la contraseña de un usuario si la olvidó — el
sistema la marca para que tenga que cambiarla en el próximo ingreso (ver
sección 2.2).

### 6.2 Comedor

Los distintos comedores/sedes donde se retira la comida (por ejemplo, si
la empresa tiene más de una planta u oficina con su propio comedor). Uno
de ellos se marca como comedor por defecto.

### 6.3 Centro de Costo / 6.4 Proyecto

Catálogos organizacionales usados para clasificar a los usuarios y, por
lo tanto, los reportes de facturación.

### 6.5 Perfil Nutricional

Los distintos tipos de plan/dieta que puede tener un usuario o un plato
(por ejemplo, "Común", "Vegetariano", "Sin TACC"). Se usa tanto para
filtrar el menú que ve cada usuario como para las Reglas de Bonificación.

### 6.6 Jerarquía

Los niveles jerárquicos de los usuarios (por ejemplo, "Operario",
"Supervisor", "Gerente"). El campo de bonificación histórico de este
catálogo ya **no** determina el descuento de los pedidos — eso ahora lo
maneja el motor de Reglas de Bonificación (sección 6.8); la jerarquía
sigue usándose como condición de filtro dentro de esas reglas si hace
falta.

### 6.7 Turnos

Los turnos de comida disponibles (ej. Turno Mañana, Turno Tarde), usados
para armar el menú del día y para que el Comensal elija cuál ver.

### 6.8 Reglas de Bonificación

Acá se define **quién paga qué** por su comida. Cada regla tiene:

- **Condiciones** (todas opcionales — dejar en blanco significa "no
  filtra por esto"): Turno, Jerarquía, Comedor, Plan Nutricional,
  Posición del pedido en el día (Cualquiera / Primero / Segundo /
  Tercero en adelante), Invitado (sí/no/cualquiera), y un rango de
  fechas de vigencia.
- **Prioridad**: si un pedido matchea más de una regla, se aplica la de
  mayor prioridad.
- **Efecto**: Porcentaje de descuento, Monto fijo, o Costo cero (gratis).

Ejemplo típico: una regla "Primer pedido del día" con Posición =
Primero y Efecto = Porcentaje 66,67%, sin más condiciones, hace que el
primer pedido de cada usuario en el día salga con ese descuento sin
importar el comedor, y que el segundo pedido en adelante se cobre
completo.

**Importante:** si un pedido no matchea ninguna regla activa, se cobra
el **100%** — nunca queda gratis por descuido de no haber cargado una
regla. Por eso, si se va a activar por primera vez este sistema (o se
borran todas las reglas), hay que cargar al menos la regla principal
**antes** de que los empleados empiecen a pedir, para que no paguen de
más por error.

### 6.9 Reportes de Gestión (menú aparte, solo Gerencia/Admin)

- **Reporte por Comensal**: consumo por persona en un rango de fechas.
- **Reporte de Gestión**: números generales de pedidos (cantidad,
  estados, etc.) para seguimiento operativo.
- **Reporte de Facturación**: el detalle para facturar/conciliar —
  legajo, fecha, comedor, costo interno, costo de venta, pago del
  empleado, y los totales generales (costo de venta total, costo interno
  total, descuentos totales). Se puede exportar a PDF y a Excel.

---

## 7. Solo Admin

Además de todo lo de Gerencia, Admin tiene:

### 7.1 Habilitar SmartTime

Si la empresa usa el sistema de control horario SmartTime, desde acá se
configura el usuario/contraseña de esa integración (para que SmartLunch
pueda traer datos de legajo automáticamente). Si ya está configurado,
solo permite cambiar la contraseña.

### 7.2 Parámetros del Sistema

Pantalla de solo lectura con la configuración actual del servidor: URL
base de la API, ID del tótem, qué roles están bloqueados (si alguno se
desactivó temporalmente el acceso) y qué campos se muestran en el menú
del día (Comedor / Centro de Costo / Proyecto). Para modificar estos
valores hay que editar el archivo de configuración del lado del
servidor — la pestaña "Cómo Editar" de esa misma pantalla explica el
paso a paso. El botón **Recargar Configuración** hace que la aplicación
vuelva a leer esos valores sin tener que reiniciar nada.

### 7.3 Scripts pendientes

Panel técnico para aplicar cambios de base de datos (migraciones) que
todavía no se corrieron en el servidor. Es de uso avanzado — está
pensado para usarse junto con el equipo de desarrollo, no para el uso
diario del sistema.

---

## 8. Resumen de accesos por rol

| Pantalla | Comensal | Cocina | Gerencia | Admin |
|---|---|---|---|---|
| Inicio (pedir comida) | Sí | — | Sí | Sí |
| Despacho de plato | — | Sí | — | — |
| Cocina > Platos | — | Sí | — | — |
| Cocina > Menú del día | — | Sí | — | — |
| Reportes de Gestión | — | — | Sí | Sí |
| Usuarios / Comedor / Centro de Costo / Proyecto / Perfil Nutricional / Jerarquía / Turnos / Reglas de Bonificación | — | — | Sí | Sí |
| Habilitar SmartTime | — | — | — | Sí |
| Parámetros del Sistema | — | — | — | Sí |
| Scripts pendientes | — | — | — | Sí |
| Cambiar contraseña | Sí | Sí | Sí | Sí |

---

## 9. Mensajes y avisos

La aplicación utiliza ventanas emergentes para:
- **Éxito:** operaciones completadas correctamente.
- **Advertencia:** operaciones completadas con avisos (ej. menús
  duplicados no creados).
- **Error:** mensajes de error con una descripción de qué pasó.

---

## 10. Notas técnicas

- **Navegadores:** Chrome, Firefox, Edge (versiones recientes).
- **Responsive:** la interfaz se adapta a móvil, tablet y desktop.
- **Accesibilidad:** se utilizan etiquetas ARIA y roles para mejorar la
  accesibilidad.

---

*Fin del manual de usuario – SmartLunch Frontend.*
