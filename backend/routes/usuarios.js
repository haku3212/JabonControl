const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');

function safeUser(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

function rowToObject(result) {
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  const columns = result[0].columns;
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj;
}

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

function isStrongPassword(password) {
  // Debe tener minimo 8 caracteres.
  if (typeof password !== 'string' || password.length < 8) return false;

  // Debe incluir una letra.
  if (!/[A-Za-z]/.test(password)) return false;

  // Debe incluir un numero.
  if (!/[0-9]/.test(password)) return false;

  // Cumple politica minima.
  return true;
}

router.get('/', (req, res) => {
  try {
    const db = dbModule.db.get();
    const result = db.exec('SELECT id, nombre, usuario, rol, estado, ultimo_acceso, password_actualizado_en FROM usuarios ORDER BY nombre');
    const rows = rowsToObjects(result);
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { nombre, usuario, email, password, rol, estado } = req.body;

    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'La contrasena debe tener minimo 8 caracteres, una letra y un numero' });
    }
    if (!['admin', 'supervisor', 'operario'].includes(rol || 'operario')) {
      return res.status(400).json({ error: 'Rol invalido' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuid();
    const db = dbModule.db.get();

    db.run(
      `INSERT INTO usuarios (id, nombre, usuario, email, password, rol, estado, password_actualizado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, nombre, usuario, email || '', hashedPassword, rol || 'operario', estado || 'activo']
    );
    dbModule.db.save();
    logAudit(req, 'crear', 'usuarios', id, null, { id, nombre, usuario, email, rol: rol || 'operario', estado: estado || 'activo' }, `Usuario ${usuario} creado`);

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
    const { nombre, usuario, email, password, rol, estado } = req.body;
    if (!['admin', 'supervisor', 'operario'].includes(rol || 'operario')) {
      return res.status(400).json({ error: 'Rol invalido' });
    }
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM usuarios WHERE id = ?', [req.params.id]));
    if (!previous) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (password) {
      if (!isStrongPassword(password)) {
        return res.status(400).json({ error: 'La contrasena debe tener minimo 8 caracteres, una letra y un numero' });
      }
      db.run(
        `UPDATE usuarios SET nombre = ?, usuario = ?, email = ?, password = ?, rol = ?, estado = ?, password_actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
        [nombre, usuario, email || '', bcrypt.hashSync(password, 10), rol, estado, req.params.id]
      );
    } else {
      db.run(
        `UPDATE usuarios SET nombre = ?, usuario = ?, email = ?, rol = ?, estado = ? WHERE id = ?`,
        [nombre, usuario, email || '', rol, estado, req.params.id]
      );
    }
    dbModule.db.save();
    logAudit(req, 'actualizar', 'usuarios', req.params.id, safeUser(previous), { id: req.params.id, nombre, usuario, email, rol, estado }, `Usuario ${usuario} actualizado`);
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    if (req.user?.id === req.params.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario activo' });
    }
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM usuarios WHERE id = ?', [req.params.id]));
    db.run('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    logAudit(req, 'eliminar', 'usuarios', req.params.id, safeUser(previous), null, `Usuario ${previous?.usuario || req.params.id} eliminado`);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
