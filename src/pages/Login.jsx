import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// FIX (role at signup): this screen no longer asks "sign in as parent
// or caregiver". The role lives on the account, so asking again could
// only ever produce a mismatch — a caregiver could pick "parent" and
// land on the wrong dashboard. Email and password, nothing else.
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const { user } = await login({ email, password });
      const role = user?.user_metadata?.role;
      navigate(role === 'caregiver' ? '/caregiver' : '/parent', { replace: true });
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'That email and password do not match an account.'
          : err.message || 'Could not sign in. Try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 px-5 py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to pick up where the day left off.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-teal-600 py-3.5 font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-medium text-teal-700 underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
