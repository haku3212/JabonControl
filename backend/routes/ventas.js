const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');
const { getFinishedInventory, unitsForSale } = require('../utils/inventory');

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

router.post('/', requireRoles('admin', 'supervisor'), async (req, res) => {
  try {
    const { numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago } = req.body;
    if (!numeroNE || !cliente || !cantidad || !precioUnitario) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const inventario = await getFinishedInventory(dbModule);
    const unidadesSolicitadas = unitsForSale(formato, cantidad);
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
      `INSERT INTO ventas (id, numeroNE, fecha, cliente, formato, cantidad, precioUnitario, total, tipoPago, estado, saldoPendiente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, numeroNE, fecha || new Date().toISOString().split('T')[0], cliente, formato, cantidad, precioUnitario, total, tipoPago, estado, saldoPendiente]
    );
    await dbModule.save();
    await logAudit(req, 'crear', 'ventas', id, null, req.body, `Venta ${numeroNE} para ${cliente}`);

    res.status(201).json({ id, message: 'Venta creada', saldoPendiente, estado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireRoles('admin', 'supervisor'), async (req, res) => {
  try {
    const { estado } = req.body;
    const previous = await dbModule.get('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Venta no encontrada' });

    await dbModule.run('UPDATE ventas SET estado = ? WHERE id = ?', [estado, req.params.id]);
    await dbModule.save();
    await logAudit(req, 'actualizar', 'ventas', req.params.id, previous, { ...previous, estado }, `Estado de venta actualizado a ${estado}`);
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
    await dbModule.save();
    await logAudit(req, 'eliminar', 'ventas', req.params.id, previous, null, `Venta ${previous.numeroNE || req.params.id} eliminada`);
    res.json({ message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
