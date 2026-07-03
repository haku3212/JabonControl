const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Usar volumen persistente de Railway si existe (los datos sobreviven deploys)
const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
const dbPath = process.env.DATABASE || (volumePath ? path.join(volumePath, 'database.db') : './database.db');
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
        password_actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        usuario_id TEXT,
        usuario TEXT,
        rol TEXT,
        accion TEXT NOT NULL,
        tabla TEXT NOT NULL,
        registro_id TEXT,
        detalle TEXT,
        valores_anteriores TEXT,
        valores_nuevos TEXT,
        hash_anterior TEXT,
        hash_evento TEXT,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      db.run('ALTER TABLE usuarios ADD COLUMN password_actualizado_en DATETIME');
      db.run('UPDATE usuarios SET password_actualizado_en = COALESCE(password_actualizado_en, creado_en, CURRENT_TIMESTAMP)');
    } catch (e) {
      // La columna ya existe.
    }

    try {
      db.run('ALTER TABLE audit_logs ADD COLUMN hash_anterior TEXT');
    } catch (e) {
      // La columna ya existe.
    }

    try {
      db.run('ALTER TABLE audit_logs ADD COLUMN hash_evento TEXT');
    } catch (e) {
      // La columna ya existe.
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        tipo TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        ciudad TEXT,
        direccion TEXT,
        ventaMes REAL DEFAULT 0,
        cobradoMes REAL DEFAULT 0,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      db.run('ALTER TABLE clientes ADD COLUMN email TEXT');
    } catch (e) {
      // La columna ya existe en bases creadas despues de esta version.
    }

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
      CREATE TABLE IF NOT EXISTS movimientos_financieros (
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'egreso')),
        categoria TEXT NOT NULL,
        concepto TEXT NOT NULL,
        tercero TEXT,
        metodoPago TEXT,
        referencia TEXT,
        monto REAL NOT NULL,
        origen TEXT DEFAULT 'manual',
        notas TEXT,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // Migración: agregar saldoPendiente a ventas existentes
    try {
      db.run('ALTER TABLE ventas ADD COLUMN saldoPendiente REAL');
      // Inicializar: ventas a crédito deben su total, las canceladas no deben nada
      db.run("UPDATE ventas SET saldoPendiente = CASE WHEN tipoPago = 'credito' THEN total ELSE 0 END");
      db.run("UPDATE ventas SET estado = CASE WHEN tipoPago = 'credito' THEN 'pendiente' ELSE 'pagado' END");
      console.log('✅ Migración saldoPendiente aplicada');
    } catch (e) {
      // La columna ya existe, no hacer nada
    }

    // Verificar si admin existe
    const result = db.exec("SELECT * FROM usuarios WHERE usuario = 'admin'");
    if (result.length === 0 || result[0].values.length === 0) {
      if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
        throw new Error('ADMIN_PASSWORD es obligatorio para crear admin en produccion');
      }
      const initialPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPass = bcrypt.hashSync(initialPassword, 10);
      db.run(
        "INSERT INTO usuarios (id, nombre, usuario, password, rol, password_actualizado_en) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        [crypto.randomUUID(), 'Administrador', 'admin', hashedPass, 'admin']
      );
      console.log('✅ Usuario admin creado');
    }

    if (process.env.ENABLE_DEMO_DATA === 'true' || process.env.NODE_ENV !== 'production') {
      seedDemoData();
    }

    backfillAuditHashes();

    // Guardar DB
    saveDB();
    console.log('✅ Base de datos SQL.js inicializada');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

