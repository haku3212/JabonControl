# Interfaz Y Registro De Egresos

Navegacion y acciones con acentos azules, identidad verde, fondos claros y
estados semanticos diferenciados. Se conservan los modulos y sus funciones.

## Compras Y Gastos

- Historial a todo el ancho con busqueda, categoria, metodo y fechas combinables.
- Resumen filtrado, total del mes y numero de beneficiarios.
- Paginas de 15 registros; ficha de detalle, edicion y confirmacion al eliminar.
- Formulario independiente con datos del egreso, pago y comprobante.
- Importes con centavos: acepta `1.250,50`, `1250,50` y `1250.50`.
- Sugerencias por nombre desde Contactos activos y beneficiarios anteriores.
- Errores junto a los campos y conservacion del formulario si falla el guardado.
- Aviso antes de descartar cambios y controles adaptados a celular.

Las sugerencias de Contactos son texto: no se creo una relacion por ID ni se
reescribieron gastos anteriores. El registro representa un pago realizado,
no una orden de compra pendiente. No se agregaron Excel ni adjuntos en esta
entrega; la referencia sigue siendo el numero de factura, recibo u operacion.

## Guardado

La API valida fecha real, textos, tipo, metodo e importe positivo de hasta dos
decimales. Alta, edicion y eliminacion guardan su auditoria en una transaccion.
El formulario nuevo genera un identificador por solicitud: reintentar el mismo
guardado no crea otro egreso; si cambia el contenido, se informa el conflicto.
No se necesitan migraciones destructivas ni cambios de credenciales.

## Pruebas

```sh
node scripts/test-expenses.cjs
node scripts/test-expenses-postgres.cjs
node scripts/test-core.cjs
node scripts/test-financial-deletion.cjs
node scripts/test-contactos.cjs
```

Las pruebas usan SQLite temporal o tablas TEMP privadas de una sesion de
PostgreSQL. La revision visual cubre escritorio y celular, validacion, alta,
edicion, detalle, filtros y proteccion de cambios sin guardar.
