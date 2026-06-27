import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { apiClient } from '../../services/api';
import { PERMISOS, Rol } from '../../context/AuthContext';

interface UsuarioRow {
  id: string;
  nombre: string;
  usuario: string;
  rol: Rol;
  estado: string;
  ultimo_acceso: string | null;
}

const ROLES: { value: Rol; label: string; desc: string }[] = [
  { value: 'admin',      label: 'Administrador', desc: 'Acceso total al sistema' },
  { value: 'ventas',     label: 'Ventas',        desc: 'Ventas, Cobros, Clientes, Reportes' },
  { value: 'produccion', label: 'Producción',    desc: 'Materias Primas, Hornadas, Acabado' },
  { value: 'gestion',    label: 'Gestión',       desc: 'Proyectos, Documentación, Equipos' },
];

const rolBadge: Record<Rol, 'success' | 'warning' | 'info' | 'danger'> = {
  admin: 'danger',
  ventas: 'success',
  produccion: 'warning',
  gestion: 'info',
};

const emptyForm = { nombre: '', usuario: '', password: '', rol: 'operario' as Rol };

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/usuarios');
      setUsuarios(data);
    } catch {
      // sin conexion
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editId) {
        await apiClient.put(`/usuarios/${editId}`, { nombre: form.nombre, rol: form.rol, estado: 'activo' });
      } else {
        await apiClient.post('/usuarios', form);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      cargar();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await apiClient.delete(`/usuarios/${id}`);
      cargar();
    } catch {}
  };

  const handleEditar = (u: UsuarioRow) => {
    setForm({ nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol });
    setEditId(u.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de roles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="bg-dark-surface border border-dark-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge label={r.label} type={rolBadge[r.value]} />
            </div>
            <div className="text-xs text-text-tertiary">{r.desc}</div>
            <div className="text-xs font-mono text-text-secondary mt-2">
              {PERMISOS[r.value].length} módulos
            </div>
          </div>
        ))}
      </div>

      {/* Lista de usuarios */}
      <Card
        title="Usuarios del Sistema"
        badge={{ label: `${usuarios.length} usuarios`, type: 'info' }}
        action={
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
            className="bg-accent-yellow text-black text-xs font-bebas tracking-wider px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors"
          >
            + Nuevo Usuario
          </button>
        }
      >
        {loading ? (
          <div className="text-sm text-text-tertiary py-4 text-center">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Nombre</th>
                  <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Usuario</th>
                  <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Rol</th>
                  <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Módulos</th>
                  <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Último acceso</th>
                  <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                    <td className="px-3 py-2 text-text-primary font-medium">{u.nombre}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{u.usuario}</td>
                    <td className="px-3 py-2">
                      <Badge label={ROLES.find(r => r.value === u.rol)?.label || u.rol} type={rolBadge[u.rol] || 'info'} />
                    </td>
                    <td className="px-3 py-2 text-xs text-text-tertiary">
                      {PERMISOS[u.rol]?.join(', ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-text-tertiary">
                      {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString('es-BO') : 'Nunca'}
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      <button
                        onClick={() => handleEditar(u)}
                        className="text-xs text-accent-yellow hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(u.id)}
                        className="text-xs text-status-danger hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Formulario crear/editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-md">
            <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
              <h3 className="font-bebas text-lg tracking-wider text-text-primary">
                {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => { setShowForm(false); setError(''); }} className="text-text-tertiary hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleGuardar} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                  className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                />
              </div>

              {!editId && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1.5">Usuario (login)</label>
                    <input
                      type="text"
                      value={form.usuario}
                      onChange={e => setForm({ ...form, usuario: e.target.value })}
                      required
                      className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1.5">Contraseña</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                      className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1.5">Rol</label>
                <select
                  value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value as Rol })}
                  className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="text-xs text-status-danger bg-status-danger bg-opacity-10 border border-status-danger border-opacity-30 rounded px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-accent-yellow text-black font-bebas tracking-wider py-2 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="px-4 py-2 border border-dark-border rounded text-sm text-text-secondary hover:bg-dark-surface2 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
