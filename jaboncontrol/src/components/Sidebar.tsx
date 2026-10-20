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
  | 'cart'
  | 'wallet'
  | 'users'
  | 'finance'
  | 'expense'
  | 'shield'
  | 'audit';

const baseSections: NavSection[] = [
  {
    label: 'Resumen',
    items: [
      { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { id: 'ventas', icon: 'cart', label: 'Ventas' },
      { id: 'cobros', icon: 'wallet', label: 'Cobros' },
      { id: 'finanzas', icon: 'finance', label: 'Finanzas' },
      { id: 'compras_gastos', icon: 'expense', label: 'Compras/Gastos' },
      { id: 'clientes', icon: 'users', label: 'Clientes' },
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
    <aside className="w-60 bg-white border-r border-dark-border flex flex-col h-screen overflow-y-auto">
      <div className="p-5 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-accent-blue text-white flex items-center justify-center text-sm font-bold">
            JC
          </div>
          <div>
            <div className="text-lg font-semibold text-text-primary tracking-normal">
              JabonControl
            </div>
            <div className="text-xs text-text-tertiary">
              Control interno
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-3">
        {sections.map((section, idx) => (
          <div key={idx} className="py-1">
            <div className="px-4 pb-1 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
              {section.label}
            </div>
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all border-l-[3px] ${
                  activePanel === item.id
                    ? 'bg-white text-text-primary border-accent-blue'
                    : 'text-text-secondary border-transparent hover:bg-dark-surface2 hover:text-text-primary'
                }`}
              >
                <span className={`w-8 h-8 rounded-md flex items-center justify-center border transition-all ${
                  activePanel === item.id
                    ? 'bg-[#edf3f5] text-accent-blue border-[#c9dbe2]'
                    : 'bg-dark-surface2 text-text-tertiary border-dark-border group-hover:text-text-primary'
                }`}>
                  <ModuleIcon name={item.icon} />
                </span>
                <span className="flex-1 text-left font-medium">{item.label}</span>
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

      <div className="p-3 border-t border-dark-border bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-accent-blue text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="text-xs leading-tight">
            <div className="font-medium truncate max-w-[140px]">{user.nombre}</div>
            <div className="text-text-tertiary text-[10px] uppercase">{user.rol}</div>
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
    expense: (
      <svg {...common}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h3" /></svg>
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
