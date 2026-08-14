# CareConnect

Shared care between parents and caregivers: activity logging, live location,
emergency alerts, and a safety vault, in a mobile-first PWA.

**No accounts yet? Start with [ACCOUNTS.md](./ACCOUNTS.md).** Already have them? [SETUP.md](./SETUP.md) — step-by-step from a fresh machine to
a running app. [DEPLOY.md](./DEPLOY.md) covers putting it on Vercel.

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · React Router 7 · Framer Motion ·
Leaflet · Supabase (Auth, Postgres with RLS, Realtime) · Cloudinary

## Quick start

```bash
npm install
cp .env.example .env.local      # then fill in your Supabase values
# run supabase/schema.sql in the Supabase SQL Editor
npm run dev
```

## How the family link works

There are no invite codes. A family's `link_key` is derived deterministically:

```
lower(trim(parent_email)) + "_" + lower(trim(child_name))
```

The parent creates the family at signup; the caregiver types the parent's email
and the child's name and arrives at the same key. Row Level Security gates every
shared table on `is_family_member(link_key)`, so a caregiver can only ever read
or write rows for families they have actually joined.

## Roles

Chosen once, during signup, and stored on the account (`profiles.role`, mirrored
in auth metadata). There is no role picker at login and no first-launch role
gate — asking twice could only ever produce a mismatch.

## Project structure

```
src/
├── main.jsx                   Entry point, service worker registration
├── App.jsx                    Routes, auth guards, lazy-loaded map
├── supabase.js                Supabase client
├── index.css                  Tailwind 4 theme and global styles
├── config/appVersion.js       Version + changelog for the update banner
├── contexts/AuthContext.jsx   Session, role, family linking
├── services/
│   ├── supabaseService.js     Families, activities, SOS, contacts, events, location, realtime
│   ├── locationService.js     Geolocation wrappers
│   ├── cloudinaryService.js   Photo upload with local fallback
│   ├── notificationService.js Local notifications
│   ├── logActivityLocal.js    Offline queue
│   └── demoLogger.js          Sample data
├── components/                BottomNav, PageHeader, ActivityChip, Toggle,
│                              EmergencyDashboard, EmptyState, OfflineBanner,
│                              UpdateBanner, WhatsNewSheet, ErrorBoundary
├── constants/activityData.js  Activity + emergency + role vocabularies
├── utils/updateManager.js     Version check, cache clearing
└── pages/                     Login, Register, LinkFamily, ParentHome,
                               CaregiverHome, LogActivity, Calendar,
                               TrackingMap, SafetyVault, Profile
```

`constants/activityData.js` is the single source of truth for activity and
emergency types. The `id` values there match the CHECK constraints in
`schema.sql` exactly, so a label can never drift from what was stored.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server on :5173 with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |

## Notes

- Geolocation requires HTTPS or localhost. Live tracking won't prompt over a
  plain `http://192.168.x.x` address on a phone.
- Cloudinary is optional. Without it, photos become local data URLs.
- `vercel.json` includes the SPA rewrite; without it every route except `/`
  404s on a hard refresh.
