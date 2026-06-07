import { Card } from '../common/Card';
import { KPICard } from '../common/KPICard';
import { Badge } from '../common/Badge';
import { useAppContext } from '../../context/AppContext';
import { useState } from 'react';
import { generarReporteVenta } from '../../services/pdfService';

interface VentasProps {
  onNewClick?: () => void;
}

export function Ventas({ onNewClick }: VentasProps = {}) {
  const { ventas, kpis } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPago, setFilterPago] = useState('todos');

  const filteredVentas = ventas.filter((v) => {
    const matchesSearch = v.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPago = filterPago === 'todos' || v.tipoPago === filterPago;
    return matchesSearch && matchesPago;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Ventas</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">NOTAS DE ENTREGA Y FACTURACIÓN</p>
        </div>
        <button
          onClick={onNewClick}
          className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
        >
          + Nueva NE
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Mes Actual" value={`Bs ${kpis.ventasMes.toLocaleString()}`} unit={`${ventas.length} notas`} color="yellow" />
        <KPICard label="Crédito Pendiente" value={`Bs ${kpis.cobrosPendientes.toLocaleString()}`} unit={`${ventas.filter(v => v.tipoPago === 'credito').length} notas`} color="orange" />
        <KPICard
          label="Cancelado"
          value={`Bs ${ventas.filter(v => v.tipoPago === 'contado').reduce((s, v) => s + (v.total || v.precioTotal || 0), 0).toLocaleString()}`}
          unit={`${ventas.filter(v => v.tipoPago === 'contado').length} notas`}
          color="blue"
        />
        <KPICard label="Mejor Cliente" value="Bs 8,400" unit="Dist. Litoral" color="green" />
      </div>

      <Card title="Notas de Entrega">
        <div className="mb-4 flex gap-3">
          <select
            value={filterPago}
            onChange={(e) => setFilterPago(e.target.value)}
            className="w-32 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="contado">Cancelado</option>
            <option value="credito">Crédito</option>
          </select>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['N° NE', 'Fecha', 'Cliente', 'Formato', 'Cantidad', 'P. Unitario', 'Total', 'Tipo Pago', ''].map((h) => (
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
                  <td className="px-3 py-2 font-mono text-text-secondary">Bs {venta.precioUnitario}</td>
                  <td className="px-3 py-2 font-mono text-accent-yellow">Bs {(venta.total || venta.precioTotal || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <Badge
                      label={venta.tipoPago === 'contado' ? 'Pagado' : 'Crédito'}
                      type={venta.tipoPago === 'contado' ? 'success' : 'warning'}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => generarReporteVenta(venta)}
                      className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow"
                      title="Descargar reporte PDF"
                    >
                      📄 PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
