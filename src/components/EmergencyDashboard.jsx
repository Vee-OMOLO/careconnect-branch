import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentPosition } from '../services/locationService';
import {
  sendSOS,
  getActiveAlerts,
  resolveAlert,
  subscribeToFamily,
} from '../services/supabaseService';
import { notifyEmergency, requestPermission } from '../services/notificationService';
import { EMERGENCY_TYPES, getEmergencyType } from '../constants/activityData';

/* One component, two entirely separate jobs.

   The caregiver TRIGGERS: they pick a type and send. They never see the
   alert list and never get a device notification — they were there, and
   a buzzing phone in a real emergency is noise, not information.

   The parent RECEIVES: they see live alert cards and get a device
   notification. No permission toggle gates this. Someone who has raised
   a child's caregiver to alert status has already opted in; making them
   find a settings switch first is a restriction that only bites at the
   worst possible moment. The browser prompt is the only gate, and it is
   requested the moment the parent's dashboard opens. */

export default function EmergencyDashboard() {
  const { user, role, linkKey } = useAuth();
  const isParent = role !== 'caregiver';

  if (isParent) return <ParentAlerts linkKey={linkKey} userId={user?.id} />;
  return <SosTrigger user={user} linkKey={linkKey} />;
}

// ---------------------------------------------------------------
// Parent — receives
// ---------------------------------------------------------------

function ParentAlerts({ linkKey, userId }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!linkKey) return;

    // Asked once, automatically, with no toggle in the way.
    requestPermission();

    getActiveAlerts(linkKey).then(setAlerts).catch(() => {});

    return subscribeToFamily(linkKey, {
      onAlert: (row) => {
        setAlerts((prev) => {
          const known = prev.some((a) => a.id === row.id);
          const rest = prev.filter((a) => a.id !== row.id);

          if (!known && row.status === 'active' && row.raised_by !== userId) {
            notifyEmergency(getEmergencyType(row.emergency_type).label, row.message);
          }

          return row.status === 'active' ? [row, ...rest] : rest;
        });
      },
    });
  }, [linkKey, userId]);

  if (alerts.length === 0) return null;

  return (
    <section className="space-y-4">
      <AnimatePresence initial={false}>
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onResolve={() => resolveAlert(alert.id)} />
        ))}
      </AnimatePresence>
    </section>
  );
}

function AlertCard({ alert, onResolve }) {
  const type = getEmergencyType(alert.emergency_type);
  const raisedAt = new Date(alert.created_at);
  const hasLocation = alert.latitude != null && alert.longitude != null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`overflow-hidden rounded-2xl text-white ${type.color}`}
    >
      <div className="flex items-start gap-3 p-5">
        <span className="text-3xl" aria-hidden="true">{type.emoji}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-tight">{type.label}</h3>
          <p className="mt-0.5 text-sm text-white/80">
            {raisedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </p>
          {alert.message && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/95">
              {alert.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-white/20 px-5 py-3">
        {hasLocation && (
          <a
            href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-white/20 px-3 py-2 text-sm font-medium"
          >
            Open location
          </a>
        )}
        <button
          onClick={onResolve}
          className="ml-auto rounded-lg bg-white/20 px-3 py-2 text-sm font-medium"
        >
          Mark resolved
        </button>
      </div>
    </motion.article>
  );
}

// ---------------------------------------------------------------
// Caregiver — triggers
// ---------------------------------------------------------------

function SosTrigger({ user, linkKey }) {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!selected) {
      setError('Choose the kind of emergency first.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      // Best effort only. A slow or denied GPS read must never stop the
      // alert from going out.
      let location = null;
      try {
        location = await getCurrentPosition({ timeout: 5000 });
      } catch {
        location = null;
      }

      await sendSOS({
        link_key: linkKey,
        userId: user.id,
        emergencyType: selected,
        message,
        location,
      });

      setSent(true);
      setMessage('');
      setSelected(null);
    } catch (err) {
      setError(err.message || 'The alert did not send. Try again, and call for help directly.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <p className="font-medium text-red-800">Alert sent to the parent</p>
        <p className="mt-1 text-sm text-red-700">
          They have your location. Call emergency services directly if this is
          life-threatening.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-medium text-red-800 underline"
        >
          Send another alert
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Raise an emergency alert</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pick what is happening. The parent is notified straight away with the
        type, your location and any note.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {EMERGENCY_TYPES.map((type) => {
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelected(type.id)}
              aria-pressed={isSelected}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                isSelected
                  ? `${type.color} border-transparent text-white ring-2 ${type.ring}`
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-lg" aria-hidden="true">{type.emoji}</span>
              {type.label}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-slate-700">Note</span>
        <span className="ml-1 text-xs text-slate-400">Optional</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="Where you are, what you need."
          className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={handleSend}
        disabled={busy || !selected}
        className="mt-4 w-full rounded-xl bg-red-600 py-4 text-lg font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
      >
        {busy
          ? 'Sending…'
          : selected
            ? `Send ${getEmergencyType(selected).label.toLowerCase()} alert`
            : 'Send alert'}
      </button>
    </div>
  );
}
