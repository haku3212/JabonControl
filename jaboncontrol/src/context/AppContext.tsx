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
  RegistroAcabado,
  ContactoEmpresa,
  Cotizacion,
  SeguimientoComercial,
} from '../types';
import {
  ventasService,
  clientesService,
  hornadasService,
  cobrosService,
  materiasService,
  proyectosService,
  documentosService,
  equiposService,
  acabadoService,
  contactosService,
  cotizacionesService,
  seguimientosService,
} from '../services/api';
import { calculateFinishedInventory, unitsForSale } from '../utils/inventory';
import { ventaSaldoPendiente, ventaTotal } from '../utils/financial';

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
  acabado: RegistroAcabado[];
  contactos: ContactoEmpresa[];
  cotizaciones: Cotizacion[];
  seguimientos: SeguimientoComercial[];

  // Actions
  addRecepcion: (data: Recepcion) => void;
  addHornada: (data: Hornada) => void;
  addVenta: (data: Venta) => void;
  addCobro: (data: Cobro) => void;
  addCliente: (data: Cliente) => void;
  addProyecto: (data: Proyecto) => Promise<void>;
  addDocumento: (data: DocumentoApp) => Promise<void>;
  addEquipo: (data: EquipoApp) => Promise<void>;
  addAcabado: (data: RegistroAcabado) => Promise<void>;
  addContacto: (data: ContactoEmpresa) => Promise<void>;
  addCotizacion: (data: Cotizacion) => Promise<void>;
  addSeguimiento: (data: SeguimientoComercial) => Promise<void>;
  updateCliente: (id: string, data: Cliente) => void;
  updateVenta: (id: string, data: Venta) => void;
  updateCobro: (id: string, data: Cobro) => void;
  updateProyecto: (id: string, data: Proyecto) => void;
  updateDocumento: (id: string, data: DocumentoApp) => void;
  updateEquipo: (id: string, data: EquipoApp) => void;
  updateAcabado: (id: string, data: RegistroAcabado) => void;
  updateContacto: (id: string, data: ContactoEmpresa) => void;
  updateCotizacion: (id: string, data: Cotizacion) => void;
  updateSeguimiento: (id: string, data: SeguimientoComercial) => void;

  deleteRecepcion: (id: string) => void;
  deleteHornada: (id: string) => void;
  deleteVenta: (id: string) => void;
  deleteProyecto: (id: string) => void;
  deleteDocumento: (id: string) => void;
  deleteEquipo: (id: string) => void;
  deleteAcabado: (id: string) => void;
  deleteContacto: (id: string) => void;
  deleteCotizacion: (id: string) => void;
  deleteSeguimiento: (id: string) => void;

  // Stats
  kpis: {
    produccionHoy: number;
    stockJabon: number;
    ventasMes: number;
    cobrosPendientes: number;
    inventarioDisponible: number;
    inventarioProducido: number;
    inventarioVendido: number;
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
  {
    id: '3',
    fecha: '2026-06-03',
    proveedor: 'Recolectores Beni',
    producto: 'Almendra podrida',
    cantidad: 160,
    unidad: 'kg',
    precioUnitario: 2.8,
    precioTotal: 448,
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
    unidadesPorCaja: 50,
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
    unidadesPorCaja: 1,
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
    email: 'ventas@litoral.com.bo',
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
    email: 'compras@elsol.com.bo',
    ciudad: 'La Paz',
    direccion: 'Avenida Central 456',
    ventaMes: 4800,
    cobradoMes: 3200,
  },
];

