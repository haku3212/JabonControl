import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usuariosService } from '../../services/api';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  email?: string;
  rol: 'admin' | 'supervisor' | 'operario';
  estado: 'activo' | 'inactivo';
  ultimo_acceso?: string;
}

const emptyForm = {
  nombre: '',
  usuario: '',
  email: '',
  password: '',
  rol: 'operario' as Usuario['rol'],
  estado: 'activo' as Usuario['estado'],
};

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setUsuarios(await usuariosService.listar());
      setError('');
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const save = async () => {
    if (!form.nombre.trim() || !form.usuario.trim() || (!editingId && !form.password.trim())) {
      setError('Nombre, usuario y contrasena son obligatorios para usuarios nuevos.');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete (payload as any).password;
        await usuariosService.actualizar(editingId, payload);
      } else {
        await usuariosService.crear(form);
      }
      reset();
      await loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const edit = (usuario: Usuario) => {
    setEditingId(usuario.id);
    setForm({
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      email: usuario.email || '',
      password: '',
      rol: usuario.rol,
      estado: usuario.estado || 'activo',
    });
  };

  const remove = async (usuario: Usuario) => {
    if (!confirm(`Eliminar usuario ${usuario.usuario}?`)) return;
    try {
      await usuariosService.eliminar(usuario.id);
      await loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar el usuario');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bebas tracking-wider text-text-primary">Usuarios y roles</h1>
          <p className="text-sm text-text-tertiary">Solo administradores pueden crear usuarios, cambiar roles o desactivar accesos.</p>
        </div>
        <button
          onClick={reset}
          className="px-3 py-2 bg-dark-surface3 border border-dark-border rounded text-sm text-text-secondary hover:border-accent-yellow hover:text-accent-yellow"
        >
          Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="bg-status-danger bg-opacity-10 border border-status-danger text-status-danger rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <Card title={editingId ? 'Editar usuario' : 'Crear usuario'}>
          <div className="space-y-3">
            <Field label="Nombre" value={form.nombre} onChange={(value) => setForm({ ...form, nombre: value })} />
            <Field label="Usuario" value={form.usuario} onChange={(value) => setForm({ ...form, usuario: value })} />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field
              label={editingId ? 'Nueva contrasena (opcional)' : 'Contrasena'}
              type="password"
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Rol" value={form.rol} onChange={(value) => setForm({ ...form, rol: value as Usuario['rol'] })}>
                <option value="operario">Operario</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </Select>
              <Select label="Estado" value={form.estado} onChange={(value) => setForm({ ...form, estado: value as Usuario['estado'] })}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-dark-border">
              <button onClick={reset} className="px-4 py-2 rounded border border-dark-border text-sm text-text-secondary hover:text-text-primary">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded bg-accent-yellow text-black text-sm font-semibold disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Card>

        <Card title="Cuentas registradas" badge={{ label: `${usuarios.length} usuarios`, type: 'info' }}>
          {loading ? (
            <div className="text-text-tertiary text-sm py-8 text-center">Cargando usuarios...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-mono text-text-tertiary uppercase border-b border-dark-border">
                    <th className="py-3 pr-4">Usuario</th>
                    <th className="py-3 pr-4">Rol</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3 pr-4">Ultimo acceso</th>
                    <th className="py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((item) => (
                    <tr key={item.id} className="border-b border-dark-border last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-text-primary">{item.nombre}</div>
                        <div className="text-xs text-text-tertiary">{item.usuario}{item.email ? ` · ${item.email}` : ''}</div>
                      </td>
                      <td className="py-3 pr-4"><Badge label={item.rol} type={item.rol === 'admin' ? 'warning' : 'neutral'} /></td>
                      <td className="py-3 pr-4"><Badge label={item.estado || 'activo'} type={(item.estado || 'activo') === 'activo' ? 'success' : 'danger'} /></td>
                      <td className="py-3 pr-4 text-text-tertiary">{item.ultimo_acceso || 'Sin acceso'}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => edit(item)} className="text-accent-blue hover:underline mr-3">Editar</button>
                        <button onClick={() => remove(item)} className="text-status-danger hover:underline">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-yellow focus:ring-2 focus:ring-accent-yellow focus:ring-opacity-20 outline-none"
      />
    </label>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-yellow outline-none"
      >
        {children}
      </select>
    </label>
  );
}
