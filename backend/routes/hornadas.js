const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM hornadas ORDER BY fecha DESC');
    const rows = stmt.all();
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
    const stmt = db.prepare(
      `INSERT INTO hornadas
       (id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones);

    res.status(201).json({ id, message: 'Hornada registrada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM hornadas WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Hornada eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