const demoProyectos: Proyecto[] = [
  {
    id: 'demo-proj-1',
    nombre: 'Implementar control financiero',
    descripcion: 'Centralizar ventas, cobros, gastos y flujo de caja en una sola vista.',
    estado: 'activo',
    responsable: 'Administracion',
    progreso: 50,
    fechaInicio: '2026-07-01',
    fechaFin: '2026-07-18',
    presupuesto: 4500,
    tareas: [
      { id: 'p1-t1', texto: 'Definir categorias de gastos', completada: true },
      { id: 'p1-t2', texto: 'Importar movimientos desde Excel', completada: true },
      { id: 'p1-t3', texto: 'Validar resumen mensual', completada: false },
      { id: 'p1-t4', texto: 'Exportar reporte financiero', completada: false },
    ],
  },
  {
    id: 'demo-proj-2',
    nombre: 'Mantenimiento preventivo de equipos',
    descripcion: 'Organizar revisiones de selladora, compresora y mezcladores.',
    estado: 'activo',
    responsable: 'Jefe de planta',
    progreso: 40,
    fechaInicio: '2026-07-03',
    fechaFin: '2026-07-25',
    presupuesto: 2800,
    tareas: [
      { id: 'p2-t1', texto: 'Revisar compresora principal', completada: true },
      { id: 'p2-t2', texto: 'Cambiar resistencia de selladora', completada: false },
      { id: 'p2-t3', texto: 'Registrar repuestos utilizados', completada: false },
    ],
  },
  {
    id: 'demo-proj-3',
    nombre: 'Estandarizar hornadas',
    descripcion: 'Reducir variacion de rendimiento y documentar receta operativa.',
    estado: 'pausado',
    responsable: 'Produccion',
    progreso: 30,
    fechaInicio: '2026-06-20',
    fechaFin: '2026-08-05',
    presupuesto: 1600,
    tareas: [
      { id: 'p3-t1', texto: 'Comparar ultimas 10 hornadas', completada: true },
      { id: 'p3-t2', texto: 'Definir rango ideal de temperatura', completada: false },
      { id: 'p3-t3', texto: 'Capacitar operarios', completada: false },
    ],
  },
  {
    id: 'demo-proj-4',
    nombre: 'Renovar documentacion ambiental',
    descripcion: 'Actualizar permisos, certificados y respaldos verificables.',
    estado: 'activo',
    responsable: 'Gerencia',
    progreso: 65,
    fechaInicio: '2026-07-02',
    fechaFin: '2026-07-30',
    presupuesto: 3200,
    tareas: [
      { id: 'p4-t1', texto: 'Subir licencia ambiental vigente', completada: true },
      { id: 'p4-t2', texto: 'Adjuntar informe de efluentes', completada: true },
      { id: 'p4-t3', texto: 'Preparar respaldo de verificacion', completada: false },
    ],
  },
  {
    id: 'demo-proj-5',
    nombre: 'Plan comercial regional',
    descripcion: 'Organizar ventas por cliente y mejorar recuperacion de credito.',
    estado: 'activo',
    responsable: 'Ventas',
    progreso: 25,
    fechaInicio: '2026-07-05',
    fechaFin: '2026-08-15',
    presupuesto: 5200,
    tareas: [
      { id: 'p5-t1', texto: 'Clasificar clientes por deuda', completada: false },
      { id: 'p5-t2', texto: 'Definir visitas semanales', completada: true },
      { id: 'p5-t3', texto: 'Actualizar lista de precios', completada: false },
    ],
  },
  {
    id: 'demo-proj-6',
    nombre: 'Mejora de empaque',
    descripcion: 'Evaluar nuevos diseños de caja, etiqueta y presentacion.',
    estado: 'completado',
    responsable: 'Calidad',
    progreso: 100,
    fechaInicio: '2026-06-01',
    fechaFin: '2026-06-28',
    presupuesto: 2100,
    tareas: [
      { id: 'p6-t1', texto: 'Probar etiqueta resistente a humedad', completada: true },
      { id: 'p6-t2', texto: 'Validar caja con distribuidor', completada: true },
      { id: 'p6-t3', texto: 'Aprobar arte final', completada: true },
    ],
  },
];

const demoEquipos: EquipoApp[] = [
  { id: 'demo-eq-1', nombre: 'Compresora principal', tipo: 'otro', estado: 'operativo', fechaCompra: '2024-03-10', ubicacion: 'Area de acabado', responsable: 'Pedro Gutierrez', observaciones: 'Revision trimestral programada.', especificaciones: 'Potencia: 7.5 HP\nPresion: 120 PSI\nVoltaje: 220V trifasico\nCapacidad tanque: 300 L' },
  { id: 'demo-eq-2', nombre: 'Selladora horizontal', tipo: 'empacadora', estado: 'mantenimiento', fechaCompra: '2023-11-18', ubicacion: 'Linea de sellado', responsable: 'Ana Ruiz', observaciones: 'Requiere cambio de resistencia.', especificaciones: 'Potencia: 2.2 kW\nAncho sellado: 12 mm\nVoltaje: 220V\nMaterial: acero inoxidable' },
  { id: 'demo-eq-3', nombre: 'Mezclador 1000L', tipo: 'mezclador', estado: 'operativo', fechaCompra: '2022-05-05', ubicacion: 'Planta baja', responsable: 'Carlos Mendoza', observaciones: 'Funcionamiento estable.', especificaciones: 'Capacidad: 1000 L\nMotor: 5 HP\nRPM: 60\nMaterial: acero inoxidable' },
  { id: 'demo-eq-4', nombre: 'Bascula industrial', tipo: 'bascula', estado: 'operativo', fechaCompra: '2025-01-14', ubicacion: 'Almacen', responsable: 'Rosa Vargas', observaciones: 'Calibrada en junio.', especificaciones: 'Capacidad: 1000 kg\nPrecision: 100 g\nPlataforma: 1.2 x 1.2 m\nCertificacion: vigente' },
  { id: 'demo-eq-5', nombre: 'Horno auxiliar', tipo: 'horno', estado: 'reparacion', fechaCompra: '2021-09-30', ubicacion: 'Produccion', responsable: 'Tecnico externo', observaciones: 'Pendiente repuesto.', especificaciones: 'Capacidad: 500 kg\nQuemador: gas\nTemperatura max: 180 C\nControl: manual' },
  { id: 'demo-eq-6', nombre: 'Etiquetadora manual', tipo: 'empacadora', estado: 'operativo', fechaCompra: '2024-08-22', ubicacion: 'Empaque', responsable: 'Equipo de acabado', observaciones: 'Uso diario.', especificaciones: 'Ancho etiqueta: 20-120 mm\nVelocidad: manual\nMaterial: acero pintado\nUso: envases y cajas' },
];

