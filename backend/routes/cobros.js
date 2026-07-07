const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');

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

    const ventasAfectadas = [];
    const ventasPendientes = await dbModule.all(
      'SELECT id, numeroNE, saldoPendiente FROM ventas WHERE cliente = ? AND saldoPendiente > 0 ORDER BY fecha ASC, creado_en ASC',
      [cliente]
    );

    let restante = Number(montoCobrado);
    for (const venta of ventasPendientes) {
      if (restante <= 0) break;
      const saldo = Number(venta.saldoPendiente || 0);
      const aplicar = Math.min(restante, saldo);
      const nuevoSaldo = Math.round((saldo - aplicar) * 100) / 100;
      const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'parcial';

      await dbModule.run(
        'UPDATE ventas SET saldoPendiente = ?, estado = ? WHERE id = ?',
        [nuevoSaldo, nuevoEstado, venta.id]
      );
      ventasAfectadas.push({ id: venta.id, numeroNE: venta.numeroNE, aplicado: aplicar, nuevoSaldo, estado: nuevoEstado });
      restante = Math.round((restante - aplicar) * 100) / 100;
    }

    await dbModule.save();
    await logAudit(req, 'crear', 'cobros', id, null, { ...req.body, ventasAfectadas }, `Cobro de ${montoCobrado} registrado para ${cliente}`);

    res.status(201).json({ id, message: 'Cobro registrado', ventasAfectadas });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    const previous = await dbModule.get('SELECT * FROM cobros WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Cobro no encontrado' });

    await dbModule.run('DELETE FROM cobros WHERE id = ?', [req.params.id]);
    await dbModule.save();
    await logAudit(req, 'eliminar', 'cobros', req.params.id, previous, null, `Cobro ${req.params.id} eliminado`);
    res.json({ message: 'Cobro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
