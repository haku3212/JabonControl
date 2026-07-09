import type { RegistroAcabado, Venta } from '../types';

export const UNIDADES_POR_CAJA = 12;

export function unitsForSale(formato: string, cantidad: number) {
  const normalized = String(formato || '').toLowerCase();
  const multiplier = normalized.includes('caja') ? UNIDADES_POR_CAJA : 1;
  return Math.max(0, Number(cantidad || 0) * multiplier);
}

export function calculateFinishedInventory(acabado: RegistroAcabado[], ventas: Venta[]) {
  const producidas = acabado.reduce((sum, item) => sum + Number(item.piezas || 0), 0);
  const vendidas = ventas.reduce((sum, venta) => sum + unitsForSale(venta.formato, venta.cantidad), 0);
  return {
    producidas,
    vendidas,
    disponibles: Math.max(0, producidas - vendidas),
  };
}
