// Photo handling for activity logs.
//
// Cloudinary is optional. Without it, photos become data URLs stored
// directly in the activity_logs row — which is why compression below is
// not a nicety. A modern phone camera produces a 3–5 MB JPEG, and
// base64 adds about a third on top. Dropping that straight into a
// Postgres text column would bloat every row, and realtime broadcasts
// the whole row to the parent's device on every insert.
//
// So: resize to fit 1280px and re-encode at quality 0.7 before doing
// anything else. A typical result is 100–250 KB.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_EDGE = 1280;
const QUALITY = 0.7;

export const isCloudinaryConfigured = () => Boolean(CLOUD_NAME && UPLOAD_PRESET);

// Resize and re-encode in the browser. Returns a Blob.
export async function compressImage(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('That file is not an image.');
  }

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  );

  if (!blob) throw new Error('Could not process that photo.');
  return blob;
}

// A small preview URL for the picker. Revoke it when done.
export const previewUrl = (blobOrFile) => URL.createObjectURL(blobOrFile);

export async function uploadPhoto(fileOrBlob) {
  if (!fileOrBlob) return null;

  const compressed =
    fileOrBlob instanceof Blob && fileOrBlob.type === 'image/jpeg'
      ? fileOrBlob
      : await compressImage(fileOrBlob);

  if (!isCloudinaryConfigured()) return toDataUrl(compressed);

  const form = new FormData();
  form.append('file', compressed);
  form.append('upload_preset', UPLOAD_PRESET);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Upload rejected');
    const data = await res.json();
    return data.secure_url;
  } catch {
    // Never lose the photo to a network problem — fall back to the
    // inline copy so the log still carries it.
    return toDataUrl(compressed);
  }
}

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(blob);
  });
}
