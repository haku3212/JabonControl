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

const metodoLabel: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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

    const printWindow = window.open('', '', 'height=700,width=900');
    if (!printWindow) return;

    const fechaPago = new Date(fecha).toLocaleDateString('es-BO');
    const metodo = metodoLabel[metodoPago] || metodoPago;
    const generado = new Date().toLocaleString('es-BO');

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo ${numeroRecibo}</title>
          <style>
            body { margin: 0; padding: 24px; background: #f5f7fa; font-family: Arial, sans-serif; }
            .recibo-print { max-width: 760px; margin: 0 auto; background: white; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .header { background: #020617; color: white; padding: 24px 32px; display: flex; justify-content: space-between; gap: 24px; }
            .title { font-size: 30px; letter-spacing: 1px; font-weight: 700; }
            .muted { color: #64748b; font-size: 12px; }
            .header .muted { color: #cbd5e1; }
            .body { padding: 28px 32px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .box { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 6px; padding: 12px 16px; }
            .label { color: #64748b; font-size: 11px; text-transform: uppercase; }
            .value { margin-top: 4px; font-weight: 700; word-break: break-word; }
            .amount { margin: 24px 0; border: 1px solid #a7f3d0; background: #ecfdf5; border-radius: 6px; padding: 20px; text-align: center; color: #047857; }
            .amount strong { display: block; font-size: 36px; margin-top: 4px; }
            .signature { display: grid; grid-template-columns: 1fr 180px; gap: 24px; align-items: end; padding-top: 28px; }
            .line { border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; font-size: 12px; color: #475569; }
            .footer { border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
            @media print { body { background: white; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="recibo-print">
            <div class="header">
              <div>
                <div class="title">RECIBO DE PAGO</div>
                <div class="muted">Constancia de cobro recibido</div>
              </div>
              <div style="text-align:right">
                <div class="muted">RECIBO</div>
                <div style="color:#fcd34d;font-weight:700">${escapeHtml(numeroRecibo)}</div>
              </div>
            </div>
            <div class="body">
              <div class="grid">
                <div class="box"><div class="label">Cliente</div><div class="value">${escapeHtml(cliente)}</div></div>
                <div class="box"><div class="label">Fecha de pago</div><div class="value">${escapeHtml(fechaPago)}</div></div>
                <div class="box"><div class="label">Metodo</div><div class="value">${escapeHtml(metodo)}</div></div>
                <div class="box"><div class="label">Notas de entrega</div><div class="value">${escapeHtml(notasCorrespondientes || '-')}</div></div>
              </div>
              <div class="amount"><div class="label" style="color:#047857">Monto pagado</div><strong>Bs ${escapeHtml(monto)}</strong></div>
              <div class="signature">
                <div class="muted">Documento generado por JabonControl. Conserve este recibo como respaldo del pago registrado.</div>
                <div class="line">Recibido por</div>
              </div>
              <div class="footer"><span>JabonControl - Sistema de Gestion de Jaboneria</span><span>${escapeHtml(generado)}</span></div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const monto = montoCobrado.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div>
      <div ref={reciboRef} className="bg-white text-slate-900 rounded-lg shadow-xl mx-auto max-w-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-950 text-white px-8 py-6 flex justify-between gap-6">
          <div>
            <div className="text-3xl font-bebas tracking-wider">RECIBO DE PAGO</div>
            <div className="text-xs font-mono text-slate-300 mt-1">Constancia de cobro recibido</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-slate-300">RECIBO</div>
            <div className="text-lg font-bold text-amber-300">{numeroRecibo}</div>
          </div>
        </div>

        <div className="px-8 py-7 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Info label="Cliente" value={cliente} />
            <Info label="Fecha de pago" value={new Date(fecha).toLocaleDateString('es-BO')} />
            <Info label="Metodo" value={metodoLabel[metodoPago] || metodoPago} />
            <Info label="Notas de entrega" value={notasCorrespondientes || '-'} />
          </div>

          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-6 py-5 text-center">
            <div className="text-xs font-mono text-emerald-700 uppercase">Monto pagado</div>
            <div className="text-4xl font-bebas tracking-wider text-emerald-700 mt-1">Bs {monto}</div>
          </div>

          <div className="grid grid-cols-[1fr_180px] gap-6 items-end pt-8">
            <div className="text-xs text-slate-500">
              Documento generado por JabonControl. Conserve este recibo como respaldo del pago registrado.
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 pt-2 text-xs text-slate-600">Recibido por</div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 flex justify-between text-[11px] text-slate-500">
            <span>JabonControl - Sistema de Gestion de Jaboneria</span>
            <span>{new Date().toLocaleString('es-BO')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button
          onClick={imprimirRecibo}
          className="px-5 py-2.5 bg-dark-surface3 text-text-primary font-medium rounded border border-dark-border hover:border-accent-yellow transition-all"
        >
          Imprimir
        </button>
        <button
          onClick={descargarPDF}
          className="px-5 py-2.5 bg-accent-yellow text-black font-semibold rounded hover:bg-opacity-90 transition-all"
        >
          Descargar PDF
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-mono uppercase text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 mt-1 break-words">{value}</div>
    </div>
  );
}
