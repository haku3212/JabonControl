require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDB = require('./db');

// Rutas
const authRoutes = require('./routes/auth');
const ventasRoutes = require('./routes/ventas');
const cobrosRoutes = require('./routes/cobros');
const clientesRoutes = require('./routes/clientes');
const hornadasRoutes = require('./routes/hornadas');
const materiasRoutes = require('./routes/materias');
const usuariosRoutes = require('./routes/usuarios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cobros', cobrosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/hornadas', hornadasRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
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
