const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

function rowsToObjects(result) {
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

router.get('/', (req, res) => {
  try {
    const db = dbModule.db.get();
    const result = db.exec('SELECT id, nombre, usuario, rol, estado, ultimo_acceso FROM usuarios ORDER BY nombre');
    const rows = rowsToObjects(result);
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
    const db = dbModule.db.get();

    db.run(
      `INSERT INTO usuarios (id, nombre, usuario, password, rol)
       VALUES (?, ?, ?, ?, ?)`,
      [id, nombre, usuario, hashedPassword, rol || 'operario']
    );
    dbModule.db.save();

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
    const db = dbModule.db.get();
    db.run(
      `UPDATE usuarios SET nombre = ?, rol = ?, estado = ? WHERE id = ?`,
      [nombre, rol, estado, req.params.id]
    );
    dbModule.db.save();
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = dbModule.db.get();
    db.run('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
