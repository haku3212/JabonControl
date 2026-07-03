interface TopbarProps {
  user?: { nombre: string; rol: string };
  title: string;
  breadcrumb: string;
  onNewClick: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
  onLogout?: () => void;
  canCreate?: boolean;
}

export function Topbar({ user, title, breadcrumb, onNewClick, onMenuClick, isMobile, onLogout, canCreate = true }: TopbarProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-BO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="h-14 md:h-16 bg-dark-surface border-b border-dark-border flex items-center px-3 md:px-6 gap-3 md:gap-4 flex-shrink-0 shadow-[0_1px_0_rgba(255,255,255,0.02)]">
      {/* Botón menú móvil */}
      {isMobile && (
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-dark-surface2 rounded transition-all"
        >
          ☰
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-lg md:text-xl font-bebas text-text-primary tracking-wider truncate">
          {title}
        </div>
        <div className="text-xs font-mono text-text-tertiary hidden sm:block">
          {breadcrumb}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="text-xs font-mono text-text-tertiary hidden sm:block">
          {dateStr}
        </div>
        {user && (
          <div className="hidden md:block text-right leading-tight">
            <div className="text-xs text-text-secondary">{user.nombre}</div>
            <div className="text-[10px] font-mono text-accent-yellow uppercase">{user.rol}</div>
          </div>
        )}
        {canCreate && (
          <button
            onClick={onNewClick}
            className="px-2 md:px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90 transition-all whitespace-nowrap"
          >
            <span className="hidden sm:inline">+ NUEVO REGISTRO</span>
            <span className="sm:hidden">+ NUEVO</span>
          </button>
        )}
        {onLogout && (
          <button
            onClick={() => {
              if (confirm('¿Cerrar sesión?')) onLogout();
            }}
            title="Cerrar sesión"
            className="px-2 py-1.5 bg-dark-surface3 text-text-secondary text-xs rounded border border-dark-border hover:border-status-danger hover:text-status-danger transition-all"
          >
            🚪
          </button>
        )}
      </div>
    </div>
  );
}
