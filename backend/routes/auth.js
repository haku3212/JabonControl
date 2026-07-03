const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const dbModule = require('../db');
const { v4: uuid } = require('uuid');

// Secreto JWT configurable por ambiente; en produccion no se permite fallback.
const JWT_SECRET = process.env.JWT_SECRET || 'jaboncontrol_secret_2026_cambiar_en_produccion';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'jc_session';
const PASSWORD_MAX_DAYS = Number(process.env.PASSWORD_MAX_DAYS || 180);

// Bloqueo temporal por usuario, adicional al rate limit por IP.
const loginFailures = new Map();

// Rate limit por IP para frenar ataques automatizados al login.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Demasiados intentos. Intente nuevamente mas tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// En produccion el sistema debe arrancar solo con secreto real.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en produccion');
}

// Valida politica minima de contrasena.
function isStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

// Convierte el resultado SQL.js de un usuario en objeto.
function firstRow(result) {
  if (result.length === 0 || result[0].values.length === 0) return null;
  const columns = result[0].columns;
  return result[0].values[0].reduce((obj, value, index) => {
    obj[columns[index]] = value;
    return obj;
  }, {});
}

// Parser de cookies sin dependencia extra.
function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separator = item.indexOf('=');
      if (separator === -1) return cookies;
      cookies[item.slice(0, separator)] = decodeURIComponent(item.slice(separator + 1));
      return cookies;
    }, {});
}

// Graba el JWT en cookie HttpOnly para que JavaScript del navegador no lo lea.
function setAuthCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'Strict' : 'Lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Borra cookie al cerrar sesion.
function clearAuthCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'Strict' : 'Lax',
    path: '/',
  });
}

// Lee contador de fallos por usuario.
function getFailure(usuario) {
  return loginFailures.get(String(usuario || '').toLowerCase());
}

// Registra fallo y bloquea 15 minutos desde el quinto intento.
function registerFailure(usuario) {
  const key = String(usuario || '').toLowerCase();
  const current = loginFailures.get(key) || { count: 0, lockedUntil: 0 };
  const count = current.count + 1;
  loginFailures.set(key, {
    count,
    lockedUntil: count >= 5 ? Date.now() + 15 * 60 * 1000 : current.lockedUntil,
  });
}

// Limpia contador cuando el login es correcto.
function clearFailure(usuario) {
  loginFailures.delete(String(usuario || '').toLowerCase());
}

// Verifica si la contrasena supero la ventana de rotacion.
function isPasswordExpired(user) {
  const reference = user.password_actualizado_en || user.creado_en;
  if (!reference || !PASSWORD_MAX_DAYS) return false;
  const time = new Date(reference).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time > PASSWORD_MAX_DAYS * 24 * 60 * 60 * 1000;
}

// Login con cookie HttpOnly y bloqueo por usuario.
router.post('/login', loginLimiter, (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contrasena requeridos' });
    }

    const failure = getFailure(usuario);
    if (failure?.lockedUntil && failure.lockedUntil > Date.now()) {
      return res.status(429).json({ error: 'Usuario bloqueado temporalmente por intentos fallidos.' });
    }

    const db = dbModule.db.get();
    const user = firstRow(db.exec('SELECT * FROM usuarios WHERE usuario = ?', [usuario]));
    if (!user) {
      registerFailure(usuario);
      return res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
    }

    if (user.estado && user.estado !== 'activo') {
      return res.status(403).json({ error: 'Usuario inactivo. Contacte al administrador.' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      registerFailure(usuario);
      return res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
    }

    if (isPasswordExpired(user)) {
      return res.status(403).json({ error: 'La contrasena expiro. Solicite cambio al administrador.' });
    }

    db.run('UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    dbModule.db.save();
    clearFailure(usuario);

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    setAuthCookie(res, token);
    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout borra la cookie de sesion.
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Sesion cerrada' });
});

// Registrar usuario queda restringido a admin.
router.post('/register', verifyToken, requireRoles('admin'), (req, res) => {
  try {
    const { nombre, usuario, password, rol } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'La contrasena debe tener minimo 8 caracteres, una letra y un numero' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuid();
    const db = dbModule.db.get();
    db.run(
      'INSERT INTO usuarios (id, nombre, usuario, password, rol, password_actualizado_en) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, nombre, usuario, hashedPassword, rol || 'operario']
    );
    dbModule.db.save();
    res.json({ message: 'Usuario creado', id });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Verifica token desde cookie HttpOnly o, temporalmente, desde header Bearer.
function verifyToken(req, res, next) {
  const token = parseCookies(req)[COOKIE_NAME] || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = dbModule.db.get();
    const user = firstRow(db.exec(
      'SELECT id, nombre, usuario, rol, estado, password_actualizado_en, creado_en FROM usuarios WHERE id = ?',
      [decoded.id]
    ));
    if (!user) return res.status(401).json({ error: 'Token invalido' });
    if (user.estado && user.estado !== 'activo') return res.status(403).json({ error: 'Usuario inactivo' });
    if (isPasswordExpired(user)) return res.status(403).json({ error: 'La contrasena expiro. Solicite cambio al administrador.' });
    req.user = { id: user.id, usuario: user.usuario, rol: user.rol, nombre: user.nombre };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido' });
  }
}

// Middleware reusable para permisos por rol.
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({ error: 'No autorizado para esta accion' });
    }
    next();
  };
}

// Alias explicito para rutas exclusivas del administrador.
function requireAdmin(req, res, next) {
  return requireRoles('admin')(req, res, next);
}

router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.requireAdmin = requireAdmin;
module.exports.requireRoles = requireRoles;
