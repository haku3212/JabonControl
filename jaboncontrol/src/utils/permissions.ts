export type UserRole = 'admin' | 'supervisor' | 'supervisor_ventas' | 'operario' | string;

const roleAccess: Record<string, string[]> = {
  admin: ['dashboard', 'materias', 'hornadas', 'acabado', 'ventas', 'cobros', 'clientes', 'finanzas', 'proyectos', 'contactos', 'documentacion', 'equipos', 'reportes', 'usuarios', 'auditoria'],
  supervisor: ['ventas', 'cobros', 'clientes', 'finanzas'],
  supervisor_ventas: ['ventas', 'cobros', 'clientes', 'finanzas'],
  operario: ['dashboard', 'materias', 'hornadas', 'acabado', 'ventas', 'clientes', 'contactos', 'documentacion', 'equipos'],
};

const createAccess: Record<string, string[]> = {
  admin: ['ventas', 'clientes', 'hornadas', 'materias', 'cobros', 'proyectos', 'equipos', 'documentacion'],
  supervisor: ['ventas', 'clientes', 'cobros'],
  supervisor_ventas: ['ventas', 'clientes', 'cobros'],
  operario: ['hornadas', 'materias', 'acabado'],
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
