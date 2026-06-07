import { Card } from '../common/Card';

export function Reportes() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Reportes</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">ANÁLISIS Y EXPORTACIÓN</p>
        </div>
        <select className="bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm">
          <option>Junio 2026</option>
          <option>Mayo 2026</option>
          <option>Abril 2026</option>
        </select>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { icon: '🧪', name: 'Materia Prima', desc: 'Entradas, salidas y mermas' },
          { icon: '🔥', name: 'Producción', desc: 'Hornadas por período' },
          { icon: '🛒', name: 'Ventas', desc: 'NE por cliente y período' },
          { icon: '💰', name: 'Cobros', desc: 'Saldos y deuda' },
          { icon: '📊', name: 'Eficiencias', desc: 'Rendimiento por hornada' },
        ].map((rep) => (
          <div key={rep.name} className="bg-dark-surface border border-dark-border rounded-lg p-5 text-center cursor-pointer hover:border-accent-yellow transition-all">
            <div className="text-3xl mb-2">{rep.icon}</div>
            <div className="text-xs font-semibold text-text-primary mb-1">{rep.name}</div>
            <div className="text-xs text-text-tertiary">{rep.desc}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Producción Mes Actual — Kg / Día">
          <div className="flex items-end gap-1.5 h-32 pt-2">
            {[60, 90, 75, 100].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-sm opacity-70 hover:opacity-100 transition-opacity ${
                    i === 1 ? 'bg-accent-orange' : i === 3 ? 'bg-status-success' : 'bg-accent-yellow'
                  }`}
                  style={{ height: `${height}px` }}
                />
                <span className="text-xs font-mono text-text-tertiary">
                  {['S1', 'S2', 'S3', 'S4'][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Ventas por Formato">
          <div className="space-y-4">
            {[
              { name: 'Cajas', pct: 45 },
              { name: 'Barras', pct: 35 },
              { name: 'Nódulos', pct: 20 },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-primary">{item.name}</span>
                  <span className="font-mono text-xs text-accent-yellow">{item.pct}%</span>
                </div>
                <div className="h-1.5 bg-dark-surface3 rounded overflow-hidden">
                  <div className="h-full bg-accent-yellow" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
