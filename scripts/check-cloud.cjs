const assert = require('node:assert/strict');
const path = require('node:path');
require('../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '../.env.render.local'), quiet: true });
const base = process.env.CHECK_URL;
if (!base) throw new Error('Indique CHECK_URL.');
let cookie = '';
async function api(route, method = 'GET', body) {
  const response = await fetch(`${base}/api${route}`, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  const data = await response.json();
  assert.ok(response.ok, `${method} ${route}: ${response.status} ${data.error || ''}`);
  return data;
}
(async () => {
  assert.equal((await api('/health')).storage, 'postgresql');
  await api('/auth/login', 'POST', { usuario: 'admin', password: process.env.ADMIN_PASSWORD });
  const sales = await api('/ventas');
  assert.ok(sales.length >= 7, 'No aparecen las ventas migradas.');
  assert.ok(sales.some((sale) => sale.estadoEntrega === 'pendiente_recojo'), 'No se preservo el estado de entrega.');
  const customer = { nombre: `QA despliegue ${Date.now()}`, tipo: 'empresa', telefono: '', email: '', ciudad: '', direccion: '' };
  const created = await api('/clientes', 'POST', customer);
  await api(`/clientes/${created.id}`, 'PUT', { ...customer, telefono: 'QA-verificado' });
  assert.equal((await api('/clientes')).find((item) => item.id === created.id).telefono, 'QA-verificado');
  await api(`/clientes/${created.id}`, 'DELETE');
  const movements = await api('/finanzas/movimientos');
  const integrity = await api('/auditoria/integridad');
  assert.ok(integrity.ok, 'La integridad de auditoria fallo.');
  console.log(JSON.stringify({ ok: true, storage: 'postgresql', ventas: sales.length, movimientos: movements.length, guardado: 'verificado', auditoria: integrity.ok }));
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
