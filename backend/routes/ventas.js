const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');
const { getFinishedInventory } = require('../utils/inventory');

const VALID_TIPOS_PAGO = new Set(['contado', 'credito', 'transferencia']);

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

async function nextNumeroNE() {
  const rows = await dbModule.all("SELECT numeroNE FROM ventas WHERE numeroNE LIKE 'NE-%'");
  const max = rows.reduce((current, row) => {
    const match = String(row.numeroNE || '').match(/^NE-(\d+)$/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `NE-${String(max + 1).padStart(4, '0')}`;
}

async function preservesPayments(previous, next) {
  const totals = await dbModule.get("SELECT COALESCE(SUM(total), 0) AS total FROM ventas WHERE cliente = ? AND tipoPago = 'credito' AND id <> ?", [previous.cliente, previous.id]);
  const payments = await dbModule.get('SELECT COALESCE(SUM(montoCobrado), 0) AS total FROM cobros WHERE cliente = ?', [previous.cliente]);
  const remainingCredit = Number(totals.total) + (next?.cliente === previous.cliente && next.tipoPago === 'credito' ? next.total : 0);
  return roundMoney(remainingCredit) >= roundMoney(payments.total);
}

async function recalcularSaldosCliente(cliente) {
  const ventas = await dbModule.all(
    'SELECT id, total, tipoPago FROM ventas WHERE cliente = ? ORDER BY fecha ASC, creado_en ASC',
    [cliente]
  );
  const cobros = await dbModule.all(
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
    await dbModule.run('UPDATE ventas SET saldoPendiente = ?, estado = ? WHERE id = ?', [saldo, estado, venta.id]);
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
    const { fecha, cliente, formato, unidadesPorCaja } = req.body;
    const numeroNE = req.body.numeroNE || await nextNumeroNE();
    const cantidad = Number(req.body.cantidad);
    const precioUnitario = Number(req.body.precioUnitario);
    const tipoPago = req.body.tipoPago || 'contado';
    const metodoPago = req.body.metodoPago || '';
    const cuentaEmpresa = req.body.cuentaEmpresa || '';
    const estadoEntrega = req.body.estadoEntrega || 'entregado';
    const fechaRecojo = req.body.fechaRecojo || '';
    const observaciones = req.body.observaciones || '';
    if (!numeroNE || !cliente || !formato || !Number.isFinite(cantidad) || !Number.isFinite(precioUnitario) || cantidad <= 0 || precioUnitario <= 0 || !VALID_TIPOS_PAGO.has(tipoPago)) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const unidadesPorCajaFinal = String(formato || '').toLowerCase().includes('caja') ? Number(unidadesPorCaja || 50) : 1;
    if (!Number.isFinite(unidadesPorCajaFinal) || unidadesPorCajaFinal <= 0) {
      return res.status(400).json({ error: 'Pastas por caja debe ser mayor a cero.' });
    }

    const id = uuid();
    const total = roundMoney(cantidad * precioUnitario);
    if (!Number.isFinite(total)) return res.status(400).json({ error: 'Total fuera de rango.' });
    const saldoPendiente = tipoPago === 'credito' ? total : 0;
    const estado = tipoPago === 'credito' ? 'pendiente' : 'pagado';
    await dbModule.run(
      `INSERT INTO ventas
       (id, numeroNE, fecha, cliente, formato, cantidad, unidadesPorCaja, precioUnitario, total, tipoPago, metodoPago, cuentaEmpresa, estadoEntrega, fechaRecojo, observaciones, estado, saldoPendiente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, numeroNE, fecha || new Date().toISOString().split('T')[0], cliente, formato, cantidad, unidadesPorCajaFinal, precioUnitario, total, tipoPago, metodoPago, cuentaEmpresa, estadoEntrega, fechaRecojo, observaciones, estado, saldoPendiente]
    );
    await dbModule.save();
    await logAudit(req, 'crear', 'ventas', id, null, { ...req.body, total, saldoPendiente, estado }, `Venta ${numeroNE} para ${cliente}`);

    res.status(201).json({ id, message: 'Venta creada', total, saldoPendiente, estado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireRoles('admin', 'supervisor', 'supervisor_ventas'), async (req, res) => {
  try {
    const previous = await dbModule.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Venta no encontrada' });

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
      return res.status(400).json({ error: 'Campos requeridos o invalidos' });
    }

    if (!Number.isFinite(data.total) || !await preservesPayments(previous, data)) return res.status(409).json({ error: 'El cambio dejaria cobros sin deuda asociada. Revise los cobros antes de modificar la venta.' });

    await dbModule.run(
      `UPDATE ventas
       SET numeroNE = ?, fecha = ?, cliente = ?, formato = ?, cantidad = ?, unidadesPorCaja = ?, precioUnitario = ?, total = ?, tipoPago = ?
       , metodoPago = ?, cuentaEmpresa = ?, estadoEntrega = ?, fechaRecojo = ?, observaciones = ?
       WHERE id = ?`,
      [data.numeroNE, data.fecha, data.cliente, data.formato, data.cantidad, data.unidadesPorCaja, data.precioUnitario, data.total, data.tipoPago, data.metodoPago, data.cuentaEmpresa, data.estadoEntrega, data.fechaRecojo, data.observaciones, req.params.id]
    );
    await recalcularSaldosCliente(previous.cliente);
    if (previous.cliente !== data.cliente) await recalcularSaldosCliente(data.cliente);
    await dbModule.save();
    const updated = await dbModule.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    await logAudit(req, 'actualizar', 'ventas', req.params.id, previous, updated, `Venta ${data.numeroNE} actualizada`);
    res.json({ message: 'Venta actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    const previous = await dbModule.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Venta no encontrada' });

    if (!await preservesPayments(previous, null)) return res.status(409).json({ error: 'Esta venta respalda cobros registrados y no puede eliminarse.' });

    await dbModule.run('DELETE FROM ventas WHERE id = ?', [req.params.id]);
    await recalcularSaldosCliente(previous.cliente);
    await dbModule.save();
    await logAudit(req, 'eliminar', 'ventas', req.params.id, previous, null, `Venta ${previous.numeroNE || req.params.id} eliminada`);
    res.json({ message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
