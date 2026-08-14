import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActivities, logActivity } from '../services/supabaseService';
import { flushQueue, pendingCount } from '../services/logActivityLocal';
import { useToday, startOfDayISO } from '../hooks/useToday';
import ActivityChip from '../components/ActivityChip';
import EmergencyDashboard from '../components/EmergencyDashboard';
import OfflineBanner from '../components/OfflineBanner';
import EmptyState from '../components/EmptyState';

export default function CaregiverHome() {
  const { profile, linkKey, user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = useToday();

  useEffect(() => {
    if (!linkKey) return;
    let active = true;

    setActivities([]);
    setLoading(true);

    const load = () =>
      getActivities({ link_key: linkKey, since: startOfDayISO(today) })
        .then((rows) => active && setActivities(rows))
        .catch(() => {})
        .finally(() => active && setLoading(false));

    load();

    // Anything logged while offline goes out as soon as we reconnect.
    const flush = async () => {
      if (pendingCount() === 0) return;
      await flushQueue((entry) => logActivity({ ...entry, link_key: linkKey, userId: user.id }));
      load();
    };
    flush();
    window.addEventListener('online', flush);

    return () => {
      active = false;
      window.removeEventListener('online', flush);
    };
  }, [linkKey, user, today]);

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <OfflineBanner />

      <header className="px-5 pt-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          {firstName ? `Hi ${firstName}` : 'Today'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {new Date(`${today}T00:00`).toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <div className="space-y-3 px-5 py-6">
        <Link
          to="/log"
          className="block rounded-2xl bg-teal-600 py-4 text-center text-lg font-semibold text-white transition hover:bg-teal-700"
        >
          Log an activity
        </Link>

        {/* Location moved off the nav bar to keep it to five legible
            items. Sharing is a once-a-shift action, so a card suits it
            better than a permanent tab. */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/tracking"
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center"
          >
            <span className="block text-2xl" aria-hidden="true">📍</span>
            <span className="mt-1 block text-sm font-medium text-slate-800">Share location</span>
          </Link>

          <Link
            to="/vault"
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center"
          >
            <span className="block text-2xl" aria-hidden="true">🛡️</span>
            <span className="mt-1 block text-sm font-medium text-slate-800">Safety vault</span>
            <span className="mt-0.5 block text-xs text-slate-500">Who to call</span>
          </Link>
        </div>
      </div>

      <div className="px-5 pb-6">
        <EmergencyDashboard />
      </div>

      <section className="px-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Logged today
        </h2>

        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Loading…</p>
        ) : activities.length === 0 ? (
          <EmptyState
            icon="📝"
            title="Nothing logged yet"
            body="Meals, naps and changes you log show up on the parent's timeline right away."
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {activities.map((activity) => (
              <ActivityChip key={activity.id} activity={activity} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
