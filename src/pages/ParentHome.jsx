import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivities, subscribeToFamily } from '../services/supabaseService';
import { useToday, startOfDayISO, isSameDay } from '../hooks/useToday';
import ActivityChip from '../components/ActivityChip';
import EmergencyDashboard from '../components/EmergencyDashboard';
import EmptyState from '../components/EmptyState';

export default function ParentHome() {
  const { profile, linkKey } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Changes at midnight, which re-runs everything below and starts the
  // new day clean.
  const today = useToday();

  useEffect(() => {
    if (!linkKey) return;
    let active = true;

    // Clear immediately so yesterday's list never lingers on screen
    // while the new day's fetch is in flight.
    setActivities([]);
    setLoading(true);

    getActivities({ link_key: linkKey, since: startOfDayISO(today) })
      .then((rows) => active && setActivities(rows))
      .catch(() => {})
      .finally(() => active && setLoading(false));

    const unsubscribe = subscribeToFamily(linkKey, {
      onActivity: (row) => {
        // A log that arrives seconds after midnight belongs to the new
        // day, not this list. Without this guard a late-night entry
        // would reappear on tomorrow's timeline.
        if (!isSameDay(row.occurred_at ?? row.created_at, today)) return;
        setActivities((prev) => (prev.some((a) => a.id === row.id) ? prev : [row, ...prev]));
      },
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [linkKey, today]);

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
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

      <div className="px-5 py-6">
        <EmergencyDashboard />
      </div>

      <section className="px-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Today's activity
        </h2>

        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Loading the day…</p>
        ) : activities.length === 0 ? (
          <EmptyState
            title="Nothing logged yet"
            body="Activities your caregiver logs will appear here as they happen."
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
