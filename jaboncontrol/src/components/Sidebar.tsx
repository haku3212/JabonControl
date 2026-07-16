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
    icon: string;
    label: string;
    badge?: number;
  }>;
}

const baseSections: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard', icon: 'DASH', label: 'Dashboard' },
    ],
  },
  {
    label: 'Produccion',
    items: [
      { id: 'materias', icon: 'MAT', label: 'Materias Primas' },
      { id: 'hornadas', icon: 'HOR', label: 'Hornadas' },
      { id: 'acabado', icon: 'ACA', label: 'Acabado' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { id: 'ventas', icon: 'VEN', label: 'Ventas' },
      { id: 'cobros', icon: 'COB', label: 'Cobros' },
      { id: 'clientes', icon: 'CLI', label: 'Clientes' },
      { id: 'finanzas', icon: 'FIN', label: 'Finanzas' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { id: 'proyectos', icon: 'PRO', label: 'Proyectos' },
      { id: 'contactos', icon: 'DIR', label: 'Contactos' },
      { id: 'documentacion', icon: 'DOC', label: 'Documentacion' },
      { id: 'equipos', icon: 'EQP', label: 'Equipos' },
      { id: 'reportes', icon: 'REP', label: 'Reportes' },
    ],
  },
];

export function Sidebar({ user, activePanel, onNavigate }: SidebarProps) {
  const allowed = visiblePanels(user.rol);
  const sections = user.rol === 'admin'
    ? [
        ...baseSections,
        {
          label: 'Admin',
          items: [
            { id: 'usuarios', icon: 'USR', label: 'Usuarios' },
            { id: 'auditoria', icon: 'AUD', label: 'Auditoria' },
          ],
        },
      ]
    : baseSections;
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
            {section.items.filter((item) => allowed.has(item.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-all border-l-[3px] ${
                  activePanel === item.id
                    ? 'bg-dark-surface2 text-accent-yellow border-accent-yellow'
                    : 'text-text-secondary border-transparent hover:bg-dark-surface2 hover:text-text-primary'
                }`}
              >
                <span className="text-[10px] font-mono min-w-7 text-center text-accent-yellow">{item.icon}</span>
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
