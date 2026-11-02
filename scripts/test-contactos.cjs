const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const database = path.join(mkdtempSync(path.join(tmpdir(), 'jabon-contactos-')), 'test.db');
const port = 5099;
const child = spawn(process.execPath, ['server.js'], {
  cwd: path.resolve(__dirname, '../backend'),
  env: { ...process.env, PORT: String(port), DATABASE: database, DATABASE_URL: '', ENABLE_DEMO_DATA: 'false', ADMIN_PASSWORD: 'qa-local-only', AUTH_COOKIE_ONLY: 'false', NODE_ENV: 'test' },
  stdio: 'ignore',
});
let token;
let checks = 0;
async function request(endpoint, method = 'GET', body, auth = token) {
  const response = await fetch(`http://localhost:${port}/api${endpoint}`, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
function check(actual, expected) { assert.deepEqual(actual, expected); checks++; }
(async () => {
  try {
    for (let i = 0; i < 100; i++) { try { if ((await request('/health')).status === 200) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
    check((await request('/contactos', 'GET', undefined, '')).status, 401);
    token = (await request('/auth/login', 'POST', { usuario: 'admin', password: 'qa-local-only' })).data.token;
    assert.ok(token);
    check((await request('/contactos')).data, []);
    check((await request('/contactos/categorias')).data.includes('Transporte'), true);
    check((await request('/contactos/categorias', 'POST', { nombre: ' Transportistas Beni ' })).status, 201);
    check((await request('/contactos/categorias', 'POST', { nombre: 'TRANSPORTISTAS BENI' })).status, 409);
    const data = { nombre: '  Transporte QA  ', tipo: 'empresa', categorias: ['Transporte', 'Transportistas Beni'], telefono: '+591 72123456', email: 'QA@EXAMPLE.COM', placa: 'abc123', notas: 'Observacion de prueba' };
    for (const invalid of [{ nombre: ' ' }, { tipo: 'invalido' }, { categorias: [] }, { categorias: ['No existe'] }, { categorias: [1] }, { telefono: 'abc' }, { telefono: '123' }, { email: 'bad' }, { nombre: 'x'.repeat(161) }]) check((await request('/contactos', 'POST', { ...data, ...invalid })).status, 400);
    const created = await request('/contactos', 'POST', data);
    check(created.status, 201);
    check(created.data.nombre, 'Transporte QA'); check(created.data.email, 'qa@example.com'); check(created.data.placa, 'ABC123'); check(created.data.revision, 1);
    check((await request('/contactos', 'POST', data)).status, 409);
    check((await request('/contactos', 'POST', { ...data, email: '', telefono: '72123456' })).status, 409);
    const shared = await request('/contactos', 'POST', { ...data, nombre: 'Contacto comparte telefono', confirmarDuplicado: true });
    check(shared.status, 201);
    const id = created.data.id;
    const updated = await request(`/contactos/${id}`, 'PUT', { ...created.data, nombre: 'QA Editado', confirmarDuplicado: true });
    check(updated.status, 200); check(updated.data.revision, 2);
    check((await request(`/contactos/${id}`, 'PUT', created.data)).status, 409);
    const raceBody = { ...updated.data, confirmarDuplicado: true };
    const races = await Promise.all([request(`/contactos/${id}`, 'PUT', { ...raceBody, nombre: 'Editor 1' }), request(`/contactos/${id}`, 'PUT', { ...raceBody, nombre: 'Editor 2' })]);
    check(races.map(value => value.status).sort(), [200, 409]);
    const latest = races.find(value => value.status === 200).data;
    const archived = await request(`/contactos/${id}/estado`, 'PUT', { estado: 'inactivo', revision: latest.revision });
    check(archived.status, 200); check(archived.data.estado, 'inactivo'); check(archived.data.notas, data.notas);
    check((await request(`/contactos/${id}/estado`, 'PUT', { estado: 'activo', revision: archived.data.revision })).status, 200);
    check((await request(`/contactos/${id}/estado`, 'PUT', { estado: 'borrado', revision: archived.data.revision + 1 })).status, 400);
    check((await request(`/contactos/${id}`, 'DELETE')).status, 405);
    check((await request('/contactos/no-existe', 'PUT', data)).status, 404);
    for (const role of ['supervisor', 'supervisor_ventas', 'finanzas', 'operario']) {
      check((await request('/usuarios', 'POST', { nombre: role, usuario: role, password: 'QaPassword123', rol: role })).status, 201);
      const roleToken = (await request('/auth/login', 'POST', { usuario: role, password: 'QaPassword123' })).data.token;
      assert.ok(roleToken);
      const allowed = role === 'operario' ? 403 : 200;
      check((await request('/contactos', 'GET', undefined, roleToken)).status, allowed);
      check((await request('/contactos/categorias', 'POST', { nombre: 'No autorizado' }, roleToken)).status, 403);
      check((await request('/contactos', 'POST', { nombre: role, tipo: 'persona', categorias: ['Otros'] }, roleToken)).status, role === 'operario' ? 403 : 201);
    }
    const audit = (await request('/auditoria')).data;
    check(audit.some(item => item.tabla === 'contactos'), true);
    console.log(`PASS: ${checks} comprobaciones de contactos, categorias, permisos y edicion concurrente. Base temporal: ${database}`);
  } finally { child.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
