// Offline queue for activity logs.
// A caregiver in a basement with no signal still needs the log to land.
// Entries are held in localStorage and flushed when the app comes back
// online or on next launch.

const KEY = 'careconnect:pending-activities';

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
};

const write = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked — nothing useful to do here */
  }
};

export function queueActivity(entry) {
  const items = read();
  items.push({ ...entry, queuedAt: new Date().toISOString() });
  write(items);
  return items.length;
}

export const pendingCount = () => read().length;

// Flush accepts the real logActivity function so this module stays
// free of any Supabase import — keeps it testable and dependency-light.
export async function flushQueue(sendFn) {
  const items = read();
  if (items.length === 0) return { sent: 0, failed: 0 };

  const stillPending = [];
  let sent = 0;

  for (const item of items) {
    try {
      await sendFn(item);
      sent += 1;
    } catch {
      stillPending.push(item);
    }
  }

  write(stillPending);
  return { sent, failed: stillPending.length };
}

export function clearQueue() {
  write([]);
}
