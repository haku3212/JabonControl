const express = require('express');
const router = express.Router();
const dbModule = require('../db');
const { v4: uuid } = require('uuid');
const { logAudit } = require('../db');
const { requireRoles } = require('./auth');

router.get('/', async (req, res) => {
  try {
    const rows = await dbModule.all('SELECT * FROM hornadas ORDER BY fecha DESC');
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones } = req.body;
    if (!numero || !fecha || !produccionTotal) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const id = uuid();
    await dbModule.run(
      `INSERT INTO hornadas
       (id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, numero, fecha, horaInicio, operario, naohVolumen, seboFund, aceiteQuem, aceiteCrudo, aceiteAlmendra, agua, jabonRecicl, produccionTotal, rendimiento, observaciones]
    );
    await dbModule.save();
    await logAudit(req, 'crear', 'hornadas', id, null, req.body, `Hornada ${numero} registrada`);

    res.status(201).json({ id, message: 'Hornada registrada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRoles('admin', 'supervisor'), async (req, res) => {
  try {
    const previous = await dbModule.get('SELECT * FROM hornadas WHERE id = ?', [req.params.id]);
    if (!previous) return res.status(404).json({ error: 'Hornada no encontrada' });

    await dbModule.run('DELETE FROM hornadas WHERE id = ?', [req.params.id]);
    await dbModule.save();
    await logAudit(req, 'eliminar', 'hornadas', req.params.id, previous, null, `Hornada ${previous.numero || req.params.id} eliminada`);
    res.json({ message: 'Hornada eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
