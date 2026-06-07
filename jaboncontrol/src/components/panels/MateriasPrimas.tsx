import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Tabs } from '../common/Tabs';
import { useAppContext } from '../../context/AppContext';
import { useState } from 'react';
import { generarReporteRecepcion } from '../../services/pdfService';

interface MateriasPrimasProps {
  onNewClick?: () => void;
}

export function MateriasPrimas({ onNewClick }: MateriasPrimasProps = {}) {
  const { recepciones } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecepciones = recepciones.filter((r) =>
    r.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.producto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    {
      id: 'recepciones',
      label: 'Recepciones',
      content: (
        <Card title="Registros de Recepción">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar proveedor o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Fecha', 'Proveedor', 'Producto', 'Cantidad', 'Precio Unit.', 'Precio Total', 'Estado', ''].map((col) => (
                    <th key={col} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecepciones.map((recepcion) => (
                  <tr key={recepcion.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                    <td className="px-3 py-2 text-text-secondary font-mono">{recepcion.fecha}</td>
                    <td className="px-3 py-2 text-text-secondary">{recepcion.proveedor}</td>
                    <td className="px-3 py-2 text-text-secondary">{recepcion.producto}</td>
                    <td className="px-3 py-2 text-text-secondary font-mono">{recepcion.cantidad} {recepcion.unidad}</td>
                    <td className="px-3 py-2 text-text-secondary font-mono">Bs {recepcion.precioUnitario}</td>
                    <td className="px-3 py-2 text-accent-yellow font-mono">Bs {recepcion.precioTotal.toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <Badge
                        label={recepcion.estado === 'recibido' ? 'Recibido' : recepcion.estado === 'pendiente' ? 'Pendiente' : 'Cancelado'}
                        type={recepcion.estado === 'recibido' ? 'success' : recepcion.estado === 'pendiente' ? 'warning' : 'info'}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => generarReporteRecepcion(recepcion)}
                        className="px-2 py-1 text-xs rounded hover:border-accent-yellow border border-dark-border hover:text-accent-yellow"
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
      ),
    },
    {
      id: 'liquidos',
      label: 'Stock Líquidos (Tanques)',
      content: (
        <div className="grid grid-cols-3 gap-4">
          {[
            { nombre: 'TANQUE 1 — AGUA', pct: 87, actual: 870, cap: 1000, merma: 12 },
            { nombre: 'TANQUE 2 — SEBO FUND.', pct: 42, actual: 210, cap: 500, merma: 8 },
            { nombre: 'TANQUE 3 — ACEITE CRUDO', pct: 15, actual: 75, cap: 500, merma: 5, critical: true },
          ].map((tanque) => (
            <Card key={tanque.nombre} title={tanque.nombre}>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="h-24 bg-dark-surface2 rounded border-2 border-dark-border flex items-end justify-center relative mb-3">
                    <div
                      className={`w-16 rounded-t transition-all ${
                        tanque.critical ? 'bg-status-danger' : 'bg-accent-yellow'
                      }`}
                      style={{ height: `${tanque.pct}%` }}
                    />
                  </div>
                  <div className={`text-3xl font-bebas ${tanque.critical ? 'text-status-danger' : 'text-text-primary'}`}>
                    {tanque.pct}%
                  </div>
                  <div className={`text-xs font-mono ${tanque.critical ? 'text-status-danger' : 'text-text-tertiary'}`}>
                    {tanque.actual} / {tanque.cap} lts
                  </div>
                </div>
                <div className="text-xs text-text-tertiary font-mono text-center">
                  Merma acum: {tanque.merma} lts
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'solidos',
      label: 'Stock Sólidos / Insumos',
      content: (
        <Card title="Stock Sólidos e Insumos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Producto', 'Unidad', 'Entradas', 'Salidas Sistema', 'Salidas Reales', 'Stock Actual', 'Estado'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { prod: 'NaOH (bolsas 25kg)', unit: 'bolsas', ent: 100, salSis: 22, salReal: 22, stock: 78, est: 'success' },
                  { prod: 'Aceite quemado', unit: 'kg', ent: 500, salSis: 320, salReal: 325, stock: 175, est: 'success' },
                  { prod: 'Aceite almendra', unit: 'kg', ent: 200, salSis: 80, salReal: 80, stock: 120, est: 'success' },
                  { prod: 'Aceite crudo', unit: 'kg', ent: 200, salSis: 122, salReal: 125, stock: 75, est: 'danger' },
                ].map((row) => (
                  <tr key={row.prod} className="border-b border-dark-border hover:bg-dark-surface2">
                    <td className="px-3 py-2 text-text-secondary">{row.prod}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.unit}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.ent}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.salSis}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.salReal}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.stock}</td>
                    <td className="px-3 py-2">
                      <Badge label={row.est === 'success' ? 'OK' : 'BAJO'} type={row.est as 'success' | 'danger'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Materias Primas e Insumos</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">GESTIÓN DE STOCK Y RECEPCIONES</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border hover:border-accent-yellow">
            📥 Exportar
          </button>
          <button
            onClick={onNewClick}
            className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
          >
            + Nueva Recepción
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} defaultTab="recepciones" />
    </div>
  );
}
