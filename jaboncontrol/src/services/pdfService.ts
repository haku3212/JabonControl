import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = {
  primary: '#E8B84B',
  dark: '#0F1419',
  text: '#E8E8E8',
  border: '#2A2F37',
  success: '#3DD68C',
  danger: '#FF5757',
};

export async function generarReporteHornada(hornada: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 15;

  // Header
  doc.setFillColor(15, 20, 25);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(232, 184, 75);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE HORNADA', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.text('SISTEMA DE PRODUCCIÓN JABONERÍA', pageWidth / 2, 22, { align: 'center' });

  // Información general
  yPos = 40;
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('INFORMACIÓN GENERAL', 15, yPos);

  yPos += 8;
  doc.setTextColor(232, 184, 75);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${hornada.numero}`, 15, yPos);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  yPos += 5;
  doc.text(`Fecha: ${hornada.fecha} | Hora: ${hornada.horaInicio} | Operario: ${hornada.operario}`, 15, yPos);

  // Tabla de ingredientes
  yPos += 12;
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MATERIAS PRIMAS UTILIZADAS', 15, yPos);

  yPos += 7;
  const ingredientes = [
    ['Soda Cáustica (lts)', hornada.ingredientes?.naohVolumen?.toFixed(2) || '0.00'],
    ['Sebo Fundido (kg)', hornada.ingredientes?.seboFund?.toFixed(2) || '0.00'],
    ['Aceite Quemado (lts)', hornada.ingredientes?.aceiteQuem?.toFixed(2) || '0.00'],
    ['Aceite Crudo (lts)', hornada.ingredientes?.aceiteCrudo?.toFixed(2) || '0.00'],
    ['Aceite Almendra (lts)', hornada.ingredientes?.aceiteAlmendra?.toFixed(2) || '0.00'],
    ['Agua (lts)', hornada.ingredientes?.agua?.toFixed(2) || '0.00'],
    ['Jabón Reciclado (kg)', hornada.ingredientes?.jabonRecicl?.toFixed(2) || '0.00'],
  ];

  const colWidth = (pageWidth - 30) / 2;
  ingredientes.forEach((ing, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(42, 47, 55);
      doc.rect(15, yPos - 3, colWidth - 2, 6, 'F');
    }
    doc.setTextColor(232, 184, 75);
    doc.setFontSize(9);
    doc.text(ing[0], 17, yPos);
    doc.setTextColor(61, 214, 140);
    doc.setFont('helvetica', 'bold');
    doc.text(ing[1], 15 + colWidth - 5, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    if (idx % 2 === 1) {
      yPos += 7;
    }
  });

  // Producción y rendimiento
  yPos += 10;
  doc.setFillColor(232, 184, 75);
  doc.rect(15, yPos - 4, pageWidth - 30, 10, 'F');
  doc.setTextColor(15, 20, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Producción Total: ${hornada.produccionTotal} kg`, pageWidth / 2, yPos + 1, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Rendimiento: ${hornada.rendimiento?.toFixed(2) || '0.00'}%`, pageWidth / 2, yPos + 6, { align: 'center' });

  // Observaciones
  yPos += 18;
  if (hornada.observaciones) {
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('OBSERVACIONES', 15, yPos);
    yPos += 6;
    doc.setTextColor(232, 184, 75);
    const lineas = doc.splitTextToSize(hornada.observaciones, pageWidth - 30);
    doc.text(lineas, 15, yPos);
  }

  // Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(
    `Generado: ${new Date().toLocaleString('es-BO')} | JabonControl ERP v1.0`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc.save(`Hornada_${hornada.numero}.pdf`);
}

export async function generarReporteVenta(venta: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(15, 20, 25);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(232, 184, 75);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTA DE ENTREGA', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.text('COMPROBANTE DE VENTA', pageWidth / 2, 20, { align: 'center' });

  let yPos = 35;

  // Datos de cabecera
  doc.setTextColor(232, 184, 75);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${venta.numeroNE}`, 15, yPos);

  yPos += 8;
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${venta.fecha} | Cliente: ${venta.cliente}`, 15, yPos);

  // Tabla de detalles
  yPos += 12;
  const headers = ['Concepto', 'Cantidad', 'Precio Unit.', 'Total'];
  const colWidths = [80, 25, 30, 30];
  let xPos = 15;

  // Header tabla
  doc.setFillColor(42, 47, 55);
  doc.setTextColor(232, 184, 75);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  headers.forEach((header, idx) => {
    doc.text(header, xPos + colWidths[idx] / 2, yPos, {
      align: 'center',
      maxWidth: colWidths[idx] - 2,
    });
    xPos += colWidths[idx];
  });

  // Fila de producto
  yPos += 8;
  xPos = 15;
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');

  doc.text(`Jabón ${venta.formato}`, xPos, yPos, { maxWidth: colWidths[0] - 2 });
  xPos += colWidths[0];
  doc.text(`${venta.cantidad}`, xPos + colWidths[1] / 2, yPos, { align: 'center' });
  xPos += colWidths[1];
  doc.text(`Bs ${venta.precioUnitario.toFixed(2)}`, xPos + colWidths[2] / 2, yPos, { align: 'center' });
  xPos += colWidths[2];
  doc.text(`Bs ${venta.total.toFixed(2)}`, xPos + colWidths[3] / 2, yPos, { align: 'center' });

  // Total
  yPos += 12;
  doc.setFillColor(232, 184, 75);
  doc.rect(15, yPos - 4, pageWidth - 30, 10, 'F');
  doc.setTextColor(15, 20, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', 15, yPos + 2);
  doc.text(`Bs ${venta.total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 15, yPos + 2, { align: 'right' });

  // Método de pago
  yPos += 15;
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MÉTODO DE PAGO', 15, yPos);
  yPos += 5;
  doc.setTextColor(61, 214, 140);
  doc.setFont('helvetica', 'bold');
  const metodosMap: Record<string, string> = {
    credito: 'Crédito',
    contado: 'Contado',
    transferencia: 'Transferencia',
  };
  doc.text(metodosMap[venta.tipoPago] || venta.tipoPago, 15, yPos);

  // Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(
    `Generado: ${new Date().toLocaleString('es-BO')} | JabonControl ERP v1.0`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc.save(`NE_${venta.numeroNE}.pdf`);
}

