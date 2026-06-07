import { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Modal } from './components/common/Modal';
import { Notification } from './components/common/Notification';
import { Dashboard } from './components/panels/Dashboard';
import { MateriasPrimas } from './components/panels/MateriasPrimas';
import { Hornadas } from './components/panels/Hornadas';
import { Acabado } from './components/panels/Acabado';
import { Ventas } from './components/panels/Ventas';
import { Cobros } from './components/panels/Cobros';
import { Clientes } from './components/panels/Clientes';
import { Proyectos } from './components/panels/Proyectos';
import { Documentacion } from './components/panels/Documentacion';
import { Equipos } from './components/panels/Equipos';
import { Reportes } from './components/panels/Reportes';
import { VentaForm } from './components/forms/VentaForm';
import { ClienteForm } from './components/forms/ClienteForm';
import { HornadaForm } from './components/forms/HornadaForm';
import { RecepcionForm } from './components/forms/RecepcionForm';
import { CobroForm } from './components/forms/CobroForm';

const panelTitles: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'INICIO / DASHBOARD'],
  materias: ['Materias Primas', 'PRODUCCIÓN / MATERIAS PRIMAS'],
  hornadas: ['Hornadas', 'PRODUCCIÓN / HORNADAS'],
  acabado: ['Acabado', 'PRODUCCIÓN / ACABADO'],
  ventas: ['Ventas', 'COMERCIAL / VENTAS'],
  cobros: ['Cobros', 'COMERCIAL / COBROS'],
  clientes: ['Clientes', 'COMERCIAL / CLIENTES'],
  proyectos: ['Proyectos', 'GESTIÓN / PROYECTOS'],
  documentacion: ['Documentación', 'GESTIÓN / DOCUMENTACIÓN'],
  equipos: ['Equipos', 'GESTIÓN / EQUIPOS'],
  reportes: ['Reportes', 'GESTIÓN / REPORTES'],
};

const modalTitles: Record<string, string> = {
  venta: 'Nueva Nota de Entrega',
  cliente: 'Nuevo Cliente',
  hornada: 'Registrar Nueva Hornada',
  recepcion: 'Nueva Recepción de Materia Prima',
  cobro: 'Registrar Cobro',
};

function AppContent() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [modalType, setModalType] = useState<string | null>(null);
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const { addVenta, addCliente, addHornada, addRecepcion, addCobro } = useAppContext();

  const handleNavigate = (panel: string) => {
    setActivePanel(panel);
  };

  const handleNewClick = () => {
    // Mapeo de panel activo a tipo de modal
    const panelToModal: Record<string, string> = {
      ventas: 'venta',
      clientes: 'cliente',
      hornadas: 'hornada',
      materias: 'recepcion',
      cobros: 'cobro',
    };
    const modal = panelToModal[activePanel];
    if (modal) {
      setModalType(modal);
    } else {
      showNotificationMsg(`ℹ️ El formulario para ${activePanel} aún no está disponible`);
    }
  };

  const showNotificationMsg = (msg: string) => {
    setNotification(msg);
    setShowNotification(true);
  };

  const handleSaveVenta = (data: any) => {
    addVenta(data);
    setModalType(null);
    showNotificationMsg('✅ Venta registrada correctamente');
  };

  const handleSaveCliente = (data: any) => {
    addCliente(data);
    setModalType(null);
    showNotificationMsg('✅ Cliente registrado correctamente');
  };

  const handleSaveHornada = (data: any) => {
    addHornada(data);
    setModalType(null);
    showNotificationMsg('✅ Hornada registrada correctamente');
  };

  const handleSaveRecepcion = (data: any) => {
    addRecepcion(data);
    setModalType(null);
    showNotificationMsg('✅ Recepción registrada correctamente');
  };

  const handleSaveCobro = (data: any) => {
    addCobro(data);
    setModalType(null);
    showNotificationMsg('✅ Cobro registrado correctamente');
  };

  const [title, breadcrumb] = panelTitles[activePanel] || ['Dashboard', 'INICIO / DASHBOARD'];

  const panelComponents: Record<string, JSX.Element> = {
    dashboard: <Dashboard />,
    materias: <MateriasPrimas onNewClick={() => setModalType('recepcion')} />,
    hornadas: <Hornadas onNewClick={() => setModalType('hornada')} />,
    acabado: <Acabado />,
    ventas: <Ventas onNewClick={() => setModalType('venta')} />,
    cobros: <Cobros onNewClick={() => setModalType('cobro')} />,
    clientes: <Clientes onNewClick={() => setModalType('cliente')} />,
    proyectos: <Proyectos />,
    documentacion: <Documentacion />,
    equipos: <Equipos />,
    reportes: <Reportes />,
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      <Sidebar activePanel={activePanel} onNavigate={handleNavigate} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} breadcrumb={breadcrumb} onNewClick={handleNewClick} />

        <main className="flex-1 overflow-y-auto p-6">
          {panelComponents[activePanel] || <Dashboard />}
        </main>
      </div>

      {/* Modal con formularios específicos */}
      <Modal
        isOpen={modalType !== null}
        title={modalType ? modalTitles[modalType] || 'Nuevo Registro' : ''}
        onClose={() => setModalType(null)}
      >
        {modalType === 'venta' && (
          <VentaForm onSave={handleSaveVenta} onCancel={() => setModalType(null)} />
        )}
        {modalType === 'cliente' && (
          <ClienteForm onSave={handleSaveCliente} onCancel={() => setModalType(null)} />
        )}
        {modalType === 'hornada' && (
          <HornadaForm onSave={handleSaveHornada} onCancel={() => setModalType(null)} />
        )}
        {modalType === 'recepcion' && (
          <RecepcionForm onSave={handleSaveRecepcion} onCancel={() => setModalType(null)} />
        )}
        {modalType === 'cobro' && (
          <CobroForm onSave={handleSaveCobro} onCancel={() => setModalType(null)} />
        )}
      </Modal>

      <Notification
        message={notification}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
