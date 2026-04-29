// Aurora — offline audio blobs on this device (IndexedDB).
// Used when the user saves from the local server and wants playback without the PC.

const DB_NAME = 'aurora-device-offline';
const DB_VERSION = 1;
const STORE = 'tracks';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'videoId' });
      }
    };
  });
}

/**
 * @param {{ videoId: string, title?: string, blob: Blob, mime?: string }} row
 */
export async function deviceOfflinePut(row) {
  const db = await openDb();
  const { videoId, title, blob, mime } = row;
  if (!videoId || !blob) throw new Error('missing videoId or blob');
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    tx.objectStore(STORE).put({
      videoId,
      title: title || 'Track',
      mime: mime || blob.type || 'application/octet-stream',
      blob,
      savedAt: Date.now(),
    });
  });
}

export async function deviceOfflineList() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const q = tx.objectStore(STORE).getAll();
      q.onerror = () => reject(q.error);
      q.onsuccess = () => resolve(q.result || []);
    });
  } catch {
    return [];
  }
}

export async function deviceOfflineDelete(videoId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    tx.objectStore(STORE).delete(videoId);
  });
}

/**
 * @returns {Promise<{ url: string, title: string, mime: string } | null>}
 */
export async function deviceOfflineBlobUrl(videoId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(videoId);
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      const row = r.result;
      if (!row?.blob) {
        resolve(null);
        return;
      }
      const url = URL.createObjectURL(row.blob);
      resolve({ url, title: row.title || 'Track', mime: row.mime || 'application/octet-stream' });
    };
  });
}
