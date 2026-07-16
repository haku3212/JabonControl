require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const initDB = require('./db');

// Rutas
const authRoutes = require('./routes/auth');
const ventasRoutes = require('./routes/ventas');
const cobrosRoutes = require('./routes/cobros');
const clientesRoutes = require('./routes/clientes');
const hornadasRoutes = require('./routes/hornadas');
const materiasRoutes = require('./routes/materias');
const usuariosRoutes = require('./routes/usuarios');
const finanzasRoutes = require('./routes/finanzas');
const createAppRecordsRouter = require('./routes/appRecords');
const { verifyToken, requireAdmin, requireRoles } = require('./routes/auth');
const dbModule = require('./db');
const crypto = require('crypto');

const app = express();

// Lista de origenes permitidos; en desarrollo acepta localhost y 127.0.0.1.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isLocalDevelopmentOrigin(origin) {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

// Middleware
// Helmet agrega headers HTTP defensivos siguiendo buenas practicas OWASP.
app.use(helmet({
  // En desarrollo mantenemos CSP flexible; en produccion se activa una politica estricta.
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", ...allowedOrigins],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  } : false,
  // HSTS solo tiene sentido detras de HTTPS en produccion.
  hsts: process.env.NODE_ENV === 'production',
}));

// CORS ya no queda abierto a cualquier origen; valida contra allowedOrigins.
app.use(cors({
  origin(origin, callback) {
    // Permite requests sin Origin, como curl/Postman/local health checks.
    if (!origin) return callback(null, true);

    // Acepta solo origenes configurados.
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // En desarrollo acepta Vite aunque cambie de puerto.
    if (isLocalDevelopmentOrigin(origin)) return callback(null, true);

    // Rechaza origenes externos no esperados.
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
}));

// Limita el tamano del JSON para reducir riesgo de abuso/DoS por payloads grandes.
app.use(express.json({ limit: '1mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ventas', verifyToken, ventasRoutes);
app.use('/api/cobros', verifyToken, requireRoles('admin', 'supervisor', 'supervisor_ventas'), cobrosRoutes);
app.use('/api/clientes', verifyToken, requireRoles('admin', 'supervisor', 'supervisor_ventas', 'operario'), clientesRoutes);
app.use('/api/hornadas', verifyToken, requireRoles('admin', 'operario'), hornadasRoutes);
app.use('/api/materias', verifyToken, requireRoles('admin', 'operario'), materiasRoutes);
app.use('/api/finanzas', verifyToken, requireRoles('admin', 'supervisor', 'supervisor_ventas'), finanzasRoutes);
app.use('/api/cotizaciones', verifyToken, requireRoles('admin', 'supervisor', 'supervisor_ventas'), createAppRecordsRouter('cotizaciones'));
app.use('/api/seguimientos', verifyToken, requireRoles('admin', 'supervisor', 'supervisor_ventas'), createAppRecordsRouter('seguimientos'));
app.use('/api/proyectos', verifyToken, requireRoles('admin'), createAppRecordsRouter('proyectos'));
app.use('/api/documentos', verifyToken, requireRoles('admin', 'operario'), createAppRecordsRouter('documentos'));
app.use('/api/equipos', verifyToken, requireRoles('admin', 'operario'), createAppRecordsRouter('equipos'));
app.use('/api/acabado', verifyToken, requireRoles('admin', 'operario'), createAppRecordsRouter('acabado'));
app.use('/api/contactos', verifyToken, requireRoles('admin', 'operario'), createAppRecordsRouter('contactos'));
app.use('/api/usuarios', verifyToken, requireAdmin, usuariosRoutes);
app.get('/api/auditoria', verifyToken, requireAdmin, async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT * FROM audit_logs ORDER BY creado_en DESC LIMIT 250');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/auditoria/integridad', verifyToken, requireAdmin, async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT * FROM audit_logs ORDER BY creado_en ASC');
    if (rows.length === 0) return res.json({ ok: true, total: 0, errores: [] });
    let previousHash = '';
    const errores = [];
    rows.forEach((log, index) => {
      const payload = [
        log.id,
        log.usuario_id || '',
        log.usuario || 'sistema',
        log.rol || '',
        log.accion,
        log.tabla,
        log.registro_id || '',
        log.detalle || '',
        log.valores_anteriores || '',
        log.valores_nuevos || '',
        log.hash_anterior || '',
      ].join('|');
      const expected = crypto.createHash('sha256').update(payload).digest('hex');
      if ((log.hash_anterior || '') !== previousHash || (log.hash_evento || '') !== expected) {
        errores.push({ posicion: index + 1, id: log.id, tabla: log.tabla, accion: log.accion });
      }
      previousHash = log.hash_evento || '';
    });
    res.json({ ok: errores.length === 0, total: rows.length, errores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback para React Router - servir index.html para rutas no API
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  // Log interno para diagnostico del servidor.
  console.error(err.stack);

  // En produccion no exponemos detalles tecnicos al cliente.
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({ error: isProduction ? 'Error interno del servidor' : err.message });
});

// Inicializar y arrancar
async function start() {
  try {
    await initDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ JabonControl API corriendo en puerto ${PORT}`);
      console.log(`📡 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

start();
