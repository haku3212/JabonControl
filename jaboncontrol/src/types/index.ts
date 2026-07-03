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
    naoh: number;
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
  precioTotal: number;
  tipoPago: 'cancelado' | 'credito';
}

export interface Cobro {
  id: string;
  fecha: string;
  cliente: string;
  montoCobrado: number;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque';
  notasCorrespondientes: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  tipo: 'distribuidor' | 'retailer' | 'consumidor-final';
  telefono: string;
  email?: string;
  ciudad: string;
  direccion: string;
  ventaMes: number;
  cobradoMes: number;
}

export interface Proyecto {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaCulminacion: string;
  responsable: string;
  pasos: {
    id: string;
    descripcion: string;
    completado: boolean;
  }[];
  progreso: number;
}

export interface Stock {
  id: string;
  producto: string;
  unidad: string;
  entradas: number;
  salidasSistema: number;
  salidasReales: number;
  stockActual: number;
}

export interface Tanque {
  id: string;
  nombre: string;
  capacidad: number;
  unidad: string;
  porcentajeLleno: number;
  mermaAcumulada: number;
}

export interface Documento {
  id: string;
  nombre: string;
  categoria: string;
  fechaEmision: string;
  fechaVencimiento: string;
  estado: 'vigente' | 'por-renovar' | 'vencido';
  notas: string;
}

export interface Equipo {
  id: string;
  nombre: string;
  ubicacion: string;
  potencia: string;
  ultimoMantenimiento: string;
  proximoMantenimiento: string;
  estado: 'operativo' | 'revision-pendiente' | 'fuera-servicio';
}

export interface Usuario {
  nombre: string;
  rol: string;
  avatar: string;
}
