import { loginSchema } from '@kontora/contracts';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthProvider';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Перевірте дані');
    setPending(true);
    setError('');
    try {
      await login(parsed.data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося увійти');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login">
      <form onSubmit={submit} noValidate>
        <div className="brand" style={{ padding: 0 }}>
          <span className="brand-mark" aria-hidden="true">К</span>
          <span>
            <span className="brand-name">Контора</span>
            <small>Прийом і видача</small>
          </span>
        </div>
        <h1>Вхід для працівників</h1>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="f">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="f">
          <label htmlFor="login-password">Пароль</label>
          <input id="login-password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn primary" disabled={pending}>
          {pending ? 'Вхід…' : 'Увійти'}
        </button>
      </form>
    </div>
  );
}
