import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Nav items differ by role: a caregiver logs, a parent reviews.
const PARENT_ITEMS = [
  { to: '/parent',   label: 'Today',    icon: '🏠' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/tracking', label: 'Location', icon: '📍' },
  { to: '/vault',    label: 'Vault',    icon: '🛡️' },
  { to: '/profile',  label: 'Profile',  icon: '👤' },
];

// The caregiver needs the Vault more than the parent does — it is what
// they reach for when the parent is unreachable. It was missing here,
// which made the whole screen unreachable for them.
// Location moved to a card on the caregiver's home screen: sharing is a
// once-a-shift action, not something tapped constantly, and five nav
// items stay legible on a narrow phone where six do not.
const CAREGIVER_ITEMS = [
  { to: '/caregiver', label: 'Home',     icon: '🏠' },
  { to: '/log',       label: 'Log',      icon: '📝' },
  { to: '/calendar',  label: 'Calendar', icon: '📅' },
  { to: '/vault',     label: 'Vault',    icon: '🛡️' },
  { to: '/profile',   label: 'Profile',  icon: '👤' },
];

// Routes where a bottom bar would be noise rather than navigation.
const HIDE_ON = ['/login', '/register', '/link-family'];

export default function BottomNav() {
  const { session, role } = useAuth();
  const { pathname } = useLocation();

  if (!session || HIDE_ON.includes(pathname)) return null;

  const items = role === 'caregiver' ? CAREGIVER_ITEMS : PARENT_ITEMS;

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-xs transition ${
                  isActive ? 'text-teal-700 font-medium' : 'text-slate-500'
                }`
              }
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
