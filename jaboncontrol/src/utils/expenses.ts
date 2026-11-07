export interface Gasto {
  id?: string;
  fecha: string;
  tipo: 'egreso';
  categoria: string;
  concepto: string;
  tercero: string;
  metodoPago: string;
  referencia: string;
  monto: number;
  origen?: string;
  notas?: string;
  requestId?: string;
}
export const expenseCategories = ['Compras', 'Materia prima', 'Empaque', 'Transporte', 'Servicios', 'Gastos administrativos', 'Mantenimiento', 'Otros'];
export const paymentMethods: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', deposito: 'Deposito', cheque: 'Cheque' };
export const expenseMoney = (value: number) => `Bs ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const expenseToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function expenseError(error: unknown, fallback: string): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  return !message || /failed to fetch|fetch failed|load failed|networkerror/i.test(message) ? fallback : message;
}
export function parseExpenseAmount(text: string): number | null {
  const value = text.trim();
  const grouped = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(value);
  if (!grouped && !/^\d+(?:[.,]\d{1,2})?$/.test(value)) return null;
  const number = Number((grouped ? value.replace(/\./g, '') : value).replace(',', '.'));
  return Number.isFinite(number) && number >= 0.01 && number <= 999999999.99 ? Math.round(number * 100) / 100 : null;
}
export function newExpense(): Gasto {
  return { requestId: crypto.randomUUID(), fecha: expenseToday(), tipo: 'egreso', categoria: 'Compras', concepto: '', tercero: '', metodoPago: 'efectivo', referencia: '', monto: 0, origen: 'compras-gastos', notas: '' };
}
