import type {BookmarkItem, RawSurah, ReadingState, UserPreferences} from '../types/quran';

const DB_NAME = 'noor_mushaf_db';
const DB_VERSION = 1;
const STORE_KV = 'kv';
const STORE_BOOKMARKS = 'bookmarks';
const STORE_QURAN = 'quran_cache';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV);
      }
      if (!db.objectStoreNames.contains(STORE_BOOKMARKS)) {
        db.createObjectStore(STORE_BOOKMARKS, {keyPath: 'id'});
      }
      if (!db.objectStoreNames.contains(STORE_QURAN)) {
        db.createObjectStore(STORE_QURAN);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function kvGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readonly');
    const req = tx.objectStore(STORE_KV).get(key);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function kvSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readwrite');
    tx.objectStore(STORE_KV).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedQuranData(): Promise<RawSurah[] | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QURAN, 'readonly');
      const req = tx.objectStore(STORE_QURAN).get('full_quran_v1');
      req.onsuccess = () => resolve((req.result as RawSurah[] | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function setCachedQuranData(data: RawSurah[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QURAN, 'readwrite');
      tx.objectStore(STORE_QURAN).put(data, 'full_quran_v1');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export async function getAllBookmarksRaw(): Promise<BookmarkItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKMARKS, 'readonly');
    const req = tx.objectStore(STORE_BOOKMARKS).getAll();
    req.onsuccess = () => {
      const list = (req.result as BookmarkItem[]) ?? [];
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putBookmark(item: BookmarkItem): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKMARKS, 'readwrite');
    tx.objectStore(STORE_BOOKMARKS).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function putManyBookmarks(items: BookmarkItem[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKMARKS, 'readwrite');
    const store = tx.objectStore(STORE_BOOKMARKS);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getReadingState(): Promise<ReadingState | null> {
  return kvGet<ReadingState>('reading_state');
}

export async function saveReadingState(state: ReadingState): Promise<void> {
  return kvSet('reading_state', state);
}

export async function getPreferences(): Promise<UserPreferences | null> {
  return kvGet<UserPreferences>('preferences');
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  try {
    localStorage.setItem('noor_mushaf_theme', prefs.nightMode ? 'dark' : 'light');
  } catch {
    // ignore
  }
  return kvSet('preferences', prefs);
}

export async function getSyncCode(): Promise<string | null> {
  return kvGet<string>('sync_code');
}

export async function saveSyncCode(code: string | null): Promise<void> {
  return kvSet('sync_code', code);
}

export async function getLastSyncedAt(): Promise<number | null> {
  return kvGet<number>('last_synced_at');
}

export async function saveLastSyncedAt(ts: number): Promise<void> {
  return kvSet('last_synced_at', ts);
}

export async function getOfflineAudioSurahs(): Promise<Record<string, number[]>> {
  return (await kvGet<Record<string, number[]>>('offline_audio_surahs')) ?? {};
}

export async function markSurahAudioOffline(reciter: string, surahNumber: number): Promise<Record<string, number[]>> {
  const current = await getOfflineAudioSurahs();
  const list = Array.from(new Set([...(current[reciter] ?? []), surahNumber])).sort((a, b) => a - b);
  const next = {...current, [reciter]: list};
  await kvSet('offline_audio_surahs', next);
  return next;
}

export async function getOfflineScannedJuz(): Promise<Record<string, number[]>> {
  const val = await kvGet<Record<string, number[]> | number[]>('offline_scanned_juz');
  if (Array.isArray(val)) return {urdu13: val};
  return val ?? {};
}

export async function markJuzScansOffline(edition: string, juz: number): Promise<Record<string, number[]>> {
  const current = await getOfflineScannedJuz();
  const list = Array.from(new Set([...(current[edition] ?? []), juz])).sort((a, b) => a - b);
  const next = {...current, [edition]: list};
  await kvSet('offline_scanned_juz', next);
  return next;
}

