const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');

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
router.post('/', (req, res) => {
  try {
    const { numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago } = req.body;

    if (!numeroNE || !cliente || !cantidad || !precioUnitario) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    const db = dbModule.db.get();
    db.run(
      `INSERT INTO ventas (id, numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, numeroNE, fecha || new Date().toISOString().split('T')[0], cliente, formato, cantidad, precioUnitario, total, tipoPago]
    );
    dbModule.db.save();

    res.status(201).json({ id, message: 'Venta creada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT actualizar venta
router.put('/:id', (req, res) => {
  try {
    const { estado } = req.body;
    const db = dbModule.db.get();
    db.run('UPDATE ventas SET estado = ? WHERE id = ?', [estado, req.params.id]);
    dbModule.db.save();
    res.json({ message: 'Venta actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE venta
router.delete('/:id', (req, res) => {
  try {
    const db = dbModule.db.get();
    db.run('DELETE FROM ventas WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    res.json({ message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
