const UNIDADES_POR_CAJA = 50;

function unitsForSale(formato, cantidad, unidadesPorCaja = UNIDADES_POR_CAJA) {
  const normalized = String(formato || '').toLowerCase();
  const multiplier = normalized.includes('caja') ? Number(unidadesPorCaja || UNIDADES_POR_CAJA) : 1;
  return Math.max(0, Number(cantidad || 0) * multiplier);
}

function parsePayload(row) {
  try {
    return JSON.parse(row.payload || '{}');
  } catch {
    return {};
  }
}

async function getFinishedInventory(dbModule) {
  const acabadoRows = await dbModule.all("SELECT payload FROM app_records WHERE modulo = 'acabado'");
  const ventas = await dbModule.all('SELECT formato, cantidad, unidadesPorCaja FROM ventas');
  const producidas = acabadoRows
    .map(parsePayload)
    .reduce((sum, item) => sum + Number(item.piezas || 0), 0);
  const vendidas = ventas.reduce((sum, venta) => sum + unitsForSale(venta.formato, venta.cantidad, venta.unidadesPorCaja), 0);

  return {
    producidas,
    vendidas,
    disponibles: Math.max(0, producidas - vendidas),
  };
}

module.exports = {
  UNIDADES_POR_CAJA,
  unitsForSale,
  getFinishedInventory,
};
