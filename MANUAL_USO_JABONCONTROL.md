# Manual de Uso - JabonControl

## 1. Objetivo del sistema

JabonControl sirve para administrar una jaboneria desde una sola interfaz: clientes, ventas, cobros, materias primas, hornadas, finanzas, proyectos, equipos, documentacion, reportes, usuarios y auditoria.

El sistema esta pensado para que cada area registre su trabajo diario y el administrador pueda revisar informacion, permisos, historial de cambios y reportes.

## 2. Acceso al sistema

1. Abra el navegador.
2. Entre a la direccion entregada por el administrador.
3. Escriba usuario y contrasena.
4. Presione Entrar.

En produccion no se deben usar credenciales demo. El administrador debe crear usuarios reales y cambiar la contrasena inicial.

## 3. Roles de usuario

Admin:
Accede a todos los modulos, usuarios, auditoria, reportes, eliminaciones y configuracion.

Supervisor:
Puede trabajar con operacion, ventas, cobros, finanzas y reportes, pero no administra usuarios ni auditoria completa.

Operario:
Puede registrar datos operativos como hornadas, materias primas, acabado, documentacion y equipos segun permisos configurados.

## 4. Dashboard

El Dashboard muestra indicadores generales del negocio:

- Ventas.
- Cobros.
- Cuentas por cobrar.
- Produccion.
- Rendimiento.
- Alertas o informacion relevante.

Use esta pantalla para revisar rapidamente el estado del negocio antes de entrar a cada modulo.

## 5. Clientes

En Clientes puede registrar y revisar la ficha de cada cliente.

Datos recomendados:

- Nombre.
- Tipo de cliente.
- Telefono.
- Email.
- Ciudad.
- Direccion.

Buenas practicas:

- No duplicar clientes con nombres parecidos.
- Mantener telefono y email actualizados.
- Revisar la ficha antes de crear ventas o cobros.

## 6. Ventas

En Ventas se registran notas de entrega y ventas realizadas.

Campos principales:

- Numero de nota de entrega.
- Fecha.
- Cliente.
- Formato.
- Cantidad.
- Precio unitario.
- Tipo de pago.

Si la venta es a credito, el sistema genera saldo pendiente. Ese saldo se usa despues en Cobros.

## 7. Cobros

En Cobros se registran pagos de clientes.

El selector de clientes debe mostrar principalmente clientes con deuda pendiente.

Al registrar un cobro:

1. Seleccione cliente.
2. Revise deuda pendiente.
3. Escriba monto cobrado.
4. Seleccione metodo de pago.
5. Agregue notas si corresponde.
6. Guarde el cobro.

El sistema aplica el pago sobre ventas pendientes.

## 8. Finanzas

Finanzas permite revisar ingresos, egresos, flujo de caja, utilidad estimada y movimientos manuales.

Puede registrar movimientos manualmente:

- Fecha.
- Tipo: ingreso o egreso.
- Concepto.
- Categoria.
- Monto.
- Cliente o proveedor.
- Metodo.
- Referencia.

Importacion:

Por seguridad, la importacion financiera acepta archivos CSV exportados desde Excel. No se importan archivos `.xlsx` directamente porque se consideran archivos no confiables.

Columnas recomendadas para CSV:

- fecha.
- concepto.
- ingreso.
- egreso.
- monto.
- cliente.
- proveedor.
- referencia.
- metodo.
- categoria.

Despues de subir el CSV, revise la vista previa antes de confirmar.

## 9. Materias primas

Use este modulo para registrar recepciones de insumos y materiales.

Datos principales:

- Fecha.
- Proveedor.
- Producto.
- Cantidad.
- Unidad.
- Precio unitario.
- Estado.

Incluye productos como NaOH, aceite quemado, sebo, aceite de almendra, cajas, etiquetas y almendra podrida.

## 10. Hornadas

Hornadas registra la produccion.

Datos principales:

- Numero de hornada.
- Fecha.
- Hora de inicio.
- Operario.
- Ingredientes.
- Produccion total.
- Rendimiento.
- Observaciones.

Use observaciones para registrar ajustes, problemas de temperatura, cambios de mezcla o novedades de calidad.

## 11. Acabado

