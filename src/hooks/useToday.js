import { useEffect, useState } from 'react';

// Local calendar day as YYYY-MM-DD.
//
// Built from local components on purpose. The obvious
// date.toISOString().slice(0, 10) converts to UTC first, so in Nairobi
// (UTC+3) local midnight comes back as the previous day — the bug that
// put calendar events on the wrong date.
export const localDayKey = (value = new Date()) => {
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

// Midnight at the start of a given day key, as an ISO string for queries.
export const startOfDayISO = (dayKey) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
};

export const isSameDay = (value, dayKey) => localDayKey(value) === dayKey;

/* Returns today's key, and changes it the moment the day rolls over.

   The dashboards used to compute "start of today" once, inside an effect
   keyed on linkKey. Leave the app open overnight and it never
   recalculated: yesterday's logs stayed on screen while today's arrived
   above them, distinguishable only by a timestamp. A 9:00 AM feed from
   yesterday looked exactly like one from this morning.

   Two triggers, because neither is sufficient alone:

   - A timer set for the next midnight. Precise, but browsers throttle
     or suspend timers in background tabs, and a sleeping phone may not
     fire it at all.
   - A re-check whenever the tab becomes visible or regains focus. This
     is what actually catches the common case: the phone was locked
     overnight and is unlocked at breakfast. */
export function useToday() {
  const [today, setToday] = useState(() => localDayKey());

  useEffect(() => {
    let timer;

    const check = () => {
      const now = localDayKey();
      setToday((prev) => (prev === now ? prev : now));
      schedule();
    };

    const schedule = () => {
      clearTimeout(timer);
      const nextMidnight = new Date();
      // setHours(24, ...) rolls into tomorrow. The extra second avoids
      // firing a hair early and reading the old date back.
      nextMidnight.setHours(24, 0, 1, 0);
      timer = setTimeout(check, nextMidnight.getTime() - Date.now());
    };

    const recheck = () => {
      if (!document.hidden) check();
    };

    schedule();
    document.addEventListener('visibilitychange', recheck);
    window.addEventListener('focus', recheck);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', recheck);
      window.removeEventListener('focus', recheck);
    };
  }, []);

  return today;
}
