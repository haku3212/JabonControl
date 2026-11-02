# Eliminar Ventas Y Cobros De Prueba

Solo el administrador puede eliminar. La papelera abre una confirmacion con
cliente, importe, motivo y casilla de confirmacion. Cancelar no cambia datos.

1. En Cobros, localizar el pago de prueba y pulsar su papelera.
2. Elegir el motivo, confirmar y pulsar Eliminar registro.
3. El importe sale del dinero recibido y vuelve a la deuda del cliente.
4. En Ventas, localizar la nota de prueba y pulsar su papelera.
5. Si tiene cobros aplicados, el sistema impide eliminarla y explica el motivo.
   No se eliminan cobros automaticamente ni se trasladan pagos para permitirlo.
6. Repetir con los cobros de prueba correspondientes y despues con la venta.

La relacion actual de cobros con ventas se calcula por cliente y orden FIFO;
la referencia de nota del cobro es texto, no una asignacion por ID. Verificar
cliente, fecha e importe antes de eliminar cualquier pago.

Los registros dejan de contar en los listados activos y sus totales. Una copia
completa queda en el esquema privado, dentro de `app_records` con modulo
`ventas_anulados` o `cobros_anulados`, junto con motivo, usuario y fecha.
Auditoria conserva el evento y los datos anteriores. Esta entrega no incluye
un boton de restauracion automatica; no equivale a borrar el historial.
Los numeros de notas anuladas no se vuelven a asignar.

Registro, copia de anulacion, saldos y auditoria se confirman en una sola
transaccion. Las altas, ediciones y eliminaciones de ventas y cobros comparten
el mismo bloqueo de escritura en PostgreSQL para evitar validar contra una
deuda que otro usuario modifica mientras se guarda.

## Verificacion

```sh
node scripts/test-financial-deletion.cjs
node scripts/test-financial-deletion-rollback.cjs
node scripts/test-financial-deletion-postgres.cjs
node scripts/test-core.cjs
node scripts/test-contactos.cjs
```

Las pruebas locales usan SQLite temporal. La prueba PostgreSQL usa unicamente
tablas TEMP de su sesion en Supabase; no borra registros de la empresa.
