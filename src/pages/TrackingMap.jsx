import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '../components/PageHeader';
import Toggle from '../components/Toggle';
import { useAuth } from '../contexts/AuthContext';
import { watchPosition } from '../services/locationService';
import { getLocations, upsertLocation, subscribeToFamily } from '../services/supabaseService';

// Leaflet's default marker icons resolve to broken image paths under a
// bundler. Point them at the CDN copies so pins actually render.
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const NAIROBI = [-1.2921, 36.8219]; // neutral starting view before any fix

export default function TrackingMap() {
  const { user, role, linkKey } = useAuth();
  const [positions, setPositions] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const stopWatchRef = useRef(null);

  useEffect(() => {
    if (!linkKey) return;
    let active = true;

    getLocations(linkKey).then((rows) => active && setPositions(rows));

    const unsubscribe = subscribeToFamily(linkKey, {
      onLocation: (row) => {
        setPositions((prev) => {
          const rest = prev.filter((p) => p.user_id !== row.user_id);
          return [...rest, row];
        });
      },
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [linkKey]);

  // Stop the GPS watch when the screen unmounts. Leaving it running is
  // the fastest way to drain a caregiver's battery.
  useEffect(() => () => stopWatchRef.current?.(), []);

  const toggleSharing = (next) => {
    setError('');

    if (!next) {
      stopWatchRef.current?.();
      stopWatchRef.current = null;
      setSharing(false);
      return;
    }

    stopWatchRef.current = watchPosition(
      async (position) => {
        setSharing(true);
        try {
          await upsertLocation({ link_key: linkKey, userId: user.id, ...position });
        } catch {
          /* a dropped write is fine; the next fix overwrites it */
        }
      },
      (err) => {
        setError(err.message);
        setSharing(false);
      }
    );
  };

  const center = positions.length
    ? [positions[0].latitude, positions[0].longitude]
    : NAIROBI;

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <PageHeader title="Location" showBack={false} />

      <div className="h-[55vh] w-full">
        <MapContainer center={center} zoom={positions.length ? 15 : 11} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter position={positions.length ? center : null} />

          {positions.map((position) => (
            <Marker
              key={position.user_id}
              position={[position.latitude, position.longitude]}
              icon={markerIcon}
            >
              <Popup>
                {position.user_id === user?.id ? 'You' : 'Caregiver'}
                <br />
                Updated {new Date(position.updated_at).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Popup>
            </Marker>
          ))}

          {positions
            .filter((p) => p.accuracy)
            .map((p) => (
              <Circle
                key={`acc-${p.user_id}`}
                center={[p.latitude, p.longitude]}
                radius={p.accuracy}
                pathOptions={{ color: '#0d9488', fillOpacity: 0.08, weight: 1 }}
              />
            ))}
        </MapContainer>
      </div>

      <div className="px-5 py-6">
        {role === 'caregiver' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Toggle
              checked={sharing}
              onChange={toggleSharing}
              label="Share my live location"
              description="The parent sees where you are while this is on. Turn it off when your shift ends."
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {positions.length === 0
              ? 'No one is sharing a location right now.'
              : `${positions.length} ${positions.length === 1 ? 'person is' : 'people are'} sharing a location.`}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Location needs HTTPS. On a phone over your local network it may not
          prompt — use the deployed site or localhost.
        </p>
      </div>
    </div>
  );
}

// Pans the map when a new fix arrives, without fighting the user if
// they have dragged away.
function Recenter({ position }) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (position && !done.current) {
      map.setView(position, 15);
      done.current = true;
    }
  }, [position, map]);

  return null;
}
