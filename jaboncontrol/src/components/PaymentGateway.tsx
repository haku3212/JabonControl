import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { BANCOS_BOLIVIA, generarDatosQRTransferencia } from '../services/paymentService';

interface PaymentGatewayProps {
  monto: number;
  referencia: string;
  cliente: string;
  onPagado?: () => void;
}

export function PaymentGateway({
  monto,
  referencia,
  cliente,
  onPagado,
}: PaymentGatewayProps) {
  const [metodo, setMetodo] = useState<'qr' | 'transferencia' | 'efectivo'>('qr');
  const [bancoSeleccionado, setBancoSeleccionado] = useState('Banco Mercantil');
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const cuenta = BANCOS_BOLIVIA[bancoSeleccionado];
  const datosQR = generarDatosQRTransferencia({
    monto,
    cliente,
    referencia,
    fecha: new Date().toISOString().split('T')[0],
    banco: bancoSeleccionado,
  });

  // Generar QR cuando cambia el banco
  useEffect(() => {
    if (qrRef.current && metodo === 'qr') {
      qrRef.current.innerHTML = ''; // Limpiar
      QRCode.toCanvas(qrRef.current, datosQR, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).catch((err: unknown) => console.error('Error generando QR:', err));
    }
  }, [datosQR, metodo]);

  const descargarQR = async () => {
    if (qrRef.current?.querySelector('canvas')) {
      const canvas = qrRef.current.querySelector('canvas') as HTMLCanvasElement;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `QR_${referencia}.png`;
      link.click();
    }
  };

  const copiarCuenta = () => {
    navigator.clipboard.writeText(cuenta.cuenta);
    alert('✅ Número de cuenta copiado al portapapeles');
  };

  return (
    <div className="space-y-4">
      {/* Selector de método de pago */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setMetodo('qr')}
          className={`p-3 rounded text-xs font-medium transition-all ${
            metodo === 'qr'
              ? 'bg-accent-yellow text-black border-2 border-accent-yellow'
              : 'bg-dark-surface2 text-text-secondary border-2 border-dark-border hover:border-accent-yellow'
          }`}
        >
          📱 QR Dinámico
        </button>
        <button
          onClick={() => setMetodo('transferencia')}
          className={`p-3 rounded text-xs font-medium transition-all ${
            metodo === 'transferencia'
              ? 'bg-accent-yellow text-black border-2 border-accent-yellow'
              : 'bg-dark-surface2 text-text-secondary border-2 border-dark-border hover:border-accent-yellow'
          }`}
        >
          🏦 Transferencia
        </button>
        <button
          onClick={() => setMetodo('efectivo')}
          className={`p-3 rounded text-xs font-medium transition-all ${
            metodo === 'efectivo'
              ? 'bg-accent-yellow text-black border-2 border-accent-yellow'
              : 'bg-dark-surface2 text-text-secondary border-2 border-dark-border hover:border-accent-yellow'
          }`}
        >
          💵 Efectivo
        </button>
      </div>

      {/* Contenido según método */}
      {metodo === 'qr' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-2">
              Seleccionar Banco
            </label>
            <select
              value={bancoSeleccionado}
              onChange={(e) => setBancoSeleccionado(e.target.value)}
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            >
              {Object.keys(BANCOS_BOLIVIA).map((banco) => (
                <option key={banco} value={banco}>
                  {banco}
                </option>
              ))}
            </select>
          </div>

          {/* QR Display */}
          <div className="bg-dark-surface2 p-6 rounded flex flex-col items-center">
            <div className="bg-white p-4 rounded mb-4">
              <div ref={qrRef}></div>
            </div>
            <div className="text-center text-xs text-text-secondary mb-4">
              <div className="text-2xl font-bebas text-accent-yellow mb-1">
                Bs {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </div>
              <div className="font-mono text-text-tertiary">Ref: {referencia}</div>
            </div>

            <button
              onClick={descargarQR}
              className="w-full mb-3 px-3 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
            >
              ⬇️ Descargar QR
            </button>

            <button
              onClick={() => {
                setTimeout(() => window.print(), 100);
              }}
              className="w-full px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border hover:border-accent-yellow"
            >
              🖨️ Imprimir QR
            </button>
          </div>

          <div className="text-xs text-text-tertiary bg-dark-surface2 p-3 rounded">
            <div className="font-semibold mb-2">💡 Instrucciones:</div>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Cliente escanea el código QR</li>
              <li>Se abre su app bancaria automáticamente</li>
              <li>Confirma la transferencia</li>
              <li>¡Pago completado al instante! ✅</li>
            </ol>
          </div>
        </div>
      )}

      {metodo === 'transferencia' && (
        <div className="space-y-4">
          {/* Datos de cuenta */}
          <div className="bg-dark-surface2 p-4 rounded space-y-3">
            <div>
              <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
                Banco
              </label>
              <div className="text-text-primary font-semibold">{cuenta.banco}</div>
            </div>

            <div>
              <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
                Titular
              </label>
              <div className="text-text-primary">{cuenta.titular}</div>
            </div>

            <div>
              <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
                Número de Cuenta
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-dark-surface border border-dark-border rounded px-3 py-2 font-mono text-accent-yellow font-semibold">
                  {cuenta.cuenta}
                </div>
                <button
                  onClick={copiarCuenta}
                  className="px-3 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
                  title="Copiar"
                >
                  📋
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
                Cédula de Identidad
              </label>
              <div className="font-mono text-text-primary">{cuenta.ci}</div>
            </div>

            <div className="pt-3 border-t border-dark-border">
              <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
                Monto a Transferir
              </label>
              <div className="text-3xl font-bebas text-status-success">
                Bs {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
                Concepto / Referencia
              </label>
              <div className="font-mono text-accent-yellow font-semibold">{referencia}</div>
            </div>
          </div>

          {cuenta.telefono && (
            <div className="bg-accent-yellow bg-opacity-10 border border-accent-yellow border-opacity-30 p-3 rounded text-xs text-text-primary">
              <strong>📞 Contacto:</strong> {cuenta.telefono}
              <br />
              Confirme el pago una vez realizada la transferencia
            </div>
          )}

          <button
            onClick={() => setMostrarInstrucciones(!mostrarInstrucciones)}
            className="w-full px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border hover:border-accent-yellow"
          >
            {mostrarInstrucciones ? '▼ Ocultar' : '▶ Ver'} Instrucciones Paso a Paso
          </button>

          {mostrarInstrucciones && (
            <div className="bg-dark-surface2 p-4 rounded space-y-2 text-xs text-text-secondary">
              <div className="font-semibold text-text-primary mb-2">📝 Pasos para transferir:</div>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Abre tu app bancaria</li>
                <li>Selecciona "Nueva Transferencia"</li>
                <li>Ingresa el número de cuenta arriba</li>
                <li>Coloca el monto: <strong>Bs {monto.toLocaleString()}</strong></li>
                <li>En concepto escribe: <strong>{referencia}</strong></li>
                <li>Confirma y completa el proceso</li>
                <li>Contáctanos para confirmar el pago</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {metodo === 'efectivo' && (
        <div className="bg-accent-orange bg-opacity-10 border border-accent-orange border-opacity-30 p-4 rounded space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💵</span>
            <div>
              <div className="font-semibold text-text-primary mb-1">Pago en Efectivo</div>
              <div className="text-xs text-text-secondary">
                Entrega el monto exacto a nuestro representante.
                <br />
                <strong>Monto: Bs {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={onPagado}
            className="w-full px-4 py-2 bg-accent-yellow text-black text-sm font-semibold rounded hover:bg-opacity-90"
          >
            ✅ Confirmar Pago en Efectivo
          </button>
        </div>
      )}

      {/* Botón de confirmación general */}
      {metodo !== 'efectivo' && (
        <div className="pt-4 border-t border-dark-border">
          <button
            onClick={onPagado}
            className="w-full px-4 py-3 bg-status-success text-black text-sm font-semibold rounded hover:opacity-90"
          >
            ✅ Confirmar Pago Realizado
          </button>
          <div className="text-xs text-text-tertiary mt-2 text-center">
            Después de enviar el pago, presiona este botón para confirmar
          </div>
        </div>
      )}
    </div>
  );
}
