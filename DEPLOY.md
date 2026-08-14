# Deploying CareConnect to Vercel

Your URL doesn't exist until the first build finishes. Vercel assigns it then —
it'll look like `careconnect2.vercel.app` or `careconnect2-vee-omolo.vercel.app`
depending on what's already taken.

## Before you deploy

Push the fixed files first, or you'll deploy the buggy build:

```bash
cp -r careconnect/src/* /path/to/CareConnect2/src/
cp careconnect/vercel.json /path/to/CareConnect2/
rm /path/to/CareConnect2/src/pages/RoleSelection.jsx

cd /path/to/CareConnect2
npm run build          # confirm it builds locally before pushing
git add -A && git commit -m "Fix notes, emergency type, vault focus, signup role"
git push
```

Run `supabase/002_fixes.sql` in the Supabase SQL Editor too. The new code
inserts `notes` and `emergency_type`; without the migration every activity log
and SOS will fail in production.

## Deploy

1. Go to **vercel.com/new** and sign in with GitHub.
2. **Import** `Vee-OMOLO/CareConnect2`. Grant repo access if prompted.
3. Framework preset should auto-detect as **Vite**. Leave build command
   (`npm run build`) and output directory (`dist`) as detected — `vercel.json`
   pins them anyway.
4. Expand **Environment Variables** and add all four. Do this *before* the first
   build; Vite inlines `VITE_*` values at build time, so variables added later
   need a fresh deploy to take effect.

   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_CLOUDINARY_CLOUD_NAME
   VITE_CLOUDINARY_UPLOAD_PRESET
   ```

   Apply each to Production, Preview and Development.
5. **Deploy.** Two to three minutes. The URL appears on the deployment screen.

Every push to `main` redeploys automatically from then on. Pushes to other
branches get their own preview URL.

## Two things that will bite you after the first deploy

**Supabase auth redirects.** Sign-in will fail on the live domain until you add
it. In Supabase: **Authentication → URL Configuration**, set Site URL to your
Vercel domain, and add both of these under Redirect URLs:

```
https://your-app.vercel.app/**
https://*-your-team.vercel.app/**     ← lets preview deployments log in too
```

**Geolocation needs HTTPS.** Vercel gives you that automatically, so live
tracking and SOS location will work in production even though they may not have
over plain `http://` on a local network address.

## Why `vercel.json` matters here

The rewrite rule is the important part. React Router handles `/vault` and
`/tracking` in the browser, but a hard refresh on those paths asks Vercel for a
file that doesn't exist — you'd get a 404 on every route except `/`. The
catch-all rewrite serves `index.html` and lets the router take over. Static
files in `dist` still win over the rewrite, so your assets are unaffected.

`Permissions-Policy: geolocation=(self)` keeps the location prompt working while
denying it to any embedded third-party frame.

## Custom domain, optional

**Project → Settings → Domains**, add the domain, then point a CNAME at
`cname.vercel-dns.com` with your registrar. Add the custom domain to the
Supabase redirect list as well, or auth breaks again on the new hostname.
