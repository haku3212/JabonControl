const express = require('express');
const db = require('../db');
const { requireRoles } = require('./auth');
const router = express.Router();
const moduleName = 'contabilidad_documentos';
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const parse = row => ({ ...JSON.parse(row.payload), id: row.id });
const handle = fn => async (req, res) => {
  try { await fn(req, res); } catch (error) {
    console.error('Contabilidad:', error.message);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo completar la operacion contable. Intente nuevamente.' });
  }
};
router.use(requireRoles('admin', 'finanzas'));
function text(body, key, max = 160) {
  if (typeof body[key] !== 'string' || body[key].length > max) throw fail(`${key}: texto invalido (maximo ${max}).`);
  return body[key].trim();
}
function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Formulario invalido.');
  const data = {};
  for (const key of ['fecha', 'operacion', 'tipo', 'numero', 'nit', 'tercero', 'concepto', 'estado', 'origenTipo', 'origenId']) data[key] = text(body, key);
  data.cuf = text(body, 'cuf', 200).toUpperCase();
  data.notas = text(body, 'notas', 2000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha) || !Number.isFinite(Date.parse(data.fecha)) || new Date(data.fecha).toISOString().slice(0, 10) !== data.fecha || data.fecha < '2000-01-01' || data.fecha > '2100-12-31') throw fail('Ingrese una fecha real entre 2000 y 2100.');
  if (!['compra', 'venta'].includes(data.operacion) || !['factura', 'recibo', 'otro'].includes(data.tipo)) throw fail('Seleccione una operacion y un documento validos.');
  if (!['pendiente', 'observado', 'revisado', 'anulado'].includes(data.estado)) throw fail('Estado de revision invalido.');
  if (!data.numero || !data.tercero || !data.concepto) throw fail('Complete numero, tercero y concepto.');
  if (data.nit && !/^\d{5,20}$/.test(data.nit)) throw fail('El NIT debe contener entre 5 y 20 digitos.');
  if (data.tipo === 'factura' && !data.nit) throw fail('Ingrese el NIT del emisor o receptor de la factura.');
  if (['observado', 'anulado'].includes(data.estado) && !data.notas) throw fail('Explique la observacion o anulacion.');
  if (!Number.isSafeInteger(body.totalCentavos) || body.totalCentavos < 1 || body.totalCentavos > 99999999999) throw fail('Importe invalido: utilice hasta dos decimales.');
  data.totalCentavos = body.totalCentavos;
  if (!['', 'venta', 'egreso'].includes(data.origenTipo) || Boolean(data.origenTipo) !== Boolean(data.origenId)) throw fail('Vinculo de origen invalido.');
  if (data.origenTipo && data.origenTipo !== (data.operacion === 'venta' ? 'venta' : 'egreso')) throw fail('El origen no corresponde a la operacion.');
  return data;
}
function fingerprint(data) {
  const party = data.operacion === 'venta' ? 'empresa' : data.nit || data.tercero.toLowerCase().replace(/\s+/g, ' ');
  return [data.operacion, data.tipo, party, data.numero.toUpperCase()].join('|');
}
router.get('/', handle(async (req, res) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.periodo || '')) throw fail('Seleccione un periodo valido.');
  const allDocs = (await db.all('SELECT id, payload FROM app_records WHERE modulo = ?', [moduleName])).map(parse);
  const docs = allDocs.filter(d => d.fecha.slice(0, 7) === req.query.periodo).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero, 'es', { numeric: true }));
  const sales = await db.all('SELECT id, fecha, numeroNE, cliente, total FROM ventas WHERE fecha LIKE ? ORDER BY fecha DESC', [`${req.query.periodo}-%`]);
  const expenses = await db.all("SELECT id, fecha, concepto, tercero, referencia, monto FROM movimientos_financieros WHERE tipo = 'egreso' AND fecha LIKE ? ORDER BY fecha DESC", [`${req.query.periodo}-%`]);
  const sources = [
    ...sales.map(s => ({ id: s.id, tipo: 'venta', fecha: s.fecha, referencia: s.numeroNE, tercero: s.cliente, concepto: `Venta ${s.numeroNE}`, totalCentavos: Math.round(Number(s.total) * 100) })),
    ...expenses.map(e => ({ id: e.id, tipo: 'egreso', fecha: e.fecha, referencia: e.referencia || e.concepto, tercero: e.tercero, concepto: e.concepto, totalCentavos: Math.round(Number(e.monto) * 100) })),
  ].map(s => ({ ...s, documentos: allDocs.filter(d => d.estado !== 'anulado' && d.origenTipo === s.tipo && d.origenId === s.id).length }));
  res.json({ documentos: docs, origenes: sources });
}));
async function persist(req, res, editing) {
  const data = validate(req.body);
  const id = editing ? req.params.id : req.body.requestId;
  if (typeof id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) throw fail('Identificador invalido.');
  const result = await db.withTransaction(async tx => {
    // Serialize duplicate checks across workers without changing the existing schema.
    if (db.isPostgres()) await tx.run('LOCK TABLE app_records IN SHARE ROW EXCLUSIVE MODE');
    const rows = await tx.all('SELECT id, payload FROM app_records WHERE modulo = ?', [moduleName]);
    const previous = rows.find(r => r.id === id);
    const before = previous ? parse(previous) : null;
    if (editing && !before) throw fail('Documento no encontrado.', 404);
    if (!editing && before) {
      if (!Object.keys(data).every(key => before[key] === data[key])) throw fail('La solicitud ya fue guardada con otros datos.', 409);
      return { data: before, status: 200 };
    }
    if (editing && req.body.revision !== before.revision) throw fail('Otro usuario modifico el documento. Actualice antes de guardar.', 409);
    if (before?.estado === 'anulado') throw fail('Un registro anulado no se modifica. Registre un nuevo documento.', 409);
    if (data.estado !== 'anulado' && rows.map(parse).some(d => d.id !== id && d.estado !== 'anulado' && (fingerprint(d) === fingerprint(data) || (data.cuf && d.cuf === data.cuf)))) throw fail('Este documento ya esta registrado. Revise el numero, NIT o CUF.', 409);
    if (data.origenTipo) {
      const source = data.origenTipo === 'venta' ? await tx.get('SELECT id FROM ventas WHERE id = ?', [data.origenId]) : await tx.get("SELECT id FROM movimientos_financieros WHERE id = ? AND tipo = 'egreso'", [data.origenId]);
      if (!source) throw fail('La operacion de origen ya no existe. Actualice el formulario.', 409);
    }
    const saved = { ...data, id, revision: (before?.revision || 0) + 1, actualizadoPor: req.user.usuario, actualizadoEn: new Date().toISOString() };
    if (editing) await tx.run('UPDATE app_records SET payload = ?, actualizado_en = CURRENT_TIMESTAMP WHERE modulo = ? AND id = ?', [JSON.stringify(saved), moduleName, id]);
    else await tx.run('INSERT INTO app_records (modulo, id, payload) VALUES (?, ?, ?)', [moduleName, id, JSON.stringify(saved)]);
    await db.logAudit(req, editing ? 'actualizar' : 'crear', moduleName, id, before, saved, 'Revision documental contable; no genera movimientos ni declaraciones', tx);
    return { data: saved, status: editing ? 200 : 201 };
  });
  res.status(result.status).json(result.data);
}
router.post('/documentos', handle((req, res) => persist(req, res, false)));
router.put('/documentos/:id', handle((req, res) => persist(req, res, true)));
module.exports = router;
