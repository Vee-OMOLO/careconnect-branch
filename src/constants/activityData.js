// Shared vocabulary for activities, emergencies, roles and the care
// team. Both the logging screens and the display components read from
// here, so a label can never drift between what was saved and what is
// shown. Every `id` matches a CHECK constraint value in the schema.

export const ACTIVITY_TYPES = [
  {
    id: 'meal', label: 'Meal', emoji: '🍽️',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    details: ['Solids', 'Liquids', 'Snack', 'Bottle', 'Refused'],
  },
  {
    id: 'nap', label: 'Nap', emoji: '😴',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    details: ['Fell asleep', 'Woke up', 'Short rest', 'Would not settle'],
  },
  {
    id: 'diaper', label: 'Diaper', emoji: '🧷',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    details: ['Dry', 'Wet', 'Soiled', 'Both', 'Rash noticed'],
  },
  {
    id: 'medication', label: 'Medication', emoji: '💊',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    details: ['Full dose', 'Partial dose', 'Refused', 'Skipped'],
  },
  {
    id: 'play', label: 'Play', emoji: '🧸',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    details: ['Indoors', 'Outdoors', 'Screen time', 'Quiet play'],
  },
  {
    id: 'bath', label: 'Bath', emoji: '🛁',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    details: ['Full bath', 'Quick wash', 'Hair washed'],
  },
  {
    id: 'school', label: 'School', emoji: '🎒',
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    details: ['Drop-off', 'Pick-up', 'Homework done', 'Absent'],
  },
  {
    id: 'mood', label: 'Mood', emoji: '🙂',
    color: 'bg-lime-100 text-lime-800 border-lime-200',
    details: ['Happy', 'Calm', 'Fussy', 'Upset', 'Unwell'],
  },
  {
    id: 'other', label: 'Other', emoji: '📝',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    details: [],
  },
];

export const getActivityType = (id) =>
  ACTIVITY_TYPES.find((t) => t.id === id) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];

export const EMERGENCY_TYPES = [
  { id: 'medical',           label: 'Medical',           emoji: '🚑', color: 'bg-red-600',    ring: 'ring-red-300' },
  { id: 'fire',              label: 'Fire',              emoji: '🔥', color: 'bg-orange-600', ring: 'ring-orange-300' },
  { id: 'missing_child',     label: 'Missing child',     emoji: '🔍', color: 'bg-purple-600', ring: 'ring-purple-300' },
  { id: 'injury',            label: 'Injury',            emoji: '🩹', color: 'bg-amber-600',  ring: 'ring-amber-300' },
  { id: 'allergic_reaction', label: 'Allergic reaction', emoji: '🐝', color: 'bg-pink-600',   ring: 'ring-pink-300' },
  { id: 'choking',           label: 'Choking',           emoji: '😰', color: 'bg-rose-700',   ring: 'ring-rose-300' },
  { id: 'other',             label: 'Other',             emoji: '🚨', color: 'bg-slate-700',  ring: 'ring-slate-300' },
];

export const getEmergencyType = (id) =>
  EMERGENCY_TYPES.find((t) => t.id === id) ?? EMERGENCY_TYPES[EMERGENCY_TYPES.length - 1];

export const ROLES = [
  {
    id: 'parent', label: 'Parent', emoji: '👪',
    blurb: 'See the day as it happens, get alerts, and manage the safety vault.',
  },
  {
    id: 'caregiver', label: 'Caregiver', emoji: '🧑‍🍼',
    blurb: 'Log activities in a couple of taps, share location, and raise an SOS.',
  },
];

// Care team — the people around the child. Separate from emergency
// contacts, which is specifically who to call in a crisis.
export const CARE_TEAM_ROLES = [
  { id: 'pediatrician',  label: 'Pediatrician',  emoji: '👩‍⚕️' },
  { id: 'family_doctor', label: 'Family doctor', emoji: '🩺' },
  { id: 'dentist',       label: 'Dentist',       emoji: '🦷' },
  { id: 'therapist',     label: 'Therapist',     emoji: '💬' },
  { id: 'tutor',         label: 'Tutor',         emoji: '📚' },
  { id: 'coach',         label: 'Coach',         emoji: '⚽' },
  { id: 'nanny',         label: 'Nanny',         emoji: '🧑‍🍼' },
  { id: 'other',         label: 'Other',         emoji: '👤' },
];

export const getCareTeamRole = (id) =>
  CARE_TEAM_ROLES.find((r) => r.id === id) ?? CARE_TEAM_ROLES[CARE_TEAM_ROLES.length - 1];
