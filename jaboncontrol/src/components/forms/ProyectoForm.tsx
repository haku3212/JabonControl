import { useState } from 'react';

interface ProyectoFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export function ProyectoForm({ onSave, onCancel, initialData }: ProyectoFormProps) {
  const [tareasText, setTareasText] = useState(
    (initialData?.tareas || []).map((tarea: any) => tarea.texto).join('\n')
  );
  const [form, setForm] = useState({
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
    estado: (initialData?.estado || 'activo') as 'activo' | 'pausado' | 'completado',
    responsable: initialData?.responsable || 'Admin',
    fechaInicio: initialData?.fechaInicio || new Date().toISOString().split('T')[0],
    fechaFin: initialData?.fechaFin || '',
    presupuesto: initialData?.presupuesto || 0,
    progreso: initialData?.progreso || 0,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.nombre) {
      alert('Por favor ingrese el nombre del proyecto');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...form,
        tareas: tareasText
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean)
          .map((texto: string, index: number) => ({
            id: initialData?.tareas?.[index]?.id || `${Date.now()}-${index}`,
            texto,
            completada: initialData?.tareas?.[index]?.completada || false,
          })),
        id: initialData?.id || Date.now().toString(),
      });
    } catch (error) {
      alert('Error al guardar el proyecto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Nombre del Proyecto *
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Expansión a nuevos mercados"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Estado
          </label>
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="activo">Activo</option>
            <option value="pausado">Pausado</option>
            <option value="completado">Completado</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Responsable
          </label>
          <input
            type="text"
            value={form.responsable}
            onChange={(e) => setForm({ ...form, responsable: e.target.value })}
            placeholder="Nombre del responsable"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={form.fechaInicio}
            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Fecha Fin (opcional)
          </label>
          <input
            type="date"
            value={form.fechaFin}
            onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Presupuesto (Bs)
          </label>
          <input
            type="number"
            value={form.presupuesto || ''}
            onChange={(e) => setForm({ ...form, presupuesto: Number(e.target.value) })}
            placeholder="0.00"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Progreso (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.progreso || ''}
            onChange={(e) => setForm({ ...form, progreso: Math.min(100, Math.max(0, Number(e.target.value))) })}
            placeholder="0"
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Descripción (opcional)
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Detalles del proyecto..."
            rows={3}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none resize-none"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
            Tareas del proyecto (una por linea)
          </label>
          <textarea
            value={tareasText}
            onChange={(e) => setTareasText(e.target.value)}
            placeholder={'Comprar repuestos\nInstalar equipo\nValidar funcionamiento'}
            rows={5}
            className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none resize-y"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dark-border">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? '⏳ Guardando...' : '💾 Guardar Proyecto'}
        </button>
      </div>
    </div>
  );
}
