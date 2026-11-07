# Contabilidad: expediente documental mensual

Primera entrega: registro y revision documental, no contabilidad general ni motor tributario.

- Acceso exclusivo a roles existentes `admin` y `finanzas`, validado tambien en API.
- Persistencia en `app_records`, modulo `contabilidad_documentos`, con validacion dedicada; no requiere migraciones ni cambia registros anteriores.
- Importes documentales guardados como centavos enteros. No modifica los tipos monetarios de ventas y egresos existentes.
- Facturas, recibos y otros respaldos de compra o venta; revision pendiente, observada, revisada o anulada.
- Edicion con control de revision, comprobacion de duplicados y auditoria en la misma transaccion.
- Anulacion del registro interno con motivo obligatorio; no anula documentos en el SIN.
- Viculo opcional por ID a venta o egreso existente. No genera ingresos, egresos ni cobros nuevos.
- Periodo de documentos segun su fecha. La lista de operaciones sin respaldo usa la fecha de la operacion y busca vinculos en todos los periodos.
- CSV del expediente o del filtro actual; no es una plantilla oficial de importacion RCV.

## Limites

No valida autenticidad de facturas ni habilitacion de credito fiscal. No calcula IVA, IT o IUE. No conecta con SIAT, presenta declaraciones, adjunta archivos, concilia bancos, cierra meses ni genera asientos o balances. Estos pasos requieren confirmar regimen, obligaciones, plan de cuentas y saldos iniciales con el contador.

Los vinculos son referencias de consulta: las eliminaciones de ventas/egresos existentes no quedan bloqueadas por este expediente. El documento conserva el ID; una edicion exige un origen vigente o quitar el vinculo.

## Verificacion

`node scripts/test-accounting.cjs`: API aislada en SQLite temporal; sin datos productivos.

Las pruebas de interfaz se hacen con base local desechable. En produccion solo se abre el formulario y se consultan datos, sin registrar documentos ficticios.
