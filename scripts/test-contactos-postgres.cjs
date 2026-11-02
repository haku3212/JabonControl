// Tests the real Supabase SQL dialect using session-private temporary tables only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('../backend/node_modules/pg');
const express = require('../backend/node_modules/express');
const env = require('../backend/node_modules/dotenv').parse(fs.readFileSync(path.resolve(__dirname, '../.env.render.local')));
assert.ok(env.DATABASE_URL.includes('hlhiaotfualdlxxcgjbs'), 'Debe ser el proyecto JabonControl Pruebas');
const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const db = require('../backend/db');
let server;
const query = async (sql, params = []) => {
  let index = 0;
  return (await client.query(sql.replace(/\?/g, () => `$${++index}`), params)).rows;
};
const executor = { all: query, get: async (sql, params) => (await query(sql, params))[0] || null, run: query, save: async () => {} };
(async () => {
  try {
    await client.connect();
    assert.equal((await client.query('SELECT current_schema() AS schema')).rows[0].schema, 'jaboncontrol');
    await client.query('CREATE TEMP TABLE app_records (LIKE jaboncontrol.app_records INCLUDING ALL)');
    await client.query('CREATE TEMP TABLE audit_logs (LIKE jaboncontrol.audit_logs INCLUDING ALL)');
    assert.equal((await client.query("SELECT to_regclass('app_records') = to_regclass('pg_temp.app_records') AND to_regclass('audit_logs') = to_regclass('pg_temp.audit_logs') AS isolated")).rows[0].isolated, true);
    db.all = executor.all; db.get = executor.get;
    db.withTransaction = async work => {
      await client.query('BEGIN');
      try { const result = await work(executor); await client.query('COMMIT'); return result; }
      catch (error) { await client.query('ROLLBACK'); throw error; }
    };
    const app = express();
    app.use(express.json());
    app.use('/contactos', (req, _res, next) => { req.user = { usuario: 'qa-temporal', rol: 'admin' }; next(); }, require('../backend/routes/contactos'));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const request = async (endpoint = '', method = 'GET', body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/contactos${endpoint}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, data: await response.json() };
    };
    assert.equal((await request('/categorias', 'POST', { nombre: 'QA temporal' })).status, 201);
    const created = await request('', 'POST', { nombre: 'QA solo tabla temporal', tipo: 'empresa', categorias: ['Transporte', 'QA temporal'], telefono: '72123456' });
    assert.equal(created.status, 201);
    assert.equal((await request()).data[0].nombre, created.data.nombre);
    const updated = await request(`/${created.data.id}`, 'PUT', { ...created.data, nombre: 'QA editado' });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.revision, 2);
    assert.equal((await request(`/${created.data.id}`, 'PUT', created.data)).status, 409);
    assert.equal((await request(`/${created.data.id}/estado`, 'PUT', { estado: 'inactivo', revision: 2 })).status, 200);
    assert.equal((await client.query('SELECT count(*)::int AS count FROM pg_temp.audit_logs')).rows[0].count, 4);
    await assert.rejects(db.withTransaction(async transaction => {
      await transaction.run('INSERT INTO app_records (modulo, id, payload) VALUES (?, ?, ?)', ['contactos', 'rollback', '{}']);
      await db.logAudit({ user: { usuario: 'qa' } }, 'crear', 'contactos', 'rollback', null, {}, 'Rollback QA', transaction);
      throw new Error('Rollback QA');
    }), /Rollback QA/);
    assert.equal(await executor.get('SELECT id FROM app_records WHERE id = ?', ['rollback']), null);
    assert.equal(await executor.get('SELECT id FROM audit_logs WHERE registro_id = ?', ['rollback']), null);
    console.log('PASS: API Contactos en PostgreSQL/Supabase: categorias, alta, consulta, edicion, archivo, auditoria y rollback. Solo tablas TEMP; datos operativos intactos.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await client.end();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
