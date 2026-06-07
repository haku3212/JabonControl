const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
  db.all('SELECT * FROM hornadas ORDER BY fecha DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const { numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones } = req.body;

  if (!numero || !fecha || !produccionTotal) {
    return res.status(400).json({ error: 'Campos requeridos' });
  }

  const id = uuid();
  db.run(
    `INSERT INTO hornadas
     (id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id, message: 'Hornada registrada' });
    }
  );
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM hornadas WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Hornada eliminada' });
  });
});

module.exports = router;
