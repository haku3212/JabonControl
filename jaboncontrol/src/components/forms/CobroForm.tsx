import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ventaSaldoPendiente, ventaTotal } from '../../utils/financial';

interface CobroFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function CobroForm({ onSave, onCancel }: CobroFormProps) {
  // ventas contiene las notas de entrega; clientes contiene el directorio general.
  const { ventas, clientes } = useAppContext();

  // Guarda el cliente seleccionado para calcular sus deudas pendientes.
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');

  // Guarda el monto que se aplicara contra las deudas del cliente.
  const [monto, setMonto] = useState(0);

  // Guarda el metodo usado para el pago.
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // Guarda la fecha administrativa del cobro.
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // Evita que el usuario envie el formulario dos veces mientras guarda.
  const [loading, setLoading] = useState(false);

  // Calcula el saldo real de una venta; si no existe saldoPendiente, usa el total solo cuando es credito.
  const getSaldoVenta = ventaSaldoPendiente;

  // Lista solo clientes con deuda pendiente; esto evita cobrar a clientes que ya estan al dia.
  const clientesConDeuda = useMemo(() => {
    // Recolectamos nombres de clientes que tienen al menos una venta con saldo positivo.
    const nombresConDeuda = new Set(
      ventas
        .filter((venta) => getSaldoVenta(venta) > 0)
        .map((venta) => venta.cliente)
    );

    // Mostramos clientes registrados que coinciden con esos nombres.
    return clientes.filter((cliente) => nombresConDeuda.has(cliente.nombre));
  }, [clientes, ventas]);

  // Calcula las deudas de un cliente en orden FIFO: primero las mas antiguas.
  const deudasCliente = useMemo(() => {
    // Sin cliente seleccionado no hay nada que distribuir.
    if (!clienteSeleccionado) return [];

    // Filtramos ventas del cliente que todavia tengan saldo.
    const ventasCliente = ventas
      .filter((venta) => venta.cliente === clienteSeleccionado && getSaldoVenta(venta) > 0)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Normalizamos cada deuda con los campos necesarios para mostrar y aplicar pagos.
    return ventasCliente.map((venta) => ({
      id: venta.id,
      numeroNE: venta.numeroNE,
      fecha: venta.fecha,
      original: ventaTotal(venta),
      resto: getSaldoVenta(venta),
    }));
  }, [clienteSeleccionado, ventas]);

  // Distribuye el monto ingresado contra las deudas FIFO.
  const distribucion = useMemo(() => {
    // No se distribuye nada si el monto no es valido o el cliente no debe.
    if (monto <= 0 || deudasCliente.length === 0) return [];

    // restante va disminuyendo conforme se aplica a cada deuda.
    let restante = monto;

    // Aplicamos primero las deudas mas antiguas.
    return deudasCliente.map((deuda) => {
      // Calculamos cuanto se puede aplicar a esta deuda.
      const aplicado = Math.min(restante, deuda.resto || 0);

      // Redondeamos para evitar decimales flotantes raros.
      restante = Math.round((restante - aplicado) * 100) / 100;

      // Devolvemos la linea de aplicacion.
      return {
        ...deuda,
        aplicado,
        saldada: aplicado >= (deuda.resto || 0),
      };
    });
  }, [monto, deudasCliente]);

  // Total que realmente se aplica a deudas.
  const totalAplicado = distribucion.reduce((sum, item) => sum + item.aplicado, 0);

  // Excedente si el usuario cobra mas de lo adeudado.
  const excedente = Math.round((monto - totalAplicado) * 100) / 100;

