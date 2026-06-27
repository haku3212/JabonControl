const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const ROLES_VALIDOS = ['admin', 'ventas', 'produccion', 'gestion'];

function rowsToObjects(result) {
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj;
  });
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function soloAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  next();
}

// GET todos los usuarios (solo admin)
router.get('/', verifyToken, soloAdmin, (req, res) => {
  try {
    const db = dbModule.db.get();
    const result = db.exec('SELECT id, nombre, usuario, rol, estado, ultimo_acceso FROM usuarios ORDER BY nombre');
    res.json(rowsToObjects(result));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST crear usuario (solo admin)
router.post('/', verifyToken, soloAdmin, (req, res) => {
  try {
    const { nombre, usuario, password, rol } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Campos requeridos: nombre, usuario, password' });
    }
    const rolFinal = ROLES_VALIDOS.includes(rol) ? rol : 'ventas';
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuid();
    const db = dbModule.db.get();
    db.run(
      'INSERT INTO usuarios (id, nombre, usuario, password, rol) VALUES (?, ?, ?, ?, ?)',
      [id, nombre, usuario, hashedPassword, rolFinal]
    );
    dbModule.db.save();
    res.status(201).json({ id, message: 'Usuario creado' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }
    res.status(400).json({ error: error.message });
  }
});

// PUT editar usuario (solo admin)
router.put('/:id', verifyToken, soloAdmin, (req, res) => {
  try {
    const { nombre, rol, estado } = req.body;
    const rolFinal = ROLES_VALIDOS.includes(rol) ? rol : undefined;
    if (!rolFinal) return res.status(400).json({ error: 'Rol inválido' });
    const db = dbModule.db.get();
    db.run(
      'UPDATE usuarios SET nombre = ?, rol = ?, estado = ? WHERE id = ?',
      [nombre, rolFinal, estado || 'activo', req.params.id]
    );
    dbModule.db.save();
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE eliminar usuario (solo admin, no puede eliminarse a si mismo)
router.delete('/:id', verifyToken, soloAdmin, (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    const db = dbModule.db.get();
    db.run('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
