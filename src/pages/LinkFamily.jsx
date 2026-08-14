import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Caregivers land here after signup. The parent's email plus the
// child's name rebuilds the same deterministic link_key the parent's
// family was created with, so no codes change hands.
export default function LinkFamily() {
  const { linkFamily, logout } = useAuth();
  const navigate = useNavigate();

  const [parentEmail, setParentEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await linkFamily({ parentEmail, childName });
      navigate('/caregiver', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not link to that family.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 px-5 py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900">Link to a family</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ask the parent for the email they signed up with, and type the child's
          name exactly as they entered it.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Parent's email</span>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Child's name</span>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              required
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Capital letters and extra spaces don't matter.
            </span>
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
            {busy ? 'Linking…' : 'Link to family'}
          </button>
        </form>

        <button
          onClick={logout}
          className="mt-6 w-full text-center text-sm text-slate-500 underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200';
