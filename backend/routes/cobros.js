const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM cobros ORDER BY fecha DESC');
    const rows = stmt.all();
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
    const stmt = db.prepare(
      `INSERT INTO cobros (id, fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, fecha || new Date().toISOString().split('T')[0], cliente, montoCobrado, metodoPago, notasCorrespondientes);

    res.status(201).json({ id, message: 'Cobro registrado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM cobros WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Cobro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
