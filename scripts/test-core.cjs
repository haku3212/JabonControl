const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

// A disposable database keeps regression checks away from operational data.
const database = path.join(mkdtempSync(path.join(tmpdir(), 'jabon-qa-')), 'test.db');
const port = 5098;
const child = spawn(process.execPath, ['server.js'], {
  cwd: path.resolve(__dirname, '../backend'),
  env: { ...process.env, PORT: String(port), DATABASE: database, DATABASE_URL: '', ENABLE_DEMO_DATA: 'false', ADMIN_PASSWORD: 'qa-local-only', NODE_ENV: 'test' },
  stdio: 'ignore',
});
let token;
async function request(endpoint, method = 'GET', body) {
  const response = await fetch(`http://localhost:${port}/api${endpoint}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
(async () => {
  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      try { if ((await request('/health')).status === 200) break; } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    token = (await request('/auth/login', 'POST', { usuario: 'admin', password: 'qa-local-only' })).data.token;
    assert.ok(token);
    const client = await request('/clientes', 'POST', { nombre: 'QA Cliente', tipo: 'empresa', telefono: '', email: '', ciudad: '', direccion: '' });
    assert.equal(client.status, 201);
    const sale = { numeroNE: 'NE-0001', fecha: '2026-10-19', cliente: 'QA Cliente', formato: 'Barras', cantidad: 10, precioUnitario: 20, tipoPago: 'credito', estadoEntrega: 'pendiente_recojo', observaciones: 'QA' };
    const created = await request('/ventas', 'POST', { ...sale, total: 9999 });
    assert.equal(created.status, 201);
    assert.equal(created.data.total, 200);
    assert.equal((await request('/ventas', 'POST', { ...sale, numeroNE: 'NE-0002', cantidad: 'abc' })).status, 400);
    assert.equal((await request('/cobros', 'POST', { cliente: sale.cliente, montoCobrado: 50, metodoPago: 'efectivo', notasCorrespondientes: 'NE-0001' })).status, 201);
    assert.equal((await request('/ventas')).data[0].saldoPendiente, 150);
    assert.equal((await request('/cobros', 'POST', { cliente: sale.cliente, montoCobrado: 151, metodoPago: 'efectivo' })).status, 400);
    assert.equal((await request(`/clientes/${client.data.id}`, 'DELETE')).status, 409);
    assert.equal((await request(`/clientes/${client.data.id}`, 'PUT', { nombre: 'Nombre cambiado', tipo: 'empresa' })).status, 409);
    assert.equal((await request(`/ventas/${created.data.id}`, 'DELETE')).status, 409);
    assert.equal((await request(`/ventas/${created.data.id}`, 'PUT', { ...sale, cantidad: 1 })).status, 409);
    assert.equal((await request('/finanzas/movimientos', 'POST', { tipo: 'egreso', concepto: 'QA gasto', monto: -1 })).status, 400);
    assert.equal((await request('/finanzas/movimientos', 'POST', { tipo: 'egreso', concepto: 'QA gasto', monto: 25 })).status, 201);
    assert.equal((await request('/finanzas/movimientos')).data.length, 1);
    console.log('PASS: 13 comprobaciones de clientes, ventas, cobros y gastos; base temporal:', database);
  } finally { child.kill(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
