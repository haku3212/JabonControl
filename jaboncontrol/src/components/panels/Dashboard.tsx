import { KPICard } from '../common/KPICard';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useAppContext } from '../../context/AppContext';

export function Dashboard() {
  const { kpis, ventas, hornadas } = useAppContext();

  const ultimasVentas = ventas.slice(-4);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="Producción Hoy"
          value={kpis.produccionHoy}
          unit="kg procesados"
          color="yellow"
          delta={{ value: 12, positive: true }}
        />
        <KPICard
          label="Stock Jabón"
          value="4,210"
          unit="unidades disponibles"
          color="orange"
          delta={{ value: 5, positive: true }}
        />
        <KPICard
          label="Ventas Mes"
          value={`Bs ${kpis.ventasMes.toLocaleString()}`}
          unit={`${ventas.length} notas de entrega`}
          color="blue"
          delta={{ value: 8, positive: true }}
        />
        <KPICard
          label="Cobros Pendientes"
          value={`Bs ${kpis.cobrosPendientes.toLocaleString()}`}
          unit={`${ventas.filter(v => v.tipoPago === 'credito').length} clientes`}
          color="green"
          delta={{ value: 3, positive: false }}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="col-span-2 space-y-4">
          {/* Producción Chart */}
          <Card
            title="Producción — Últimas 7 Hornadas"
            badge={{ label: 'ACTIVO', type: 'success' }}
          >
            <div className="flex items-end gap-1.5 h-20 pt-2">
              {hornadas.slice(-7).map((h, i) => (
                <div key={h.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm transition-opacity hover:opacity-100 opacity-70 ${
                      [0, 3].includes(i) ? 'bg-accent-orange' : [5].includes(i) ? 'bg-accent-blue' : 'bg-accent-yellow'
                    }`}
                    style={{ height: `${Math.max(20, (h.produccionTotal / 300) * 80)}px` }}
                  />
                  <span className="text-xs font-mono text-text-tertiary">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Últimas Ventas */}
          <Card title="Últimas Ventas">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">N° NE</th>
                    <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Cliente</th>
                    <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Formato</th>
                    <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Cantidad</th>
                    <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Total</th>
                    <th className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasVentas.map((venta) => (
                    <tr key={venta.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                      <td className="px-3 py-2 text-text-secondary font-mono">{venta.numeroNE}</td>
                      <td className="px-3 py-2 text-text-secondary">{venta.cliente}</td>
                      <td className="px-3 py-2 text-text-secondary">{venta.formato}</td>
                      <td className="px-3 py-2 text-text-secondary font-mono">{venta.cantidad}</td>
                      <td className="px-3 py-2 text-accent-yellow font-mono">Bs {(venta.total || venta.precioTotal || 0).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <Badge
                          label={venta.tipoPago === 'contado' ? 'Pagado' : 'Crédito'}
                          type={venta.tipoPago === 'contado' ? 'success' : 'warning'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Stock Materias Primas */}
          <Card title="Stock Materias Primas">
            <div className="space-y-3">
              {[
                { name: 'NaOH (bolsas)', pct: 78, qty: '78 bolsas', bar: 'bg-status-success' },
                { name: 'Sebo fundido', pct: 42, qty: '210 kg', bar: 'bg-accent-yellow' },
                { name: 'Aceite quemado', pct: 35, qty: '175 kg', bar: 'bg-accent-yellow' },
                { name: 'Aceite crudo', pct: 15, qty: '75 kg ⚠', bar: 'bg-status-danger' },
                { name: 'Aceite almendra', pct: 60, qty: '120 kg', bar: 'bg-status-success' },
                { name: 'Agua', pct: 90, qty: '900 lts', bar: 'bg-status-success' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-24">{item.name}</span>
                  <div className="flex-1 h-1 bg-dark-surface3 rounded-full overflow-hidden">
                    <div className={`h-full ${item.bar}`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-text-tertiary w-20 text-right">{item.qty}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Alertas */}
          <Card title="Alertas" badge={{ label: '3 activas', type: 'danger' }}>
            <div className="space-y-2">
              <div className="p-2 bg-status-danger bg-opacity-10 rounded border-l-4 border-status-danger flex gap-2">
                <span className="text-lg">⚠️</span>
                <div className="text-xs">
                  <div className="text-status-danger font-semibold">Stock crítico</div>
                  <div className="text-text-tertiary">Aceite crudo bajo 20%</div>
                </div>
              </div>
              <div className="p-2 bg-accent-yellow bg-opacity-10 rounded border-l-4 border-accent-yellow flex gap-2">
                <span className="text-lg">💰</span>
                <div className="text-xs">
                  <div className="text-accent-yellow font-semibold">Cobro vencido</div>
                  <div className="text-text-tertiary">NE-0038 — 15 días</div>
                </div>
              </div>
              <div className="p-2 bg-accent-yellow bg-opacity-10 rounded border-l-4 border-accent-yellow flex gap-2">
                <span className="text-lg">🔧</span>
                <div className="text-xs">
                  <div className="text-accent-yellow font-semibold">Mantenimiento</div>
                  <div className="text-text-tertiary">Compresora — revisión pendiente</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