Use Acabado para controlar etapas posteriores a la hornada, como terminado, empaque, calidad o salida de producto.

Buenas practicas:

- Registrar fecha real.
- Registrar responsable.
- Usar observaciones para incidencias.

## 12. Proyectos

Proyectos funciona como lista de tareas para mejoras internas.

Puede usarlo para:

- Mantenimientos.
- Compras pendientes.
- Mejoras de planta.
- Implementaciones.
- Actividades administrativas.

Cada proyecto puede tener tareas, responsable, estado y progreso.

## 13. Equipos

Equipos permite administrar maquinaria y herramientas.

Datos principales:

- Nombre del equipo.
- Tipo.
- Estado.
- Fecha de compra.
- Ubicacion.
- Responsable.
- Imagen del equipo.
- Especificaciones tecnicas.
- Documentos adjuntos.
- Observaciones.

Documentos permitidos:

- PDF.
- JPG.
- PNG.
- WEBP.

Ejemplos:

- Factura.
- Garantia.
- Manual.
- Mantenimiento escaneado.
- Foto de placa tecnica.

## 14. Documentacion

Documentacion centraliza archivos importantes del negocio.

Puede guardar:

- Permisos.
- Facturas.
- Certificados.
- Contratos.
- Manuales.
- Documentos administrativos.

Recomendacion:

Use nombres claros y registre vencimientos cuando aplique.

## 15. Reportes y PDF

Reportes permite generar informacion ejecutiva para revision.

Antes de descargar, seleccione que informacion quiere incluir.

Reportes recomendados:

- Ventas por periodo.
- Cobros por cliente.
- Finanzas.
- Produccion.
- Materias primas.
- Clientes.

## 16. Usuarios

Solo el administrador debe gestionar usuarios.

Acciones:

- Crear usuario.
- Cambiar rol.
- Activar o desactivar usuario.
- Cambiar contrasena.

Politica recomendada:

- No compartir usuarios.
- Cada persona debe tener su propia cuenta.
- Cambiar contrasenas periodicamente.
- Desactivar usuarios que ya no trabajen en la empresa.

## 17. Auditoria

Auditoria muestra cambios realizados en el sistema:

- Quien hizo el cambio.
- Que accion realizo.
- En que modulo.
- Fecha.
- Valores anteriores y nuevos cuando aplica.

La auditoria tiene verificacion de integridad con hashes. Si alguien manipula manualmente la base de datos, la verificacion puede detectar ruptura de la cadena.

## 18. Backup

El sistema puede exportar respaldo en formato JSON.

Buenas practicas:

- Hacer backup diario.
- Guardar copia en disco externo o nube privada.
- No compartir backups por WhatsApp o correo sin proteccion.
- Probar restauracion antes de depender del sistema en produccion.

## 19. Seguridad operativa

Recomendaciones minimas:

- Usar HTTPS en servidor.
- Cambiar `JWT_SECRET`.
- Crear `ADMIN_PASSWORD` fuerte.
- Desactivar datos demo en produccion.
- Usar usuarios individuales.
- Revisar auditoria semanalmente.
- Hacer backups.
- No subir archivos desconocidos.
- Importar finanzas por CSV revisado.

## 20. Flujo diario recomendado

Inicio del dia:

1. Revisar Dashboard.
2. Revisar materias primas.
3. Registrar hornadas planificadas.
4. Revisar ventas pendientes y cuentas por cobrar.

Durante el dia:

1. Registrar recepciones.
2. Registrar produccion.
3. Registrar ventas.
4. Registrar cobros.
5. Registrar movimientos financieros importantes.

Fin del dia:

1. Revisar Dashboard.
2. Revisar cobros.
3. Revisar finanzas.
4. Descargar o guardar backup.
5. Revisar auditoria si hubo cambios sensibles.

## 21. Preparacion para produccion

Antes de usar con datos reales:

1. Configurar servidor.
2. Configurar dominio.
3. Activar HTTPS.
4. Configurar variables de entorno.
5. Crear usuarios reales.
6. Cargar datos iniciales.
7. Probar cada modulo.
8. Hacer backup inicial.
9. Capacitar usuarios.
10. Definir responsable de mantenimiento.

