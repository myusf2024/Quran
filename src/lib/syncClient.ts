import type {BookmarkItem, ReadingState, SyncProfilePayload, UserPreferences} from '../types/quran';
import {
  getAllBookmarksRaw,
  getPreferences,
  getReadingState,
  putManyBookmarks,
  saveLastSyncedAt,
  savePreferences,
  saveReadingState,
  saveSyncCode,
} from './localDb';

export function mergeBookmarkLists(localList: BookmarkItem[], remoteList: BookmarkItem[]): BookmarkItem[] {
  const map = new Map<string, BookmarkItem>();
  for (const item of localList) {
    map.set(item.id, item);
  }
  for (const item of remoteList) {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function createOrLinkSyncProfile(desiredCode?: string): Promise<SyncProfilePayload> {
  const [bookmarks, readingState, preferences] = await Promise.all([
    getAllBookmarksRaw(),
    getReadingState(),
    getPreferences(),
  ]);

  const res = await fetch('/api/sync/create', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      syncCode: desiredCode?.trim() || undefined,
      bookmarks,
      readingState,
      preferences,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create sync profile');
  }

  const data = (await res.json()) as SyncProfilePayload;
  await applyRemotePayload(data);
  return data;
}

export async function pullSyncProfile(syncCode: string): Promise<SyncProfilePayload> {
  const res = await fetch(`/api/sync/pull?code=${encodeURIComponent(syncCode.trim().toUpperCase())}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Sync profile not found');
  }
  const data = (await res.json()) as SyncProfilePayload;
  await applyRemotePayload(data);
  return data;
}

export async function pushAndMergeSync(syncCode: string): Promise<SyncProfilePayload> {
  const [bookmarks, readingState, preferences] = await Promise.all([
    getAllBookmarksRaw(),
    getReadingState(),
    getPreferences(),
  ]);

  const res = await fetch('/api/sync/push', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      syncCode,
      bookmarks,
      readingState,
      preferences,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Sync push failed');
  }

  const data = (await res.json()) as SyncProfilePayload;
  await applyRemotePayload(data);
  return data;
}

async function applyRemotePayload(remote: SyncProfilePayload): Promise<{
  bookmarks: BookmarkItem[];
  readingState: ReadingState | null;
  preferences: UserPreferences | null;
}> {
  const [localBookmarks, localReading, localPrefs] = await Promise.all([
    getAllBookmarksRaw(),
    getReadingState(),
    getPreferences(),
  ]);

  const mergedBookmarks = mergeBookmarkLists(localBookmarks, remote.bookmarks ?? []);
  await putManyBookmarks(mergedBookmarks);

  let nextReading = localReading;
  if (remote.readingState && (!localReading || remote.readingState.updatedAt >= localReading.updatedAt)) {
    nextReading = remote.readingState;
    await saveReadingState(nextReading);
  }

  let nextPrefs = localPrefs;
  if (remote.preferences && (!localPrefs || remote.preferences.updatedAt >= localPrefs.updatedAt)) {
    nextPrefs = remote.preferences;
    await savePreferences(nextPrefs);
  }

  await saveSyncCode(remote.syncCode);
  await saveLastSyncedAt(Date.now());

  return {
    bookmarks: mergedBookmarks,
    readingState: nextReading,
    preferences: nextPrefs,
  };
}
