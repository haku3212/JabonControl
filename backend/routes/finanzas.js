const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { validateMovement } = require('../utils/movementValidation');

function normalizeMovement(body) {
  const monto = Number(body.monto || body.importe || body.total || 0);
  return {
    fecha: body.fecha || new Date().toISOString().split('T')[0],
    tipo: body.tipo === 'egreso' ? 'egreso' : 'ingreso',
    categoria: body.categoria || 'Sin clasificar',
    concepto: body.concepto || body.descripcion || body.detalle || 'Movimiento importado',
    tercero: body.tercero || body.cliente || body.proveedor || '',
    metodoPago: body.metodoPago || body.metodo_pago || body.metodo || '',
    referencia: body.referencia || body.numero || body.documento || '',
    monto: Number.isFinite(monto) ? Math.abs(monto) : 0,
    origen: body.origen || 'manual',
    notas: body.notas || '',
  };
}

router.get('/movimientos', async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT * FROM movimientos_financieros ORDER BY fecha DESC, creado_en DESC');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/movimientos', async (req, res) => {
  try {
    const data = validateMovement(req.body);
    if (req.body.requestId !== undefined && (typeof req.body.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(req.body.requestId))) return res.status(400).json({ error: 'Identificador de solicitud invalido.' });
    const id = req.body.requestId || uuid();
    const result = await dbModule.withTransaction(async executor => {
      // Keep a retried form submission from creating a second financial movement.
      const inserted = await executor.all(
        `INSERT INTO movimientos_financieros
         (id, fecha, tipo, categoria, concepto, tercero, metodoPago, referencia, monto, origen, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING RETURNING id`,
        [id, data.fecha, data.tipo, data.categoria, data.concepto, data.tercero, data.metodoPago, data.referencia, data.monto, data.origen, data.notas]
      );
      if (!inserted.length) {
        const existing = await executor.get('SELECT * FROM movimientos_financieros WHERE id = ?', [id]);
        const same = existing && Object.entries(data).every(([key, value]) => key === 'monto' ? Math.round(Number(existing[key]) * 100) === Math.round(Number(value) * 100) : (existing[key] || '') === value);
        if (!same) throw Object.assign(new Error('La solicitud ya fue guardada con otros datos. Actualice el historial antes de registrar otro egreso.'), { status: 409 });
        return { reused: true };
      }
      await logAudit(req, 'crear', 'movimientos_financieros', id, null, data, `Movimiento financiero ${data.tipo}: ${data.concepto}`, executor);
      return { reused: false };
    });
    res.status(result.reused ? 200 : 201).json({ id, ...data, message: 'Movimiento registrado' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo registrar el movimiento. Intente nuevamente.' });
  }
});

router.put('/movimientos/:id', async (req, res) => {
  try {
    const data = validateMovement({ ...req.body, tipo: 'egreso' });
    await dbModule.withTransaction(async executor => {
      const previous = await executor.get('SELECT * FROM movimientos_financieros WHERE id = ?', [req.params.id]);
      if (!previous) throw Object.assign(new Error('Egreso no encontrado.'), { status: 404 });
      if (previous.tipo !== 'egreso') throw Object.assign(new Error('Este formulario solo permite editar egresos.'), { status: 409 });
      await executor.run('UPDATE movimientos_financieros SET fecha = ?, categoria = ?, concepto = ?, tercero = ?, metodoPago = ?, referencia = ?, monto = ?, notas = ? WHERE id = ?', [data.fecha, data.categoria, data.concepto, data.tercero, data.metodoPago, data.referencia, data.monto, data.notas, req.params.id]);
      data.origen = previous.origen;
      await logAudit(req, 'actualizar', 'movimientos_financieros', req.params.id, previous, data, `Egreso actualizado: ${data.concepto}`, executor);
    });
    res.json({ id: req.params.id, ...data });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo actualizar el egreso. Intente nuevamente.' });
  }
});

router.post('/importar', async (req, res) => {
  try {
    const movimientos = Array.isArray(req.body.movimientos) ? req.body.movimientos : [];
    if (movimientos.length === 0) {
      return res.status(400).json({ error: 'No hay movimientos para importar' });
    }

    const inserted = [];
    const skipped = [];

    for (const [index, item] of movimientos.entries()) {
      const data = normalizeMovement({ ...item, origen: item.origen || 'csv' });
      if (!data.concepto || !data.monto) {
        skipped.push({ index, reason: 'Concepto o monto faltante', item });
        continue;
      }

      const existing = data.referencia
        ? await dbModule.get('SELECT id FROM movimientos_financieros WHERE referencia = ? AND monto = ? AND fecha = ?', [data.referencia, data.monto, data.fecha])
        : null;
      if (existing) {
        skipped.push({ index, reason: 'Duplicado por referencia, monto y fecha', item });
        continue;
      }

      const id = uuid();
      await dbModule.run(
        `INSERT INTO movimientos_financieros
         (id, fecha, tipo, categoria, concepto, tercero, metodoPago, referencia, monto, origen, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.fecha, data.tipo, data.categoria, data.concepto, data.tercero, data.metodoPago, data.referencia, data.monto, data.origen, data.notas]
      );
      inserted.push({ id, ...data });
    }

    await dbModule.save();
    await logAudit(req, 'crear', 'movimientos_financieros', null, null, { insertados: inserted.length, omitidos: skipped.length }, `Importacion financiera desde CSV: ${inserted.length} movimientos`);

    res.status(201).json({ inserted: inserted.length, skipped, message: 'Importacion procesada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/movimientos/:id', async (req, res) => {
  try {
    await dbModule.withTransaction(async executor => {
      const previous = await executor.get('SELECT * FROM movimientos_financieros WHERE id = ?', [req.params.id]);
      if (!previous) throw Object.assign(new Error('Movimiento no encontrado'), { status: 404 });
      await executor.run('DELETE FROM movimientos_financieros WHERE id = ?', [req.params.id]);
      await logAudit(req, 'eliminar', 'movimientos_financieros', req.params.id, previous, null, `Movimiento financiero eliminado: ${previous.concepto}`, executor);
    });
    res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

module.exports = router;
