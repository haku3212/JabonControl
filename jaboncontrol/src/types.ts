export interface Recepcion {
  id: string;
  fecha: string;
  proveedor: string;
  producto: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  precioTotal: number;
  estado: 'recibido' | 'pendiente' | 'cancelado';
}

export interface Hornada {
  id: string;
  numero: string;
  fecha: string;
  horaInicio: string;
  operario: string;
  ingredientes: {
    naohVolumen: number;
    seboFund: number;
    aceiteQuem: number;
    aceiteCrudo: number;
    aceiteAlmendra: number;
    agua: number;
    jabonRecicl: number;
  };
  produccionTotal: number;
  rendimiento: number;
  observaciones: string;
}

export interface Venta {
  id: string;
  numeroNE: string;
  fecha: string;
  cliente: string;
  formato: string;
  cantidad: number;
  precioUnitario: number;
  total?: number;
  tipoPago: 'credito' | 'contado' | 'transferencia' | 'cancelado';
  precioTotal?: number; // For backward compatibility
}

export interface Cobro {
  id: string;
  fecha: string;
  cliente: string;
  montoCobrado: number;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque';
  notasCorrespondientes: string;
  distribucion?: Array<{
    id: string;
    numeroNE: string;
    fecha: string;
    original: number;
    resto: number;
    aplicado: number;
    saldada: boolean;
  }>;
}

export interface Cliente {
  id: string;
  nombre: string;
  tipo: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  ventaMes: number;
  cobradoMes: number;
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'activo' | 'pausado' | 'completado';
  responsable: string;
  progreso: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface Stock {
  id: string;
  producto: string;
  unidad: string;
  cantidad: number;
  minimo: number;
  maximo: number;
}

export interface DocumentoApp {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  vencimiento: string;
  archivo: string;
  archivoData?: string;
  fechaSubida: string;
}

export interface EquipoApp {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  fechaCompra: string;
  ubicacion: string;
  responsable: string;
  observaciones: string;
}
