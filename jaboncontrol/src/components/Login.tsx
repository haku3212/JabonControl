import { useState } from 'react';
import { authService } from '../services/api';

interface LoginProps {
  onLogin: (user: { id: string; nombre: string; usuario: string; rol: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !password) {
      setError('Ingrese usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.login(usuario, password);
      if (response.user) {
        if (response.token) sessionStorage.setItem('jc_token', response.token);
        localStorage.setItem('jc_user', JSON.stringify(response.user));
        onLogin(response.user);
      } else {
        setError('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('incorrect')) {
        setError('Usuario o contraseña incorrectos');
      } else {
        setError('No se pudo conectar al servidor. Intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧼</div>
          <h1 className="text-4xl font-bebas text-accent-yellow tracking-wider">
            JabonControl
          </h1>
          <p className="text-xs font-mono text-text-tertiary tracking-widest mt-1">
            SISTEMA DE GESTIÓN DE JABONERÍA
          </p>
        </div>

        {/* Card de login */}
        <form
          onSubmit={handleSubmit}
          className="bg-dark-surface border border-dark-border rounded-lg p-6 md:p-8 space-y-5"
        >
          <div>
            <h2 className="text-xl font-bebas text-text-primary tracking-wider mb-1">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-text-tertiary">
              Ingrese sus credenciales para continuar
            </p>
          </div>

          {error && (
            <div className="p-3 bg-status-danger bg-opacity-10 border border-status-danger border-opacity-40 rounded text-xs text-status-danger">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              autoFocus
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-text-tertiary uppercase block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2.5 text-text-primary text-sm focus:border-accent-yellow outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-accent-yellow text-black text-sm font-semibold rounded hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? '⏳ Verificando...' : '🔐 Entrar'}
          </button>

          <p className="text-center text-xs text-text-tertiary pt-2 border-t border-dark-border">
            Credenciales de prueba: <span className="font-mono text-text-secondary">admin / admin123</span>
          </p>
        </form>
      </div>
    </div>
  );
}
