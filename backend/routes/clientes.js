const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');

router.get('/', async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT * FROM clientes ORDER BY nombre');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRoles('admin', 'supervisor'), async (req, res) => {
  try {
    const { nombre, tipo, telefono, email, ciudad, direccion } = req.body;
    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    await dbModule.run(
      `INSERT INTO clientes (id, nombre, tipo, telefono, email, ciudad, direccion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, nombre, tipo, telefono, email, ciudad, direccion]
    );
    await dbModule.save();
    await logAudit(req, 'crear', 'clientes', id, null, req.body, `Cliente ${nombre} creado`);

    res.status(201).json({ id, message: 'Cliente creado' });
  } catch (error) {
    if (error.message.includes('UNIQUE') || error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'El cliente ya existe' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireRoles('admin', 'supervisor'), async (req, res) => {
  try {
    const { nombre, tipo, telefono, email, ciudad, direccion } = req.body;
    const previous = await dbModule.get('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Cliente no encontrado' });

    await dbModule.run(
      'UPDATE clientes SET nombre = ?, tipo = ?, telefono = ?, email = ?, ciudad = ?, direccion = ? WHERE id = ?',
      [nombre, tipo, telefono, email, ciudad, direccion, req.params.id]
    );
    await dbModule.save();
    await logAudit(req, 'actualizar', 'clientes', req.params.id, previous, req.body, `Cliente ${nombre} actualizado`);
    res.json({ message: 'Cliente actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    const previous = await dbModule.get('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Cliente no encontrado' });

    await dbModule.run('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    await dbModule.save();
    await logAudit(req, 'eliminar', 'clientes', req.params.id, previous, null, `Cliente ${previous.nombre || req.params.id} eliminado`);
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
