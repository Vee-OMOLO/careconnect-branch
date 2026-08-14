import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../constants/activityData';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: '',        // 'parent' | 'caregiver' — chosen here, once.
    childName: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const chooseRole = (role) => setForm((prev) => ({ ...prev, role }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.role) {
      setError('Pick whether you are the parent or the caregiver.');
      return;
    }
    if (form.password.length < 8) {
      setError('Passwords need at least 8 characters.');
      return;
    }
    if (form.role === 'parent' && !form.childName.trim()) {
      setError("Add your child's name so caregivers can link to your family.");
      return;
    }

    setBusy(true);
    try {
      await register(form);
      // Role is already known, so route straight to the right home.
      navigate(form.role === 'parent' ? '/parent' : '/link-family', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create the account. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          One account per person. Choose your role now — you will not be asked again.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Role picker — the step that used to live on the login screen
              and on a separate first-launch page. */}
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">I am the…</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const selected = form.role === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => chooseRole(role.id)}
                    aria-pressed={selected}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">{role.emoji}</span>
                    <span className="mt-2 block font-medium text-slate-900">{role.label}</span>
                    <span className="mt-1 block text-xs leading-snug text-slate-500">{role.blurb}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field label="Full name">
            <input
              type="text"
              value={form.fullName}
              onChange={update('fullName')}
              autoComplete="name"
              required
              className={inputClass}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              required
              className={inputClass}
            />
          </Field>

          <Field label="Password" hint="At least 8 characters.">
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </Field>

          {form.role === 'parent' && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              <Field
                label="Child's name"
                hint="Caregivers use your email and this name to link to your family."
              >
                <input
                  type="text"
                  value={form.childName}
                  onChange={update('childName')}
                  required
                  className={inputClass}
                />
              </Field>
            </motion.div>
          )}

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
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-teal-700 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
