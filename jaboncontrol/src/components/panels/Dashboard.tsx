import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KPICard } from '../common/KPICard';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { useAppContext } from '../../context/AppContext';
import { defaultDateRange, filterByDateRange, rangeLabel } from '../../utils/dateFilters';

const money = (value: number) => `Bs ${Math.round(value || 0).toLocaleString('es-BO')}`;

export function Dashboard() {
  // Cargamos los datos globales que alimentan indicadores y graficos.
  const { ventas, hornadas, cobros, clientes, recepciones } = useAppContext();

  // El rango permite analizar dashboard por periodo sin salir de la vista.
  const [dateRange, setDateRange] = useState(defaultDateRange());

  // Cada lista filtrada mantiene los modulos sincronizados con el rango elegido.
  const filteredVentas = filterByDateRange(ventas, dateRange);
  const filteredHornadas = filterByDateRange(hornadas, dateRange);
  const filteredCobros = filterByDateRange(cobros, dateRange);
  const filteredRecepciones = filterByDateRange(recepciones, dateRange);

  const stats = useMemo(() => {
    // Sumamos ventas del periodo para mostrar ingresos comerciales.
    const ventasTotal = filteredVentas.reduce((sum, venta) => sum + (venta.total || venta.precioTotal || 0), 0);

    // Sumamos kilos producidos para medir actividad de planta.
    const produccion = filteredHornadas.reduce((sum, h) => sum + Number(h.produccionTotal || 0), 0);

    // Sumamos cobros reales para comparar contra ventas.
    const cobrado = filteredCobros.reduce((sum, cobro) => sum + cobro.montoCobrado, 0);

    // Separamos ventas a credito para alertas y cartera.
    const ventasCredito = filteredVentas.filter((venta) => venta.tipoPago === 'credito');

    // Calculamos saldo pendiente usando saldoPendiente cuando existe o total de credito como respaldo.
    const porCobrar = filteredVentas.reduce((sum, venta) => sum + (venta.saldoPendiente ?? (venta.tipoPago === 'credito' ? (venta.total || venta.precioTotal || 0) : 0)), 0);

    // Rendimiento promedio de hornadas del periodo.
    const rendimiento = filteredHornadas.length ? filteredHornadas.reduce((sum, h) => sum + Number(h.rendimiento || 0), 0) / filteredHornadas.length : 0;

    // Costo de materia prima recibida en el periodo.
    const materiaPrima = filteredRecepciones.reduce((sum, item) => sum + Number(item.precioTotal || 0), 0);

    // Ticket promedio de venta para lectura comercial rapida.
    const ticketPromedio = filteredVentas.length ? ventasTotal / filteredVentas.length : 0;
    return { ventasTotal, produccion, cobrado, ventasCredito, porCobrar, rendimiento, materiaPrima, ticketPromedio };
  }, [filteredVentas, filteredCobros, filteredHornadas, filteredRecepciones]);

  const ultimasVentas = filteredVentas.slice(-5).reverse();
  const produccion = filteredHornadas.slice(-8);
  const topClientes = [...clientes].sort((a, b) => (b.ventaMes || 0) - (a.ventaMes || 0)).slice(0, 5);

  // Datos adaptados a Recharts para mostrar produccion y rendimiento juntos.
  const produccionChart = produccion.map((h) => ({
    hornada: h.numero,
    kg: Number(h.produccionTotal || 0),
    rendimiento: Number(h.rendimiento || 0),
  }));

  return (
    <div className="space-y-6">
      <Card title={`Periodo dashboard - ${rangeLabel(dateRange)}`}>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Produccion total" value={stats.produccion} unit="kg registrados" color="yellow" delta={{ value: 12, positive: true }} />
        <KPICard label="Ventas periodo" value={money(stats.ventasTotal)} unit={`${filteredVentas.length} notas de entrega`} color="blue" delta={{ value: 8, positive: true }} />
        <KPICard label="Flujo cobrado" value={money(stats.cobrado)} unit={`${filteredCobros.length} cobros`} color="green" delta={{ value: 5, positive: true }} />
        <KPICard label="Por cobrar" value={money(stats.porCobrar)} unit={`${stats.ventasCredito.length} ventas a credito`} color="orange" delta={{ value: 3, positive: false }} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
        <Card title="Pulso operativo" badge={{ label: 'En vivo', type: 'success' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <Insight label="Rendimiento promedio" value={`${stats.rendimiento.toFixed(1)}%`} detail="hornadas registradas" />
            <Insight label="Ticket promedio" value={money(stats.ticketPromedio)} detail="por nota de entrega" />
            <Insight label="Materia prima" value={money(stats.materiaPrima)} detail="recepciones valorizadas" />
          </div>

          <div className="h-52 border-t border-dark-border pt-5">
            {produccionChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={produccionChart}>
                  <CartesianGrid stroke="#2A3037" vertical={false} />
                  <XAxis dataKey="hornada" stroke="#697586" fontSize={10} />
                  <YAxis stroke="#697586" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#17202A', border: '1px solid #2A3037', color: '#fff' }} />
                  <Bar dataKey="kg" name="Kg" fill="#B98224" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rendimiento" name="Rendimiento %" fill="#1F9D62" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full text-center text-text-tertiary text-sm">Sin hornadas registradas.</div>
            )}
          </div>
        </Card>

        <Card title="Alertas prioritarias" badge={{ label: stats.porCobrar > 0 ? 'Atencion' : 'OK', type: stats.porCobrar > 0 ? 'warning' : 'success' }}>
          <div className="space-y-3">
            <Alert title="Cobros pendientes" detail={`${money(stats.porCobrar)} en saldos por recuperar`} tone={stats.porCobrar > 0 ? 'warning' : 'success'} />
            <Alert title="Rendimiento productivo" detail={stats.rendimiento >= 95 ? 'Rendimiento saludable' : 'Revisar receta u operacion'} tone={stats.rendimiento >= 95 ? 'success' : 'warning'} />
            <Alert title="Compras de insumos" detail={`${recepciones.length} recepciones registradas`} tone="info" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card title="Ultimas ventas" badge={{ label: `${ultimasVentas.length} recientes`, type: 'info' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {ultimasVentas.map((venta) => (
                  <tr key={venta.id} className="border-b border-dark-border last:border-0">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-text-primary">{venta.numeroNE}</div>
                      <div className="text-xs text-text-tertiary">{venta.cliente}</div>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">{venta.formato}</td>
                    <td className="py-3 px-3 font-mono text-accent-yellow">{money(venta.total || venta.precioTotal || 0)}</td>
                    <td className="py-3 pl-3"><Badge label={venta.tipoPago === 'contado' ? 'Pagado' : 'Credito'} type={venta.tipoPago === 'contado' ? 'success' : 'warning'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ultimasVentas.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin ventas registradas.</div>}
          </div>
        </Card>

        <Card title="Top clientes">
          <div className="space-y-3">
            {topClientes.map((cliente) => (
              <div key={cliente.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-primary">{cliente.nombre}</span>
                  <span className="font-mono text-accent-yellow">{money(cliente.ventaMes || 0)}</span>
                </div>
                <div className="h-1.5 bg-dark-surface3 rounded overflow-hidden">
                  <div className="h-full bg-accent-yellow" style={{ width: `${Math.min(100, ((cliente.ventaMes || 0) / Math.max(1, topClientes[0]?.ventaMes || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Estado financiero corto">
          <div className="space-y-4">
            <Ratio label="Cobrado vs vendido" value={stats.ventasTotal ? (stats.cobrado / stats.ventasTotal) * 100 : 0} />
            <Ratio label="Credito pendiente" value={stats.ventasTotal ? (stats.porCobrar / stats.ventasTotal) * 100 : 0} danger />
            <div className="rounded border border-dark-border bg-dark-surface2 p-4">
              <div className="text-xs font-mono text-text-tertiary uppercase">Lectura rapida</div>
              <p className="text-sm text-text-secondary mt-2">
                {stats.porCobrar > 0
                  ? 'Conviene priorizar recuperacion de cartera y revisar ventas a credito.'
                  : 'La cartera esta limpia; puedes concentrarte en produccion y reposicion.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Insight({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded border border-dark-border bg-dark-surface2 p-4">
      <div className="text-xs font-mono text-text-tertiary uppercase">{label}</div>
      <div className="text-2xl font-bebas text-text-primary mt-1">{value}</div>
      <div className="text-xs text-text-tertiary">{detail}</div>
    </div>
  );
}

function Alert({ title, detail, tone }: { title: string; detail: string; tone: 'success' | 'warning' | 'info' }) {
  const color = tone === 'success' ? 'border-status-success text-status-success' : tone === 'warning' ? 'border-accent-yellow text-accent-yellow' : 'border-accent-blue text-accent-blue';
  return (
    <div className={`border-l-4 ${color} bg-dark-surface2 rounded px-4 py-3`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-text-tertiary mt-1">{detail}</div>
    </div>
  );
}

function Ratio({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  const clean = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="text-text-tertiary uppercase">{label}</span>
        <span className={danger ? 'text-status-danger' : 'text-status-success'}>{clean.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-dark-surface3 rounded overflow-hidden">
        <div className={`h-full ${danger ? 'bg-status-danger' : 'bg-status-success'}`} style={{ width: `${clean}%` }} />
      </div>
    </div>
  );
}
