import { createContext, useContext, useState, ReactNode } from 'react';
import {
  Recepcion,
  Hornada,
  Venta,
  Cobro,
  Cliente,
  Proyecto,
  Stock,
} from '../types';

interface AppContextType {
  // Data
  recepciones: Recepcion[];
  hornadas: Hornada[];
  ventas: Venta[];
  cobros: Cobro[];
  clientes: Cliente[];
  proyectos: Proyecto[];
  stocks: Stock[];

  // Actions
  addRecepcion: (data: Recepcion) => void;
  addHornada: (data: Hornada) => void;
  addVenta: (data: Venta) => void;
  addCobro: (data: Cobro) => void;
  addCliente: (data: Cliente) => void;
  addProyecto: (data: Proyecto) => void;

  deleteRecepcion: (id: string) => void;
  deleteHornada: (id: string) => void;
  deleteVenta: (id: string) => void;

  // Stats
  kpis: {
    produccionHoy: number;
    stockJabon: number;
    ventasMes: number;
    cobrosPendientes: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialRecepcion: Recepcion[] = [
  {
    id: '1',
    fecha: '2026-06-01',
    proveedor: 'QuimBolivia',
    producto: 'NaOH 25kg',
    cantidad: 20,
    unidad: 'bolsas',
    precioUnitario: 85,
    precioTotal: 1700,
    estado: 'recibido',
  },
  {
    id: '2',
    fecha: '2026-05-30',
    proveedor: 'Aceites del Sur',
    producto: 'Aceite quemado',
    cantidad: 500,
    unidad: 'kg',
    precioUnitario: 3.2,
    precioTotal: 1600,
    estado: 'recibido',
  },
];

const initialHornadas: Hornada[] = [
  {
    id: '1',
    numero: 'H-2026-042',
    fecha: '2026-06-02',
    horaInicio: '07:30',
    operario: 'Carlos M.',
    ingredientes: {
      naohVolumen: 8,
      seboFund: 120,
      aceiteQuem: 80,
      aceiteCrudo: 40,
      aceiteAlmendra: 20,
      agua: 180,
      jabonRecicl: 15,
    },
    produccionTotal: 284,
    rendimiento: 98.2,
    observaciones: 'Sin novedades',
  },
];

const initialVentas: Venta[] = [
  {
    id: '1',
    numeroNE: 'NE-0042',
    fecha: '2026-06-02',
    cliente: 'Distribuidora Litoral',
    formato: 'Cajas',
    cantidad: 120,
    precioUnitario: 20,
    total: 2400,
    precioTotal: 2400,
    tipoPago: 'contado',
  },
  {
    id: '2',
    numeroNE: 'NE-0041',
    fecha: '2026-06-02',
    cliente: 'Supermercado El Sol',
    formato: 'Nódulos',
    cantidad: 80,
    precioUnitario: 20,
    total: 1600,
    precioTotal: 1600,
    tipoPago: 'credito',
  },
];

const initialCobros: Cobro[] = [
  {
    id: '1',
    fecha: '2026-06-02',
    cliente: 'Distribuidora Litoral',
    montoCobrado: 2400,
    metodoPago: 'transferencia',
    notasCorrespondientes: 'NE-0042',
  },
];

const initialClientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Distribuidora Litoral',
    tipo: 'distribuidor',
    telefono: '+591 12345678',
    ciudad: 'Santa Cruz',
    direccion: 'Calle Principal 123',
    ventaMes: 8400,
    cobradoMes: 8400,
  },
  {
    id: '2',
    nombre: 'Supermercado El Sol',
    tipo: 'retailer',
    telefono: '+591 87654321',
    ciudad: 'La Paz',
    direccion: 'Avenida Central 456',
    ventaMes: 4800,
    cobradoMes: 3200,
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [recepciones, setRecepciones] = useState<Recepcion[]>(initialRecepcion);
  const [hornadas, setHornadas] = useState<Hornada[]>(initialHornadas);
  const [ventas, setVentas] = useState<Venta[]>(initialVentas);
  const [cobros, setCobros] = useState<Cobro[]>(initialCobros);
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [stocks] = useState<Stock[]>([]);

  const addRecepcion = (data: Recepcion) => {
    setRecepciones([...recepciones, { ...data, id: Date.now().toString() }]);
  };

  const addHornada = (data: Hornada) => {
    setHornadas([...hornadas, { ...data, id: Date.now().toString() }]);
  };

  const addVenta = (data: Venta) => {
    // Si el cliente de la venta no existe, agregarlo automáticamente
    const clienteExiste = clientes.some(c => c.nombre === data.cliente);
    if (!clienteExiste && data.cliente) {
      setClientes([...clientes, {
        id: Date.now().toString(),
        nombre: data.cliente,
        tipo: 'distribuidor',
        telefono: '',
        ciudad: '',
        direccion: '',
        ventaMes: data.total || 0,
        cobradoMes: 0,
      }]);
    }
    setVentas([...ventas, { ...data, id: Date.now().toString() }]);
  };

  const addCobro = (data: Cobro) => {
    setCobros([...cobros, { ...data, id: Date.now().toString() }]);
  };

  const addCliente = (data: Cliente) => {
    setClientes([...clientes, { ...data, id: Date.now().toString() }]);
  };

  const addProyecto = (data: Proyecto) => {
    setProyectos([...proyectos, { ...data, id: Date.now().toString() }]);
  };

  const deleteRecepcion = (id: string) => {
    setRecepciones(recepciones.filter((r) => r.id !== id));
  };

  const deleteHornada = (id: string) => {
    setHornadas(hornadas.filter((h) => h.id !== id));
  };

  const deleteVenta = (id: string) => {
    setVentas(ventas.filter((v) => v.id !== id));
  };

  const kpis = {
    produccionHoy: hornadas.reduce((sum, h) => sum + h.produccionTotal, 0),
    stockJabon: 4210,
    ventasMes: ventas.reduce((sum, v) => sum + (v.total || v.precioTotal || 0), 0),
    cobrosPendientes: ventas
      .filter((v) => v.tipoPago === 'credito')
      .reduce((sum, v) => sum + (v.total || v.precioTotal || 0), 0),
  };

  const value: AppContextType = {
    recepciones,
    hornadas,
    ventas,
    cobros,
    clientes,
    proyectos,
    stocks,
    addRecepcion,
    addHornada,
    addVenta,
    addCobro,
    addCliente,
    addProyecto,
    deleteRecepcion,
    deleteHornada,
    deleteVenta,
    kpis,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de AppProvider');
  }
  return context;
}
