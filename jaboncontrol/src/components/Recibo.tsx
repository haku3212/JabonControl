import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReciboProps {
  cliente: string;
  montoCobrado: number;
  metodoPago: string;
  fecha: string;
  notasCorrespondientes: string;
  numeroRecibo: string;
}

export function Recibo({
  cliente,
  montoCobrado,
  metodoPago,
  fecha,
  notasCorrespondientes,
  numeroRecibo,
}: ReciboProps) {
  const reciboRef = useRef<HTMLDivElement>(null);

  const descargarPDF = async () => {
    if (!reciboRef.current) return;

    try {
      const canvas = await html2canvas(reciboRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Recibo_${numeroRecibo}_${cliente.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const imprimirRecibo = () => {
    if (!reciboRef.current) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Recibo ${numeroRecibo}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background: white;
              }
              .recibo {
                max-width: 600px;
                margin: 0 auto;
                border: 2px solid #333;
                padding: 30px;
                background: white;
              }
              h1 {
                text-align: center;
                margin-bottom: 5px;
                color: #333;
              }
              .subtitulo {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-bottom: 20px;
              }
              .separador {
                border-bottom: 2px solid #333;
                margin: 15px 0;
              }
              .seccion {
                margin: 15px 0;
              }
              .label {
                font-weight: bold;
                color: #333;
                font-size: 14px;
              }
              .valor {
                font-size: 14px;
                margin-left: 10px;
                color: #000;
              }
              .monto-principal {
                font-size: 24px;
                font-weight: bold;
                color: #d4a574;
                text-align: center;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-top: 30px;
              }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${reciboRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div>
      <div
        ref={reciboRef}
        className="bg-white p-8 rounded border-2 border-dark-border mx-auto max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bebas text-accent-yellow tracking-wider">
            RECIBO
          </h1>
          <p className="text-sm font-mono text-text-tertiary mt-1">
            CONSTANCIA DE PAGO
          </p>
        </div>

        {/* Número de recibo */}
        <div className="border-b-2 border-dark-border pb-4 mb-4">
          <div className="text-xs font-mono text-text-tertiary">
            N° RECIBO: <span className="text-accent-yellow font-bold">{numeroRecibo}</span>
          </div>
        </div>

        {/* Información del Cobro */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between border-b border-dark-border pb-2">
            <span className="text-sm font-mono text-text-tertiary uppercase">Cliente:</span>
            <span className="text-sm font-bold text-text-primary">{cliente}</span>
          </div>

          <div className="flex justify-between border-b border-dark-border pb-2">
            <span className="text-sm font-mono text-text-tertiary uppercase">Fecha de Pago:</span>
            <span className="text-sm text-text-primary">{new Date(fecha).toLocaleDateString('es-BO')}</span>
          </div>

          <div className="flex justify-between border-b border-dark-border pb-2">
            <span className="text-sm font-mono text-text-tertiary uppercase">Método de Pago:</span>
            <span className="text-sm text-text-primary">
              {metodoPago === 'efectivo' && '💵 Efectivo'}
              {metodoPago === 'transferencia' && '🏦 Transferencia'}
              {metodoPago === 'qr' && '📱 QR Banco'}
            </span>
          </div>
        </div>

        {/* Notas de Entrega */}
        <div className="bg-dark-surface2 p-4 rounded mb-6">
          <div className="text-xs font-mono text-text-tertiary uppercase mb-2">
            Correspondientes a N.E:
          </div>
          <div className="text-sm font-mono text-accent-yellow font-bold">
            {notasCorrespondientes}
          </div>
        </div>

        {/* Monto Principal */}
        <div className="border-y-2 border-accent-yellow py-6 mb-6">
          <div className="text-center">
            <div className="text-xs font-mono text-text-tertiary mb-2 uppercase">
              MONTO PAGADO
            </div>
            <div className="text-4xl font-bebas text-accent-yellow tracking-wider">
              Bs {montoCobrado.toLocaleString('es-BO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs font-mono text-text-tertiary space-y-2">
          <div>
            Recibido por:
          </div>
          <div className="h-12"></div>
          <div className="pt-4 border-t border-dark-border">
            ___________________________
          </div>
          <div className="text-xs text-text-secondary mt-4">
            JabonControl - Sistema de Gestión de Jabonería
          </div>
          <div className="text-xs text-text-secondary">
            {new Date().toLocaleString('es-BO')}
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={imprimirRecibo}
          className="px-6 py-3 bg-accent-yellow text-black font-medium rounded hover:bg-opacity-90 transition-all flex items-center gap-2"
        >
          🖨️ Imprimir Recibo
        </button>
        <button
          onClick={descargarPDF}
          className="px-6 py-3 bg-accent-blue text-white font-medium rounded hover:bg-opacity-90 transition-all flex items-center gap-2"
        >
          📥 Descargar PDF
        </button>
      </div>
    </div>
  );
}
