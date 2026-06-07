import { useState } from 'react';

interface VentaFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function VentaForm({ onSave, onCancel }: VentaFormProps) {
  const [form, setForm] = useState({
    numeroNE: `NE-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    fecha: new Date().toISOString().split('T')[0],
    cliente: 'Distribuidora Litoral',
    formato: 'Cajas',
    cantidad: 0,
    precioUnitario: 0,
    tipoPago: 'cancelado' as 'cancelado' | 'credito',
  });

  const total = form.cantidad * form.precioUnitario;

  const handleSubmit = () => {
    if (!form.cliente || form.cantidad <= 0 || form.precioUnitario <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }
    onSave({
      ...form,
      id: Date.now().toString(),
      total: total,
      precioTotal: total,
    });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">N° Nota de Entrega</label>
          <input
            type="text"
            value={form.numeroNE}
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
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Cliente</label>
          <select
            value={form.cliente}
            onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option>Distribuidora Litoral</option>
            <option>Supermercado El Sol</option>
            <option>Ferretería Central</option>
            <option>Mercado Mutualista</option>
            <option>Dist. Santa Cruz</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Formato</label>
          <select
            value={form.formato}
            onChange={(e) => setForm({ ...form, formato: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option>Cajas</option>
            <option>Nódulos</option>
            <option>Barras</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Cantidad</label>
          <input
            type="number"
            value={form.cantidad || ''}
            onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
            placeholder="0"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Precio Unitario (Bs)</label>
          <input
            type="number"
            value={form.precioUnitario || ''}
            onChange={(e) => setForm({ ...form, precioUnitario: Number(e.target.value) })}
            placeholder="0.00"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Tipo de Pago</label>
          <select
            value={form.tipoPago}
            onChange={(e) => setForm({ ...form, tipoPago: e.target.value as 'cancelado' | 'credito' })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="cancelado">Cancelado</option>
            <option value="credito">Crédito</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Total (Auto)</label>
          <input
            type="text"
            value={`Bs ${total.toLocaleString()}`}
            readOnly
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-accent-yellow text-sm font-semibold outline-none"
          />
        </div>
      </div>

      <div className="bg-dark-surface2 p-4 rounded flex justify-end items-center gap-4 mt-4">
        <span className="text-xs font-mono text-text-tertiary">TOTAL VENTA:</span>
        <span className="text-3xl font-bebas text-accent-yellow">Bs {total.toLocaleString()}</span>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dark-border">
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
          💾 Guardar Venta
        </button>
      </div>
    </div>
  );
}
