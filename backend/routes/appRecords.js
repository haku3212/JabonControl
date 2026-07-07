const express = require('express');
const { v4: uuid } = require('uuid');
const dbModule = require('../db');
const { logAudit } = require('../db');

const allowedModules = new Set(['proyectos', 'documentos', 'equipos', 'acabado']);

function parseRecord(row) {
  try {
    return JSON.parse(row.payload);
  } catch {
    return { id: row.id, error: 'Registro corrupto' };
  }
}

function createAppRecordsRouter(moduleName) {
  if (!allowedModules.has(moduleName)) {
    throw new Error(`Modulo no permitido: ${moduleName}`);
  }

  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const rows = await dbModule.all(
        'SELECT id, payload FROM app_records WHERE modulo = ? ORDER BY actualizado_en DESC, creado_en DESC',
        [moduleName]
      );
      res.json(rows.map(parseRecord));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const id = req.body.id || uuid();
      const data = { ...req.body, id };
      await dbModule.run(
        `INSERT INTO app_records (modulo, id, payload, actualizado_en)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [moduleName, id, JSON.stringify(data)]
      );
      await dbModule.save();
      await logAudit(req, 'crear', moduleName, id, null, data, `Registro creado en ${moduleName}`);
      res.status(201).json(data);
    } catch (error) {
      if (error.message.includes('UNIQUE') || error.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'El registro ya existe' });
      }
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const previousRow = await dbModule.get(
        'SELECT id, payload FROM app_records WHERE modulo = ? AND id = ?',
        [moduleName, req.params.id]
      );
      if (!previousRow) return res.status(404).json({ error: 'Registro no encontrado' });

      const previous = parseRecord(previousRow);
      const data = { ...req.body, id: req.params.id };
      await dbModule.run(
        `UPDATE app_records
         SET payload = ?, actualizado_en = CURRENT_TIMESTAMP
         WHERE modulo = ? AND id = ?`,
        [JSON.stringify(data), moduleName, req.params.id]
      );
      await dbModule.save();
      await logAudit(req, 'actualizar', moduleName, req.params.id, previous, data, `Registro actualizado en ${moduleName}`);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const previousRow = await dbModule.get(
        'SELECT id, payload FROM app_records WHERE modulo = ? AND id = ?',
        [moduleName, req.params.id]
      );
      if (!previousRow) return res.status(404).json({ error: 'Registro no encontrado' });

      const previous = parseRecord(previousRow);
      await dbModule.run('DELETE FROM app_records WHERE modulo = ? AND id = ?', [moduleName, req.params.id]);
      await dbModule.save();
      await logAudit(req, 'eliminar', moduleName, req.params.id, previous, null, `Registro eliminado en ${moduleName}`);
      res.json({ message: 'Registro eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createAppRecordsRouter;