const demoDocumentos: DocumentoApp[] = [
  { id: 'demo-doc-1', nombre: 'Licencia ambiental municipal', tipo: 'permiso', descripcion: 'Permiso vigente de operacion ambiental.', vencimiento: '2026-12-31', archivo: 'licencia_ambiental.pdf', fechaSubida: '2026-07-01' },
  { id: 'demo-doc-2', nombre: 'Ficha tecnica NaOH', tipo: 'ficha-tecnica', descripcion: 'Hoja tecnica y seguridad de soda caustica.', vencimiento: '', archivo: 'ficha_naoh.pdf', fechaSubida: '2026-07-01' },
  { id: 'demo-doc-3', nombre: 'Certificado aceite almendra', tipo: 'ficha-tecnica', descripcion: 'Certificado de proveedor Amazon Nuts.', vencimiento: '2026-11-15', archivo: 'certificado_aceite.pdf', fechaSubida: '2026-07-02' },
  { id: 'demo-doc-4', nombre: 'Registro sanitario', tipo: 'permiso', descripcion: 'Documento de habilitacion sanitaria.', vencimiento: '2026-08-20', archivo: 'registro_sanitario.pdf', fechaSubida: '2026-07-02' },
  { id: 'demo-doc-5', nombre: 'Manual compresora', tipo: 'otro', descripcion: 'Manual operativo del equipo.', vencimiento: '', archivo: 'manual_compresora.pdf', fechaSubida: '2026-07-03' },
  { id: 'demo-doc-6', nombre: 'Informe efluentes junio', tipo: 'otro', descripcion: 'Monitoreo ambiental mensual.', vencimiento: '', archivo: 'efluentes_junio.xlsx', fechaSubida: '2026-07-03' },
];

const demoAcabado: RegistroAcabado[] = [
  { id: 'demo-aca-1', fecha: '2026-07-01', area: 'compresora', operarios: 'Pedro G., Ana R.', piezas: 1200, bandejas: 24, kilos: 480, observaciones: 'Turno normal' },
  { id: 'demo-aca-2', fecha: '2026-07-01', area: 'sellado', operarios: 'Rosa V., Miguel P.', piezas: 980, bandejas: 20, kilos: 392, observaciones: 'Sellado de cajas lote NE-1001' },
  { id: 'demo-aca-3', fecha: '2026-07-02', area: 'compresora', operarios: 'Carlos M., Pedro G.', piezas: 1350, bandejas: 27, kilos: 540, observaciones: 'Buen rendimiento' },
  { id: 'demo-aca-4', fecha: '2026-07-02', area: 'sellado', operarios: 'Ana R., Rosa V.', piezas: 1110, bandejas: 22, kilos: 444, observaciones: 'Empaque para cliente Comercial Norte' },
  { id: 'demo-aca-5', fecha: '2026-07-03', area: 'compresora', operarios: 'Miguel P., Carlos M.', piezas: 1280, bandejas: 26, kilos: 512, observaciones: 'Revisar limpieza final' },
  { id: 'demo-aca-6', fecha: '2026-07-03', area: 'sellado', operarios: 'Pedro G., Rosa V.', piezas: 1040, bandejas: 21, kilos: 416, observaciones: 'Sin novedades' },
];

