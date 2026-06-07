const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM clientes ORDER BY nombre');
    const rows = stmt.all();
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { nombre, tipo, telefono, ciudad, direccion } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    const stmt = db.prepare(
      `INSERT INTO clientes (id, nombre, tipo, telefono, ciudad, direccion)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, nombre, tipo, telefono, ciudad, direccion);

    res.status(201).json({ id, message: 'Cliente creado' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El cliente ya existe' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { nombre, tipo, telefono, ciudad, direccion } = req.body;
    const stmt = db.prepare(
      `UPDATE clientes SET nombre = ?, tipo = ?, telefono = ?, ciudad = ?, direccion = ? WHERE id = ?`
    );
    stmt.run(nombre, tipo, telefono, ciudad, direccion, req.params.id);
    res.json({ message: 'Cliente actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM clientes WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
