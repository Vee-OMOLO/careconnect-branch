import { useEffect, useState } from 'react';
import { pendingCount } from '../services/logActivityLocal';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [queued, setQueued] = useState(pendingCount());

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setQueued(pendingCount());
    };
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online && queued === 0) return null;

  return (
    <div
      role="status"
      className={`px-5 py-2 text-center text-sm ${
        online ? 'bg-amber-50 text-amber-800' : 'bg-slate-800 text-white'
      }`}
    >
      {online
        ? `${queued} ${queued === 1 ? 'entry' : 'entries'} waiting to sync.`
        : 'Offline. Activities you log are saved and will sync when you reconnect.'}
    </div>
  );
}
