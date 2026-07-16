import { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import type { Cliente } from '../../types';
import { ClienteForm } from '../forms/ClienteForm';
import { ReportDownloadModal } from '../common/ReportDownloadModal';
import { generarCotizacionPDF, generarReporteCliente } from '../../services/pdfService';
import type { Cotizacion, SeguimientoComercial } from '../../types';

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
  const {
    clientes,
    ventas,
    cobros,
    cotizaciones,
    seguimientos,
    updateCliente,
    addCotizacion,
    updateCotizacion,
    deleteCotizacion,
    addSeguimiento,
    updateSeguimiento,
    deleteSeguimiento,
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [reportCliente, setReportCliente] = useState<any | null>(null);

  const enrichedClientes = useMemo(() => clientes.map((cliente) => {
    const ventasCliente = ventas.filter((venta) => venta.cliente === cliente.nombre);
    const cobrosCliente = cobros.filter((cobro) => cobro.cliente === cliente.nombre);
    const cotizacionesCliente = cotizaciones.filter((cotizacion) => cotizacion.cliente === cliente.nombre);
    const seguimientosCliente = seguimientos.filter((seguimiento) => seguimiento.cliente === cliente.nombre);
    const ventaTotal = ventasCliente.reduce((sum, venta) => sum + (venta.total || venta.precioTotal || 0), cliente.ventaMes || 0);
    const cobrado = cobrosCliente.reduce((sum, cobro) => sum + cobro.montoCobrado, cliente.cobradoMes || 0);
    const saldo = Math.max(0, ventaTotal - cobrado);
    const ultimaVenta = ventasCliente.slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
    return { ...cliente, ventaTotal, cobrado, saldo, ventasCliente, cobrosCliente, cotizacionesCliente, seguimientosCliente, ultimaVenta };
  }), [clientes, ventas, cobros, cotizaciones, seguimientos]);

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
        onAddCotizacion={addCotizacion}
        onUpdateCotizacion={updateCotizacion}
        onDeleteCotizacion={deleteCotizacion}
        onAddSeguimiento={addSeguimiento}
        onUpdateSeguimiento={updateSeguimiento}
        onDeleteSeguimiento={deleteSeguimiento}
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

function ClienteFicha({
  cliente,
  onClose,
  onEdit,
  onReport,
  onAddCotizacion,
  onUpdateCotizacion,
  onDeleteCotizacion,
  onAddSeguimiento,
  onUpdateSeguimiento,
  onDeleteSeguimiento,
}: {
  cliente: any | null;
  onClose: () => void;
  onEdit: (cliente: any) => void;
  onReport: (cliente: any) => void;
  onAddCotizacion: (data: Cotizacion) => void;
  onUpdateCotizacion: (id: string, data: Cotizacion) => void;
  onDeleteCotizacion: (id: string) => void;
  onAddSeguimiento: (data: SeguimientoComercial) => void;
  onUpdateSeguimiento: (id: string, data: SeguimientoComercial) => void;
  onDeleteSeguimiento: (id: string) => void;
}) {
  const [quoteForm, setQuoteForm] = useState<Cotizacion | null>(null);
  const [taskForm, setTaskForm] = useState<SeguimientoComercial | null>(null);

  if (!cliente) return null;
  const debtStatus = getDebtStatus(cliente);
  const pendingTasks = cliente.seguimientosCliente.filter((item: SeguimientoComercial) => item.estado !== 'completado').length;
  const acceptedQuotes = cliente.cotizacionesCliente.filter((item: Cotizacion) => item.estado === 'aceptada').length;

  return (
    <Modal isOpen={Boolean(cliente)} title={`Ficha de ${cliente.nombre}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={() => setTaskForm(emptySeguimiento(cliente.nombre))} className="px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-semibold rounded border border-dark-border hover:border-accent-blue">
            Nuevo seguimiento
          </button>
          <button onClick={() => setQuoteForm(emptyCotizacion(cliente.nombre))} className="px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-semibold rounded border border-dark-border hover:border-accent-yellow">
            Nueva cotizacion
          </button>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Info label="Ultima compra" value={cliente.ultimaVenta?.fecha || 'Sin compras'} />
          <Info label="Cotizaciones" value={`${cliente.cotizacionesCliente.length} registradas`} />
          <Info label="Cotizaciones aceptadas" value={String(acceptedQuotes)} />
          <Info label="Seguimientos pendientes" value={String(pendingTasks)} />
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

        <CrmList
          title="Cotizaciones"
          empty="Sin cotizaciones registradas"
          rows={cliente.cotizacionesCliente}
          render={(cotizacion: Cotizacion) => (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="font-semibold text-text-primary">{cotizacion.numero} - {money(cotizacion.total)}</div>
                <div className="text-xs text-text-tertiary">{cotizacion.fecha} · Validez {cotizacion.validezDias} dias · {cotizacion.responsable || 'Sin responsable'}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge label={cotizacion.estado} type={cotizacion.estado === 'aceptada' ? 'success' : cotizacion.estado === 'rechazada' ? 'danger' : 'info'} />
                <button onClick={() => generarCotizacionPDF(cotizacion)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow">PDF</button>
                <button onClick={() => setQuoteForm(cotizacion)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-blue">Editar</button>
                <button onClick={() => onDeleteCotizacion(cotizacion.id)} className="text-xs px-2 py-1 rounded border border-dark-border text-status-danger hover:border-status-danger">Eliminar</button>
              </div>
            </div>
          )}
        />

        <CrmList
          title="Seguimiento comercial"
          empty="Sin tareas o notas de seguimiento"
          rows={cliente.seguimientosCliente}
          render={(seguimiento: SeguimientoComercial) => (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="font-semibold text-text-primary">{seguimiento.asunto}</div>
                <div className="text-xs text-text-tertiary">{seguimiento.fecha} · {seguimiento.tipo} · {seguimiento.responsable || 'Sin responsable'}</div>
                {seguimiento.notas && <div className="text-xs text-text-secondary mt-1">{seguimiento.notas}</div>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge label={seguimiento.prioridad} type={seguimiento.prioridad === 'alta' ? 'danger' : seguimiento.prioridad === 'media' ? 'warning' : 'neutral'} />
                <Badge label={seguimiento.estado} type={seguimiento.estado === 'completado' ? 'success' : 'info'} />
                <button onClick={() => setTaskForm(seguimiento)} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-blue">Editar</button>
                <button onClick={() => onDeleteSeguimiento(seguimiento.id)} className="text-xs px-2 py-1 rounded border border-dark-border text-status-danger hover:border-status-danger">Eliminar</button>
              </div>
            </div>
          )}
        />
      </div>

      <Modal isOpen={Boolean(quoteForm)} title={quoteForm?.id ? 'Editar cotizacion' : 'Nueva cotizacion'} onClose={() => setQuoteForm(null)}>
        {quoteForm && (
          <CotizacionForm
            initialData={quoteForm}
            onCancel={() => setQuoteForm(null)}
            onSave={(data) => {
              if (quoteForm.id) onUpdateCotizacion(quoteForm.id, data);
              else onAddCotizacion(data);
              setQuoteForm(null);
            }}
          />
        )}
      </Modal>

      <Modal isOpen={Boolean(taskForm)} title={taskForm?.id ? 'Editar seguimiento' : 'Nuevo seguimiento'} onClose={() => setTaskForm(null)}>
        {taskForm && (
          <SeguimientoForm
            initialData={taskForm}
            onCancel={() => setTaskForm(null)}
            onSave={(data) => {
              if (taskForm.id) onUpdateSeguimiento(taskForm.id, data);
              else onAddSeguimiento(data);
              setTaskForm(null);
            }}
          />
        )}
      </Modal>
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

function emptyCotizacion(cliente: string): Cotizacion {
  const stamp = Date.now();
  return {
    id: '',
    numero: `COT-${String(stamp).slice(-6)}`,
    fecha: new Date().toISOString().slice(0, 10),
    cliente,
    estado: 'borrador',
    validezDias: 15,
    responsable: 'Ventas',
    notas: '',
    items: [{ id: `item-${stamp}`, descripcion: 'Jabon en caja x50 pastas', cantidad: 1, precioUnitario: 0 }],
    total: 0,
  };
}

function emptySeguimiento(cliente: string): SeguimientoComercial {
  return {
    id: '',
    cliente,
    tipo: 'llamada',
    asunto: '',
    fecha: new Date().toISOString().slice(0, 10),
    responsable: 'Ventas',
    estado: 'pendiente',
    prioridad: 'media',
    notas: '',
  };
}

function CrmList<T>({ title, rows, empty, render }: { title: string; rows: T[]; empty: string; render: (row: T) => JSX.Element }) {
  return (
    <div className="rounded border border-dark-border overflow-hidden">
      <div className="px-4 py-3 bg-dark-surface2 text-xs font-mono text-text-tertiary uppercase">{title}</div>
      {rows.length === 0 ? (
        <div className="px-4 py-5 text-sm text-text-tertiary">{empty}</div>
      ) : (
        <div className="divide-y divide-dark-border">
          {rows.map((row: any) => (
            <div key={row.id} className="p-3">
              {render(row)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CotizacionForm({ initialData, onSave, onCancel }: { initialData: Cotizacion; onSave: (data: Cotizacion) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Cotizacion>(initialData);

  const updateItem = (id: string, patch: Partial<Cotizacion['items'][number]>) => {
    setForm((current) => {
      const items = current.items.map((item) => (item.id === id ? { ...item, ...patch } : item));
      return { ...current, items, total: calcQuoteTotal(items) };
    });
  };

  const addItem = () => {
    const item = { id: `item-${Date.now()}`, descripcion: '', cantidad: 1, precioUnitario: 0 };
    setForm((current) => ({ ...current, items: [...current.items, item] }));
  };

  const removeItem = (id: string) => {
    setForm((current) => {
      const items = current.items.filter((item) => item.id !== id);
      return { ...current, items, total: calcQuoteTotal(items) };
    });
  };

  const submit = () => {
    if (!form.numero.trim() || form.items.length === 0) {
      alert('La cotizacion necesita numero y al menos un item.');
      return;
    }
    onSave({
      ...form,
      id: form.id || Date.now().toString(),
      total: calcQuoteTotal(form.items),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormInput label="Numero" value={form.numero} onChange={(value) => setForm({ ...form, numero: value })} />
        <FormInput label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} />
        <FormInput label="Validez dias" type="number" value={String(form.validezDias)} onChange={(value) => setForm({ ...form, validezDias: Number(value || 0) })} />
        <FormInput label="Responsable" value={form.responsable} onChange={(value) => setForm({ ...form, responsable: value })} />
        <label>
          <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Estado</span>
          <select value={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.value as Cotizacion['estado'] })} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm outline-none">
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="aceptada">Aceptada</option>
            <option value="rechazada">Rechazada</option>
            <option value="vencida">Vencida</option>
          </select>
        </label>
      </div>

      <div className="rounded border border-dark-border overflow-hidden">
        <div className="px-3 py-2 bg-dark-surface2 flex items-center justify-between">
          <span className="text-xs font-mono text-text-tertiary uppercase">Items</span>
          <button onClick={addItem} className="text-xs px-2 py-1 rounded border border-dark-border hover:border-accent-yellow">Agregar item</button>
        </div>
        <div className="space-y-2 p-3">
          {form.items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_90px_120px_70px] gap-2">
              <input value={item.descripcion} onChange={(event) => updateItem(item.id, { descripcion: event.target.value })} placeholder="Descripcion" className="bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm outline-none" />
              <input value={item.cantidad} type="number" onChange={(event) => updateItem(item.id, { cantidad: Number(event.target.value || 0) })} className="bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm outline-none" />
              <input value={item.precioUnitario} type="number" onChange={(event) => updateItem(item.id, { precioUnitario: Number(event.target.value || 0) })} className="bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm outline-none" />
              <button onClick={() => removeItem(item.id)} className="text-xs rounded border border-dark-border text-status-danger hover:border-status-danger">Quitar</button>
            </div>
          ))}
        </div>
      </div>

      <label>
        <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Notas</span>
        <textarea value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} rows={3} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm outline-none resize-none" />
      </label>

      <div className="flex items-center justify-between pt-4 border-t border-dark-border">
        <div className="font-mono text-accent-yellow">Total: {money(calcQuoteTotal(form.items))}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded border border-dark-border text-sm">Cancelar</button>
          <button onClick={submit} className="px-4 py-2 rounded bg-accent-yellow text-black text-sm font-semibold">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function SeguimientoForm({ initialData, onSave, onCancel }: { initialData: SeguimientoComercial; onSave: (data: SeguimientoComercial) => void; onCancel: () => void }) {
  const [form, setForm] = useState<SeguimientoComercial>(initialData);

  const submit = () => {
    if (!form.asunto.trim()) {
      alert('Ingrese un asunto para el seguimiento.');
      return;
    }
    onSave({ ...form, id: form.id || Date.now().toString() });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormInput label="Asunto" value={form.asunto} onChange={(value) => setForm({ ...form, asunto: value })} />
        <FormInput label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} />
        <FormInput label="Responsable" value={form.responsable} onChange={(value) => setForm({ ...form, responsable: value })} />
        <SelectField label="Tipo" value={form.tipo} onChange={(value) => setForm({ ...form, tipo: value as SeguimientoComercial['tipo'] })} options={['llamada', 'cobro', 'visita', 'cotizacion', 'nota']} />
        <SelectField label="Estado" value={form.estado} onChange={(value) => setForm({ ...form, estado: value as SeguimientoComercial['estado'] })} options={['pendiente', 'en_proceso', 'completado']} />
        <SelectField label="Prioridad" value={form.prioridad} onChange={(value) => setForm({ ...form, prioridad: value as SeguimientoComercial['prioridad'] })} options={['baja', 'media', 'alta']} />
      </div>
      <label>
        <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">Notas</span>
        <textarea value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} rows={4} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm outline-none resize-none" />
      </label>
      <div className="flex justify-end gap-2 pt-4 border-t border-dark-border">
        <button onClick={onCancel} className="px-4 py-2 rounded border border-dark-border text-sm">Cancelar</button>
        <button onClick={submit} className="px-4 py-2 rounded bg-accent-yellow text-black text-sm font-semibold">Guardar</button>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label>
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm outline-none" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label>
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm outline-none">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function calcQuoteTotal(items: Cotizacion['items']) {
  return items.reduce((sum, item) => sum + Number(item.cantidad || 0) * Number(item.precioUnitario || 0), 0);
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
