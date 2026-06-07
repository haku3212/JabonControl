interface TopbarProps {
  title: string;
  breadcrumb: string;
  onNewClick: () => void;
}

export function Topbar({ title, breadcrumb, onNewClick }: TopbarProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-BO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="h-14 bg-dark-surface border-b border-dark-border flex items-center px-6 gap-4 flex-shrink-0">
      <div>
        <div className="text-xl font-bebas text-text-primary tracking-wider">
          {title}
        </div>
        <div className="text-xs font-mono text-text-tertiary">
          {breadcrumb}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="text-xs font-mono text-text-tertiary">
          {dateStr}
        </div>
        <button
          onClick={onNewClick}
          className="px-3 py-1.5 bg-accent-yellow text-black text-xs font-medium rounded hover:bg-opacity-90 transition-all"
        >
          + NUEVO REGISTRO
        </button>
      </div>
    </div>
  );
}
