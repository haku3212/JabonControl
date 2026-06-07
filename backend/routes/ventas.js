const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

// GET todas las ventas
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM ventas ORDER BY fecha DESC');
    const rows = stmt.all();
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET venta por ID
router.get('/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM ventas WHERE id = ?');
    const row = stmt.get(req.params.id);
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
    const stmt = db.prepare(
      `INSERT INTO ventas (id, numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, numeroNE, fecha || new Date().toISOString().split('T')[0], cliente, formato, cantidad, precioUnitario, total, tipoPago);

    res.status(201).json({ id, message: 'Venta creada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT actualizar venta
router.put('/:id', (req, res) => {
  try {
    const { estado } = req.body;
    const stmt = db.prepare('UPDATE ventas SET estado = ? WHERE id = ?');
    stmt.run(estado, req.params.id);
    res.json({ message: 'Venta actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE venta
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM ventas WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
