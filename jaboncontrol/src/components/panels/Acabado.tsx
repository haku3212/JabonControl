import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export function Acabado() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Producción de Acabado</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">COMPRESORA Y SELLADO</p>
        </div>
        <button className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded">+ Nuevo Registro</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Compresora" badge={{ label: 'Operativa', type: 'success' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Fecha', 'Operarios', 'Piezas', 'Bandejas', 'Kg'].map((h) => (
                    <th key={h} className="text-left px-2 py-2 text-xs font-mono text-text-tertiary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-dark-border hover:bg-dark-surface2">
                  <td className="px-2 py-2 font-mono text-text-secondary">02/06/26</td>
                  <td className="px-2 py-2 text-text-secondary">Pedro G., Ana R.</td>
                  <td className="px-2 py-2 font-mono text-text-secondary">1,200</td>
                  <td className="px-2 py-2 font-mono text-text-secondary">24</td>
                  <td className="px-2 py-2 font-mono text-text-secondary">480 kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Sellado" badge={{ label: 'Operativo', type: 'success' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Fecha', 'Operarios', 'Cajas', 'Bandejas'].map((h) => (
                    <th key={h} className="text-left px-2 py-2 text-xs font-mono text-text-tertiary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-dark-border hover:bg-dark-surface2">
                  <td className="px-2 py-2 font-mono text-text-secondary">02/06/26</td>
                  <td className="px-2 py-2 text-text-secondary">Ana R., Rosa V.</td>
                  <td className="px-2 py-2 font-mono text-text-secondary">100</td>
                  <td className="px-2 py-2 font-mono text-text-secondary">24</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Stock Jabón Terminado">
          <div className="space-y-3">
            {[
              { name: 'Cajas', pct: 70, qty: '700 u.' },
              { name: 'Nódulos', pct: 45, qty: '2,250 u.' },
              { name: 'Barras', pct: 85, qty: '1,260 u.' },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs w-20">{item.name}</span>
                <div className="flex-1 h-1.5 bg-dark-surface3 rounded overflow-hidden">
                  <div className="h-full bg-status-success" style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs font-mono text-text-tertiary w-20 text-right">{item.qty}</span>
              </div>
            ))}
            <div className="border-t border-dark-border pt-3 mt-3 flex justify-between items-center">
              <span className="text-xs font-mono text-text-tertiary">TOTAL DISPONIBLE</span>
              <div className="font-bebas text-2xl text-accent-yellow">4,210</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
