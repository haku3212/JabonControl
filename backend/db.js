const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const usePostgres = Boolean(process.env.DATABASE_URL);
const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
const dbPath = process.env.DATABASE || (volumePath ? path.join(volumePath, 'database.db') : './database.db');

let sqlDb = null;
let pgPool = null;

function toPgSql(sql) {
  let index = 0;
  return sql
    .replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO')
    .replace(/\?/g, () => `$${++index}`);
}

function normalizePgRow(row) {
  const keyMap = {
    ventames: 'ventaMes',
    cobradomes: 'cobradoMes',
    numerone: 'numeroNE',
    preciounitario: 'precioUnitario',
    unidadesporcaja: 'unidadesPorCaja',
    tipopago: 'tipoPago',
    saldopendiente: 'saldoPendiente',
    montocobrado: 'montoCobrado',
    metodopago: 'metodoPago',
    notascorrespondientes: 'notasCorrespondientes',
    horainicio: 'horaInicio',
    naohvolumen: 'naohVolumen',
    sebofund: 'seboFund',
    aceitequem: 'aceiteQuem',
    aceitecrudo: 'aceiteCrudo',
    aceitealmendra: 'aceiteAlmendra',
    jabonrecicl: 'jabonRecicl',
    producciontotal: 'produccionTotal',
    rendimiento: 'rendimiento',
    preciototal: 'precioTotal',
  };
  return Object.entries(row).reduce((normalized, [key, value]) => {
    normalized[keyMap[key] || key] = value;
    return normalized;
  }, {});
}

