const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

// GET todas las ventas
router.get('/', (req, res) => {
  db.all('SELECT * FROM ventas ORDER BY fecha DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// GET venta por ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM ventas WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrada' });
    res.json(row);
  });
});

// POST crear venta
router.post('/', (req, res) => {
  const { numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago } = req.body;

  if (!numeroNE || !cliente || !cantidad || !precioUnitario) {
    return res.status(400).json({ error: 'Campos requeridos' });
  }

  const id = uuid();
  db.run(
    `INSERT INTO ventas (id, numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, numeroNE, fecha || new Date().toISOString().split('T')[0], cliente, formato, cantidad, precioUnitario, total, tipoPago],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id, message: 'Venta creada' });
    }
  );
});

// PUT actualizar venta
router.put('/:id', (req, res) => {
  const { estado } = req.body;

  db.run(
    'UPDATE ventas SET estado = ? WHERE id = ?',
    [estado, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Venta actualizada' });
    }
  );
});

// DELETE venta
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM ventas WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Venta eliminada' });
  });
});

module.exports = router;
