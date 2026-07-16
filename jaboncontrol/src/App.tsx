import { useState, useEffect } from 'react';
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
import { Finanzas } from './components/panels/Finanzas';
import { Proyectos } from './components/panels/Proyectos';
import { Contactos } from './components/panels/Contactos';
import { Documentacion } from './components/panels/Documentacion';
import { Equipos } from './components/panels/Equipos';
import { Reportes } from './components/panels/Reportes';
import { Usuarios } from './components/panels/Usuarios';
import { Auditoria } from './components/panels/Auditoria';
import { VentaForm } from './components/forms/VentaForm';
import { ClienteForm } from './components/forms/ClienteForm';
import { HornadaForm } from './components/forms/HornadaForm';
import { RecepcionForm } from './components/forms/RecepcionForm';
import { CobroForm } from './components/forms/CobroForm';
import { ProyectoForm } from './components/forms/ProyectoForm';
import { EquipoForm } from './components/forms/EquipoForm';
import { DocumentoForm } from './components/forms/DocumentoForm';
import { Recibo } from './components/Recibo';
import { Login } from './components/Login';
import { canAccessPanel, canCreateInPanel, visiblePanels } from './utils/permissions';
import { authService } from './services/api';

const panelTitles: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'INICIO / DASHBOARD'],
  materias: ['Materias Primas', 'PRODUCCIÓN / MATERIAS PRIMAS'],
  hornadas: ['Hornadas', 'PRODUCCIÓN / HORNADAS'],
  acabado: ['Acabado', 'PRODUCCIÓN / ACABADO'],
  ventas: ['Ventas', 'COMERCIAL / VENTAS'],
  cobros: ['Cobros', 'COMERCIAL / COBROS'],
  clientes: ['Clientes', 'COMERCIAL / CLIENTES'],
  finanzas: ['Finanzas', 'FINANZAS / FLUJO DE CAJA'],
  proyectos: ['Proyectos', 'GESTIÓN / PROYECTOS'],
  contactos: ['Contactos', 'GESTIÓN / CONTACTOS'],
  documentacion: ['Documentación', 'GESTIÓN / DOCUMENTACIÓN'],
  equipos: ['Equipos', 'GESTIÓN / EQUIPOS'],
  reportes: ['Reportes', 'GESTIÓN / REPORTES'],
  usuarios: ['Usuarios', 'ADMIN / USUARIOS'],
  auditoria: ['Auditoria', 'ADMIN / HISTORIAL'],
};

const modalTitles: Record<string, string> = {
  venta: 'Nueva Nota de Entrega',
  cliente: 'Nuevo Cliente',
  hornada: 'Registrar Nueva Hornada',
  recepcion: 'Nueva Recepción de Materia Prima',
  cobro: 'Registrar Cobro',
  proyecto: 'Nuevo Proyecto',
  equipo: 'Nuevo Equipo',
  documento: 'Subir Documento',
};

