import { FormEvent, useEffect, useRef, useState } from 'react';
import { ClipboardCheck, Download, FilePlus2, FileText, Pencil, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { apiClient } from '../../services/api';
import { expenseError, expenseMoney, expenseToday, parseExpenseAmount } from '../../utils/expenses';

interface Documento {
  id?: string; requestId?: string; revision?: number;
  fecha: string; operacion: string; tipo: string; numero: string; nit: string;
  tercero: string; concepto: string; totalCentavos: number; cuf: string;
  estado: string; notas: string; origenTipo: string; origenId: string;
  actualizadoPor?: string; actualizadoEn?: string;
}
interface Origen { id: string; tipo: string; fecha: string; referencia: string; tercero: string; concepto: string; totalCentavos: number; documentos: number }
interface Datos { documentos: Documento[]; origenes: Origen[] }
const states: Record<string, string> = { pendiente: 'Pendiente', observado: 'Observado', revisado: 'Revisado', anulado: 'Anulado' };
const blank = (): Documento => ({ requestId: crypto.randomUUID(), fecha: expenseToday(), operacion: 'compra', tipo: 'factura', numero: '', nit: '', tercero: '', concepto: '', totalCentavos: 0, cuf: '', estado: 'pendiente', notas: '', origenTipo: '', origenId: '' });
const money = (cents: number) => expenseMoney(cents / 100);
function Badge({ estado }: { estado: string }) { return <span className={`accounting-status status-${estado}`}>{states[estado]}</span>; }
function exportCsv(rows: Documento[], periodo: string) {
  const headers = ['Fecha', 'Operacion', 'Documento', 'Numero', 'NIT', 'Tercero', 'Concepto', 'Total Bs', 'CUF', 'Revision', 'Observaciones', 'Origen', 'ID origen'];
  const cell = (v: unknown) => { const s = String(v ?? ''); return `"${(/^[\s]*[=+@-]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`; };
  const data = [headers, ...rows.map(d => [d.fecha, d.operacion, d.tipo, d.numero, d.nit, d.tercero, d.concepto, (d.totalCentavos / 100).toFixed(2), d.cuf, states[d.estado], d.notas, d.origenTipo, d.origenId])];
  const url = URL.createObjectURL(new Blob(['\ufeff', data.map(r => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `revision-contable-${periodo}.csv`; link.click(); URL.revokeObjectURL(url);
}

export function Contabilidad() {
  const [periodo, setPeriodo] = useState(expenseToday().slice(0, 7));
  const [datos, setDatos] = useState<Datos>({ documentos: [], origenes: [] });
  const [tab, setTab] = useState('resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [operation, setOperation] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Documento | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setDatos({ documentos: [], origenes: [] });
    apiClient.get(`/contabilidad?periodo=${encodeURIComponent(periodo)}`).then(data => { if (active) setDatos(data); })
      .catch(e => { if (active) setError(expenseError(e, 'No se pudo cargar el periodo. Intente nuevamente.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [periodo, refresh]);
  useEffect(() => { setPage(1); }, [periodo, search, state, operation]);
  const live = datos.documentos.filter(d => d.estado !== 'anulado');
  const missing = datos.origenes.filter(o => !o.documentos);
  const filtered = datos.documentos.filter(d => (!state || d.estado === state) && (!operation || d.operacion === operation) && `${d.numero} ${d.tercero} ${d.nit} ${d.concepto} ${d.cuf}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es').trim()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 15));
  const currentPage = Math.min(page, pageCount);
  const registerSource = (o: Origen) => setForm({ ...blank(), operacion: o.tipo === 'venta' ? 'venta' : 'compra', fecha: o.fecha, tercero: o.tercero || '', concepto: o.concepto, totalCentavos: o.totalCentavos, origenTipo: o.tipo, origenId: o.id });
  const save = async (data: Documento) => {
    const saved = data.id ? await apiClient.put(`/contabilidad/documentos/${data.id}`, data) : await apiClient.post('/contabilidad/documentos', data);
    setDatos(old => {
      const docs = [saved, ...old.documentos.filter(d => d.id !== saved.id)];
      // Recompute source links locally; a refresh also includes links from other periods.
      const before = old.documentos.find(d => d.id === saved.id);
      const origins = old.origenes.map(o => {
        const was = before && before.estado !== 'anulado' && before.origenTipo === o.tipo && before.origenId === o.id ? 1 : 0;
        const now = saved.estado !== 'anulado' && saved.origenTipo === o.tipo && saved.origenId === o.id ? 1 : 0;
        return { ...o, documentos: Math.max(0, o.documentos - was + now) };
      });
      return { documentos: docs.filter(d => d.fecha.slice(0, 7) === periodo), origenes: origins };
    });
    setForm(null); setSuccess('Documento guardado. Revision registrada en auditoria.');
  };
  return <section className="accounting-workspace">
    <header className="page-heading"><div><p className="text-xs text-text-tertiary mb-2">Control documental</p><h1>Contabilidad</h1><p className="text-sm text-text-secondary mt-2">Expediente mensual para revision contable</p></div>
      <div className="flex flex-wrap items-end gap-3"><label className="expense-field"><span>Periodo</span><input aria-label="Periodo contable" type="month" min="2000-01" max="2100-12" value={periodo} onChange={e => { if (e.target.value) { setPeriodo(e.target.value); setSuccess(''); } }} /></label><button className="icon-button" aria-label="Actualizar contabilidad" title="Actualizar" disabled={loading} onClick={() => setRefresh(x => x + 1)}><RefreshCw size={18} /></button><button className="action-primary" disabled={loading || !!error} onClick={() => setForm({ ...blank(), fecha: periodo === expenseToday().slice(0, 7) ? expenseToday() : `${periodo}-01` })}><FilePlus2 size={17} />Nuevo documento</button></div>
    </header>
    {error && <div role="alert" className="expense-error mb-4">{error}</div>}
    {success && <div role="status" className="expense-success mb-4">{success}</div>}
    <div role="tablist" aria-label="Vistas de contabilidad" className="accounting-tabs">{[['resumen', 'Resumen'], ['documentos', 'Documentos'], ['pendientes', 'Sin respaldo vinculado']].map(([id, label]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls="accounting-content" onClick={() => setTab(id)}>{label}{id === 'pendientes' && !loading && <span>{missing.length}</span>}</button>)}</div>
    <div id="accounting-content" role="tabpanel" aria-labelledby={`tab-${tab}`}>
    {loading ? <p role="status" className="py-12 text-text-secondary">Cargando expediente...</p> : error ? <div className="py-12"><button className="action-secondary" onClick={() => setRefresh(x => x + 1)}>Reintentar</button></div> : <>
      {tab === 'resumen' && <>
        <dl className="accounting-metrics">{[['Compras documentadas', money(live.filter(d => d.operacion === 'compra').reduce((s, d) => s + d.totalCentavos, 0)), 'Documentos no anulados'], ['Ventas documentadas', money(live.filter(d => d.operacion === 'venta').reduce((s, d) => s + d.totalCentavos, 0)), 'Documentos no anulados'], ['Por revisar', String(live.filter(d => d.estado !== 'revisado').length), 'Pendientes y observados']].map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><p>{note}</p></div>)}</dl>
        <div className="accounting-overview"><section><h2 className="text-base font-semibold mb-5">Revision del periodo</h2>{Object.entries(states).map(([id, label]) => <button className="accounting-review-row" key={id} onClick={() => { setState(id); setTab('documentos'); }}><span className="flex gap-3 items-center"><Badge estado={id} /><span className="sr-only">{label}</span></span><strong>{datos.documentos.filter(d => d.estado === id).length}</strong></button>)}</section>
        <section><h2 className="text-base font-semibold mb-5">Preparacion del expediente</h2><div className="flex gap-3 py-3"><FileText size={20} className="text-accent-blue shrink-0" /><div><p className="font-medium">{missing.length} operaciones sin documento vinculado</p><p className="text-sm text-text-secondary mt-1">Ventas y egresos registrados en el periodo</p></div></div><div className="flex gap-3 py-4"><ShieldCheck size={20} className="text-accent-green shrink-0" /><div><p className="font-medium">Estado tributario: sin validacion</p><p className="text-sm text-text-secondary mt-1">Sin conciliacion RCV ni declaracion presentada desde este modulo.</p></div></div><button className="action-secondary mt-3" disabled={!datos.documentos.length} onClick={() => exportCsv(datos.documentos, periodo)}><Download size={16} />Exportar expediente CSV</button></section></div>
      </>}
      {tab === 'documentos' && <section className="accounting-register"><div className="flex flex-wrap justify-between items-center gap-3 mb-5"><h2 className="text-base font-semibold">Documentos del periodo <span className="text-text-tertiary font-normal">({filtered.length})</span></h2><button className="action-secondary" disabled={!filtered.length} onClick={() => exportCsv(filtered, periodo)}><Download size={16} />Exportar CSV</button></div>
        <div className="accounting-filters"><label className="expense-field"><span className="flex items-center gap-2"><Search size={14} />Buscar</span><input aria-label="Buscar documentos contables" placeholder="Nombre, NIT, numero o concepto" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="expense-field"><span>Operacion</span><select value={operation} onChange={e => setOperation(e.target.value)}><option value="">Todas</option><option value="compra">Compras</option><option value="venta">Ventas</option></select></label><label className="expense-field"><span>Revision</span><select value={state} onChange={e => setState(e.target.value)}><option value="">Todos los estados</option>{Object.entries(states).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div>
        <div className="overflow-x-auto"><table className="w-full accounting-table"><thead><tr>{['Fecha / documento', 'Tercero / concepto', 'Operacion', 'Importe', 'Revision', ''].map((h, i) => <th key={i} scope="col">{h || <span className="sr-only">Acciones</span>}</th>)}</tr></thead><tbody>{filtered.slice((currentPage - 1) * 15, currentPage * 15).map(d => <tr key={d.id}><td>{d.fecha}<small>{d.tipo} {d.numero}</small></td><td><strong className="font-medium">{d.tercero}</strong><small>{d.concepto}</small></td><td className="capitalize">{d.operacion}</td><td className="whitespace-nowrap tabular-nums font-medium">{money(d.totalCentavos)}</td><td><Badge estado={d.estado} /></td><td><button className="icon-button" title={d.estado === 'anulado' ? 'Consultar documento anulado' : 'Revisar documento'} aria-label={`Revisar documento ${d.numero}`} onClick={() => setForm(d)}>{d.estado === 'anulado' ? <FileText size={17} /> : <Pencil size={17} />}</button></td></tr>)}</tbody></table></div>
        {!filtered.length && <p className="text-center text-text-secondary py-12">{datos.documentos.length ? 'No hay documentos con estos filtros.' : 'Todavia no hay documentos registrados en este periodo.'}</p>}
        {filtered.length > 15 && <div className="flex justify-end gap-3 items-center mt-4"><button className="action-secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span className="text-sm">{currentPage} / {pageCount}</span><button className="action-secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div>}
      </section>}
      {tab === 'pendientes' && <section className="accounting-register"><h2 className="text-base font-semibold mb-5">Operaciones sin respaldo vinculado</h2><div className="overflow-x-auto"><table className="w-full accounting-table"><thead><tr><th>Fecha</th><th>Origen</th><th>Tercero</th><th>Importe registrado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{missing.map(o => <tr key={`${o.tipo}:${o.id}`}><td>{o.fecha}</td><td><span className="capitalize">{o.tipo}</span><small>{o.referencia}</small></td><td>{o.tercero || 'Sin tercero'}</td><td className="whitespace-nowrap">{money(o.totalCentavos)}</td><td><button className="action-secondary whitespace-nowrap" onClick={() => registerSource(o)}><FilePlus2 size={16} />Vincular documento</button></td></tr>)}</tbody></table></div>{!missing.length && <div className="py-12 text-center text-text-secondary"><ClipboardCheck size={28} className="mx-auto mb-3" />No hay operaciones sin respaldo vinculado en este periodo.</div>}</section>}
    </>}
    </div>
    {form && <DocumentoEditor initial={form} sources={datos.origenes} onSave={save} onClose={() => setForm(null)} />}
  </section>;
}

function DocumentoEditor({ initial, sources, onSave, onClose }: { initial: Documento; sources: Origen[]; onSave: (d: Documento) => Promise<void>; onClose: () => void }) {
  const [data, setData] = useState(initial);
  const [amount, setAmount] = useState(initial.totalCentavos ? (initial.totalCentavos / 100).toFixed(2).replace('.', ',') : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [discard, setDiscard] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const readOnly = initial.estado === 'anulado';
  const dirty = JSON.stringify(data) !== JSON.stringify(initial) || amount !== (initial.totalCentavos ? (initial.totalCentavos / 100).toFixed(2).replace('.', ',') : '');
  const close = () => { if (busy) return; if (dirty) setDiscard(true); else onClose(); };
  const change = (key: keyof Documento, value: string) => { setDiscard(false); setData(d => ({ ...d, [key]: value })); };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (busy || readOnly) return;
    const total = parseExpenseAmount(amount);
    if (total === null) { setError('Ingrese un importe positivo con hasta dos decimales.'); formRef.current?.querySelector<HTMLInputElement>('[name="importe"]')?.focus(); return; }
    setBusy(true); setError('');
    try { await onSave({ ...data, totalCentavos: Math.round(total * 100) }); }
    catch (e) { setError(expenseError(e, 'No se pudo guardar. Sus datos permanecen en el formulario.')); }
    finally { setBusy(false); }
  };
  return <Modal isOpen title={initial.id ? `Documento ${initial.numero}` : 'Nuevo documento contable'} onClose={close}><form ref={formRef} onSubmit={submit}>
    {error && <p role="alert" className="expense-error mb-4">{error}</p>}
    <fieldset disabled={busy || readOnly} className="min-w-0"><div className="accounting-form-grid">
      <label className="expense-field"><span>Operacion *</span><select value={data.operacion} onChange={e => { setData(d => ({ ...d, operacion: e.target.value, origenTipo: '', origenId: '' })); }}><option value="compra">Compra</option><option value="venta">Venta</option></select></label>
      <label className="expense-field"><span>Tipo de documento *</span><select value={data.tipo} onChange={e => change('tipo', e.target.value)}><option value="factura">Factura</option><option value="recibo">Recibo</option><option value="otro">Otro respaldo</option></select></label>
      <label className="expense-field"><span>Fecha del documento *</span><input required type="date" min="2000-01-01" max="2100-12-31" value={data.fecha} onChange={e => change('fecha', e.target.value)} /></label>
      <label className="expense-field"><span>Numero de documento *</span><input required maxLength={160} value={data.numero} onChange={e => change('numero', e.target.value)} /></label>
      <label className="expense-field"><span>{data.operacion === 'compra' ? 'Proveedor / razon social' : 'Cliente / razon social'} *</span><input required maxLength={160} value={data.tercero} onChange={e => change('tercero', e.target.value)} /></label>
      <label className="expense-field"><span>{data.operacion === 'compra' ? 'NIT del proveedor' : 'NIT del cliente'}{data.tipo === 'factura' ? ' *' : ''}</span><input required={data.tipo === 'factura'} inputMode="numeric" pattern="[0-9]{5,20}" maxLength={20} value={data.nit} onChange={e => change('nit', e.target.value)} /></label>
      <label className="expense-field"><span>Importe total Bs *</span><input name="importe" required inputMode="decimal" maxLength={20} placeholder="0,00" value={amount} onChange={e => { setAmount(e.target.value); setDiscard(false); }} /></label>
      <label className="expense-field"><span>Estado de revision *</span><select value={data.estado} onChange={e => change('estado', e.target.value)}>{Object.entries(states).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
      <label className="expense-field sm:col-span-2"><span>Concepto *</span><input required maxLength={160} value={data.concepto} onChange={e => change('concepto', e.target.value)} /></label>
      <label className="expense-field sm:col-span-2"><span>CUF / codigo fiscal, si corresponde</span><input maxLength={200} value={data.cuf} onChange={e => change('cuf', e.target.value)} /></label>
      <label className="expense-field sm:col-span-2"><span>Operacion relacionada</span><select value={data.origenId ? `${data.origenTipo}:${data.origenId}` : ''} onChange={e => { const source = sources.find(o => `${o.tipo}:${o.id}` === e.target.value); setData(d => ({ ...d, origenTipo: source?.tipo || '', origenId: source?.id || '' })); }}><option value="">Sin vinculo</option>{data.origenId && !sources.some(o => o.id === data.origenId && o.tipo === data.origenTipo) && <option value={`${data.origenTipo}:${data.origenId}`}>Vinculo guardado de otro periodo</option>}{sources.filter(o => o.tipo === (data.operacion === 'venta' ? 'venta' : 'egreso')).map(o => <option key={`${o.tipo}:${o.id}`} value={`${o.tipo}:${o.id}`}>{o.fecha} | {o.referencia} | {o.tercero} | {money(o.totalCentavos)}</option>)}</select></label>
      <label className="expense-field sm:col-span-2"><span>Observaciones{['observado', 'anulado'].includes(data.estado) ? ' *' : ''}</span><textarea required={['observado', 'anulado'].includes(data.estado)} maxLength={2000} rows={3} value={data.notas} onChange={e => change('notas', e.target.value)} /></label>
    </div></fieldset>
    {initial.actualizadoPor && <p className="text-xs text-text-tertiary mt-4">Ultima revision: {initial.actualizadoPor} · {initial.actualizadoEn?.replace('T', ' ').slice(0, 16)} UTC</p>}
    <footer className="accounting-form-footer">{discard ? <><p className="text-sm mr-auto">Hay cambios sin guardar.</p><button key="continue" type="button" className="action-secondary" onClick={e => { e.preventDefault(); setDiscard(false); }}>Seguir editando</button><button key="discard" type="button" className="action-secondary" onClick={onClose}>Descartar cambios</button></> : <><button key="cancel" type="button" className="action-secondary" disabled={busy} onClick={close}>{readOnly ? 'Cerrar' : 'Cancelar'}</button>{!readOnly && <button key="save" className="action-primary" disabled={busy} type="submit"><ShieldCheck size={17} />{busy ? 'Guardando...' : 'Guardar documento'}</button>}</>}</footer>
  </form></Modal>;
}
