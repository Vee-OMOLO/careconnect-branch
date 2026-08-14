// Bump this on every release. updateManager compares it against the
// value in localStorage to decide whether to show the update banner
// and the "what's new" sheet.
export const APP_VERSION = '1.3.0';

export const CHANGELOG = [
  {
    version: '1.3.0',
    date: '2026-08-14',
    changes: [
      "The day now rolls over at midnight — yesterday's logs no longer linger on today's timeline.",
      'The date is shown above the timeline, so a 9:00 AM entry is never ambiguous.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-08-14',
    changes: [
      'Take or attach a photo with any activity log.',
      'Emergency alerts go straight to the parent — no setting to switch on first.',
      'Caregivers raise the alarm; parents receive it.',
      'The Safety Vault is now reachable from the caregiver menu.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-08-14',
    changes: [
      'Fixed calendar events landing on the day before the one you tapped.',
      'Quick log: tap Solids, Wet, Dry and the rest to log in one tap.',
      'Emergency alerts now buzz your device, for parents and caregivers.',
      'Care team: keep your pediatrician, tutor and doctors in one place.',
      'Only parents schedule events; caregivers see the schedule.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-08-13',
    changes: [
      'Notes you add to an activity now save and show up on the parent timeline.',
      'Emergency alerts show what kind of emergency it is, not just that there is one.',
      'Fixed the Safety Vault jumping back to the top while you typed.',
      'Choose parent or caregiver once, when you sign up.',
    ],
  },
];
