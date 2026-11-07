import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, CheckCircle2, ChevronLeft, ChevronRight, Eye, Pencil, Plus, ReceiptText, RefreshCw, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { GastoForm } from '../forms/GastoForm';
import { contactosService, finanzasService } from '../../services/api';
import { expenseCategories, expenseError, expenseMoney, expenseToday, paymentMethods, type Gasto } from '../../utils/expenses';

const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function ComprasGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [providerError, setProviderError] = useState(false);
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Gasto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError('');
    finanzasService.listarMovimientos().then(rows => { if (active) setGastos(rows.filter((item: Gasto) => item.tipo === 'egreso')); }).catch(error => { if (active) setLoadError(expenseError(error, 'No se pudo conectar para cargar los egresos. Intente nuevamente.')); }).finally(() => { if (active) setLoading(false); });
    contactosService.listar().then(rows => {
      if (active) { setProviders(rows.filter((item: { estado: string }) => item.estado === 'activo').map((item: { nombre: string }) => item.nombre)); setProviderError(false); }
    }).catch(() => { if (active) setProviderError(true); });
    return () => { active = false; };
  }, [reload]);
  useEffect(() => { setPage(1); }, [search, category, method, from, until]);
  const categories = [...new Set([...expenseCategories, ...gastos.map(item => item.categoria)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const suggestions = [...new Set([...providers, ...gastos.map(item => item.tercero)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const invalidRange = !!from && !!until && from > until;
  const filtered = useMemo(() => gastos.filter(item => (!from || item.fecha >= from) && (!until || item.fecha <= until) && (!category || item.categoria === category) && (!method || item.metodoPago === method) && fold(search).trim().split(/\s+/).every(term => fold([item.concepto, item.tercero, item.referencia, item.categoria].join(' ')).includes(term))), [gastos, search, category, method, from, until]);
  const total = filtered.reduce((sum, item) => sum + Number(item.monto), 0);
  const month = expenseToday().slice(0, 7);
  const monthTotal = gastos.filter(item => item.fecha.startsWith(month)).reduce((sum, item) => sum + Number(item.monto), 0);
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const currentPage = Math.min(page, pages);
  const detail = gastos.find(item => item.id === detailId);
  const hasFilters = !!(search || category || method || from || until);
  function openForm(item: Gasto | null = null) { setEditing(item); setDirty(false); setDiscard(false); setFormOpen(true); setNotice(''); }
  function requestClose() { if (busy) return; if (dirty) setDiscard(true); else setFormOpen(false); }
  async function save(data: Gasto) {
    const saved = editing?.id ? await finanzasService.actualizarMovimiento(editing.id, data) : await finanzasService.crearMovimiento(data);
    setGastos(previous => [saved, ...previous.filter(item => item.id !== saved.id)].sort((a, b) => b.fecha.localeCompare(a.fecha)));
    setFormOpen(false); setDirty(false);
    setNotice(editing ? 'Egreso actualizado correctamente.' : 'Egreso registrado correctamente.');
  }
  async function remove() {
    if (!deleting?.id || deleteBusy) return;
    setDeleteBusy(true); setDeleteError('');
    try { await finanzasService.eliminarMovimiento(deleting.id); setGastos(previous => previous.filter(item => item.id !== deleting.id)); setDeleting(null); setNotice('Egreso eliminado. Los totales fueron actualizados.'); }
    catch (error) { setDeleteError(expenseError(error, 'No se pudo conectar para eliminar el egreso. Intente nuevamente.')); }
    finally { setDeleteBusy(false); }
  }

  return <div className="space-y-5">
    <div className="page-heading"><div><p className="page-eyebrow">Tesoreria</p><h1>Compras y gastos</h1><p className="page-description">Egresos y pagos de la empresa</p></div><div className="flex items-center gap-2"><button className="icon-button" title="Actualizar egresos" aria-label="Actualizar egresos" disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={18} /></button><button className="action-primary" disabled={loading || !!loadError} onClick={() => openForm()}><Plus size={17} />Nuevo egreso</button></div></div>
    {notice && <div role="status" className="success-banner"><CheckCircle2 size={17} className="shrink-0" /><span className="flex-1">{notice}</span><button className="icon-button" aria-label="Cerrar aviso" title="Cerrar aviso" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {loadError && <div role="alert" className="form-error-banner flex flex-wrap justify-between gap-2"><span>{loadError}</span><button className="action-secondary" onClick={() => setReload(value => value + 1)}>Reintentar</button></div>}
    <dl className="expense-metrics"><div><dt><ArrowDownLeft size={16} />Total filtrado</dt><dd>{expenseMoney(total)}</dd><p>{filtered.length} movimientos</p></div><div><dt><ReceiptText size={16} />Este mes</dt><dd>{expenseMoney(monthTotal)}</dd><p>{new Date(`${month}-02T12:00:00`).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}</p></div><div><dt>Proveedores / beneficiarios</dt><dd>{new Set(filtered.map(item => fold(item.tercero.trim())).filter(Boolean)).size}</dd><p>En los resultados actuales</p></div></dl>
    <section className="module-section">
      <div className="module-section-header"><h2 className="text-sm font-semibold">Historial de egresos</h2><div className="flex items-center gap-3"><span className="text-xs text-text-tertiary">{filtered.length} registros</span><button className="icon-button !w-8 !h-8" title="Limpiar filtros" aria-label="Limpiar filtros de egresos" disabled={!hasFilters} onClick={() => { setSearch(''); setCategory(''); setMethod(''); setFrom(''); setUntil(''); }}><RotateCcw size={16} /></button></div></div>
      <div className="expense-filters">
        <label className="expense-field min-w-0"><span className="expense-label">Buscar</span><div className="relative"><Search size={16} className="absolute left-3 top-3 text-text-tertiary" /><input aria-label="Buscar egresos" className="!pl-9" placeholder="Concepto, proveedor o referencia" value={search} onChange={event => setSearch(event.target.value)} /></div></label>
        <label className="expense-field"><span className="expense-label">Categoria</span><select aria-label="Filtrar categoria" value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="expense-field"><span className="expense-label">Metodo de pago</span><select aria-label="Filtrar metodo de pago" value={method} onChange={event => setMethod(event.target.value)}><option value="">Todos</option>{Object.entries(paymentMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="expense-field"><span className="expense-label">Desde</span><input aria-label="Egresos desde" type="date" value={from} max={until || undefined} onChange={event => setFrom(event.target.value)} /></label>
        <label className="expense-field"><span className="expense-label">Hasta</span><input aria-label="Egresos hasta" type="date" value={until} min={from || undefined} onChange={event => setUntil(event.target.value)} /></label>
      </div>
      {invalidRange && <p role="alert" className="px-4 pb-3 text-sm text-status-danger">La fecha inicial no puede ser posterior a la fecha final.</p>}
      {loading ? <div role="status" className="empty-state">Cargando egresos...</div> : !filtered.length ? <div className="empty-state"><ReceiptText size={32} strokeWidth={1.5} /><p>{loadError ? 'No se pudo cargar el historial.' : hasFilters ? 'No hay egresos que coincidan con los filtros.' : 'Todavia no hay egresos registrados.'}</p>{!hasFilters && !loadError && <button className="action-secondary" onClick={() => openForm()}><Plus size={16} />Registrar egreso</button>}</div> : <>
        <div className="overflow-x-auto"><table className="w-full text-sm expense-table"><thead><tr>{['Fecha', 'Concepto / beneficiario', 'Categoria', 'Metodo / referencia', 'Importe', 'Acciones'].map(label => <th scope="col" key={label} className={`px-4 ${label === 'Importe' ? 'text-right' : 'text-left'}`}>{label}</th>)}</tr></thead><tbody>{filtered.slice((currentPage - 1) * 15, currentPage * 15).map(item => <tr key={item.id} className="border-b border-dark-border"><td className="px-4 whitespace-nowrap text-text-secondary tabular-nums">{item.fecha.split('-').reverse().join('/')}</td><td className="px-4 min-w-[220px] max-w-sm"><button className="font-medium text-left hover:text-accent-blue break-words" onClick={() => setDetailId(item.id!)}>{item.concepto}</button><p className="text-xs text-text-tertiary mt-1 break-words">{item.tercero || 'Sin beneficiario'}</p></td><td className="px-4"><span className="contact-tag">{item.categoria || 'Sin clasificar'}</span></td><td className="px-4 max-w-[180px]"><span>{paymentMethods[item.metodoPago] || item.metodoPago || 'Sin especificar'}</span><p className="text-xs text-text-tertiary mt-1 break-words">{item.referencia || 'Sin referencia'}</p></td><td className="px-4 text-right font-semibold tabular-nums whitespace-nowrap">{expenseMoney(item.monto)}</td><td className="px-3"><div className="flex justify-end"><button className="icon-button" title={`Ver ${item.concepto}`} aria-label={`Ver ${item.concepto}`} onClick={() => setDetailId(item.id!)}><Eye size={17} /></button><button className="icon-button" title={`Editar ${item.concepto}`} aria-label={`Editar ${item.concepto}`} onClick={() => openForm(item)}><Pencil size={17} /></button><button className="icon-button text-status-danger" title={`Eliminar ${item.concepto}`} aria-label={`Eliminar ${item.concepto}`} onClick={() => { setDeleting(item); setDeleteError(''); }}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>
        <div className="table-pagination"><span>{(currentPage - 1) * 15 + 1}–{Math.min(currentPage * 15, filtered.length)} de {filtered.length}</span><div className="flex items-center gap-3"><span>Pagina {currentPage} de {pages}</span><button className="icon-button" title="Pagina anterior" aria-label="Pagina anterior de egresos" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button><button className="icon-button" title="Pagina siguiente" aria-label="Pagina siguiente de egresos" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button></div></div>
      </>}
    </section>
    {formOpen && <Modal isOpen title={editing ? 'Editar egreso' : 'Nuevo egreso'} onClose={requestClose}>
      {providerError && <p role="status" className="text-xs text-status-warning mb-4">No se pudieron cargar las sugerencias de Contactos. Puede escribir el beneficiario.</p>}
      <GastoForm initial={editing} providers={suggestions} onSave={save} onClose={requestClose} onBusy={setBusy} onDirty={() => setDirty(true)} discardRequested={discard} onKeepEditing={() => setDiscard(false)} onDiscard={() => { setFormOpen(false); setDirty(false); }} />
    </Modal>}
    <Modal isOpen={!!detail} title="Detalle del egreso" onClose={() => setDetailId(null)}>{detail && <><div className="flex flex-wrap justify-between items-start gap-4 pb-5 border-b border-dark-border"><div className="min-w-0"><p className="text-xs text-text-tertiary mb-2">{detail.fecha.split('-').reverse().join('/')} · {detail.categoria}</p><h2 className="text-lg font-semibold break-words">{detail.concepto}</h2></div><p className="text-xl font-semibold tabular-nums">{expenseMoney(detail.monto)}</p></div><dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-5">{[['Beneficiario', detail.tercero], ['Metodo de pago', paymentMethods[detail.metodoPago] || detail.metodoPago], ['Comprobante / referencia', detail.referencia], ['Observaciones', detail.notas]].map(([label, value]) => <div key={label}><dt className="text-xs text-text-tertiary mb-1">{label}</dt><dd className="text-sm whitespace-pre-wrap break-words">{value || 'Sin especificar'}</dd></div>)}</dl><div className="flex justify-end"><button className="action-secondary" onClick={() => { setDetailId(null); openForm(detail); }}><Pencil size={16} />Editar egreso</button></div></>}</Modal>
    <Modal isOpen={!!deleting} title="Eliminar egreso" onClose={() => { if (!deleteBusy) setDeleting(null); }}><p className="text-sm font-medium break-words">{deleting?.concepto}</p><p className="text-lg font-semibold my-3">{expenseMoney(deleting?.monto || 0)}</p><p className="text-sm text-text-secondary">El importe dejara de contar en los egresos. Se conservara el evento en auditoria.</p>{deleteError && <p role="alert" className="form-error-banner mt-4">{deleteError}</p>}<div className="flex flex-wrap justify-end gap-2 mt-5"><button disabled={deleteBusy} className="action-secondary" onClick={() => setDeleting(null)}>Cancelar</button><button disabled={deleteBusy} className="action-primary !bg-status-danger" onClick={remove}><Trash2 size={16} />{deleteBusy ? 'Eliminando...' : 'Eliminar egreso'}</button></div></Modal>
  </div>;
}
