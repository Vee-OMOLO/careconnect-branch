import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { localDayKey } from '../hooks/useToday';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const EVENT_KINDS = [
  { id: 'appointment', label: 'Appointment', dot: 'bg-sky-500' },
  { id: 'medication',  label: 'Medication',  dot: 'bg-rose-500' },
  { id: 'school',      label: 'School',      dot: 'bg-violet-500' },
  { id: 'other',       label: 'Other',       dot: 'bg-slate-400' },
];

const kindOf = (id) => EVENT_KINDS.find((k) => k.id === id) ?? EVENT_KINDS[3];

// dayKey now lives in hooks/useToday.js so the calendar and the
// dashboards can never disagree about where a day starts.
const dayKey = localDayKey;

export default function Calendar() {
  const { linkKey, role } = useAuth();

  // Only the parent schedules. This hides the controls; the RLS policy
  // in 003_care_team_and_details.sql is what actually enforces it.
  const canSchedule = role === 'parent';
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!linkKey) return;
    let active = true;

    supabase
      .from('child_events')
      .select('id, title, kind, starts_at, notes')
      .eq('link_key', linkKey)
      .order('starts_at', { ascending: true })
      .then(({ data }) => active && setEvents(data ?? []));

    return () => {
      active = false;
    };
  }, [linkKey]);

  // Build the month grid: leading blanks so the 1st lands on the right
  // weekday, then the days themselves.
  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    return cells;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const key = dayKey(event.starts_at);
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(selected) ?? [];
  const upcoming = useMemo(
    () => events.filter((e) => new Date(e.starts_at) >= new Date()).slice(0, 5),
    [events]
  );

  const shiftMonth = (delta) =>
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const addEvent = async (draft) => {
    const { data, error } = await supabase
      .from('child_events')
      .insert({
        link_key: linkKey,
        title: draft.title.trim(),
        kind: draft.kind,
        starts_at: new Date(`${draft.date}T${draft.time || '09:00'}`).toISOString(),
        notes: draft.notes?.trim() || null,
      })
      .select('id, title, kind, starts_at, notes')
      .single();

    if (!error && data) {
      setEvents((prev) => [...prev, data]);
      setShowForm(false);
    }
    return error;
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <PageHeader
        title="Calendar"
        subtitle={cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        showBack={false}
      />

      <div className="px-5 py-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="px-3 py-1 text-slate-500">
              ←
            </button>
            <span className="font-medium text-slate-900">
              {cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => shiftMonth(1)} aria-label="Next month" className="px-3 py-1 text-slate-500">
              →
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day, i) => (
              <span key={`${day}-${i}`} className="py-1 text-xs font-medium text-slate-400">
                {day}
              </span>
            ))}

            {grid.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} />;

              const key = dayKey(date);
              const isSelected = key === selected;
              const isToday = key === dayKey(new Date());
              const dayEvents = eventsByDay.get(key) ?? [];

              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`relative aspect-square rounded-lg text-sm transition ${
                    isSelected
                      ? 'bg-teal-600 font-medium text-white'
                      : isToday
                        ? 'bg-teal-50 font-medium text-teal-800'
                        : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {date.getDate()}
                  {dayEvents.length > 0 && (
                    <span className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className={`h-1 w-1 rounded-full ${
                            isSelected ? 'bg-white' : kindOf(event.kind).dot
                          }`}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {new Date(`${selected}T00:00`).toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </h2>
            {canSchedule && (
              <button
                onClick={() => setShowForm((v) => !v)}
                className="text-sm font-medium text-teal-700 underline"
              >
                {showForm ? 'Cancel' : 'Add event'}
              </button>
            )}
          </div>

          {canSchedule && showForm && <EventForm date={selected} onSubmit={addEvent} />}

          {selectedEvents.length === 0 && !showForm ? (
            <EmptyState
              icon="📅"
              title="Nothing scheduled"
              body={
                canSchedule
                  ? 'Add appointments and medication times here.'
                  : 'Appointments the parent schedules will appear here.'
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {selectedEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )}
        </section>

        {upcoming.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Coming up</h2>
            <ul className="mt-3 space-y-2">
              {upcoming.map((event) => (
                <EventRow key={event.id} event={event} showDate />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function EventRow({ event, showDate }) {
  const kind = kindOf(event.kind);
  const when = new Date(event.starts_at);

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${kind.dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{event.title}</p>
        <p className="text-sm text-slate-500">
          {kind.label} ·{' '}
          {showDate && `${when.toLocaleDateString([], { month: 'short', day: 'numeric' })}, `}
          {when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
        {event.notes && <p className="mt-1 text-sm text-slate-600">{event.notes}</p>}
      </div>
    </li>
  );
}

// Declared at module scope — see the note in SafetyVault.jsx about why
// form components must never be defined inside a rendering component.
function EventForm({ date, onSubmit }) {
  const [draft, setDraft] = useState({ title: '', kind: 'appointment', date, time: '09:00', notes: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.value;
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError('Give the event a name.');
      return;
    }
    setBusy(true);
    const err = await onSubmit({ ...draft, date });
    setBusy(false);
    if (err) setError(err.message);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <input
        type="text"
        value={draft.title}
        onChange={update('title')}
        placeholder="Dentist, 6-month checkup"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
      />

      <div className="flex gap-2">
        <select
          value={draft.kind}
          onChange={update('kind')}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-teal-500"
        >
          {EVENT_KINDS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
        <input
          type="time"
          value={draft.time}
          onChange={update('time')}
          className="rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-teal-500"
        />
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-teal-600 py-3 font-medium text-white disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Add event'}
      </button>
    </form>
  );
}
