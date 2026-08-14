import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Toggle from '../components/Toggle';
import WhatsNewSheet from '../components/WhatsNewSheet';
import CareTeam from '../components/CareTeam';
import { useAuth } from '../contexts/AuthContext';
import { APP_VERSION } from '../config/appVersion';
import { canNotify, requestPermission, notify } from '../services/notificationService';
import { applyUpdate } from '../utils/updateManager';

export default function Profile() {
  const { profile, linkKey, role, logout } = useAuth();
  const navigate = useNavigate();
  const isParent = role !== 'caregiver';

  const [permission, setPermission] = useState(
    canNotify() ? Notification.permission : 'unsupported'
  );
  const [showChangelog, setShowChangelog] = useState(false);
  const [message, setMessage] = useState('');

  const notificationsOn = permission === 'granted';

  const toggleNotifications = async (next) => {
    setMessage('');

    if (!next) {
      setMessage(
        'To stop alerts completely, block notifications for this site in your browser settings.'
      );
      return;
    }

    const result = await requestPermission();
    setPermission(result);

    if (result === 'granted') {
      notify('Emergency alerts are on', {
        body: 'This is how an SOS will look.',
        tag: 'careconnect-test',
      });
      setMessage('Alerts are on. A test notification has been sent.');
    } else if (result === 'denied') {
      // Once denied, the browser will not ask again — the person has to
      // clear it themselves, so say exactly where.
      setMessage(
        'Notifications are blocked for this site. Click the icon at the left of the address bar, ' +
          'set Notifications to Allow, then reload the page.'
      );
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <PageHeader title="Profile" showBack={false} />

      <div className="space-y-8 px-5 py-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-lg font-semibold text-slate-900">
            {profile?.full_name || 'Your account'}
          </p>
          <p className="text-sm text-slate-500">{profile?.email}</p>
          <p className="mt-3 inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
            {profile?.role === 'caregiver' ? 'Caregiver' : 'Parent'}
          </p>
          {!linkKey && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Not linked to a family yet.
            </p>
          )}
        </section>

        {/* Only the parent receives alerts, so only the parent sees
            this. The caregiver's job is to raise the alarm, not to be
            told about it. */}
        {isParent && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Settings
            </h2>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
              <Toggle
                checked={notificationsOn}
                onChange={toggleNotifications}
                disabled={permission === 'unsupported'}
                label="Emergency notifications"
                description={
                  permission === 'unsupported'
                    ? 'This browser cannot show notifications.'
                    : 'Alerts reach this device even when CareConnect is in another tab.'
                }
              />
            </div>
          </section>
        )}

        {/* Care team — replaces the old About block. */}
        {linkKey && <CareTeam />}

        {message && (
          <p role="status" className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            {message}
          </p>
        )}

        <button
          onClick={handleSignOut}
          className="w-full rounded-xl border border-red-200 bg-white py-3.5 font-medium text-red-700"
        >
          Sign out
        </button>

        {/* Version details moved to a quiet footer — useful when
            something goes wrong, invisible the rest of the time. */}
        <footer className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-400">
          <span>v{APP_VERSION}</span>
          <button onClick={() => setShowChangelog(true)} className="underline">
            What's new
          </button>
          <button onClick={applyUpdate} className="underline">
            Clear cache
          </button>
        </footer>
      </div>

      <WhatsNewSheet open={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
}
