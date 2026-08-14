import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/supabaseService';
import { uploadPhoto } from '../services/cloudinaryService';
import PhotoPicker from '../components/PhotoPicker';
import { ACTIVITY_TYPES, getActivityType } from '../constants/activityData';

export default function LogActivity() {
  const { user, linkKey } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState('meal');
  const [detail, setDetail] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const activeType = getActivityType(type);

  // Changing the activity clears the detail — "Wet" makes no sense once
  // you have switched from Diaper to Meal.
  const chooseType = (nextType) => {
    setType(nextType);
    setDetail('');
  };

  const save = async (overrideDetail) => {
    setError('');
    setBusy(true);

    try {
      // Upload first. If the photo fails we do not want a log row that
      // silently lost its picture — uploadPhoto falls back to an inline
      // copy rather than throwing, so this resolves either way.
      const photoUrl = photo ? await uploadPhoto(photo) : null;

      await logActivity({
        link_key: linkKey,
        userId: user.id,
        type,
        detail: overrideDetail ?? detail,
        notes,
        photoUrl,
        occurredAt: new Date().toISOString(),
      });
      navigate('/caregiver', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not save the activity. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <PageHeader title="Log activity" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-6 px-5 py-6"
      >
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">What happened?</legend>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {ACTIVITY_TYPES.map((t) => {
              const selected = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseType(t.id)}
                  aria-pressed={selected}
                  className={`rounded-2xl border px-2 py-4 text-center transition ${
                    selected ? `${t.color} ring-2 ring-slate-300 ring-offset-1` : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="block text-2xl">{t.emoji}</span>
                  <span className="mt-1 block text-xs font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Quick log — one tap saves immediately. The common case is a
            caregiver with one free hand, so the fast path skips the
            notes field and the save button entirely. */}
        <AnimatePresence mode="wait">
          {activeType.details.length > 0 && (
            <motion.fieldset
              key={activeType.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <legend className="text-sm font-medium text-slate-700">
                Quick log
                <span className="ml-1 text-xs font-normal text-slate-400">
                  {photo ? 'tap to save with your photo' : 'tap once to save'}
                </span>
              </legend>

              <div className="mt-3 flex flex-wrap gap-2">
                {activeType.details.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={busy}
                    onClick={() => save(option)}
                    onContextMenu={(e) => {
                      // Long-press / right-click selects without saving,
                      // so a note can be added first.
                      e.preventDefault();
                      setDetail(option);
                    }}
                    className={`rounded-full border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                      detail === option
                        ? `${activeType.color} border-transparent ring-2 ring-slate-300`
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {detail && (
                <p className="mt-2 text-xs text-slate-500">
                  {detail} selected — add a note below, then save.{' '}
                  <button type="button" onClick={() => setDetail('')} className="underline">
                    Clear
                  </button>
                </p>
              )}
            </motion.fieldset>
          )}
        </AnimatePresence>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <span className="ml-1 text-xs text-slate-400">Optional</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Ate about half the bowl, still a bit fussy afterwards."
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          />
          <span className="mt-1 block text-right text-xs text-slate-400">{notes.length}/500</span>
        </label>

        <PhotoPicker photo={photo} onChange={setPhoto} disabled={busy} />

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
          {busy ? 'Saving…' : 'Save activity'}
        </button>
      </form>
    </div>
  );
}
