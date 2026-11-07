export type UserRole = 'admin' | 'supervisor' | 'supervisor_ventas' | 'finanzas' | 'operario' | string;

const corePanels = ['dashboard', 'ventas', 'cobros', 'finanzas', 'compras_gastos', 'clientes', 'contactos'];

const roleAccess: Record<string, string[]> = {
  admin: [...corePanels, 'contabilidad', 'usuarios', 'auditoria'],
  supervisor: corePanels,
  supervisor_ventas: ['dashboard', 'ventas', 'cobros', 'clientes', 'finanzas', 'compras_gastos', 'contactos'],
  finanzas: ['dashboard', 'cobros', 'clientes', 'finanzas', 'compras_gastos', 'contactos', 'contabilidad'],
  operario: ['dashboard'],
};

const createAccess: Record<string, string[]> = {
  admin: ['ventas', 'clientes', 'cobros'],
  supervisor: ['ventas', 'clientes', 'cobros'],
  supervisor_ventas: ['ventas', 'clientes', 'cobros'],
  finanzas: ['cobros'],
  operario: [],
};

export function canAccessPanel(role: UserRole, panel: string) {
  return (roleAccess[role] || roleAccess.operario).includes(panel);
}

export function canCreateInPanel(role: UserRole, panel: string) {
  return (createAccess[role] || createAccess.operario).includes(panel);
}

export function visiblePanels(role: UserRole) {
  return new Set(roleAccess[role] || roleAccess.operario);
}
