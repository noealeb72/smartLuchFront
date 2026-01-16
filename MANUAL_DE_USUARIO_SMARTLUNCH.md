# 📘 Manual de Usuario - SmartLunch
## Sistema de Gestión de Comedores

**Versión:** 1.0.0  
**Fecha:** 2025  
**Autor:** Equipo de Desarrollo SmartLunch

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Roles y Permisos](#roles-y-permisos)
4. [Módulos del Sistema](#módulos-del-sistema)
5. [Guía de Uso por Módulo](#guía-de-uso-por-módulo)
6. [Funcionalidades Especiales](#funcionalidades-especiales)
7. [Solución de Problemas](#solución-de-problemas)
8. [Glosario](#glosario)

---

## 1. Introducción

### 1.1 ¿Qué es SmartLunch?

SmartLunch es un sistema integral de gestión de comedores diseñado para facilitar la administración de pedidos, menús, usuarios y reportes en entornos corporativos. El sistema permite gestionar de manera eficiente el servicio de alimentación de los empleados, desde la creación de pedidos hasta la generación de reportes gerenciales.

### 1.2 Características Principales

- ✅ **Gestión de Usuarios**: Administración completa de comensales, cocineros y personal administrativo
- ✅ **Gestión de Menús**: Creación y administración de platos y menús del día
- ✅ **Sistema de Pedidos**: Realización, seguimiento y gestión de pedidos de comida
- ✅ **Despacho**: Módulo especializado para el personal de cocina
- ✅ **Reportes Gerenciales**: Generación de reportes detallados por comensal y gestión general
- ✅ **Calificaciones**: Sistema de evaluación de platos y servicio
- ✅ **Progressive Web App (PWA)**: Instalable en dispositivos móviles y tablets

### 1.3 Requisitos del Sistema

- **Navegador Web**: Chrome, Firefox, Edge o Safari (versiones recientes)
- **Conexión a Internet**: Requerida para el funcionamiento normal
- **Resolución Mínima**: 320px (compatible con dispositivos móviles)
- **JavaScript**: Debe estar habilitado

---

## 2. Acceso al Sistema

### 2.1 Pantalla de Login

Para acceder al sistema, debe ingresar a la URL de SmartLunch. Se mostrará la pantalla de inicio de sesión con los siguientes campos:

- **Nombre de usuario**: Ingrese su nombre de usuario asignado
- **Contraseña**: Ingrese su contraseña
- **Recordar sesión**: Opción para mantener la sesión activa

### 2.2 Inicio de Sesión

1. Ingrese su nombre de usuario en el campo correspondiente
2. Ingrese su contraseña (puede usar el botón del ojo para mostrar/ocultar la contraseña)
3. Opcionalmente, marque "Recordar sesión" si desea mantener la sesión activa
4. Haga clic en el botón **"Ingresar"**

**Nota**: Si hay un error de conexión con el servidor, se mostrará un mensaje en rojo debajo de "Ingresa tus credenciales para continuar" sin abrir ningún popup.

### 2.3 Recuperación de Contraseña

Si olvidó su contraseña, contacte al administrador del sistema para su restablecimiento.

---

## 3. Roles y Permisos

El sistema SmartLunch cuenta con cuatro roles principales, cada uno con permisos específicos:

### 3.1 Comensal

**Acceso**: Todos los usuarios autenticados

**Permisos**:
- Ver menú del día
- Realizar pedidos
- Ver pedidos vigentes
- Cancelar pedidos propios
- Recibir pedidos
- Calificar platos
- Ver datos personales
- Ver historial de calificaciones

**Módulos Accesibles**:
- Inicio (Dashboard)
- Datos Personales
- Calificación

### 3.2 Cocina

**Acceso**: Personal de cocina

**Permisos**:
- Ver todos los pedidos
- Marcar pedidos como despachados
- Gestionar platos
- Gestionar menú del día
- Imprimir listas de pedidos

**Módulos Accesibles**:
- Inicio
- Despacho
- Plato
- Menú del Día
- Datos Personales
- Calificación

### 3.3 Gerencia

**Acceso**: Personal gerencial y administrativo

**Permisos**:
- Ver reportes por comensal
- Ver reportes de gestión general
- Exportar reportes a PDF y Excel
- Filtrar reportes por múltiples criterios
- Ver estadísticas y resúmenes

**Módulos Accesibles**:
- Inicio
- Reporte por Comensal
- Reporte de Gestión
- Datos Personales
- Calificación

### 3.4 Admin

**Acceso**: Administradores del sistema

**Permisos**:
- Todas las funcionalidades de Gerencia
- Gestión completa de usuarios
- Gestión de catálogos (Plantas, Centros de Costo, Proyectos, Planes Nutricionales, Jerarquías, Turnos)
- Configuración del sistema

**Módulos Accesibles**:
- Todos los módulos del sistema
- Usuarios
- Planta
- Centro de Costo
- Proyecto
- Plan Nutricional
- Jerarquía
- Turno
- Configuración

---

## 4. Módulos del Sistema

### 4.1 Módulo de Inicio (Dashboard)

**Ruta**: `/`  
**Acceso**: Todos los usuarios autenticados

El módulo de Inicio es el dashboard principal donde los usuarios pueden:

- Ver información personal y plan nutricional
- Ver turnos disponibles
- Ver el menú del día
- Ver pedidos vigentes
- Realizar nuevos pedidos
- Cancelar pedidos
- Recibir pedidos con calificación

### 4.2 Módulo de Despacho

**Ruta**: `/despacho`  
**Acceso**: Rol Cocina

Módulo especializado para el personal de cocina que permite:

- Ver todos los pedidos del día
- Filtrar pedidos por estado (Pendiente, Recibido, Devuelto, Cancelado)
- Marcar pedidos como despachados
- Imprimir listas de pedidos
- Exportar listas a PDF y Excel

### 4.3 Módulo de Usuarios

**Ruta**: `/usuarios`  
**Acceso**: Admin, Gerencia

Permite la gestión completa de usuarios del sistema:

- Crear nuevos usuarios
- Editar usuarios existentes
- Eliminar usuarios
- Buscar usuarios
- Ver información detallada de usuarios
- Asignar roles y permisos

### 4.4 Módulos de Catálogos

**Rutas**: 
- `/planta` - Gestión de Plantas
- `/centrodecosto` - Gestión de Centros de Costo
- `/proyecto` - Gestión de Proyectos
- `/plannutricional` - Gestión de Planes Nutricionales
- `/jerarquia` - Gestión de Jerarquías
- `/turno` - Gestión de Turnos

**Acceso**: Admin, Gerencia

Estos módulos permiten gestionar los catálogos maestros del sistema con operaciones CRUD completas (Crear, Leer, Actualizar, Eliminar).

### 4.5 Módulo de Platos

**Ruta**: `/plato`  
**Acceso**: Rol Cocina

Permite gestionar el catálogo de platos disponibles:

- Crear nuevos platos
- Editar platos existentes
- Eliminar platos
- Asignar imágenes a platos
- Definir precios y características

### 4.6 Módulo de Menú del Día

**Ruta**: `/menudeldia`  
**Acceso**: Rol Cocina

Permite gestionar el menú diario:

- Asignar platos al menú del día
- Definir cantidades disponibles
- Ver cantidad de platos asignados (comandados)
- Ver disponibilidad (cantidad - asignados)
- Exportar menú a PDF y Excel

### 4.7 Módulo de Reporte por Comensal

**Ruta**: `/reportegcomensales`  
**Acceso**: Rol Gerencia

Genera reportes detallados por comensal individual:

- Información personal del comensal (foto, DNI, datos organizacionales)
- Historial completo de pedidos
- Resumen de estadísticas (cantidad de platos, devueltos, costo total)
- Exportación a PDF
- Filtros por fecha, legajo y planta

### 4.8 Módulo de Reporte de Gestión

**Ruta**: `/reporteggestion`  
**Acceso**: Rol Gerencia

Genera reportes generales de gestión:

- Resumen de pedidos
- Detalle de todos los pedidos con múltiples filtros
- Filtros por: fecha, plato, proyecto, planta, jerarquía, centro de costo, estado
- Columnas: Fecha, Planta, CC, Proyecto, Perfil, Legajo, Nombre, Plato, Estado, Costo, Bonificación, Importe bonificado
- Exportación a PDF
- Cálculo de cantidad recibidos

### 4.9 Módulo de Datos Personales

**Ruta**: `/datospersonales`  
**Acceso**: Todos los usuarios autenticados

Permite a cada usuario ver y editar su información personal.

### 4.10 Módulo de Calificación

**Ruta**: `/calificacion`  
**Acceso**: Todos los usuarios autenticados

Permite ver el historial de calificaciones realizadas a los platos.

### 4.11 Módulo de Configuración

**Ruta**: `/configuracion`  
**Acceso**: Admin, Gerencia

Permite configurar parámetros del sistema.

---

## 5. Guía de Uso por Módulo

### 5.1 Módulo de Inicio (Dashboard)

#### 5.1.1 Ver Menú del Día

1. En la sección "Menú del Día", verá los platos disponibles
2. Cada plato muestra:
   - Imagen del plato
   - Nombre del plato
   - Descripción
   - Precio
   - Disponibilidad

#### 5.1.2 Realizar un Pedido

1. Seleccione un turno del dropdown "Seleccionar Turno"
2. En el menú del día, haga clic en el botón de pedir del plato deseado
3. Se abrirá un modal para confirmar el pedido
4. Si tiene bonificaciones disponibles, puede marcar la opción de bonificación
5. Haga clic en "Confirmar Pedido"
6. El pedido aparecerá en la sección "Pedidos Vigentes"

#### 5.1.3 Ver Pedidos Vigentes

En la sección "Pedidos Vigentes" verá:
- Todos sus pedidos del día
- Estado de cada pedido (Pendiente, Recibido, Devuelto, Cancelado)
- Turno asignado
- Hora desde y hora hasta del turno
- Acciones disponibles según el estado

#### 5.1.4 Cancelar un Pedido

1. En "Pedidos Vigentes", localice el pedido que desea cancelar
2. Haga clic en el botón "Cancelar" (solo disponible para pedidos pendientes)
3. Confirme la cancelación en el modal
4. El pedido cambiará a estado "Cancelado"

#### 5.1.5 Recibir un Pedido

1. En "Pedidos Vigentes", localice el pedido que desea recibir
2. Haga clic en el botón "Recibir"
3. Se abrirá un modal donde debe:
   - Seleccionar una calificación (1 a 5 estrellas)
   - Opcionalmente, agregar un comentario
4. Haga clic en "Confirmar Recepción"
5. El pedido cambiará a estado "Recibido"

#### 5.1.6 Devolver un Pedido

1. En "Pedidos Vigentes", localice el pedido recibido que desea devolver
2. Haga clic en el botón "Devolver"
3. Confirme la devolución
4. El pedido cambiará a estado "Devuelto"

### 5.2 Módulo de Despacho

#### 5.2.1 Ver Pedidos

1. Acceda al módulo de Despacho desde el menú
2. Verá una lista de todos los pedidos del día
3. Puede filtrar por estado usando el dropdown "Estado"

#### 5.2.2 Filtrar Pedidos

- Use el campo de búsqueda para buscar por nombre de usuario, plato o número de pedido
- Use el dropdown "Estado" para filtrar por: Pendiente, Recibido, Devuelto, Cancelado

#### 5.2.3 Marcar Pedido como Despachado

1. Localice el pedido en la lista
2. Haga clic en el botón "Despachar" o "Marcar como Despachado"
3. El estado del pedido se actualizará

#### 5.2.4 Imprimir Lista de Pedidos

1. Haga clic en el botón "Imprimir" o "Exportar"
2. Se abrirá un modal para seleccionar las columnas a incluir
3. Seleccione las columnas deseadas
4. Haga clic en "Generar PDF" o "Generar Excel"
5. Se descargará el archivo correspondiente

### 5.3 Módulo de Usuarios

#### 5.3.1 Crear un Nuevo Usuario

1. Haga clic en el botón "Agregar Usuario" o "Nuevo"
2. Complete el formulario con:
   - Nombre y Apellido
   - Legajo
   - DNI
   - CUIL
   - Email
   - Teléfono
   - Planta
   - Centro de Costo
   - Proyecto
   - Jerarquía
   - Plan Nutricional
   - Foto (opcional)
3. Haga clic en "Guardar"

#### 5.3.2 Editar un Usuario

1. En la lista de usuarios, localice el usuario a editar
2. Haga clic en el botón "Editar" o en el ícono de edición
3. Modifique los campos necesarios
4. Haga clic en "Guardar"

#### 5.3.3 Eliminar un Usuario

1. Localice el usuario en la lista
2. Haga clic en el botón "Eliminar" o en el ícono de eliminación
3. Confirme la eliminación
4. El usuario será eliminado del sistema

#### 5.3.4 Buscar Usuarios

- Use el campo de búsqueda para buscar por nombre, apellido, legajo o DNI
- Los resultados se filtrarán automáticamente mientras escribe

### 5.4 Módulo de Reporte por Comensal

#### 5.4.1 Generar un Reporte

1. Acceda al módulo desde el menú
2. Complete los filtros:
   - **Legajo**: Ingrese el legajo del comensal
   - **Fecha Desde**: Seleccione la fecha inicial
   - **Fecha Hasta**: Seleccione la fecha final
   - **Planta**: Opcional, seleccione una planta específica
3. Haga clic en "Generar Reporte"

#### 5.4.2 Ver el Reporte

El reporte mostrará:

**Sección 1 - Información del Comensal**:
- Foto del comensal
- Nombre completo
- DNI
- Legajo
- Proyecto
- Perfil nutricional

**Sección 2 - Historial de Pedidos**:
- Tabla con todos los pedidos en el rango de fechas
- Columnas: Fecha, Plato, Monto, Estado, Bonificación, Invitado, Calificación, Comentario

**Sección 3 - Resumen**:
- Cantidad de platos
- Cantidad devueltos (pedidos con estado 'D')
- Costo total (suma de pedidos recibidos con estado 'R')
- Promedio de calificación (si aplica)

#### 5.4.3 Exportar a PDF

1. En la sección "Historial de Pedidos", haga clic en el ícono de PDF (rojo) ubicado a la derecha del título
2. Se generará y descargará automáticamente un archivo PDF con el reporte completo

### 5.5 Módulo de Reporte de Gestión

#### 5.5.1 Generar un Reporte

1. Acceda al módulo desde el menú
2. Complete los filtros disponibles:
   - **Fecha Desde**: Fecha inicial del período
   - **Fecha Hasta**: Fecha final del período
   - **Plato**: Opcional, seleccione un plato específico
   - **Proyecto**: Opcional, seleccione un proyecto
   - **Planta**: Opcional, seleccione una planta
   - **Jerarquía**: Opcional, seleccione una jerarquía
   - **Centro de Costo**: Opcional, seleccione un centro de costo
   - **Estado**: Opcional, seleccione un estado (Pendiente, Recibido, Devuelto, Cancelado, En Aceptación)
3. Haga clic en el botón "Buscar"

#### 5.5.2 Ver el Reporte

El reporte mostrará:

**Sección 1 - Resumen**:
- Cantidad de pedidos
- Cantidad recibidos (pedidos con estado 'R')
- Costo total (suma de pedidos recibidos con estado 'R')

**Sección 2 - Detalle del Reporte**:
- Tabla completa con todos los pedidos que cumplen los filtros
- Columnas: Fecha, Planta, CC, Proyecto, Perfil, Legajo, Nombre completo, Plato, Estado, Costo, Bonificación, Importe bonificado

**Nota sobre columnas**:
- **Bonificación**: Muestra "✓" si el pedido tiene bonificación, "0" si no
- **Costo**: Precio del plato
- **Bonificación**: Valor de la bonificación (igual al costo si está bonificado, 0 si no)
- **Importe bonificado**: Diferencia entre Costo y Bonificación (Costo - Bonificación)

#### 5.5.3 Exportar a PDF

1. En la sección "Detalle del Reporte", haga clic en el ícono de PDF (rojo) ubicado a la derecha del título
2. Se generará y descargará automáticamente un archivo PDF con el reporte completo

### 5.6 Módulo de Menú del Día

#### 5.6.1 Ver el Menú del Día

1. Acceda al módulo desde el menú
2. Verá una tabla con todos los platos asignados al menú del día
3. La tabla muestra:
   - **Cantidad**: Cantidad total disponible (tachada) y cantidad disponible (en verde) = cantidad - asignados
   - **Asignados**: Cantidad de platos ya asignados a pedidos
   - Otras columnas: ID, Nombre del plato, Descripción, etc.

#### 5.6.2 Gestionar Cantidades

- La columna "Cantidad" muestra:
  - El número original tachado (cantidad total)
  - El número en verde al lado (cantidad disponible = cantidad - asignados)

#### 5.6.3 Exportar Menú

- Use los botones "Exportar PDF" o "Exportar Excel" para descargar el menú del día

### 5.7 Módulos de Catálogos (Planta, Centro de Costo, Proyecto, etc.)

Todos los módulos de catálogos funcionan de manera similar:

#### 5.7.1 Crear un Nuevo Registro

1. Haga clic en "Agregar" o "Nuevo"
2. Complete el formulario con los datos requeridos
3. Haga clic en "Guardar"

#### 5.7.2 Editar un Registro

1. Localice el registro en la lista
2. Haga clic en "Editar"
3. Modifique los campos necesarios
4. Haga clic en "Guardar"

#### 5.7.3 Eliminar un Registro

1. Localice el registro en la lista
2. Haga clic en "Eliminar"
3. Confirme la eliminación

#### 5.7.4 Buscar Registros

- Use el campo de búsqueda para filtrar la lista
- Los resultados se actualizan automáticamente

---

## 6. Funcionalidades Especiales

### 6.1 Sistema de Bonificaciones

Los usuarios pueden tener bonificaciones disponibles que les permiten obtener platos sin costo. Al realizar un pedido:

1. Si tiene bonificaciones disponibles, aparecerá una opción para usar bonificación
2. Marque la casilla de bonificación si desea usarla
3. El pedido se registrará como bonificado

### 6.2 Sistema de Calificaciones

Al recibir un pedido, el usuario puede:

1. Calificar el plato de 1 a 5 estrellas
2. Agregar un comentario opcional
3. La calificación se guarda y puede verse en el módulo de Calificación

### 6.3 Exportación de Reportes

Los reportes pueden exportarse en dos formatos:

- **PDF**: Formato de documento portátil, ideal para impresión y archivo
- **Excel**: Formato de hoja de cálculo, ideal para análisis de datos

### 6.4 Filtros Avanzados

En los módulos de reportes, puede combinar múltiples filtros para obtener resultados específicos:

- Filtros por fecha (rango)
- Filtros por categorías (plato, proyecto, planta, etc.)
- Filtros por estado
- Búsqueda por texto libre

### 6.5 Actualización Automática

El módulo de Inicio se actualiza automáticamente cada 2 segundos para mostrar:
- Nuevos pedidos
- Cambios en el menú
- Actualizaciones de estado

### 6.6 Instalación como PWA

SmartLunch puede instalarse como aplicación en dispositivos móviles y tablets:

**En móviles/tablets**:
1. Abra SmartLunch en el navegador
2. Busque la opción "Agregar a pantalla de inicio" o "Instalar app"
3. Siga las instrucciones para instalar

**En computadoras**:
1. En Chrome/Edge: Busque el ícono de instalación en la barra de direcciones
2. Haga clic para instalar

---

## 7. Solución de Problemas

### 7.1 Error de Conexión al Servidor

**Síntoma**: Aparece el mensaje "No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8000"

**Solución**:
1. Verifique que el servidor backend esté corriendo
2. Verifique la configuración de la URL del servidor en `config.json`
3. Verifique su conexión a Internet
4. Contacte al administrador del sistema

### 7.2 No Puedo Iniciar Sesión

**Solución**:
1. Verifique que su nombre de usuario y contraseña sean correctos
2. Asegúrese de que su cuenta esté activa
3. Contacte al administrador si el problema persiste

### 7.3 No Veo Ciertos Módulos en el Menú

**Causa**: Su rol de usuario no tiene permisos para acceder a esos módulos

**Solución**: Contacte al administrador para verificar sus permisos

### 7.4 Los Estilos No Se Ven Correctamente

**Solución**:
1. Recargue la página (F5 o Ctrl+R)
2. Limpie la caché del navegador
3. Verifique que JavaScript esté habilitado

### 7.5 El Menú del Día No Se Actualiza

**Solución**:
1. Espere unos segundos (la actualización es automática cada 2 segundos)
2. Recargue la página manualmente
3. Verifique su conexión a Internet

### 7.6 No Puedo Exportar un Reporte

**Solución**:
1. Verifique que tenga datos en el reporte
2. Asegúrese de que los filtros estén correctamente configurados
3. Intente nuevamente después de unos segundos
4. Verifique que su navegador permita descargas

---

## 8. Glosario

### 8.1 Términos del Sistema

- **Bonificación**: Descuento o gratuidad aplicada a un pedido
- **Centro de Costo**: Unidad organizacional para la asignación de costos
- **Comanda**: Orden o pedido de comida
- **Despacho**: Proceso de entrega de pedidos por parte de cocina
- **Jerarquía**: Nivel organizacional del usuario (Admin, Gerencia, Cocina, Comensal)
- **Legajo**: Número de identificación único del empleado
- **Menú del Día**: Lista de platos disponibles para un día específico
- **Pedido Vigente**: Pedido que está activo y pendiente de procesamiento
- **Plan Nutricional**: Perfil alimentario asignado a un usuario
- **Planta**: Ubicación física o sede de la organización
- **Proyecto**: Iniciativa o área de trabajo
- **Turno**: Período de tiempo para el servicio de comida (ej: Almuerzo, Cena)

### 8.2 Estados de Pedidos

- **Pendiente (P)**: Pedido realizado pero aún no procesado
- **Recibido (R)**: Pedido entregado y recibido por el comensal
- **Devuelto (D)**: Pedido que fue devuelto por el comensal
- **Cancelado (C)**: Pedido que fue cancelado antes de ser procesado
- **En Aceptación (E)**: Pedido en proceso de aceptación

### 8.3 Roles del Sistema

- **Admin**: Administrador con acceso completo al sistema
- **Gerencia**: Personal gerencial con acceso a reportes y análisis
- **Cocina**: Personal de cocina con acceso a despacho y gestión de menús
- **Comensal**: Usuario final que realiza pedidos

---

## 9. Contacto y Soporte

Para asistencia técnica o consultas sobre el uso del sistema, contacte al equipo de soporte de SmartLunch.

---

## 10. Anexos

### 10.1 Atajos de Teclado

- **Enter**: Confirmar acción en formularios
- **Esc**: Cerrar modales
- **Tab**: Navegar entre campos

### 10.2 Navegación Rápida

- Use el menú superior para acceder rápidamente a los módulos
- El menú se adapta según su rol de usuario
- Use el botón de inicio para volver al dashboard principal

---

**Fin del Manual de Usuario**

*Este manual está sujeto a actualizaciones. Consulte la versión más reciente en el sistema.*

