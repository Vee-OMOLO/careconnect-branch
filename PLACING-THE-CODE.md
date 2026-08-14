# Where to put the code — a slow walkthrough

Written for someone who hasn't opened VS Code in a while. Nothing assumed.

There are two routes. **Route A takes five minutes.** Route B takes an hour and
exists only if the download doesn't work for you.

---

# Route A — the zip (do this one)

## Step 1 — Download and unzip

Download `careconnect.zip` from the chat.

**Windows:** find it in your Downloads folder. Right-click → **Extract All…** →
change the destination to `C:\Users\YourName\Documents` → **Extract**.

Don't skip Extract All. If you just double-click the zip, Windows shows you the
contents in a preview window that *looks* like a folder but isn't. VS Code will
open it and nothing will work. The giveaway is the word "Compressed" in the
title bar.

**Mac:** double-click the zip in Downloads. A `careconnect` folder appears
beside it. Drag that to your Documents folder.

## Step 2 — Check you have one folder, not two

Open the `careconnect` folder you just extracted. You should immediately see:

```
README.md   index.html   package.json   src   public   supabase   ...
```

If instead you see a *single* folder also called `careconnect`, you've got a
nested copy — go one level in and use that inner folder from here on. This
happens with some unzip tools and it's the most common reason people get stuck
at step 4.

## Step 3 — Open it in VS Code

Launch VS Code. Then **File → Open Folder…** (Mac: **File → Open…**).

**Open Folder, not Open File.** This is the single most important click in the
whole guide. Opening `package.json` on its own gives VS Code no idea the rest of
the project exists — the terminal won't be in the right place, and `npm install`
will fail with "no package.json found."

Navigate to `Documents` → click **once** on the `careconnect` folder to select
it → **Select Folder** (Mac: **Open**). Don't double-click into it first.

If VS Code asks *"Do you trust the authors of the files in this folder?"* —
click **Yes, I trust the authors**. It's your own code.

## Step 4 — Confirm it looks right

Look at the left sidebar. If you don't see a file list, click the top icon in
the far-left bar — two stacked pages — or press `Ctrl+Shift+E` (`Cmd+Shift+E`
on Mac). That's the **Explorer**.

You should see this, with `CARECONNECT` in capitals at the top:

```
CARECONNECT
 > .vscode
 > public
 > src
 > supabase
   .env.example
   .gitignore
   ACCOUNTS.md
   DEPENDENCIES.md
   index.html
   package.json
   README.md
   ...
```

Click the `>` beside `src` to expand it. You should find `components`, `config`,
`constants`, `contexts`, `pages`, `services`, `utils`, plus `App.jsx`,
`main.jsx`, `index.css`, `supabase.js`.

**If you see all that, you're done placing code.** Every file is already where
it belongs. Skip to "Now what" at the bottom.

---

# Route B — building it by hand

Only if the zip failed. This is 51 files; expect an hour, and expect a typo or
two.

## The one trick that makes this bearable

VS Code creates folders for you if you type a path. When it asks for a filename,
typing:

```
src/pages/Login.jsx
```

creates the `src` folder, the `pages` folder inside it, and the file — all at
once. You never need to create folders separately. Use this for every single
file and you'll save half the time.

## Step 1 — Make the project folder

On your desktop or in Documents, create a new folder called `careconnect`.
Right-click empty space → **New** → **Folder** on Windows; right-click → **New
Folder** on Mac.

## Step 2 — Open it in VS Code

**File → Open Folder…** → select `careconnect` → **Select Folder**. The Explorer
will show `CARECONNECT` with nothing under it. That's correct.

## Step 3 — Create each file

For every file:

1. Hover over the word **CARECONNECT** in the Explorer. Four small icons appear
   to the right of it.
2. Click the **first** one — a page with a `+`. That's New File. (The second is
   New Folder; you won't need it.)
3. A text box appears. Type the **full path** from the list below —
   `src/pages/Login.jsx`, not just `Login.jsx` — then press `Enter`.
4. The empty file opens in the editor on the right.
5. Open that file from the chat, copy everything, click into the VS Code editor,
   press `Ctrl+A` then `Ctrl+V`.
6. **`Ctrl+S` to save.** A white dot beside the filename in its tab means
   unsaved. Save until the dot becomes an ✕.

Then repeat. Tick them off as you go.

