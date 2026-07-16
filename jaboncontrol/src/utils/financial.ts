import type { Cliente, Venta } from '../types';

export const ventaTotal = (venta: Pick<Venta, 'total' | 'precioTotal'>) => Number(venta.total || venta.precioTotal || 0);

export const ventaSaldoPendiente = (venta: Venta) => {
  if (typeof venta.saldoPendiente === 'number') return Math.max(0, venta.saldoPendiente);
  if (venta.estado === 'pagado' || venta.tipoPago !== 'credito') return 0;
  return ventaTotal(venta);
};

export const ventaCobrado = (venta: Venta) => Math.max(0, ventaTotal(venta) - ventaSaldoPendiente(venta));

export function resumenClienteDesdeVentas(cliente: Cliente, ventas: Venta[]) {
  const ventasCliente = ventas.filter((venta) => venta.cliente === cliente.nombre);
  const ventaTotalCliente = ventasCliente.reduce((sum, venta) => sum + ventaTotal(venta), 0);
  const saldo = ventasCliente.reduce((sum, venta) => sum + ventaSaldoPendiente(venta), 0);
  const cobrado = ventasCliente.reduce((sum, venta) => sum + ventaCobrado(venta), 0);

  return {
    ventasCliente,
    ventaTotal: ventaTotalCliente,
    cobrado,
    saldo,
  };
}
