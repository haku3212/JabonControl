const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');

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

router.post('/', (req, res) => {
  try {
    const { nombre, tipo, telefono, ciudad, direccion } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    const db = dbModule.db.get();
    db.run(
      `INSERT INTO clientes (id, nombre, tipo, telefono, ciudad, direccion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nombre, tipo, telefono, ciudad, direccion]
    );
    dbModule.db.save();

    res.status(201).json({ id, message: 'Cliente creado' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El cliente ya existe' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { nombre, tipo, telefono, ciudad, direccion } = req.body;
    const db = dbModule.db.get();
    db.run(
      `UPDATE clientes SET nombre = ?, tipo = ?, telefono = ?, ciudad = ?, direccion = ? WHERE id = ?`,
      [nombre, tipo, telefono, ciudad, direccion, req.params.id]
    );
    dbModule.db.save();
    res.json({ message: 'Cliente actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = dbModule.db.get();
    db.run('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
