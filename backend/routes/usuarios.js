const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');

const VALID_ROLES = ['admin', 'supervisor', 'supervisor_ventas', 'operario'];

function safeUser(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

function isStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

router.get('/', async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT id, nombre, usuario, rol, estado, ultimo_acceso, password_actualizado_en FROM usuarios ORDER BY nombre');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, usuario, email, password, rol, estado } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'La contrasena debe tener minimo 8 caracteres, una letra y un numero' });
    }
    if (!VALID_ROLES.includes(rol || 'operario')) {
      return res.status(400).json({ error: 'Rol invalido' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuid();
    await dbModule.run(
      `INSERT INTO usuarios (id, nombre, usuario, email, password, rol, estado, password_actualizado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, nombre, usuario, email || '', hashedPassword, rol || 'operario', estado || 'activo']
    );
    await dbModule.save();
    await logAudit(req, 'crear', 'usuarios', id, null, { id, nombre, usuario, email, rol: rol || 'operario', estado: estado || 'activo' }, `Usuario ${usuario} creado`);

    res.status(201).json({ id, message: 'Usuario creado' });
  } catch (error) {
    if (error.message.includes('UNIQUE') || error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, usuario, email, password, rol, estado } = req.body;
    if (!VALID_ROLES.includes(rol || 'operario')) {
      return res.status(400).json({ error: 'Rol invalido' });
    }

    const previous = await dbModule.get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (password) {
      if (!isStrongPassword(password)) {
        return res.status(400).json({ error: 'La contrasena debe tener minimo 8 caracteres, una letra y un numero' });
      }
      await dbModule.run(
        'UPDATE usuarios SET nombre = ?, usuario = ?, email = ?, password = ?, rol = ?, estado = ?, password_actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
        [nombre, usuario, email || '', bcrypt.hashSync(password, 10), rol, estado, req.params.id]
      );
    } else {
      await dbModule.run(
        'UPDATE usuarios SET nombre = ?, usuario = ?, email = ?, rol = ?, estado = ? WHERE id = ?',
        [nombre, usuario, email || '', rol, estado, req.params.id]
      );
    }

    await dbModule.save();
    await logAudit(req, 'actualizar', 'usuarios', req.params.id, safeUser(previous), { id: req.params.id, nombre, usuario, email, rol, estado }, `Usuario ${usuario} actualizado`);
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user?.id === req.params.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario activo' });
    }

    const previous = await dbModule.get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Usuario no encontrado' });

    await dbModule.run('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    await dbModule.save();
    await logAudit(req, 'eliminar', 'usuarios', req.params.id, safeUser(previous), null, `Usuario ${previous.usuario || req.params.id} eliminado`);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
