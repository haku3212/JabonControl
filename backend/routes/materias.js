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
    const result = db.exec('SELECT * FROM recepciones ORDER BY fecha DESC');
    const rows = rowsToObjects(result);
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { fecha, proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado } = req.body;

    if (!proveedor || !producto || !cantidad) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    const db = dbModule.db.get();
    db.run(
      `INSERT INTO recepciones
       (id, fecha, proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, fecha || new Date().toISOString().split('T')[0], proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado || 'recibido']
    );
    dbModule.db.save();
    logAudit(req, 'crear', 'recepciones', id, null, req.body, `Recepcion de ${producto} registrada`);

    res.status(201).json({ id, message: 'Recepción registrada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin', 'supervisor'), (req, res) => {
  try {
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM recepciones WHERE id = ?', [req.params.id]));
    db.run('DELETE FROM recepciones WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    logAudit(req, 'eliminar', 'recepciones', req.params.id, previous, null, `Recepcion ${previous?.producto || req.params.id} eliminada`);
    res.json({ message: 'Recepción eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
