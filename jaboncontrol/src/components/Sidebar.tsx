import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePanel: string;
  onNavigate: (panel: string) => void;
}

interface NavItem {
  id: string;
  icon: string;
  label: string;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    ]
  },
  {
    label: 'Producción',
    items: [
      { id: 'materias',  icon: '🧪', label: 'Materias Primas' },
      { id: 'hornadas',  icon: '🔥', label: 'Hornadas' },
      { id: 'acabado',   icon: '📦', label: 'Acabado' },
    ]
  },
  {
    label: 'Comercial',
    items: [
      { id: 'ventas',    icon: '🛒', label: 'Ventas', badge: 3 },
      { id: 'cobros',    icon: '💰', label: 'Cobros' },
      { id: 'clientes',  icon: '👥', label: 'Clientes' },
    ]
  },
  {
    label: 'Gestión',
    items: [
      { id: 'proyectos',     icon: '🏗️', label: 'Proyectos' },
      { id: 'documentacion', icon: '📋', label: 'Documentación' },
      { id: 'equipos',       icon: '⚙️', label: 'Equipos' },
      { id: 'reportes',      icon: '📈', label: 'Reportes' },
    ]
  },
  {
    label: 'Administración',
    items: [
      { id: 'usuarios', icon: '👤', label: 'Usuarios' },
    ]
  }
];

const ROL_LABELS: Record<string, string> = {
  admin:      'ADMINISTRADOR',
  ventas:     'VENTAS',
  produccion: 'PRODUCCIÓN',
  gestion:    'GESTIÓN',
};

export function Sidebar({ activePanel, onNavigate }: SidebarProps) {
  const { usuario, puedeAcceder, logout } = useAuth();

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <aside className="w-56 bg-dark-surface border-r border-dark-border flex flex-col h-screen overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-dark-border">
        <div className="text-2xl font-bebas font-bold text-accent-yellow tracking-wider">
          JabonControl
        </div>
        <div className="text-xs font-mono text-text-tertiary tracking-widest mt-1">
          SISTEMA DE GESTIÓN
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0">
        {sections.map((section, idx) => {
          const visibles = section.items.filter(item => puedeAcceder(item.id));
          if (visibles.length === 0) return null;
          return (
            <div key={idx} className="py-2 border-b border-dark-border">
              <div className="px-4 py-1.5 text-xs font-mono text-text-tertiary tracking-widest uppercase">
                {section.label}
              </div>
              {visibles.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-all border-l-[3px] ${
                    activePanel === item.id
                      ? 'bg-dark-surface2 text-accent-yellow border-accent-yellow'
                      : 'text-text-secondary border-transparent hover:bg-dark-surface2 hover:text-text-primary'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-accent-orange text-white text-xs font-mono px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-dark-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-accent-yellow text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="text-xs leading-tight min-w-0">
            <div className="font-medium truncate">{usuario?.nombre || 'Usuario'}</div>
            <div className="text-text-tertiary font-mono text-[9px]">
              {ROL_LABELS[usuario?.rol || ''] || usuario?.rol?.toUpperCase()}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-xs text-text-tertiary hover:text-status-danger transition-colors text-left px-1 py-0.5 font-mono"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}
