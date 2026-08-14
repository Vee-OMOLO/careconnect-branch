// Minimal service worker: cache the shell, always go to the network
// for Supabase so care data is never served stale.
const CACHE = 'careconnect-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never cache API traffic — a stale SOS or activity log is worse
  // than no response at all.
  if (url.hostname.endsWith('supabase.co') || url.hostname.includes('cloudinary')) return;

  event.respondWith(
    caches.match(request).then((cached) =>
      cached ??
      fetch(request).catch(() => caches.match('/index.html'))
    )
  );
});
