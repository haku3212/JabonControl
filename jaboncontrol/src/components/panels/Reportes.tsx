import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { useAppContext } from '../../context/AppContext';
import { generarReporteFinanciero } from '../../services/pdfService';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { defaultDateRange, filterByDateRange, rangeLabel } from '../../utils/dateFilters';
import { exportFullBackup } from '../../utils/backupExport';

const money = (value: number) => `Bs ${Math.round(value || 0).toLocaleString('es-BO')}`;

export function Reportes() {
  // Leemos todos los modulos principales para poder analizar y exportar el sistema completo.
  const { ventas, cobros, hornadas, recepciones, clientes, proyectos, equipos, documentos } = useAppContext();

  // Este selector conserva el modo de lectura ejecutiva que ya existia.
  const [periodo, setPeriodo] = useState('actual');

  // Este rango filtra los datos reales que alimentan metricas, tablas y graficos.
  const [dateRange, setDateRange] = useState(defaultDateRange());

  // Controla el modal para preparar el PDF ejecutivo.
  const [showExport, setShowExport] = useState(false);

  // Aplicamos el rango de fechas a cada modulo con campo fecha.
  const filteredVentas = filterByDateRange(ventas, dateRange);
  const filteredCobros = filterByDateRange(cobros, dateRange);
  const filteredHornadas = filterByDateRange(hornadas, dateRange);
  const filteredRecepciones = filterByDateRange(recepciones, dateRange);

  const resumen = useMemo(() => {
    const ventasTotal = filteredVentas.reduce((sum, venta) => sum + (venta.total || venta.precioTotal || 0), 0);
    const cobrado = filteredCobros.reduce((sum, cobro) => sum + cobro.montoCobrado, 0);
    const porCobrar = filteredVentas.reduce((sum, venta) => sum + (venta.saldoPendiente ?? (venta.tipoPago === 'credito' ? (venta.total || venta.precioTotal || 0) : 0)), 0);
    const compras = filteredRecepciones.reduce((sum, item) => sum + item.precioTotal, 0);
    const produccion = filteredHornadas.reduce((sum, item) => sum + Number(item.produccionTotal || 0), 0);
    const rendimiento = filteredHornadas.length ? filteredHornadas.reduce((sum, item) => sum + Number(item.rendimiento || 0), 0) / filteredHornadas.length : 0;
    const utilidad = ventasTotal - compras;
    return { ventasTotal, cobrado, porCobrar, compras, produccion, rendimiento, utilidad };
  }, [filteredVentas, filteredCobros, filteredHornadas, filteredRecepciones]);

  const ventasPorFormato = useMemo(() => {
    // Agrupamos ventas por formato para alimentar barras profesionales.
    const data = new Map<string, number>();
    filteredVentas.forEach((venta) => data.set(venta.formato, (data.get(venta.formato) || 0) + (venta.total || venta.precioTotal || 0)));
    return [...data.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredVentas]);

  // Recharts trabaja mejor con objetos, asi que convertimos el Map a una lista amigable.
  const chartVentasFormato = ventasPorFormato.map(([formato, total]) => ({ formato, total }));

  // Este grafico resume produccion y rendimiento por hornada.
  const chartHornadas = filteredHornadas.slice(-10).map((hornada) => ({
    hornada: hornada.numero,
    kg: Number(hornada.produccionTotal || 0),
    rendimiento: Number(hornada.rendimiento || 0),
  }));

  const topClientes = useMemo(() => [...clientes].sort((a, b) => (b.ventaMes || 0) - (a.ventaMes || 0)).slice(0, 6), [clientes]);
  const maxFormato = Math.max(1, ...ventasPorFormato.map(([, value]) => value));
  const ultimaVenta = filteredVentas[filteredVentas.length - 1];
  const ultimaHornada = filteredHornadas[filteredHornadas.length - 1];
  const ultimaRecepcion = filteredRecepciones[filteredRecepciones.length - 1];

  const financieroData = [
    ...filteredVentas.map((venta) => ({ fecha: venta.fecha, tipo: 'ingreso', categoria: 'Ventas', concepto: venta.numeroNE, monto: venta.total || venta.precioTotal || 0 })),
    ...filteredRecepciones.map((item) => ({ fecha: item.fecha, tipo: 'egreso', categoria: 'Materia prima', concepto: item.producto, monto: item.precioTotal })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Reportes</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">ANALISIS DETALLADO, INDICADORES Y EXPORTACION</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm">
            <option value="actual">Mes actual</option>
            <option value="trimestre">Trimestre</option>
            <option value="anual">Anual</option>
          </select>
          <button onClick={() => setShowExport(true)} className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90">
            Exportar resumen
          </button>
          <button
            onClick={() => exportFullBackup({ ventas, cobros, clientes, hornadas, recepciones, proyectos, equipos, documentos })}
            className="px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-semibold rounded border border-dark-border hover:border-accent-yellow"
          >
            Backup Excel
          </button>
        </div>
      </div>

      <Card title={`Periodo de analisis - ${rangeLabel(dateRange)}`}>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Ventas" value={money(resumen.ventasTotal)} detail={`${filteredVentas.length} notas`} tone="text-accent-yellow" />
        <Metric label="Cobrado" value={money(resumen.cobrado)} detail={`${filteredCobros.length} pagos`} tone="text-status-success" />
        <Metric label="Produccion" value={`${resumen.produccion} kg`} detail={`${filteredHornadas.length} hornadas`} tone="text-accent-blue" />
        <Metric label="Utilidad bruta" value={money(resumen.utilidad)} detail={`Compras: ${money(resumen.compras)}`} tone={resumen.utilidad >= 0 ? 'text-status-success' : 'text-status-danger'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5">
        <Card title="Reportes recomendados" badge={{ label: periodo, type: 'info' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ReportCard title="Comercial" desc="Ventas por cliente, formato, credito y recuperacion." status={`${filteredVentas.length} registros`} />
            <ReportCard title="Produccion" desc="Kg producidos, rendimiento, receta e insumos usados." status={`${resumen.rendimiento.toFixed(1)}% prom.`} />
            <ReportCard title="Financiero" desc="Ingresos, egresos, utilidad bruta y cartera por cobrar." status={money(resumen.utilidad)} />
            <ReportCard title="Abastecimiento" desc="Compras, proveedores, materia prima recibida y costos." status={`${filteredRecepciones.length} recepciones`} />
          </div>
        </Card>

        <Card title="Lectura ejecutiva">
          <div className="space-y-4">
            <Signal label="Recuperacion de cartera" value={resumen.ventasTotal ? (resumen.cobrado / resumen.ventasTotal) * 100 : 0} />
            <Signal label="Costo materia prima / ventas" value={resumen.ventasTotal ? (resumen.compras / resumen.ventasTotal) * 100 : 0} inverse />
            <Signal label="Rendimiento promedio" value={resumen.rendimiento} />
            <p className="text-sm text-text-secondary border-t border-dark-border pt-4">
              {resumen.porCobrar > 0
                ? `Hay ${money(resumen.porCobrar)} por cobrar. Prioriza clientes con saldo antes de aumentar credito.`
                : 'No hay cartera pendiente en los datos actuales.'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Ventas por formato">
          <div className="h-72">
            {chartVentasFormato.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartVentasFormato}>
                  <CartesianGrid stroke="#2A3037" vertical={false} />
                  <XAxis dataKey="formato" stroke="#697586" fontSize={11} />
                  <YAxis stroke="#697586" fontSize={11} />
                  <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: '#17202A', border: '1px solid #2A3037', color: '#fff' }} />
                  <Bar dataKey="total" fill="#B98224" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {ventasPorFormato.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin ventas para graficar.</div>}
          </div>
        </Card>

        <Card title="Clientes principales">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Cliente', 'Tipo', 'Venta mes', 'Cobrado', 'Estado'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topClientes.map((cliente) => {
                  const saldo = Math.max(0, (cliente.ventaMes || 0) - (cliente.cobradoMes || 0));
                  return (
                    <tr key={cliente.id} className="border-b border-dark-border">
                      <td className="px-3 py-3 text-text-primary">{cliente.nombre}</td>
                      <td className="px-3 py-3 text-text-secondary capitalize">{cliente.tipo}</td>
                      <td className="px-3 py-3 font-mono text-accent-yellow">{money(cliente.ventaMes || 0)}</td>
                      <td className="px-3 py-3 font-mono text-status-success">{money(cliente.cobradoMes || 0)}</td>
                      <td className="px-3 py-3"><Badge label={saldo > 0 ? 'Saldo' : 'Al dia'} type={saldo > 0 ? 'warning' : 'success'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Produccion y rendimiento">
        <div className="h-72">
          {chartHornadas.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartHornadas}>
                <CartesianGrid stroke="#2A3037" vertical={false} />
                <XAxis dataKey="hornada" stroke="#697586" fontSize={11} />
                <YAxis stroke="#697586" fontSize={11} />
                <Tooltip contentStyle={{ background: '#17202A', border: '1px solid #2A3037', color: '#fff' }} />
                <Bar dataKey="kg" name="Kg producidos" fill="#2F6FAF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rendimiento" name="Rendimiento %" fill="#1F9D62" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-text-tertiary text-sm">Sin hornadas para graficar.</div>
          )}
        </div>
      </Card>

      <Card title="Detalle operativo">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Detail title="Ultima venta" value={ultimaVenta?.numeroNE || '-'} detail={ultimaVenta?.cliente || 'Sin ventas'} />
          <Detail title="Ultima hornada" value={ultimaHornada?.numero || '-'} detail={`${ultimaHornada?.produccionTotal || 0} kg`} />
          <Detail title="Ultima compra" value={ultimaRecepcion?.producto || '-'} detail={ultimaRecepcion?.proveedor || 'Sin compras'} />
        </div>
      </Card>

      <ReportDownloadModal
        isOpen={showExport}
        title="Reporte ejecutivo"
        subtitle={`Periodo: ${periodo}`}
        onClose={() => setShowExport(false)}
        onConfirm={(options) => generarReporteFinanciero(financieroData, {
          ingresosTotales: resumen.ventasTotal,
          egresos: resumen.compras,
          flujoCaja: resumen.cobrado - resumen.compras,
          porCobrar: resumen.porCobrar,
          utilidad: resumen.utilidad,
        }, options)}
      />
    </div>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-5">
      <div className="text-xs font-mono text-text-tertiary uppercase">{label}</div>
      <div className={`text-3xl font-bebas mt-1 ${tone}`}>{value}</div>
      <div className="text-xs text-text-tertiary mt-1">{detail}</div>
    </div>
  );
}

function ReportCard({ title, desc, status }: { title: string; desc: string; status: string }) {
  return (
    <div className="rounded border border-dark-border bg-dark-surface2 p-4 hover:border-accent-yellow transition-colors">
      <div className="flex justify-between gap-3">
        <div className="font-semibold text-text-primary">{title}</div>
        <span className="text-xs font-mono text-accent-yellow whitespace-nowrap">{status}</span>
      </div>
      <div className="text-sm text-text-tertiary mt-2">{desc}</div>
    </div>
  );
}

function Signal({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const clean = Math.max(0, Math.min(100, value));
  const good = inverse ? clean <= 45 : clean >= 70;
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="text-text-tertiary uppercase">{label}</span>
        <span className={good ? 'text-status-success' : 'text-accent-yellow'}>{clean.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-dark-surface3 rounded overflow-hidden">
        <div className={good ? 'h-full bg-status-success' : 'h-full bg-accent-yellow'} style={{ width: `${clean}%` }} />
      </div>
    </div>
  );
}

function Detail({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded border border-dark-border bg-dark-surface2 p-4">
      <div className="text-xs font-mono text-text-tertiary uppercase">{title}</div>
      <div className="text-xl font-bebas text-text-primary mt-1">{value}</div>
      <div className="text-xs text-text-tertiary">{detail}</div>
    </div>
  );
}
