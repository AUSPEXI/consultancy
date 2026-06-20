/**
 * Simple IndexedDB module to persist user uploaded media files (Blobs/Files)
 * across page refreshing and code rebuilds of the applet.
 */

const DB_NAME = 'vids_storyboard_db';
const DB_VERSION = 1;

export interface PersistedBroll {
  panelId: number;
  file: Blob;
  isVideo: boolean;
  name: string;
}

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
      if (!db.objectStoreNames.contains('brolls')) {
        db.createObjectStore('brolls', { keyPath: 'panelId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save a general file (e.g. the voiceover track)
 */
export async function saveAudioFile(file: File | Blob, name: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');
    const request = store.put({ file, name }, 'voiceover_audio_track');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get the saved audio file
 */
export async function getAudioFile(): Promise<{ file: Blob; name: string } | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get('voiceover_audio_track');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Delete the saved audio file
 */
export async function deleteAudioFile(): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.delete('voiceover_audio_track');

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {}
}

/**
 * Save generic file (like custom intro/outro) with metadata
 */
export async function saveGenericFile(key: string, file: File | Blob, metadata: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');
    const request = store.put({ file, name: (file as File).name || 'file', metadata }, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get generic file
 */
export async function getGenericFile(key: string): Promise<{ file: Blob; name: string; metadata: any } | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Delete generic file
 */
export async function deleteGenericFile(key: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {}
}

/**
 * Save a B-roll file for a specific panel
 */
export async function saveBrollFile(panelId: number, file: File | Blob, isVideo: boolean, name: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('brolls', 'readwrite');
    const store = transaction.objectStore('brolls');
    const request = store.put({ panelId, file, isVideo, name });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all saved B-roll files
 */
export async function getAllBrollFiles(): Promise<PersistedBroll[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('brolls', 'readonly');
      const store = transaction.objectStore('brolls');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Delete a saved B-roll file
 */
export async function deleteBrollFile(panelId: number): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('brolls', 'readwrite');
      const store = transaction.objectStore('brolls');
      const request = store.delete(panelId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {}
}
