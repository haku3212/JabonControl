/**
 * Payment Service - Pasarela de Pago para Bolivia
 * Soporta: Mercado Pago y transferencia manual
 */

export interface BankAccount {
  banco: string;
  titular: string;
  cuenta: string;
  ci: string;
  telefono?: string;
}

export interface PaymentData {
  monto: number;
  cliente: string;
  referencia: string; // NE o nÃºmero de cobro
  fecha: string;
  banco: string;
}

/**
 * Datos para trasferencia manual a mostrar en factura
 */
export function generarInstruccionesTransferencia(
  monto: number,
  referencia: string,
  cuenta: BankAccount
): string {
  return `
INSTRUCCIONES DE PAGO:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Banco: ${cuenta.banco}
Titular: ${cuenta.titular}
Cuenta: ${cuenta.cuenta}
CI: ${cuenta.ci}

Monto: Bs ${monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
Referencia: ${referencia}

DespuÃ©s de realizar la transferencia,
confirme con: ${cuenta.telefono || '+591 xxxxxxxx'}
`;
}

/**
 * URL para Mercado Pago (si lo implementas despuÃ©s)
 * Requiere: access_token + integration con API
 */
export function generarURLMercadoPago(
  accessToken: string,
  monto: number,
  referencia: string,
  email: string
): string {
  // Esto es un ejemplo - necesitarÃ­as implementar la API completa
  // Ver: https://developers.mercadopago.com/es/reference/payments/_payments_post
  const baseURL = 'https://api.mercadopago.com/v1/payments';
  return baseURL; // Placeholder
}

/**
 * Generar nÃºmero de transacciÃ³n Ãºnico
 */
export function generarTransactionID(): string {
  return `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Validar que se recibiÃ³ el pago (simulado)
 * En producciÃ³n: consultar API del banco
 */
export async function verificarPago(
  transactionID: string,
  montoEsperado: number
): Promise<{ confirmado: boolean; fecha?: string; mensaje: string }> {
  // SimulaciÃ³n
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    confirmado: Math.random() > 0.5, // Simulado
    fecha: new Date().toISOString(),
    mensaje: 'VerificaciÃ³n pendiente - consultar directamente con el banco',
  };
}

/**
 * Datos de bancos en Bolivia (ejemplo)
 */
export const BANCOS_BOLIVIA: Record<string, BankAccount> = {
  'Banco Mercantil': {
    banco: 'Banco Mercantil Santa Cruz',
    titular: 'JabonerÃ­a Control SRL',
    cuenta: '12345678901234',
    ci: '1234567',
    telefono: '+591 76543210',
  },
  'BNB': {
    banco: 'Banco Nacional de Bolivia',
    titular: 'JabonerÃ­a Control SRL',
    cuenta: '98765432109876',
    ci: '1234567',
    telefono: '+591 76543210',
  },
  'Banco Santa Cruz': {
    banco: 'Banco de Santa Cruz',
    titular: 'JabonerÃ­a Control SRL',
    cuenta: '55555555555555',
    ci: '1234567',
    telefono: '+591 76543210',
  },
};

/**
 * IntegraciÃ³n futura con Mercado Pago
 * Se configura con variables de entorno en .env.local
 */
export const MERCADO_PAGO_CONFIG = {
  accessToken: '', // Configurar en .env.local: VITE_MERCADO_PAGO_TOKEN
  publicKey: '', // Configurar en .env.local: VITE_MERCADO_PAGO_PUBLIC_KEY
  enabled: false, // Habilitar cuando tengas credenciales
};