function seedDemoData() {
  const runMany = (sql, rows) => rows.forEach((row) => db.run(sql, row));
  const demoPass = bcrypt.hashSync('demo123', 10);

  runMany(
    `INSERT OR IGNORE INTO usuarios (id, nombre, usuario, email, password, rol, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      ['demo-user-1', 'Supervisor Planta', 'supervisor', 'supervisor@jaboncontrol.local', demoPass, 'supervisor', 'activo'],
      ['demo-user-2', 'Operario Produccion', 'operario', 'operario@jaboncontrol.local', demoPass, 'operario', 'activo'],
      ['demo-user-3', 'Encargada Ventas', 'ventas', 'ventas@jaboncontrol.local', demoPass, 'supervisor', 'activo'],
      ['demo-user-4', 'Responsable Finanzas', 'finanzas', 'finanzas@jaboncontrol.local', demoPass, 'supervisor', 'activo'],
      ['demo-user-5', 'Control Calidad', 'calidad', 'calidad@jaboncontrol.local', demoPass, 'operario', 'activo'],
      ['demo-user-6', 'Usuario Inactivo', 'inactivo', 'inactivo@jaboncontrol.local', demoPass, 'operario', 'inactivo'],
    ]
  );

  runMany(
    `INSERT OR IGNORE INTO clientes (id, nombre, tipo, telefono, ciudad, direccion, ventaMes, cobradoMes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ['demo-cli-1', 'Distribuidora Litoral', 'distribuidor', '+591 72100001', 'Santa Cruz', 'Av. Cristo Redentor 4to anillo', 18400, 15200],
      ['demo-cli-2', 'Supermercado El Sol', 'retailer', '+591 72100002', 'La Paz', 'Zona Sopocachi, calle Rosendo Gutierrez', 9800, 6400],
      ['demo-cli-3', 'Comercial Norte', 'distribuidor', '+591 72100003', 'Riberalta', 'Barrio Central, avenida principal', 12600, 12600],
      ['demo-cli-4', 'Hotel Amazonas', 'consumidor-final', '+591 72100004', 'Trinidad', 'Zona hotelera', 4200, 3200],
      ['demo-cli-5', 'Mercado Popular Beni', 'retailer', '+591 72100005', 'Guayaramerin', 'Mercado central puesto 18', 7600, 4600],
      ['demo-cli-6', 'Limpieza Industrial SRL', 'distribuidor', '+591 72100006', 'Cochabamba', 'Parque industrial', 21400, 18000],
    ]
  );

  runMany(
    `INSERT OR IGNORE INTO ventas
     (id, numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago, estado, saldoPendiente)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ['demo-ven-1', 'NE-1001', '2026-07-01', 'Distribuidora Litoral', 'Cajas', 180, 22, 3960, 'contado', 'pagado', 0],
      ['demo-ven-2', 'NE-1002', '2026-07-01', 'Supermercado El Sol', 'Barras', 120, 18, 2160, 'credito', 'parcial', 760],
      ['demo-ven-3', 'NE-1003', '2026-07-02', 'Comercial Norte', 'Nodulos', 95, 16, 1520, 'contado', 'pagado', 0],
      ['demo-ven-4', 'NE-1004', '2026-07-02', 'Hotel Amazonas', 'Cajas', 60, 23, 1380, 'credito', 'pendiente', 1380],
      ['demo-ven-5', 'NE-1005', '2026-07-03', 'Mercado Popular Beni', 'Barras', 210, 17, 3570, 'credito', 'pendiente', 3570],
      ['demo-ven-6', 'NE-1006', '2026-07-03', 'Limpieza Industrial SRL', 'Cajas', 300, 21, 6300, 'contado', 'pagado', 0],
    ]
  );

  runMany(
    `INSERT OR IGNORE INTO cobros (id, fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      ['demo-cob-1', '2026-07-01', 'Distribuidora Litoral', 3960, 'transferencia', 'NE-1001'],
      ['demo-cob-2', '2026-07-01', 'Supermercado El Sol', 1400, 'efectivo', 'NE-1002'],
      ['demo-cob-3', '2026-07-02', 'Comercial Norte', 1520, 'transferencia', 'NE-1003'],
      ['demo-cob-4', '2026-07-03', 'Hotel Amazonas', 0, 'efectivo', 'Pendiente NE-1004'],
      ['demo-cob-5', '2026-07-03', 'Mercado Popular Beni', 0, 'cheque', 'Pendiente NE-1005'],
      ['demo-cob-6', '2026-07-04', 'Limpieza Industrial SRL', 6300, 'transferencia', 'NE-1006'],
    ]
  );

  runMany(
    `INSERT OR IGNORE INTO hornadas
     (id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ['demo-hor-1', 'H-0701', '2026-07-01', '07:00', 'Carlos Mendoza', 8, 120, 80, 45, 20, 180, 12, 292, 97.3, 'Lote estable'],
      ['demo-hor-2', 'H-0702', '2026-07-01', '13:30', 'Ana Ruiz', 7, 110, 75, 40, 18, 165, 10, 265, 95.1, 'Color uniforme'],
      ['demo-hor-3', 'H-0703', '2026-07-02', '08:15', 'Pedro Gutierrez', 9, 130, 90, 50, 25, 190, 15, 310, 98.4, 'Buen rendimiento'],
      ['demo-hor-4', 'H-0704', '2026-07-02', '14:00', 'Rosa Vargas', 8, 118, 84, 42, 19, 176, 11, 286, 96.2, 'Ajuste menor de mezcla'],
      ['demo-hor-5', 'H-0705', '2026-07-03', '07:45', 'Carlos Mendoza', 8, 125, 82, 46, 22, 185, 13, 301, 97.8, 'Sin novedades'],
      ['demo-hor-6', 'H-0706', '2026-07-03', '15:10', 'Ana Ruiz', 7, 108, 74, 38, 18, 160, 9, 258, 94.8, 'Revisar temperatura final'],
    ]
  );

  runMany(
    `INSERT OR IGNORE INTO recepciones
     (id, fecha, proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ['demo-mat-1', '2026-07-01', 'QuimBolivia', 'NaOH 25kg', 30, 'bolsas', 85, 2550, 'recibido'],
      ['demo-mat-2', '2026-07-01', 'Aceites del Sur', 'Aceite quemado', 620, 'kg', 3.2, 1984, 'recibido'],
      ['demo-mat-3', '2026-07-02', 'Ganadera Beni', 'Sebo fundido', 840, 'kg', 4.1, 3444, 'recibido'],
      ['demo-mat-4', '2026-07-02', 'Amazon Nuts', 'Aceite de almendra', 180, 'kg', 11.5, 2070, 'pendiente'],
      ['demo-mat-7', '2026-07-03', 'Recolectores Beni', 'Almendra podrida', 160, 'kg', 2.8, 448, 'recibido'],
      ['demo-mat-5', '2026-07-03', 'Envases Oriente', 'Cajas de empaque', 900, 'unidades', 1.4, 1260, 'recibido'],
      ['demo-mat-6', '2026-07-03', 'Etiquetas Express', 'Etiquetas producto', 1500, 'unidades', 0.28, 420, 'recibido'],
    ]
  );

  runMany(
    `INSERT OR IGNORE INTO movimientos_financieros
     (id, fecha, tipo, categoria, concepto, tercero, metodoPago, referencia, monto, origen, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ['demo-fin-1', '2026-07-01', 'ingreso', 'Ventas', 'Cobro NE-1001', 'Distribuidora Litoral', 'transferencia', 'NE-1001', 3960, 'demo', 'Pago completo'],
      ['demo-fin-2', '2026-07-01', 'egreso', 'Materia prima', 'Compra NaOH 25kg', 'QuimBolivia', 'transferencia', 'MAT-0701', 2550, 'demo', 'Ingreso a almacen'],
      ['demo-fin-3', '2026-07-02', 'ingreso', 'Cobros', 'Abono cliente credito', 'Supermercado El Sol', 'efectivo', 'NE-1002', 1400, 'demo', 'Abono parcial'],
      ['demo-fin-4', '2026-07-02', 'egreso', 'Mantenimiento', 'Revision selladora', 'Tecnico externo', 'efectivo', 'MANT-22', 680, 'demo', 'Servicio preventivo'],
      ['demo-fin-5', '2026-07-03', 'egreso', 'Logistica', 'Transporte pedidos', 'Transportes Beni', 'transferencia', 'LOG-14', 920, 'demo', 'Distribucion regional'],
      ['demo-fin-6', '2026-07-04', 'ingreso', 'Ventas', 'Cobro NE-1006', 'Limpieza Industrial SRL', 'transferencia', 'NE-1006', 6300, 'demo', 'Pago completo'],
    ]
  );
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

function safeJson(value) {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value ?? null);
  } catch (error) {
    return JSON.stringify({ error: 'No se pudo serializar' });
  }
}

function backfillAuditHashes() {
  if (!db) return;
  const result = db.exec('SELECT rowid, * FROM audit_logs ORDER BY creado_en ASC, rowid ASC');
  if (result.length === 0) return;
  const columns = result[0].columns;
  let previousHash = '';
  result[0].values.forEach((row) => {
    const log = {};
    columns.forEach((col, idx) => {
      log[col] = row[idx];
    });
    const hasHash = Boolean(log.hash_evento);
    const hashAnterior = hasHash ? (log.hash_anterior || '') : previousHash;
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
      hashAnterior,
    ].join('|');
    const hashEvento = hasHash ? log.hash_evento : crypto.createHash('sha256').update(payload).digest('hex');
    if (!hasHash) {
      db.run('UPDATE audit_logs SET hash_anterior = ?, hash_evento = ? WHERE rowid = ?', [hashAnterior, hashEvento, log.rowid]);
    }
    previousHash = hashEvento || '';
  });
}

function logAudit(req, accion, tabla, registroId, anteriores, nuevos, detalle) {
  if (!db) return;
  const actor = req?.user || {};
  const id = crypto.randomUUID();
  const previousHashResult = db.exec('SELECT hash_evento FROM audit_logs ORDER BY creado_en DESC, rowid DESC LIMIT 1');
  const hashAnterior = previousHashResult.length ? previousHashResult[0].values[0][0] || '' : '';
  const valoresAnteriores = safeJson(anteriores);
  const valoresNuevos = safeJson(nuevos);
  const payload = [
    id,
    actor.id || '',
    actor.usuario || actor.nombre || 'sistema',
    actor.rol || '',
    accion,
    tabla,
    registroId || '',
    detalle || '',
    valoresAnteriores || '',
    valoresNuevos || '',
    hashAnterior,
  ].join('|');
  const hashEvento = crypto.createHash('sha256').update(payload).digest('hex');
  db.run(
    `INSERT INTO audit_logs
      (id, usuario_id, usuario, rol, accion, tabla, registro_id, detalle, valores_anteriores, valores_nuevos, hash_anterior, hash_evento)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      actor.id || null,
      actor.usuario || actor.nombre || 'sistema',
      actor.rol || null,
      accion,
      tabla,
      registroId || null,
      detalle || null,
      valoresAnteriores,
      valoresNuevos,
      hashAnterior,
      hashEvento,
    ]
  );
  saveDB();
}

module.exports = initDB;
module.exports.db = {
  get: () => db,
  save: saveDB
};
module.exports.logAudit = logAudit;

