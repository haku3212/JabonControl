import { useState } from 'react';
import { ArrowDownLeft, ArrowRight, BadgeCheck, CircleDollarSign, FileText, PackageCheck, ReceiptText, ShoppingBag, Wallet } from 'lucide-react';
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
  const metrics = [
    { label: 'Ventas del periodo', amount: vendido, detail: `${selected.length} notas de entrega`, icon: ShoppingBag, tone: 'text-[#42699a]' },
    { label: 'Dinero recibido', amount: recibido, detail: 'Contado y cobros por fecha de pago', icon: ArrowDownLeft, tone: 'text-accent-blue' },
    { label: 'Cartera actual', amount: pendiente, detail: 'Saldo pendiente de todos los periodos', icon: CircleDollarSign, tone: 'text-[#987126]' },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs text-text-tertiary mb-2">Vista general</p><h1>Resumen del negocio</h1></div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-3 bg-white border-y border-dark-border divide-y sm:divide-y-0 sm:divide-x divide-dark-border">
        {metrics.map(({ label, amount, detail, icon: Icon, tone }) => (
          <div key={label} className="p-5 lg:p-6 min-w-0"><dt className="metric-label"><Icon size={17} className={tone} aria-hidden="true" />{label}</dt><dd className="metric-value">{money(amount)}</dd><p className="text-xs text-text-tertiary mt-2 leading-5">{detail}</p></div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-3 text-sm border-b border-dark-border pb-5">
        {can('ventas') && <button className="action-primary" onClick={() => onNavigate?.('ventas')}><ShoppingBag size={16} aria-hidden="true" />Ver ventas<ArrowRight size={15} aria-hidden="true" /></button>}
        {can('cobros') && <button className="action-secondary" onClick={() => onNavigate?.('cobros')}><Wallet size={16} aria-hidden="true" />Cobros pendientes</button>}
        {can('compras_gastos') && <button className="action-secondary" onClick={() => onNavigate?.('compras_gastos')}><ReceiptText size={16} aria-hidden="true" />Compras y gastos</button>}
        <span className="sm:ml-auto flex items-center gap-2 text-xs text-text-secondary"><PackageCheck size={16} aria-hidden="true" />{recojos} recojos pendientes</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        <section className="min-w-0"><div className="flex items-center justify-between border-b border-dark-border pb-3"><h2 className="text-sm font-semibold">Notas recientes</h2><span className="text-xs text-text-tertiary">Ultimas {recientes.length}</span></div>
          <ul className="divide-y divide-dark-border">{recientes.map((venta) => <li key={venta.id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-sm font-medium break-words">{venta.cliente}</p><p className="text-xs text-text-secondary mt-1">{venta.numeroNE} / {venta.fecha}</p></div>
            <div className="text-right shrink-0"><p className="text-sm font-semibold tabular-nums">{money(ventaTotal(venta))}</p><p className={`text-xs mt-1 ${ventaSaldoPendiente(venta) > 0 ? 'text-status-warning' : 'text-status-success'}`}>{ventaSaldoPendiente(venta) > 0 ? 'Saldo pendiente' : 'Pagado'}{venta.estadoEntrega === 'pendiente_recojo' ? ' / Por recoger' : ''}</p></div>
          </li>)}</ul>{!recientes.length && <div className="empty-state"><FileText size={28} strokeWidth={1.4} aria-hidden="true" /><p>Sin ventas en este periodo</p></div>}
        </section>
        <section className="min-w-0"><div className="flex items-center justify-between border-b border-dark-border pb-3"><h2 className="text-sm font-semibold">Cartera por cliente</h2><span className="text-xs text-text-tertiary">Saldo actual</span></div>
          <ul className="divide-y divide-dark-border">{debtors.map(([cliente, saldo]) => <li key={cliente} className="py-3 flex justify-between gap-3 text-sm"><span className="break-words">{cliente}</span><span className="font-semibold text-status-warning whitespace-nowrap tabular-nums">{money(saldo)}</span></li>)}</ul>
          {!debtors.length && <div className="empty-state"><BadgeCheck size={28} strokeWidth={1.4} className="!text-status-success" aria-hidden="true" /><p>No hay saldos pendientes</p></div>}
        </section>
      </div>
    </div>
  );
}
