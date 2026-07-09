import { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import type { RegistroAcabado } from '../../types';

const emptyForm: RegistroAcabado = {
  id: '',
  fecha: new Date().toISOString().split('T')[0],
  area: 'compresora',
  operarios: '',
  piezas: 0,
  bandejas: 0,
  kilos: 0,
  observaciones: '',
};

export function Acabado() {
  const { acabado: registros, addAcabado, updateAcabado, deleteAcabado } = useAppContext();
  const [form, setForm] = useState<RegistroAcabado>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const resumen = useMemo(() => ({
    piezas: registros.reduce((sum, item) => sum + Number(item.piezas || 0), 0),
    bandejas: registros.reduce((sum, item) => sum + Number(item.bandejas || 0), 0),
    kilos: registros.reduce((sum, item) => sum + Number(item.kilos || 0), 0),
  }), [registros]);

  const save = async () => {
    if (!form.operarios.trim()) {
      alert('Indica los operarios del registro.');
      return;
    }
    if (editingId) {
      const updated = { ...form, id: editingId };
      updateAcabado(editingId, updated);
    } else {
      const nuevo = { ...form, id: Date.now().toString() };
      addAcabado(nuevo);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const edit = (registro: RegistroAcabado) => {
    setForm(registro);
    setEditingId(registro.id);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (confirm('Eliminar este registro de acabado?')) {
      deleteAcabado(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Produccion de Acabado</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">COMPRESORA, SELLADO Y STOCK TERMINADO</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-accent-yellow text-black text-xs font-semibold rounded">
          Nuevo registro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric title="Piezas procesadas" value={resumen.piezas.toLocaleString('es-BO')} />
        <Metric title="Bandejas" value={resumen.bandejas.toLocaleString('es-BO')} />
        <Metric title="Kilos" value={`${resumen.kilos.toLocaleString('es-BO')} kg`} />
      </div>

      <Card title="Registros de acabado" badge={{ label: `${registros.length} registros`, type: 'info' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Fecha', 'Area', 'Operarios', 'Piezas', 'Bandejas', 'Kg', 'Observaciones', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id} className="border-b border-dark-border hover:bg-dark-surface2">
                  <td className="px-3 py-2 font-mono text-text-secondary">{registro.fecha}</td>
                  <td className="px-3 py-2"><Badge label={registro.area} type={registro.area === 'compresora' ? 'warning' : 'success'} /></td>
                  <td className="px-3 py-2 text-text-secondary">{registro.operarios}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{registro.piezas}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{registro.bandejas}</td>
                  <td className="px-3 py-2 font-mono text-accent-yellow">{registro.kilos}</td>
                  <td className="px-3 py-2 text-text-tertiary max-w-xs truncate">{registro.observaciones || '-'}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => edit(registro)} className="text-accent-blue text-xs mr-3 hover:underline">Editar</button>
                    <button onClick={() => remove(registro.id)} className="text-status-danger text-xs hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {registros.length === 0 && <div className="py-10 text-center text-sm text-text-tertiary">Sin registros de acabado. Crea el primer registro para empezar el control.</div>}
        </div>
      </Card>

      <Card title="Stock terminado">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Cajas', pct: 70, qty: '700 u.' },
            { name: 'Nodulos', pct: 45, qty: '2,250 u.' },
            { name: 'Barras', pct: 85, qty: '1,260 u.' },
          ].map((item) => (
            <div key={item.name} className="bg-dark-surface2 border border-dark-border rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{item.name}</span>
                <span className="font-mono text-text-tertiary">{item.qty}</span>
              </div>
              <div className="h-2 bg-dark-bg rounded overflow-hidden">
                <div className="h-full bg-status-success" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={showForm} title={editingId ? 'Editar acabado' : 'Nuevo acabado'} onClose={() => setShowForm(false)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} />
          <label>
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Area</span>
            <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as RegistroAcabado['area'] })} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none">
              <option value="compresora">Compresora</option>
              <option value="sellado">Sellado</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <Field label="Operarios" value={form.operarios} onChange={(value) => setForm({ ...form, operarios: value })} />
          </div>
          <Field label="Piezas" type="number" value={String(form.piezas || '')} onChange={(value) => setForm({ ...form, piezas: Number(value) })} />
          <Field label="Bandejas" type="number" value={String(form.bandejas || '')} onChange={(value) => setForm({ ...form, bandejas: Number(value) })} />
          <Field label="Kilos" type="number" value={String(form.kilos || '')} onChange={(value) => setForm({ ...form, kilos: Number(value) })} />
          <div className="md:col-span-2">
            <Field label="Observaciones" value={form.observaciones} onChange={(value) => setForm({ ...form, observaciones: value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-dark-border">
          <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-dark-surface3 border border-dark-border rounded text-sm">Cancelar</button>
          <button onClick={save} className="px-4 py-2 bg-accent-yellow text-black rounded text-sm font-semibold">Guardar</button>
        </div>
      </Modal>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
      <div className="text-xs font-mono text-text-tertiary uppercase">{title}</div>
      <div className="text-2xl font-bebas text-text-primary mt-1">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <input value={value} type={type} onChange={(e) => onChange(e.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none" />
    </label>
  );
}
