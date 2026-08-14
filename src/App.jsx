import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';

import Login from './pages/Login';
import Register from './pages/Register';
import LinkFamily from './pages/LinkFamily';
import ParentHome from './pages/ParentHome';
import CaregiverHome from './pages/CaregiverHome';
import LogActivity from './pages/LogActivity';
const Calendar = lazy(() => import('./pages/Calendar'));

// Leaflet is ~150 kB and only one screen needs it, so the map route is
// split out. Without this it loads on the login screen too.
const TrackingMap = lazy(() => import('./pages/TrackingMap'));
import SafetyVault from './pages/SafetyVault';
import Profile from './pages/Profile';

// NOTE: RoleSelection is gone. The role is chosen during signup and
// stored on the account, so there is no first-launch role gate and no
// role picker on the login screen.

function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// Sends people to their own dashboard based on the role on their account.
function RoleHome() {
  const { role, linkKey, loading } = useAuth();
  if (loading) return <Splash />;
  if (role === 'caregiver') return <Navigate to={linkKey ? '/caregiver' : '/link-family'} replace />;
  return <Navigate to="/parent" replace />;
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50">
      <p className="text-sm text-slate-400">Loading CareConnect…</p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Splash />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<RequireAuth><RoleHome /></RequireAuth>} />
            <Route path="/link-family" element={<RequireAuth><LinkFamily /></RequireAuth>} />
            <Route path="/parent" element={<RequireAuth><ParentHome /></RequireAuth>} />
            <Route path="/caregiver" element={<RequireAuth><CaregiverHome /></RequireAuth>} />
            <Route path="/log" element={<RequireAuth><LogActivity /></RequireAuth>} />
            <Route path="/calendar" element={<RequireAuth><Calendar /></RequireAuth>} />
            <Route path="/tracking" element={<RequireAuth><TrackingMap /></RequireAuth>} />
            <Route path="/vault" element={<RequireAuth><SafetyVault /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
