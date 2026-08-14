// Thin promise wrapper around the Geolocation API.
// Every caller treats a failure as "no location", never as a blocker —
// an SOS must still send when GPS is slow or denied.

const DEFAULTS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 };

export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This device cannot share a location.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }),
      (err) => reject(new Error(describeError(err))),
      { ...DEFAULTS, ...options }
    );
  });
}

export function watchPosition(onUpdate, onError, options = {}) {
  if (!('geolocation' in navigator)) {
    onError?.(new Error('This device cannot share a location.'));
    return () => {};
  }

  const id = navigator.geolocation.watchPosition(
    (position) =>
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      }),
    (err) => onError?.(new Error(describeError(err))),
    { ...DEFAULTS, ...options }
  );

  return () => navigator.geolocation.clearWatch(id);
}

function describeError(err) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location permission is off. Turn it on in your browser or phone settings.';
    case err.POSITION_UNAVAILABLE:
      return 'No location signal right now.';
    case err.TIMEOUT:
      return 'Finding the location took too long.';
    default:
      return 'Could not read the location.';
  }
}
