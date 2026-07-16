import { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { Modal } from '../common/Modal';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { useAppContext } from '../../context/AppContext';
import { generarReporteCobro } from '../../services/pdfService';
import { defaultDateRange, filterByDateRange } from '../../utils/dateFilters';

interface CobrosProps {
  onNewClick?: () => void;
  userRole?: string;
}

const money = (value: number) => `Bs ${Math.round(value || 0).toLocaleString('es-BO')}`;

export function Cobros({ onNewClick, userRole = 'operario' }: CobrosProps = {}) {
  const { cobros, clientes, updateCobro } = useAppContext();
  const [dateRange, setDateRange] = useState(defaultDateRange());
  const [reportCobro, setReportCobro] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const canEdit = ['admin', 'supervisor', 'supervisor_ventas', 'finanzas'].includes(userRole);
  const filteredCobros = filterByDateRange(cobros, dateRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Cobros</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">CUENTAS POR COBRAR Y RECUPERACION</p>
        </div>
        <button onClick={onNewClick} className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 w-fit">
          + Registrar cobro
        </button>
      </div>

      <Card title="Cobros registrados" badge={{ label: `${filteredCobros.length} registros`, type: 'info' }}>
        <div className="mb-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Fecha cobro', 'Cliente', 'NE correspondientes', 'Monto cobrado', 'Metodo', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCobros.map((cobro) => (
                <tr key={cobro.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                  <td className="px-3 py-2 font-mono text-text-secondary">{cobro.fecha}</td>
                  <td className="px-3 py-2 text-text-secondary">{cobro.cliente}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{cobro.notasCorrespondientes}</td>
                  <td className="px-3 py-2 font-mono text-status-success font-semibold">{money(cobro.montoCobrado)}</td>
                  <td className="px-3 py-2"><Badge label={cobro.metodoPago === 'efectivo' ? 'Efectivo' : cobro.metodoPago === 'transferencia' ? 'Transferencia' : 'Cheque'} type={cobro.metodoPago === 'efectivo' ? 'success' : 'info'} /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {canEdit && (
                        <button onClick={() => setEditing(cobro)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-blue hover:text-accent-blue" title="Editar cobro">
                          Editar
                        </button>
                      )}
                      <button onClick={() => setReportCobro(cobro)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow" title="Descargar reporte PDF">
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCobros.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin cobros en este filtro.</div>}
        </div>
      </Card>

      <ReportDownloadModal
        isOpen={Boolean(reportCobro)}
        title="Recibo de pago"
        subtitle={reportCobro ? `Cobro de ${reportCobro.cliente}` : ''}
        onClose={() => setReportCobro(null)}
        onConfirm={(options) => reportCobro && generarReporteCobro(reportCobro, options)}
      />
      <Modal isOpen={Boolean(editing)} title="Editar cobro" onClose={() => setEditing(null)}>
        {editing && (
          <CobroEditForm
            initialData={editing}
            clientes={clientes}
            onCancel={() => setEditing(null)}
            onSave={async (data) => {
              await updateCobro(editing.id, data);
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function CobroEditForm({ initialData, clientes, onSave, onCancel }: { initialData: any; clientes: any[]; onSave: (data: any) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({
    fecha: initialData.fecha || new Date().toISOString().split('T')[0],
    cliente: initialData.cliente || '',
    montoCobrado: Number(initialData.montoCobrado || 0),
    metodoPago: initialData.metodoPago || 'efectivo',
    notasCorrespondientes: initialData.notasCorrespondientes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.cliente || form.montoCobrado <= 0) {
      setError('Cliente y monto son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el cobro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="rounded border border-status-danger bg-status-danger bg-opacity-10 px-3 py-2 text-sm text-status-danger">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} />
        <label className="block">
          <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Cliente</span>
          <input
            list="clientes-cobro-edit"
            value={form.cliente}
            onChange={(event) => setForm({ ...form, cliente: event.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
          <datalist id="clientes-cobro-edit">
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.nombre} />)}
          </datalist>
        </label>
        <Field label="Monto" type="number" value={String(form.montoCobrado || '')} onChange={(value) => setForm({ ...form, montoCobrado: Number(value) })} />
        <label className="block">
          <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Metodo</span>
          <select value={form.metodoPago} onChange={(event) => setForm({ ...form, metodoPago: event.target.value })} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
          </select>
        </label>
        <Field label="Referencia / NE" value={form.notasCorrespondientes} onChange={(value) => setForm({ ...form, notasCorrespondientes: value })} className="sm:col-span-2" />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-dark-border">
        <button onClick={onCancel} disabled={saving} className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow disabled:opacity-50">Cancelar</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', className = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none" />
    </label>
  );
}
