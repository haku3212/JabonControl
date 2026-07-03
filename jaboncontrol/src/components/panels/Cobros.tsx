import { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { useAppContext } from '../../context/AppContext';
import { generarReporteCobro } from '../../services/pdfService';
import { defaultDateRange, filterByDateRange } from '../../utils/dateFilters';

interface CobrosProps {
  onNewClick?: () => void;
}

const money = (value: number) => `Bs ${Math.round(value || 0).toLocaleString('es-BO')}`;

export function Cobros({ onNewClick }: CobrosProps = {}) {
  const { cobros } = useAppContext();
  const [dateRange, setDateRange] = useState(defaultDateRange());
  const [reportCobro, setReportCobro] = useState<any>(null);
  const filteredCobros = filterByDateRange(cobros, dateRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Cobros</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">CUENTAS POR COBRAR Y RECUPERACION</p>
        </div>
        <button onClick={onNewClick} className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 w-fit">
          + Registrar cobro
        </button>
      </div>

      <Card title="Cobros registrados" badge={{ label: `${filteredCobros.length} registros`, type: 'info' }}>
        <div className="mb-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Fecha cobro', 'Cliente', 'NE correspondientes', 'Monto cobrado', 'Metodo', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCobros.map((cobro) => (
                <tr key={cobro.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                  <td className="px-3 py-2 font-mono text-text-secondary">{cobro.fecha}</td>
                  <td className="px-3 py-2 text-text-secondary">{cobro.cliente}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{cobro.notasCorrespondientes}</td>
                  <td className="px-3 py-2 font-mono text-status-success font-semibold">{money(cobro.montoCobrado)}</td>
                  <td className="px-3 py-2"><Badge label={cobro.metodoPago === 'efectivo' ? 'Efectivo' : cobro.metodoPago === 'transferencia' ? 'Transferencia' : 'Cheque'} type={cobro.metodoPago === 'efectivo' ? 'success' : 'info'} /></td>
                  <td className="px-3 py-2">
                    <button onClick={() => setReportCobro(cobro)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow" title="Descargar reporte PDF">
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCobros.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin cobros en este filtro.</div>}
        </div>
      </Card>

      <ReportDownloadModal
        isOpen={Boolean(reportCobro)}
        title="Recibo de pago"
        subtitle={reportCobro ? `Cobro de ${reportCobro.cliente}` : ''}
        onClose={() => setReportCobro(null)}
        onConfirm={(options) => reportCobro && generarReporteCobro(reportCobro, options)}
      />
    </div>
  );
}
