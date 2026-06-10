import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  Recepcion,
  Hornada,
  Venta,
  Cobro,
  Cliente,
  Proyecto,
  Stock,
  DocumentoApp,
  EquipoApp,
} from '../types';
import { ventasService, clientesService, hornadasService, cobrosService, materiasService } from '../services/api';

interface AppContextType {
  // Data
  recepciones: Recepcion[];
  hornadas: Hornada[];
  ventas: Venta[];
  cobros: Cobro[];
  clientes: Cliente[];
  proyectos: Proyecto[];
  stocks: Stock[];
  documentos: DocumentoApp[];
  equipos: EquipoApp[];

  // Actions
  addRecepcion: (data: Recepcion) => void;
  addHornada: (data: Hornada) => void;
  addVenta: (data: Venta) => void;
  addCobro: (data: Cobro) => void;
  addCliente: (data: Cliente) => void;
  addProyecto: (data: Proyecto) => void;
  addDocumento: (data: DocumentoApp) => void;
  addEquipo: (data: EquipoApp) => void;

  deleteRecepcion: (id: string) => void;
  deleteHornada: (id: string) => void;
  deleteVenta: (id: string) => void;
  deleteProyecto: (id: string) => void;
  deleteDocumento: (id: string) => void;
  deleteEquipo: (id: string) => void;

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
  const [proyectos, setProyectos] = useState<Proyecto[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jc_proyectos') || '[]');
    } catch { return []; }
  });
  const [stocks] = useState<Stock[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoApp[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jc_documentos') || '[]');
    } catch { return []; }
  });
  const [equipos, setEquipos] = useState<EquipoApp[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jc_equipos') || '[]');
    } catch { return []; }
  });

  // Persistir en localStorage (sobreviven recargas de página)
  useEffect(() => {
    try {
      localStorage.setItem('jc_proyectos', JSON.stringify(proyectos));
    } catch (e) { console.log('⚠️ No se pudo persistir proyectos:', e); }
  }, [proyectos]);

  useEffect(() => {
    try {
      localStorage.setItem('jc_documentos', JSON.stringify(documentos));
    } catch (e) { console.log('⚠️ No se pudo persistir documentos (¿archivo muy grande?):', e); }
  }, [documentos]);

  useEffect(() => {
    try {
      localStorage.setItem('jc_equipos', JSON.stringify(equipos));
    } catch (e) { console.log('⚠️ No se pudo persistir equipos:', e); }
  }, [equipos]);

  // Cargar datos del API al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [ventasData, clientesData, hornadasData, cobrosData, materiasData] = await Promise.allSettled([
          ventasService.listar(),
          clientesService.listar(),
          hornadasService.listar(),
          cobrosService.listar(),
          materiasService.listar(),
        ]);

        // Si la API responde exitosamente, actualizar los datos
        if (ventasData.status === 'fulfilled') setVentas(ventasData.value);
        if (clientesData.status === 'fulfilled') setClientes(clientesData.value);
        if (hornadasData.status === 'fulfilled') setHornadas(hornadasData.value);
        if (cobrosData.status === 'fulfilled') setCobros(cobrosData.value);
        if (materiasData.status === 'fulfilled') setRecepciones(materiasData.value);

        console.log('✅ Datos cargados desde el API');
      } catch (error) {
        console.log('⚠️ Usando datos mock - No se puede conectar al API:', error);
        // Mantener los datos iniciales si falla
      }
    };

    cargarDatos();
  }, []);

  const addRecepcion = async (data: Recepcion) => {
    // Agregar localmente primero
    const dataConId = { ...data, id: data.id || Date.now().toString() };
    setRecepciones([...recepciones, dataConId]);

    // Luego guardar en API en background
    try {
      await materiasService.crear(data);
    } catch (error) {
      console.log('⚠️ Error al guardar en API:', error);
    }
  };

  const addHornada = async (data: Hornada) => {
    // Agregar localmente primero
    const dataConId = { ...data, id: data.id || Date.now().toString() };
    setHornadas([...hornadas, dataConId]);

    // Luego guardar en API en background
    try {
      await hornadasService.crear(data);
    } catch (error) {
      console.log('⚠️ Error al guardar en API:', error);
    }
  };

  const addVenta = async (data: Venta) => {
    // Agregar localmente primero
    const dataConId = { ...data, id: data.id || Date.now().toString() };
    setVentas([...ventas, dataConId]);

    // Si el cliente de la venta no existe, agregarlo automáticamente
    const clienteExiste = clientes.some(c => c.nombre === data.cliente);
    if (!clienteExiste && data.cliente) {
      const newCliente = {
        id: Date.now().toString(),
        nombre: data.cliente,
        tipo: 'distribuidor',
        telefono: '',
        ciudad: '',
        direccion: '',
        ventaMes: data.total || 0,
        cobradoMes: 0,
      };
      setClientes([...clientes, newCliente]);

      // Guardar cliente en API en background
      clientesService.crear(newCliente).catch(err =>
        console.log('⚠️ Error al guardar cliente:', err)
      );
    }

    // Luego guardar venta en API en background
    try {
      await ventasService.crear(data);
    } catch (error) {
      console.log('⚠️ Error al guardar en API:', error);
    }
  };

  const addCobro = async (data: Cobro) => {
    // Agregar localmente primero (respuesta inmediata)
    const dataConId = { ...data, id: data.id || Date.now().toString() };
    setCobros([...cobros, dataConId]);

    // Luego intentar guardar en API en background
    try {
      await cobrosService.crear(data);
    } catch (error) {
      console.log('⚠️ Error al guardar en API, usando datos locales:', error);
    }
  };

  const addCliente = async (data: Cliente) => {
    // Agregar localmente primero
    const dataConId = { ...data, id: data.id || Date.now().toString() };
    setClientes([...clientes, dataConId]);

    // Luego guardar en API en background
    try {
      await clientesService.crear(data);
    } catch (error) {
      console.log('⚠️ Error al guardar cliente en API:', error);
    }
  };

  const addProyecto = (data: Proyecto) => {
    setProyectos([...proyectos, { ...data, id: data.id || Date.now().toString() }]);
  };

  const addDocumento = (data: DocumentoApp) => {
    setDocumentos([...documentos, { ...data, id: data.id || Date.now().toString() }]);
  };

  const addEquipo = (data: EquipoApp) => {
    setEquipos([...equipos, { ...data, id: data.id || Date.now().toString() }]);
  };

  const deleteProyecto = (id: string) => {
    setProyectos(proyectos.filter((p) => p.id !== id));
  };

  const deleteDocumento = (id: string) => {
    setDocumentos(documentos.filter((d) => d.id !== id));
  };

  const deleteEquipo = (id: string) => {
    setEquipos(equipos.filter((e) => e.id !== id));
  };

  const deleteRecepcion = async (id: string) => {
    try {
      await materiasService.eliminar(id);
      setRecepciones(recepciones.filter((r) => r.id !== id));
    } catch (error) {
      console.log('⚠️ Eliminando de datos locales:', error);
      setRecepciones(recepciones.filter((r) => r.id !== id));
    }
  };

  const deleteHornada = async (id: string) => {
    try {
      await hornadasService.eliminar(id);
      setHornadas(hornadas.filter((h) => h.id !== id));
    } catch (error) {
      console.log('⚠️ Eliminando de datos locales:', error);
      setHornadas(hornadas.filter((h) => h.id !== id));
    }
  };

  const deleteVenta = async (id: string) => {
    try {
      await ventasService.eliminar(id);
      setVentas(ventas.filter((v) => v.id !== id));
    } catch (error) {
      console.log('⚠️ Eliminando de datos locales:', error);
      setVentas(ventas.filter((v) => v.id !== id));
    }
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
    documentos,
    equipos,
    addRecepcion,
    addHornada,
    addVenta,
    addCobro,
    addCliente,
    addProyecto,
    addDocumento,
    addEquipo,
    deleteRecepcion,
    deleteHornada,
    deleteVenta,
    deleteProyecto,
    deleteDocumento,
    deleteEquipo,
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
