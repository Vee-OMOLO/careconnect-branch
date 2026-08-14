import { logActivity } from './supabaseService';
import { ACTIVITY_TYPES } from '../constants/activityData';

// Seeds a plausible day of activity so a new family sees a populated
// timeline while testing. Only reachable from Profile > Developer.

const SAMPLE_NOTES = {
  meal: ['Finished the whole bowl.', 'Ate about half, not very hungry.'],
  nap: ['Slept 90 minutes, woke up cheerful.', 'Fought it for a while, then went down.'],
  diaper: ['Wet only.', 'Changed and clean.'],
  medication: ['Inhaler, one puff.', 'Given with breakfast.'],
  play: ['Blocks in the front room for an hour.', 'Went to the park, chased pigeons.'],
  bath: ['Washed hair too.', 'Quick rinse before bed.'],
  school: ['Dropped off at 8, all fine.', 'Picked up at 3, had a good day.'],
  other: ['Read three books together.', 'A bit clingy this afternoon.'],
};

export async function seedDemoDay({ link_key, userId, count = 6 }) {
  const now = Date.now();
  const created = [];

  for (let i = 0; i < count; i += 1) {
    const type = ACTIVITY_TYPES[i % ACTIVITY_TYPES.length];
    const notes = SAMPLE_NOTES[type.id]?.[i % 2] ?? null;
    const occurredAt = new Date(now - (count - i) * 55 * 60 * 1000).toISOString();

    created.push(
      await logActivity({ link_key, userId, type: type.id, notes, occurredAt })
    );
  }

  return created;
}
