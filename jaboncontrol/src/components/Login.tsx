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
      setError('Ingrese usuario y contrasena.');
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
        setError('Respuesta invalida del servidor.');
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('incorrect')) {
        setError('Usuario o contrasena incorrectos.');
      } else {
        setError('No se pudo conectar al servidor. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[920px] grid grid-cols-1 lg:grid-cols-[1fr_420px] bg-dark-surface border border-dark-border rounded-lg shadow-[0_24px_80px_rgba(16,24,40,0.10)] overflow-hidden">
        <section className="hidden lg:flex flex-col justify-between p-10 border-r border-dark-border bg-dark-surface2">
          <div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent-blue text-white font-bold">
              JC
            </div>
            <h1 className="mt-8 text-3xl font-semibold text-text-primary">
              JabonControl
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-secondary max-w-sm">
              Sistema interno para controlar clientes, ventas, cobros y finanzas con datos claros para la empresa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-dark-border bg-white px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-text-tertiary">Modulo</div>
              <div className="mt-1 font-medium text-text-primary">Administracion</div>
            </div>
            <div className="rounded-md border border-dark-border bg-white px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-text-tertiary">Acceso</div>
              <div className="mt-1 font-medium text-text-primary">Usuarios autorizados</div>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 lg:hidden">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent-blue text-white font-bold">
              JC
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-text-primary">JabonControl</h1>
          </div>

          <div className="mb-7">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-tertiary">
              Acceso seguro
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              Iniciar sesion
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Ingrese sus credenciales para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md border border-status-danger/30 bg-red-50 px-3 py-2.5 text-sm text-status-danger">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Usuario
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingrese su usuario"
                autoComplete="username"
                autoFocus
                className="w-full rounded-md border border-dark-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contrasena"
                autoComplete="current-password"
                className="w-full rounded-md border border-dark-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#254f69] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