const demoContactos: ContactoEmpresa[] = [
  { id: 'demo-con-1', nombre: 'Resinas del Oriente', empresa: 'Resinas del Oriente SRL', categoria: 'Insumos tecnicos', proveedorDe: 'Resina cationica para ablandador de agua', telefono: '+591 72110001', email: 'ventas@resinasoriente.bo', ubicacion: 'Santa Cruz', direccion: 'Parque industrial, modulo 4', personaContacto: 'Marco Alvarez', notas: 'Consultar disponibilidad por bolsa de 25 L.', estado: 'activo', fechaRegistro: '2026-07-15' },
  { id: 'demo-con-2', nombre: 'Calderos Bolivia', empresa: 'Calderos Bolivia', categoria: 'Repuestos', proveedorDe: 'Valvulas, manometros y quemadores para calderos', telefono: '+591 72110002', email: 'servicio@calderosbo.com', ubicacion: 'Cochabamba', direccion: 'Av. Blanco Galindo km 6', personaContacto: 'Ing. Patricia Rojas', notas: 'Atiende emergencias con tecnico externo.', estado: 'activo', fechaRegistro: '2026-07-15' },
  { id: 'demo-con-3', nombre: 'Quimicos Norte', empresa: 'Quimicos Norte', categoria: 'Materia prima', proveedorDe: 'Soda caustica, indicadores y reactivos', telefono: '+591 72110003', email: 'pedidos@quimicosnorte.bo', ubicacion: 'La Paz', direccion: 'Zona Villa Fatima, calle 8', personaContacto: 'Daniel Paredes', notas: 'Pedir ficha tecnica actualizada.', estado: 'activo', fechaRegistro: '2026-07-15' },
  { id: 'demo-con-4', nombre: 'Tecnico Calderista Luis', empresa: 'Servicio independiente', categoria: 'Servicio tecnico', proveedorDe: 'Mantenimiento preventivo de calderos', telefono: '+591 72110004', email: '', ubicacion: 'Santa Cruz', direccion: 'Atencion a domicilio', personaContacto: 'Luis Vargas', notas: 'Disponible fines de semana con recargo.', estado: 'activo', fechaRegistro: '2026-07-15' },
  { id: 'demo-con-5', nombre: 'Empaques Amazonas', empresa: 'Empaques Amazonas', categoria: 'Empaque', proveedorDe: 'Cajas, bolsas y etiquetas', telefono: '+591 72110005', email: 'comercial@empaquesamazonas.bo', ubicacion: 'Trinidad', direccion: 'Zona mercado industrial', personaContacto: 'Ruth Cabrera', notas: 'Maneja cajas personalizadas por millar.', estado: 'activo', fechaRegistro: '2026-07-15' },
  { id: 'demo-con-6', nombre: 'Transporte Beni', empresa: 'Transportes Beni', categoria: 'Logistica', proveedorDe: 'Transporte de insumos y producto terminado', telefono: '+591 72110006', email: '', ubicacion: 'Beni', direccion: 'Terminal de carga', personaContacto: 'Oscar Menacho', notas: 'Confirmar ruta con 24 horas de anticipacion.', estado: 'inactivo', fechaRegistro: '2026-07-15' },
];

const demoCotizaciones: Cotizacion[] = [
  {
    id: 'demo-cot-1',
    numero: 'COT-2026-001',
    fecha: '2026-07-10',
    cliente: 'Supermercado El Sol',
    estado: 'enviada',
    validezDias: 15,
    responsable: 'Ventas',
    notas: 'Cotizacion para reposicion mensual.',
    items: [
      { id: 'cot-1-i1', descripcion: 'Jabon en caja x50 pastas', cantidad: 40, precioUnitario: 95 },
      { id: 'cot-1-i2', descripcion: 'Jabon por unidad', cantidad: 120, precioUnitario: 2 },
    ],
    total: 4040,
  },
  {
    id: 'demo-cot-2',
    numero: 'COT-2026-002',
    fecha: '2026-07-12',
    cliente: 'Distribuidora Litoral',
    estado: 'aceptada',
    validezDias: 10,
    responsable: 'Administracion',
    notas: 'Pedido aprobado para entrega parcial.',
    items: [
      { id: 'cot-2-i1', descripcion: 'Jabon industrial caja x50', cantidad: 80, precioUnitario: 90 },
    ],
    total: 7200,
  },
];

const demoSeguimientos: SeguimientoComercial[] = [
  { id: 'demo-seg-1', cliente: 'Supermercado El Sol', tipo: 'cobro', asunto: 'Confirmar pago parcial pendiente', fecha: '2026-07-18', responsable: 'Ventas', estado: 'pendiente', prioridad: 'alta', notas: 'Tiene saldo pendiente, llamar antes del mediodia.' },
  { id: 'demo-seg-2', cliente: 'Distribuidora Litoral', tipo: 'llamada', asunto: 'Validar recompra de agosto', fecha: '2026-07-20', responsable: 'Administracion', estado: 'en_proceso', prioridad: 'media', notas: 'Cliente frecuente, preguntar volumen estimado.' },
  { id: 'demo-seg-3', cliente: 'Supermercado El Sol', tipo: 'cotizacion', asunto: 'Dar seguimiento a COT-2026-001', fecha: '2026-07-17', responsable: 'Ventas', estado: 'pendiente', prioridad: 'media', notas: 'Esperar respuesta del area de compras.' },
];

