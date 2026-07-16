import { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import type { ContactoEmpresa } from '../../types';

const emptyForm: ContactoEmpresa = {
  id: '',
  nombre: '',
  empresa: '',
  categoria: 'Insumos tecnicos',
  proveedorDe: '',
  telefono: '',
  email: '',
  ubicacion: '',
  direccion: '',
  personaContacto: '',
  notas: '',
  estado: 'activo',
  fechaRegistro: new Date().toISOString().slice(0, 10),
};

export function Contactos() {
  const { contactos, addContacto, updateContacto, deleteContacto } = useAppContext();
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContactoEmpresa | null>(null);
  const [detail, setDetail] = useState<ContactoEmpresa | null>(null);

  const categorias = useMemo(() => {
    return ['todas', ...Array.from(new Set(contactos.map((item) => item.categoria).filter(Boolean)))];
  }, [contactos]);

  const filtered = contactos.filter((item) => {
    const needle = search.toLowerCase();
    const matchesText = [
      item.nombre,
      item.empresa,
      item.proveedorDe,
      item.telefono,
      item.ubicacion,
      item.personaContacto,
    ].some((value) => String(value || '').toLowerCase().includes(needle));
    const matchesCategory = categoria === 'todas' || item.categoria === categoria;
    return matchesText && matchesCategory;
  });

  const stats = useMemo(() => ({
    activos: contactos.filter((item) => item.estado === 'activo').length,
    categorias: new Set(contactos.map((item) => item.categoria).filter(Boolean)).size,
    ubicaciones: new Set(contactos.map((item) => item.ubicacion).filter(Boolean)).size,
  }), [contactos]);

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const save = async (data: ContactoEmpresa) => {
    if (editing) {
      updateContacto(editing.id, data);
    } else {
      addContacto(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  const remove = (contacto: ContactoEmpresa) => {
    if (confirm(`Eliminar el contacto "${contacto.nombre}"?`)) {
      deleteContacto(contacto.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Contactos</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">AGENDA DE PROVEEDORES, TECNICOS, REPUESTOS E INSUMOS</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 w-fit">
          Nuevo contacto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniStat label="Contactos" value={contactos.length} />
        <MiniStat label="Activos" value={stats.activos} />
        <MiniStat label="Categorias" value={stats.categorias} />
        <MiniStat label="Ubicaciones" value={stats.ubicaciones} />
      </div>

      <Card title="Agenda empresarial" badge={{ label: `${filtered.length} registros`, type: 'info' }}>
        <div className="mb-4 flex flex-wrap gap-3 items-end">
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Proveedor, insumo, telefono..."
              className="w-72 max-w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Categoria</span>
            <select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              className="w-52 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            >
              {categorias.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Contacto', 'Proveedor de', 'Telefono', 'Ubicacion', 'Estado', 'Acciones'].map((head) => (
                  <th key={head} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((contacto) => (
                <tr key={contacto.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors align-top">
                  <td className="px-3 py-3 min-w-64">
                    <div className="font-semibold text-text-primary">{contacto.nombre}</div>
                    <div className="text-xs text-text-tertiary">{contacto.empresa || 'Sin empresa'}{contacto.personaContacto ? ` - ${contacto.personaContacto}` : ''}</div>
                    <div className="mt-1"><Badge label={contacto.categoria || 'General'} type="neutral" /></div>
                  </td>
                  <td className="px-3 py-3 text-text-secondary max-w-sm">{contacto.proveedorDe || '-'}</td>
                  <td className="px-3 py-3 font-mono text-text-secondary">{contacto.telefono || '-'}</td>
                  <td className="px-3 py-3 text-text-secondary">
                    <div>{contacto.ubicacion || '-'}</div>
                    <div className="text-xs text-text-tertiary max-w-xs truncate">{contacto.direccion || ''}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge label={contacto.estado === 'activo' ? 'Activo' : 'Inactivo'} type={contacto.estado === 'activo' ? 'success' : 'danger'} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDetail(contacto)} className="px-2 py-1 rounded border border-dark-border text-xs hover:border-accent-yellow">Ver</button>
                      <button onClick={() => { setEditing(contacto); setShowForm(true); }} className="px-2 py-1 rounded border border-dark-border text-accent-blue hover:border-accent-blue text-xs">Editar</button>
                      <button onClick={() => remove(contacto)} className="px-2 py-1 rounded border border-dark-border text-status-danger hover:border-status-danger text-xs">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-10 text-center text-sm text-text-tertiary">No hay contactos con ese criterio.</div>}
        </div>
      </Card>

      <Modal isOpen={showForm} title={editing ? 'Editar contacto' : 'Nuevo contacto'} onClose={() => setShowForm(false)}>
        <ContactoForm initialData={editing} onSave={save} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={Boolean(detail)} title={detail?.nombre || 'Ficha de contacto'} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Info label="Nombre" value={detail.nombre} />
              <Info label="Empresa" value={detail.empresa || '-'} />
              <Info label="Proveedor de" value={detail.proveedorDe || '-'} />
              <Info label="Categoria" value={detail.categoria || '-'} />
              <Info label="Telefono" value={detail.telefono || '-'} />
              <Info label="Email" value={detail.email || '-'} />
              <Info label="Ubicacion" value={detail.ubicacion || '-'} />
              <Info label="Direccion" value={detail.direccion || '-'} />
              <Info label="Persona contacto" value={detail.personaContacto || '-'} />
              <Info label="Fecha registro" value={detail.fechaRegistro || '-'} />
            </div>
            <div className="rounded border border-dark-border bg-dark-surface2 p-4">
              <div className="text-xs font-mono text-text-tertiary uppercase mb-2">Notas</div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{detail.notas || 'Sin notas registradas.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ContactoForm({ initialData, onSave, onCancel }: { initialData: ContactoEmpresa | null; onSave: (data: ContactoEmpresa) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<ContactoEmpresa>(initialData || emptyForm);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.nombre.trim() || !form.proveedorDe.trim() || !form.telefono.trim()) {
      alert('Complete nombre, proveedor de y telefono.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        id: initialData?.id || form.id || Date.now().toString(),
        fechaRegistro: form.fechaRegistro || new Date().toISOString().slice(0, 10),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre / Alias" value={form.nombre} onChange={(value) => setForm({ ...form, nombre: value })} />
        <Field label="Empresa" value={form.empresa} onChange={(value) => setForm({ ...form, empresa: value })} />
        <Field label="Proveedor de" value={form.proveedorDe} onChange={(value) => setForm({ ...form, proveedorDe: value })} placeholder="Ej: resina para ablandador de agua" />
        <Field label="Categoria" value={form.categoria} onChange={(value) => setForm({ ...form, categoria: value })} placeholder="Insumos, repuestos, tecnico..." />
        <Field label="Telefono" value={form.telefono} onChange={(value) => setForm({ ...form, telefono: value })} />
        <Field label="Email" type="email" value={form.email || ''} onChange={(value) => setForm({ ...form, email: value })} />
        <Field label="Ubicacion / Ciudad" value={form.ubicacion} onChange={(value) => setForm({ ...form, ubicacion: value })} />
        <Field label="Persona contacto" value={form.personaContacto || ''} onChange={(value) => setForm({ ...form, personaContacto: value })} />
        <div className="md:col-span-2">
          <Field label="Direccion" value={form.direccion} onChange={(value) => setForm({ ...form, direccion: value })} />
        </div>
        <label>
          <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Estado</span>
          <select value={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.value as ContactoEmpresa['estado'] })} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
        <Field label="Fecha registro" type="date" value={form.fechaRegistro} onChange={(value) => setForm({ ...form, fechaRegistro: value })} />
        <label className="md:col-span-2">
          <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Notas</span>
          <textarea value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} rows={4} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none resize-none" />
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-dark-border">
        <button onClick={onCancel} disabled={saving} className="px-4 py-2 bg-dark-surface3 border border-dark-border rounded text-sm">Cancelar</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 bg-accent-yellow text-black rounded text-sm font-semibold disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar contacto'}</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <input value={value} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none" />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
      <div className="text-xs font-mono text-text-tertiary uppercase">{label}</div>
      <div className="text-2xl font-bebas text-text-primary mt-1">{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-dark-border bg-dark-surface2 px-3 py-2">
      <div className="text-[10px] font-mono text-text-tertiary uppercase">{label}</div>
      <div className="text-sm text-text-primary mt-1 break-words">{value}</div>
    </div>
  );
}
