import { useState } from 'react';
import { ArrowDownUp, ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { authService } from '../services/api';

interface LoginProps {
  onLogin: (user: { id: string; nombre: string; usuario: string; rol: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!usuario.trim() || !password) { setError('Ingrese usuario y contrasena.'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await authService.login(usuario.trim(), password);
      if (response.user) {
        if (response.token) sessionStorage.setItem('jc_token', response.token);
        localStorage.setItem('jc_user', JSON.stringify(response.user));
        onLogin(response.user);
      } else setError('Respuesta invalida del servidor.');
    } catch (err: any) {
      setError(err.message?.toLowerCase().includes('incorrect') ? 'Usuario o contrasena incorrectos.' : 'No se pudo conectar al servidor. Intente nuevamente.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-brand"><div className="brand-mark"><ArrowDownUp size={21} aria-hidden="true" /></div><span className="font-semibold text-lg">JabonControl</span></div>
      <section className="login-form" aria-labelledby="login-title">
        <div className="mb-8"><p className="text-xs text-text-tertiary mb-3">Administracion</p><h1 id="login-title" className="text-[28px] leading-tight font-semibold">Iniciar sesion</h1></div>
        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
          {error && <div role="alert" id="login-error" className="rounded-md border border-status-danger/30 bg-red-50 px-3 py-2.5 text-sm text-status-danger">{error}</div>}
          <div>
            <label htmlFor="login-user" className="mb-2 block text-sm font-medium">Usuario</label>
            <input id="login-user" type="text" value={usuario} onChange={event => setUsuario(event.target.value)} placeholder="Ingrese su usuario" autoComplete="username" autoFocus required disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} className="w-full rounded-md border border-dark-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent-blue" />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-medium">Contrasena</label>
            <div className="relative">
              <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Ingrese su contrasena" autoComplete="current-password" required disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} className="w-full rounded-md border border-dark-border bg-white pl-3 pr-12 py-2.5 text-sm outline-none focus:border-accent-blue" />
              <button type="button" disabled={loading} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'} title={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'} className="absolute right-1 top-1 icon-button">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="action-primary w-full justify-center min-h-11">
            {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}{loading ? 'Verificando...' : 'Entrar'}{!loading && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        </form>
        <p className="flex items-center gap-2 text-xs text-text-tertiary mt-7"><LockKeyhole size={14} aria-hidden="true" />Solo personal autorizado</p>
      </section>
      <p className="login-footer">JabonControl</p>
    </div>
  );
}