function resultToObjects(result) {
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

async function run(sql, params = []) {
  if (usePostgres) {
    const shouldIgnoreConflicts = /INSERT OR IGNORE INTO/i.test(sql);
    const pgSql = toPgSql(sql);
    const finalSql = shouldIgnoreConflicts && !/ON\s+CONFLICT/i.test(pgSql)
      ? `${pgSql} ON CONFLICT DO NOTHING`
      : pgSql;
    await pgPool.query(finalSql, params);
    return;
  }
  sqlDb.run(sql, params);
}

async function all(sql, params = []) {
  if (usePostgres) {
    const result = await pgPool.query(toPgSql(sql), params);
    return result.rows.map(normalizePgRow);
  }
  return resultToObjects(sqlDb.exec(sql, params));
}

async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

async function saveDB() {
  if (usePostgres || !sqlDb) return;
  const data = sqlDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function tryRun(sql, params = []) {
  try {
    await run(sql, params);
  } catch {
    // Migracion ya aplicada o columna existente.
  }
}

function timestampType() {
  return usePostgres ? 'TIMESTAMPTZ' : 'DATETIME';
}

async function initStorage() {
  if (usePostgres) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
    await pgPool.query('SELECT 1');
    return;
  }

  const SQL = await initSqlJs();
  let data = null;
  try {
    data = fs.readFileSync(dbPath);
  } catch {
    data = null;
  }
  sqlDb = data ? new SQL.Database(data) : new SQL.Database();
}

async function createTables() {
  const ts = timestampType();

  await run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      usuario TEXT UNIQUE NOT NULL,
      email TEXT,
      password TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'operario',
      estado TEXT DEFAULT 'activo',
      ultimo_acceso ${ts},
      password_actualizado_en ${ts} DEFAULT CURRENT_TIMESTAMP,
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
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
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tryRun(`ALTER TABLE usuarios ADD COLUMN password_actualizado_en ${ts}`);
  await tryRun('UPDATE usuarios SET password_actualizado_en = COALESCE(password_actualizado_en, creado_en, CURRENT_TIMESTAMP)');
  await tryRun('ALTER TABLE audit_logs ADD COLUMN hash_anterior TEXT');
  await tryRun('ALTER TABLE audit_logs ADD COLUMN hash_evento TEXT');

  await run(`
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
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await tryRun('ALTER TABLE clientes ADD COLUMN email TEXT');

  await run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id TEXT PRIMARY KEY,
      numeroNE TEXT UNIQUE NOT NULL,
      fecha TEXT NOT NULL,
      cliente TEXT NOT NULL,
      formato TEXT NOT NULL,
      cantidad REAL NOT NULL,
      unidadesPorCaja REAL DEFAULT 50,
      precioUnitario REAL NOT NULL,
      total REAL NOT NULL,
      tipoPago TEXT NOT NULL,
      estado TEXT DEFAULT 'pendiente',
      saldoPendiente REAL,
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS cobros (
      id TEXT PRIMARY KEY,
      fecha TEXT NOT NULL,
      cliente TEXT NOT NULL,
      montoCobrado REAL NOT NULL,
      metodoPago TEXT NOT NULL,
      notasCorrespondientes TEXT,
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
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
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS app_records (
      modulo TEXT NOT NULL,
      id TEXT NOT NULL,
      payload TEXT NOT NULL,
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP,
      actualizado_en ${ts} DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (modulo, id)
    )
  `);

  await run(`
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
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
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
      creado_en ${ts} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tryRun('ALTER TABLE ventas ADD COLUMN saldoPendiente REAL');
  await tryRun('ALTER TABLE ventas ADD COLUMN unidadesPorCaja REAL DEFAULT 50');
  await run("UPDATE ventas SET unidadesPorCaja = 50 WHERE unidadesPorCaja IS NULL AND LOWER(formato) LIKE '%caja%'");
  await run("UPDATE ventas SET unidadesPorCaja = 1 WHERE unidadesPorCaja IS NULL");
  await run("UPDATE ventas SET cantidad = 18, unidadesPorCaja = 50, total = 396 WHERE id = 'demo-ven-1'");
  await run("UPDATE ventas SET cantidad = 6, unidadesPorCaja = 50, total = 138, saldoPendiente = CASE WHEN saldoPendiente > 138 THEN 138 ELSE saldoPendiente END WHERE id = 'demo-ven-4'");
  await run("UPDATE ventas SET cantidad = 30, unidadesPorCaja = 50, total = 630 WHERE id = 'demo-ven-6'");
  await run("UPDATE ventas SET saldoPendiente = CASE WHEN tipoPago = 'credito' THEN total ELSE 0 END WHERE saldoPendiente IS NULL");
  await run("UPDATE ventas SET estado = CASE WHEN tipoPago = 'credito' AND COALESCE(saldoPendiente, 0) > 0 THEN 'pendiente' ELSE 'pagado' END WHERE estado IS NULL");
}

async function ensureAdmin() {
  const admin = await get("SELECT * FROM usuarios WHERE usuario = 'admin'");
  if (admin) return;

  const generatedPassword = process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD
    ? crypto.randomBytes(12).toString('base64url')
    : null;
  const initialPassword = process.env.ADMIN_PASSWORD || generatedPassword || 'admin123';
  if (generatedPassword) {
    console.warn(`ADMIN_TEMP_PASSWORD=${generatedPassword}`);
    console.warn('Configure ADMIN_PASSWORD fijo en Render despues de entrar y crear su usuario definitivo.');
  }
  const hashedPass = bcrypt.hashSync(initialPassword, 10);
  await run(
    'INSERT INTO usuarios (id, nombre, usuario, password, rol, password_actualizado_en) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    [crypto.randomUUID(), 'Administrador', 'admin', hashedPass, 'admin']
  );
}

async function seedDemoData() {
  const demoPass = bcrypt.hashSync('demo123', 10);
  const runMany = async (sql, rows) => {
    for (const row of rows) await run(sql, row);
  };

  await runMany(
    `INSERT OR IGNORE INTO usuarios (id, nombre, usuario, email, password, rol, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      ['demo-user-1', 'Supervisor Planta', 'supervisor', 'supervisor@jaboncontrol.local', demoPass, 'supervisor', 'activo'],
      ['demo-user-2', 'Operario Produccion', 'operario', 'operario@jaboncontrol.local', demoPass, 'operario', 'activo'],
      ['demo-user-3', 'Encargada Ventas', 'ventas', 'ventas@jaboncontrol.local', demoPass, 'supervisor', 'activo'],
      ['demo-user-4', 'Responsable Finanzas', 'finanzas', 'finanzas@jaboncontrol.local', demoPass, 'finanzas', 'activo'],
      ['demo-user-5', 'Control Calidad', 'calidad', 'calidad@jaboncontrol.local', demoPass, 'operario', 'activo'],
      ['demo-user-6', 'Usuario Inactivo', 'inactivo', 'inactivo@jaboncontrol.local', demoPass, 'operario', 'inactivo'],
    ]
  );

  await runMany(
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

  await runMany(
    `INSERT OR IGNORE INTO ventas
     (id, numeroNE, fecha, cliente, formato, cantidad, unidadesPorCaja, precioUnitario, total, tipoPago, estado, saldoPendiente)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ['demo-ven-1', 'NE-1001', '2026-07-01', 'Distribuidora Litoral', 'Cajas', 18, 50, 22, 396, 'contado', 'pagado', 0],
      ['demo-ven-2', 'NE-1002', '2026-07-01', 'Supermercado El Sol', 'Barras', 120, 1, 18, 2160, 'credito', 'parcial', 760],
      ['demo-ven-3', 'NE-1003', '2026-07-02', 'Comercial Norte', 'Nodulos', 95, 1, 16, 1520, 'contado', 'pagado', 0],
      ['demo-ven-4', 'NE-1004', '2026-07-02', 'Hotel Amazonas', 'Cajas', 6, 50, 23, 138, 'credito', 'pendiente', 138],
      ['demo-ven-5', 'NE-1005', '2026-07-03', 'Mercado Popular Beni', 'Barras', 210, 1, 17, 3570, 'credito', 'pendiente', 3570],
      ['demo-ven-6', 'NE-1006', '2026-07-03', 'Limpieza Industrial SRL', 'Cajas', 30, 50, 21, 630, 'contado', 'pagado', 0],
    ]
  );

  await runMany(
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

  await runMany(
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

  await runMany(
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

  await runMany(
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

  const acabadoDemo = [
    { id: 'demo-aca-1', fecha: '2026-07-01', area: 'compresora', operarios: 'Pedro G., Ana R.', piezas: 1200, bandejas: 24, kilos: 480, observaciones: 'Turno normal' },
    { id: 'demo-aca-2', fecha: '2026-07-01', area: 'sellado', operarios: 'Rosa V., Miguel P.', piezas: 980, bandejas: 20, kilos: 392, observaciones: 'Sellado de cajas lote NE-1001' },
    { id: 'demo-aca-3', fecha: '2026-07-02', area: 'compresora', operarios: 'Carlos M., Pedro G.', piezas: 1350, bandejas: 27, kilos: 540, observaciones: 'Buen rendimiento' },
    { id: 'demo-aca-4', fecha: '2026-07-02', area: 'sellado', operarios: 'Ana R., Rosa V.', piezas: 1110, bandejas: 22, kilos: 444, observaciones: 'Empaque para cliente Comercial Norte' },
    { id: 'demo-aca-5', fecha: '2026-07-03', area: 'compresora', operarios: 'Miguel P., Carlos M.', piezas: 1280, bandejas: 26, kilos: 512, observaciones: 'Revisar limpieza final' },
    { id: 'demo-aca-6', fecha: '2026-07-03', area: 'sellado', operarios: 'Pedro G., Rosa V.', piezas: 1040, bandejas: 21, kilos: 416, observaciones: 'Sin novedades' },
  ];

  await runMany(
    `INSERT OR IGNORE INTO app_records (modulo, id, payload)
     VALUES (?, ?, ?)`,
    acabadoDemo.map((item) => ['acabado', item.id, JSON.stringify(item)])
  );
}

function safeJson(value) {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return JSON.stringify({ error: 'No se pudo serializar' });
  }
}

function auditPayload(log, hashAnterior) {
  return [
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
    hashAnterior || '',
  ].join('|');
}

async function backfillAuditHashes() {
  const logs = await all('SELECT * FROM audit_logs ORDER BY creado_en ASC');
  let previousHash = '';
  for (const log of logs) {
    const hasHash = Boolean(log.hash_evento);
    const hashAnterior = hasHash ? (log.hash_anterior || '') : previousHash;
    const hashEvento = hasHash ? log.hash_evento : crypto.createHash('sha256').update(auditPayload(log, hashAnterior)).digest('hex');
    if (!hasHash) {
      await run('UPDATE audit_logs SET hash_anterior = ?, hash_evento = ? WHERE id = ?', [hashAnterior, hashEvento, log.id]);
    }
    previousHash = hashEvento || '';
  }
}

async function logAudit(req, accion, tabla, registroId, anteriores, nuevos, detalle) {
  const actor = req?.user || {};
  const id = crypto.randomUUID();
  const previous = await get('SELECT hash_evento FROM audit_logs ORDER BY creado_en DESC LIMIT 1');
  const hashAnterior = previous?.hash_evento || '';
  const valoresAnteriores = safeJson(anteriores);
  const valoresNuevos = safeJson(nuevos);
  const log = {
    id,
    usuario_id: actor.id || null,
    usuario: actor.usuario || actor.nombre || 'sistema',
    rol: actor.rol || null,
    accion,
    tabla,
    registro_id: registroId || null,
    detalle: detalle || null,
    valores_anteriores: valoresAnteriores,
    valores_nuevos: valoresNuevos,
  };
  const hashEvento = crypto.createHash('sha256').update(auditPayload(log, hashAnterior)).digest('hex');

  await run(
    `INSERT INTO audit_logs
      (id, usuario_id, usuario, rol, accion, tabla, registro_id, detalle, valores_anteriores, valores_nuevos, hash_anterior, hash_evento)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      log.usuario_id,
      log.usuario,
      log.rol,
      accion,
      tabla,
      log.registro_id,
      log.detalle,
      valoresAnteriores,
      valoresNuevos,
      hashAnterior,
      hashEvento,
    ]
  );
  await saveDB();
}

async function initDB() {
  await initStorage();
  await createTables();
  await ensureAdmin();
  if (process.env.ENABLE_DEMO_DATA === 'true' || process.env.NODE_ENV !== 'production') {
    await seedDemoData();
  }
  await backfillAuditHashes();
  await saveDB();
  console.log(usePostgres ? 'Base de datos PostgreSQL inicializada' : 'Base de datos SQL.js inicializada');
}

module.exports = initDB;
module.exports.all = all;
module.exports.get = get;
module.exports.run = run;
module.exports.save = saveDB;
module.exports.logAudit = logAudit;
module.exports.isPostgres = () => usePostgres;
