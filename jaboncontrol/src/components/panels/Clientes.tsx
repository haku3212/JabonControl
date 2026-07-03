import { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import type { Cliente } from '../../types';
import { ClienteForm } from '../forms/ClienteForm';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { generarReporteCliente } from '../../services/pdfService';

interface ClientesProps {
  onNewClick?: () => void;
}

const money = (value: number) => `Bs ${Math.round(value || 0).toLocaleString('es-BO')}`;

// Clasifica la deuda segun cuanto saldo queda comparado contra la venta total.
function getDebtStatus(cliente: any) {
  // Sin saldo pendiente significa que el cliente esta al dia.
  if (cliente.saldo <= 0) return { label: 'Al dia', type: 'success' as const, detail: 'Sin deuda pendiente' };

  // Calculamos porcentaje pendiente; si no hay venta, tratamos como riesgo bajo.
  const ratio = cliente.ventaTotal > 0 ? cliente.saldo / cliente.ventaTotal : 0;

  // Menos de 25% pendiente es credito normal.
  if (ratio <= 0.25) return { label: 'Credito normal', type: 'info' as const, detail: `${Math.round(ratio * 100)}% pendiente` };

  // Entre 25% y 60% requiere seguimiento.
  if (ratio <= 0.6) return { label: 'Seguimiento', type: 'warning' as const, detail: `${Math.round(ratio * 100)}% pendiente` };

  // Mas de 60% pendiente se marca como deuda alta.
  return { label: 'Deuda alta', type: 'danger' as const, detail: `${Math.round(ratio * 100)}% pendiente` };
}

export function Clientes({ onNewClick }: ClientesProps = {}) {
  const { clientes, ventas, cobros, updateCliente } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [reportCliente, setReportCliente] = useState<any | null>(null);

  const enrichedClientes = useMemo(() => clientes.map((cliente) => {
    const ventasCliente = ventas.filter((venta) => venta.cliente === cliente.nombre);
    const cobrosCliente = cobros.filter((cobro) => cobro.cliente === cliente.nombre);
    const ventaTotal = ventasCliente.reduce((sum, venta) => sum + (venta.total || venta.precioTotal || 0), cliente.ventaMes || 0);
    const cobrado = cobrosCliente.reduce((sum, cobro) => sum + cobro.montoCobrado, cliente.cobradoMes || 0);
    const saldo = Math.max(0, ventaTotal - cobrado);
    return { ...cliente, ventaTotal, cobrado, saldo, ventasCliente, cobrosCliente };
  }), [clientes, ventas, cobros]);

  const filteredClientes = enrichedClientes.filter((c) => {
    const query = searchTerm.toLowerCase();
    return [c.nombre, c.telefono, c.email, c.ciudad, c.direccion].some((value) => String(value || '').toLowerCase().includes(query));
  });

  const totals = enrichedClientes.reduce((acc, cliente) => ({
    venta: acc.venta + cliente.ventaTotal,
    cobrado: acc.cobrado + cliente.cobrado,
    saldo: acc.saldo + cliente.saldo,
  }), { venta: 0, cobrado: 0, saldo: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Clientes</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">FICHA, CONTACTO Y ANALISIS COMERCIAL</p>
        </div>
        <button onClick={onNewClick} className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90 w-fit">
          + Nuevo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Summary label="Ventas registradas" value={money(totals.venta)} tone="text-accent-yellow" />
        <Summary label="Cobrado" value={money(totals.cobrado)} tone="text-status-success" />
        <Summary label="Saldo por cobrar" value={money(totals.saldo)} tone={totals.saldo > 0 ? 'text-status-danger' : 'text-status-success'} />
      </div>

      <Card title="Directorio de clientes" badge={{ label: `${filteredClientes.length} registros`, type: 'info' }}>
        <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Buscar por nombre, telefono, correo o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Cliente', 'Contacto', 'Ciudad', 'Ventas', 'Cobrado', 'Saldo', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => {
                const debtStatus = getDebtStatus(cliente);

                return (
                  <tr key={cliente.id} className="border-b border-dark-border hover:bg-dark-surface2 transition-colors">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-text-primary">{cliente.nombre}</div>
                      <div className="text-xs text-text-tertiary capitalize">{cliente.tipo}</div>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">
                      <div>{cliente.telefono || 'Sin telefono'}</div>
                      <div className="text-xs text-text-tertiary">{cliente.email || 'Sin correo'}</div>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">{cliente.ciudad || '-'}</td>
                    <td className="px-3 py-3 font-mono text-accent-yellow">{money(cliente.ventaTotal)}</td>
                    <td className="px-3 py-3 font-mono text-status-success">{money(cliente.cobrado)}</td>
                    <td className="px-3 py-3 font-mono text-text-primary">{money(cliente.saldo)}</td>
                    <td className="px-3 py-3">
                      <Badge label={debtStatus.label} type={debtStatus.type} />
                      <div className="text-[10px] text-text-tertiary mt-1">{debtStatus.detail}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => setSelected(cliente)} className="text-xs px-3 py-1.5 rounded border border-dark-border hover:border-accent-yellow hover:text-accent-yellow">
                        Ficha
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredClientes.length === 0 && <div className="py-8 text-center text-text-tertiary text-sm">No hay clientes con ese criterio.</div>}
        </div>
      </Card>

      <ClienteFicha
        cliente={selected as any}
        onClose={() => setSelected(null)}
        onEdit={(cliente) => setEditing(cliente)}
        onReport={(cliente) => setReportCliente(cliente)}
      />

      <Modal isOpen={Boolean(editing)} title="Editar cliente" onClose={() => setEditing(null)}>
        {editing && (
          <ClienteForm
            initialData={editing}
            onCancel={() => setEditing(null)}
            onSave={async (data) => {
              await updateCliente(editing.id, data);
              setSelected({ ...editing, ...data });
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <ReportDownloadModal
        isOpen={Boolean(reportCliente)}
        title="Ficha de cliente"
        subtitle={reportCliente?.nombre || ''}
        onClose={() => setReportCliente(null)}
        onConfirm={(options) => reportCliente && generarReporteCliente(reportCliente, reportCliente.ventasCliente, reportCliente.cobrosCliente, options)}
      />
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-5">
      <div className="text-xs font-mono text-text-tertiary uppercase">{label}</div>
      <div className={`text-3xl font-bebas mt-1 ${tone}`}>{value}</div>
    </div>
  );
}

function ClienteFicha({ cliente, onClose, onEdit, onReport }: { cliente: any | null; onClose: () => void; onEdit: (cliente: any) => void; onReport: (cliente: any) => void }) {
  if (!cliente) return null;
  const debtStatus = getDebtStatus(cliente);

  return (
    <Modal isOpen={Boolean(cliente)} title={`Ficha de ${cliente.nombre}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={() => onEdit(cliente)} className="px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-semibold rounded border border-dark-border hover:border-accent-yellow">
            Editar datos
          </button>
          <button onClick={() => onReport(cliente)} className="px-3 py-2 bg-accent-yellow text-black text-xs font-semibold rounded hover:bg-opacity-90">
            Descargar ficha PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Info label="Nombre / razon social" value={cliente.nombre} />
          <Info label="Tipo" value={cliente.tipo} />
          <Info label="Telefono" value={cliente.telefono || 'Sin registrar'} />
          <Info label="Gmail / correo" value={cliente.email || 'Sin registrar'} />
          <Info label="Ciudad" value={cliente.ciudad || 'Sin registrar'} />
          <Info label="Direccion" value={cliente.direccion || 'Sin registrar'} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Summary label="Venta total" value={money(cliente.ventaTotal)} tone="text-accent-yellow" />
          <Summary label="Cobrado" value={money(cliente.cobrado)} tone="text-status-success" />
          <Summary label="Saldo" value={money(cliente.saldo)} tone={cliente.saldo > 0 ? 'text-status-danger' : 'text-status-success'} />
        </div>

        <div className="rounded border border-dark-border bg-dark-surface2 px-4 py-3">
          <div className="text-xs font-mono text-text-tertiary uppercase">Estado de deuda</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge label={debtStatus.label} type={debtStatus.type} />
            <span className="text-sm text-text-secondary">{debtStatus.detail}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <MiniTable title="Historial de ventas" empty="Sin ventas registradas" rows={cliente.ventasCliente.slice().reverse().map((v: any) => [v.fecha, v.numeroNE, money(v.total || v.precioTotal || 0), v.tipoPago])} />
          <MiniTable title="Historial de cobros" empty="Sin cobros registrados" rows={cliente.cobrosCliente.slice().reverse().map((c: any) => [c.fecha, c.notasCorrespondientes || '-', money(c.montoCobrado), c.metodoPago])} />
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-dark-border bg-dark-surface2 px-4 py-3">
      <div className="text-xs font-mono text-text-tertiary uppercase">{label}</div>
      <div className="text-sm text-text-primary mt-1 break-words">{value}</div>
    </div>
  );
}

function MiniTable({ title, rows, empty }: { title: string; rows: string[][]; empty: string }) {
  return (
    <div className="rounded border border-dark-border overflow-hidden">
      <div className="px-4 py-3 bg-dark-surface2 text-xs font-mono text-text-tertiary uppercase">{title}</div>
      {rows.length === 0 ? (
        <div className="px-4 py-5 text-sm text-text-tertiary">{empty}</div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-dark-border">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-text-secondary">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
