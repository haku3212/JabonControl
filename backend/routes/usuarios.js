const express = require('express');
const router = express.Router();
const { db } = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  db.all('SELECT id, nombre, usuario, rol, estado, ultimo_acceso FROM usuarios ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const { nombre, usuario, password, rol } = req.body;

  if (!nombre || !usuario || !password) {
    return res.status(400).json({ error: 'Campos requeridos' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuid();

  db.run(
    `INSERT INTO usuarios (id, nombre, usuario, password, rol)
     VALUES (?, ?, ?, ?, ?)`,
    [id, nombre, usuario, hashedPassword, rol || 'operario'],
    (err) => {
      if (err) return res.status(400).json({ error: 'El usuario ya existe' });
      res.status(201).json({ id, message: 'Usuario creado' });
    }
  );
});

router.put('/:id', (req, res) => {
  const { nombre, rol, estado } = req.body;

  db.run(
    `UPDATE usuarios SET nombre = ?, rol = ?, estado = ? WHERE id = ?`,
    [nombre, rol, estado, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Usuario actualizado' });
    }
  );
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Usuario eliminado' });
  });
});

module.exports = router;
