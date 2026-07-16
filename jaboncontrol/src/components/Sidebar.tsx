import { visiblePanels } from '../utils/permissions';

interface SidebarProps {
  user: { nombre: string; usuario: string; rol: string };
  activePanel: string;
  onNavigate: (panel: string) => void;
}

interface NavSection {
  label: string;
  items: Array<{
    id: string;
    icon: IconKey;
    label: string;
    badge?: number;
  }>;
}

type IconKey =
  | 'dashboard'
  | 'flask'
  | 'flame'
  | 'package'
  | 'cart'
  | 'wallet'
  | 'users'
  | 'finance'
  | 'projects'
  | 'contacts'
  | 'documents'
  | 'equipment'
  | 'reports'
  | 'shield'
  | 'audit';

const baseSections: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Produccion',
    items: [
      { id: 'materias', icon: 'flask', label: 'Materias Primas' },
      { id: 'hornadas', icon: 'flame', label: 'Hornadas' },
      { id: 'acabado', icon: 'package', label: 'Acabado' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { id: 'ventas', icon: 'cart', label: 'Ventas' },
      { id: 'cobros', icon: 'wallet', label: 'Cobros' },
      { id: 'clientes', icon: 'users', label: 'Clientes' },
      { id: 'finanzas', icon: 'finance', label: 'Finanzas' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { id: 'proyectos', icon: 'projects', label: 'Proyectos' },
      { id: 'contactos', icon: 'contacts', label: 'Contactos' },
      { id: 'documentacion', icon: 'documents', label: 'Documentacion' },
      { id: 'equipos', icon: 'equipment', label: 'Equipos' },
      { id: 'reportes', icon: 'reports', label: 'Reportes' },
    ],
  },
];

export function Sidebar({ user, activePanel, onNavigate }: SidebarProps) {
  const allowed = visiblePanels(user.rol);
  const sourceSections: NavSection[] = user.rol === 'admin'
    ? [
      ...baseSections,
      {
        label: 'Admin',
        items: [
          { id: 'usuarios', icon: 'shield', label: 'Usuarios' },
          { id: 'auditoria', icon: 'audit', label: 'Auditoria' },
        ],
      },
    ]
    : baseSections;
  const sections: NavSection[] = sourceSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowed.has(item.id)),
    }))
    .filter((section) => section.items.length > 0);
  const initials = user.nombre
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'US';

  return (
    <aside className="w-60 bg-dark-surface border-r border-dark-border flex flex-col h-screen overflow-y-auto">
      <div className="p-5 border-b border-dark-border">
        <div className="text-2xl font-bebas font-bold text-accent-yellow tracking-wider">
          JabonControl
        </div>
        <div className="text-xs font-mono text-text-tertiary tracking-widest mt-1">
          SISTEMA DE GESTION
        </div>
      </div>

      <nav className="flex-1 py-2 space-y-0">
        {sections.map((section, idx) => (
          <div key={idx} className="py-2 border-b border-dark-border">
            <div className="px-4 py-1.5 text-xs font-mono text-text-tertiary tracking-widest uppercase">
              {section.label}
            </div>
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-all border-l-[3px] ${
                  activePanel === item.id
                    ? 'bg-dark-surface2 text-accent-yellow border-accent-yellow'
                    : 'text-text-secondary border-transparent hover:bg-dark-surface2 hover:text-text-primary'
                }`}
              >
                <span className={`w-8 h-8 rounded-md flex items-center justify-center border transition-all ${
                  activePanel === item.id
                    ? 'bg-accent-yellow text-black border-accent-yellow shadow-[0_0_18px_rgba(245,184,64,0.18)]'
                    : 'bg-dark-surface3 text-accent-yellow border-dark-border group-hover:border-accent-yellow'
                }`}>
                  <ModuleIcon name={item.icon} />
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-accent-orange text-white text-xs font-mono px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-dark-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent-yellow text-black flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="text-xs leading-tight">
            <div className="font-medium truncate max-w-[140px]">{user.nombre}</div>
            <div className="text-text-tertiary font-mono text-[9px] uppercase">{user.rol}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ModuleIcon({ name }: { name: IconKey }) {
  const common = {
    className: 'w-4 h-4',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const icons: Record<IconKey, JSX.Element> = {
    dashboard: (
      <svg {...common}><path d="M4 13h6V4H4z" /><path d="M14 20h6v-9h-6z" /><path d="M4 20h6v-3H4z" /><path d="M14 7h6V4h-6z" /></svg>
    ),
    flask: (
      <svg {...common}><path d="M9 3h6" /><path d="M10 3v6l-5 8a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-8V3" /><path d="M8 15h8" /></svg>
    ),
    flame: (
      <svg {...common}><path d="M12 21c3.3 0 6-2.6 6-5.9 0-3.6-2.3-5.7-4.1-8.1-.4 2.4-1.9 3.8-3.7 5.1.2-2.2-.7-4.1-2-5.6C7.3 9.6 6 12 6 15.1 6 18.4 8.7 21 12 21z" /></svg>
    ),
    package: (
      <svg {...common}><path d="m3 7 9-4 9 4-9 4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></svg>
    ),
    cart: (
      <svg {...common}><path d="M4 5h2l2.2 10.5a2 2 0 0 0 2 1.5h6.8a2 2 0 0 0 2-1.6L20 9H7" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
    ),
    wallet: (
      <svg {...common}><path d="M4 7h15a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h12" /><path d="M16 13h4" /></svg>
    ),
    users: (
      <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></svg>
    ),
    finance: (
      <svg {...common}><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></svg>
    ),
    projects: (
      <svg {...common}><path d="M4 7h16" /><path d="M4 12h10" /><path d="M4 17h7" /><path d="M17 14l3 3-3 3" /></svg>
    ),
    contacts: (
      <svg {...common}><path d="M7 3h10a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M9 7h6" /><path d="M9 11h6" /><path d="M9 15h4" /></svg>
    ),
    documents: (
      <svg {...common}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>
    ),
    equipment: (
      <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.8 1.8 0 0 0-2 .3l-.4.2a1.8 1.8 0 0 0-1.1 1.5V22H10v-.3a1.8 1.8 0 0 0-1.1-1.5l-.4-.2a1.8 1.8 0 0 0-2-.3l-.2.1-2-3.4.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1.3H3v-4h.2a1.7 1.7 0 0 0 1.4-1.3 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.8 1.8 0 0 0 2-.3l.4-.2A1.8 1.8 0 0 0 10 1.1V1h4v.1a1.8 1.8 0 0 0 1.1 1.5l.4.2a1.8 1.8 0 0 0 2 .3l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1.3h.3v4h-.3A1.7 1.7 0 0 0 19.4 15z" /></svg>
    ),
    reports: (
      <svg {...common}><path d="M4 19V5" /><path d="M8 17V9" /><path d="M12 17V7" /><path d="M16 17v-5" /><path d="M20 19H4" /></svg>
    ),
    shield: (
      <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
    ),
    audit: (
      <svg {...common}><path d="M9 11l2 2 4-4" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8" /><path d="M15 3h5v5" /><path d="M14 9l6-6" /></svg>
    ),
  };

  return icons[name];
}
