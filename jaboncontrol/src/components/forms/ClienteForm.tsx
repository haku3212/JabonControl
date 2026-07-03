import { useState } from 'react';

interface ClienteFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export function ClienteForm({ onSave, onCancel, initialData }: ClienteFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: initialData?.nombre || '',
    tipo: (initialData?.tipo || 'distribuidor') as 'distribuidor' | 'retailer' | 'consumidor-final',
    telefono: initialData?.telefono || '+591',
    email: initialData?.email || '',
    ciudad: initialData?.ciudad || 'Santa Cruz',
    direccion: initialData?.direccion || '',
    ventaMes: Number(initialData?.ventaMes || 0),
    cobradoMes: Number(initialData?.cobradoMes || 0),
  });

  const handleSubmit = async () => {
    if (!form.nombre || !form.telefono || !form.direccion) {
      alert('Por favor complete nombre, telefono y direccion.');
      return;
    }

    setLoading(true);
    try {
      await onSave({ ...form, id: initialData?.id || Date.now().toString() });
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
        <Field label="Nombre / Razon social *" value={form.nombre} onChange={(value) => setForm({ ...form, nombre: value })} placeholder="Ej: Distribuidora Litoral" className="sm:col-span-2" />

        <label className="block">
          <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Tipo de cliente</span>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="distribuidor">Distribuidor</option>
            <option value="retailer">Retailer</option>
            <option value="consumidor-final">Consumidor final</option>
          </select>
        </label>

        <Field label="Telefono *" type="tel" value={form.telefono} onChange={(value) => setForm({ ...form, telefono: value })} placeholder="+591 70000000" />
        <Field label="Gmail / correo" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="cliente@gmail.com" />
        <Field label="Ciudad" value={form.ciudad} onChange={(value) => setForm({ ...form, ciudad: value })} placeholder="Santa Cruz" />
        <Field label="Venta del mes (Bs)" type="number" value={String(form.ventaMes || '')} onChange={(value) => setForm({ ...form, ventaMes: Number(value) })} placeholder="0" />

        <label className="block sm:col-span-2">
          <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Direccion *</span>
          <textarea
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            placeholder="Direccion completa..."
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none min-h-20"
          />
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dark-border">
        <button onClick={onCancel} disabled={loading} className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow disabled:opacity-50">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, className = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
      />
    </label>
  );
}
