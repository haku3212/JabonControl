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
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-dark-border flex items-center px-3 md:px-6 gap-3 flex-shrink-0">
      {isMobile && (
        <button
          onClick={onMenuClick}
          className="h-9 w-9 rounded-md border border-dark-border bg-white text-text-secondary hover:text-text-primary transition"
          aria-label="Abrir menu"
        >
          <svg
            className="mx-auto h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-lg md:text-xl font-semibold text-text-primary truncate">
          {title}
        </div>
        <div className="text-xs text-text-tertiary hidden sm:block">
          {breadcrumb}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="hidden sm:block rounded-md border border-dark-border bg-dark-surface2 px-3 py-2 text-xs text-text-secondary">
          {dateStr}
        </div>
        {user && (
          <div className="hidden md:block text-right leading-tight">
            <div className="text-sm font-medium text-text-primary">{user.nombre}</div>
            <div className="text-[11px] text-text-tertiary uppercase">{user.rol}</div>
          </div>
        )}
        {canCreate && (
          <button
            onClick={onNewClick}
            className="rounded-md bg-accent-blue px-3 py-2 text-xs font-semibold text-white hover:bg-[#284f60] transition whitespace-nowrap"
          >
            <span className="hidden sm:inline">Nuevo registro</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        )}
        {onLogout && (
          <button
            onClick={() => {
              if (confirm('Cerrar sesion?')) onLogout();
            }}
            title="Cerrar sesion"
            className="rounded-md border border-dark-border bg-white px-3 py-2 text-xs font-medium text-text-secondary hover:border-status-danger hover:text-status-danger transition"
          >
            Salir
          </button>
        )}
      </div>
    </header>
  );
}
