import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownLeft, FileText, Save, Wallet } from 'lucide-react';
import { expenseCategories, expenseError, expenseMoney, newExpense, parseExpenseAmount, paymentMethods, type Gasto } from '../../utils/expenses';

export function GastoForm({ initial, providers, onSave, onClose, onBusy, onDirty, discardRequested, onKeepEditing, onDiscard }: { initial: Gasto | null; providers: string[]; onSave: (data: Gasto) => Promise<void>; onClose: () => void; onBusy: (value: boolean) => void; onDirty: () => void; discardRequested: boolean; onKeepEditing: () => void; onDiscard: () => void }) {
  const [form, setForm] = useState<Gasto>(() => initial || newExpense());
  const [amount, setAmount] = useState(initial ? Number(initial.monto).toFixed(2).replace('.', ',') : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const providerList = useId();
  const parsed = parseExpenseAmount(amount);
  const categories = [...new Set([...expenseCategories, form.categoria].filter(Boolean))];
  const update = (key: keyof Gasto, value: string) => { setForm(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: '' })); setError(''); onDirty(); };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || discardRequested) return;
    const next: Record<string, string> = {};
    if (!form.concepto.trim()) next.concepto = 'Ingrese el concepto del egreso.';
    if (!form.tercero.trim()) next.tercero = 'Ingrese el proveedor o beneficiario.';
    if (!form.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(form.fecha) || !Number.isFinite(Date.parse(`${form.fecha}T00:00:00Z`)) || new Date(`${form.fecha}T00:00:00Z`).toISOString().slice(0, 10) !== form.fecha) next.fecha = 'Seleccione una fecha valida.';
    if (parsed === null) next.monto = 'Ingrese un importe positivo, por ejemplo 1.250,50.';
    if (!form.categoria) next.categoria = 'Seleccione una categoria.';
    if (!paymentMethods[form.metodoPago]) next.metodoPago = 'Seleccione un metodo de pago.';
    setErrors(next);
    if (Object.keys(next).length) { requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    setBusy(true); onBusy(true); setError('');
    try { await onSave({ ...form, concepto: form.concepto.trim(), tercero: form.tercero.trim(), monto: parsed!, origen: 'compras-gastos' }); }
    catch (err) { setError(expenseError(err, 'No se pudo conectar para guardar. Sus datos siguen en el formulario.')); }
    finally { setBusy(false); onBusy(false); }
  }
  return <form ref={ref} onSubmit={submit} noValidate className="expense-form" aria-busy={busy}>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_210px] gap-6">
      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <section><h3 className="form-section-heading"><FileText size={16} />Datos del egreso</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ExpenseField label="Fecha" required error={errors.fecha}><input name="fecha" aria-label="Fecha del egreso" required type="date" value={form.fecha} onChange={event => update('fecha', event.target.value)} aria-invalid={!!errors.fecha} /></ExpenseField>
          <ExpenseField label="Importe en bolivianos" required error={errors.monto}><div className="relative"><span className="absolute left-3 top-3 text-sm text-text-tertiary">Bs</span><input name="monto" aria-label="Importe en bolivianos" required type="text" inputMode="decimal" className="!pl-10 tabular-nums font-semibold" placeholder="0,00" value={amount} onChange={event => { setAmount(event.target.value); setErrors(previous => ({ ...previous, monto: '' })); onDirty(); }} aria-invalid={!!errors.monto} /></div></ExpenseField>
          <div className="sm:col-span-2"><ExpenseField label="Concepto" required error={errors.concepto}><input name="concepto" aria-label="Concepto" required autoFocus maxLength={240} value={form.concepto} onChange={event => update('concepto', event.target.value)} placeholder="Ej. Compra de envases de 1 litro" aria-invalid={!!errors.concepto} /></ExpenseField></div>
          <ExpenseField label="Categoria" required error={errors.categoria}><select name="categoria" aria-label="Categoria del egreso" required value={form.categoria} onChange={event => update('categoria', event.target.value)} aria-invalid={!!errors.categoria}><option value="">Seleccione una categoria</option>{categories.map(value => <option key={value}>{value}</option>)}</select></ExpenseField>
          <ExpenseField label="Proveedor / beneficiario" required error={errors.tercero}><input name="tercero" aria-label="Proveedor o beneficiario" required list={providerList} maxLength={160} value={form.tercero} onChange={event => update('tercero', event.target.value)} placeholder="Nombre o razon social" aria-invalid={!!errors.tercero} /><datalist id={providerList}>{providers.map(value => <option key={value} value={value} />)}</datalist></ExpenseField>
        </div></section>
        <section className="border-t border-dark-border pt-5"><h3 className="form-section-heading"><Wallet size={16} />Pago y comprobante</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ExpenseField label="Metodo de pago" required error={errors.metodoPago}><select name="metodoPago" aria-label="Metodo de pago del egreso" required value={form.metodoPago} onChange={event => update('metodoPago', event.target.value)} aria-invalid={!!errors.metodoPago}><option value="">Seleccione un metodo</option>{form.metodoPago && !paymentMethods[form.metodoPago] && <option value={form.metodoPago}>{form.metodoPago} (revisar)</option>}{Object.entries(paymentMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></ExpenseField>
          <ExpenseField label="N. factura / recibo / operacion"><input name="referencia" maxLength={120} value={form.referencia} onChange={event => update('referencia', event.target.value)} placeholder="Opcional" /></ExpenseField>
          <div className="sm:col-span-2"><ExpenseField label="Observaciones"><textarea name="notas" rows={3} maxLength={3000} value={form.notas || ''} onChange={event => update('notas', event.target.value)} placeholder="Detalle adicional" /></ExpenseField></div>
        </div></section>
      </fieldset>
      <aside className="expense-summary"><span className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary"><ArrowDownLeft size={16} className="text-status-danger" />Egreso</span><p className="mt-3 text-2xl font-semibold tabular-nums break-words">{expenseMoney(parsed ?? 0)}</p><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-text-tertiary">Categoria</dt><dd className="mt-1 break-words">{form.categoria || 'Sin categoria'}</dd></div><div><dt className="text-xs text-text-tertiary">Beneficiario</dt><dd className="mt-1 break-words">{form.tercero || 'Sin seleccionar'}</dd></div><div><dt className="text-xs text-text-tertiary">Metodo de pago</dt><dd className="mt-1">{paymentMethods[form.metodoPago] || 'Sin seleccionar'}</dd></div></dl></aside>
    </div>
    {error && <p role="alert" className="form-error-banner">{error}</p>}
    <div className="expense-form-footer">
      {discardRequested ? <div className="w-full"><p role="alert" className="text-sm font-medium mb-3">Hay cambios sin guardar. ¿Desea descartarlos?</p><div className="flex flex-wrap justify-end gap-2"><button type="button" className="action-secondary" onClick={onKeepEditing}>Seguir editando</button><button type="button" className="action-primary !bg-status-danger" onClick={onDiscard}>Descartar cambios</button></div></div> : <><button type="button" disabled={busy} className="action-secondary" onClick={onClose}>Cancelar</button><button disabled={busy} className="action-primary"><Save size={16} />{busy ? 'Guardando...' : initial ? 'Guardar cambios' : 'Registrar egreso'}</button></>}
    </div>
  </form>;
}
function ExpenseField({ label, children, error, required }: { label: string; children: ReactNode; error?: string; required?: boolean }) {
  const id = useId();
  return <label className="expense-field"><span className="expense-label">{label}{required && <span className="text-status-danger ml-1">*</span>}</span>{children}{error && <span id={id} role="alert" className="expense-field-error">{error}</span>}</label>;
}
