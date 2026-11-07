// All writes use session-private TEMP tables, never operational records.
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
const query = async (sql, params = []) => {
  let index = 0;
  return (await client.query(sql.replace(/\?/g, () => `$${++index}`), params)).rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key === 'metodopago' ? 'metodoPago' : key, value])));
};
const executor = { all: query, get: async (sql, params) => (await query(sql, params))[0] || null, run: query, save: async () => {} };
(async () => {
  try {
    await client.connect();
    assert.equal((await client.query('SELECT current_schema() AS schema')).rows[0].schema, 'jaboncontrol');
    for (const table of ['movimientos_financieros', 'audit_logs']) {
      await client.query(`CREATE TEMP TABLE ${table} (LIKE jaboncontrol.${table} INCLUDING ALL)`);
      assert.equal((await client.query(`SELECT to_regclass('${table}') = to_regclass('pg_temp.${table}') AS isolated`)).rows[0].isolated, true);
    }
    db.all = executor.all; db.get = executor.get;
    db.withTransaction = async work => {
      await client.query('BEGIN');
      try { const result = await work(executor); await client.query('COMMIT'); return result; }
      catch (error) { await client.query('ROLLBACK'); throw error; }
    };
    const app = express(); app.use(express.json());
    app.use('/finanzas', (req, _res, next) => { req.user = { usuario: 'qa-temporal', rol: 'admin' }; next(); }, require('../backend/routes/finanzas'));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const request = async (endpoint = '/movimientos', method = 'GET', body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/finanzas${endpoint}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, data: await response.json() };
    };
    const data = { fecha: '2026-11-07', tipo: 'egreso', categoria: 'Empaque', concepto: 'QA solo tabla TEMP', tercero: 'Proveedor QA', monto: 1250.5, metodoPago: 'transferencia', origen: 'compras-gastos', referencia: 'QA-001', requestId: crypto.randomUUID() };
    const created = await request('/movimientos', 'POST', data); assert.equal(created.status, 201);
    assert.equal((await request('/movimientos', 'POST', data)).status, 200);
    assert.equal((await request()).data.length, 1);
    assert.equal((await request()).data[0].metodoPago, 'transferencia');
    assert.equal((await request('/movimientos', 'POST', { ...data, monto: 200 })).status, 409);
    assert.equal((await request(`/movimientos/${created.data.id}`, 'PUT', { ...data, monto: 250.25 })).status, 200);
    await client.query("ALTER TABLE pg_temp.audit_logs ADD CONSTRAINT qa_audit_fail CHECK (accion <> 'actualizar') NOT VALID");
    assert.equal((await request(`/movimientos/${created.data.id}`, 'PUT', { ...data, monto: 300 })).status, 500);
    assert.equal((await request()).data[0].monto, 250.25);
    await client.query('ALTER TABLE pg_temp.audit_logs DROP CONSTRAINT qa_audit_fail');
    assert.equal((await request(`/movimientos/${created.data.id}`, 'DELETE')).status, 200);
    assert.equal((await request()).data.length, 0);
    assert.equal((await client.query('SELECT count(*)::int AS total FROM pg_temp.audit_logs')).rows[0].total, 3);
    console.log('PASS: Supabase/PostgreSQL: alta, edicion, reintento sin duplicados, centavos, auditoria y rollback. Solo tablas TEMP.');
  } finally { if (server) await new Promise(resolve => server.close(resolve)); await client.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
