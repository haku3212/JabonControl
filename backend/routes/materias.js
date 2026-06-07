const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM recepciones ORDER BY fecha DESC');
    const rows = stmt.all();
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
    const stmt = db.prepare(
      `INSERT INTO recepciones
       (id, fecha, proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, fecha || new Date().toISOString().split('T')[0], proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado || 'recibido');

    res.status(201).json({ id, message: 'Recepción registrada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM recepciones WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Recepción eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
