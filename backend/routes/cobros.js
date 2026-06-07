const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  db.all('SELECT * FROM cobros ORDER BY fecha DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const { fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes } = req.body;

  if (!cliente || !montoCobrado) {
    return res.status(400).json({ error: 'Campos requeridos' });
  }

  const id = uuid();
  db.run(
    `INSERT INTO cobros (id, fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, fecha || new Date().toISOString().split('T')[0], cliente, montoCobrado, metodoPago, notasCorrespondientes],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id, message: 'Cobro registrado' });
    }
  );
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM cobros WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cobro eliminado' });
  });
});

module.exports = router;
