import { useState } from 'react';

interface ClienteFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function ClienteForm({ onSave, onCancel }: ClienteFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'distribuidor' as 'distribuidor' | 'retailer' | 'consumidor-final',
    telefono: '+591',
    ciudad: 'Santa Cruz',
    direccion: '',
    ventaMes: 0,
    cobradoMes: 0,
  });

  const handleSubmit = async () => {
    if (!form.nombre || !form.telefono || !form.direccion) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...form,
        id: Date.now().toString(),
      });
    } catch (error) {
      alert('Error al guardar el cliente');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Nombre / Razón Social *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Distribuidora Litoral"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Tipo de Cliente</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="distribuidor">Distribuidor</option>
            <option value="retailer">Retailer</option>
            <option value="consumidor-final">Consumidor Final</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Teléfono *</label>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+591 12345678"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Ciudad</label>
          <input
            type="text"
            value={form.ciudad}
            onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
            placeholder="Santa Cruz"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Venta del Mes (Bs)</label>
          <input
            type="number"
            value={form.ventaMes || ''}
            onChange={(e) => setForm({ ...form, ventaMes: Number(e.target.value) })}
            placeholder="0"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Dirección *</label>
          <textarea
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            placeholder="Dirección completa..."
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none min-h-20"
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
          {loading ? '⏳ Guardando...' : '💾 Guardar Cliente'}
        </button>
      </div>
    </div>
  );
}
