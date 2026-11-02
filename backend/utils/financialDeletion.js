const db = require('../db');

const round = value => Math.round(Number(value || 0) * 100) / 100;
const fail = (message, status) => Object.assign(new Error(message), { status });

async function recalculate(executor, cliente) {
  const sales = await executor.all('SELECT id, total, tipoPago FROM ventas WHERE cliente = ? ORDER BY fecha ASC, creado_en ASC, id ASC', [cliente]);
  const payments = await executor.get('SELECT COALESCE(SUM(montoCobrado), 0) AS total FROM cobros WHERE cliente = ?', [cliente]);
  let remaining = round(payments.total);
  for (const sale of sales) {
    let balance = sale.tipoPago === 'credito' ? round(sale.total) : 0;
    const applied = Math.min(remaining, balance);
    balance = round(balance - applied);
    remaining = round(remaining - applied);
    const estado = balance <= 0 ? 'pagado' : balance < round(sale.total) ? 'parcial' : 'pendiente';
    await executor.run('UPDATE ventas SET saldoPendiente = ?, estado = ? WHERE id = ?', [balance, estado, sale.id]);
  }
}

async function deleteFinancialRecord(req, table) {
  if (!['ventas', 'cobros'].includes(table)) throw new Error('Tabla no permitida');
  const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo.trim() : '';
  if (motivo.length < 5 || motivo.length > 500) throw fail('Indique un motivo de entre 5 y 500 caracteres.', 400);
  return withFinancialWrite(async executor => {
    const previous = await executor.get(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!previous) throw fail(table === 'ventas' ? 'Venta no encontrada o ya eliminada.' : 'Cobro no encontrado o ya eliminado.', 404);
    if (table === 'ventas') {
      await recalculate(executor, previous.cliente);
      const current = await executor.get('SELECT * FROM ventas WHERE id = ?', [previous.id]);
      const payments = await executor.get('SELECT COALESCE(SUM(montoCobrado), 0) AS total FROM cobros WHERE cliente = ?', [previous.cliente]);
      const credit = await executor.get("SELECT COALESCE(SUM(total), 0) AS total FROM ventas WHERE cliente = ? AND tipoPago = 'credito' AND id <> ?", [previous.cliente, previous.id]);
      if ((previous.tipoPago === 'credito' && round(current.saldoPendiente) < round(current.total)) || round(payments.total) > round(credit.total)) {
        throw fail(`La nota ${previous.numeroNE} respalda cobros de ${previous.cliente}. Primero elimine los cobros de prueba aplicados desde Cobros y luego vuelva a eliminar la venta. No se borraron registros.`, 409);
      }
    }
    const snapshot = { registro: previous, motivo, fecha: new Date().toISOString(), usuario: req.user.usuario };
    await executor.run('INSERT INTO app_records (modulo, id, payload) VALUES (?, ?, ?)', [`${table}_anulados`, previous.id, JSON.stringify(snapshot)]);
    await executor.run(`DELETE FROM ${table} WHERE id = ?`, [previous.id]);
    await recalculate(executor, previous.cliente);
    await db.logAudit(req, 'anular', table, previous.id, previous, { motivo, anulado: true }, `${table === 'ventas' ? 'Venta' : 'Cobro'} anulado: ${motivo}`, executor);
    return { message: table === 'ventas' ? 'Venta eliminada del registro activo.' : 'Cobro eliminado. Se actualizo la deuda del cliente.', ventasActualizadas: await executor.all('SELECT * FROM ventas WHERE cliente = ?', [previous.cliente]) };
  });
}

async function withFinancialWrite(work) {
  return db.withTransaction(async executor => {
    // All sales/payment mutations share this lock: debt cannot change between validation and save.
    if (db.isPostgres()) await executor.run('LOCK TABLE ventas, cobros IN SHARE ROW EXCLUSIVE MODE');
    return work(executor);
  });
}

module.exports = { deleteFinancialRecord, withFinancialWrite };
