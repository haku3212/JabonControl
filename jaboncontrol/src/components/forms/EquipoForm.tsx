import { useState } from 'react';

interface EquipoFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function EquipoForm({ onSave, onCancel }: EquipoFormProps) {
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'horno' as 'horno' | 'mezclador' | 'empacadora' | 'bascula' | 'otro',
    estado: 'operativo' as 'operativo' | 'mantenimiento' | 'reparacion' | 'fuera_servicio',
    fechaCompra: '',
    ubicacion: 'Planta Principal',
    responsable: 'Admin',
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.nombre) {
      alert('Por favor ingrese el nombre del equipo');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...form,
        id: Date.now().toString(),
      });
    } catch (error) {
      alert('Error al guardar el equipo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Nombre del Equipo *
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Horno Industrial #1"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Tipo de Equipo
          </label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="horno">🔥 Horno</option>
            <option value="mezclador">🥣 Mezclador</option>
            <option value="empacadora">📦 Empacadora</option>
            <option value="bascula">⚖️ Báscula</option>
            <option value="otro">🔧 Otro</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Estado
          </label>
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="operativo">✅ Operativo</option>
            <option value="mantenimiento">🔧 Mantenimiento</option>
            <option value="reparacion">⚠️ Reparación</option>
            <option value="fuera_servicio">❌ Fuera de Servicio</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Fecha de Compra
          </label>
          <input
            type="date"
            value={form.fechaCompra}
            onChange={(e) => setForm({ ...form, fechaCompra: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Ubicación
          </label>
          <input
            type="text"
            value={form.ubicacion}
            onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            placeholder="Ej: Planta Principal"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Responsable
          </label>
          <input
            type="text"
            value={form.responsable}
            onChange={(e) => setForm({ ...form, responsable: e.target.value })}
            placeholder="Nombre del responsable"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Observaciones (opcional)
          </label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            placeholder="Notas o detalles del equipo..."
            rows={3}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dark-border">
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
          {loading ? '⏳ Guardando...' : '💾 Guardar Equipo'}
        </button>
      </div>
    </div>
  );
}
