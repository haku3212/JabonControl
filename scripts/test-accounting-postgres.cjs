// Writes are confined to connection-private TEMP tables; no initialization/migration.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('../backend/node_modules/pg');
const express = require('../backend/node_modules/express');
const env = require('../backend/node_modules/dotenv').parse(fs.readFileSync(path.resolve(__dirname, '../.env.render.local')));
assert.ok(env.DATABASE_URL.includes('hlhiaotfualdlxxcgjbs'));
const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const db = require('../backend/db');
let server;
const query = async (sql, params = []) => { let i = 0; return (await client.query(sql.replace(/\?/g, () => `$${++i}`), params)).rows; };
const executor = { all: query, get: async (sql, params) => (await query(sql, params))[0] || null, run: query, save: async () => {} };
(async () => {
  try {
    await client.connect();
    assert.equal((await client.query('SELECT current_schema() AS schema')).rows[0].schema, 'jaboncontrol');
    for (const table of ['app_records', 'audit_logs', 'ventas', 'movimientos_financieros']) {
      await client.query(`CREATE TEMP TABLE ${table} (LIKE jaboncontrol.${table} INCLUDING ALL)`);
      assert.equal((await client.query(`SELECT to_regclass('${table}') = to_regclass('pg_temp.${table}') AS isolated`)).rows[0].isolated, true);
    }
    db.all = executor.all; db.get = executor.get; db.isPostgres = () => true;
    db.withTransaction = async work => { await client.query('BEGIN'); try { const data = await work(executor); await client.query('COMMIT'); return data; } catch (e) { await client.query('ROLLBACK'); throw e; } };
    const app = express(); app.use(express.json());
    app.use('/contabilidad', (req, _res, next) => { req.user = { usuario: 'qa-temporal', rol: 'admin' }; next(); }, require('../backend/routes/contabilidad'));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const request = async (endpoint, method = 'GET', body) => {
      const res = await fetch(`http://127.0.0.1:${server.address().port}/contabilidad${endpoint}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: res.status, data: await res.json() };
    };
    const data = { requestId: crypto.randomUUID(), fecha: '2026-11-07', operacion: 'compra', tipo: 'factura', numero: 'TEMP-001', nit: '123456789', tercero: 'Proveedor QA', concepto: 'Solo TEMP', totalCentavos: 125025, cuf: '', estado: 'pendiente', notas: '', origenTipo: '', origenId: '' };
    const saved = await request('/documentos', 'POST', data); assert.equal(saved.status, 201);
    assert.equal((await request('/documentos', 'POST', data)).status, 200);
    assert.equal((await request('/documentos', 'POST', { ...data, requestId: crypto.randomUUID() })).status, 409);
    const updated = await request(`/documentos/${saved.data.id}`, 'PUT', { ...saved.data, estado: 'revisado' }); assert.equal(updated.status, 200);
    assert.equal((await request(`/documentos/${saved.data.id}`, 'PUT', saved.data)).status, 409);
    await client.query("ALTER TABLE pg_temp.audit_logs ADD CONSTRAINT qa_accounting_audit_fail CHECK (accion <> 'actualizar') NOT VALID");
    assert.equal((await request(`/documentos/${saved.data.id}`, 'PUT', { ...updated.data, totalCentavos: 100 })).status, 500);
    assert.equal((await request('?periodo=2026-11')).data.documentos[0].totalCentavos, 125025);
    assert.equal((await client.query('SELECT count(*)::int AS total FROM pg_temp.audit_logs')).rows[0].total, 2);
    console.log('PASS: Supabase/PostgreSQL: alta, centavos, idempotencia, duplicados, revision, auditoria y rollback. Solo tablas TEMP.');
  } finally { if (server) await new Promise(resolve => server.close(resolve)); await client.end(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
