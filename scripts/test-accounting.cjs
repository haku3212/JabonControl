const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const database = path.join(mkdtempSync(path.join(tmpdir(), 'jabon-accounting-')), 'test.db');
const port = 5106;
const child = spawn(process.execPath, ['server.js'], { cwd: path.resolve(__dirname, '../backend'), env: { ...process.env, PORT: String(port), DATABASE: database, DATABASE_URL: '', ENABLE_DEMO_DATA: 'false', ADMIN_PASSWORD: 'qa-local-only', AUTH_COOKIE_ONLY: 'false', NODE_ENV: 'test' }, stdio: 'ignore' });
let token; let checks = 0;
function check(a, b) { assert.deepEqual(a, b); checks++; }
async function request(endpoint, method = 'GET', body, auth = token) {
  const res = await fetch(`http://localhost:${port}/api${endpoint}`, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
}
(async () => {
  try {
    for (let i = 0; i < 100; i++) { try { if ((await request('/health')).status === 200) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    check((await request('/contabilidad?periodo=2026-11')).status, 401);
    token = (await request('/auth/login', 'POST', { usuario: 'admin', password: 'qa-local-only' })).data.token; assert.ok(token);
    check((await request('/contabilidad?periodo=2026-13')).status, 400);
    check((await request('/contabilidad?periodo=2026-11')).data, { documentos: [], origenes: [] });
    const body = { requestId: crypto.randomUUID(), fecha: '2026-11-07', operacion: 'compra', tipo: 'factura', numero: '001', nit: '123456789', tercero: 'Proveedor QA', concepto: 'Envases QA', totalCentavos: 125050, cuf: '', estado: 'pendiente', notas: '', origenTipo: '', origenId: '' };
    const saved = await request('/contabilidad/documentos', 'POST', body); check(saved.status, 201); check(saved.data.totalCentavos, 125050); check(saved.data.revision, 1);
    check((await request('/contabilidad/documentos', 'POST', body)).status, 200);
    check((await request('/contabilidad/documentos', 'POST', { ...body, totalCentavos: 50 })).status, 409);
    check((await request('/contabilidad/documentos', 'POST', { ...body, requestId: crypto.randomUUID(), cuf: 'ABC' })).status, 409);
    for (const invalid of [{ fecha: '2026-02-30' }, { nit: '' }, { numero: '' }, { totalCentavos: -1 }, { totalCentavos: 1.5 }, { totalCentavos: '50' }, { estado: 'observado' }, { estado: 'declarado' }, { origenTipo: 'venta', origenId: 'no' }, { cuf: [] }]) check((await request('/contabilidad/documentos', 'POST', { ...body, ...invalid, requestId: crypto.randomUUID() })).status, 400);
    check((await request('/contabilidad/documentos', 'POST', { ...body, numero: 'NO', origenTipo: 'egreso', origenId: 'missing', requestId: crypto.randomUUID() })).status, 409);
    const updated = await request(`/contabilidad/documentos/${saved.data.id}`, 'PUT', { ...saved.data, estado: 'revisado' }); check(updated.status, 200); check(updated.data.revision, 2);
    check((await request(`/contabilidad/documentos/${saved.data.id}`, 'PUT', saved.data)).status, 409);
    check((await request('/contabilidad?periodo=2026-10')).data.documentos.length, 0);
    const movement = await request('/finanzas/movimientos', 'POST', { tipo: 'egreso', monto: 50, concepto: 'QA egreso', fecha: '2026-11-07' }); check(movement.status, 201);
    const linked = await request('/contabilidad/documentos', 'POST', { ...body, requestId: crypto.randomUUID(), numero: '002', origenTipo: 'egreso', origenId: movement.data.id }); check(linked.status, 201);
    check((await request('/contabilidad?periodo=2026-11')).data.origenes[0].documentos, 1);
    check((await request('/finanzas/movimientos')).data.length, 1);
    const voided = await request(`/contabilidad/documentos/${linked.data.id}`, 'PUT', { ...linked.data, estado: 'anulado', notas: 'Prueba de anulacion' }); check(voided.status, 200);
    check((await request(`/contabilidad/documentos/${linked.data.id}`, 'PUT', { ...voided.data, estado: 'pendiente' })).status, 409);
    check((await request('/contabilidad?periodo=2026-11')).data.origenes[0].documentos, 0);
    const user = await request('/usuarios', 'POST', { usuario: 'vendedorqa', nombre: 'QA', password: 'QaPassword123', rol: 'supervisor_ventas' }); check(user.status, 201);
    const salesToken = (await request('/auth/login', 'POST', { usuario: 'vendedorqa', password: 'QaPassword123' })).data.token; assert.ok(salesToken);
    check((await request('/contabilidad?periodo=2026-11', 'GET', undefined, salesToken)).status, 403);
    check((await request('/contabilidad/documentos', 'POST', body, salesToken)).status, 403);
    const finance = await request('/usuarios', 'POST', { usuario: 'finanzasqa', nombre: 'QA Finanzas', password: 'QaPassword123', rol: 'finanzas' }); check(finance.status, 201);
    const financeToken = (await request('/auth/login', 'POST', { usuario: 'finanzasqa', password: 'QaPassword123' })).data.token;
    check((await request('/contabilidad?periodo=2026-11', 'GET', undefined, financeToken)).status, 200);
    const concurrent = { ...body, numero: '003', requestId: crypto.randomUUID() };
    const results = await Promise.all([request('/contabilidad/documentos', 'POST', concurrent), request('/contabilidad/documentos', 'POST', { ...concurrent, requestId: crypto.randomUUID() })]);
    check(results.map(r => r.status).sort(), [201, 409]);
    check((await request('/auditoria/integridad')).data.ok, true);
    console.log(`PASS: ${checks} comprobaciones contables: validacion, centavos, reintentos, duplicados, concurrencia, revision, anulacion, vinculos, permisos y auditoria. Base temporal.`);
  } finally { child.kill(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
