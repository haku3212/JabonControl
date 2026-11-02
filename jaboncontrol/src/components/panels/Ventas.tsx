import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DeleteFinancialModal } from '../common/DeleteFinancialModal';
import { Card } from '../common/Card';
import { KPICard } from '../common/KPICard';
import { Badge } from '../common/Badge';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { Modal } from '../common/Modal';
import { VentaForm } from '../forms/VentaForm';
import { useAppContext } from '../../context/AppContext';
import { generarReporteVenta } from '../../services/pdfService';
import { defaultDateRange, filterByDateRange } from '../../utils/dateFilters';
import { ventaSaldoPendiente } from '../../utils/financial';

interface VentasProps {
  onNewClick?: () => void;
  userRole?: string;
}

const money = (value: number) => `Bs ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Ventas({ onNewClick, userRole = 'operario' }: VentasProps = {}) {
  const { ventas, deleteVenta, updateVenta } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPago, setFilterPago] = useState('todos');
  const [dateRange, setDateRange] = useState(defaultDateRange());
  const [reportVenta, setReportVenta] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [notice, setNotice] = useState('');
  const canDelete = userRole === 'admin';
  const canEdit = ['admin', 'supervisor', 'supervisor_ventas'].includes(userRole);

  const ventasByDate = filterByDateRange(ventas, dateRange);
  const filteredVentas = ventasByDate.filter((v) => {
    const matchesSearch = v.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPago = filterPago === 'todos' || v.tipoPago === filterPago;
    return matchesSearch && matchesPago;
  });

  const totalPeriodo = filteredVentas.reduce((sum, v) => sum + (v.total || v.precioTotal || 0), 0);
  const contado = filteredVentas.filter((v) => ventaSaldoPendiente(v) <= 0);
  const credito = filteredVentas.filter((v) => ventaSaldoPendiente(v) > 0);
  const pendientesRecojo = filteredVentas.filter((v) => v.estadoEntrega === 'pendiente_recojo');

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

      {notice && <p role="status" className="text-sm text-status-success">{notice}</p>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="Periodo filtrado" value={money(totalPeriodo)} unit={`${filteredVentas.length} notas`} color="yellow" />
        <KPICard label="Credito pendiente" value={money(credito.reduce((s, v) => s + ventaSaldoPendiente(v), 0))} unit={`${credito.length} notas`} color="orange" />
        <KPICard label="Cancelado" value={money(contado.reduce((s, v) => s + (v.total || v.precioTotal || 0), 0))} unit={`${contado.length} notas`} color="blue" />
        <KPICard label="Pendiente recojo" value={pendientesRecojo.length} unit="ventas pagadas/reservadas" color="green" />
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
                {['N NE', 'Fecha', 'Cliente', 'Formato', 'Total', 'Pago', 'Entrega', 'Detalle', ''].map((h) => (
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
                  <td className="px-3 py-2 font-mono text-accent-yellow">{money(venta.total || venta.precioTotal || 0)}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <Badge
                        label={ventaSaldoPendiente(venta) <= 0 ? 'Pagado' : 'Credito'}
                        type={ventaSaldoPendiente(venta) <= 0 ? 'success' : 'warning'}
                      />
                      <div className="text-[11px] text-text-tertiary">{venta.metodoPago || '-'}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      label={venta.estadoEntrega === 'pendiente_recojo' ? 'Pendiente recojo' : 'Entregado'}
                      type={venta.estadoEntrega === 'pendiente_recojo' ? 'warning' : 'success'}
                    />
                    {venta.fechaRecojo && <div className="text-[11px] text-text-tertiary mt-1">{venta.fechaRecojo}</div>}
                  </td>
                  <td className="px-3 py-2 max-w-[220px] text-xs text-text-tertiary">
                    <div className="line-clamp-2">{venta.observaciones || venta.cuentaEmpresa || '-'}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {canEdit && (
                        <button onClick={() => setEditing(venta)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-blue hover:text-accent-blue" title="Editar nota">
                          Editar
                        </button>
                      )}
                      <button onClick={() => setReportVenta(venta)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow" title="Descargar reporte PDF">
                        PDF
                      </button>
                      {canDelete && (
                        <button onClick={() => { setDeleting(venta); setNotice(''); }} className="icon-button text-status-danger" title={`Eliminar ${venta.numeroNE}`} aria-label={`Eliminar ${venta.numeroNE}`}>
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVentas.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin ventas en este filtro.</div>}
        </div>
      </Card>

      {deleting && <DeleteFinancialModal title="Eliminar venta" record={`${deleting.numeroNE} · ${deleting.cliente} · ${money(deleting.total)}`} description="La venta dejara de contar en los totales. Se conservaran la copia del registro, el motivo y la auditoria. Si tiene cobros aplicados, debe eliminarlos primero desde Cobros." onClose={() => setDeleting(null)} onConfirm={async motivo => { await deleteVenta(deleting.id, motivo); setDeleting(null); setNotice('Venta eliminada. Los totales fueron actualizados.'); }} />}
      <ReportDownloadModal
        isOpen={Boolean(reportVenta)}
        title="Nota de entrega"
        subtitle={reportVenta ? `Comprobante ${reportVenta.numeroNE}` : ''}
        onClose={() => setReportVenta(null)}
        onConfirm={(options) => reportVenta && generarReporteVenta(reportVenta, options)}
      />
      <Modal isOpen={Boolean(editing)} title="Editar nota de entrega" onClose={() => setEditing(null)}>
        {editing && (
          <VentaForm
            initialData={editing}
            onCancel={() => setEditing(null)}
            onSave={async (data) => {
              await updateVenta(editing.id, data);
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
