const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAdmin } = require('./auth');

const router = express.Router();
const defaults = ['Transporte', 'Proveedores', 'Servicios tecnicos', 'Insumos', 'Otros'];
const fold = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const digits = (value) => String(value || '').replace(/\D/g, '');
const phoneKey = (value) => { const number = digits(value); return number.length === 8 ? `591${number}` : number; };
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const parse = (row) => ({ ...JSON.parse(row.payload), id: row.id });
const normalize = (item) => ({ ...item, tipo: item.tipo || 'empresa', categorias: item.categorias || (item.categoria ? [item.categoria] : []), revision: item.revision || 0 });
async function records(module = 'contactos') {
  return (await db.all('SELECT id, payload FROM app_records WHERE modulo = ?', [module])).map(parse);
}
async function categories() {
  return [...new Set([...defaults, ...(await records('contacto_categorias')).map(item => item.nombre), ...(await records()).flatMap(item => normalize(item).categorias)])].sort((a, b) => a.localeCompare(b, 'es'));
}
function text(body, key, max = 160) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Formulario invalido.');
  if (body[key] === undefined || body[key] === null) return '';
  if (typeof body[key] !== 'string' || body[key].length > max) throw fail(`${key}: texto invalido o demasiado largo (maximo ${max}).`);
  return body[key].trim();
}
async function validate(body, previous) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Formulario invalido.');
  const data = {};
  for (const key of ['nombre', 'empresa', 'proveedorDe', 'ubicacion', 'personaContacto', 'cobertura', 'vehiculo']) data[key] = text(body, key);
  for (const key of ['telefono', 'telefonoAlternativo', 'whatsapp']) {
    data[key] = text(body, key, 30);
    if (data[key] && (!/^\+?[\d\s().-]+$/.test(data[key]) || digits(data[key]).length < 7 || digits(data[key]).length > 15)) throw fail(`${key}: ingrese entre 7 y 15 digitos.`);
  }
  data.email = text(body, 'email', 254).toLowerCase();
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw fail('Ingrese un correo valido.');
  data.direccion = text(body, 'direccion', 400);
  data.notas = text(body, 'notas', 3000);
  data.placa = text(body, 'placa', 30).toUpperCase();
  if (!data.nombre) throw fail('El nombre es obligatorio.');
  if (!['persona', 'empresa'].includes(body.tipo)) throw fail('Seleccione persona o empresa.');
  data.tipo = body.tipo;
  if (!Array.isArray(body.categorias) || body.categorias.length < 1 || body.categorias.length > 10 || body.categorias.some(item => typeof item !== 'string')) throw fail('Seleccione entre una y diez categorias.');
  data.categorias = [...new Set(body.categorias)];
  const available = await categories();
  if (data.categorias.some(item => !available.includes(item))) throw fail('Una categoria ya no existe. Actualice la agenda.');
  data.categoria = data.categorias[0];
  data.estado = previous?.estado || 'activo';
  data.fechaRegistro = previous?.fechaRegistro || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  data.revision = (previous?.revision || 0) + 1;
  return data;
}
async function persist(req, data, previousRow) {
  await db.withTransaction(async executor => {
    if (previousRow) {
      // Compare the original payload atomically: two editors cannot silently overwrite each other.
      const changed = await executor.all('UPDATE app_records SET payload = ?, actualizado_en = CURRENT_TIMESTAMP WHERE modulo = ? AND id = ? AND payload = ? RETURNING id', [JSON.stringify(data), 'contactos', data.id, previousRow.payload]);
      if (!changed.length) throw fail('Otro usuario modifico este contacto. Actualice antes de guardar.', 409);
    } else {
      await executor.run('INSERT INTO app_records (modulo, id, payload) VALUES (?, ?, ?)', ['contactos', data.id, JSON.stringify(data)]);
    }
    await db.logAudit(req, previousRow ? 'actualizar' : 'crear', 'contactos', data.id, previousRow ? parse(previousRow) : null, data, 'Agenda de contactos', executor);
  });
}
const handle = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (error) {
    console.error('Contactos:', error.message);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo guardar o consultar la agenda. Intente nuevamente.' });
  }
};
router.get('/categorias', handle(async (_req, res) => res.json(await categories())));
router.post('/categorias', requireAdmin, handle(async (req, res) => {
  const nombre = text(req.body, 'nombre', 60);
  if (!nombre) throw fail('Ingrese el nombre de la categoria.');
  if ((await categories()).some(item => fold(item) === fold(nombre))) throw fail('La categoria ya existe.', 409);
  const id = crypto.createHash('sha256').update(fold(nombre)).digest('hex');
  try { await db.withTransaction(async executor => {
    await executor.run('INSERT INTO app_records (modulo, id, payload) VALUES (?, ?, ?)', ['contacto_categorias', id, JSON.stringify({ nombre })]);
    await db.logAudit(req, 'crear', 'contacto_categorias', id, null, { nombre }, 'Categoria de contactos', executor);
  }); }
  catch (error) { if (/UNIQUE|duplicate key/i.test(error.message)) throw fail('La categoria ya existe.', 409); throw error; }
  res.status(201).json({ nombre });
}));
router.get('/', handle(async (_req, res) => res.json((await records()).map(normalize).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))));
router.post('/', handle(async (req, res) => {
  const data = { ...await validate(req.body), id: crypto.randomUUID() };
  await checkDuplicates(req.body, data);
  await persist(req, data);
  res.status(201).json(data);
}));
async function find(id) {
  const row = await db.get('SELECT id, payload FROM app_records WHERE modulo = ? AND id = ?', ['contactos', id]);
  if (!row) throw fail('Contacto no encontrado.', 404);
  return row;
}
function checkRevision(body, previous) {
  if (body.revision !== (previous.revision || 0)) throw fail('El contacto cambio desde que lo abrio. Actualice la agenda antes de guardar.', 409);
}
async function checkDuplicates(body, data) {
  const phones = [data.telefono, data.telefonoAlternativo, data.whatsapp].map(phoneKey).filter(Boolean);
  const matches = (await records()).filter(item => item.id !== data.id && (
    (data.email && data.email === String(item.email || '').toLowerCase()) ||
    [item.telefono, item.telefonoAlternativo, item.whatsapp].some(value => phoneKey(value) && phones.includes(phoneKey(value)))
  ));
  if (matches.length && body.confirmarDuplicado !== true) throw fail(`Posible duplicado: ${matches.slice(0, 3).map(item => item.nombre).join(', ')}. Confirme que comparten el telefono o correo.`, 409);
}
router.put('/:id/estado', handle(async (req, res) => {
  const row = await find(req.params.id);
  const previous = normalize(parse(row));
  checkRevision(req.body, previous);
  if (!['activo', 'inactivo'].includes(req.body.estado)) throw fail('Estado invalido.');
  const data = { ...previous, estado: req.body.estado, revision: previous.revision + 1 };
  await persist(req, data, row);
  res.json(data);
}));
router.put('/:id', handle(async (req, res) => {
  const row = await find(req.params.id);
  const previous = normalize(parse(row));
  checkRevision(req.body, previous);
  const data = { ...await validate(req.body, previous), id: req.params.id };
  await checkDuplicates(req.body, data);
  await persist(req, data, row);
  res.json(data);
}));
router.delete('/:id', (_req, res) => res.status(405).json({ error: 'Los contactos se archivan, no se eliminan.' }));
module.exports = router;