const mergeDemo = <T extends { id: string }>(saved: T[], demo: T[]) => {
  const savedIds = new Set(saved.map((item) => item.id));
  return [...saved, ...demo.filter((item) => !savedIds.has(item.id))];
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [recepciones, setRecepciones] = useState<Recepcion[]>(initialRecepcion);
  const [hornadas, setHornadas] = useState<Hornada[]>(initialHornadas);
  const [ventas, setVentas] = useState<Venta[]>(initialVentas);
  const [cobros, setCobros] = useState<Cobro[]>(initialCobros);
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [proyectos, setProyectos] = useState<Proyecto[]>(demoProyectos);
  const [stocks] = useState<Stock[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoApp[]>(demoDocumentos);
  const [equipos, setEquipos] = useState<EquipoApp[]>(demoEquipos);
  const [acabado, setAcabado] = useState<RegistroAcabado[]>(demoAcabado);
  const [contactos, setContactos] = useState<ContactoEmpresa[]>(demoContactos);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(demoCotizaciones);
  const [seguimientos, setSeguimientos] = useState<SeguimientoComercial[]>(demoSeguimientos);


  // Cargar datos del API al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [ventasData, clientesData, hornadasData, cobrosData, materiasData, proyectosData, documentosData, equiposData, acabadoData, contactosData, cotizacionesData, seguimientosData] = await Promise.allSettled([
          ventasService.listar(),
          clientesService.listar(),
          hornadasService.listar(),
          cobrosService.listar(),
          materiasService.listar(),
          proyectosService.listar(),
          documentosService.listar(),
          equiposService.listar(),
          acabadoService.listar(),
          contactosService.listar(),
          cotizacionesService.listar(),
          seguimientosService.listar(),
        ]);

        // Si la API responde exitosamente, actualizar los datos
        if (ventasData.status === 'fulfilled') setVentas(ventasData.value);
        if (clientesData.status === 'fulfilled') setClientes(clientesData.value);
        if (hornadasData.status === 'fulfilled') setHornadas(hornadasData.value);
        if (cobrosData.status === 'fulfilled') setCobros(cobrosData.value);
        if (materiasData.status === 'fulfilled') setRecepciones(materiasData.value);
        if (proyectosData.status === 'fulfilled') {
          setProyectos(mergeDemo(proyectosData.value, demoProyectos));
          const savedProjectIds = new Set(proyectosData.value.map((item: Proyecto) => item.id));
          demoProyectos
            .filter((item) => !savedProjectIds.has(item.id))
            .forEach((item) => proyectosService.crear(item).catch(() => {}));
        }
        if (documentosData.status === 'fulfilled') {
          setDocumentos(mergeDemo(documentosData.value, demoDocumentos));
          if (documentosData.value.length === 0) demoDocumentos.forEach((item) => documentosService.crear(item).catch(() => {}));
        }
        if (equiposData.status === 'fulfilled') {
          setEquipos(mergeDemo(equiposData.value, demoEquipos));
          if (equiposData.value.length === 0) demoEquipos.forEach((item) => equiposService.crear(item).catch(() => {}));
        }
        if (acabadoData.status === 'fulfilled') {
          setAcabado(mergeDemo(acabadoData.value, demoAcabado));
          if (acabadoData.value.length === 0) demoAcabado.forEach((item) => acabadoService.crear(item).catch(() => {}));
        }
        if (contactosData.status === 'fulfilled') {
          setContactos(mergeDemo(contactosData.value, demoContactos));
          if (contactosData.value.length === 0) demoContactos.forEach((item) => contactosService.crear(item).catch(() => {}));
        }
        if (cotizacionesData.status === 'fulfilled') {
          setCotizaciones(mergeDemo(cotizacionesData.value, demoCotizaciones));
          if (cotizacionesData.value.length === 0) demoCotizaciones.forEach((item) => cotizacionesService.crear(item).catch(() => {}));
        }
        if (seguimientosData.status === 'fulfilled') {
          setSeguimientos(mergeDemo(seguimientosData.value, demoSeguimientos));
          if (seguimientosData.value.length === 0) demoSeguimientos.forEach((item) => seguimientosService.crear(item).catch(() => {}));
        }

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
    const inventario = calculateFinishedInventory(acabado, ventas);
    const unidadesSolicitadas = unitsForSale(data.formato, data.cantidad, data.unidadesPorCaja);
    if (unidadesSolicitadas > inventario.disponibles) {
      throw new Error(`Stock insuficiente. Disponible: ${inventario.disponibles} unidades.`);
    }

    // Agregar localmente primero
    const totalVenta = ventaTotal(data);
    const dataConId = {
      ...data,
      id: data.id || Date.now().toString(),
      total: data.total ?? data.precioTotal ?? 0,
      precioTotal: data.precioTotal ?? data.total ?? 0,
      saldoPendiente: data.saldoPendiente ?? (data.tipoPago === 'credito' ? totalVenta : 0),
      estado: data.estado || (data.tipoPago === 'credito' ? 'pendiente' : 'pagado'),
    };
    setVentas([...ventas, dataConId]);

    // Si el cliente de la venta no existe, agregarlo automáticamente
    const clienteExiste = clientes.some(c => c.nombre === data.cliente);
    if (!clienteExiste && data.cliente) {
      const newCliente = {
        id: Date.now().toString(),
        nombre: data.cliente,
        tipo: 'distribuidor',
        telefono: '',
        email: '',
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
      await ventasService.crear(dataConId);
    } catch (error) {
      console.log('⚠️ Error al guardar en API:', error);
    }
  };

  const addCobro = async (data: Cobro & { distribucion?: { id: string; aplicado: number }[] }) => {
    // Agregar localmente primero (respuesta inmediata)
    const dataConId = { ...data, id: data.id || Date.now().toString() };
    setCobros([...cobros, dataConId]);

    // Descontar los saldos de las ventas afectadas (FIFO local)
    if (data.distribucion && data.distribucion.length > 0) {
      const aplicados = new Map(data.distribucion.map((d) => [d.id, d.aplicado]));
      setVentas(ventas.map((v) => {
        const aplicado = aplicados.get(v.id);
        if (!aplicado) return v;
        const saldoActual = ventaSaldoPendiente(v);
        const nuevoSaldo = Math.max(0, Math.round((saldoActual - aplicado) * 100) / 100);
        return {
          ...v,
          saldoPendiente: nuevoSaldo,
          estado: nuevoSaldo <= 0 ? 'pagado' : 'parcial',
        };
      }));
    }

    // Luego guardar en API en background (el backend aplica el mismo FIFO en la BD)
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

  const updateCliente = async (id: string, data: Cliente) => {
    const previous = clientes.find((cliente) => cliente.id === id);
    setClientes(clientes.map((cliente) => (cliente.id === id ? { ...cliente, ...data, id } : cliente)));

    try {
      await clientesService.actualizar(id, data);
    } catch (error) {
      console.log('Error al actualizar cliente en API:', error);
      if (previous) {
        setClientes(clientes.map((cliente) => (cliente.id === id ? previous : cliente)));
      }
    }
  };

  const addProyecto = async (data: Proyecto) => {
    const nuevo = { ...data, id: data.id || Date.now().toString() };
    const previous = proyectos;
    setProyectos([...proyectos, nuevo]);
    try {
      await proyectosService.crear(nuevo);
    } catch (error) {
      console.log('Error al guardar proyecto en API:', error);
      setProyectos(previous);
      throw error;
    }
  };

  const addDocumento = async (data: DocumentoApp) => {
    const nuevo = { ...data, id: data.id || Date.now().toString() };
    const previous = documentos;
    setDocumentos([...documentos, nuevo]);
    try {
      await documentosService.crear(nuevo);
    } catch (error) {
      console.log('Error al guardar documento en API:', error);
      setDocumentos(previous);
      throw error;
    }
  };

  const addEquipo = async (data: EquipoApp) => {
    const nuevo = { ...data, id: data.id || Date.now().toString() };
    const previous = equipos;
    setEquipos([...equipos, nuevo]);
    try {
      await equiposService.crear(nuevo);
    } catch (error) {
      console.log('Error al guardar equipo en API:', error);
      setEquipos(previous);
      throw error;
    }
  };

  const updateVenta = async (id: string, data: Venta) => {
    const previous = ventas;
    setVentas(ventas.map((item) => item.id === id ? { ...item, ...data } : item));
    try {
      await ventasService.actualizar(id, data);
      setVentas(await ventasService.listar());
    } catch (error) {
      console.log('Error al actualizar venta en API:', error);
      setVentas(previous);
      throw error;
    }
  };

  const updateCobro = async (id: string, data: Cobro) => {
    const previousCobros = cobros;
    const previousVentas = ventas;
    setCobros(cobros.map((item) => item.id === id ? { ...item, ...data } : item));
    try {
      await cobrosService.actualizar(id, data);
      const [ventasActualizadas, cobrosActualizados] = await Promise.all([
        ventasService.listar(),
        cobrosService.listar(),
      ]);
      setVentas(ventasActualizadas);
      setCobros(cobrosActualizados);
    } catch (error) {
      console.log('Error al actualizar cobro en API:', error);
      setCobros(previousCobros);
      setVentas(previousVentas);
      throw error;
    }
  };

  const addAcabado = async (data: RegistroAcabado) => {
    const nuevo = { ...data, id: data.id || Date.now().toString() };
    const previous = acabado;
    setAcabado([nuevo, ...acabado]);
    try {
      await acabadoService.crear(nuevo);
    } catch (error) {
      console.log('Error al guardar acabado en API:', error);
      setAcabado(previous);
      throw error;
    }
  };

  const addContacto = async (data: ContactoEmpresa) => {
    const nuevo = { ...data, id: data.id || Date.now().toString() };
    const previous = contactos;
    setContactos([nuevo, ...contactos]);
    try {
      await contactosService.crear(nuevo);
    } catch (error) {
      console.log('Error al guardar contacto en API:', error);
      setContactos(previous);
      throw error;
    }
  };

  const addCotizacion = async (data: Cotizacion) => {
    const nuevo = { ...data, id: data.id || Date.now().toString() };
    const previous = cotizaciones;
    setCotizaciones([nuevo, ...cotizaciones]);
    try {
      await cotizacionesService.crear(nuevo);
    } catch (error) {
      console.log('Error al guardar cotizacion en API:', error);
      setCotizaciones(previous);
      throw error;
    }
  };

  const addSeguimiento = async (data: SeguimientoComercial) => {
    const nuevo = { ...data, id: data.id || Date.now().toString() };
    const previous = seguimientos;
    setSeguimientos([nuevo, ...seguimientos]);
    try {
      await seguimientosService.crear(nuevo);
    } catch (error) {
      console.log('Error al guardar seguimiento en API:', error);
      setSeguimientos(previous);
      throw error;
    }
  };

  const updateProyecto = async (id: string, data: Proyecto) => {
    const previous = proyectos.find((p) => p.id === id);
    setProyectos(proyectos.map((p) => (p.id === id ? { ...p, ...data, id } : p)));
    try {
      await proyectosService.actualizar(id, { ...data, id });
    } catch (error: any) {
      console.log('Error al actualizar proyecto en API:', error);
      if (String(error?.message || '').includes('Registro no encontrado')) {
        try {
          await proyectosService.crear({ ...data, id });
          return;
        } catch (createError) {
          console.log('Error al crear proyecto faltante en API:', createError);
        }
      }
      if (previous) setProyectos(proyectos.map((p) => (p.id === id ? previous : p)));
      throw error;
    }
  };

  const updateDocumento = async (id: string, data: DocumentoApp) => {
    const previous = documentos.find((d) => d.id === id);
    setDocumentos(documentos.map((d) => (d.id === id ? { ...d, ...data, id } : d)));
    try {
      await documentosService.actualizar(id, { ...data, id });
    } catch (error) {
      console.log('Error al actualizar documento en API:', error);
      if (previous) setDocumentos(documentos.map((d) => (d.id === id ? previous : d)));
      throw error;
    }
  };

  const updateEquipo = async (id: string, data: EquipoApp) => {
    const previous = equipos.find((e) => e.id === id);
    setEquipos(equipos.map((e) => (e.id === id ? { ...e, ...data, id } : e)));
    try {
      await equiposService.actualizar(id, { ...data, id });
    } catch (error) {
      console.log('Error al actualizar equipo en API:', error);
      if (previous) setEquipos(equipos.map((e) => (e.id === id ? previous : e)));
      throw error;
    }
  };

  const updateAcabado = async (id: string, data: RegistroAcabado) => {
    const previous = acabado.find((item) => item.id === id);
    setAcabado(acabado.map((item) => (item.id === id ? { ...item, ...data, id } : item)));
    try {
      await acabadoService.actualizar(id, { ...data, id });
    } catch (error) {
      console.log('Error al actualizar acabado en API:', error);
      if (previous) setAcabado(acabado.map((item) => (item.id === id ? previous : item)));
      throw error;
    }
  };

  const updateContacto = async (id: string, data: ContactoEmpresa) => {
    const previous = contactos.find((item) => item.id === id);
    setContactos(contactos.map((item) => (item.id === id ? { ...item, ...data, id } : item)));
    try {
      await contactosService.actualizar(id, { ...data, id });
    } catch (error) {
      console.log('Error al actualizar contacto en API:', error);
      if (previous) setContactos(contactos.map((item) => (item.id === id ? previous : item)));
      throw error;
    }
  };

  const updateCotizacion = async (id: string, data: Cotizacion) => {
    const previous = cotizaciones.find((item) => item.id === id);
    setCotizaciones(cotizaciones.map((item) => (item.id === id ? { ...item, ...data, id } : item)));
    try {
      await cotizacionesService.actualizar(id, { ...data, id });
    } catch (error) {
      console.log('Error al actualizar cotizacion en API:', error);
      if (previous) setCotizaciones(cotizaciones.map((item) => (item.id === id ? previous : item)));
      throw error;
    }
  };

  const updateSeguimiento = async (id: string, data: SeguimientoComercial) => {
    const previous = seguimientos.find((item) => item.id === id);
    setSeguimientos(seguimientos.map((item) => (item.id === id ? { ...item, ...data, id } : item)));
    try {
      await seguimientosService.actualizar(id, { ...data, id });
    } catch (error) {
      console.log('Error al actualizar seguimiento en API:', error);
      if (previous) setSeguimientos(seguimientos.map((item) => (item.id === id ? previous : item)));
      throw error;
    }
  };

  const deleteProyecto = async (id: string) => {
    const previous = proyectos;
    setProyectos(proyectos.filter((p) => p.id !== id));
    try {
      await proyectosService.eliminar(id);
    } catch (error: any) {
      console.log('Error al eliminar proyecto en API:', error);
      if (String(error?.message || '').includes('Registro no encontrado')) {
        return;
      }
      setProyectos(previous);
    }
  };

  const deleteDocumento = async (id: string) => {
    const previous = documentos;
    setDocumentos(documentos.filter((d) => d.id !== id));
    try {
      await documentosService.eliminar(id);
    } catch (error) {
      console.log('Error al eliminar documento en API:', error);
      setDocumentos(previous);
    }
  };

  const deleteEquipo = async (id: string) => {
    const previous = equipos;
    setEquipos(equipos.filter((e) => e.id !== id));
    try {
      await equiposService.eliminar(id);
    } catch (error) {
      console.log('Error al eliminar equipo en API:', error);
      setEquipos(previous);
    }
  };

  const deleteAcabado = async (id: string) => {
    const previous = acabado;
    setAcabado(acabado.filter((item) => item.id !== id));
    try {
      await acabadoService.eliminar(id);
    } catch (error) {
      console.log('Error al eliminar acabado en API:', error);
      setAcabado(previous);
    }
  };

  const deleteContacto = async (id: string) => {
    const previous = contactos;
    setContactos(contactos.filter((item) => item.id !== id));
    try {
      await contactosService.eliminar(id);
    } catch (error) {
      console.log('Error al eliminar contacto en API:', error);
      setContactos(previous);
    }
  };

  const deleteCotizacion = async (id: string) => {
    const previous = cotizaciones;
    setCotizaciones(cotizaciones.filter((item) => item.id !== id));
    try {
      await cotizacionesService.eliminar(id);
    } catch (error) {
      console.log('Error al eliminar cotizacion en API:', error);
      setCotizaciones(previous);
    }
  };

  const deleteSeguimiento = async (id: string) => {
    const previous = seguimientos;
    setSeguimientos(seguimientos.filter((item) => item.id !== id));
    try {
      await seguimientosService.eliminar(id);
    } catch (error) {
      console.log('Error al eliminar seguimiento en API:', error);
      setSeguimientos(previous);
    }
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

  const inventario = calculateFinishedInventory(acabado, ventas);

  const kpis = {
    produccionHoy: hornadas.reduce((sum, h) => sum + h.produccionTotal, 0),
    stockJabon: inventario.disponibles,
    ventasMes: ventas.reduce((sum, v) => sum + (v.total || v.precioTotal || 0), 0),
    cobrosPendientes: ventas.reduce((sum, v) => sum + ventaSaldoPendiente(v), 0),
    inventarioDisponible: inventario.disponibles,
    inventarioProducido: inventario.producidas,
    inventarioVendido: inventario.vendidas,
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
    acabado,
    contactos,
    cotizaciones,
    seguimientos,
    addRecepcion,
    addHornada,
    addVenta,
    addCobro,
    addCliente,
    addProyecto,
    addDocumento,
    addEquipo,
    addAcabado,
    addContacto,
    addCotizacion,
    addSeguimiento,
    updateCliente,
    updateVenta,
    updateCobro,
    updateProyecto,
    updateDocumento,
    updateEquipo,
    updateAcabado,
    updateContacto,
    updateCotizacion,
    updateSeguimiento,
    deleteRecepcion,
    deleteHornada,
    deleteVenta,
    deleteProyecto,
    deleteDocumento,
    deleteEquipo,
    deleteAcabado,
    deleteContacto,
    deleteCotizacion,
    deleteSeguimiento,
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
