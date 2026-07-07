const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');

router.get('/', async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT * FROM recepciones ORDER BY fecha DESC');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fecha, proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado } = req.body;
    if (!proveedor || !producto || !cantidad) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    await dbModule.run(
      `INSERT INTO recepciones
       (id, fecha, proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, fecha || new Date().toISOString().split('T')[0], proveedor, producto, cantidad, unidad, precioUnitario, precioTotal, estado || 'recibido']
    );
    await dbModule.save();
    await logAudit(req, 'crear', 'recepciones', id, null, req.body, `Recepcion de ${producto} registrada`);

    res.status(201).json({ id, message: 'Recepcion registrada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin', 'supervisor'), async (req, res) => {
  try {
    const previous = await dbModule.get('SELECT * FROM recepciones WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Recepcion no encontrada' });

    await dbModule.run('DELETE FROM recepciones WHERE id = ?', [req.params.id]);
    await dbModule.save();
    await logAudit(req, 'eliminar', 'recepciones', req.params.id, previous, null, `Recepcion ${previous.producto || req.params.id} eliminada`);
    res.json({ message: 'Recepcion eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
