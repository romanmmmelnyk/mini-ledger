import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BankCard } from '../components/BankCard';
import { Alert, Check, Eye, EyeOff } from '../components/icons';
import { Logo } from '../components/Logo';
import { api, ApiError, errorText } from '../lib/api';
import { useSession } from '../lib/session';

type Mode = 'login' | 'register';

const COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to see your accounts.',
    submit: 'Sign in',
    switchText: 'Don’t have an account?',
    switchLink: 'Sign up',
    switchTo: '/register',
  },
  register: {
    title: 'Create your account',
    subtitle: 'It takes less than a minute.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchTo: '/login',
  },
} as const;

export function AuthPage({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const token = useSession((state) => state.token);
  const login = useSession((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (token) return <Navigate to="/app" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (mode === 'register' && !name.trim()) return setError('Enter your name');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Check your email address');
    if (mode === 'register' && password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    if (!password) return setError('Enter your password');

    setPending(true);
    try {
      const credentials = { email: email.trim(), password };
      if (mode === 'register') {
        try {
          await api('/auth/register', { body: { name: name.trim(), ...credentials } });
        } catch (cause) {
          if (cause instanceof ApiError && cause.status >= 500) {
            throw new ApiError('Could not create the account. This email may already be taken', 409);
          }
          throw cause;
        }
      }
      const session = await api<{ accessToken: string }>('/auth/login', { body: credentials });
      login(session.accessToken);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/app', { replace: true });
    } catch (cause) {
      setError(errorText(cause));
      setPending(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-main">
        <Link to="/" className="auth-logo" aria-label="mini-ledger — home">
          <Logo />
        </Link>

        <div className="auth-card">
          <div className="auth-head">
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            {mode === 'register' ? (
              <div className="field">
                <label className="field-label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className="input"
                  autoComplete="name"
                  placeholder="Alex"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            ) : null}

            <div className="field">
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="input-affix">
                <input
                  id="password"
                  className="input"
                  type={reveal ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <span className="affix-end">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={reveal ? 'Hide password' : 'Show password'}
                    aria-pressed={reveal}
                    onClick={() => setReveal((value) => !value)}
                  >
                    {reveal ? <EyeOff /> : <Eye />}
                  </button>
                </span>
              </div>
            </div>

            {error ? (
              <p className="form-error" role="alert">
                <Alert />
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
              {pending ? <span className="spinner" aria-hidden="true" /> : null}
              {copy.submit}
            </button>
          </form>

          <p className="auth-switch">
            {copy.switchText} <Link to={copy.switchTo}>{copy.switchLink}</Link>
          </p>
        </div>
      </section>

      <aside className="auth-aside" aria-hidden="true">
        <div className="auth-aside-inner">
          <h2>Every cent in its place.</h2>
          <ul>
            <li>
              <Check width={18} height={18} /> Double-entry bookkeeping for every transaction
            </li>
            <li>
              <Check width={18} height={18} /> Accounts in hryvnia, dollars and euros
            </li>
            <li>
              <Check width={18} height={18} /> Transfers by account number
            </li>
          </ul>
          <div className="auth-aside-cards">
            <BankCard
              className="aside-card-back"
              code="EUR"
              label="Savings"
              number="#2051"
              balance={3200}
            />
            <BankCard
              className="aside-card-front"
              code="UAH"
              label="Checking"
              number="#1024"
              balance={48250.75}
            />
          </div>
        </div>
      </aside>
    </main>
  );
}
