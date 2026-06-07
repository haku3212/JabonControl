const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE || './database.db';
let db = null;

async function initDB() {
  try {
    const SQL = await initSqlJs();

    // Cargar DB existente o crear nueva
    let data;
    try {
      data = fs.readFileSync(dbPath);
    } catch (e) {
      data = null;
    }

    if (data) {
      db = new SQL.Database(data);
    } else {
      db = new SQL.Database();
    }

    // Crear tablas
    db.run(`
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

    db.run(`
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

    db.run(`
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

    db.run(`
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

    db.run(`
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

    db.run(`
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

    db.run(`
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

    // Verificar si admin existe
    const result = db.exec("SELECT * FROM usuarios WHERE usuario = 'admin'");
    if (result.length === 0 || result[0].values.length === 0) {
      const hashedPass = bcrypt.hashSync('admin123', 10);
      db.run(
        "INSERT INTO usuarios (id, nombre, usuario, password, rol) VALUES (?, ?, ?, ?, ?)",
        [crypto.randomUUID(), 'Administrador', 'admin', hashedPass, 'admin']
      );
      console.log('✅ Usuario admin creado');
    }

    // Guardar DB
    saveDB();
    console.log('✅ Base de datos SQL.js inicializada');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDB() {
  return db;
}

module.exports = initDB;
module.exports.db = {
  get: () => db,
  save: saveDB
};
