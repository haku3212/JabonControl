import { useState } from 'react';

interface RecepcionFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function RecepcionForm({ onSave, onCancel }: RecepcionFormProps) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    producto: 'NaOH 25kg',
    cantidad: 0,
    unidad: 'bolsas',
    precioUnitario: 0,
    estado: 'recibido' as 'recibido' | 'pendiente' | 'cancelado',
  });

  const total = form.cantidad * form.precioUnitario;

  const handleSubmit = () => {
    if (!form.proveedor || form.cantidad <= 0 || form.precioUnitario <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }
    onSave({
      ...form,
      id: Date.now().toString(),
      precioTotal: total,
    });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
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
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Proveedor *</label>
          <input
            type="text"
            value={form.proveedor}
            onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            placeholder="Nombre del proveedor"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Producto</label>
          <select
            value={form.producto}
            onChange={(e) => setForm({ ...form, producto: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option>NaOH 25kg</option>
            <option>Sebo fundido</option>
            <option>Aceite quemado</option>
            <option>Aceite crudo</option>
            <option>Aceite almendra</option>
            <option>Agua</option>
            <option>Jabón reciclado</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Estado</label>
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="recibido">Recibido</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Cantidad *</label>
          <input
            type="number"
            value={form.cantidad || ''}
            onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
            placeholder="0"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Unidad</label>
          <select
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option>bolsas</option>
            <option>kg</option>
            <option>litros</option>
            <option>unidades</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Precio Unitario (Bs) *</label>
          <input
            type="number"
            step="0.01"
            value={form.precioUnitario || ''}
            onChange={(e) => setForm({ ...form, precioUnitario: Number(e.target.value) })}
            placeholder="0.00"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Precio Total (Auto)</label>
          <input
            type="text"
            value={`Bs ${total.toLocaleString()}`}
            readOnly
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-accent-yellow text-sm font-semibold outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-dark-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90"
        >
          💾 Guardar Recepción
        </button>
      </div>
    </div>
  );
}
