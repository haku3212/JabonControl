const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');

async function recalcularSaldosCliente(cliente) {
  const ventas = await dbModule.all(
    'SELECT id, total, tipoPago FROM ventas WHERE cliente = ? ORDER BY fecha ASC, creado_en ASC',
    [cliente]
  );
  const cobros = await dbModule.all(
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
    await dbModule.run('UPDATE ventas SET saldoPendiente = ?, estado = ? WHERE id = ?', [nuevoSaldo, estado, venta.id]);
  }
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
    const { fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes } = req.body;
    if (!cliente || !montoCobrado) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    await dbModule.run(
      `INSERT INTO cobros (id, fecha, cliente, montoCobrado, metodoPago, notasCorrespondientes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, fecha || new Date().toISOString().split('T')[0], cliente, montoCobrado, metodoPago, notasCorrespondientes]
    );

    await recalcularSaldosCliente(cliente);

    await dbModule.save();
    await logAudit(req, 'crear', 'cobros', id, null, req.body, `Cobro de ${montoCobrado} registrado para ${cliente}`);

    res.status(201).json({ id, message: 'Cobro registrado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireRoles('admin', 'supervisor', 'supervisor_ventas', 'finanzas'), async (req, res) => {
  try {
    const previous = await dbModule.get('SELECT * FROM cobros WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Cobro no encontrado' });

    const data = {
      fecha: req.body.fecha || previous.fecha,
      cliente: req.body.cliente || previous.cliente,
      montoCobrado: Number(req.body.montoCobrado ?? previous.montoCobrado),
      metodoPago: req.body.metodoPago || previous.metodoPago,
      notasCorrespondientes: req.body.notasCorrespondientes ?? previous.notasCorrespondientes,
    };

    if (!data.cliente || data.montoCobrado <= 0) {
      return res.status(400).json({ error: 'Cliente y monto son obligatorios' });
    }

    await dbModule.run(
      'UPDATE cobros SET fecha = ?, cliente = ?, montoCobrado = ?, metodoPago = ?, notasCorrespondientes = ? WHERE id = ?',
      [data.fecha, data.cliente, data.montoCobrado, data.metodoPago, data.notasCorrespondientes, req.params.id]
    );
    await recalcularSaldosCliente(previous.cliente);
    if (previous.cliente !== data.cliente) await recalcularSaldosCliente(data.cliente);
    await dbModule.save();
    await logAudit(req, 'actualizar', 'cobros', req.params.id, previous, { id: req.params.id, ...data }, `Cobro actualizado para ${data.cliente}`);
    res.json({ message: 'Cobro actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    const previous = await dbModule.get('SELECT * FROM cobros WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Cobro no encontrado' });

    await dbModule.run('DELETE FROM cobros WHERE id = ?', [req.params.id]);
    await recalcularSaldosCliente(previous.cliente);
    await dbModule.save();
    await logAudit(req, 'eliminar', 'cobros', req.params.id, previous, null, `Cobro ${req.params.id} eliminado`);
    res.json({ message: 'Cobro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
