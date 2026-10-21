import { ArrowDownUp, ChartNoAxesCombined, ClipboardCheck, LayoutDashboard, ReceiptText, ShoppingBag, Users, UserRoundCog, Wallet, X, type LucideIcon } from 'lucide-react';
import { visiblePanels } from '../utils/permissions';

interface SidebarProps {
  user: { nombre: string; usuario: string; rol: string };
  activePanel: string;
  onNavigate: (panel: string) => void;
  onClose?: () => void;
}

const sections: Array<{ label: string; items: Array<{ id: string; icon: LucideIcon; label: string }> }> = [
  { label: 'General', items: [{ id: 'dashboard', icon: LayoutDashboard, label: 'Inicio' }] },
  { label: 'Comercial', items: [
    { id: 'ventas', icon: ShoppingBag, label: 'Ventas' },
    { id: 'cobros', icon: Wallet, label: 'Cobros' },
    { id: 'clientes', icon: Users, label: 'Clientes' },
  ] },
  { label: 'Finanzas', items: [
    { id: 'finanzas', icon: ChartNoAxesCombined, label: 'Resumen financiero' },
    { id: 'compras_gastos', icon: ReceiptText, label: 'Compras y gastos' },
  ] },
  { label: 'Administracion', items: [
    { id: 'usuarios', icon: UserRoundCog, label: 'Usuarios' },
    { id: 'auditoria', icon: ClipboardCheck, label: 'Auditoria' },
  ] },
];

export function Sidebar({ user, activePanel, onNavigate, onClose }: SidebarProps) {
  const allowed = visiblePanels(user.rol);
  const initials = user.nombre.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'US';
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><ArrowDownUp size={20} strokeWidth={2.2} aria-hidden="true" /></div>
        <div className="min-w-0"><p className="font-semibold text-[17px]">JabonControl</p><p className="text-xs text-text-tertiary mt-0.5">Administracion</p></div>
        {onClose && <button onClick={onClose} className="icon-button md:hidden ml-auto" aria-label="Cerrar menu" title="Cerrar menu"><X size={18} /></button>}
      </div>
      <nav aria-label="Navegacion principal" className="flex-1 px-3 py-5 space-y-5">
        {sections.map(section => {
          const items = section.items.filter(item => allowed.has(item.id));
          return items.length ? <div key={section.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold text-text-tertiary">{section.label}</p>
            <div className="space-y-1">{items.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => onNavigate(id)} aria-current={activePanel === id ? 'page' : undefined} className={`nav-item ${activePanel === id ? 'is-active' : ''}`}>
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span>
              </button>
            ))}</div>
          </div> : null;
        })}
      </nav>
      <div className="mx-4 border-t border-dark-border py-4 flex items-center gap-3">
        <div className="user-avatar">{initials}</div>
        <div className="min-w-0"><p className="text-sm font-medium truncate">{user.nombre}</p><p className="text-xs text-text-tertiary capitalize mt-0.5">{user.rol}</p></div>
      </div>
    </aside>
  );
}
