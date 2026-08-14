# From zero: accounts, and making VS Code publish for you

You need three free accounts. None require a card.

## First, the mental model

Four things, and it matters which talks to which:

```
   VS Code              GitHub              Vercel
  (your laptop)   →   (code storage)   →   (the live site)
       │                                        │
       │  you push                    auto-builds on every push
       │
       └──────────── reads from ─────────→  Supabase
                                          (database + logins)
```

**GitHub** stores your code. **Vercel** watches GitHub and rebuilds the site
every time you push. That's the "uploads itself" part — real, and set up in
Part 4.

**Supabase is not in that chain.** It's a database sitting on the internet that
your app talks to at runtime. You configure it once through its website. Code
never gets pushed to it.

So: push code to GitHub, and Vercel ships it. Supabase just sits there holding
your data.

---

# Part 0 — Install these on your machine

Three programs. Install all three before anything else.

### Node.js 20 or newer — required

[nodejs.org](https://nodejs.org) → download the **LTS** button.

Accept every default in the installer. On Windows, if you're offered "Tools for
Native Modules", you can skip it — this project doesn't need it.

Verify in a fresh terminal:

```bash
node -v     # want v20 or higher
npm -v      # comes with Node, no separate install
```

If `node -v` isn't recognised, restart your computer. The installer edits your
PATH and some shells don't pick it up until then.

### Git — required

[git-scm.com/downloads](https://git-scm.com/downloads)

Accept the defaults, with one exception worth setting: when asked about the
default editor, choose **Visual Studio Code** rather than Vim. If you ever land
in Vim by accident you'll struggle to get out of it.

```bash
git --version
```

### VS Code — required

[code.visualstudio.com](https://code.visualstudio.com)

That's the whole list. Everything else the project needs is downloaded by
`npm install` — see DEPENDENCIES.md.

---

# Part 1 — GitHub account

1. [github.com/signup](https://github.com/signup). Email, password, username.
2. Verify the email they send you.
3. Set up two-factor authentication when prompted. GitHub requires it for all
   accounts now, and you'll be locked out later if you skip it. An
   authenticator app on your phone is the easiest option.

Free accounts get unlimited private repositories, which is what you want —
your code should be private even though your secrets aren't in it.

### Connect VS Code to GitHub

Open your `careconnect` folder in VS Code. Then:

1. Click the **account icon** at the very bottom-left of the window (a person
   outline, below the gear).
2. **Sign in with GitHub to use GitHub features**.
3. Your browser opens, asks you to authorise, then hands control back to VS Code.

You should now see your GitHub username at the bottom-left. VS Code is
authenticated — you'll never type a password to push.

### Publish the project

1. Click the **Source Control** icon in the left bar (a branching-lines shape,
   third one down). Or `Ctrl+Shift+G`.
2. Click **Publish to GitHub**.
3. Choose **Publish to private repository**. Name it `careconnect`.
4. If VS Code offers to include or exclude files, accept the defaults.

Thirty seconds later your code is on GitHub.

> **Check this before continuing.** Open your new repo on github.com and look at
> the file list. You should see `src/`, `package.json`, `.env.example` — and you
> should **not** see `.env.local` or `node_modules`. If `.env.local` is there,
> stop and tell me; your Supabase key is now public and needs rotating. The
> `.gitignore` I wrote prevents this, but it's worth one look.

---

# Part 2 — Supabase account

This gives you the database and the login system.

1. [supabase.com](https://supabase.com) → **Start your project** → sign in with
   GitHub. One less password.
2. **New project**. It'll ask for:
   - **Name**: `careconnect`
   - **Database password**: click Generate, then **copy it somewhere safe**.
     It isn't recoverable and you'll need it if you ever connect directly.
   - **Region**: pick the one nearest you. For Kenya that's usually
     `eu-central-1` (Frankfurt) or `ap-south-1` (Mumbai) — Mumbai typically
     has lower latency from East Africa. This can't be changed later without
     rebuilding the project.
   - **Plan**: Free.
3. Wait about two minutes while it provisions.

### Load the database structure

1. Left sidebar → **SQL Editor** → **New query**.
2. In VS Code, open `supabase/schema.sql`, select all (`Ctrl+A`), copy.
3. Paste into the Supabase editor, click **Run** (or `Ctrl+Enter`).

You want **"Success. No rows returned."** That's correct — the script builds
tables rather than reading them. If you get an error, copy the message and ask
me; the script is safe to re-run from the top.

Check it worked: **Table Editor** in the sidebar should now list `profiles`,
`families`, `activity_logs`, `sos_alerts` and five others.

### Copy your two keys

**Project Settings** (gear, bottom of sidebar) → **API**.

| What | Looks like | Where it goes |
|---|---|---|
| Project URL | `https://abcdefgh.supabase.co` | `VITE_SUPABASE_URL` |
| `anon` `public` key | `eyJhbGciOiJIUzI1...` (very long) | `VITE_SUPABASE_ANON_KEY` |

**Take the `anon public` key, never `service_role`.** The service key ignores
every security rule in your database. It belongs on a server, never in a
browser app. If you ever paste it into a `VITE_` variable, anyone visiting your
site can read and delete all your data.

The `anon` key being public is fine and by design — Row Level Security is what
protects the data, not key secrecy.

### Create `.env.local`

In VS Code: right-click empty space in the Explorer → **New File** →
`.env.local` exactly, leading dot included.

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

No quotes, no spaces around `=`. Leave Cloudinary blank; photos fall back to
local storage and everything still works.

This file is in `.gitignore`, so it stays on your laptop and never reaches
GitHub. That's deliberate — Vercel gets these values separately in Part 4.

### Point Supabase at localhost

**Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: add `http://localhost:5173/**`

Then **Authentication** → **Providers** → **Email** → turn **Confirm email**
off. It saves you checking your inbox for every test account. Turn it back on
before real families use this.

### Run it

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Register as a parent. If you land on a dashboard,
your database is working.

---

# Part 3 — Vercel account

1. [vercel.com/signup](https://vercel.com/signup) → **Continue with GitHub**.
2. Authorise Vercel to read your repositories.
3. Choose the **Hobby** plan (free). It'll ask what you're building — answer
   honestly, it only affects onboarding tips.

### Import the project

1. **Add New** → **Project**.
2. Find `careconnect` in the list → **Import**. If it's not there, click
   **Adjust GitHub App Permissions** and grant access to the repo.
3. Framework Preset should auto-detect **Vite**. Leave the build settings alone
   — `vercel.json` pins them.
4. Expand **Environment Variables** and add all four:

   ```
   VITE_SUPABASE_URL              https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY         eyJhbGciOiJIUzI1...
   VITE_CLOUDINARY_CLOUD_NAME     (leave blank)
   VITE_CLOUDINARY_UPLOAD_PRESET  (leave blank)
   ```

   **Add these before the first build.** Vite bakes `VITE_` values into the
   JavaScript at build time. Adding them afterwards does nothing until you
   redeploy.

5. **Deploy.** Two to three minutes.

You'll get a URL like `careconnect-abc123.vercel.app`. That's your live site.

### Tell Supabase about the new address

Sign-in will fail on the live site until you do this. Back in Supabase →
**Authentication** → **URL Configuration**:

- **Site URL**: your Vercel URL
- **Redirect URLs**: add both

```
https://careconnect-abc123.vercel.app/**
http://localhost:5173/**
```

Keep localhost in the list so you can still develop locally.

---

# Part 4 — Making it upload itself

Right now Vercel already rebuilds on every push. The only manual step left is
pushing. Here's the normal loop and how to shorten it.

### The loop as it stands

1. Edit a file in VS Code, save.
2. **Source Control** panel (`Ctrl+Shift+G`) — your changed files are listed.
3. Type a short message in the box: *"Fix note not showing on timeline"*.
4. `Ctrl+Enter` to commit.
5. Click **Sync Changes** to push.
6. Vercel starts building within seconds. Live in about two minutes.

### Making commit also push

Add one line to `.vscode/settings.json`:

```json
"git.postCommitCommand": "push"
```

Now step 5 disappears — committing pushes automatically, and Vercel deploys.
That's as close to "uploads itself" as you should want it.

I've left this **off** in the settings file I gave you, deliberately. Auto-push
means a half-finished change goes live the moment you commit, with no pause to
reconsider. Turn it on once you're comfortable, and keep it off while you're
still learning what a commit does.

### Enable auto-fetch either way

Also in `.vscode/settings.json` — this one is safe and genuinely useful:

```json
"git.autofetch": true
```

VS Code then checks GitHub periodically and shows you if the remote has moved
ahead. Matters as soon as more than one person, or more than one machine, is
involved.

### Preview deployments

Push to a branch other than `main` and Vercel builds it at its own URL without
touching your live site. Useful when you want to try something risky:

```bash
git checkout -b trying-something
# make changes, commit, push
```

Vercel comments the preview URL on the branch. Merge to `main` when happy.

---

# What to do when something breaks

**Vercel build fails, works locally.** Almost always a missing environment
variable. Vercel → your project → **Settings** → **Environment Variables**, check
all four are there and applied to Production. Then **Deployments** → the failed
one → **Redeploy**.

**Site loads but login fails.** The Vercel URL isn't in Supabase's redirect
list. Part 3, last step.

**VS Code won't push: "authentication failed".** Command Palette
(`Ctrl+Shift+P`) → `Developer: Reload Window`. If that doesn't do it, sign out
and back in from the account icon, bottom-left.

**You accidentally committed `.env.local`.** Rotate the key immediately:
Supabase → Settings → API → the anon key's reset control. Removing the file from
GitHub isn't enough; it stays in the history.

**Vercel says "No Production Deployment".** You imported the repo but never
deployed, or the first build failed. Check **Deployments**.
