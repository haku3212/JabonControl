const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE || './database.sqlite';
const db = new Database(dbPath);

function initDB() {
  try {
    // Tabla de Usuarios
    db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'operario',
        estado TEXT DEFAULT 'activo',
        ultimo_acceso DATETIME,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de Clientes
    db.exec(`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        tipo TEXT NOT NULL,
        telefono TEXT,
        ciudad TEXT,
        direccion TEXT,
        ventaMes REAL DEFAULT 0,
        cobradoMes REAL DEFAULT 0,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de Ventas
    db.exec(`
      CREATE TABLE IF NOT EXISTS ventas (
        id TEXT PRIMARY KEY,
        numeroNE TEXT UNIQUE NOT NULL,
        fecha TEXT NOT NULL,
        cliente TEXT NOT NULL,
        formato TEXT NOT NULL,
        cantidad REAL NOT NULL,
        precioUnitario REAL NOT NULL,
        total REAL NOT NULL,
        tipoPago TEXT NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cliente) REFERENCES clientes(nombre)
      )
    `);

    // Tabla de Cobros
    db.exec(`
      CREATE TABLE IF NOT EXISTS cobros (
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        cliente TEXT NOT NULL,
        montoCobrado REAL NOT NULL,
        metodoPago TEXT NOT NULL,
        notasCorrespondientes TEXT,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cliente) REFERENCES clientes(nombre)
      )
    `);

    // Tabla de Hornadas
    db.exec(`
      CREATE TABLE IF NOT EXISTS hornadas (
        id TEXT PRIMARY KEY,
        numero TEXT UNIQUE NOT NULL,
        fecha TEXT NOT NULL,
        horaInicio TEXT NOT NULL,
        operario TEXT NOT NULL,
        naohVolumen REAL DEFAULT 0,
        seboFund REAL DEFAULT 0,
        aceiteQuem REAL DEFAULT 0,
        aceiteCrudo REAL DEFAULT 0,
        aceiteAlmendra REAL DEFAULT 0,
        agua REAL DEFAULT 0,
        jabonRecicl REAL DEFAULT 0,
        produccionTotal REAL NOT NULL,
        rendimiento REAL DEFAULT 0,
        observaciones TEXT,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de Materias Primas
    db.exec(`
      CREATE TABLE IF NOT EXISTS materias_primas (
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        proveedor TEXT NOT NULL,
        producto TEXT NOT NULL,
        cantidad REAL NOT NULL,
        unidad TEXT NOT NULL,
        precioUnitario REAL NOT NULL,
        precioTotal REAL NOT NULL,
        estado TEXT DEFAULT 'recibido',
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de Recepciones
    db.exec(`
      CREATE TABLE IF NOT EXISTS recepciones (
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        proveedor TEXT NOT NULL,
        producto TEXT NOT NULL,
        cantidad REAL NOT NULL,
        unidad TEXT NOT NULL,
        precioUnitario REAL NOT NULL,
        precioTotal REAL NOT NULL,
        estado TEXT DEFAULT 'recibido',
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar usuario admin por defecto
    const stmt = db.prepare("SELECT * FROM usuarios WHERE usuario = 'admin'");
    const adminExists = stmt.get();

    if (!adminExists) {
      const hashedPass = bcrypt.hashSync('admin123', 10);
      const insertStmt = db.prepare(
        "INSERT INTO usuarios (id, nombre, usuario, password, rol) VALUES (?, ?, ?, ?, ?)"
      );
      insertStmt.run(crypto.randomUUID(), 'Administrador', 'admin', hashedPass, 'admin');
      console.log('✅ Usuario admin creado');
    }

    console.log('✅ Base de datos SQLite inicializada');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

module.exports = initDB;
module.exports.db = db;
