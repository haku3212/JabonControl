const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  db.all('SELECT * FROM clientes ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const { nombre, tipo, telefono, ciudad, direccion } = req.body;

  if (!nombre || !tipo) {
    return res.status(400).json({ error: 'Campos requeridos' });
  }

  const id = uuid();
  db.run(
    `INSERT INTO clientes (id, nombre, tipo, telefono, ciudad, direccion)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, nombre, tipo, telefono, ciudad, direccion],
    (err) => {
      if (err) return res.status(400).json({ error: 'El cliente ya existe' });
      res.status(201).json({ id, message: 'Cliente creado' });
    }
  );
});

router.put('/:id', (req, res) => {
  const { nombre, tipo, telefono, ciudad, direccion } = req.body;

  db.run(
    `UPDATE clientes SET nombre = ?, tipo = ?, telefono = ?, ciudad = ?, direccion = ? WHERE id = ?`,
    [nombre, tipo, telefono, ciudad, direccion, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Cliente actualizado' });
    }
  );
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM clientes WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cliente eliminado' });
  });
});

module.exports = router;
