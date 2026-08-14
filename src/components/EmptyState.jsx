// An empty screen is an invitation to act, so this always carries a
// next step where one exists.
export default function EmptyState({ icon = '📋', title, body, action }) {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <p className="mt-3 font-medium text-slate-900">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-xs text-sm leading-snug text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
