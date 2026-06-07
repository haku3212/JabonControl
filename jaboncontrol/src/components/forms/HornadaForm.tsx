import { useState } from 'react';

interface HornadaFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function HornadaForm({ onSave, onCancel }: HornadaFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numero: `H-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    operario: 'Carlos M.',
    naohVolumen: 0, // en LITROS (volumen)
    seboFund: 0, // en kg
    aceiteQuem: 0, // en LITROS
    aceiteCrudo: 0, // en LITROS
    aceiteAlmendra: 0, // en LITROS
    agua: 0, // en litros
    jabonRecicl: 0, // en kg
    produccionTotal: 0, // en kg
    observaciones: '',
  });

  const handleSubmit = async () => {
    if (form.produccionTotal <= 0) {
      alert('Por favor ingrese la producción total');
      return;
    }

    const totalAceites = form.aceiteQuem + form.aceiteCrudo + form.aceiteAlmendra;
    const rendimiento = totalAceites > 0 ? (form.produccionTotal / totalAceites) * 100 : 0;

    setLoading(true);
    try {
      await onSave({
        id: Date.now().toString(),
        numero: form.numero,
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        operario: form.operario,
        ingredientes: {
          naohVolumen: form.naohVolumen,
          seboFund: form.seboFund,
          aceiteQuem: form.aceiteQuem,
          aceiteCrudo: form.aceiteCrudo,
          aceiteAlmendra: form.aceiteAlmendra,
          agua: form.agua,
          jabonRecicl: form.jabonRecicl,
        },
        produccionTotal: form.produccionTotal,
        rendimiento: Math.min(rendimiento, 100),
        observaciones: form.observaciones,
      });
    } catch (error) {
      alert('Error al guardar la hornada');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">N° Hornada</label>
          <input
            type="text"
            value={form.numero}
            readOnly
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-accent-yellow text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Fecha</label>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Hora Inicio</label>
          <input
            type="time"
            value={form.horaInicio}
            onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div className="col-span-3">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Operario</label>
          <select
            value={form.operario}
            onChange={(e) => setForm({ ...form, operario: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option>Carlos M.</option>
            <option>Rosa V.</option>
            <option>Pedro G.</option>
            <option>Luis P.</option>
            <option>Ana R.</option>
          </select>
        </div>
      </div>

      <div className="bg-dark-surface2 p-4 rounded mb-4">
        <div className="text-xs font-mono text-text-tertiary mb-3 tracking-wider">CONSUMO DE MATERIAS PRIMAS</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-mono text-text-tertiary block mb-1">Soda Cáustica (lts)</label>
            <input
              type="number"
              value={form.naohVolumen || ''}
              onChange={(e) => setForm({ ...form, naohVolumen: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-text-tertiary block mb-1">Sebo Fundido (kg)</label>
            <input
              type="number"
              value={form.seboFund || ''}
              onChange={(e) => setForm({ ...form, seboFund: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-text-tertiary block mb-1">Aceite Quemado (lts)</label>
            <input
              type="number"
              step="0.5"
              value={form.aceiteQuem || ''}
              onChange={(e) => setForm({ ...form, aceiteQuem: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-text-tertiary block mb-1">Aceite Crudo (lts)</label>
            <input
              type="number"
              step="0.5"
              value={form.aceiteCrudo || ''}
              onChange={(e) => setForm({ ...form, aceiteCrudo: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-text-tertiary block mb-1">Aceite Almendra (lts)</label>
            <input
              type="number"
              step="0.5"
              value={form.aceiteAlmendra || ''}
              onChange={(e) => setForm({ ...form, aceiteAlmendra: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-text-tertiary block mb-1">Agua (lts)</label>
            <input
              type="number"
              value={form.agua || ''}
              onChange={(e) => setForm({ ...form, agua: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-text-tertiary block mb-1">Jabón Reciclado (kg)</label>
            <input
              type="number"
              value={form.jabonRecicl || ''}
              onChange={(e) => setForm({ ...form, jabonRecicl: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="text-xs font-mono text-text-tertiary block mb-1">Producción Total (kg) *</label>
            <input
              type="number"
              value={form.produccionTotal || ''}
              onChange={(e) => setForm({ ...form, produccionTotal: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-dark-surface border border-accent-yellow rounded px-3 py-2 text-accent-yellow text-sm focus:border-accent-yellow outline-none font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Observaciones</label>
        <textarea
          value={form.observaciones}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          placeholder="Notas, fallas, novedades..."
          className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none min-h-16"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-dark-border">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? '⏳ Guardando...' : '💾 Guardar Hornada'}
        </button>
      </div>
    </div>
  );
}
