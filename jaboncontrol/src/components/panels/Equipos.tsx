import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

export function Equipos() {
  const [equipoQR, setEquipoQR] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current && equipoQR) {
      qrRef.current.innerHTML = '';
      const datosQR = `EQUIPO|${equipoQR}|${new Date().toISOString().split('T')[0]}`;
      QRCode.toCanvas(qrRef.current, datosQR, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      }).catch((err: unknown) => console.error('Error QR:', err));
    }
  }, [equipoQR]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bebas tracking-wider">Equipos</h1>
          <p className="text-xs font-mono text-text-tertiary mt-1">INVENTARIO Y ESTADO DE MAQUINARIA</p>
        </div>
        <button className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded">+ Agregar Equipo</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            nombre: 'COMPRESORA #1',
            ubicacion: 'Sala principal',
            potencia: '7.5 HP',
            ultimoMant: '15/03/26',
            proximoMant: '15/07/26',
            estado: 'success'
          },
          {
            nombre: 'SELLADORA',
            ubicacion: 'Acabado',
            potencia: '2.2 kW',
            ultimoMant: '10/01/26',
            proximoMant: 'Vencido',
            estado: 'warning'
          },
          {
            nombre: 'TANQUES MEZCLA',
            ubicacion: 'Planta baja',
            potencia: '3 × 1,000 lts',
            ultimoMant: '01/05/26',
            proximoMant: '01/08/26',
            estado: 'success'
          },
        ].map((equipo) => (
          <Card key={equipo.nombre} title={equipo.nombre} badge={{ label: equipo.estado === 'success' ? 'Operativo' : 'Revisión pendiente', type: equipo.estado as 'success' | 'warning' }}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Ubicación:</span>
                <span className="text-text-primary">{equipo.ubicacion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Potencia:</span>
                <span className="font-mono text-text-primary">{equipo.potencia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Último mant.:</span>
                <span className="font-mono text-text-primary">{equipo.ultimoMant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Próximo mant.:</span>
                <span className={`font-mono ${equipo.proximoMant === 'Vencido' ? 'text-status-danger' : 'text-accent-yellow'}`}>
                  {equipo.proximoMant}
                </span>
              </div>
              <div className="w-full mt-3 flex gap-2">
                <button className="flex-1 px-2 py-1.5 bg-dark-surface3 rounded text-xs border border-dark-border hover:border-accent-yellow">
                  📋 Historial
                </button>
                <button
                  onClick={() => setEquipoQR(equipo.nombre)}
                  className="flex-1 px-2 py-1.5 bg-accent-yellow text-black rounded text-xs font-medium hover:bg-opacity-90"
                >
                  📱 QR
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal QR para Equipos */}
      {equipoQR && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={() => setEquipoQR(null)}>
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 max-w-md w-full fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-bebas text-accent-yellow">📱 Código QR - {equipoQR}</div>
              <button onClick={() => setEquipoQR(null)} className="text-xl text-text-tertiary hover:text-text-primary">✕</button>
            </div>

            <div className="bg-white p-4 rounded-lg flex justify-center mb-4">
              <div ref={qrRef}></div>
            </div>

            <div className="text-center text-xs text-text-secondary mb-4">
              <div className="font-mono">{equipoQR}</div>
              <div className="text-text-tertiary">Escanear para acceso a mantenimiento</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (qrRef.current?.querySelector('canvas')) {
                    const canvas = qrRef.current.querySelector('canvas') as HTMLCanvasElement;
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `QR_${equipoQR}.png`;
                    link.click();
                  }
                }}
                className="flex-1 px-3 py-2 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90"
              >
                ⬇️ Descargar
              </button>
              <button
                onClick={() => setEquipoQR(null)}
                className="flex-1 px-3 py-2 bg-dark-surface3 text-text-primary text-xs font-medium rounded border border-dark-border"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
