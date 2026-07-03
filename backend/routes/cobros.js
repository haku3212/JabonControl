const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');

function rowToObject(result) {
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  const columns = result[0].columns;
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj;
}

function rowsToObjects(result) {
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

router.get('/', (req, res) => {
  try {
    const db = dbModule.db.get();
    const result = db.exec('SELECT * FROM cobros ORDER BY fecha DESC');
    const rows = rowsToObjects(result);
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes } = req.body;

    if (!cliente || !montoCobrado) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    const db = dbModule.db.get();
    db.run(
      `INSERT INTO cobros (id, fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, fecha || new Date().toISOString().split('T')[0], cliente, montoCobrado, metodoPago, notasCorrespondientes]
    );

    // Aplicar el cobro a las deudas del cliente (FIFO: la deuda más antigua primero)
    const ventasAfectadas = [];
    const result = db.exec(
      'SELECT id, numeroNE, saldoPendiente FROM ventas WHERE cliente = ? AND saldoPendiente > 0 ORDER BY fecha ASC, creado_en ASC',
      [cliente]
    );

    if (result.length > 0) {
      let restante = montoCobrado;
      for (const row of result[0].values) {
        if (restante <= 0) break;
        const [ventaId, numeroNE, saldo] = row;
        const aplicar = Math.min(restante, saldo);
        const nuevoSaldo = Math.round((saldo - aplicar) * 100) / 100;
        const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'parcial';

        db.run(
          'UPDATE ventas SET saldoPendiente = ?, estado = ? WHERE id = ?',
          [nuevoSaldo, nuevoEstado, ventaId]
        );
        ventasAfectadas.push({ id: ventaId, numeroNE, aplicado: aplicar, nuevoSaldo, estado: nuevoEstado });
        restante = Math.round((restante - aplicar) * 100) / 100;
      }
    }

    dbModule.db.save();
    logAudit(req, 'crear', 'cobros', id, null, { ...req.body, ventasAfectadas }, `Cobro de ${montoCobrado} registrado para ${cliente}`);

    res.status(201).json({ id, message: 'Cobro registrado', ventasAfectadas });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin'), (req, res) => {
  try {
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM cobros WHERE id = ?', [req.params.id]));
    db.run('DELETE FROM cobros WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    logAudit(req, 'eliminar', 'cobros', req.params.id, previous, null, `Cobro ${req.params.id} eliminado`);
    res.json({ message: 'Cobro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
