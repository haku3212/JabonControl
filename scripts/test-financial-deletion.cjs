const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const database = path.join(mkdtempSync(path.join(tmpdir(), 'jabon-delete-')), 'test.db');
const port = 5103;
const child = spawn(process.execPath, ['server.js'], { cwd: path.resolve(__dirname, '../backend'), env: { ...process.env, PORT: String(port), DATABASE: database, DATABASE_URL: '', ENABLE_DEMO_DATA: 'false', ADMIN_PASSWORD: 'qa-local-only', AUTH_COOKIE_ONLY: 'false', NODE_ENV: 'test' }, stdio: 'ignore' });
let token;
let count = 0;
function check(value, expected) { assert.deepEqual(value, expected); count++; }
async function request(endpoint, method = 'GET', body, auth = token) {
  const response = await fetch(`http://localhost:${port}/api${endpoint}`, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
(async () => {
  try {
    for (let i = 0; i < 100; i++) { try { if ((await request('/health')).status === 200) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
    token = (await request('/auth/login', 'POST', { usuario: 'admin', password: 'qa-local-only' })).data.token;
    assert.ok(token);
    const sale = { cliente: 'Cliente QA', formato: 'Barras', cantidad: 1, precioUnitario: 100, tipoPago: 'credito', fecha: '2026-11-01' };
    const first = await request('/ventas', 'POST', { ...sale, numeroNE: 'NE-0001' }); check(first.status, 201);
    const second = await request('/ventas', 'POST', { ...sale, fecha: '2026-11-02', numeroNE: 'NE-0002' }); check(second.status, 201);
    const payment = await request('/cobros', 'POST', { cliente: sale.cliente, montoCobrado: 50, metodoPago: 'efectivo' }); check(payment.status, 201);
    const motivo = { motivo: 'Registro de prueba QA' };
    check((await request(`/cobros/${payment.data.id}`, 'DELETE')).status, 400);
    const blocked = await request(`/ventas/${first.data.id}`, 'DELETE', motivo);
    check(blocked.status, 409); check(blocked.data.error.includes('Cobros'), true);
    check((await request('/ventas')).data.length, 2);
    check((await request(`/ventas/${second.data.id}`, 'DELETE', motivo)).status, 200);
    check((await request('/ventas/siguiente-numero')).data.numeroNE, 'NE-0003');
    check((await request('/ventas', 'POST', { ...sale, numeroNE: 'NE-0002' })).status, 409);
    for (const role of ['supervisor', 'finanzas', 'operario']) {
      check((await request('/usuarios', 'POST', { nombre: role, usuario: role, password: 'QaPassword123', rol: role })).status, 201);
      const roleToken = (await request('/auth/login', 'POST', { usuario: role, password: 'QaPassword123' })).data.token;
      check((await request(`/cobros/${payment.data.id}`, 'DELETE', motivo, roleToken)).status, 403);
      check((await request(`/ventas/${first.data.id}`, 'DELETE', motivo, roleToken)).status, 403);
    }
    const removed = await request(`/cobros/${payment.data.id}`, 'DELETE', motivo);
    check(removed.status, 200); check(removed.data.ventasActualizadas[0].saldoPendiente, 100);
    check((await request('/cobros')).data.length, 0);
    check((await request('/ventas')).data[0].estado, 'pendiente');
    check((await request(`/cobros/${payment.data.id}`, 'DELETE', motivo)).status, 404);
    check((await request(`/ventas/${first.data.id}`, 'DELETE', motivo)).status, 200);
    check((await request('/ventas')).data.length, 0);
    check((await request('/ventas/siguiente-numero')).data.numeroNE, 'NE-0003');
    const cash = await request('/ventas', 'POST', { ...sale, numeroNE: 'NE-0003', tipoPago: 'contado' });
    check((await request(`/ventas/${cash.data.id}`, 'DELETE', motivo)).status, 200);
    const audit = (await request('/auditoria')).data.filter(item => item.accion === 'anular');
    check(audit.length, 4); check(audit.every(item => item.valores_anteriores && JSON.parse(item.valores_nuevos).motivo === motivo.motivo), true);
    check((await request('/auditoria/integridad')).data.ok, true);
    const raceSale = await request('/ventas', 'POST', { ...sale, numeroNE: 'NE-0004' });
    const race = await Promise.all([request('/cobros', 'POST', { cliente: sale.cliente, montoCobrado: 60, metodoPago: 'efectivo' }), request('/cobros', 'POST', { cliente: sale.cliente, montoCobrado: 60, metodoPago: 'efectivo' })]);
    check(race.map(item => item.status).sort(), [201, 400]);
    const activePayment = race.find(item => item.status === 201).data;
    await request(`/cobros/${activePayment.id}`, 'DELETE', motivo);
    const doubleDelete = await Promise.all([request(`/ventas/${raceSale.data.id}`, 'DELETE', motivo), request(`/ventas/${raceSale.data.id}`, 'DELETE', motivo)]);
    check(doubleDelete.map(item => item.status).sort(), [200, 404]);
    console.log(`PASS: ${count} comprobaciones de eliminacion, deuda, auditoria, numeracion, permisos y concurrencia. Solo base temporal.`);
  } finally { child.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
