const express = require('express');
const router = express.Router();
const { db } = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, nombre, usuario, rol, estado, ultimo_acceso FROM usuarios ORDER BY nombre');
    const rows = stmt.all();
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { nombre, usuario, password, rol } = req.body;

    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuid();

    const stmt = db.prepare(
      `INSERT INTO usuarios (id, nombre, usuario, password, rol)
       VALUES (?, ?, ?, ?, ?)`
    );
    stmt.run(id, nombre, usuario, hashedPassword, rol || 'operario');

    res.status(201).json({ id, message: 'Usuario creado' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { nombre, rol, estado } = req.body;
    const stmt = db.prepare(
      `UPDATE usuarios SET nombre = ?, rol = ?, estado = ? WHERE id = ?`
    );
    stmt.run(nombre, rol, estado, req.params.id);
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
