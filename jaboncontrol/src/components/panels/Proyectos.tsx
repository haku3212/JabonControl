import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export function Proyectos() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Proyectos en Marcha</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">SEGUIMIENTO DE INICIATIVAS</p>
        </div>
        <button className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded">+ Nuevo Proyecto</button>
      </div>

      <div className="space-y-4">
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
                    className={proyecto.estado === 'warning' ? 'bg-accent-yellow' : 'bg-accent-blue'}
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