export async function generarReporteCobro(cobro: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(15, 20, 25);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(61, 214, 140);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE COBRO', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.text('COMPROBANTE DE PAGO RECIBIDO', pageWidth / 2, 20, { align: 'center' });

  let yPos = 35;

  // Cliente y fecha
  doc.setTextColor(232, 184, 75);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(cobro.cliente, 15, yPos);

  yPos += 6;
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${cobro.fecha}`, 15, yPos);

  // Detalles de notas
  yPos += 10;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('NOTAS PAGADAS', 15, yPos);

  yPos += 6;
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  const notas = cobro.notasCorrespondientes.split(',').map((n: string) => n.trim());
  doc.text(notas.join(' | '), 15, yPos, { maxWidth: pageWidth - 30 });

  // Monto
  yPos += 15;
  doc.setFillColor(61, 214, 140);
  doc.rect(15, yPos - 5, pageWidth - 30, 12, 'F');
  doc.setTextColor(15, 20, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MONTO COBRADO:', 15, yPos + 1);
  doc.setFontSize(14);
  doc.text(
    `Bs ${cobro.montoCobrado.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - 15,
    yPos + 2,
    { align: 'right' }
  );

  // Método de pago
  yPos += 18;
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MÉTODO DE PAGO', 15, yPos);
  yPos += 5;
  doc.setTextColor(232, 184, 75);
  doc.setFont('helvetica', 'bold');
  const metodos: Record<string, string> = {
    efectivo: '💵 Efectivo',
    transferencia: '🏦 Transferencia',
    cheque: '📄 Cheque',
  };
  doc.text(metodos[cobro.metodoPago] || cobro.metodoPago, 15, yPos);

  // Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(
    `Generado: ${new Date().toLocaleString('es-BO')} | JabonControl ERP v1.0`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc.save(`Cobro_${cobro.fecha}.pdf`);
}

export async function generarReporteRecepcion(recepcion: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(15, 20, 25);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(75, 159, 232);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEPCIÓN DE MATERIA PRIMA', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.text('INGRESO DE INSUMOS', pageWidth / 2, 20, { align: 'center' });

  let yPos = 35;

  // Proveedor y fecha
  doc.setTextColor(75, 159, 232);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(recepcion.proveedor, 15, yPos);

  yPos += 6;
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${recepcion.fecha} | Estado: ${recepcion.estado}`, 15, yPos);

  // Tabla de producto
  yPos += 12;
  const headers = ['Producto', 'Cantidad', 'Precio Unit.', 'Total'];
  const colWidths = [80, 20, 30, 30];
  let xPos = 15;

  doc.setFillColor(42, 47, 55);
  doc.setTextColor(75, 159, 232);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  headers.forEach((header, idx) => {
    doc.text(header, xPos + colWidths[idx] / 2, yPos, { align: 'center' });
    xPos += colWidths[idx];
  });

  // Fila de producto
  yPos += 8;
  xPos = 15;
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');

  doc.text(recepcion.producto, xPos, yPos, { maxWidth: colWidths[0] - 2 });
  xPos += colWidths[0];
  doc.text(
    `${recepcion.cantidad} ${recepcion.unidad}`,
    xPos + colWidths[1] / 2,
    yPos,
    { align: 'center' }
  );
  xPos += colWidths[1];
  doc.text(`Bs ${recepcion.precioUnitario.toFixed(2)}`, xPos + colWidths[2] / 2, yPos, {
    align: 'center',
  });
  xPos += colWidths[2];
  doc.text(`Bs ${recepcion.precioTotal.toFixed(2)}`, xPos + colWidths[3] / 2, yPos, {
    align: 'center',
  });

  // Total
  yPos += 12;
  doc.setFillColor(75, 159, 232);
  doc.rect(15, yPos - 4, pageWidth - 30, 10, 'F');
  doc.setTextColor(15, 20, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('COSTO TOTAL:', 15, yPos + 2);
  doc.text(
    `Bs ${recepcion.precioTotal.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    pageWidth - 15,
    yPos + 2,
    { align: 'right' }
  );

  // Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(
    `Generado: ${new Date().toLocaleString('es-BO')} | JabonControl ERP v1.0`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc.save(`Recepcion_${recepcion.fecha}.pdf`);
}
