import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

interface VentaFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function VentaForm({ onSave, onCancel }: VentaFormProps) {
  const { clientes } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numeroNE: `NE-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    fecha: new Date().toISOString().split('T')[0],
    cliente: '',
    formato: 'Cajas',
    cantidad: 0,
    precioUnitario: 0,
    tipoPago: 'contado' as 'contado' | 'credito',
  });

  const total = form.cantidad * form.precioUnitario;

  useEffect(() => {
    if (!form.cliente && clientes.length > 0) {
      setForm((current) => ({ ...current, cliente: clientes[0].nombre }));
    }
  }, [clientes, form.cliente]);

  const handleSubmit = async () => {
    if (!form.cliente || form.cantidad <= 0 || form.precioUnitario <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...form,
        id: Date.now().toString(),
        total,
        precioTotal: total,
      });
    } catch (error) {
      alert('Error al guardar la venta');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Nro. Nota de Entrega</label>
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
          <input
            list="clientes-ventas"
            value={form.cliente}
            onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            placeholder="Buscar o elegir cliente"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
          <datalist id="clientes-ventas">
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.nombre} />
            ))}
          </datalist>
          {clientes.length === 0 && (
            <p className="text-xs text-status-warning mt-1">Primero registre un cliente.</p>
          )}
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Formato</label>
          <select
            value={form.formato}
            onChange={(e) => setForm({ ...form, formato: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option>Cajas</option>
            <option>Nodulos</option>
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
            onChange={(e) => setForm({ ...form, tipoPago: e.target.value as 'contado' | 'credito' })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="contado">Contado</option>
            <option value="credito">Credito</option>
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
          {loading ? 'Guardando...' : 'Guardar Venta'}
        </button>
      </div>
    </div>
  );
}
