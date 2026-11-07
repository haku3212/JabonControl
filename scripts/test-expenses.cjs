const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('../jaboncontrol/node_modules/typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(readFileSync(path.resolve(__dirname, '../jaboncontrol/src/utils/expenses.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject, crypto, Intl, Date });
let checks = 0;
function check(actual, expected) { assert.deepEqual(actual, expected); checks++; }
for (const [text, amount] of [['1.250,50', 1250.5], ['1250.50', 1250.5], ['0,01', 0.01], ['10', 10], ['1.234', 1234], ['-1', null], ['0', null], ['', null], ['NaN', null], ['1e3', null], ['10,123', null], ['1,250.50', null], ['1.00.5', null]]) check(exportsObject.parseExpenseAmount(text), amount);
assert.notEqual(exportsObject.newExpense().requestId, exportsObject.newExpense().requestId); checks++;
const database = path.join(mkdtempSync(path.join(tmpdir(), 'jabon-expenses-')), 'test.db');
const port = 5104;
const child = spawn(process.execPath, ['server.js'], { cwd: path.resolve(__dirname, '../backend'), env: { ...process.env, PORT: String(port), DATABASE: database, DATABASE_URL: '', ENABLE_DEMO_DATA: 'false', ADMIN_PASSWORD: 'qa-local-only', AUTH_COOKIE_ONLY: 'false', NODE_ENV: 'test' }, stdio: 'ignore' });
let token;
async function request(endpoint, method = 'GET', body, auth = token) {
  const response = await fetch(`http://localhost:${port}/api${endpoint}`, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
(async () => {
  try {
    for (let i = 0; i < 100; i++) { try { if ((await request('/health')).status === 200) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
    check((await request('/finanzas/movimientos')).status, 401);
    token = (await request('/auth/login', 'POST', { usuario: 'admin', password: 'qa-local-only' })).data.token; assert.ok(token);
    const data = { tipo: 'egreso', fecha: '2026-11-07', concepto: '  Compra de envases  ', tercero: 'Proveedor QA', monto: 1250.5, categoria: 'Empaque', metodoPago: 'transferencia', referencia: 'QA-0001', notas: 'Solo pruebas', origen: 'compras-gastos', requestId: crypto.randomUUID() };
    const saved = await request('/finanzas/movimientos', 'POST', data); check(saved.status, 201); check(saved.data.monto, 1250.5); check(saved.data.concepto, 'Compra de envases');
    check((await request('/finanzas/movimientos', 'POST', data)).status, 200);
    check((await request('/finanzas/movimientos')).data.length, 1);
    check((await request('/finanzas/movimientos', 'POST', { ...data, monto: 100 })).status, 409);
    for (const invalid of [{ fecha: '2026-02-30' }, { fecha: '' }, { monto: -1 }, { monto: 0 }, { monto: 'NaN' }, { monto: 10.123 }, { concepto: ' ' }, { tercero: '' }, { categoria: '' }, { metodoPago: 'desconocido' }, { referencia: 'x'.repeat(121) }]) check((await request('/finanzas/movimientos', 'POST', { ...data, ...invalid, requestId: crypto.randomUUID() })).status, 400);
    const updated = await request(`/finanzas/movimientos/${saved.data.id}`, 'PUT', { ...data, concepto: 'Envases corregidos', monto: 250.25 });
    check(updated.status, 200); check(updated.data.monto, 250.25);
    check((await request(`/finanzas/movimientos/${saved.data.id}`, 'PUT', { ...data, fecha: '2026-02-30' })).status, 400);
    check((await request('/finanzas/movimientos')).data[0].monto, 250.25);
    check((await request('/finanzas/movimientos/no-existe', 'PUT', data)).status, 404);
    const income = await request('/finanzas/movimientos', 'POST', { tipo: 'ingreso', monto: 50, concepto: 'QA ingreso' }); check(income.status, 201);
    check((await request(`/finanzas/movimientos/${income.data.id}`, 'PUT', data)).status, 409);
    const concurrent = { ...data, requestId: crypto.randomUUID() };
    const responses = await Promise.all([request('/finanzas/movimientos', 'POST', concurrent), request('/finanzas/movimientos', 'POST', concurrent)]);
    check(responses.map(item => item.status).sort(), [200, 201]);
    check((await request('/finanzas/movimientos')).data.length, 3);
    check((await request(`/finanzas/movimientos/${saved.data.id}`, 'DELETE')).status, 200);
    check((await request(`/finanzas/movimientos/${saved.data.id}`, 'DELETE')).status, 404);
    check((await request('/auditoria/integridad')).data.ok, true);
    console.log(`PASS: ${checks} comprobaciones de importes, fechas, alta, edicion, idempotencia y auditoria. Base temporal.`);
  } finally { child.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
