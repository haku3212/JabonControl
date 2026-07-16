import { useEffect, useMemo, useState } from 'react';
import { auditoriaService } from '../../services/api';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

interface AuditLog {
  id: string;
  usuario?: string;
  rol?: string;
  accion: 'crear' | 'actualizar' | 'eliminar' | string;
  tabla: string;
  registro_id?: string;
  detalle?: string;
  valores_anteriores?: string;
  valores_nuevos?: string;
  creado_en: string;
}

const actionType = (accion: string) => {
  if (accion === 'crear') return 'success';
  if (accion === 'actualizar') return 'info';
  if (accion === 'eliminar') return 'danger';
  return 'neutral';
};

export function Auditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [actionFilter, setActionFilter] = useState('todos');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState('');

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setLogs(await auditoriaService.listar());
      setError('');
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la auditoria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const tables = useMemo(() => ['todos', ...Array.from(new Set(logs.map((log) => log.tabla)))], [logs]);
  const actions = useMemo(() => ['todos', ...Array.from(new Set(logs.map((log) => log.accion)))], [logs]);
  const filtered = logs.filter((log) => {
    const byTable = filter === 'todos' || log.tabla === filter;
    const byAction = actionFilter === 'todos' || log.accion === actionFilter;
    const byUser = !userFilter || String(log.usuario || '').toLowerCase().includes(userFilter.toLowerCase());
    const byDate = !dateFilter || String(log.creado_en || '').startsWith(dateFilter);
    return byTable && byAction && byUser && byDate;
  });

  const exportCsv = () => {
    const headers = ['fecha', 'usuario', 'rol', 'accion', 'modulo', 'registro', 'detalle'];
    const rows = filtered.map((log) => [
      log.creado_en,
      log.usuario || 'sistema',
      log.rol || '',
      log.accion,
      log.tabla,
      log.registro_id || '',
      log.detalle || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bebas tracking-wider text-text-primary">Auditoria en tiempo real</h1>
          <p className="text-sm text-text-tertiary">Historial visible solo para administradores. Se actualiza cada 5 segundos.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-2 bg-accent-yellow text-black rounded text-sm font-semibold hover:bg-opacity-90"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => load()}
            className="px-3 py-2 bg-dark-surface3 border border-dark-border rounded text-sm text-text-secondary hover:border-accent-yellow hover:text-accent-yellow"
          >
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-status-danger bg-opacity-10 border border-status-danger text-status-danger rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Card title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Modulo</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary">
              {tables.map((table) => <option key={table} value={table}>{table}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Accion</span>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary">
              {actions.map((action) => <option key={action} value={action}>{action}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Usuario</span>
            <input value={userFilter} onChange={(event) => setUserFilter(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary" placeholder="admin, ventas..." />
          </label>
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Fecha</span>
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary" />
          </label>
        </div>
      </Card>

      <Card title="Cambios recientes" badge={{ label: `${filtered.length} eventos`, type: 'info' }}>
        {loading ? (
          <div className="text-text-tertiary text-sm py-8 text-center">Cargando historial...</div>
        ) : filtered.length === 0 ? (
          <div className="text-text-tertiary text-sm py-8 text-center">No hay cambios registrados.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((log) => (
              <div key={log.id} className="border border-dark-border rounded-lg bg-dark-surface2 p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge label={log.accion} type={actionType(log.accion) as any} />
                      <span className="text-sm font-medium text-text-primary">{log.tabla}</span>
                      {log.registro_id && <span className="text-xs font-mono text-text-tertiary">#{log.registro_id}</span>}
                    </div>
                    <p className="text-sm text-text-secondary">{log.detalle || 'Cambio registrado'}</p>
                    <p className="text-xs text-text-tertiary">
                      Por <span className="text-text-primary">{log.usuario || 'sistema'}</span>
                      {log.rol ? ` · ${log.rol}` : ''}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-text-tertiary whitespace-nowrap">
                    {new Date(log.creado_en).toLocaleString('es-BO')}
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-accent-blue">Ver datos del cambio</summary>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                    <JsonBlock title="Antes" value={log.valores_anteriores} />
                    <JsonBlock title="Despues" value={log.valores_nuevos} />
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value?: string }) {
  let parsed = null;
  try {
    parsed = value ? JSON.parse(value) : null;
  } catch {
    parsed = value || null;
  }

  return (
    <div>
      <div className="text-xs font-mono text-text-tertiary uppercase mb-1">{title}</div>
      <pre className="bg-dark-bg border border-dark-border rounded p-3 text-xs text-text-secondary overflow-auto max-h-64">
        {parsed ? JSON.stringify(parsed, null, 2) : 'Sin datos'}
      </pre>
    </div>
  );
}
