import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

export type Rol = 'admin' | 'ventas' | 'produccion' | 'gestion';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  rol: Rol;
}

// Permisos por rol
export const PERMISOS: Record<Rol, string[]> = {
  admin:      ['dashboard', 'materias', 'hornadas', 'acabado', 'ventas', 'cobros', 'clientes', 'proyectos', 'documentacion', 'equipos', 'reportes', 'usuarios'],
  ventas:     ['dashboard', 'ventas', 'cobros', 'clientes', 'reportes'],
  produccion: ['dashboard', 'materias', 'hornadas', 'acabado'],
  gestion:    ['dashboard', 'proyectos', 'documentacion', 'equipos', 'reportes'],
};

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
  puedeAcceder: (modulo: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      try {
        const res = await authService.verificar();
        if (res.valid) setUsuario(res.user);
        else localStorage.removeItem('token');
      } catch {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    verificar();
  }, []);

  const login = async (usr: string, password: string) => {
    const res = await authService.login(usr, password);
    setUsuario({ id: res.user.id, nombre: res.user.nombre, usuario: res.user.usuario, rol: res.user.rol });
  };

  const logout = () => {
    authService.logout();
    setUsuario(null);
  };

  const puedeAcceder = (modulo: string) => {
    if (!usuario) return false;
    return PERMISOS[usuario.rol]?.includes(modulo) ?? false;
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, puedeAcceder }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
