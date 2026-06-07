import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import QRCode from 'qrcode';

interface CobroFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function CobroForm({ onSave, onCancel }: CobroFormProps) {
  const { ventas, clientes } = useAppContext();
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [monto, setMonto] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Generar datos del QR cuando cambian monto o cliente
  const datosQR = `BANCO|${monto}|${clienteSeleccionado}-${fecha}`;

  // Generar QR cuando selecciona opción QR
  useEffect(() => {
    if (qrRef.current && metodoPago === 'qr' && monto > 0) {
      qrRef.current.innerHTML = '';
      QRCode.toCanvas(qrRef.current, datosQR, {
        width: 250,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      }).catch((err: unknown) => console.error('Error QR:', err));
    }
  }, [datosQR, metodoPago, monto]);

  // Calcular deudas por cliente (FIFO)
  const deudasCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];

    const ventasCliente = ventas
      .filter((v) => v.cliente === clienteSeleccionado)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return ventasCliente.map((v) => ({
      id: v.id,
      numeroNE: v.numeroNE,
      fecha: v.fecha,
      original: v.total,
      resto: v.total,
    }));
  }, [clienteSeleccionado, ventas]);

  // Calcular distribución FIFO
  const distribucion = useMemo(() => {
    if (monto <= 0 || deudasCliente.length === 0) return [];

    let restante = monto;
    const dist = deudasCliente.map((deuda) => {
      const deudaResto = deuda.resto || 0;
      const aplicar = Math.min(restante, deudaResto);
      restante = Math.round((restante - aplicar) * 100) / 100;
      return {
        ...deuda,
        aplicado: aplicar,
        saldada: aplicar >= deudaResto,
      };
    });

    return dist;
  }, [monto, deudasCliente]);

  const totalAplicado = distribucion.reduce((s, d) => s + d.aplicado, 0);
  const excedente = Math.round((monto - totalAplicado) * 100) / 100;

  const handleSubmit = async () => {
    if (!clienteSeleccionado || monto <= 0) {
      alert('Por favor seleccione cliente e ingrese monto');
      return;
    }

    setLoading(true);
    try {
      const deudas = distribucion
        .filter((d) => d.aplicado > 0)
        .map((d) => d.numeroNE)
        .join(', ');

      await onSave({
        id: Date.now().toString(),
        fecha,
        cliente: clienteSeleccionado,
        montoCobrado: monto,
        metodoPago,
        notasCorrespondientes: deudas,
        distribucion: distribucion.filter((d) => d.aplicado > 0),
      });
    } catch (error) {
      alert('Error al guardar el cobro');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector de cliente */}
      <div>
        <label className="text-xs font-mono text-text-tertiary uppercase block mb-2">
          Seleccionar Cliente
        </label>
        <select
          value={clienteSeleccionado}
          onChange={(e) => setClienteSeleccionado(e.target.value)}
          className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
        >
          <option value="">— Elegir cliente —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Deudas pendientes */}
      {clienteSeleccionado && deudasCliente.length > 0 && (
        <div className="bg-dark-surface2 p-4 rounded">
          <div className="text-xs font-mono text-text-tertiary uppercase mb-3">
            Deudas Pendientes (FIFO)
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {deudasCliente.map((deuda, idx) => (
              <div
                key={deuda.id}
                className="flex items-center justify-between p-2 bg-dark-surface border border-dark-border rounded text-xs"
              >
                <div>
                  <div className="font-mono font-semibold text-text-primary">
                    {idx + 1}. {deuda.numeroNE}
                  </div>
                  <div className="text-text-tertiary text-10px">
                    {deuda.fecha} · Bs {(deuda.original || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de pago */}
      {clienteSeleccionado && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
              Monto a Pagar (Bs) *
            </label>
            <input
              type="number"
              step="0.01"
              value={monto || ''}
              onChange={(e) => setMonto(Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-accent-yellow text-sm font-semibold focus:border-accent-yellow outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
              Método de Pago
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="qr">📱 QR Banco</option>
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
              Fecha del Cobro
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>
        </div>
      )}

      {/* QR INTEGRADO - Cuando selecciona "QR Banco" */}
      {metodoPago === 'qr' && monto > 0 && (
        <div className="bg-dark-surface2 p-6 rounded border-2 border-accent-yellow border-opacity-50">
          <div className="text-xs font-mono text-text-tertiary uppercase mb-3 text-center">
            📱 Código QR Banco - Escanear para Pagar
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div ref={qrRef} className="flex justify-center"></div>
            </div>
            <div className="text-center w-full">
              <div className="text-sm text-text-secondary mb-2">
                Cliente: <strong>{clienteSeleccionado}</strong>
              </div>
              <div className="text-3xl font-bebas text-accent-yellow mb-2">
                Bs {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-text-tertiary font-mono">
                Fecha: {fecha}
              </div>
            </div>
            <button
              onClick={() => {
                if (qrRef.current?.querySelector('canvas')) {
                  const canvas = qrRef.current.querySelector('canvas') as HTMLCanvasElement;
                  const link = document.createElement('a');
                  link.href = canvas.toDataURL('image/png');
                  link.download = `QR_${clienteSeleccionado}_${fecha}.png`;
                  link.click();
                }
              }}
              className="w-full px-3 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
            >
              ⬇️ Descargar QR
            </button>
          </div>
        </div>
      )}

      {/* Preview distribución FIFO */}
      {distribucion.length > 0 && monto > 0 && (
        <div className="bg-dark-surface2 p-4 rounded">
          <div className="text-xs font-mono text-text-tertiary uppercase mb-3">
            Distribución Automática FIFO
          </div>
          <div className="space-y-2 text-xs">
            {distribucion.map((d) =>
              d.aplicado > 0 ? (
                <div
                  key={d.id}
                  className="flex justify-between items-center p-2 bg-dark-surface rounded border border-accent-yellow border-opacity-30"
                >
                  <span className="text-text-secondary">
                    {d.numeroNE} ({d.fecha})
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      d.saldada ? 'text-status-success' : 'text-accent-yellow'
                    }`}
                  >
                    − Bs {d.aplicado.toLocaleString()} {d.saldada ? '✓' : '(abono)'}
                  </span>
                </div>
              ) : null
            )}
            {excedente > 0 && (
              <div className="flex justify-between items-center p-2 bg-dark-surface rounded border border-accent-blue border-opacity-30">
                <span className="text-text-secondary">Vuelto/Excedente</span>
                <span className="font-mono font-semibold text-accent-blue">
                  Bs {excedente.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center p-2 border-t border-dark-border mt-2 pt-2">
              <span className="font-semibold text-text-primary">Total Aplicado</span>
              <span className="font-mono font-semibold text-status-success">
                Bs {totalAplicado.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4 border-t border-dark-border">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-dark-surface3 text-text-primary text-sm font-medium rounded border border-dark-border hover:border-accent-yellow disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!clienteSeleccionado || monto <= 0 || loading}
          className="px-4 py-2 bg-accent-yellow text-black text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Guardando...' : '✓ Confirmar Cobro'}
        </button>
      </div>
    </div>
  );
}
