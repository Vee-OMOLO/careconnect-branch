import { getActivityType } from '../constants/activityData';

// A single row in the timeline. Shows the quick-log detail as a chip
// beside the activity name, and the free-text note underneath.
export default function ActivityChip({ activity }) {
  const type = getActivityType(activity.activity_type);
  const time = new Date(activity.occurred_at ?? activity.created_at);

  return (
    <li className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${type.color}`}
        aria-hidden="true"
      >
        {type.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium text-slate-900">{type.label}</span>
            {activity.detail && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${type.color}`}>
                {activity.detail}
              </span>
            )}
          </span>
          <time dateTime={time.toISOString()} className="shrink-0 text-xs text-slate-500">
            {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </time>
        </div>

        {activity.notes ? (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-snug text-slate-600">
            {activity.notes}
          </p>
        ) : (
          !activity.detail && <p className="mt-1 text-sm text-slate-400">No note added</p>
        )}

        {activity.photo_url && (
          <img
            src={activity.photo_url}
            alt=""
            loading="lazy"
            className="mt-2 h-32 w-full rounded-xl object-cover"
          />
        )}
      </div>
    </li>
  );
}
