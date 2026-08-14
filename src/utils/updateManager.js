import { APP_VERSION } from '../config/appVersion';

const KEY = 'careconnect:version';

export const storedVersion = () => localStorage.getItem(KEY);

export const isNewVersion = () => {
  const seen = storedVersion();
  return seen !== null && seen !== APP_VERSION;
};

// True on a genuinely first launch, so the changelog is not shown to
// someone who has never used the app before.
export const isFirstLaunch = () => storedVersion() === null;

export const markVersionSeen = () => localStorage.setItem(KEY, APP_VERSION);

// Clears every cache and unregisters service workers, then hard-reloads.
// This is the "the update did not take" escape hatch.
export async function applyUpdate() {
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } finally {
    markVersionSeen();
    window.location.reload();
  }
}
