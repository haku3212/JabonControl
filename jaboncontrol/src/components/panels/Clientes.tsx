import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useAppContext } from '../../context/AppContext';
import { useState } from 'react';

interface ClientesProps {
  onNewClick?: () => void;
}

export function Clientes({ onNewClick }: ClientesProps = {}) {
  const { clientes } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClientes = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBalance = (cliente: typeof clientes[0]) => {
    const saldo = cliente.ventaMes - cliente.cobradoMes;
    if (saldo === 0) return 'success';
    if (saldo > 0 && saldo < cliente.ventaMes * 0.5) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Clientes</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">FICHA Y ANÁLISIS POR CLIENTE</p>
        </div>
        <button
          onClick={onNewClick}
          className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
        >
          + Nuevo Cliente
        </button>
      </div>

      <Card title="Directorio de Clientes">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Cliente', 'Tipo', 'Venta Total (mes)', 'Cobrado (mes)', 'Saldo', 'Balance', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => {
                const saldo = cliente.ventaMes - cliente.cobradoMes;
                const balanceType = getBalance(cliente);
                const balanceLabel = balanceType === 'success' ? 'Al día' : balanceType === 'warning' ? 'Crédito' : 'Vencido';

                return (
                  <tr key={cliente.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                    <td className="px-3 py-2 font-semibold text-text-primary">{cliente.nombre}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary capitalize">{cliente.tipo}</td>
                    <td className="px-3 py-2 font-mono text-accent-yellow">Bs {cliente.ventaMes.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-status-success">Bs {cliente.cobradoMes.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-accent-yellow">Bs {saldo.toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <Badge label={balanceLabel} type={balanceType as 'success' | 'warning' | 'danger'} />
                    </td>
                    <td className="px-3 py-2"><button className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow">Ficha</button></td>
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
