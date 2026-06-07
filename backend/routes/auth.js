const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { v4: uuid } = require('uuid');

// Login
router.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  db.get('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Actualizar último acceso
    db.run('UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol
      }
    });
  });
});

// Registrar usuario (solo admin)
router.post('/register', verifyToken, (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const { nombre, usuario, password, rol } = req.body;

  if (!nombre || !usuario || !password) {
    return res.status(400).json({ error: 'Campos requeridos' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuid();

  db.run(
    'INSERT INTO usuarios (id, nombre, usuario, password, rol) VALUES (?, ?, ?, ?, ?)',
    [id, nombre, usuario, hashedPassword, rol || 'operario'],
    (err) => {
      if (err) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }
      res.json({ message: 'Usuario creado', id });
    }
  );
});

// Verificar token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