  // Envia el cobro al contexto/app.
  const handleSubmit = async () => {
    // Validamos que el usuario haya elegido un cliente deudor y un monto positivo.
    if (!clienteSeleccionado || monto <= 0) {
      alert('Seleccione un cliente con deuda e ingrese un monto valido.');
      return;
    }

    // No permitimos registrar cobros sin deudas.
    if (deudasCliente.length === 0) {
      alert('Este cliente no tiene deuda pendiente.');
      return;
    }

    // Activamos loading para bloquear doble click.
    setLoading(true);

    try {
      // Armamos la lista de notas de entrega afectadas.
      const notas = distribucion
        .filter((item) => item.aplicado > 0)
        .map((item) => item.numeroNE)
        .join(', ');

      // Guardamos el cobro con su distribucion FIFO.
      await onSave({
        id: Date.now().toString(),
        fecha,
        cliente: clienteSeleccionado,
        montoCobrado: monto,
        metodoPago,
        notasCorrespondientes: notas,
        distribucion: distribucion.filter((item) => item.aplicado > 0),
      });
    } catch (error) {
      // Mostramos error amigable y dejamos detalle en consola.
      alert('Error al guardar el cobro');
      console.error(error);
    } finally {
      // Siempre liberamos el formulario.
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-mono text-text-tertiary uppercase block mb-2">
          Clientes con deuda pendiente
        </label>
        <select
          value={clienteSeleccionado}
          onChange={(event) => setClienteSeleccionado(event.target.value)}
          className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
        >
          <option value="">Elegir cliente deudor</option>
          {clientesConDeuda.map((cliente) => (
            <option key={cliente.id} value={cliente.nombre}>
              {cliente.nombre}
            </option>
          ))}
        </select>

        {clientesConDeuda.length === 0 && (
          <div className="mt-2 rounded border border-dark-border bg-dark-surface2 px-3 py-2 text-xs text-text-tertiary">
            No hay clientes con deuda pendiente para registrar cobros.
          </div>
        )}
      </div>

      {clienteSeleccionado && deudasCliente.length > 0 && (
        <div className="bg-dark-surface2 p-4 rounded">
          <div className="text-xs font-mono text-text-tertiary uppercase mb-3">
            Deudas pendientes FIFO
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {deudasCliente.map((deuda, index) => (
              <div key={deuda.id} className="flex items-center justify-between p-2 bg-dark-surface border border-dark-border rounded text-xs">
                <div>
                  <div className="font-mono font-semibold text-text-primary">
                    {index + 1}. {deuda.numeroNE}
                  </div>
                  <div className="text-text-tertiary">
                    {deuda.fecha} - Debe: <span className="text-accent-yellow">Bs {(deuda.resto || 0).toLocaleString()}</span>
                    {deuda.resto < deuda.original && (
                      <span> de Bs {(deuda.original || 0).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {clienteSeleccionado && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Field label="Monto a pagar (Bs) *">
            <input
              type="number"
              step="0.01"
              value={monto || ''}
              onChange={(event) => setMonto(Number(event.target.value))}
              placeholder="0.00"
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-accent-yellow text-sm font-semibold focus:border-accent-yellow outline-none"
            />
          </Field>

          <Field label="Metodo de pago">
            <select
              value={metodoPago}
              onChange={(event) => setMetodoPago(event.target.value)}
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Fecha del cobro">
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
              />
            </Field>
          </div>
        </div>
      )}

      {distribucion.length > 0 && monto > 0 && (
        <div className="bg-dark-surface2 p-4 rounded">
          <div className="text-xs font-mono text-text-tertiary uppercase mb-3">
            Distribucion automatica FIFO
          </div>
          <div className="space-y-2 text-xs">
            {distribucion.map((item) => (
              item.aplicado > 0 ? (
                <div key={item.id} className="flex justify-between items-center p-2 bg-dark-surface rounded border border-accent-yellow border-opacity-30">
                  <span className="text-text-secondary">{item.numeroNE} ({item.fecha})</span>
                  <span className={`font-mono font-semibold ${item.saldada ? 'text-status-success' : 'text-accent-yellow'}`}>
                    - Bs {item.aplicado.toLocaleString()} {item.saldada ? 'saldada' : 'abono'}
                  </span>
                </div>
              ) : null
            ))}

            {excedente > 0 && (
              <div className="flex justify-between items-center p-2 bg-dark-surface rounded border border-accent-blue border-opacity-30">
                <span className="text-text-secondary">Vuelto / excedente</span>
                <span className="font-mono font-semibold text-accent-blue">Bs {excedente.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center p-2 border-t border-dark-border mt-2 pt-2">
              <span className="font-semibold text-text-primary">Total aplicado</span>
              <span className="font-mono font-semibold text-status-success">Bs {totalAplicado.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-dark-border">
        <button onClick={onCancel} disabled={loading} className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow disabled:opacity-50">
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!clienteSeleccionado || monto <= 0 || deudasCliente.length === 0 || loading}
          className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Confirmar cobro'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-text-tertiary uppercase block mb-1">{label}</span>
      {children}
    </label>
  );
}
