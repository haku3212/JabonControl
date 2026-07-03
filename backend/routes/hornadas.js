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
    const result = db.exec('SELECT * FROM hornadas ORDER BY fecha DESC');
    const rows = rowsToObjects(result);
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones } = req.body;

    if (!numero || !fecha || !produccionTotal) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    const db = dbModule.db.get();
    db.run(
      `INSERT INTO hornadas
       (id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones]
    );
    dbModule.db.save();
    logAudit(req, 'crear', 'hornadas', id, null, req.body, `Hornada ${numero} registrada`);

    res.status(201).json({ id, message: 'Hornada registrada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin', 'supervisor'), (req, res) => {
  try {
    const db = dbModule.db.get();
    const previous = rowToObject(db.exec('SELECT * FROM hornadas WHERE id = ?', [req.params.id]));
    db.run('DELETE FROM hornadas WHERE id = ?', [req.params.id]);
    dbModule.db.save();
    logAudit(req, 'eliminar', 'hornadas', req.params.id, previous, null, `Hornada ${previous?.numero || req.params.id} eliminada`);
    res.json({ message: 'Hornada eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