### The full list

**Root — 12 files**

```
package.json
vite.config.js
index.html
vercel.json
.gitignore
.env.example
.oxlintrc.json
README.md
SETUP.md
ACCOUNTS.md
DEPENDENCIES.md
DEPLOY.md
```

**VS Code settings — 2**

```
.vscode/settings.json
.vscode/extensions.json
```

**Public — 3**

```
public/icon.svg
public/manifest.webmanifest
public/sw.js
```

**Database — 1**

```
supabase/schema.sql
```

**Source root — 4**

```
src/main.jsx
src/App.jsx
src/supabase.js
src/index.css
```

**Pages — 10**

```
src/pages/Login.jsx
src/pages/Register.jsx
src/pages/LinkFamily.jsx
src/pages/ParentHome.jsx
src/pages/CaregiverHome.jsx
src/pages/LogActivity.jsx
src/pages/Calendar.jsx
src/pages/TrackingMap.jsx
src/pages/SafetyVault.jsx
src/pages/Profile.jsx
```

**Components — 10**

```
src/components/ActivityChip.jsx
src/components/BottomNav.jsx
src/components/EmergencyDashboard.jsx
src/components/EmptyState.jsx
src/components/ErrorBoundary.jsx
src/components/OfflineBanner.jsx
src/components/PageHeader.jsx
src/components/Toggle.jsx
src/components/UpdateBanner.jsx
src/components/WhatsNewSheet.jsx
```

**Services — 6**

```
src/services/supabaseService.js
src/services/locationService.js
src/services/cloudinaryService.js
src/services/notificationService.js
src/services/logActivityLocal.js
src/services/demoLogger.js
```

**The last three**

```
src/contexts/AuthContext.jsx
src/constants/activityData.js
src/config/appVersion.js
src/utils/updateManager.js
```

That's 51 files.

## Things that will bite you in Route B

**Capital letters matter.** `SafetyVault.jsx` and `safetyvault.jsx` are
different files. Your laptop may not care, but Vercel's Linux servers do — the
classic version of this bug is a site that works perfectly on your machine and
shows a blank page once deployed. Copy the names exactly.

**Files starting with a dot.** `.gitignore`, `.env.local`, `.vscode/settings.json`
— the leading dot is part of the name, and VS Code handles them fine. Your
operating system's file browser may hide them, which is normal.

**`.jsx` vs `.js`.** Not interchangeable here. Components use `.jsx`, plain logic
uses `.js`. The list above has the right extension for each.

**Turn on auto-save.** **File → Auto Save** (it gets a ✓ when on). Removes the
single most common "why isn't my change working" cause.

---

# Now what

Whichever route you took, the code is in place. Next:

1. Open the terminal inside VS Code: **Terminal → New Terminal**, or `` Ctrl+` ``
   (the backtick key, usually top-left under Escape). A panel opens at the
   bottom, already in your project folder.

2. Install the packages:

   ```bash
   npm install
   ```

   About 30 seconds. Deprecation warnings are normal; only `ERR!` matters.

3. You'll need a Supabase project and a `.env.local` file before the app will
   start. That's **ACCOUNTS.md** — it walks through creating the accounts from
   scratch.

4. Then:

   ```bash
   npm run dev
   ```

   and open `http://localhost:5173`.

---

# VS Code refresher

Things worth remembering if it's been a while.

| Key | Does |
|---|---|
| `Ctrl+P` | Jump to any file by typing part of its name |
| `Ctrl+S` | Save |
| `` Ctrl+` `` | Show/hide the terminal |
| `Ctrl+Shift+E` | Show the file Explorer |
| `Ctrl+B` | Collapse the sidebar for more room |
| `Ctrl+Shift+F` | Search across every file |
| `Ctrl+/` | Comment out the selected lines |
| `Ctrl+Z` | Undo |

`Ctrl+P` then typing `safe` lands you in `SafetyVault.jsx` instantly. It's far
faster than clicking through folders, and it's the one habit most worth
rebuilding.

**The far-left icon bar,** top to bottom: Explorer (files), Search, Source
Control (Git), Run and Debug, Extensions. You'll use the first and the third.

**Red squiggly underlines** are errors, and the count shows at the bottom-left.
Some appear before you run `npm install` because the packages genuinely aren't
there yet — those clear on their own once the install finishes.
