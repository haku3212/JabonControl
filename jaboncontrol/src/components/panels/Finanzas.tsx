import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ventaSaldoPendiente } from '../../utils/financial';
import { finanzasService } from '../../services/api';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { KPICard } from '../common/KPICard';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { generarReporteFinanciero } from '../../services/pdfService';

interface MovimientoFinanciero {
  id?: string;
  fecha: string;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  concepto: string;
  tercero: string;
  metodoPago: string;
  referencia: string;
  monto: number;
  origen?: string;
  notas?: string;
}

const emptyForm: MovimientoFinanciero = {
  fecha: new Date().toISOString().split('T')[0],
  tipo: 'egreso',
  categoria: 'Operativo',
  concepto: '',
  tercero: '',
  metodoPago: 'efectivo',
  referencia: '',
  monto: 0,
  origen: 'manual',
  notas: '',
};

const money = (value: number) => `Bs ${Math.round(value).toLocaleString('es-BO')}`;

const normalizeKey = (key: string) => key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

const getCell = (row: Record<string, any>, names: string[]) => {
  const entries = Object.entries(row);
  for (const name of names) {
    const wanted = normalizeKey(name);
    const found = entries.find(([key]) => normalizeKey(key) === wanted);
    if (found) return found[1];
  }
  return '';
};

const sanitizeImportedValue = (value: unknown) => {
  // Excel puede traer formulas u objetos; aqui solo aceptamos texto/numero/fecha simple.
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') return '';
  return String(value).replace(/^[=+\-@]/, '').trim().slice(0, 180);
};

const parseCsvLine = (line: string) => {
  // Parser CSV pequeno para importaciones simples, respetando comillas dobles.
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
};

const parseCsv = async (file: File) => {
  // CSV se lee como texto plano para evitar librerias con superficie innecesaria.
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const headers = parseCsvLine(lines[0] || '').map((header) => sanitizeImportedValue(header));
  return lines.slice(1, 501).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = sanitizeImportedValue(cells[index]);
      return row;
    }, {});
  });
};

const classifyRow = (row: Record<string, any>): MovimientoFinanciero => {
  const ingreso = Number(getCell(row, ['ingreso', 'haber', 'credito', 'cobro', 'entrada']) || 0);
  const egreso = Number(getCell(row, ['egreso', 'debe', 'debito', 'gasto', 'salida']) || 0);
  const rawMonto = Number(getCell(row, ['monto', 'importe', 'total', 'valor']) || 0);
  const monto = Math.abs(ingreso || egreso || rawMonto);
  const tipoTexto = String(getCell(row, ['tipo', 'movimiento']) || '').toLowerCase();
  const tipo = egreso > 0 || rawMonto < 0 || tipoTexto.includes('egreso') || tipoTexto.includes('gasto') ? 'egreso' : 'ingreso';
  const concepto = String(getCell(row, ['concepto', 'descripcion', 'detalle', 'glosa']) || 'Movimiento importado').trim();

  return {
    fecha: String(getCell(row, ['fecha', 'date']) || new Date().toISOString().split('T')[0]).slice(0, 10),
    tipo,
    categoria: String(getCell(row, ['categoria', 'rubro']) || (tipo === 'ingreso' ? 'Ventas/Cobros' : 'Gastos')).trim(),
    concepto,
    tercero: String(getCell(row, ['tercero', 'cliente', 'proveedor', 'nombre']) || '').trim(),
    metodoPago: String(getCell(row, ['metodo', 'metodoPago', 'formaPago', 'banco']) || '').trim(),
    referencia: String(getCell(row, ['referencia', 'numero', 'documento', 'comprobante']) || '').trim(),
    monto,
    origen: 'excel',
    notas: '',
  };
};

