import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useAppContext } from '../../context/AppContext';
import { generarReporteCobro } from '../../services/pdfService';

interface CobrosProps {
  onNewClick?: () => void;
}

export function Cobros({ onNewClick }: CobrosProps = {}) {
  const { cobros } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Cobros</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">GESTIÓN DE CUENTAS POR COBRAR</p>
        </div>
        <button
          onClick={onNewClick}
          className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
        >
          + Registrar Cobro
        </button>
      </div>

      <Card title="Cobros Registrados">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Fecha Cobro', 'Cliente', 'NE Correspondientes', 'Monto Cobrado', 'Método', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cobros.map((cobro) => {
                const metodoBadgeType = cobro.metodoPago === 'efectivo' ? 'success' : 'info';

                return (
                  <tr key={cobro.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                    <td className="px-3 py-2 font-mono text-text-secondary">{cobro.fecha}</td>
                    <td className="px-3 py-2 text-text-secondary">{cobro.cliente}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{cobro.notasCorrespondientes}</td>
                    <td className="px-3 py-2 font-mono text-status-success font-semibold">Bs {cobro.montoCobrado.toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <Badge
                        label={cobro.metodoPago === 'efectivo' ? 'Efectivo' : cobro.metodoPago === 'transferencia' ? 'Transferencia' : 'Cheque'}
                        type={metodoBadgeType as 'success' | 'info'}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => generarReporteCobro(cobro)}
                        className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow"
                        title="Descargar reporte PDF"
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
