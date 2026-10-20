import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { UNIDADES_POR_CAJA } from '../../utils/inventory';
import { ventasService } from '../../services/api';

interface VentaFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export function VentaForm({ onSave, onCancel, initialData }: VentaFormProps) {
  const { clientes } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numeroNE: initialData?.numeroNE || '',
    fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
    cliente: initialData?.cliente || '',
    formato: initialData?.formato || 'Cajas',
    cantidad: Number(initialData?.cantidad || 0),
    unidadesPorCaja: Number(initialData?.unidadesPorCaja || UNIDADES_POR_CAJA),
    precioUnitario: Number(initialData?.precioUnitario || 0),
    tipoPago: (initialData?.tipoPago || 'contado') as 'contado' | 'credito',
    metodoPago: initialData?.metodoPago || 'efectivo',
    cuentaEmpresa: initialData?.cuentaEmpresa || '',
    estadoEntrega: initialData?.estadoEntrega || 'entregado',
    fechaRecojo: initialData?.fechaRecojo || '',
    observaciones: initialData?.observaciones || '',
  });

  const total = form.cantidad * form.precioUnitario;
  const esCaja = form.formato.toLowerCase().includes('caja');

  useEffect(() => {
    if (initialData?.numeroNE) return;
    ventasService.siguienteNumero()
      .then((response) => response.numeroNE && setForm((current) => ({ ...current, numeroNE: response.numeroNE })))
      .catch(() => setForm((current) => ({ ...current, numeroNE: current.numeroNE || `NE-${Date.now().toString().slice(-4)}` })));
  }, [initialData?.numeroNE]);

  const handleSubmit = async () => {
    if (!form.cliente || form.cantidad <= 0 || form.precioUnitario <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }
    if (esCaja && form.unidadesPorCaja <= 0) {
      alert('Indique cuantas pastas trae cada caja.');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        ...form,
        id: initialData?.id || Date.now().toString(),
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
            onChange={(e) => setForm({ ...form, numeroNE: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-accent-yellow text-sm focus:border-accent-yellow outline-none"
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
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              list="clientes-ventas"
              value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              placeholder="Escribir cliente"
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
            <select
              value=""
              onChange={(e) => e.target.value && setForm({ ...form, cliente: e.target.value })}
              className="w-36 bg-dark-surface2 border border-dark-border rounded px-2 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
              title="Elegir cliente registrado"
            >
              <option value="">Elegir</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.nombre}>{cliente.nombre}</option>
              ))}
            </select>
          </div>
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
            onChange={(e) => setForm({ ...form, formato: e.target.value, unidadesPorCaja: e.target.value.toLowerCase().includes('caja') ? form.unidadesPorCaja || UNIDADES_POR_CAJA : 1 })}
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
        {esCaja && (
          <div>
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Pastas por caja</label>
            <input
              type="number"
              value={form.unidadesPorCaja || ''}
              onChange={(e) => setForm({ ...form, unidadesPorCaja: Number(e.target.value) })}
              placeholder="50"
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
        )}
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
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Metodo de pago</label>
          <select
            value={form.metodoPago}
            onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="deposito">Deposito</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Cuenta empresa</label>
          <input
            value={form.cuentaEmpresa}
            onChange={(e) => setForm({ ...form, cuentaEmpresa: e.target.value })}
            placeholder="Banco y cuenta de la empresa"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Entrega / recojo</label>
          <select
            value={form.estadoEntrega}
            onChange={(e) => setForm({ ...form, estadoEntrega: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="entregado">Entregado ahora</option>
            <option value="pendiente_recojo">Pago adelantado / recojo pendiente</option>
          </select>
        </div>
        {form.estadoEntrega === 'pendiente_recojo' && (
          <div>
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Fecha estimada de recojo</label>
            <input
              type="date"
              value={form.fechaRecojo}
              onChange={(e) => setForm({ ...form, fechaRecojo: e.target.value })}
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Total (Auto)</label>
          <input
            type="text"
            value={`Bs ${total.toLocaleString()}`}
            readOnly
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-accent-yellow text-sm font-semibold outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">Observaciones / detalles de la nota</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            placeholder="Ej: cliente paga por adelantado y recoge el viernes; entregar con factura; contacto de recojo..."
            rows={3}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
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
          {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Guardar Venta'}
        </button>
      </div>
    </div>
  );
}
