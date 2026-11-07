const invalid = message => Object.assign(new Error(message), { status: 400 });
const businessDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function validateMovement(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Formulario invalido.');
  const text = (key, max, fallback = '') => {
    const value = body[key] ?? fallback;
    if (typeof value !== 'string' || value.length > max) throw invalid(`${key}: ingrese un texto de hasta ${max} caracteres.`);
    return value.trim();
  };
  if (!['ingreso', 'egreso'].includes(body.tipo)) throw invalid('Seleccione un tipo de movimiento valido.');
  const monto = Number(body.monto);
  if (!Number.isFinite(monto) || monto < 0.01 || monto > 999999999.99 || Math.abs(Math.round(monto * 100) - monto * 100) > 0.0001) throw invalid('Ingrese un monto positivo con un maximo de dos decimales.');
  const fecha = text('fecha', 10, businessDate());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(Date.parse(`${fecha}T00:00:00Z`)) || new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha) throw invalid('Ingrese una fecha valida.');
  const data = { tipo: body.tipo, fecha, monto: Math.round(monto * 100) / 100, concepto: text('concepto', 240), tercero: text('tercero', 160), categoria: text('categoria', 80, 'Sin clasificar'), metodoPago: text('metodoPago', 30), referencia: text('referencia', 120), notas: text('notas', 3000), origen: text('origen', 40, 'manual') };
  if (!data.concepto) throw invalid('El concepto es obligatorio.');
  if (data.metodoPago && !['efectivo', 'transferencia', 'deposito', 'cheque'].includes(data.metodoPago)) throw invalid('Seleccione un metodo de pago valido.');
  if (data.origen === 'compras-gastos' && (!data.tercero || !data.categoria || !data.metodoPago)) throw invalid('Complete beneficiario, categoria y metodo de pago.');
  return data;
}
module.exports = { validateMovement };
