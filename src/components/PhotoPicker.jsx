import { useEffect, useRef, useState } from 'react';
import { compressImage, previewUrl, isCloudinaryConfigured } from '../services/cloudinaryService';

/* Attach a photo to an activity log.

   Two separate inputs rather than one. `capture="environment"` opens
   the camera directly on a phone, which is what a caregiver wants
   mid-activity; the plain input opens the gallery for a photo taken
   earlier. One input cannot do both — the capture attribute removes
   the choice.

   Compression happens here, on selection, so the person sees the real
   size before saving and the parent is not waiting on a 4 MB upload. */

export default function PhotoPicker({ photo, onChange, disabled }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Object URLs leak until revoked.
  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const url = previewUrl(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // lets the same file be picked again
    if (!file) return;

    setError('');
    setBusy(true);
    try {
      onChange(await compressImage(file));
    } catch (err) {
      setError(err.message || 'Could not use that photo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="text-sm font-medium text-slate-700">Photo</span>
      <span className="ml-1 text-xs text-slate-400">Optional</span>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {preview ? (
        <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={preview} alt="Selected" className="h-48 w-full object-cover" />
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-slate-500">
              {Math.round(photo.size / 1024)} KB
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-sm text-red-600 underline"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1.5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => cameraRef.current?.click()}
            className="rounded-xl border border-slate-200 bg-white py-4 text-center disabled:opacity-50"
          >
            <span className="block text-2xl" aria-hidden="true">📷</span>
            <span className="mt-1 block text-sm font-medium text-slate-700">
              {busy ? 'Processing…' : 'Take a photo'}
            </span>
          </button>

          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => galleryRef.current?.click()}
            className="rounded-xl border border-slate-200 bg-white py-4 text-center disabled:opacity-50"
          >
            <span className="block text-2xl" aria-hidden="true">🖼️</span>
            <span className="mt-1 block text-sm font-medium text-slate-700">Add a photo</span>
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {!isCloudinaryConfigured() && (
        <p className="mt-1.5 text-xs text-slate-400">
          Photos are shrunk and stored with the log. Add Cloudinary keys later
          for full-size hosting.
        </p>
      )}
    </div>
  );
}
