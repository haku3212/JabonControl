import { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import { Proyecto } from '../../types';
import { ProyectoForm } from '../forms/ProyectoForm';

interface ProyectosProps {
  onNewClick?: () => void;
}

const estadoBadge: Record<string, { label: string; type: 'success' | 'warning' | 'info' }> = {
  activo: { label: 'Activo', type: 'warning' },
  pausado: { label: 'Pausado', type: 'info' },
  completado: { label: 'Completado', type: 'success' },
};

export function Proyectos({}: ProyectosProps) {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useAppContext();
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('todos');

  const filtered = filter === 'todos' ? proyectos : proyectos.filter((p) => p.estado === filter);

  const summary = useMemo(() => {
    const active = proyectos.filter((p) => p.estado === 'activo').length;
    const completed = proyectos.filter((p) => p.estado === 'completado').length;
    const avg = proyectos.length
      ? Math.round(proyectos.reduce((sum, p) => sum + (Number(p.progreso) || 0), 0) / proyectos.length)
      : 0;
    const budget = proyectos.reduce((sum, p) => sum + (Number(p.presupuesto) || 0), 0);
    return { active, completed, avg, budget };
  }, [proyectos]);

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleSave = async (data: Proyecto) => {
    if (editing) {
      updateProyecto(editing.id, data);
    } else {
      addProyecto({ ...data, progreso: Number(data.progreso) || 0 });
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (proyecto: Proyecto) => {
    setEditing(proyecto);
    setShowForm(true);
  };

  const handleDelete = (id: string, nombre: string) => {
    if (confirm(`Eliminar el proyecto "${nombre}"?`)) {
      deleteProyecto(id);
    }
  };

  const toggleTask = (proyecto: Proyecto, taskId: string) => {
    const tareas = (proyecto.tareas || []).map((tarea) => (
      tarea.id === taskId ? { ...tarea, completada: !tarea.completada } : tarea
    ));
    const completed = tareas.filter((tarea) => tarea.completada).length;
    const progreso = tareas.length ? Math.round((completed / tareas.length) * 100) : proyecto.progreso;
    updateProyecto(proyecto.id, {
      ...proyecto,
      tareas,
      progreso,
      estado: progreso === 100 ? 'completado' : proyecto.estado === 'completado' ? 'activo' : proyecto.estado,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Proyectos</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">SEGUIMIENTO REAL DE INICIATIVAS, PRESUPUESTO Y AVANCE</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 w-fit"
        >
          Nuevo proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniStat label="Activos" value={summary.active} />
        <MiniStat label="Completados" value={summary.completed} />
        <MiniStat label="Avance promedio" value={`${summary.avg}%`} />
        <MiniStat label="Presupuesto" value={`Bs ${summary.budget.toLocaleString('es-BO')}`} />
      </div>

      <Card title="Cartera de proyectos" badge={{ label: `${filtered.length} registros`, type: 'info' }}>
        <div className="mb-4 flex flex-wrap gap-2">
          {['todos', 'activo', 'pausado', 'completado'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3 py-1.5 rounded border text-sm ${
                filter === item
                  ? 'bg-accent-yellow text-black border-accent-yellow'
                  : 'bg-dark-surface2 text-text-secondary border-dark-border hover:text-text-primary'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-dark-border rounded-lg">
            <div className="text-sm text-text-secondary mb-2">No hay proyectos en esta vista.</div>
            <button onClick={openNew} className="px-4 py-2 bg-accent-yellow text-black text-xs font-semibold rounded">
              Crear proyecto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Proyecto', 'Responsable', 'Estado', 'Fechas', 'Presupuesto', 'Avance', 'Acciones'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((proyecto) => {
                  const badge = estadoBadge[proyecto.estado] || estadoBadge.activo;
                  const tareas = proyecto.tareas || [];
                  const hechas = tareas.filter((tarea) => tarea.completada).length;
                  return (
                    <tr key={proyecto.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors align-top">
                      <td className="px-3 py-3 min-w-80">
                        <div className="font-medium text-text-primary">{proyecto.nombre}</div>
                        <div className="text-xs text-text-tertiary max-w-md truncate">{proyecto.descripcion || 'Sin descripcion'}</div>
                        {tareas.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <div className="text-[10px] font-mono text-text-tertiary uppercase">
                              To-do list: {hechas}/{tareas.length}
                            </div>
                            {tareas.slice(0, 5).map((tarea) => (
                              <label key={tarea.id} className="flex items-start gap-2 text-xs text-text-secondary cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tarea.completada}
                                  onChange={() => toggleTask(proyecto, tarea.id)}
                                  className="mt-0.5 accent-yellow-500"
                                />
                                <span className={tarea.completada ? 'line-through text-text-tertiary' : ''}>{tarea.texto}</span>
                              </label>
                            ))}
                            {tareas.length > 5 && <div className="text-xs text-text-tertiary">+ {tareas.length - 5} tareas mas</div>}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-text-secondary">{proyecto.responsable || '-'}</td>
                      <td className="px-3 py-3"><Badge label={badge.label} type={badge.type} /></td>
                      <td className="px-3 py-3 font-mono text-xs text-text-secondary">
                        {proyecto.fechaInicio || '-'}{proyecto.fechaFin ? ` / ${proyecto.fechaFin}` : ''}
                      </td>
                      <td className="px-3 py-3 font-mono text-text-secondary">Bs {(proyecto.presupuesto || 0).toLocaleString('es-BO')}</td>
                      <td className="px-3 py-3 min-w-40">
                        <div className="h-2 bg-dark-surface3 rounded overflow-hidden">
                          <div className={proyecto.estado === 'completado' ? 'bg-status-success h-full' : 'bg-accent-yellow h-full'} style={{ width: `${Math.min(100, Number(proyecto.progreso) || 0)}%` }} />
                        </div>
                        <div className="text-xs font-mono text-text-tertiary mt-1">{proyecto.progreso || 0}%</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(proyecto)} className="px-2 py-1 rounded border border-dark-border text-accent-blue hover:border-accent-blue text-xs">Editar</button>
                          <button onClick={() => handleDelete(proyecto.id, proyecto.nombre)} className="px-2 py-1 rounded border border-dark-border text-status-danger hover:border-status-danger text-xs">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showForm} title={editing ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={() => setShowForm(false)}>
        <ProyectoForm
          initialData={editing}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
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
