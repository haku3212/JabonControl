import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useAppContext } from '../../context/AppContext';

interface ProyectosProps {
  onNewClick?: () => void;
}

const estadoBadge: Record<string, { label: string; type: 'success' | 'warning' | 'info' }> = {
  activo: { label: 'Activo', type: 'warning' },
  pausado: { label: 'Pausado', type: 'info' },
  completado: { label: 'Completado', type: 'success' },
};

export function Proyectos({ onNewClick }: ProyectosProps) {
  const { proyectos, deleteProyecto } = useAppContext();

  const handleEliminar = (id: string, nombre: string) => {
    if (confirm(`¿Eliminar el proyecto "${nombre}"?`)) {
      deleteProyecto(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Proyectos en Marcha</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">SEGUIMIENTO DE INICIATIVAS</p>
        </div>
        <button
          onClick={onNewClick}
          className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
        >
          + Nuevo Proyecto
        </button>
      </div>

      {/* MIS PROYECTOS REGISTRADOS */}
      {proyectos.length === 0 ? (
        <Card title="Mis Proyectos">
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏗️</div>
            <p className="text-sm text-text-secondary mb-1">No hay proyectos registrados todavía</p>
            <p className="text-xs text-text-tertiary mb-4">
              Registra tus iniciativas para hacerles seguimiento
            </p>
            <button
              onClick={onNewClick}
              className="px-4 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
            >
              + Crear mi primer proyecto
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {proyectos.map((proyecto) => {
            const badge = estadoBadge[proyecto.estado] || estadoBadge.activo;
            return (
              <Card key={proyecto.id} title={proyecto.nombre}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{proyecto.nombre}</p>
                      {proyecto.descripcion && (
                        <p className="text-xs text-text-secondary mt-1">{proyecto.descripcion}</p>
                      )}
                      <p className="text-xs text-text-tertiary font-mono mt-1">
                        Inicio: {proyecto.fechaInicio}
                        {proyecto.fechaFin && ` — Fin: ${proyecto.fechaFin}`}
                        {proyecto.responsable && ` · Responsable: ${proyecto.responsable}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={badge.label} type={badge.type} />
                      <button
                        onClick={() => handleEliminar(proyecto.id, proyecto.nombre)}
                        className="text-xs px-2 py-1 bg-dark-surface3 rounded border border-dark-border hover:border-status-danger hover:text-status-danger"
                        title="Eliminar proyecto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="w-full h-1 bg-dark-surface3 rounded overflow-hidden">
                      <div
                        className={proyecto.estado === 'completado' ? 'bg-status-success h-full' : 'bg-accent-yellow h-full'}
                        style={{ width: `${proyecto.progreso || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-tertiary font-mono mt-1">{proyecto.progreso || 0}% completado</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* PROYECTOS DE EJEMPLO */}
      <div className="space-y-4">
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Ejemplos de referencia</p>
        {[
          {
            nombre: 'Ampliación Línea de Producción — Compresora 2',
            inicio: '15/04/2026',
            fin: 'NE-PROJ-001',
            progreso: 60,
            estado: 'warning',
            pasos: [
              { desc: 'Cotización y selección de proveedor', done: true },
              { desc: 'Aprobación presupuesto', done: true },
              { desc: 'Obra civil (base de maquinaria)', done: true },
              { desc: 'Instalación eléctrica', done: false },
              { desc: 'Prueba de funcionamiento', done: false },
            ]
          },
          {
            nombre: 'Certificación Ambiental Municipal',
            inicio: '02/05/2026',
            fin: 'NE-PROJ-002',
            progreso: 30,
            estado: 'info',
            pasos: [
              { desc: 'Solicitud inicial presentada', done: true },
              { desc: 'Inspección municipal', done: false },
              { desc: 'Entrega de documentación técnica', done: false },
              { desc: 'Aprobación final', done: false },
            ]
          },
        ].map((proyecto) => (
          <Card key={proyecto.nombre} title={proyecto.nombre.split(' ')[0]}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{proyecto.nombre}</p>
                  <p className="text-xs text-text-tertiary font-mono mt-1">
                    Iniciado: {proyecto.inicio} — {proyecto.fin}
                  </p>
                </div>
                <Badge label={proyecto.estado === 'warning' ? 'En progreso' : 'En trámite'} type={proyecto.estado as 'warning' | 'info'} />
              </div>

              <div>
                <div className="w-full h-1 bg-dark-surface3 rounded overflow-hidden">
                  <div
                    className={proyecto.estado === 'warning' ? 'bg-accent-yellow h-full' : 'bg-accent-blue h-full'}
                    style={{ width: `${proyecto.progreso}%` }}
                  />
                </div>
                <p className="text-xs text-text-tertiary font-mono mt-1">{proyecto.progreso}% completado</p>
              </div>

              <div className="space-y-2">
                {proyecto.pasos.map((paso, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paso.done
                        ? 'bg-status-success border-status-success text-black text-[10px]'
                        : 'border-dark-border'
                    }`}>
                      {paso.done && '✓'}
                    </div>
                    <span className="text-text-secondary">{paso.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
