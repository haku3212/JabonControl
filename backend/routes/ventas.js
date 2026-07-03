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

// GET todas las ventas
router.get('/', (req, res) => {
  try {
    const db = dbModule.db.get();
    const result = db.exec('SELECT * FROM ventas ORDER BY fecha DESC');
    const rows = rowsToObjects(result);
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET venta por ID
router.get('/:id', (req, res) => {
  try {
    const db = dbModule.db.get();
    const result = db.exec('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    const row = rowToObject(result);
    if (!row) return res.status(404).json({ error: 'No encontrada' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST crear venta
router.post('/', requireRoles('admin', 'supervisor'), (req, res) => {
  try {
    const { numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago } = req.body;

    if (!numeroNE || !cliente || !cantidad || !precioUnitario) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    const db = dbModule.db.get();
    // Las ventas a crédito generan deuda; las canceladas no deben nada
    const saldoPendiente = tipoPago === 'credito' ? total : 0;
    const estado = tipoPago === 'credito' ? 'pendiente' : 'pagado';
    db.run(
      `INSERT INTO ventas (id, numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago, estado, saldoPendiente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, numeroNE, fecha || new Date().toISOString().split('T')[0], cliente, formato, cantidad, precioUnitario, total, tipoPago, estado, saldoPendiente]
    );
    dbModule.db.save();
    logAudit(req, 'crear', 'ventas', id, null, req.body, `Venta ${numeroNE} para ${cliente}`);

    res.status(201).json({ id, message: 'Venta creada', saldoPendiente, estado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT actualizar venta
router.put('/:id', requireRoles('admin', 'supervisor'), (req, res) => {
  try {
    const { estado } = req.body;
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM ventas WHERE id = ?', [req.params.id]));
    db.run('UPDATE ventas SET estado = ? WHERE id = ?', [estado, req.params.id]);
    dbModule.db.save();
    logAudit(req, 'actualizar', 'ventas', req.params.id, previous, { ...previous, estado }, `Estado de venta actualizado a ${estado}`);
    res.json({ message: 'Venta actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE venta
router.delete('/:id', requireRoles('admin'), (req, res) => {
  try {
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM ventas WHERE id = ?', [req.params.id]));
    db.run('DELETE FROM ventas WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    logAudit(req, 'eliminar', 'ventas', req.params.id, previous, null, `Venta ${previous?.numeroNE || req.params.id} eliminada`);
    res.json({ message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
