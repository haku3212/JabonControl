import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usuario, password);
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bebas font-bold text-accent-yellow tracking-wider">
            JabonControl
          </div>
          <div className="text-xs font-mono text-text-tertiary tracking-widest mt-1">
            SISTEMA DE GESTIÓN
          </div>
        </div>

        {/* Card */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <h2 className="text-lg font-bebas text-text-primary tracking-wider mb-5">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                placeholder="Ingresa tu usuario"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-dark-surface2 border border-dark-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-xs text-status-danger bg-status-danger bg-opacity-10 border border-status-danger border-opacity-30 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-yellow text-black font-bebas tracking-wider py-2.5 rounded text-base hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 text-xs font-mono text-text-tertiary">
          v1.0 — JabonControl
        </div>
      </div>
    </div>
  );
}
