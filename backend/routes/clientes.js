const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');

function rowToObject(result) {
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  const columns = result[0].columns;
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj;
}

function rowsToObjects(result) {
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

router.get('/', (req, res) => {
  try {
    const db = dbModule.db.get();
    const result = db.exec('SELECT * FROM clientes ORDER BY nombre');
    const rows = rowsToObjects(result);
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRoles('admin', 'supervisor'), (req, res) => {
  try {
    const { nombre, tipo, telefono, email, ciudad, direccion } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    const db = dbModule.db.get();
    db.run(
      `INSERT INTO clientes (id, nombre, tipo, telefono, email, ciudad, direccion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, nombre, tipo, telefono, email, ciudad, direccion]
    );
    dbModule.db.save();
    logAudit(req, 'crear', 'clientes', id, null, req.body, `Cliente ${nombre} creado`);

    res.status(201).json({ id, message: 'Cliente creado' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El cliente ya existe' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireRoles('admin', 'supervisor'), (req, res) => {
  try {
    const { nombre, tipo, telefono, email, ciudad, direccion } = req.body;
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM clientes WHERE id = ?', [req.params.id]));
    db.run(
      `UPDATE clientes SET nombre = ?, tipo = ?, telefono = ?, email = ?, ciudad = ?, direccion = ? WHERE id = ?`,
      [nombre, tipo, telefono, email, ciudad, direccion, req.params.id]
    );
    dbModule.db.save();
    logAudit(req, 'actualizar', 'clientes', req.params.id, previous, req.body, `Cliente ${nombre} actualizado`);
    res.json({ message: 'Cliente actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin'), (req, res) => {
  try {
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM clientes WHERE id = ?', [req.params.id]));
    db.run('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    logAudit(req, 'eliminar', 'clientes', req.params.id, previous, null, `Cliente ${previous?.nombre || req.params.id} eliminado`);
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
