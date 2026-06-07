const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  db.all('SELECT * FROM recepciones ORDER BY fecha DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const { fecha, proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado } = req.body;

  if (!proveedor || !producto || !cantidad) {
    return res.status(400).json({ error: 'Campos requeridos' });
  }

  const id = uuid();
  db.run(
    `INSERT INTO recepciones
     (id, fecha, proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, fecha || new Date().toISOString().split('T')[0], proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado || 'recibido'],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id, message: 'Recepción registrada' });
    }
  );
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM recepciones WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Recepción eliminada' });
  });
});

module.exports = router;