function AppContent({ user, onLogout }: { user: { id: string; nombre: string; usuario: string; rol: string }; onLogout?: () => void }) {
  const [activePanel, setActivePanel] = useState(() => Array.from(visiblePanels(user.rol))[0] || 'dashboard');
  const [modalType, setModalType] = useState<string | null>(null);
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reciboData, setReciboData] = useState<any>(null);
  const { addVenta, addCliente, addHornada, addRecepcion, addCobro, addProyecto, addEquipo, addDocumento } = useAppContext();

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!canAccessPanel(user.rol, activePanel)) {
      setActivePanel(Array.from(visiblePanels(user.rol))[0] || 'dashboard');
    }
  }, [activePanel, user.rol]);

  const handleNavigate = (panel: string) => {
    if (!canAccessPanel(user.rol, panel)) {
      showNotificationMsg('No tienes permiso para abrir este modulo.');
      return;
    }
    setActivePanel(panel);
  };

  const handleNewClick = () => {
    if (!canCreateInPanel(user.rol, activePanel)) {
      showNotificationMsg('Tu rol no puede crear registros en este modulo.');
      return;
    }
    // Mapeo de panel activo a tipo de modal
    const panelToModal: Record<string, string> = {
      ventas: 'venta',
      clientes: 'cliente',
      hornadas: 'hornada',
      materias: 'recepcion',
      cobros: 'cobro',
      proyectos: 'proyecto',
      equipos: 'equipo',
      documentacion: 'documento',
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

  const handleSaveVenta = async (data: any) => {
    try {
      await addVenta(data);
      setModalType(null);
      showNotificationMsg('✅ Venta registrada correctamente');
    } catch (error) {
      showNotificationMsg('❌ Error al guardar la venta');
    }
  };

  const handleSaveCliente = async (data: any) => {
    try {
      await addCliente(data);
      setModalType(null);
      showNotificationMsg('✅ Cliente registrado correctamente');
    } catch (error) {
      showNotificationMsg('❌ Error al guardar el cliente');
    }
  };

  const handleSaveHornada = async (data: any) => {
    try {
      await addHornada(data);
      setModalType(null);
      showNotificationMsg('✅ Hornada registrada correctamente');
    } catch (error) {
      showNotificationMsg('❌ Error al guardar la hornada');
    }
  };

  const handleSaveRecepcion = async (data: any) => {
    try {
      await addRecepcion(data);
      setModalType(null);
      showNotificationMsg('✅ Recepción registrada correctamente');
    } catch (error) {
      showNotificationMsg('❌ Error al guardar la recepción');
    }
  };

  const handleSaveCobro = async (data: any) => {
    try {
      await addCobro(data);
      setModalType(null);

      // Generar número de recibo
      const numeroRecibo = `RCP-${Date.now().toString().slice(-6)}`;

      // Mostrar recibo
      setReciboData({
        ...data,
        numeroRecibo,
      });

      showNotificationMsg('✅ Cobro registrado - Recibo generado');
    } catch (error) {
      showNotificationMsg('❌ Error al guardar el cobro');
    }
  };

  const handleSaveProyecto = async (data: any) => {
    try {
      addProyecto({ progreso: 0, ...data });
      setModalType(null);
      showNotificationMsg('✅ Proyecto registrado correctamente');
    } catch (error) {
      showNotificationMsg('❌ Error al guardar el proyecto');
    }
  };

  const handleSaveEquipo = async (data: any) => {
    try {
      addEquipo(data);
      setModalType(null);
      showNotificationMsg('✅ Equipo registrado correctamente');
    } catch (error) {
      showNotificationMsg('❌ Error al guardar el equipo');
    }
  };

  const handleSaveDocumento = async (data: any) => {
    try {
      addDocumento(data);
      setModalType(null);
      showNotificationMsg('✅ Documento guardado correctamente');
    } catch (error) {
      showNotificationMsg('❌ Error al guardar el documento');
    }
  };

  const [title, breadcrumb] = panelTitles[activePanel] || ['Dashboard', 'INICIO / DASHBOARD'];
  const isAdmin = user.rol === 'admin';
  const hasAccess = canAccessPanel(user.rol, activePanel);

  const panelComponents: Record<string, JSX.Element> = {
    dashboard: <Dashboard />,
    materias: <MateriasPrimas onNewClick={() => setModalType('recepcion')} />,
    hornadas: <Hornadas onNewClick={() => setModalType('hornada')} />,
    acabado: <Acabado />,
    ventas: <Ventas onNewClick={() => setModalType('venta')} />,
    cobros: <Cobros onNewClick={() => setModalType('cobro')} />,
    clientes: <Clientes onNewClick={() => setModalType('cliente')} />,
    finanzas: <Finanzas />,
    proyectos: <Proyectos />,
    contactos: <Contactos />,
    documentacion: <Documentacion onNewClick={() => setModalType('documento')} />,
    equipos: <Equipos onNewClick={() => setModalType('equipo')} />,
    reportes: <Reportes />,
    ...(isAdmin ? {
      usuarios: <Usuarios />,
      auditoria: <Auditoria />,
    } : {}),
  };

  return (
    <div className="flex h-screen bg-dark-bg flex-col md:flex-row">
      {/* Sidebar - Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`${
          isMobile
            ? `fixed top-0 left-0 h-screen z-40 transform transition-transform ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'static'
        } w-56 md:w-56`}
      >
        <Sidebar user={user} activePanel={activePanel} onNavigate={(panel) => {
          handleNavigate(panel);
          if (isMobile) setSidebarOpen(false);
        }} />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <Topbar
          title={title}
          breadcrumb={breadcrumb}
          onNewClick={handleNewClick}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
          onLogout={onLogout}
          user={user}
          canCreate={canCreateInPanel(user.rol, activePanel)}
        />

        {/* El padding baja en movil para aprovechar mejor el ancho disponible. */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {hasAccess ? (panelComponents[activePanel] || <Dashboard />) : (
            <div className="bg-dark-surface border border-dark-border rounded-lg p-8 text-center text-text-secondary">
              No tienes permiso para ver este modulo.
            </div>
          )}
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
        {modalType === 'proyecto' && (
          <ProyectoForm onSave={handleSaveProyecto} onCancel={() => setModalType(null)} />
        )}
        {modalType === 'equipo' && (
          <EquipoForm onSave={handleSaveEquipo} onCancel={() => setModalType(null)} />
        )}
        {modalType === 'documento' && (
          <DocumentoForm onSave={handleSaveDocumento} onCancel={() => setModalType(null)} />
        )}
      </Modal>

      {/* Modal Recibo */}
      {reciboData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-2xl my-8">
            <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between sticky top-0 bg-dark-surface z-10">
              <h2 className="text-xl font-bebas text-text-primary tracking-wider">
                Recibo de Pago
              </h2>
              <button
                onClick={() => setReciboData(null)}
                className="text-text-tertiary hover:text-text-primary text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-dark-surface2 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
              <Recibo
                cliente={reciboData.cliente}
                montoCobrado={reciboData.montoCobrado}
                metodoPago={reciboData.metodoPago}
                fecha={reciboData.fecha}
                notasCorrespondientes={reciboData.notasCorrespondientes}
                numeroRecibo={reciboData.numeroRecibo}
              />
            </div>
          </div>
        </div>
      )}

      <Notification
        message={notification}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}

export function App() {
  const [user, setUser] = useState<{ id: string; nombre: string; usuario: string; rol: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('jc_user') || 'null');
    } catch {
      return null;
    }
  });
  const [checkingSession, setCheckingSession] = useState(Boolean(user));

  useEffect(() => {
    let active = true;

    const clearSession = () => {
      localStorage.removeItem('jc_user');
      sessionStorage.removeItem('jc_token');
      setUser(null);
      setCheckingSession(false);
    };

    window.addEventListener('jc:auth-expired', clearSession);

    if (!user) {
      setCheckingSession(false);
      return () => window.removeEventListener('jc:auth-expired', clearSession);
    }

    authService.verificar()
      .then((response) => {
        if (!active) return;
        if (response.user) {
          localStorage.setItem('jc_user', JSON.stringify(response.user));
          setUser(response.user);
        }
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
      window.removeEventListener('jc:auth-expired', clearSession);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Aunque el backend no responda, cerramos la sesion visualmente en este navegador.
    }
    localStorage.removeItem('jc_user');
    sessionStorage.removeItem('jc_token');
    setUser(null);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center text-text-secondary text-sm">
        Verificando sesion...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <AppProvider>
      <AppContent user={user} onLogout={handleLogout} />
    </AppProvider>
  );
}
