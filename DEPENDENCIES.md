# Dependencies

Two different kinds, and they install completely differently.

---

## A. Install manually — three programs

Download and run installers for these. Nothing else on your machine is required.

| | Version | Where | Why |
|---|---|---|---|
| **Node.js** | 20+ (LTS) | [nodejs.org](https://nodejs.org) | Runs the build tools. Vite 8 will not start below Node 20. |
| **Git** | any recent | [git-scm.com](https://git-scm.com/downloads) | Sends your code to GitHub, which is what triggers Vercel. |
| **VS Code** | any recent | [code.visualstudio.com](https://code.visualstudio.com) | The editor. |

npm arrives bundled with Node — don't install it separately.

Verify all three:

```bash
node -v          # v20.x or higher
npm -v           # 10.x or higher
git --version    # 2.x
```

---

## B. Install with one command — 99 npm packages

**You do not download these individually.** From the project folder:

```bash
npm install
```

That reads `package.json`, fetches everything into `node_modules/`, and takes
about 30 seconds. Run it once after unzipping, and again whenever
`package.json` changes.

`node_modules/` is gitignored and can be several hundred MB. Never commit it;
if it ever gets corrupted, delete the folder and re-run `npm install`.

### What ships in the app

These end up in your users' browsers.

| Package | Version | Does |
|---|---|---|
| `react` | ^19.2.0 | The UI library everything is built on |
| `react-dom` | ^19.2.0 | Renders React to the browser |
| `react-router-dom` | ^7.18.2 | Client-side routing — `/vault`, `/tracking`, and the auth guards |
| `@supabase/supabase-js` | ^2.112.3 | Talks to your database: auth, queries, realtime subscriptions |
| `framer-motion` | ^13.1.0 | The sheet animations and alert transitions |
| `leaflet` | ^1.9.4 | Map engine for live location |
| `react-leaflet` | ^5.0.0 | React bindings for Leaflet |

Leaflet and react-leaflet are lazy-loaded, so they only download when someone
actually opens the map — worth knowing since together they're ~157 kB.

### What's only used while building

Never reaches a browser.

| Package | Version | Does |
|---|---|---|
| `vite` | ^8.2.1 | Dev server with hot reload; bundles for production |
| `@vitejs/plugin-react` | ^5.0.0 | Lets Vite understand JSX |
| `tailwindcss` | ^4.3.3 | The CSS framework behind every `className` in this project |
| `@tailwindcss/vite` | ^4.3.3 | Tailwind 4's Vite integration. Note there's no `tailwind.config.js` — v4 configures in CSS, in the `@theme` block of `src/index.css` |
| `oxlint` | ^1.78.0 | Fast linter, run by `npm run lint` |

---

## C. VS Code extensions — optional but worth it

VS Code offers these automatically when you open the project (they're listed in
`.vscode/extensions.json`). Click **Install** on the popup, or press
`Ctrl+Shift+X` and search each name.

| Extension | Worth it because |
|---|---|
| **Tailwind CSS IntelliSense** | Autocompletes class names and previews colours inline. The single most useful one here. |
| **Error Lens** | Puts errors on the line itself instead of only in the Problems panel. |
| **Prettier** | Formats on save so you stop thinking about indentation. |
| **ES7+ React snippets** | Type `rafce` for a component skeleton. |
| **Supabase** | Browse your tables without leaving the editor. |

None of these change how the app runs — they only change how it feels to work
on it.

---

## Accounts, for completeness

All free, none need a card.

| Service | For | Required? |
|---|---|---|
| **GitHub** | Stores code; triggers deploys | Yes |
| **Supabase** | Database, auth, realtime | Yes — the app won't start without it |
| **Vercel** | Hosts the live site | Only when you want it public |
| **Cloudinary** | Photo hosting | No. Without it photos are stored locally and the app works fine |

---

## Common install problems

**`npm : command not found`** — Node isn't installed or isn't on your PATH.
Reinstall from nodejs.org, then restart your computer, not just the terminal.

**`EACCES` permission errors on Mac or Linux** — don't reach for `sudo npm
install`. It creates root-owned files that break later installs. Use a Node
version manager like [nvm](https://github.com/nvm-sh/nvm) instead.

**Install hangs or times out** — usually a slow connection to the npm registry.
`npm install --fetch-timeout=120000` gives it longer before giving up.

**`npm error ERESOLVE`** — a peer dependency conflict, typically after editing
versions by hand. `rm -rf node_modules package-lock.json && npm install` clears
it.

**Windows: "running scripts is disabled on this system"** — PowerShell's
execution policy. Easiest fix is to use Command Prompt instead: in VS Code's
terminal panel, click the **⌄** beside the `+` and pick **Command Prompt**.
