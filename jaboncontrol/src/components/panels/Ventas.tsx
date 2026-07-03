import { useState } from 'react';
import { Card } from '../common/Card';
import { KPICard } from '../common/KPICard';
import { Badge } from '../common/Badge';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { useAppContext } from '../../context/AppContext';
import { generarReporteVenta } from '../../services/pdfService';
import { defaultDateRange, filterByDateRange } from '../../utils/dateFilters';

interface VentasProps {
  onNewClick?: () => void;
}

const money = (value: number) => `Bs ${Math.round(value || 0).toLocaleString('es-BO')}`;

export function Ventas({ onNewClick }: VentasProps = {}) {
  // Incluimos deleteVenta para poder eliminar notas con confirmacion.
  const { ventas, kpis, deleteVenta } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPago, setFilterPago] = useState('todos');
  const [dateRange, setDateRange] = useState(defaultDateRange());
  const [reportVenta, setReportVenta] = useState<any>(null);

  const ventasByDate = filterByDateRange(ventas, dateRange);
  const filteredVentas = ventasByDate.filter((v) => {
    const matchesSearch = v.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPago = filterPago === 'todos' || v.tipoPago === filterPago;
    return matchesSearch && matchesPago;
  });

  const totalPeriodo = filteredVentas.reduce((sum, v) => sum + (v.total || v.precioTotal || 0), 0);
  const contado = filteredVentas.filter((v) => v.tipoPago === 'contado');
  const credito = filteredVentas.filter((v) => v.tipoPago === 'credito');
  const mejorCliente = [...filteredVentas].sort((a, b) => (b.total || b.precioTotal || 0) - (a.total || a.precioTotal || 0))[0];

  // Borrado seguro: exige confirmacion antes de tocar datos.
  const safeDelete = (venta: any) => {
    // El mensaje incluye numero y cliente para evitar borrar la nota equivocada.
    const ok = confirm(`Eliminar la nota ${venta.numeroNE} de ${venta.cliente}?`);

    // Si el usuario cancela, no se ejecuta ninguna accion.
    if (!ok) return;

    // Si confirma, delegamos en el contexto para borrar local/API.
    deleteVenta(venta.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Ventas</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">NOTAS DE ENTREGA, CREDITOS Y FACTURACION</p>
        </div>
        <button onClick={onNewClick} className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 w-fit">
          + Nueva NE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="Periodo filtrado" value={money(totalPeriodo)} unit={`${filteredVentas.length} notas`} color="yellow" />
        <KPICard label="Credito pendiente" value={money(kpis.cobrosPendientes)} unit={`${credito.length} notas`} color="orange" />
        <KPICard label="Cancelado" value={money(contado.reduce((s, v) => s + (v.total || v.precioTotal || 0), 0))} unit={`${contado.length} notas`} color="blue" />
        <KPICard label="Mayor venta" value={mejorCliente ? money(mejorCliente.total || mejorCliente.precioTotal || 0) : 'Bs 0'} unit={mejorCliente?.cliente || 'Sin datos'} color="green" />
      </div>

      <Card title="Notas de entrega" badge={{ label: `${filteredVentas.length} registros`, type: 'info' }}>
        <div className="mb-4 flex flex-wrap gap-3 items-end">
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Estado</span>
            <select value={filterPago} onChange={(e) => setFilterPago(e.target.value)} className="w-40 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none">
              <option value="todos">Todos</option>
              <option value="contado">Cancelado</option>
              <option value="credito">Credito</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Cliente</span>
            <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-56 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none" />
          </label>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['N NE', 'Fecha', 'Cliente', 'Formato', 'Cantidad', 'P. Unitario', 'Total', 'Tipo pago', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVentas.map((venta) => (
                <tr key={venta.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                  <td className="px-3 py-2 font-mono text-text-secondary">{venta.numeroNE}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{venta.fecha}</td>
                  <td className="px-3 py-2 text-text-secondary">{venta.cliente}</td>
                  <td className="px-3 py-2 text-text-secondary">{venta.formato}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{venta.cantidad}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{money(venta.precioUnitario)}</td>
                  <td className="px-3 py-2 font-mono text-accent-yellow">{money(venta.total || venta.precioTotal || 0)}</td>
                  <td className="px-3 py-2"><Badge label={venta.tipoPago === 'contado' ? 'Pagado' : 'Credito'} type={venta.tipoPago === 'contado' ? 'success' : 'warning'} /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => setReportVenta(venta)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow" title="Descargar reporte PDF">
                        PDF
                      </button>
                      <button onClick={() => safeDelete(venta)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-status-danger hover:text-status-danger" title="Eliminar con confirmacion">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVentas.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin ventas en este filtro.</div>}
        </div>
      </Card>

      <ReportDownloadModal
        isOpen={Boolean(reportVenta)}
        title="Nota de entrega"
        subtitle={reportVenta ? `Comprobante ${reportVenta.numeroNE}` : ''}
        onClose={() => setReportVenta(null)}
        onConfirm={(options) => reportVenta && generarReporteVenta(reportVenta, options)}
      />
    </div>
  );
}
