import { CalendarDays, ChevronRight, LogOut, Menu, Plus } from 'lucide-react';

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

export function Topbar({ title, breadcrumb, onNewClick, onMenuClick, isMobile, onLogout, canCreate = true }: TopbarProps) {
  const date = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
  const group = title === 'Dashboard' ? 'General' : breadcrumb.split('/')[0].trim().toLocaleLowerCase('es');
  return (
    <header className="app-topbar">
      {isMobile && <button onClick={onMenuClick} className="icon-button shrink-0" aria-label="Abrir menu" title="Abrir menu"><Menu size={20} /></button>}
      <div className="flex items-center gap-2 min-w-0 flex-1 text-sm">
        <span className="hidden sm:block capitalize text-text-tertiary">{group}</span><ChevronRight size={14} className="hidden sm:block text-text-tertiary shrink-0" aria-hidden="true" />
        <span className="font-medium truncate">{title === 'Dashboard' ? 'Inicio' : title}</span>
      </div>
      <div className="hidden lg:flex items-center gap-2 text-xs text-text-tertiary mr-3"><CalendarDays size={15} aria-hidden="true" />{date}</div>
      {canCreate && <button onClick={onNewClick} className="action-primary shrink-0"><Plus size={16} aria-hidden="true" /><span className="hidden sm:inline">Nuevo registro</span><span className="sm:hidden">Nuevo</span></button>}
      {onLogout && <button onClick={() => { if (confirm('Cerrar sesion?')) onLogout(); }} aria-label="Cerrar sesion" title="Cerrar sesion" className="icon-button shrink-0"><LogOut size={18} /></button>}
    </header>
  );
}
