# Running CareConnect in VS Code

Start to finish, about 20 minutes. Most of that is waiting on Supabase.

---

## Step 1 — Install the tools

You need three things installed on your machine.

**Node.js 20 or newer.** Get it from [nodejs.org](https://nodejs.org) (the LTS
build). Check what you have:

```bash
node -v
```

If that prints anything below `v20`, install the newer version before
continuing — Vite 8 will refuse to start on older Node.

**VS Code.** From [code.visualstudio.com](https://code.visualstudio.com).

**Git**, if you want version control later. Optional for running the app.

---

## Step 2 — Open the project

Unzip the project folder somewhere you'll find it again — `Documents/CareConnect`
is fine, avoid folder names with spaces or accents.

In VS Code: **File → Open Folder**, pick the `careconnect` folder. Open it at the
top level: you should see `package.json` and `index.html` directly in the
Explorer sidebar, not nested inside another folder. If you see one lone folder,
you've opened one level too high.

VS Code will show a popup offering the recommended extensions. Click **Install**.
The important one is Tailwind CSS IntelliSense, which gives you class-name
autocomplete.

---

## Step 3 — Open the built-in terminal

**Terminal → New Terminal**, or `` Ctrl+` `` (backtick, top-left of most
keyboards). A panel opens at the bottom, already sitting in your project folder.

Every command below goes in that panel.

On Windows, if the terminal says something about execution policies when you run
npm, switch the shell: click the **⌄** next to the `+` in the terminal panel,
choose **Command Prompt**, and use that instead of PowerShell.

---

## Step 4 — Install the dependencies

```bash
npm install
```

This downloads about 99 packages into a `node_modules` folder — 30 seconds or
so on decent internet. You only do this once, and again whenever
`package.json` changes.

Don't be alarmed if it prints deprecation notices. Those are normal. Only stop
if you see the word `ERR!`.

---

## Step 5 — Set up Supabase

The app won't start without a database. It's deliberately loud about this rather
than failing mysteriously at the login screen.

1. Go to [supabase.com](https://supabase.com), sign up, click **New project**.
2. Give it a name and a database password. **Write the password down** — it's not
   recoverable, and you'll want it later.
3. Wait about two minutes for it to provision.
4. In the left sidebar go to **SQL Editor → New query**.
5. Open `supabase/schema.sql` from this project in VS Code, select everything
   (`Ctrl+A`), copy it, paste it into the Supabase SQL editor, and click **Run**.

   It should say "Success. No rows returned." That's the correct output — the
   script creates tables rather than reading them.
6. Go to **Project Settings → API** (gear icon, bottom left). You need two values
   from this page:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long string starting `eyJ...`

   Copy the `anon public` key, not `service_role`. The service key bypasses all
   the security rules and must never go in a frontend app.

---

## Step 6 — Create your `.env.local`

In VS Code's Explorer, right-click in empty space → **New File** → name it
exactly `.env.local` (the leading dot matters).

Paste this in and fill in the two values from the previous step:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-long-key

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Leave the Cloudinary lines blank for now. Photo uploads fall back to storing the
image locally, so everything still works.

No quotes around the values, no spaces around the `=`. Save with `Ctrl+S`.

---

## Step 7 — Point Supabase back at localhost

In Supabase: **Authentication → URL Configuration**.

- Set **Site URL** to `http://localhost:5173`
- Under **Redirect URLs**, add `http://localhost:5173/**`

Skip this and sign-up appears to work but the confirmation link goes nowhere.

While you're in the Authentication section, open **Providers → Email** and turn
**Confirm email** off for now. It saves you checking your inbox every time you
create a test account. Turn it back on before real people use the app.

---

## Step 8 — Run it

```bash
npm run dev
```

You'll see:

```
  VITE v8.2.1  ready in 400 ms
  ➜  Local:   http://localhost:5173/
```

`Ctrl+click` the localhost link, or open it in your browser manually.

Leave this running while you work. Every time you save a file, the browser
updates on its own — no refresh needed.

To stop it: click in the terminal and press `Ctrl+C`.

---

## Step 9 — Try it end to end

The app is useless with one account, so make two.

1. **Register as a parent.** Pick "Parent", fill in your details, and enter a
   child's name — say `Amani`. You land on the parent dashboard.
2. **Open a private/incognito window** and go to `http://localhost:5173` again.
   Two windows means two sessions; the same browser profile would just log you
   out of the first account.
3. **Register as a caregiver** with a different email. Pick "Caregiver".
4. On the link screen, enter the parent's email and `Amani`. Capitalisation and
   extra spaces don't matter — the app normalises both sides.
5. Log an activity as the caregiver, with a note. Watch it appear on the parent's
   timeline within a second, note included.
6. Send an emergency alert. The parent's card should name the type you picked.

If step 5 works in real time, your Realtime publication is set up correctly and
everything else will follow.

---

## The commands you'll use

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the built `dist/` locally, to check it before deploying |
| `npm run lint` | Check the code for problems |

---

## When something goes wrong

**"Missing Supabase config"** — `.env.local` is missing, misnamed, or in the
wrong folder. It belongs beside `package.json`, not inside `src/`. After
creating or editing it, stop the server with `Ctrl+C` and run `npm run dev`
again: Vite only reads env files at startup.

**Blank white page** — open the browser console with `F12` and read the first
red line. It's almost always a missing env var or a typo in an import path.

**`'npm' is not recognized`** — Node isn't installed, or isn't on your PATH.
Reinstall Node and restart VS Code entirely, not just the terminal.

**Port 5173 already in use** — an old dev server is still running. Either
`Ctrl+C` in that terminal, or run `npm run dev -- --port 5174`.

**Sign-up works but nothing loads afterwards** — you probably ran only part of
`schema.sql`. Re-run the whole file; it's safe to run repeatedly.

**Row-level security errors on insert** — the caregiver hasn't linked to a family
yet, so `link_key` is null. Complete the link step first.

**Changes not showing up** — check the terminal for a red build error. If it's
clean, hard-refresh with `Ctrl+Shift+R`.

---

## Useful VS Code shortcuts here

| Shortcut | Does |
|---|---|
| `Ctrl+P` | Jump to any file by typing part of its name |
| `Ctrl+Shift+F` | Search across the whole project |
| `F12` on a symbol | Jump to where it's defined |
| `Alt+Shift+F` | Format the current file |
| `` Ctrl+` `` | Toggle the terminal |
| `Ctrl+B` | Toggle the sidebar |

`Ctrl+P` then typing `safety` gets you to `SafetyVault.jsx` faster than clicking
through folders. It's the single shortcut most worth building the habit for.
