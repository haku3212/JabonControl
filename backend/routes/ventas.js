const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');
const { getFinishedInventory } = require('../utils/inventory');
const { deleteFinancialRecord, withFinancialWrite } = require('../utils/financialDeletion');
const invalid = (message, status = 400) => Object.assign(new Error(message), { status });

const VALID_TIPOS_PAGO = new Set(['contado', 'credito', 'transferencia']);

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

async function nextNumeroNE(executor = dbModule) {
  const rows = await executor.all("SELECT numeroNE FROM ventas WHERE numeroNE LIKE 'NE-%'");
  const archived = await executor.all("SELECT payload FROM app_records WHERE modulo = 'ventas_anulados'");
  rows.push(...archived.map(row => ({ numeroNE: JSON.parse(row.payload).registro.numeroNE })));
  const max = rows.reduce((current, row) => {
    const match = String(row.numeroNE || '').match(/^NE-(\d+)$/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `NE-${String(max + 1).padStart(4, '0')}`;
}

async function preservesPayments(previous, next, executor = dbModule) {
  const totals = await executor.get("SELECT COALESCE(SUM(total), 0) AS total FROM ventas WHERE cliente = ? AND tipoPago = 'credito' AND id <> ?", [previous.cliente, previous.id]);
  const payments = await executor.get('SELECT COALESCE(SUM(montoCobrado), 0) AS total FROM cobros WHERE cliente = ?', [previous.cliente]);
  const remainingCredit = Number(totals.total) + (next?.cliente === previous.cliente && next.tipoPago === 'credito' ? next.total : 0);
  return roundMoney(remainingCredit) >= roundMoney(payments.total);
}

async function recalcularSaldosCliente(cliente, executor = dbModule) {
  const ventas = await executor.all(
    'SELECT id, total, tipoPago FROM ventas WHERE cliente = ? ORDER BY fecha ASC, creado_en ASC, id ASC',
    [cliente]
  );
  const cobros = await executor.all(
    'SELECT montoCobrado FROM cobros WHERE cliente = ? ORDER BY fecha ASC, creado_en ASC',
    [cliente]
  );
  let restanteCobros = cobros.reduce((sum, cobro) => sum + Number(cobro.montoCobrado || 0), 0);

  for (const venta of ventas) {
    let saldo = venta.tipoPago === 'credito' ? Number(venta.total || 0) : 0;
    if (saldo > 0 && restanteCobros > 0) {
      const aplicado = Math.min(restanteCobros, saldo);
      saldo = Math.round((saldo - aplicado) * 100) / 100;
      restanteCobros = Math.round((restanteCobros - aplicado) * 100) / 100;
    }
    const estado = saldo <= 0 ? 'pagado' : saldo < Number(venta.total || 0) ? 'parcial' : 'pendiente';
    await executor.run('UPDATE ventas SET saldoPendiente = ?, estado = ? WHERE id = ?', [saldo, estado, venta.id]);
  }
}

router.get('/', async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT * FROM ventas ORDER BY fecha DESC');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/siguiente-numero', async (req, res) => {
  try {
    res.json({ numeroNE: await nextNumeroNE() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventario/disponible', async (req, res) => {
  try {
    const inventario = await getFinishedInventory(dbModule);
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await dbModule.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'No encontrada' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRoles('admin', 'supervisor', 'supervisor_ventas'), async (req, res) => {
  try {
    const result = await withFinancialWrite(async executor => {
    const { fecha, cliente, formato, unidadesPorCaja } = req.body;
    const numeroNE = req.body.numeroNE || await nextNumeroNE(executor);
    const archived = await executor.all("SELECT payload FROM app_records WHERE modulo = 'ventas_anulados'");
    if (archived.some(row => JSON.parse(row.payload).registro.numeroNE === numeroNE)) throw invalid('Ese numero de nota ya fue anulado y no puede reutilizarse.', 409);
    const cantidad = Number(req.body.cantidad);
    const precioUnitario = Number(req.body.precioUnitario);
    const tipoPago = req.body.tipoPago || 'contado';
    const metodoPago = req.body.metodoPago || '';
    const cuentaEmpresa = req.body.cuentaEmpresa || '';
    const estadoEntrega = req.body.estadoEntrega || 'entregado';
    const fechaRecojo = req.body.fechaRecojo || '';
    const observaciones = req.body.observaciones || '';
    if (!numeroNE || !cliente || !formato || !Number.isFinite(cantidad) || !Number.isFinite(precioUnitario) || cantidad <= 0 || precioUnitario <= 0 || !VALID_TIPOS_PAGO.has(tipoPago)) {
      throw invalid('Campos requeridos');
    }

    const unidadesPorCajaFinal = String(formato || '').toLowerCase().includes('caja') ? Number(unidadesPorCaja || 50) : 1;
    if (!Number.isFinite(unidadesPorCajaFinal) || unidadesPorCajaFinal <= 0) {
      throw invalid('Pastas por caja debe ser mayor a cero.');
    }

    const id = uuid();
    const total = roundMoney(cantidad * precioUnitario);
    if (!Number.isFinite(total)) throw invalid('Total fuera de rango.');
    const saldoPendiente = tipoPago === 'credito' ? total : 0;
    const estado = tipoPago === 'credito' ? 'pendiente' : 'pagado';
    await executor.run(
      `INSERT INTO ventas
       (id, numeroNE, fecha, cliente, formato, cantidad, unidadesPorCaja, precioUnitario, total, tipoPago, metodoPago, cuentaEmpresa, estadoEntrega, fechaRecojo, observaciones, estado, saldoPendiente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, numeroNE, fecha || new Date().toISOString().split('T')[0], cliente, formato, cantidad, unidadesPorCajaFinal, precioUnitario, total, tipoPago, metodoPago, cuentaEmpresa, estadoEntrega, fechaRecojo, observaciones, estado, saldoPendiente]
    );
    await recalcularSaldosCliente(cliente, executor);
    const updated = await executor.get('SELECT * FROM ventas WHERE id = ?', [id]);
    await logAudit(req, 'crear', 'ventas', id, null, updated, `Venta ${numeroNE} para ${cliente}`, executor);
    return { id, message: 'Venta creada', total, saldoPendiente: updated.saldoPendiente, estado: updated.estado };
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
});

router.put('/:id', requireRoles('admin', 'supervisor', 'supervisor_ventas'), async (req, res) => {
  try {
    await withFinancialWrite(async executor => {
    const previous = await executor.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!previous) throw invalid('Venta no encontrada', 404);

    const data = {
      numeroNE: req.body.numeroNE || previous.numeroNE,
      fecha: req.body.fecha || previous.fecha,
      cliente: req.body.cliente || previous.cliente,
      formato: req.body.formato || previous.formato,
      cantidad: Number(req.body.cantidad ?? previous.cantidad),
      unidadesPorCaja: String(req.body.formato || previous.formato).toLowerCase().includes('caja') ? Number(req.body.unidadesPorCaja || previous.unidadesPorCaja || 50) : 1,
      precioUnitario: Number(req.body.precioUnitario ?? previous.precioUnitario),
      tipoPago: req.body.tipoPago || previous.tipoPago,
      metodoPago: req.body.metodoPago ?? previous.metodoPago ?? '',
      cuentaEmpresa: req.body.cuentaEmpresa ?? previous.cuentaEmpresa ?? '',
      estadoEntrega: req.body.estadoEntrega ?? previous.estadoEntrega ?? 'entregado',
      fechaRecojo: req.body.fechaRecojo ?? previous.fechaRecojo ?? '',
      observaciones: req.body.observaciones ?? previous.observaciones ?? '',
    };
    data.total = roundMoney(data.cantidad * data.precioUnitario);

    if (!data.numeroNE || !data.cliente || !Number.isFinite(data.cantidad) || !Number.isFinite(data.precioUnitario) || !Number.isFinite(data.unidadesPorCaja) || data.unidadesPorCaja <= 0 || data.cantidad <= 0 || data.precioUnitario <= 0 || !VALID_TIPOS_PAGO.has(data.tipoPago)) {
      throw invalid('Campos requeridos o invalidos');
    }

    if (!Number.isFinite(data.total) || !await preservesPayments(previous, data, executor)) throw invalid('El cambio dejaria cobros sin deuda asociada. Revise los cobros antes de modificar la venta.', 409);
    const archived = await executor.all("SELECT payload FROM app_records WHERE modulo = 'ventas_anulados'");
    if (archived.some(row => JSON.parse(row.payload).registro.numeroNE === data.numeroNE)) throw invalid('Ese numero de nota ya fue anulado y no puede reutilizarse.', 409);

    await executor.run(
      `UPDATE ventas
       SET numeroNE = ?, fecha = ?, cliente = ?, formato = ?, cantidad = ?, unidadesPorCaja = ?, precioUnitario = ?, total = ?, tipoPago = ?
       , metodoPago = ?, cuentaEmpresa = ?, estadoEntrega = ?, fechaRecojo = ?, observaciones = ?
       WHERE id = ?`,
      [data.numeroNE, data.fecha, data.cliente, data.formato, data.cantidad, data.unidadesPorCaja, data.precioUnitario, data.total, data.tipoPago, data.metodoPago, data.cuentaEmpresa, data.estadoEntrega, data.fechaRecojo, data.observaciones, req.params.id]
    );
    await recalcularSaldosCliente(previous.cliente, executor);
    if (previous.cliente !== data.cliente) await recalcularSaldosCliente(data.cliente, executor);
    const updated = await executor.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    await logAudit(req, 'actualizar', 'ventas', req.params.id, previous, updated, `Venta ${data.numeroNE} actualizada`, executor);
    });
    res.json({ message: 'Venta actualizada' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    res.json(await deleteFinancialRecord(req, 'ventas'));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo eliminar la venta. No se confirmaron cambios.' });
  }
});

module.exports = router;
