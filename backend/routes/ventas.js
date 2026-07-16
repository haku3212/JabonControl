const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');
const { getFinishedInventory, unitsForSale } = require('../utils/inventory');

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
    const { numeroNE, fecha, cliente, formato, cantidad, unidadesPorCaja, precioUnitario, total, tipoPago } = req.body;
    if (!numeroNE || !cliente || !cantidad || !precioUnitario) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const inventario = await getFinishedInventory(dbModule);
    const unidadesPorCajaFinal = String(formato || '').toLowerCase().includes('caja') ? Number(unidadesPorCaja || 50) : 1;
    if (unidadesPorCajaFinal <= 0) {
      return res.status(400).json({ error: 'Pastas por caja debe ser mayor a cero.' });
    }

    const unidadesSolicitadas = unitsForSale(formato, cantidad, unidadesPorCajaFinal);
    if (unidadesSolicitadas > inventario.disponibles) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${inventario.disponibles} unidades; solicitado: ${unidadesSolicitadas} unidades.`,
        inventario,
      });
    }

    const id = uuid();
    const saldoPendiente = tipoPago === 'credito' ? Number(total || 0) : 0;
    const estado = tipoPago === 'credito' ? 'pendiente' : 'pagado';
    await dbModule.run(
      `INSERT INTO ventas (id, numeroNE, fecha, cliente, formato, cantidad, unidadesPorCaja, precioUnitario, total, tipoPago, estado, saldoPendiente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, numeroNE, fecha || new Date().toISOString().split('T')[0], cliente, formato, cantidad, unidadesPorCajaFinal, precioUnitario, total, tipoPago, estado, saldoPendiente]
    );
    await dbModule.save();
    await logAudit(req, 'crear', 'ventas', id, null, req.body, `Venta ${numeroNE} para ${cliente}`);

    res.status(201).json({ id, message: 'Venta creada', saldoPendiente, estado });
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
      total: Number(req.body.total ?? req.body.precioTotal ?? previous.total),
      tipoPago: req.body.tipoPago || previous.tipoPago,
    };

    if (!data.numeroNE || !data.cliente || data.cantidad <= 0 || data.precioUnitario <= 0) {
      return res.status(400).json({ error: 'Campos requeridos o invalidos' });
    }

    const inventario = await getFinishedInventory(dbModule);
    const unidadesPrevias = unitsForSale(previous.formato, previous.cantidad, previous.unidadesPorCaja);
    const unidadesNuevas = unitsForSale(data.formato, data.cantidad, data.unidadesPorCaja);
    const disponibleAjustado = inventario.disponibles + unidadesPrevias;
    if (unidadesNuevas > disponibleAjustado) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible ajustado: ${disponibleAjustado} unidades; solicitado: ${unidadesNuevas} unidades.`,
        inventario,
      });
    }

    await dbModule.run(
      `UPDATE ventas
       SET numeroNE = ?, fecha = ?, cliente = ?, formato = ?, cantidad = ?, unidadesPorCaja = ?, precioUnitario = ?, total = ?, tipoPago = ?
       WHERE id = ?`,
      [data.numeroNE, data.fecha, data.cliente, data.formato, data.cantidad, data.unidadesPorCaja, data.precioUnitario, data.total, data.tipoPago, req.params.id]
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
