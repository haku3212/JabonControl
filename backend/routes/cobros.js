const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');
const { deleteFinancialRecord, withFinancialWrite } = require('../utils/financialDeletion');
const invalid = (message, status = 400) => Object.assign(new Error(message), { status });

async function recalcularSaldosCliente(cliente, executor = dbModule) {
  const ventas = await executor.all(
    'SELECT id, total, tipoPago FROM ventas WHERE cliente = ? ORDER BY fecha ASC, creado_en ASC, id ASC',
    [cliente]
  );
  const cobros = await executor.all(
    'SELECT montoCobrado FROM cobros WHERE cliente = ? ORDER BY fecha ASC, creado_en ASC',
    [cliente]
  );

  const saldos = new Map();
  ventas.forEach((venta) => {
    saldos.set(venta.id, venta.tipoPago === 'credito' ? Number(venta.total || 0) : 0);
  });

  let restanteCobros = cobros.reduce((sum, cobro) => sum + Number(cobro.montoCobrado || 0), 0);
  for (const venta of ventas) {
    const saldo = saldos.get(venta.id) || 0;
    if (saldo <= 0 || restanteCobros <= 0) continue;
    const aplicado = Math.min(restanteCobros, saldo);
    saldos.set(venta.id, Math.round((saldo - aplicado) * 100) / 100);
    restanteCobros = Math.round((restanteCobros - aplicado) * 100) / 100;
  }

  for (const venta of ventas) {
    const nuevoSaldo = saldos.get(venta.id) || 0;
    const estado = nuevoSaldo <= 0 ? 'pagado' : nuevoSaldo < Number(venta.total || 0) ? 'parcial' : 'pendiente';
    await executor.run('UPDATE ventas SET saldoPendiente = ?, estado = ? WHERE id = ?', [nuevoSaldo, estado, venta.id]);
  }
}

async function totalDeudaCliente(cliente, cobroIdIgnorado = null, executor = dbModule) {
  const ventas = await executor.all(
    'SELECT total, tipoPago FROM ventas WHERE cliente = ?',
    [cliente]
  );
  const cobros = cobroIdIgnorado
    ? await executor.all('SELECT id, montoCobrado FROM cobros WHERE cliente = ? AND id <> ?', [cliente, cobroIdIgnorado])
    : await executor.all('SELECT id, montoCobrado FROM cobros WHERE cliente = ?', [cliente]);
  const totalCredito = ventas.reduce((sum, venta) => (
    sum + (venta.tipoPago === 'credito' ? Number(venta.total || 0) : 0)
  ), 0);
  const totalCobrado = cobros.reduce((sum, cobro) => sum + Number(cobro.montoCobrado || 0), 0);
  return Math.max(0, Math.round((totalCredito - totalCobrado) * 100) / 100);
}

router.get('/', async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT * FROM cobros ORDER BY fecha DESC');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await withFinancialWrite(async executor => {
    const { fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes } = req.body;
    const monto = Number(montoCobrado);
    if (!cliente || !Number.isFinite(monto) || monto <= 0 || !['efectivo', 'transferencia', 'deposito', 'cheque'].includes(metodoPago)) {
      throw invalid('Campos requeridos');
    }
    const deuda = await totalDeudaCliente(cliente, null, executor);
    if (monto > deuda) {
      throw invalid(`El cobro excede la deuda pendiente. Deuda actual: ${deuda}.`);
    }

    const id = uuid();
    await executor.run(
      `INSERT INTO cobros (id, fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, fecha || new Date().toISOString().split('T')[0], cliente, monto, metodoPago, notasCorrespondientes || '']
    );

    await recalcularSaldosCliente(cliente, executor);
    await logAudit(req, 'crear', 'cobros', id, null, { ...req.body, montoCobrado: monto }, `Cobro de ${monto} registrado para ${cliente}`, executor);
    return { id, message: 'Cobro registrado' };
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireRoles('admin', 'supervisor', 'supervisor_ventas', 'finanzas'), async (req, res) => {
  try {
    await withFinancialWrite(async executor => {
    const previous = await executor.get('SELECT * FROM cobros WHERE id = ?', [req.params.id]);
    if (!previous) throw invalid('Cobro no encontrado', 404);

    const data = {
      fecha: req.body.fecha || previous.fecha,
      cliente: req.body.cliente || previous.cliente,
      montoCobrado: Number(req.body.montoCobrado ?? previous.montoCobrado),
      metodoPago: req.body.metodoPago || previous.metodoPago,
      notasCorrespondientes: req.body.notasCorrespondientes ?? previous.notasCorrespondientes,
    };

    if (!data.cliente || !Number.isFinite(data.montoCobrado) || data.montoCobrado <= 0 || !['efectivo', 'transferencia', 'deposito', 'cheque'].includes(data.metodoPago)) {
      throw invalid('Cliente y monto son obligatorios');
    }
    const deuda = await totalDeudaCliente(data.cliente, req.params.id, executor);
    if (data.montoCobrado > deuda) {
      throw invalid(`El cobro excede la deuda pendiente. Deuda actual: ${deuda}.`);
    }

    await executor.run(
      'UPDATE cobros SET fecha = ?, cliente = ?, montoCobrado = ?, metodoPago = ?, notasCorrespondientes = ? WHERE id = ?',
      [data.fecha, data.cliente, data.montoCobrado, data.metodoPago, data.notasCorrespondientes, req.params.id]
    );
    await recalcularSaldosCliente(previous.cliente, executor);
    if (previous.cliente !== data.cliente) await recalcularSaldosCliente(data.cliente, executor);
    await logAudit(req, 'actualizar', 'cobros', req.params.id, previous, { id: req.params.id, ...data }, `Cobro actualizado para ${data.cliente}`, executor);
    });
    res.json({ message: 'Cobro actualizado' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    res.json(await deleteFinancialRecord(req, 'cobros'));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo eliminar el cobro. No se confirmaron cambios.' });
  }
});

module.exports = router;
