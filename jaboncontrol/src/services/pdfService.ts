import jsPDF from 'jspdf';
import { ventaCobrado, ventaSaldoPendiente, ventaTotal as getVentaTotal } from '../utils/financial';

type ReportKind = 'venta' | 'cobro' | 'hornada' | 'recepcion' | 'finanzas' | 'generico';

export interface ReportOptions {
  title?: string;
  subtitle?: string;
  includeCompany?: boolean;
  includeDetails?: boolean;
  includeTotals?: boolean;
  includeNotes?: boolean;
}

const BRAND = {
  ink: '#17202A',
  muted: '#697586',
  line: '#D8DEE6',
  soft: '#F4F6F8',
  gold: '#B98224',
  green: '#1F9D62',
  red: '#C2413A',
  blue: '#2F6FAF',
};

const money = (value: number) => `Bs ${Number(value || 0).toLocaleString('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const labelMap: Record<string, string> = {
  credito: 'Credito',
  contado: 'Contado',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  cheque: 'Cheque',
  recibido: 'Recibido',
  pendiente: 'Pendiente',
};

function text(doc: jsPDF, value: string, x: number, y: number, options?: any) {
  doc.text(String(value || ''), x, y, options);
}

function header(doc: jsPDF, kind: ReportKind, title: string, subtitle: string, options: ReportOptions = {}) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(BRAND.ink);
  doc.rect(0, 0, width, 34, 'F');
  doc.setFillColor(BRAND.gold);
  doc.rect(0, 0, 7, 34, 'F');

  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  text(doc, title, 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  text(doc, subtitle, 14, 22);

  if (options.includeCompany !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BRAND.gold);
    text(doc, 'JabonControl', width - 14, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor('#DDE3EA');
    text(doc, 'Sistema de gestion de jaboneria', width - 14, 21, { align: 'right' });
  }

  doc.setTextColor(BRAND.muted);
  doc.setFontSize(8);
  text(doc, `Generado: ${new Date().toLocaleString('es-BO')}`, width - 14, 39, { align: 'right' });

  const accent = kind === 'cobro' ? BRAND.green : kind === 'recepcion' ? BRAND.blue : kind === 'finanzas' ? BRAND.red : BRAND.gold;
  doc.setDrawColor(accent);
  doc.setLineWidth(0.8);
  doc.line(14, 43, width - 14, 43);
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(BRAND.muted);
  text(doc, title.toUpperCase(), 14, y);
}

function keyValueGrid(doc: jsPDF, rows: Array<[string, string]>, y: number) {
  const width = doc.internal.pageSize.getWidth();
  const colW = (width - 28) / 2;
  let currentY = y;

  rows.forEach(([label, value], index) => {
    const x = 14 + (index % 2) * colW;
    if (index % 2 === 0 && index > 0) currentY += 14;
    doc.setFillColor(BRAND.soft);
    doc.roundedRect(x, currentY - 5, colW - 4, 10, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(BRAND.muted);
    text(doc, label.toUpperCase(), x + 3, currentY - 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(BRAND.ink);
    text(doc, value || '-', x + 3, currentY + 3);
  });

  return currentY + 15;
}

function table(doc: jsPDF, headers: string[], rows: string[][], y: number, widths?: number[]) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usable = pageWidth - 28;
  const colWidths = widths || headers.map(() => usable / headers.length);
  let x = 14;

  doc.setFillColor(BRAND.ink);
  doc.roundedRect(14, y - 5, usable, 9, 1.5, 1.5, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  headers.forEach((head, i) => {
    text(doc, head, x + 2, y);
    x += colWidths[i];
  });

  let currentY = y + 9;
  rows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 0) {
      doc.setFillColor(BRAND.soft);
      doc.rect(14, currentY - 5, usable, 8, 'F');
    }
    x = 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(BRAND.ink);
    row.forEach((cell, i) => {
      const lines = doc.splitTextToSize(String(cell || '-'), colWidths[i] - 4);
      doc.text(lines.slice(0, 2), x + 2, currentY);
      x += colWidths[i];
    });
    currentY += 8;
  });

  doc.setDrawColor(BRAND.line);
  doc.rect(14, y - 5, usable, currentY - y, 'S');
  return currentY + 8;
}

function totalBand(doc: jsPDF, label: string, value: string, y: number, color = BRAND.gold) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(color);
  doc.roundedRect(14, y, width - 28, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#FFFFFF');
  text(doc, label.toUpperCase(), 19, y + 10);
  doc.setFontSize(15);
  text(doc, value, width - 19, y + 10, { align: 'right' });
  return y + 24;
}

function footer(doc: jsPDF) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setDrawColor(BRAND.line);
  doc.line(14, height - 18, width - 14, height - 18);
  doc.setTextColor(BRAND.muted);
  doc.setFontSize(8);
  text(doc, 'JabonControl ERP - Documento generado automaticamente', 14, height - 10);
  text(doc, `Pagina 1`, width - 14, height - 10, { align: 'right' });
}

function save(doc: jsPDF, filename: string) {
  footer(doc);
  doc.save(filename);
}

export async function generarReporteVenta(venta: any, options: ReportOptions = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  header(doc, 'venta', options.title || 'Nota de entrega', options.subtitle || `Comprobante ${venta.numeroNE}`, options);
  let y = 54;

  sectionTitle(doc, 'Datos de la venta', y);
  y = keyValueGrid(doc, [
    ['Nota', venta.numeroNE],
    ['Fecha', venta.fecha],
    ['Cliente', venta.cliente],
    ['Pago', labelMap[venta.tipoPago] || venta.tipoPago],
  ], y + 9);

  if (options.includeDetails !== false) {
    sectionTitle(doc, 'Detalle', y);
    y = table(doc, ['Concepto', 'Cantidad', 'P. unitario', 'Total'], [[
      `Jabon ${venta.formato}`,
      String(venta.cantidad),
      money(venta.precioUnitario),
      money(venta.total || venta.precioTotal),
    ]], y + 9, [82, 28, 38, 34]);
  }

  if (options.includeTotals !== false) {
    y = totalBand(doc, 'Total venta', money(venta.total || venta.precioTotal), y, BRAND.gold);
  }

  if (options.includeNotes) {
    sectionTitle(doc, 'Notas', y);
    y = keyValueGrid(doc, [['Estado', venta.estado || 'Registrada'], ['Saldo pendiente', money(venta.saldoPendiente || 0)]], y + 9);
  }

  save(doc, `NE_${venta.numeroNE}.pdf`);
}

export async function generarReporteCobro(cobro: any, options: ReportOptions = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const recibo = options.title || 'Recibo de pago';
  header(doc, 'cobro', recibo, options.subtitle || 'Constancia de cobro recibido', options);
  let y = 54;

  sectionTitle(doc, 'Datos del cobro', y);
  y = keyValueGrid(doc, [
    ['Cliente', cobro.cliente],
    ['Fecha', cobro.fecha],
    ['Metodo de pago', labelMap[cobro.metodoPago] || cobro.metodoPago],
    ['Notas / NE', cobro.notasCorrespondientes],
  ], y + 9);

  if (options.includeTotals !== false) {
    y = totalBand(doc, 'Monto cobrado', money(cobro.montoCobrado), y, BRAND.green);
  }

  if (options.includeDetails !== false) {
    sectionTitle(doc, 'Aplicacion del pago', y);
    const dist = cobro.distribucion || [];
    const rows = dist.length
      ? dist.map((d: any) => [d.numeroNE || d.id, money(d.original || 0), money(d.aplicado || 0), d.saldada ? 'Saldada' : 'Parcial'])
      : [[cobro.notasCorrespondientes || '-', money(cobro.montoCobrado), money(cobro.montoCobrado), 'Registrado']];
    y = table(doc, ['Documento', 'Original', 'Aplicado', 'Estado'], rows, y + 9, [55, 42, 42, 43]);
  }

  if (options.includeNotes) {
    sectionTitle(doc, 'Firma', y);
    doc.setDrawColor(BRAND.line);
    doc.line(70, y + 25, 140, y + 25);
    doc.setFontSize(8);
    doc.setTextColor(BRAND.muted);
    text(doc, 'Recibido por', 105, y + 31, { align: 'center' });
  }

  save(doc, `Recibo_${cobro.fecha}_${cobro.cliente.replace(/\s+/g, '_')}.pdf`);
}

export async function generarReporteHornada(hornada: any, options: ReportOptions = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  header(doc, 'hornada', options.title || 'Reporte de hornada', options.subtitle || hornada.numero, options);
  let y = 54;

  y = keyValueGrid(doc, [
    ['Hornada', hornada.numero],
    ['Fecha', hornada.fecha],
    ['Hora inicio', hornada.horaInicio],
    ['Operario', hornada.operario],
  ], y);

  if (options.includeDetails !== false) {
    const ing = hornada.ingredientes || hornada;
    y = table(doc, ['Materia prima', 'Cantidad'], [
      ['Soda caustica', `${ing.naohVolumen || 0}`],
      ['Sebo fundido', `${ing.seboFund || 0}`],
      ['Aceite quemado', `${ing.aceiteQuem || 0}`],
      ['Aceite crudo', `${ing.aceiteCrudo || 0}`],
      ['Aceite almendra', `${ing.aceiteAlmendra || 0}`],
      ['Agua', `${ing.agua || 0}`],
    ], y + 6, [110, 72]);
  }

  if (options.includeTotals !== false) {
    y = totalBand(doc, 'Produccion total', `${hornada.produccionTotal} kg`, y, BRAND.gold);
    y = totalBand(doc, 'Rendimiento', `${hornada.rendimiento || 0}%`, y - 4, BRAND.green);
  }

  if (options.includeNotes && hornada.observaciones) {
    sectionTitle(doc, 'Observaciones', y);
    doc.setTextColor(BRAND.ink);
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(hornada.observaciones, 180), 14, y + 9);
  }

  save(doc, `Hornada_${hornada.numero}.pdf`);
}

export async function generarReporteRecepcion(recepcion: any, options: ReportOptions = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  header(doc, 'recepcion', options.title || 'Recepcion de materia prima', options.subtitle || recepcion.producto, options);
  let y = 54;

  y = keyValueGrid(doc, [
    ['Proveedor', recepcion.proveedor],
    ['Fecha', recepcion.fecha],
    ['Estado', labelMap[recepcion.estado] || recepcion.estado],
    ['Unidad', recepcion.unidad],
  ], y);

  if (options.includeDetails !== false) {
    y = table(doc, ['Producto', 'Cantidad', 'P. unitario', 'Total'], [[
      recepcion.producto,
      `${recepcion.cantidad} ${recepcion.unidad}`,
      money(recepcion.precioUnitario),
      money(recepcion.precioTotal),
    ]], y + 6, [82, 34, 34, 32]);
  }

  if (options.includeTotals !== false) {
    y = totalBand(doc, 'Costo total', money(recepcion.precioTotal), y, BRAND.blue);
  }

  save(doc, `Recepcion_${recepcion.fecha}_${recepcion.producto}.pdf`);
}

export async function generarReporteFinanciero(data: any[], resumen: any, options: ReportOptions = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  header(doc, 'finanzas', options.title || 'Extracto financiero', options.subtitle || 'Movimientos y resumen de caja', options);
  let y = 54;

  y = keyValueGrid(doc, [
    ['Ingresos', money(resumen.ingresosTotales || 0)],
    ['Egresos', money(resumen.egresos || 0)],
    ['Flujo de caja', money(resumen.flujoCaja || 0)],
    ['Por cobrar', money(resumen.porCobrar || 0)],
  ], y);

  if (options.includeDetails !== false) {
    const rows = data.slice(0, 18).map((item) => [
      item.fecha,
      item.tipo,
      item.categoria,
      item.concepto,
      money(item.monto),
    ]);
    y = table(doc, ['Fecha', 'Tipo', 'Categoria', 'Concepto', 'Monto'], rows, y + 6, [25, 24, 35, 66, 32]);
  }

  if (options.includeTotals !== false) {
    totalBand(doc, 'Utilidad estimada', money(resumen.utilidad || 0), y, (resumen.utilidad || 0) >= 0 ? BRAND.green : BRAND.red);
  }

  save(doc, 'Extracto_financiero.pdf');
}

export async function generarReporteCliente(cliente: any, ventas: any[], cobros: any[], options: ReportOptions = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  header(doc, 'finanzas', options.title || 'Ficha de cliente', options.subtitle || cliente.nombre, options);
  let y = 54;

  const ventaTotal = ventas.reduce((sum, venta) => sum + getVentaTotal(venta), 0);
  const cobrado = ventas.reduce((sum, venta) => sum + ventaCobrado(venta), 0);
  const saldo = ventas.reduce((sum, venta) => sum + ventaSaldoPendiente(venta), 0);

  sectionTitle(doc, 'Informacion del cliente', y);
  y = keyValueGrid(doc, [
    ['Nombre', cliente.nombre],
    ['Tipo', cliente.tipo],
    ['Telefono', cliente.telefono || '-'],
    ['Correo', cliente.email || '-'],
    ['Ciudad', cliente.ciudad || '-'],
    ['Direccion', cliente.direccion || '-'],
  ], y + 9);

  if (options.includeTotals !== false) {
    y = totalBand(doc, 'Saldo por cobrar', money(saldo), y, saldo > 0 ? BRAND.red : BRAND.green);
  }

  if (options.includeDetails !== false) {
    sectionTitle(doc, 'Ventas del cliente', y);
    y = table(doc, ['Fecha', 'NE', 'Formato', 'Total', 'Estado'], ventas.slice(-12).reverse().map((venta) => [
      venta.fecha,
      venta.numeroNE,
      venta.formato,
      money(venta.total || venta.precioTotal || 0),
      labelMap[venta.tipoPago] || venta.tipoPago,
    ]), y + 9, [26, 34, 42, 40, 40]);

    sectionTitle(doc, 'Cobros del cliente', y);
    y = table(doc, ['Fecha', 'Notas', 'Metodo', 'Monto'], cobros.slice(-12).reverse().map((cobro) => [
      cobro.fecha,
      cobro.notasCorrespondientes || '-',
      labelMap[cobro.metodoPago] || cobro.metodoPago,
      money(cobro.montoCobrado),
    ]), y + 9, [30, 60, 42, 50]);
  }

  if (options.includeNotes) {
    sectionTitle(doc, 'Resumen', y);
    y = keyValueGrid(doc, [
      ['Venta total', money(ventaTotal)],
      ['Cobrado', money(cobrado)],
    ], y + 9);
  }

  save(doc, `Ficha_cliente_${cliente.nombre.replace(/\s+/g, '_')}.pdf`);
}

export async function generarCotizacionPDF(cotizacion: any, options: ReportOptions = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  header(doc, 'venta', options.title || 'Cotizacion comercial', options.subtitle || cotizacion.numero, options);
  let y = 54;

  sectionTitle(doc, 'Datos de la cotizacion', y);
  y = keyValueGrid(doc, [
    ['Numero', cotizacion.numero],
    ['Fecha', cotizacion.fecha],
    ['Cliente', cotizacion.cliente],
    ['Estado', cotizacion.estado],
    ['Validez', `${cotizacion.validezDias || 0} dias`],
    ['Responsable', cotizacion.responsable || '-'],
  ], y + 9);

  sectionTitle(doc, 'Detalle', y);
  y = table(doc, ['Descripcion', 'Cant.', 'P. Unit.', 'Subtotal'], (cotizacion.items || []).map((item: any) => [
    item.descripcion,
    String(item.cantidad || 0),
    money(item.precioUnitario || 0),
    money((item.cantidad || 0) * (item.precioUnitario || 0)),
  ]), y + 9, [86, 22, 34, 34]);

  y = totalBand(doc, 'Total cotizado', money(cotizacion.total || 0), y + 4);

  if (cotizacion.notas) {
    sectionTitle(doc, 'Notas', y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(BRAND.muted);
    doc.text(doc.splitTextToSize(cotizacion.notas, 180), 14, y + 20);
  }

  save(doc, `Cotizacion_${cotizacion.numero || cotizacion.cliente}.pdf`);
}

export async function generarReporteHornadasMensual(hornadas: any[], options: ReportOptions = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  header(doc, 'hornada', options.title || 'Reporte mensual de hornadas', options.subtitle || `${hornadas.length} registros`, options);
  let y = 54;
  const totalKg = hornadas.reduce((sum, h) => sum + Number(h.produccionTotal || 0), 0);
  const rendimiento = hornadas.length ? hornadas.reduce((sum, h) => sum + Number(h.rendimiento || 0), 0) / hornadas.length : 0;

  y = keyValueGrid(doc, [
    ['Hornadas', String(hornadas.length)],
    ['Produccion total', `${totalKg} kg`],
    ['Rendimiento promedio', `${rendimiento.toFixed(1)}%`],
    ['Periodo', options.subtitle || '-'],
  ], y);

  if (options.includeDetails !== false) {
    y = table(doc, ['Fecha', 'Hornada', 'Operario', 'Kg', 'Rend.'], hornadas.slice(0, 20).map((h) => [
      h.fecha,
      h.numero,
      h.operario || '-',
      `${h.produccionTotal || 0}`,
      `${Number(h.rendimiento || 0).toFixed(1)}%`,
    ]), y + 6, [28, 38, 58, 28, 30]);
  }

  if (options.includeTotals !== false) {
    totalBand(doc, 'Produccion total', `${totalKg} kg`, y, BRAND.gold);
  }

  save(doc, 'Reporte_hornadas_mensual.pdf');
}
