# Contactos

Agenda independiente de Clientes y Usuarios. No genera ventas, cobros ni gastos.

## Permisos

Admin, supervisor, supervisor de ventas y finanzas pueden consultar, crear,
editar, archivar y reactivar contactos. Solo admin crea categorias. Operario
no tiene acceso. Los permisos se verifican tambien en el servidor.

## Formularios

- Persona o empresa; nombre y al menos una categoria obligatorios.
- Varias categorias, empresa, persona de contacto y productos o servicios.
- Telefono principal, alternativo, WhatsApp internacional y correo opcionales.
- Ciudad, direccion, observaciones y datos opcionales de transporte.
- Correo, telefonos y longitudes se validan en el servidor.
- Un telefono o correo compartido requiere confirmacion explicita.
- Archivar conserva los datos y permite reactivar. No hay borrado definitivo.
- La revision detecta cambios concurrentes y evita sobrescribir al otro usuario.

## Persistencia Y Despliegue

Se reutiliza `jaboncontrol.app_records`: modulo `contactos` para fichas y
`contacto_categorias` para categorias personalizadas. No necesita migracion
destructiva, claves Supabase en el navegador ni una tabla publica adicional.
Las categorias iniciales se ofrecen sin insertar contactos de demostracion.
Los registros antiguos con una sola `categoria` se leen de forma compatible.
Contacto y evento de auditoria se guardan en una transaccion PostgreSQL.

La agenda carga informacion al entrar y permite actualizarla manualmente.
Los filtros de texto, categoria, ciudad y estado se combinan; hay paginas de
20 contactos. No se implementaron importacion Excel, multiples vehiculos ni
vinculos automaticos con gastos o entregas en esta entrega.

## Pruebas Locales

```sh
node scripts/test-contactos.cjs
node scripts/test-contactos-storage.cjs
node scripts/test-core.cjs
cd jaboncontrol
npm run build
```

Las pruebas anteriores usan bases SQLite temporales. No modifican datos de
produccion. `node scripts/test-contactos-postgres.cjs` usa la conexion ignorada
en `.env.render.local`, verifica el proyecto y crea tablas TEMP privadas de la
sesion en Supabase para probar las sentencias, la API y el rollback sin tocar
registros operativos. Verificar tambien la API publicada y el esquema privado.
