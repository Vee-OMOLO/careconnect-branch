// Local notifications. Used for SOS alerts and medication reminders.
// Everything degrades quietly: a browser with no support, or a person
// who declined the prompt, simply gets no notification.

export const canNotify = () => 'Notification' in window;

export async function requestPermission() {
  if (!canNotify()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function notify(title, { body, tag, requireInteraction = false } = {}) {
  if (!canNotify() || Notification.permission !== 'granted') return null;
  try {
    return new Notification(title, {
      body,
      tag,
      requireInteraction,
      icon: '/icon.svg',
      badge: '/icon.svg',
    });
  } catch {
    return null;
  }
}

export function notifyEmergency(typeLabel, message) {
  return notify(`Emergency: ${typeLabel}`, {
    body: message || 'Open CareConnect for the location.',
    tag: 'careconnect-sos',
    requireInteraction: true,
  });
}
