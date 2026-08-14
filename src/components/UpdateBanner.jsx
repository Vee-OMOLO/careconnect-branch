import { useState } from 'react';
import { applyUpdate, isNewVersion } from '../utils/updateManager';

export default function UpdateBanner() {
  const [visible, setVisible] = useState(isNewVersion());
  const [busy, setBusy] = useState(false);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 bg-teal-700 px-5 py-3 text-sm text-white">
      <span className="flex-1">A newer version of CareConnect is ready.</span>
      <button
        onClick={async () => {
          setBusy(true);
          await applyUpdate();
        }}
        disabled={busy}
        className="rounded-lg bg-white/20 px-3 py-1.5 font-medium disabled:opacity-60"
      >
        {busy ? 'Updating…' : 'Update'}
      </button>
      <button onClick={() => setVisible(false)} aria-label="Dismiss" className="text-white/70">
        ✕
      </button>
    </div>
  );
}