export function Finanzas() {
  const { ventas, cobros } = useAppContext();
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);
  const [form, setForm] = useState<MovimientoFinanciero>(emptyForm);
  const [preview, setPreview] = useState<MovimientoFinanciero[]>([]);
  const [filter, setFilter] = useState('todos');
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setMovimientos(await finanzasService.listarMovimientos());
    } catch (error: any) {
      setMessage(error.message || 'No se pudieron cargar las finanzas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resumen = useMemo(() => {
    const ingresosVentas = ventas.reduce((sum, venta) => sum + (venta.total || venta.precioTotal || 0), 0);
    const cobrado = cobros.reduce((sum, cobro) => sum + cobro.montoCobrado, 0);
    const porCobrar = ventas.reduce((sum, venta) => sum + ventaSaldoPendiente(venta), 0);
    const ingresosExtra = movimientos.filter((m) => m.tipo === 'ingreso').reduce((sum, item) => sum + Number(item.monto || 0), 0);
    const egresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((sum, item) => sum + Number(item.monto || 0), 0);
    const ingresosTotales = ingresosVentas + ingresosExtra;

    return {
      ingresosTotales,
      cobrado,
      porCobrar,
      egresos,
      utilidad: ingresosTotales - egresos,
      flujoCaja: cobrado + ingresosExtra - egresos,
    };
  }, [ventas, cobros, movimientos]);

  const filteredMovimientos = filter === 'todos' ? movimientos : movimientos.filter((item) => item.tipo === filter);

  const saveManual = async () => {
    if (!form.concepto.trim() || Number(form.monto) <= 0) {
      setMessage('Completa concepto y monto antes de guardar.');
      return;
    }
    try {
      setSaving(true);
      await finanzasService.crearMovimiento(form);
      setForm(emptyForm);
      setMessage('Movimiento registrado correctamente.');
      await load();
    } catch (error: any) {
      setMessage(error.message || 'No se pudo guardar el movimiento.');
    } finally {
      setSaving(false);
    }
  };

  const handleExcel = async (file?: File) => {
    if (!file) return;
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension !== 'csv') {
        setMessage('Archivo no permitido. Por seguridad, importa solo .csv exportado desde Excel.');
        return;
      }
      if (file.size > 1024 * 1024 * 2) {
        setMessage('El archivo es muy grande. Maximo 2 MB por importacion.');
        return;
      }
      const rows = await parseCsv(file);
      const parsed = rows.map(classifyRow).filter((item) => item.monto > 0).slice(0, 500);
      setPreview(parsed);
      setMessage(`${parsed.length} movimientos detectados. Revisa la vista previa antes de importar.`);
    } catch (error: any) {
      setPreview([]);
      setMessage(error.message || 'No se pudo leer el archivo. Verifica que no este protegido o corrupto.');
    }
  };

  const confirmImport = async () => {
    if (preview.length === 0) return;
    try {
      setSaving(true);
      const response = await finanzasService.importarMovimientos(preview);
      setMessage(`${response.inserted} movimientos importados. ${response.skipped?.length || 0} omitidos.`);
      setPreview([]);
      await load();
    } catch (error: any) {
      setMessage(error.message || 'No se pudo importar el CSV.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: MovimientoFinanciero) => {
    if (!item.id || !confirm(`Eliminar movimiento "${item.concepto}"?`)) return;
    await finanzasService.eliminarMovimiento(item.id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Finanzas</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">FLUJO DE CAJA, GASTOS, COBROS E IMPORTACION CSV</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-semibold rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow"
          >
            Exportar PDF
          </button>
          <label className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 cursor-pointer w-fit">
            Importar CSV
            <input type="file" accept=".csv" className="hidden" onChange={(event) => handleExcel(event.target.files?.[0])} />
          </label>
        </div>
      </div>

      {message && (
        <div className="bg-dark-surface2 border border-dark-border rounded-lg px-4 py-3 text-sm text-text-secondary flex justify-between gap-4">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-text-tertiary hover:text-text-primary">Cerrar</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Ingresos totales" value={money(resumen.ingresosTotales)} unit="ventas + otros ingresos" color="green" />
        <KPICard label="Flujo de caja" value={money(resumen.flujoCaja)} unit="cobrado menos egresos" color={resumen.flujoCaja >= 0 ? 'yellow' : 'orange'} />
        <KPICard label="Cuentas por cobrar" value={money(resumen.porCobrar)} unit="saldo pendiente" color="orange" />
        <KPICard label="Utilidad estimada" value={money(resumen.utilidad)} unit="ingresos menos gastos" color={resumen.utilidad >= 0 ? 'blue' : 'orange'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <Card title="Registrar movimiento">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} />
              <Select label="Tipo" value={form.tipo} onChange={(value) => setForm({ ...form, tipo: value as MovimientoFinanciero['tipo'] })}>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </Select>
            </div>
            <Field label="Concepto" value={form.concepto} onChange={(value) => setForm({ ...form, concepto: value })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria" value={form.categoria} onChange={(value) => setForm({ ...form, categoria: value })} />
              <Field label="Monto" type="number" value={String(form.monto || '')} onChange={(value) => setForm({ ...form, monto: Number(value) })} />
            </div>
            <Field label="Cliente / Proveedor" value={form.tercero} onChange={(value) => setForm({ ...form, tercero: value })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Metodo" value={form.metodoPago} onChange={(value) => setForm({ ...form, metodoPago: value })} />
              <Field label="Referencia" value={form.referencia} onChange={(value) => setForm({ ...form, referencia: value })} />
            </div>
            <button
              onClick={saveManual}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded bg-accent-yellow text-black text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar movimiento'}
            </button>
          </div>
        </Card>

        <Card title="Analisis financiero">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <MiniMetric label="Cobrado" value={resumen.cobrado} tone="success" />
            <MiniMetric label="Gastos" value={resumen.egresos} tone="danger" />
            <MiniMetric label="Margen estimado" value={resumen.ingresosTotales ? Math.round((resumen.utilidad / resumen.ingresosTotales) * 100) : 0} suffix="%" tone="info" />
          </div>
          <div className="mt-5 h-3 rounded-full overflow-hidden bg-dark-bg border border-dark-border">
            <div className="h-full bg-status-success" style={{ width: `${Math.min(100, resumen.ingresosTotales ? (resumen.cobrado / resumen.ingresosTotales) * 100 : 0)}%` }} />
          </div>
          <div className="mt-2 text-xs text-text-tertiary">Progreso de cobro sobre ingresos registrados.</div>
        </Card>
      </div>

      {preview.length > 0 && (
        <Card title="Vista previa de importacion" badge={{ label: `${preview.length} filas`, type: 'warning' }}>
          <div className="flex justify-between items-center mb-3 gap-3">
            <p className="text-sm text-text-tertiary">El sistema analiza CSV exportado desde Excel y detecta columnas comunes: fecha, concepto, ingreso, egreso, monto, cliente/proveedor y referencia.</p>
            <button onClick={confirmImport} disabled={saving} className="px-3 py-2 rounded bg-accent-yellow text-black text-xs font-semibold disabled:opacity-60">
              Confirmar importacion
            </button>
          </div>
          <MovimientosTable data={preview.slice(0, 12)} preview />
        </Card>
      )}

      <Card title="Movimientos financieros" badge={{ label: `${filteredMovimientos.length} registros`, type: 'info' }}>
        <div className="mb-4 flex gap-2">
          {['todos', 'ingreso', 'egreso'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3 py-1.5 rounded border text-sm ${filter === item ? 'bg-accent-yellow text-black border-accent-yellow' : 'bg-dark-surface2 text-text-secondary border-dark-border hover:text-text-primary'}`}
            >
              {item}
            </button>
          ))}
        </div>
        {loading ? <div className="py-8 text-center text-text-tertiary text-sm">Cargando movimientos...</div> : <MovimientosTable data={filteredMovimientos} onDelete={remove} />}
      </Card>
      <ReportDownloadModal
        isOpen={showReportModal}
        title="Extracto financiero"
        subtitle={filter === 'todos' ? 'Todos los movimientos' : `Movimientos de ${filter}`}
        onClose={() => setShowReportModal(false)}
        onConfirm={(options) => generarReporteFinanciero(filteredMovimientos, resumen, options)}
      />
    </div>
  );
}

function MovimientosTable({ data, preview = false, onDelete }: { data: MovimientoFinanciero[]; preview?: boolean; onDelete?: (item: MovimientoFinanciero) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-border">
            {['Fecha', 'Tipo', 'Categoria', 'Concepto', 'Tercero', 'Referencia', 'Monto', ''].map((head) => (
              <th key={head} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index} className="border-b border-dark-border hover:bg-dark-surface2">
              <td className="px-3 py-2 font-mono text-text-secondary">{item.fecha}</td>
              <td className="px-3 py-2"><Badge label={item.tipo} type={item.tipo === 'ingreso' ? 'success' : 'danger'} /></td>
              <td className="px-3 py-2 text-text-secondary">{item.categoria}</td>
              <td className="px-3 py-2 text-text-primary">{item.concepto}</td>
              <td className="px-3 py-2 text-text-secondary">{item.tercero || '-'}</td>
              <td className="px-3 py-2 font-mono text-text-tertiary">{item.referencia || '-'}</td>
              <td className={`px-3 py-2 font-mono font-semibold ${item.tipo === 'ingreso' ? 'text-status-success' : 'text-status-danger'}`}>{money(Number(item.monto || 0))}</td>
              <td className="px-3 py-2 text-right">
                {!preview && onDelete && <button onClick={() => onDelete(item)} className="text-status-danger text-xs hover:underline">Eliminar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin movimientos registrados.</div>}
    </div>
  );
}

function MiniMetric({ label, value, suffix = '', tone }: { label: string; value: number; suffix?: string; tone: 'success' | 'danger' | 'info' }) {
  const color = tone === 'success' ? 'text-status-success' : tone === 'danger' ? 'text-status-danger' : 'text-accent-blue';
  return (
    <div className="bg-dark-surface2 border border-dark-border rounded-lg p-4">
      <div className="text-xs font-mono text-text-tertiary uppercase">{label}</div>
      <div className={`text-2xl font-bebas mt-1 ${color}`}>{suffix ? `${value}${suffix}` : money(value)}</div>
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
        className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-yellow outline-none"
      />
    </label>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-yellow outline-none">
        {children}
      </select>
    </label>
  );
}
