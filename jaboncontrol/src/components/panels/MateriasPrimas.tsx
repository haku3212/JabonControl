import { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Tabs } from '../common/Tabs';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { useAppContext } from '../../context/AppContext';
import { generarReporteRecepcion } from '../../services/pdfService';

interface MateriasPrimasProps {
  onNewClick?: () => void;
}

export function MateriasPrimas({ onNewClick }: MateriasPrimasProps = {}) {
  // Leemos recepciones para listar compras y deleteRecepcion para borrar con confirmacion.
  const { recepciones, deleteRecepcion } = useAppContext();

  // Guarda el texto de busqueda de proveedor/producto.
  const [searchTerm, setSearchTerm] = useState('');

  // Guarda la recepcion seleccionada para preparar su PDF.
  const [reportRecepcion, setReportRecepcion] = useState<any>(null);

  // Filtra recepciones por proveedor o producto.
  const filteredRecepciones = recepciones.filter((r) =>
    r.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.producto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Borrado seguro de recepciones: confirma proveedor y producto antes de eliminar.
  const safeDelete = (recepcion: any) => {
    if (!confirm(`Eliminar recepcion de ${recepcion.producto} (${recepcion.proveedor})?`)) return;
    deleteRecepcion(recepcion.id);
  };

  // Datos demo para vista visual de tanques.
  const tanques = [
    { nombre: 'TANQUE 1 - AGUA', pct: 87, actual: 870, cap: 1000, merma: 12 },
    { nombre: 'TANQUE 2 - SEBO FUND.', pct: 42, actual: 210, cap: 500, merma: 8 },
    { nombre: 'TANQUE 3 - ACEITE CRUDO', pct: 15, actual: 75, cap: 500, merma: 5, critical: true },
  ];

  // Datos demo para stock solido; luego puede conectarse a inventario real.
  const stockSolido = [
    { prod: 'NaOH (bolsas 25kg)', unit: 'bolsas', ent: 100, salSis: 22, salReal: 22, stock: 78, est: 'success' },
    { prod: 'Aceite quemado', unit: 'kg', ent: 500, salSis: 320, salReal: 325, stock: 175, est: 'success' },
    { prod: 'Aceite almendra', unit: 'kg', ent: 200, salSis: 80, salReal: 80, stock: 120, est: 'success' },
    { prod: 'Almendra podrida', unit: 'kg', ent: 160, salSis: 45, salReal: 47, stock: 113, est: 'success' },
    { prod: 'Aceite crudo', unit: 'kg', ent: 200, salSis: 122, salReal: 125, stock: 75, est: 'danger' },
  ];

  // Tabs del modulo: recepciones, liquidos y solidos.
  const tabs = [
    {
      id: 'recepciones',
      label: 'Recepciones',
      content: (
        <Card title="Registros de recepcion" badge={{ label: `${filteredRecepciones.length} registros`, type: 'info' }}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar proveedor o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-72 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Fecha', 'Proveedor', 'Producto', 'Cantidad', 'Precio unit.', 'Precio total', 'Estado', ''].map((col) => (
                    <th key={col} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{col}</th>
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
                      <div className="flex gap-2">
                        <button onClick={() => setReportRecepcion(recepcion)} className="px-2 py-1 text-xs rounded hover:border-accent-yellow border border-dark-border hover:text-accent-yellow">
                          PDF
                        </button>
                        <button onClick={() => safeDelete(recepcion)} className="px-2 py-1 text-xs rounded hover:border-status-danger border border-dark-border hover:text-status-danger">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRecepciones.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">Sin recepciones con ese filtro.</div>}
          </div>
        </Card>
      ),
    },
    {
      id: 'liquidos',
      label: 'Stock liquidos',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tanques.map((tanque) => (
            <Card key={tanque.nombre} title={tanque.nombre}>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="h-24 bg-dark-surface2 rounded border-2 border-dark-border flex items-end justify-center relative mb-3">
                    <div className={`w-16 rounded-t transition-all ${tanque.critical ? 'bg-status-danger' : 'bg-accent-yellow'}`} style={{ height: `${tanque.pct}%` }} />
                  </div>
                  <div className={`text-3xl font-bebas ${tanque.critical ? 'text-status-danger' : 'text-text-primary'}`}>{tanque.pct}%</div>
                  <div className={`text-xs font-mono ${tanque.critical ? 'text-status-danger' : 'text-text-tertiary'}`}>{tanque.actual} / {tanque.cap} lts</div>
                </div>
                <div className="text-xs text-text-tertiary font-mono text-center">Merma acum: {tanque.merma} lts</div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'solidos',
      label: 'Stock solidos',
      content: (
        <Card title="Stock solidos e insumos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Producto', 'Unidad', 'Entradas', 'Salidas sistema', 'Salidas reales', 'Stock actual', 'Estado'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockSolido.map((row) => (
                  <tr key={row.prod} className="border-b border-dark-border hover:bg-dark-surface2">
                    <td className="px-3 py-2 text-text-secondary">{row.prod}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.unit}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.ent}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.salSis}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.salReal}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{row.stock}</td>
                    <td className="px-3 py-2"><Badge label={row.est === 'success' ? 'OK' : 'BAJO'} type={row.est as 'success' | 'danger'} /></td>
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
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Materias Primas e Insumos</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">GESTION DE STOCK Y RECEPCIONES</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border hover:border-accent-yellow">
            Exportar
          </button>
          <button onClick={onNewClick} className="px-3 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90">
            + Nueva recepcion
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} defaultTab="recepciones" />

      <ReportDownloadModal
        isOpen={Boolean(reportRecepcion)}
        title="Recepcion de materia prima"
        subtitle={reportRecepcion?.producto || ''}
        onClose={() => setReportRecepcion(null)}
        onConfirm={(options) => reportRecepcion && generarReporteRecepcion(reportRecepcion, options)}
      />
    </div>
  );
}
