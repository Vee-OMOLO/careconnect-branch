# CareConnect — four fixes

Drop these files over the matching paths in `CareConnect2`, then run the SQL
migration. Files not listed here are untouched.

## 1. Optional notes never showed up

**Cause — two breaks in the same chain.** `activity_logs` had no `notes`
column, and `logActivity()` built its insert payload from the activity chip
alone. The textarea was wired to state correctly; the value simply had nowhere
to go and was dropped at the network boundary. Even if it had been saved, the
timeline row only rendered emoji, label and time.

**Fix** — `002_fixes.sql` adds `activity_logs.notes`; `supabaseService.js`
includes `notes` in the insert and in every `select` (explicit column lists
instead of `select('*')`, which is what hid the missing column); `LogActivity.jsx`
passes the state through; `ActivityChip.jsx` renders it, with "No note added" as
the empty case so a blank row is never ambiguous.

Files: `supabase/002_fixes.sql`, `src/services/supabaseService.js`,
`src/pages/LogActivity.jsx`, `src/components/ActivityChip.jsx`

## 2. Emergency alerts didn't show the type

**Cause.** The chosen type was only interpolated into a display string on the
caregiver's own device. Nothing typed reached the database, so the parent's card
read "Emergency alert" regardless of what was picked.

**Fix** — `sos_alerts.emergency_type` is now a real column with a CHECK
constraint whose allowed values are exactly the `id`s in
`constants/activityData.js`, so a label can't drift from what was stored.
`sendSOS()` sends it; the parent's `AlertCard` leads with it — type as the
headline, colour-coded, with the time and note underneath.

Also fixed here: a slow or denied GPS read used to abort the whole send. Location
is now best-effort with a 5s timeout — the alert always goes out.

Files: `supabase/002_fixes.sql`, `src/services/supabaseService.js`,
`src/components/EmergencyDashboard.jsx`, `src/constants/activityData.js`

## 3. Cursor jumping to the top of the Safety Vault

**Cause.** The form component was declared *inside* `SafetyVault`'s render body:

```jsx
function SafetyVault() {
  const [form, setForm] = useState(...);
  const ContactForm = () => <input value={form.name} onChange={...} />;  // ← recreated every render
  return <ContactForm />;
}
```

React identifies components by function identity. Each keystroke calls
`setForm` → `SafetyVault` re-renders → a *new* `ContactForm` function object
exists → React treats it as a different component type, unmounts the old
subtree and mounts a fresh one. The `<input>` DOM node is destroyed and
rebuilt, focus is lost, and the page scrolls back to the top. That's the
"cursor shifting up."

**Fix — structural, not cosmetic.** `ContactForm`, `MedicalForm`, `TextField`
and `ContactRow` are declared once at module scope and take data through props.
Handlers are wrapped in `useCallback` so their identity is stable. List rows are
keyed on the database `id`, never the array index. Sorting runs through `useMemo`
on read, so the order can't shuffle under a focused field. And `autoFocus` is
gone — on mobile it's the other common way a field yanks the page around.

File: `src/pages/SafetyVault.jsx`

## 4. Role belongs at signup, not at login

**Fix.** `Register.jsx` asks parent-or-caregiver as the first thing on the form,
and a parent additionally names their child there — so their family is created
immediately and they land on a working dashboard. The role travels in
`auth.users.raw_user_meta_data` and a database trigger copies it into
`profiles.role`, so it's on the account from the moment it exists.

`Login.jsx` is now just email and password. `RoleSelection.jsx` and its route
are removed — the old flow let a caregiver sign in as "parent" and land on the
wrong dashboard, which the account-level role makes impossible.

**Delete** `src/pages/RoleSelection.jsx` after applying this.

Files: `src/pages/Register.jsx`, `src/pages/Login.jsx`,
`src/contexts/AuthContext.jsx`, `src/App.jsx`, `supabase/002_fixes.sql`

---

## Applying

```bash
# 1. Run supabase/002_fixes.sql in the Supabase SQL Editor
# 2. Copy the src/ files over your existing ones
# 3. rm src/pages/RoleSelection.jsx
npm run dev
```

## Worth checking after

- Existing accounts created before this change have `profiles.role = null`.
  Either set it by hand in the SQL editor, or have those users re-register:
  `update public.profiles set role = 'parent' where email = '...';`
- Your existing RLS policies on `activity_logs` and `sos_alerts` cover the new
  columns automatically (policies gate rows, not columns), but if you use
  column-level grants anywhere, add `notes` and `emergency_type`.
- `replica identity full` on the two tables makes realtime payloads carry the
  whole row — needed for the parent view to read notes and type off an INSERT
  without a re-fetch.
