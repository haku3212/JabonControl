const assert = require('node:assert/strict');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
process.env.DATABASE_URL = '';
process.env.DATABASE = path.join(mkdtempSync(path.join(tmpdir(), 'jabon-storage-')), 'test.db');
process.env.ENABLE_DEMO_DATA = 'false';
process.env.ADMIN_PASSWORD = 'qa-local-only';
const db = require('../backend/db');
(async () => {
  await db();
  await assert.rejects(db.withTransaction(async executor => {
    await executor.run('INSERT INTO app_records (modulo, id, payload) VALUES (?, ?, ?)', ['contactos', 'rollback', '{}']);
    await db.logAudit({ user: { usuario: 'qa' } }, 'crear', 'contactos', 'rollback', null, {}, 'Rollback QA', executor);
    throw new Error('Intentional failure');
  }), /Intentional failure/);
  assert.equal(await db.get('SELECT id FROM app_records WHERE id = ?', ['rollback']), null);
  assert.equal(await db.get('SELECT id FROM audit_logs WHERE registro_id = ?', ['rollback']), null);
  await db.withTransaction(async executor => {
    await executor.run('INSERT INTO app_records (modulo, id, payload) VALUES (?, ?, ?)', ['contactos', 'commit', '{}']);
    await db.logAudit({ user: { usuario: 'qa' } }, 'crear', 'contactos', 'commit', null, {}, 'Commit QA', executor);
  });
  assert.ok(await db.get('SELECT id FROM app_records WHERE id = ?', ['commit']));
  assert.ok(await db.get('SELECT id FROM audit_logs WHERE registro_id = ?', ['commit']));
  console.log('PASS: Contacto y auditoria se confirman o revierten juntos (base temporal).');
})().catch(error => { console.error(error); process.exitCode = 1; });
