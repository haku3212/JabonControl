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
  const filtered = filter === 'todos' ? logs : logs.filter((log) => log.tabla === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bebas tracking-wider text-text-primary">Auditoria en tiempo real</h1>
          <p className="text-sm text-text-tertiary">Historial visible solo para administradores. Se actualiza cada 5 segundos.</p>
        </div>
        <button
          onClick={() => load()}
          className="px-3 py-2 bg-dark-surface3 border border-dark-border rounded text-sm text-text-secondary hover:border-accent-yellow hover:text-accent-yellow"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-status-danger bg-opacity-10 border border-status-danger text-status-danger rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Card title="Filtros">
        <div className="flex flex-wrap gap-2">
          {tables.map((table) => (
            <button
              key={table}
              onClick={() => setFilter(table)}
              className={`px-3 py-1.5 rounded border text-sm ${
                filter === table
                  ? 'bg-accent-yellow text-black border-accent-yellow'
                  : 'bg-dark-surface2 text-text-secondary border-dark-border hover:text-text-primary'
              }`}
            >
              {table}
            </button>
          ))}
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
