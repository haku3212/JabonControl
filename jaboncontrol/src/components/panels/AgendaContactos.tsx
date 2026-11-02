import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Archive, ArchiveRestore, ContactRound, Eye, Mail, MessageCircle, Pencil, Phone, Plus, RefreshCw, Save, Search, Tags, Truck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { apiClient, contactosService } from '../../services/api';
import type { ContactoEmpresa } from '../../types';

const inputClass = 'w-full min-w-0 rounded-md border border-dark-border bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue';
const fold = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const categoriesOf = (item: ContactoEmpresa) => item.categorias || (item.categoria ? [item.categoria] : []);
const emptyContact = (): ContactoEmpresa => ({ id: '', nombre: '', tipo: 'persona', empresa: '', categoria: '', categorias: [], proveedorDe: '', telefono: '', telefonoAlternativo: '', whatsapp: '', email: '', ubicacion: '', direccion: '', personaContacto: '', notas: '', placa: '', vehiculo: '', cobertura: '', estado: 'activo', fechaRegistro: '', revision: 0 });

export function Contactos({ userRole }: { userRole: string }) {
  const [items, setItems] = useState<ContactoEmpresa[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('activo');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ContactoEmpresa | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [archive, setArchive] = useState<ContactoEmpresa | null>(null);
  const [busy, setBusy] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([contactosService.listar(), apiClient.get('/contactos/categorias')]).then(([contacts, values]) => {
      if (active) { setItems(contacts); setCategories(values); }
    }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  useEffect(() => { setPage(1); }, [search, category, city, status]);
  const filtered = useMemo(() => items.filter(item => {
    const haystack = fold([item.nombre, item.empresa, item.personaContacto, item.proveedorDe, item.telefono, item.telefonoAlternativo, item.email, item.whatsapp, item.ubicacion, item.placa, ...categoriesOf(item)].join(' '));
    return (!status || item.estado === status) && (!category || categoriesOf(item).includes(category)) && (!city || item.ubicacion === city) && fold(search).trim().split(/\s+/).every(term => haystack.includes(term));
  }), [items, search, category, city, status]);
  const cities = [...new Set(items.map(item => item.ubicacion).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const detail = items.find(item => item.id === detailId);
  function accept(item: ContactoEmpresa) {
    setItems(previous => [...previous.filter(value => value.id !== item.id), item].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  }
  const save = async (data: ContactoEmpresa, confirmarDuplicado: boolean) => {
    const body = { ...data, confirmarDuplicado };
    const saved = editing ? await contactosService.actualizar(editing.id, body) : await contactosService.crear(body);
    accept(saved); setFormOpen(false);
    setNotice(editing ? 'Contacto actualizado.' : 'Contacto registrado.');
  };
  async function changeStatus() {
    if (!archive) return;
    setBusy(true); setError('');
    try {
      accept(await apiClient.put(`/contactos/${encodeURIComponent(archive.id)}/estado`, { estado: archive.estado === 'activo' ? 'inactivo' : 'activo', revision: archive.revision || 0 }));
      setNotice(archive.estado === 'activo' ? 'Contacto archivado.' : 'Contacto reactivado.'); setArchive(null);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function createCategory(nombre: string) {
    const result = await apiClient.post('/contactos/categorias', { nombre });
    setCategories(previous => [...previous, result.nombre].sort((a, b) => a.localeCompare(b, 'es')));
    return result.nombre as string;
  }
  async function addCategory(event: FormEvent) {
    event.preventDefault(); setCategoryBusy(true); setCategoryError('');
    try {
      await createCategory(newCategory);
      setNewCategory(''); setNotice('Categoria registrada.');
    } catch (err) { setCategoryError((err as Error).message); }
    finally { setCategoryBusy(false); }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1>Contactos</h1><p className="text-sm text-text-tertiary mt-1">{items.filter(item => item.estado === 'activo').length} activos · {items.filter(item => item.estado !== 'activo').length} archivados</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="icon-button" title="Actualizar agenda" aria-label="Actualizar agenda" disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={18} /></button>
        {userRole === 'admin' && <button className="action-secondary" onClick={() => { setCategoryOpen(true); setCategoryError(''); }}><Tags size={16} />Categorias</button>}
        <button className="action-primary" disabled={loading || !!error} onClick={() => { setEditing(null); setFormOpen(true); setNotice(''); }}><Plus size={16} />Nuevo contacto</button>
      </div>
    </div>
    {error && <div role="alert" className="text-sm text-status-danger border-l-4 border-status-danger bg-white p-3 flex flex-wrap items-center justify-between gap-2"><span>{error}</span><button className="action-secondary" onClick={() => setReload(value => value + 1)}>Reintentar</button></div>}
    {notice && <p role="status" className="text-sm text-status-success">{notice}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_200px_180px_160px] gap-3">
      <label className="block min-w-0"><span className="block text-xs text-text-secondary mb-1.5">Buscar</span><div className="relative"><Search size={16} className="absolute left-3 top-3 text-text-tertiary" /><input aria-label="Buscar contactos" className={`${inputClass} pl-9`} value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre, empresa, telefono..." /></div></label>
      <Filter label="Categoria" value={category} onChange={setCategory} options={categories} all="Todas las categorias" />
      <Filter label="Ciudad" value={city} onChange={setCity} options={cities} all="Todas las ciudades" />
      <label className="block min-w-0"><span className="block text-xs text-text-secondary mb-1.5">Estado</span><select aria-label="Estado" className={inputClass} value={status} onChange={event => setStatus(event.target.value)}><option value="activo">Activos</option><option value="inactivo">Archivados</option><option value="">Todos</option></select></label>
    </div>
    <section className="module-section">
      <div className="module-section-header"><h2 className="text-sm font-semibold">Agenda empresarial</h2><span className="text-xs text-text-tertiary">{filtered.length} resultados</span></div>
      {loading ? <div role="status" className="empty-state">Cargando contactos...</div> : !filtered.length ? <div className="empty-state"><ContactRound size={32} /><span>{error ? 'La agenda no esta disponible.' : items.length ? 'No se encontraron contactos.' : 'Todavia no hay contactos registrados.'}</span></div> : <>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['Contacto', 'Categorias', 'Comunicacion', 'Ciudad', 'Estado', 'Acciones'].map(title => <th key={title} scope="col" className="text-left px-4">{title}</th>)}</tr></thead><tbody>
          {filtered.slice((currentPage - 1) * 20, currentPage * 20).map(item => <tr key={item.id} className="border-b border-dark-border">
            <td className="px-4 min-w-[190px] max-w-xs"><button className="font-semibold text-left hover:underline break-words" onClick={() => setDetailId(item.id)}>{item.nombre}</button><div className="text-xs text-text-tertiary mt-1 break-words">{item.empresa || (item.tipo === 'persona' ? 'Persona' : 'Empresa')}</div></td>
            <td className="px-4 max-w-xs"><div className="flex flex-wrap gap-1">{categoriesOf(item).map(value => <span key={value} className="contact-tag">{value}</span>)}</div></td>
            <td className="px-4"><div>{item.telefono || '—'}</div><div className="text-xs text-text-tertiary mt-1 break-all">{item.email}</div></td>
            <td className="px-4 max-w-[180px] break-words">{item.ubicacion || '—'}</td>
            <td className="px-4"><span className={item.estado === 'activo' ? 'text-status-success' : 'text-text-tertiary'}>{item.estado === 'activo' ? 'Activo' : 'Archivado'}</span></td>
            <td className="px-3"><div className="flex justify-end"><IconButton label={`Ver ${item.nombre}`} onClick={() => setDetailId(item.id)}><Eye size={17} /></IconButton><IconButton label={`Editar ${item.nombre}`} onClick={() => { setEditing(item); setFormOpen(true); }}><Pencil size={17} /></IconButton><IconButton label={`${item.estado === 'activo' ? 'Archivar' : 'Reactivar'} ${item.nombre}`} onClick={() => { setArchive(item); setError(''); }}>{item.estado === 'activo' ? <Archive size={17} /> : <ArchiveRestore size={17} />}</IconButton></div></td>
          </tr>)}
        </tbody></table></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-border px-4 py-3 text-xs text-text-tertiary"><span>Pagina {currentPage} de {pages}</span><div className="flex gap-2"><button className="action-secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><button className="action-secondary" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div></div>
      </>}
    </section>
    <Modal isOpen={formOpen} title={editing ? 'Editar contacto' : 'Nuevo contacto'} onClose={() => { if (!busy) setFormOpen(false); }}>
      <ContactForm key={editing?.id || 'nuevo'} initial={editing} categories={categories} onSave={save} onCancel={() => setFormOpen(false)} onBusy={setBusy} onCreateCategory={userRole === 'admin' ? createCategory : undefined} />
    </Modal>
    <Modal isOpen={!!detail} title="Ficha del contacto" onClose={() => setDetailId(null)}>{detail && <>
      <div className="pb-5 border-b border-dark-border"><h2 className="text-lg font-semibold break-words">{detail.nombre}</h2><p className="text-sm text-text-tertiary break-words">{detail.empresa}</p><div className="flex flex-wrap gap-1 mt-2">{categoriesOf(detail).map(item => <span className="contact-tag" key={item}>{item}</span>)}</div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-5">{[['Telefono', detail.telefono], ['Telefono alternativo', detail.telefonoAlternativo], ['WhatsApp', detail.whatsapp], ['Correo', detail.email], ['Ciudad', detail.ubicacion], ['Direccion', detail.direccion], ['Persona de contacto', detail.personaContacto], ['Productos o servicios', detail.proveedorDe], ['Placa', detail.placa], ['Vehiculo', detail.vehiculo], ['Rutas / cobertura', detail.cobertura], ['Fecha de registro', detail.fechaRegistro]].map(([label, value]) => <div key={label}><div className="text-xs text-text-tertiary mb-1">{label}</div><div className="text-sm break-words">{value || '—'}</div></div>)}</div>
      <div className="border-t border-dark-border py-4"><h3 className="text-xs text-text-tertiary mb-2">Observaciones</h3><p className="text-sm whitespace-pre-wrap break-words">{detail.notas || 'Sin observaciones.'}</p></div>
      <div className="flex flex-wrap gap-2"><ContactLinks contact={detail} /><button className="action-secondary" onClick={() => { setDetailId(null); setEditing(detail); setFormOpen(true); }}><Pencil size={16} />Editar</button></div>
    </>}</Modal>
    <Modal isOpen={!!archive} title={archive?.estado === 'activo' ? 'Archivar contacto' : 'Reactivar contacto'} onClose={() => { if (!busy) setArchive(null); }}>
      <p className="text-sm break-words">{archive?.nombre}</p><p className="text-sm text-text-secondary mt-2">{archive?.estado === 'activo' ? 'Se conservaran todos sus datos en la agenda de archivados.' : 'El contacto volvera a la agenda de activos.'}</p>
      {error && <p role="alert" className="text-sm text-status-danger mt-3">{error}</p>}
      <div className="flex justify-end gap-2 mt-5"><button disabled={busy} className="action-secondary" onClick={() => setArchive(null)}>Cancelar</button><button disabled={busy} className="action-primary" onClick={changeStatus}>{archive?.estado === 'activo' ? <Archive size={16} /> : <ArchiveRestore size={16} />}{busy ? 'Guardando...' : 'Confirmar'}</button></div>
    </Modal>
    <Modal isOpen={categoryOpen} title="Categorias de contactos" onClose={() => { if (!categoryBusy) setCategoryOpen(false); }}>
      <div className="flex flex-wrap gap-2 mb-5">{categories.map(value => <span className="contact-tag" key={value}>{value}</span>)}</div>
      <form onSubmit={addCategory}><Field label="Nueva categoria" value={newCategory} onChange={setNewCategory} required maxLength={60} />{categoryError && <p role="alert" className="mt-3 text-sm text-status-danger">{categoryError}</p>}<div className="flex justify-end gap-2 mt-4"><button className="action-secondary" type="button" disabled={categoryBusy} onClick={() => setCategoryOpen(false)}>Cerrar</button><button className="action-primary" disabled={categoryBusy}><Plus size={16} />{categoryBusy ? 'Guardando...' : 'Agregar categoria'}</button></div></form>
    </Modal>
  </div>;
}

function ContactForm({ initial, categories, onSave, onCancel, onBusy, onCreateCategory }: { initial: ContactoEmpresa | null; categories: string[]; onSave: (data: ContactoEmpresa, confirm: boolean) => Promise<void>; onCancel: () => void; onBusy: (value: boolean) => void; onCreateCategory?: (name: string) => Promise<string> }) {
  const [form, setForm] = useState<ContactoEmpresa>(initial ? { ...initial, categorias: categoriesOf(initial), tipo: initial.tipo || 'empresa' } : emptyContact());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [transport, setTransport] = useState(Boolean(initial?.placa || initial?.vehiculo || initial?.cobertura || initial && categoriesOf(initial).some(value => /transporte|logistica/i.test(value))));
  const update = (key: keyof ContactoEmpresa, value: string) => { setForm(previous => ({ ...previous, [key]: value })); setShared(false); setError(''); };
  async function addInlineCategory() {
    if (!onCreateCategory || !categoryName.trim()) return;
    setSaving(true); onBusy(true); setError('');
    try {
      const name = await onCreateCategory(categoryName);
      setForm(previous => ({ ...previous, categorias: [...(previous.categorias || []), name] }));
      setCategoryName('');
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); onBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.categorias?.length) { setError('Seleccione al menos una categoria.'); return; }
    setSaving(true); onBusy(true); setError('');
    try { await onSave(form, shared); }
    catch (err) { setError((err as Error).message); }
    finally { setSaving(false); onBusy(false); }
  }
  const field = (key: keyof ContactoEmpresa, label: string, options: { type?: string; maxLength?: number; required?: boolean; placeholder?: string } = {}) => <Field label={label} value={String(form[key] || '')} onChange={value => update(key, value)} {...options} />;
  return <form onSubmit={submit} className="space-y-5">
    <fieldset disabled={saving} className="space-y-5 min-w-0">
      <section><h3 className="contact-section-title">Identificacion</h3><div className="flex flex-wrap gap-5 mb-4">{(['persona', 'empresa'] as const).map(value => <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" name="tipoContacto" checked={form.tipo === value} onChange={() => update('tipo', value)} className="contact-check" />{value === 'persona' ? 'Persona' : 'Empresa'}</label>)}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{field('nombre', form.tipo === 'empresa' ? 'Nombre o razon social' : 'Nombre completo', { required: true })}{field('empresa', 'Empresa / organizacion')}{field('personaContacto', 'Persona de contacto')}{field('proveedorDe', 'Productos o servicios')}</div>
      </section>
      <fieldset className="border-t border-dark-border pt-4"><legend className="contact-section-title">Categorias *</legend><div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{categories.map(value => <label key={value} className="flex items-start gap-2 text-sm min-w-0"><input className="contact-check mt-0.5" type="checkbox" checked={form.categorias?.includes(value) || false} onChange={event => { setForm(previous => ({ ...previous, categorias: event.target.checked ? [...(previous.categorias || []), value] : previous.categorias?.filter(item => item !== value) })); setError(''); if (/transporte|logistica/i.test(value) && event.target.checked) setTransport(true); }} /><span className="break-words min-w-0">{value}</span></label>)}</div></fieldset>
      {onCreateCategory && <div className="flex flex-wrap items-end gap-2"><div className="flex-1 min-w-[160px]"><Field label="Nueva categoria" value={categoryName} onChange={setCategoryName} maxLength={60} onEnter={addInlineCategory} /></div><button type="button" className="action-secondary" disabled={!categoryName.trim()} onClick={addInlineCategory}><Plus size={16} />Agregar categoria</button></div>}
      <section className="border-t border-dark-border pt-4"><h3 className="contact-section-title">Comunicacion</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{field('telefono', 'Telefono principal', { type: 'tel', maxLength: 30 })}{field('telefonoAlternativo', 'Telefono alternativo', { type: 'tel', maxLength: 30 })}{field('whatsapp', 'WhatsApp (con codigo de pais)', { type: 'tel', maxLength: 30, placeholder: '+591...' })}{field('email', 'Correo electronico', { type: 'email', maxLength: 254 })}</div></section>
      <section className="border-t border-dark-border pt-4"><h3 className="contact-section-title">Ubicacion</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{field('ubicacion', 'Ciudad')}{field('direccion', 'Direccion', { maxLength: 400 })}</div></section>
      <section className="border-t border-dark-border pt-4"><label className="flex items-center gap-2 text-sm font-medium"><input className="contact-check" type="checkbox" checked={transport} onChange={event => setTransport(event.target.checked)} /><Truck size={17} />Datos de transporte</label>{transport && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">{field('placa', 'Placa', { maxLength: 30 })}{field('vehiculo', 'Vehiculo')}{field('cobertura', 'Rutas / cobertura')}</div>}</section>
      <label className="block border-t border-dark-border pt-4"><span className="block text-xs text-text-secondary mb-1.5">Observaciones</span><textarea className={inputClass} rows={3} maxLength={3000} value={form.notas} onChange={event => update('notas', event.target.value)} /></label>
      {error && <div role="alert" className="border-l-4 border-status-danger bg-dark-surface2 p-3 text-sm text-status-danger">{error}</div>}
      {error.startsWith('Posible duplicado:') && <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="contact-check mt-0.5" checked={shared} onChange={event => setShared(event.target.checked)} /><span>Son contactos distintos que comparten telefono o correo.</span></label>}
    </fieldset>
    <div className="sticky bottom-0 bg-white border-t border-dark-border pt-4 pb-1 flex flex-wrap justify-end gap-2"><button type="button" disabled={saving} className="action-secondary" onClick={onCancel}>Cancelar</button><button disabled={saving} className="action-primary"><Save size={16} />{saving ? 'Guardando...' : 'Guardar contacto'}</button></div>
  </form>;
}

function Field({ label, value, onChange, type = 'text', maxLength = 160, required = false, placeholder, onEnter }: { label: string; value: string; onChange: (value: string) => void; type?: string; maxLength?: number; required?: boolean; placeholder?: string; onEnter?: () => void }) {
  return <label className="block min-w-0"><span className="block text-xs text-text-secondary mb-1.5">{label}{required ? ' *' : ''}</span><input className={inputClass} type={type} required={required} maxLength={maxLength} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} onKeyDown={event => { if (event.key === 'Enter' && onEnter) { event.preventDefault(); onEnter(); } }} /></label>;
}
function Filter({ label, value, onChange, options, all }: { label: string; value: string; onChange: (value: string) => void; options: string[]; all: string }) {
  return <label className="block min-w-0"><span className="block text-xs text-text-secondary mb-1.5">{label}</span><select aria-label={label} className={inputClass} value={value} onChange={event => onChange(event.target.value)}><option value="">{all}</option>{options.map(item => <option key={item}>{item}</option>)}</select></label>;
}
function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button className="icon-button" title={label} aria-label={label} onClick={onClick}>{children}</button>;
}
function ContactLinks({ contact }: { contact: ContactoEmpresa }) {
  const phone = (contact.telefono || '').replace(/[^\d+]/g, '');
  const whatsapp = (contact.whatsapp || '').replace(/\D/g, '');
  const email = contact.email || '';
  return <>{/^\+?\d{7,15}$/.test(phone) && <a className="action-secondary" href={`tel:${phone}`}><Phone size={16} />Llamar</a>}{/^\d{8,15}$/.test(whatsapp) && <a className="action-secondary" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} />WhatsApp</a>}{/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && <a className="action-secondary" href={`mailto:${encodeURIComponent(email)}`}><Mail size={16} />Correo</a>}</>;
}
