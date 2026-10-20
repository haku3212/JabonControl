import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Card } from '../common/Card';
import { KPICard } from '../common/KPICard';
import { Badge } from '../common/Badge';
import { finanzasService } from '../../services/api';

interface Gasto {
  id?: string;
  fecha: string;
  tipo: 'egreso';
  categoria: string;
  concepto: string;
  tercero: string;
  metodoPago: string;
  referencia: string;
  monto: number;
  origen?: string;
  notas?: string;
}

const emptyForm: Gasto = {
  fecha: new Date().toISOString().split('T')[0],
  tipo: 'egreso',
  categoria: 'Compras',
  concepto: '',
  tercero: '',
  metodoPago: 'efectivo',
  referencia: '',
  monto: 0,
  origen: 'compras-gastos',
  notas: '',
};

const money = (value: number) => `Bs ${Math.round(value || 0).toLocaleString('es-BO')}`;

export function ComprasGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [form, setForm] = useState<Gasto>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const rows = await finanzasService.listarMovimientos();
      setGastos(rows.filter((item: Gasto) => item.tipo === 'egreso'));
    } catch (error: any) {
      setMessage(error.message || 'No se pudieron cargar compras y gastos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resumen = useMemo(() => {
    const total = gastos.reduce((sum, item) => sum + Number(item.monto || 0), 0);
    const mes = new Date().toISOString().slice(0, 7);
    const totalMes = gastos
      .filter((item) => String(item.fecha || '').startsWith(mes))
      .reduce((sum, item) => sum + Number(item.monto || 0), 0);
    const proveedores = new Set(gastos.map((item) => item.tercero).filter(Boolean)).size;
    return { total, totalMes, proveedores };
  }, [gastos]);

  const save = async () => {
    if (!form.concepto.trim() || !form.tercero.trim() || Number(form.monto) <= 0) {
      setMessage('Completa proveedor, concepto y monto antes de guardar.');
      return;
    }
    try {
      setSaving(true);
      await finanzasService.crearMovimiento({ ...form, tipo: 'egreso', origen: 'compras-gastos' });
      setForm(emptyForm);
      setMessage('Compra/gasto registrado correctamente.');
      await load();
    } catch (error: any) {
      setMessage(error.message || 'No se pudo guardar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Gasto) => {
    if (!item.id || !confirm(`Eliminar "${item.concepto}"?`)) return;
    try {
      await finanzasService.eliminarMovimiento(item.id);
      await load();
    } catch (error: any) {
      setMessage(error.message || 'No se pudo eliminar el gasto.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Compras y gastos</h1>
        <p className="text-sm text-text-tertiary mt-1">Registro simple de egresos, proveedores, cuentas y comprobantes.</p>
      </div>

      {message && (
        <div className="rounded-md border border-dark-border bg-dark-surface2 px-4 py-3 text-sm text-text-secondary flex justify-between gap-3">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-text-tertiary hover:text-text-primary">Cerrar</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Gastos registrados" value={money(resumen.total)} unit={`${gastos.length} movimientos`} color="orange" />
        <KPICard label="Gastos del mes" value={money(resumen.totalMes)} unit="mes actual" color="yellow" />
        <KPICard label="Proveedores" value={resumen.proveedores} unit="con movimientos" color="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
        <Card title="Nuevo gasto / compra">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} />
              <Field label="Monto Bs" type="number" value={String(form.monto || '')} onChange={(value) => setForm({ ...form, monto: Number(value) })} />
            </div>
            <Field label="Proveedor" value={form.tercero} onChange={(value) => setForm({ ...form, tercero: value })} />
            <Field label="Concepto" value={form.concepto} onChange={(value) => setForm({ ...form, concepto: value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Categoria" value={form.categoria} onChange={(value) => setForm({ ...form, categoria: value })}>
                <option>Compras</option>
                <option>Materia prima</option>
                <option>Empaque</option>
                <option>Transporte</option>
                <option>Servicios</option>
                <option>Gastos administrativos</option>
              </Select>
              <Select label="Metodo pago" value={form.metodoPago} onChange={(value) => setForm({ ...form, metodoPago: value })}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Deposito</option>
                <option value="cheque">Cheque</option>
              </Select>
            </div>
            <Field label="Referencia / factura / recibo" value={form.referencia} onChange={(value) => setForm({ ...form, referencia: value })} />
            <label className="block">
              <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Observaciones</span>
              <textarea
                value={form.notas}
                onChange={(event) => setForm({ ...form, notas: event.target.value })}
                rows={3}
                className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-blue outline-none"
              />
            </label>
            <button onClick={save} disabled={saving} className="w-full rounded-md bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar gasto'}
            </button>
          </div>
        </Card>

        <Card title="Historial de compras y gastos" badge={{ label: `${gastos.length} registros`, type: 'info' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Fecha', 'Categoria', 'Proveedor', 'Concepto', 'Metodo', 'Referencia', 'Monto', ''].map((head) => (
                    <th key={head} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gastos.map((item) => (
                  <tr key={item.id} className="border-b border-dark-border hover:bg-dark-surface2">
                    <td className="px-3 py-2 font-mono text-text-secondary">{item.fecha}</td>
                    <td className="px-3 py-2"><Badge label={item.categoria || 'Gasto'} type="neutral" /></td>
                    <td className="px-3 py-2 text-text-secondary">{item.tercero || '-'}</td>
                    <td className="px-3 py-2 text-text-primary">{item.concepto}</td>
                    <td className="px-3 py-2 text-text-secondary">{item.metodoPago || '-'}</td>
                    <td className="px-3 py-2 font-mono text-text-tertiary">{item.referencia || '-'}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-status-danger">{money(Number(item.monto || 0))}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => remove(item)} className="text-xs text-status-danger hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="py-8 text-center text-text-tertiary text-sm">Cargando gastos...</div>}
            {!loading && gastos.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin gastos registrados.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-blue outline-none"
      />
    </label>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-blue outline-none">
        {children}
      </select>
    </label>
  );
}
