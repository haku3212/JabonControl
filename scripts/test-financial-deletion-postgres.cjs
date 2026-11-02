// Supabase checks run exclusively against temporary tables owned by this session.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('../backend/node_modules/pg');
const express = require('../backend/node_modules/express');
const env = require('../backend/node_modules/dotenv').parse(fs.readFileSync(path.resolve(__dirname, '../.env.render.local')));
assert.ok(env.DATABASE_URL.includes('hlhiaotfualdlxxcgjbs'));
const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const db = require('../backend/db');
const aliases = ['numeroNE', 'precioUnitario', 'unidadesPorCaja', 'tipoPago', 'saldoPendiente', 'montoCobrado', 'metodoPago', 'notasCorrespondientes', 'cuentaEmpresa', 'estadoEntrega', 'fechaRecojo'];
const query = async (sql, params = []) => {
  let i = 0;
  return (await client.query(sql.replace(/\?/g, () => `$${++i}`), params)).rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [aliases.find(alias => alias.toLowerCase() === key) || key, value])));
};
const executor = { all: query, get: async (sql, params) => (await query(sql, params))[0] || null, run: query, save: async () => {} };
let server;
(async () => {
  try {
    await client.connect();
    assert.equal((await client.query('SELECT current_schema() AS schema')).rows[0].schema, 'jaboncontrol');
    for (const table of ['ventas', 'cobros', 'app_records', 'audit_logs']) {
      await client.query(`CREATE TEMP TABLE ${table} (LIKE jaboncontrol.${table} INCLUDING ALL)`);
      assert.equal((await client.query(`SELECT to_regclass('${table}') = to_regclass('pg_temp.${table}') AS isolated`)).rows[0].isolated, true);
    }
    db.all = executor.all; db.get = executor.get; db.isPostgres = () => true;
    db.withTransaction = async work => {
      await client.query('BEGIN');
      try { const result = await work(executor); await client.query('COMMIT'); return result; }
      catch (error) { await client.query('ROLLBACK'); throw error; }
    };
    const app = express();
    app.use(express.json(), (req, _res, next) => { req.user = { usuario: 'qa-temporal', rol: 'admin' }; next(); });
    app.use('/ventas', require('../backend/routes/ventas'));
    app.use('/cobros', require('../backend/routes/cobros'));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const request = async (endpoint, method = 'GET', body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${endpoint}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, data: await response.json() };
    };
    const saleData = { numeroNE: 'NE-0001', cliente: 'QA solo tablas TEMP', formato: 'Barras', cantidad: 1, precioUnitario: 100.25, tipoPago: 'credito' };
    const sale = await request('/ventas', 'POST', saleData); assert.equal(sale.status, 201);
    const payment = await request('/cobros', 'POST', { cliente: saleData.cliente, montoCobrado: 20.25, metodoPago: 'efectivo' }); assert.equal(payment.status, 201);
    const motivo = { motivo: 'Registro temporal de prueba' };
    assert.equal((await request(`/ventas/${sale.data.id}`, 'DELETE', motivo)).status, 409);
    assert.equal((await request('/ventas')).data[0].saldoPendiente, 80);
    const originalAudit = db.logAudit;
    const { deleteFinancialRecord } = require('../backend/utils/financialDeletion');
    db.logAudit = async () => { throw new Error('QA fallo de auditoria'); };
    await assert.rejects(deleteFinancialRecord({ params: { id: payment.data.id }, body: motivo, user: { usuario: 'qa' } }, 'cobros'), /QA fallo/);
    db.logAudit = originalAudit;
    assert.equal((await request('/cobros')).data.length, 1);
    assert.equal((await request('/ventas')).data[0].saldoPendiente, 80);
    assert.equal((await request(`/cobros/${payment.data.id}`, 'DELETE', motivo)).status, 200);
    assert.equal((await request('/ventas')).data[0].saldoPendiente, 100.25);
    assert.equal((await request(`/ventas/${sale.data.id}`, 'DELETE', motivo)).status, 200);
    assert.equal((await request('/ventas/siguiente-numero')).data.numeroNE, 'NE-0002');
    assert.equal((await request('/ventas', 'POST', saleData)).status, 409);
    assert.equal((await client.query("SELECT count(*)::int AS total FROM pg_temp.app_records WHERE modulo IN ('ventas_anulados', 'cobros_anulados')")).rows[0].total, 2);
    console.log('PASS: PostgreSQL/Supabase: bloqueo de venta pagada, anulacion, deuda, centavos, numeracion, archivo y rollback. Solo tablas TEMP.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await client.end();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
