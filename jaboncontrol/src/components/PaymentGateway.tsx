import { useState } from 'react';
import { BANCOS_BOLIVIA } from '../services/paymentService';

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
  const [metodo, setMetodo] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [bancoSeleccionado, setBancoSeleccionado] = useState('Banco Mercantil');
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);

  const cuenta = BANCOS_BOLIVIA[bancoSeleccionado];

  const copiarCuenta = () => {
    navigator.clipboard.writeText(cuenta.cuenta);
    alert('Numero de cuenta copiado al portapapeles');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMetodo('transferencia')}
          className={`p-3 rounded text-xs font-medium transition-all ${
            metodo === 'transferencia'
              ? 'bg-accent-yellow text-black border-2 border-accent-yellow'
              : 'bg-dark-surface2 text-text-secondary border-2 border-dark-border hover:border-accent-yellow'
          }`}
        >
          Transferencia
        </button>
        <button
          onClick={() => setMetodo('efectivo')}
          className={`p-3 rounded text-xs font-medium transition-all ${
            metodo === 'efectivo'
              ? 'bg-accent-yellow text-black border-2 border-accent-yellow'
              : 'bg-dark-surface2 text-text-secondary border-2 border-dark-border hover:border-accent-yellow'
          }`}
        >
          Efectivo
        </button>
      </div>

      {metodo === 'transferencia' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-2">
              Banco receptor
            </label>
            <select
              value={bancoSeleccionado}
              onChange={(event) => setBancoSeleccionado(event.target.value)}
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-text-primary text-sm focus:border-accent-yellow outline-none"
            >
              {Object.keys(BANCOS_BOLIVIA).map((banco) => (
                <option key={banco} value={banco}>
                  {banco}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-dark-surface2 p-4 rounded space-y-3">
            <div>
              <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
                Cliente
              </label>
              <div className="text-text-primary font-semibold">{cliente}</div>
            </div>

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
                Numero de Cuenta
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-dark-surface border border-dark-border rounded px-3 py-2 font-mono text-accent-yellow font-semibold">
                  {cuenta.cuenta}
                </div>
                <button
                  onClick={copiarCuenta}
                  className="px-3 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
                  title="Copiar cuenta"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
                Cedula de Identidad
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
              <strong>Contacto:</strong> {cuenta.telefono}
              <br />
              Confirme el pago una vez realizada la transferencia.
            </div>
          )}

          <button
            onClick={() => setMostrarInstrucciones(!mostrarInstrucciones)}
            className="w-full px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border hover:border-accent-yellow"
          >
            {mostrarInstrucciones ? 'Ocultar' : 'Ver'} instrucciones paso a paso
          </button>

          {mostrarInstrucciones && (
            <div className="bg-dark-surface2 p-4 rounded space-y-2 text-xs text-text-secondary">
              <div className="font-semibold text-text-primary mb-2">Pasos para transferir:</div>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Abre tu app bancaria.</li>
                <li>Selecciona nueva transferencia.</li>
                <li>Ingresa el numero de cuenta mostrado arriba.</li>
                <li>Coloca el monto: <strong>Bs {monto.toLocaleString()}</strong>.</li>
                <li>En concepto escribe: <strong>{referencia}</strong>.</li>
                <li>Confirma y completa el proceso.</li>
                <li>Contacta a administracion para validar el pago.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {metodo === 'efectivo' && (
        <div className="bg-accent-orange bg-opacity-10 border border-accent-orange border-opacity-30 p-4 rounded space-y-3">
          <div>
            <div className="font-semibold text-text-primary mb-1">Pago en efectivo</div>
            <div className="text-xs text-text-secondary">
              Entrega el monto exacto a nuestro representante.
              <br />
              <strong>Monto: Bs {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
          <button
            onClick={onPagado}
            className="w-full px-4 py-2 bg-accent-yellow text-black text-sm font-semibold rounded hover:bg-opacity-90"
          >
            Confirmar pago en efectivo
          </button>
        </div>
      )}

      {metodo !== 'efectivo' && (
        <div className="pt-4 border-t border-dark-border">
          <button
            onClick={onPagado}
            className="w-full px-4 py-3 bg-status-success text-black text-sm font-semibold rounded hover:opacity-90"
          >
            Confirmar pago realizado
          </button>
          <div className="text-xs text-text-tertiary mt-2 text-center">
            Despues de enviar el pago, presiona este boton para confirmar.
          </div>
        </div>
      )}
    </div>
  );
}
