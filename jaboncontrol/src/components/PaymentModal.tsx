import { useState } from 'react';
import { Modal } from './common/Modal';
import { PaymentGateway } from './PaymentGateway';

interface PaymentModalProps {
  isOpen: boolean;
  monto: number;
  referencia: string;
  cliente: string;
  onClose: () => void;
  onPagado?: (metodo: string) => void;
}

export function PaymentModal({
  isOpen,
  monto,
  referencia,
  cliente,
  onClose,
  onPagado,
}: PaymentModalProps) {
  const [pagado, setPagado] = useState(false);

  const handlePagado = (metodo?: string) => {
    setPagado(true);
    setTimeout(() => {
      onPagado?.(metodo || 'transferencia');
      setTimeout(() => {
        setPagado(false);
        onClose();
      }, 2000);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      title={pagado ? '✅ PAGO CONFIRMADO' : `💳 PASARELA DE PAGO — Bs ${monto.toLocaleString()}`}
      onClose={onClose}
      hideFooter
    >
      {pagado ? (
        <div className="space-y-4 py-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-status-success bg-opacity-20 border-4 border-status-success flex items-center justify-center text-5xl animate-pulse">
              ✓
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-2xl font-bebas text-status-success">¡Pago Registrado!</div>
            <div className="text-xs text-text-secondary">
              Referencia: <strong>{referencia}</strong>
              <br />
              Monto: <strong>Bs {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resumen de pago */}
          <div className="bg-dark-surface2 p-4 rounded">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-text-tertiary font-mono uppercase mb-1">Cliente</div>
                <div className="text-text-primary font-semibold">{cliente}</div>
              </div>
              <div>
                <div className="text-text-tertiary font-mono uppercase mb-1">Referencia</div>
                <div className="font-mono text-accent-yellow">{referencia}</div>
              </div>
              <div className="col-span-2">
                <div className="text-text-tertiary font-mono uppercase mb-1">Monto Total</div>
                <div className="text-3xl font-bebas text-status-success">
                  Bs {monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Pasarela de pago */}
          <PaymentGateway
            monto={monto}
            referencia={referencia}
            cliente={cliente}
            onPagado={() => handlePagado()}
          />
        </div>
      )}
    </Modal>
  );
}
