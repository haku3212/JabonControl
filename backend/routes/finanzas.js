const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');

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
    const data = normalizeMovement(req.body);
    if (!data.concepto || !data.monto) {
      return res.status(400).json({ error: 'Concepto y monto son obligatorios' });
    }

    const id = uuid();
    await dbModule.run(
      `INSERT INTO movimientos_financieros
       (id, fecha, tipo, categoria, concepto, tercero, metodoPago, referencia, monto, origen, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.fecha, data.tipo, data.categoria, data.concepto, data.tercero, data.metodoPago, data.referencia, data.monto, data.origen, data.notas]
    );
    await dbModule.save();
    await logAudit(req, 'crear', 'movimientos_financieros', id, null, data, `Movimiento financiero ${data.tipo}: ${data.concepto}`);

    res.status(201).json({ id, message: 'Movimiento registrado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    const previous = await dbModule.get('SELECT * FROM movimientos_financieros WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Movimiento no encontrado' });

    await dbModule.run('DELETE FROM movimientos_financieros WHERE id = ?', [req.params.id]);
    await dbModule.save();
    await logAudit(req, 'eliminar', 'movimientos_financieros', req.params.id, previous, null, `Movimiento financiero eliminado: ${previous.concepto}`);
    res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
