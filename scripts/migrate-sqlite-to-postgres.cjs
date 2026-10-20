const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('../backend/node_modules/sql.js');
const { Pool } = require('../backend/node_modules/pg');
require('../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '../.env.render.local'), quiet: true });

const tables = ['clientes', 'ventas', 'cobros', 'movimientos_financieros', 'hornadas', 'recepciones', 'app_records', 'audit_logs'];

(async () => {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL antes de migrar.');
  const SQL = await initSqlJs();
  const sourcePath = path.resolve(__dirname, '../backend/database.db');
  const source = new SQL.Database(fs.readFileSync(sourcePath));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const table of tables) {
      const { rows } = await client.query(`SELECT COUNT(*) AS total FROM ${table}`);
      if (Number(rows[0].total)) throw new Error(`Destino no vacio: ${table}. Se cancela para evitar duplicados.`);
    }
    const counts = {};
    for (const table of tables) {
      const result = source.exec(`SELECT * FROM ${table}`)[0];
      counts[table] = result?.values.length || 0;
      if (!result) continue;
      const columns = result.columns.map((column) => column.toLowerCase());
      if (columns.some((column) => !/^[a-z_]+$/.test(column))) throw new Error('Columna inesperada.');
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(',');
      for (const values of result.values) {
        await client.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`, values);
      }
    }
    await client.query('COMMIT');
    console.log('Datos operativos migrados; el administrador remoto mantiene su clave nueva.');
    console.log(JSON.stringify(counts));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
    source.close();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
