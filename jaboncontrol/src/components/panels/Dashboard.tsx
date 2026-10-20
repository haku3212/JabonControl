import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { defaultDateRange, filterByDateRange } from '../../utils/dateFilters';
import { ventaSaldoPendiente, ventaTotal } from '../../utils/financial';

const money = (value: number) => `Bs ${value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Dashboard({ onNavigate, allowedPanels }: { onNavigate?: (panel: string) => void; allowedPanels?: Set<string> }) {
  const { ventas, cobros } = useAppContext();
  const [range, setRange] = useState(defaultDateRange());
  const selected = filterByDateRange(ventas, range);
  const vendido = selected.reduce((sum, venta) => sum + ventaTotal(venta), 0);
  const recibido = selected.filter((venta) => venta.tipoPago !== 'credito').reduce((sum, venta) => sum + ventaTotal(venta), 0)
    + filterByDateRange(cobros, range).reduce((sum, cobro) => sum + Number(cobro.montoCobrado), 0);
  const pendiente = ventas.reduce((sum, venta) => sum + ventaSaldoPendiente(venta), 0);
  const recojos = ventas.filter((venta) => venta.estadoEntrega === 'pendiente_recojo').length;
  const recientes = [...selected].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numeroNE.localeCompare(a.numeroNE, undefined, { numeric: true })).slice(0, 5);
  const debtors = Object.entries(ventas.reduce<Record<string, number>>((acc, venta) => {
    acc[venta.cliente] = (acc[venta.cliente] || 0) + ventaSaldoPendiente(venta);
    return acc;
  }, {})).filter(([, saldo]) => saldo > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const can = (panel: string) => !allowedPanels || allowedPanels.has(panel);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-dark-border pb-5">
        <div><h1 className="text-xl font-semibold">Resumen del negocio</h1><p className="text-sm text-text-secondary mt-1">Ventas y entradas del periodo seleccionado</p></div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-dark-border rounded-md divide-y sm:divide-y-0 sm:divide-x divide-dark-border">
        {[['Ventas del periodo', vendido, `${selected.length} notas de entrega`], ['Dinero recibido', recibido, 'Contado y cobros por fecha de pago'], ['Cartera actual', pendiente, 'Saldo pendiente de todos los periodos']].map(([label, amount, detail]) => (
          <div key={String(label)} className="p-5 min-w-0"><dt className="text-sm text-text-secondary">{label}</dt><dd className="text-2xl font-semibold mt-2 break-words tabular-nums">{money(Number(amount))}</dd><p className="text-xs text-text-tertiary mt-2">{detail}</p></div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-3 text-sm border-b border-dark-border pb-5">
        {can('ventas') && <button className="action-primary" onClick={() => onNavigate?.('ventas')}>Ver ventas</button>}
        {can('cobros') && <button className="action-secondary" onClick={() => onNavigate?.('cobros')}>Cobros pendientes</button>}
        {can('compras_gastos') && <button className="action-secondary" onClick={() => onNavigate?.('compras_gastos')}>Compras y gastos</button>}
        <span className="sm:ml-auto text-text-secondary">{recojos} recojos pendientes</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        <section className="min-w-0"><h2 className="text-base font-semibold mb-3">Notas recientes</h2>
          <ul className="divide-y divide-dark-border">{recientes.map((venta) => <li key={venta.id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-sm font-medium break-words">{venta.cliente}</p><p className="text-xs text-text-secondary mt-1">{venta.numeroNE} / {venta.fecha}</p></div>
            <div className="text-right shrink-0"><p className="text-sm font-semibold tabular-nums">{money(ventaTotal(venta))}</p><p className={`text-xs mt-1 ${ventaSaldoPendiente(venta) > 0 ? 'text-status-warning' : 'text-status-success'}`}>{ventaSaldoPendiente(venta) > 0 ? 'Saldo pendiente' : 'Pagado'}{venta.estadoEntrega === 'pendiente_recojo' ? ' / Por recoger' : ''}</p></div>
          </li>)}</ul>{!recientes.length && <p className="py-8 text-sm text-text-secondary">Sin ventas en este periodo.</p>}
        </section>
        <section className="min-w-0"><h2 className="text-base font-semibold mb-3">Cartera por cliente</h2>
          <ul className="divide-y divide-dark-border">{debtors.map(([cliente, saldo]) => <li key={cliente} className="py-3 flex justify-between gap-3 text-sm"><span className="break-words">{cliente}</span><span className="font-semibold text-status-warning whitespace-nowrap tabular-nums">{money(saldo)}</span></li>)}</ul>
          {!debtors.length && <p className="py-8 text-sm text-status-success">No hay saldos pendientes.</p>}
        </section>
      </div>
    </div>
  );
}
