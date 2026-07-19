# Tareas realizadas – SmartLunch Frontend (Febrero 2026)

## 1. Control de bonificaciones por cantidad
- Evitar aplicar más descuentos que bonificaciones disponibles.
- Con 1 bonificación no se puede marcar descuento en más de un plato.
- Prop `puedeAplicarBonificacion` en `MenuItem` para deshabilitar el checkbox cuando se alcanza el límite.

## 2. Bonificaciones entre turnos
- Si se aplica descuento en un turno (ej. almuerzo) y se cambia a otro (ej. cena), los checkboxes de descuento en el otro turno quedan deshabilitados.
- Tooltip: "Ya aplicaste tu bonificación en otro turno".

## 3. Persistencia de bonificación al cambiar de turno
- Estado `menuItemsByTurno` para guardar el menú por turno.
- Función `mergeMenuItemsConCache` para conservar `aplicarBonificacion` al cambiar de turno.
- Al volver al turno donde se marcó el descuento, la selección se mantiene.

## 4. Corrección de error ESLint
- `turnoId` no definido en el bloque `catch` de `cargarMenuDesdeAPI`; se usa `selectedTurno` para obtener el ID.

## 5. Ocultar mensaje "Te queda 1 bonificación para consumir hoy"
- Eliminado el mensaje en desktop y móvil.
- Solo se muestra "Bonificaciones del usuario: X (Y% descuento)".

## 6. Mejora del merge para preservar bonificación
- Merge más flexible por `codigo`, `platoId` y prefijo de `codigo`.
- No sobrescribir el caché con datos vacíos al cambiar de turno.

## 7. Actualización de bonificaciones al enviar pedido
- "Bonificaciones del usuario" pasa a usar `pedidosRestantes` (restantes).
- Actualización optimista al confirmar pedido con bonificación para que el contador pase a 0 de inmediato.

## 8. Liberar bonificación al cancelar pedido
- Excluir pedidos cancelados (`Estado === 'C'`) del conteo de bonificaciones usadas.
- Actualización optimista al cancelar un pedido con bonificación para liberar la bonificación al instante.

## 9. Uso de `bonificacionesAplicadas` del backend
- Uso de `usuario.bonificacionesAplicadas` cuando el backend lo envía.
- Cálculo: `pedidosRestantes = bonificaciones - bonificacionesAplicadas`.
- Si la diferencia es 0: no se muestra el botón de aplicar.
- Si la diferencia es > 0: se muestra la cantidad restante y el botón de aplicar.
- Añadido `bonificacionesAplicadas` en `DashboardContext`, `inicioService` y `Index.js`.

---

**Archivos modificados:** `src/pages/Index.js`, `src/components/MenuItem.js`, `src/contexts/DashboardContext.js`, `src/services/inicioService.js`
