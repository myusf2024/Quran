import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Menu,
  Moon,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  Square,
  Square as SinglePageIcon,
  Sun,
  WifiOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {AyahActionSheet} from './components/AyahActionSheet';
import {BookmarksSheet} from './components/BookmarksSheet';
import {IndexDrawer} from './components/IndexDrawer';
import {MushafPageCard} from './components/MushafPageCard';
import {PWAInstallButton} from './components/PWAInstallButton';
import {SearchModal} from './components/SearchModal';
import {SettingsSyncSheet} from './components/SettingsSyncSheet';
import {useOnlineStatus} from './hooks/useOnlineStatus';
import {
  getAllBookmarksRaw,
  getCachedQuranData,
  getLastSyncedAt,
  getOfflineAudioSurahs,
  getOfflineScannedJuz,
  getPreferences,
  getReadingState,
  getSyncCode,
  markJuzScansOffline,
  markSurahAudioOffline,
  putBookmark,
  putManyBookmarks,
  savePreferences,
  saveReadingState,
  saveSyncCode,
  setCachedQuranData,
} from './lib/localDb';
import {
  build13LineMushaf,
  getAudioUrl,
  getJuzPageRange,
  getScannedPageUrl,
  MUSHAF_EDITIONS,
  toArabicDigits,
} from './lib/mushaf13';
import {createOrLinkSyncProfile, pullSyncProfile, pushAndMergeSync} from './lib/syncClient';
import type {
  BookmarkItem,
  MushafAyah,
  MushafEditionId,
  RawSurah,
  ReadingState,
  SurahSummary,
  UserPreferences,
} from './types/quran';

const DEFAULT_PREFS: UserPreferences = {
  nightMode: false,
  viewMode: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'spread' : 'single',
  readingMode: 'scanned',
  edition: 'urdu13',
  zoom: 100,
  reciter: 'ar.alafasy',
  showUrduInMushaf: false,
  updatedAt: 0,
};

function normalizePrefs(raw?: Partial<UserPreferences> | null): UserPreferences {
  return {
    ...DEFAULT_PREFS,
    ...(raw ?? {}),
    edition: raw?.edition === 'taj16' ? 'taj16' : 'urdu13',
  };
}

const DEFAULT_READING: ReadingState = {
  lastPage: 1,
  lastSurah: 1,
  lastAyah: 1,
  updatedAt: 0,
};

export default function App() {
  const isOnline = useOnlineStatus();

  const [rawSurahs, setRawSurahs] = useState<RawSurah[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [readingState, setReadingState] = useState<ReadingState>(DEFAULT_READING);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [selectedAyah, setSelectedAyah] = useState<MushafAyah | null>(null);

  // Panels
  const [indexOpen, setIndexOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingGlobalAyah, setPlayingGlobalAyah] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatMode, setRepeatMode] = useState<'off' | 'ayah' | 'page'>('off');
  const [audioError, setAudioError] = useState<string | null>(null);

  // Offline audio & scanned pages download
  const [offlineAudioMap, setOfflineAudioMap] = useState<Record<string, number[]>>({});
  const [offlineScannedJuz, setOfflineScannedJuz] = useState<Record<string, number[]>>({});
  const [downloadingSurah, setDownloadingSurah] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingJuzScans, setDownloadingJuzScans] = useState<number | null>(null);
  const [juzScanProgress, setJuzScanProgress] = useState(0);

  // Sync state
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Touch gestures (pinch zoom + swipe)
  const touchStartRef = useRef<{x: number; y: number; time: number; dist: number | null; startZoom: number}>({
    x: 0,
    y: 0,
    time: 0,
    dist: null,
    startZoom: 100,
  });

  // Load Quran data & local IndexedDB state on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [
          cachedQuran,
          savedPrefs,
          savedReading,
          savedBookmarks,
          savedCode,
          savedSyncTs,
          savedOfflineAudio,
          savedOfflineJuz,
        ] = await Promise.all([
          getCachedQuranData(),
          getPreferences(),
          getReadingState(),
          getAllBookmarksRaw(),
          getSyncCode(),
          getLastSyncedAt(),
          getOfflineAudioSurahs(),
          getOfflineScannedJuz(),
        ]);

        if (cancelled) return;

        if (savedPrefs) setPrefs(normalizePrefs(savedPrefs));
        if (savedReading) setReadingState(savedReading);
        setBookmarks(savedBookmarks);
        setSyncCode(savedCode);
        setLastSyncedAt(savedSyncTs);
        setOfflineAudioMap(savedOfflineAudio);
        setOfflineScannedJuz(savedOfflineJuz);

        if (cachedQuran && cachedQuran.length === 114) {
          setRawSurahs(cachedQuran);
        } else {
          const res = await fetch('/data/quran.json');
          if (!res.ok) throw new Error('Failed to load offline Quran dataset');
          const data = (await res.json()) as RawSurah[];
          if (cancelled) return;
          setRawSurahs(data);
          setCachedQuranData(data);
        }

        if (savedCode && navigator.onLine) {
          try {
            const merged = await pushAndMergeSync(savedCode);
            if (!cancelled) {
              setBookmarks(merged.bookmarks);
              if (merged.readingState) setReadingState(merged.readingState);
              if (merged.preferences) setPrefs(normalizePrefs(merged.preferences));
              setLastSyncedAt(Date.now());
            }
          } catch {
            // Silent background sync failure when offline/unavailable
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to initialize Quran reader.');
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply Night Mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.nightMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [prefs.nightMode]);

  // Build active Mushaf Edition Index (13-Line Indo-Pak or 16-Line Taj Company)
  const mushaf = useMemo(() => {
    if (!rawSurahs) return null;
    return build13LineMushaf(rawSurahs, prefs.edition);
  }, [rawSurahs, prefs.edition]);

  const surahMap = useMemo(() => {
    const map = new Map<number, SurahSummary>();
    if (mushaf) {
      for (const s of mushaf.surahs) map.set(s.n, s);
    }
    return map;
  }, [mushaf]);

  const allAyahsList = useMemo(() => {
    if (!mushaf) return [];
    return Array.from(mushaf.ayahLookup.values());
  }, [mushaf]);

  const bookmarksMap = useMemo(() => {
    const map = new Map<string, BookmarkItem>();
    for (const bm of bookmarks) {
      if (!bm.deleted) {
        map.set(`${bm.surah}:${bm.ayah}`, bm);
      }
    }
    return map;
  }, [bookmarks]);

  const totalPages = mushaf?.pages.length ?? 1;
  const currentPageNum = Math.max(1, Math.min(totalPages, readingState.lastPage));

  // Determine pages to render (1-page or 2-page RTL book spread)
  const visiblePages = useMemo(() => {
    if (!mushaf) return [];
    if (prefs.viewMode === 'single') {
      const p = mushaf.pages[currentPageNum - 1];
      return p ? [p] : [];
    }
    // 2-Page Spread: odd page on right, even page on left (RTL book layout)
    const oddPageNum = currentPageNum % 2 === 1 ? currentPageNum : currentPageNum - 1;
    const rightPage = mushaf.pages[oddPageNum - 1];
    const leftPage = oddPageNum + 1 <= totalPages ? mushaf.pages[oddPageNum] : undefined;
    return [rightPage, leftPage].filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [mushaf, prefs.viewMode, currentPageNum, totalPages]);

  const currentPageObj = mushaf?.pages[currentPageNum - 1];
  const currentSurahObj = currentPageObj ? surahMap.get(currentPageObj.primarySurah) : undefined;

  // Background preload adjacent scanned Mushaf pages for instant page turns
  useEffect(() => {
    if (prefs.readingMode !== 'scanned' || !mushaf || !isOnline) return;
    const candidates = [currentPageNum + 1, currentPageNum + 2, currentPageNum - 1].filter(
      (p) => p >= 1 && p <= totalPages
    );
    const timers: number[] = [];
    candidates.forEach((p, idx) => {
      const t = window.setTimeout(() => {
        const img = new Image();
        img.src = getScannedPageUrl(prefs.edition, p);
      }, idx * 200);
      timers.push(t);
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [prefs.readingMode, prefs.edition, mushaf, currentPageNum, totalPages, isOnline]);

  // Debounced sync push when local data changes
  const syncTimerRef = useRef<number | null>(null);
  const scheduleSyncPush = useCallback(
    (codeOverride?: string | null) => {
      const activeCode = codeOverride ?? syncCode;
      if (!activeCode || !navigator.onLine) return;
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = window.setTimeout(async () => {
        try {
          const merged = await pushAndMergeSync(activeCode);
          setBookmarks(merged.bookmarks);
          setLastSyncedAt(Date.now());
        } catch {
          // keep local IndexedDB changes queued for next sync
        }
      }, 900);
    },
    [syncCode]
  );

  const updatePrefs = useCallback(
    (patch: Partial<UserPreferences>) => {
      setPrefs((prev) => {
        const next: UserPreferences = {...prev, ...patch, updatedAt: Date.now()};
        savePreferences(next);
        return next;
      });
      scheduleSyncPush();
    },
    [scheduleSyncPush]
  );

  const handleSwitchEdition = useCallback(
    (nextEdition: MushafEditionId) => {
      if (nextEdition === prefs.edition) return;
      const now = Date.now();
      let targetPage = 1;
      if (rawSurahs) {
        const nextIndex = build13LineMushaf(rawSurahs, nextEdition);
        const anchorItem = currentPageObj?.items[0];
        const lookupKey = anchorItem
          ? `${anchorItem.surahNumber}:${anchorItem.n}`
          : `${readingState.lastSurah}:${readingState.lastAyah}`;
        targetPage = nextIndex.ayahLookup.get(lookupKey)?.page ?? 1;
      }
      setPrefs((prev) => {
        const next: UserPreferences = {...prev, edition: nextEdition, updatedAt: now};
        savePreferences(next);
        return next;
      });
      setReadingState((prev) => {
        const next: ReadingState = {...prev, lastPage: targetPage, updatedAt: now};
        saveReadingState(next);
        return next;
      });
      scheduleSyncPush();
      window.scrollTo({top: 0, behavior: 'smooth'});
    },
    [prefs.edition, rawSurahs, currentPageObj, readingState.lastSurah, readingState.lastAyah, scheduleSyncPush]
  );

  const goToPage = useCallback(
    (targetPage: number, focusAyah?: {surah: number; ayah: number}) => {
      if (!mushaf) return;
      const clamped = Math.max(1, Math.min(mushaf.pages.length, targetPage));
      const pageData = mushaf.pages[clamped - 1];
      const firstItem = pageData?.items[0];
      const nextState: ReadingState = {
        lastPage: clamped,
        lastSurah: focusAyah?.surah ?? firstItem?.surahNumber ?? 1,
        lastAyah: focusAyah?.ayah ?? firstItem?.n ?? 1,
        updatedAt: Date.now(),
      };
      setReadingState(nextState);
      saveReadingState(nextState);
      scheduleSyncPush();
      window.scrollTo({top: 0, behavior: 'smooth'});
    },
    [mushaf, scheduleSyncPush]
  );

  const goNextPage = useCallback(() => {
    const step = prefs.viewMode === 'spread' ? 2 : 1;
    goToPage(Math.min(totalPages, currentPageNum + step));
  }, [prefs.viewMode, totalPages, currentPageNum, goToPage]);

  const goPrevPage = useCallback(() => {
    const step = prefs.viewMode === 'spread' ? 2 : 1;
    goToPage(Math.max(1, currentPageNum - step));
  }, [prefs.viewMode, currentPageNum, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (indexOpen || searchOpen || bookmarksOpen || settingsOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // RTL book keys: ArrowLeft = Next page, ArrowRight = Prev page
      if (e.key === 'ArrowLeft') goNextPage();
      if (e.key === 'ArrowRight') goPrevPage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [indexOpen, searchOpen, bookmarksOpen, settingsOpen, goNextPage, goPrevPage]);

  // Bookmark handlers
  const handleSaveBookmark = useCallback(
    async (ayah: MushafAyah, page: number, note: string, color: BookmarkItem['color']) => {
      const id = `${ayah.surahNumber}_${ayah.n}`;
      const existing = bookmarks.find((b) => b.id === id);
      const now = Date.now();
      const item: BookmarkItem = {
        id,
        surah: ayah.surahNumber,
        ayah: ayah.n,
        page,
        note,
        color,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        deleted: false,
      };
      await putBookmark(item);
      setBookmarks((prev) => {
        const filtered = prev.filter((b) => b.id !== id);
        return [item, ...filtered];
      });
      scheduleSyncPush();
    },
    [bookmarks, scheduleSyncPush]
  );

  const handleToggleQuickBookmark = useCallback(
    async (ayah: MushafAyah) => {
      const id = `${ayah.surahNumber}_${ayah.n}`;
      const existing = bookmarks.find((b) => b.id === id && !b.deleted);
      if (existing) {
        const deletedItem: BookmarkItem = {...existing, deleted: true, updatedAt: Date.now()};
        await putBookmark(deletedItem);
        setBookmarks((prev) => prev.map((b) => (b.id === id ? deletedItem : b)));
        scheduleSyncPush();
      } else {
        await handleSaveBookmark(ayah, currentPageNum, '', 'emerald');
      }
    },
    [bookmarks, currentPageNum, handleSaveBookmark, scheduleSyncPush]
  );

  const handleDeleteBookmark = useCallback(
    async (id: string) => {
      const existing = bookmarks.find((b) => b.id === id);
      if (!existing) return;
      const deletedItem: BookmarkItem = {...existing, deleted: true, updatedAt: Date.now()};
      await putBookmark(deletedItem);
      setBookmarks((prev) => prev.map((b) => (b.id === id ? deletedItem : b)));
      scheduleSyncPush();
    },
    [bookmarks, scheduleSyncPush]
  );

  // Audio playback
  const playGlobalAyah = useCallback(
    (globalAyah: number) => {
      setAudioError(null);
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      const loc = mushaf?.globalAyahToLoc.get(globalAyah);
      const url = getAudioUrl(prefs.reciter, globalAyah, loc?.surah, loc?.ayah);
      audio.src = url;
      audio.playbackRate = playbackRate;
      setPlayingGlobalAyah(globalAyah);
      audio
        .play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch(() => {
          setIsAudioPlaying(false);
          setAudioError('Unable to stream audio. Check connection or download Surah for offline playback.');
        });

      // Auto-turn page if recited ayah is on another page
      if (loc && loc.page !== currentPageNum) {
        const visibleSet = new Set(visiblePages.map((p) => p.pageNumber));
        if (!visibleSet.has(loc.page)) {
          goToPage(loc.page, {surah: loc.surah, ayah: loc.ayah});
        }
      }
    },
    [prefs.reciter, playbackRate, mushaf, currentPageNum, visiblePages, goToPage]
  );

  // Sync audio playbackRate & reciter changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (playingGlobalAyah !== null && isAudioPlaying) {
      playGlobalAyah(playingGlobalAyah);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.reciter]);

  // Audio ended -> advance to next Ayah or repeat
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (playingGlobalAyah === null) return;
      if (repeatMode === 'ayah') {
        playGlobalAyah(playingGlobalAyah);
        return;
      }
      if (repeatMode === 'page' && currentPageObj) {
        const items = currentPageObj.items;
        const lastOnPage = items[items.length - 1];
        if (lastOnPage && playingGlobalAyah === lastOnPage.g) {
          playGlobalAyah(items[0].g);
          return;
        }
      }
      if (playingGlobalAyah < 6236) {
        playGlobalAyah(playingGlobalAyah + 1);
      } else {
        setIsAudioPlaying(false);
        setPlayingGlobalAyah(null);
      }
    };

    const handleError = () => {
      setIsAudioPlaying(false);
      setAudioError('Audio unavailable offline for this Ayah.');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playingGlobalAyah, repeatMode, currentPageObj, playGlobalAyah]);

  const togglePlayPause = () => {
    if (playingGlobalAyah === null) {
      const startAyah = selectedAyah ?? currentPageObj?.items[0];
      if (startAyah) playGlobalAyah(startAyah.g);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsAudioPlaying(true))
        .catch(() => setAudioError('Unable to resume audio.'));
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
    setPlayingGlobalAyah(null);
    setAudioError(null);
  };

  // Offline Surah audio download into Cache Storage
  const handleDownloadSurahAudio = async (surahNumber: number) => {
    if (!rawSurahs) return;
    const surah = rawSurahs.find((s) => s.n === surahNumber);
    if (!surah) return;

    setDownloadingSurah(surahNumber);
    setDownloadProgress(0);
    try {
      const cache = await caches.open('quran-audio-cache');
      const total = surah.ayahs.length;
      for (let i = 0; i < total; i++) {
        const ay = surah.ayahs[i];
        const url = getAudioUrl(prefs.reciter, ay.g, surah.n, ay.n);
        const existing = await cache.match(url);
        if (!existing) {
          const resp = await fetch(url);
          if (resp.ok) {
            await cache.put(url, resp);
          }
        }
        setDownloadProgress(Math.round(((i + 1) / total) * 100));
      }
      const nextMap = await markSurahAudioOffline(prefs.reciter, surahNumber);
      setOfflineAudioMap(nextMap);
    } catch {
      setAudioError('Offline download interrupted. Please check your connection.');
    } finally {
      setDownloadingSurah(null);
      setDownloadProgress(0);
    }
  };

  // Offline scanned Para/Juz page downloader into Cache Storage
  const handleDownloadJuzScans = async (juzNumber: number) => {
    setDownloadingJuzScans(juzNumber);
    setJuzScanProgress(0);
    try {
      const cache = await caches.open('mushaf-scans-cache');
      const {startPage, endPage} = getJuzPageRange(prefs.edition, juzNumber, mushaf?.juzList);
      const total = endPage - startPage + 1;
      for (let p = startPage; p <= endPage; p++) {
        const url = getScannedPageUrl(prefs.edition, p);
        const existing = await cache.match(url);
        if (!existing) {
          const resp = await fetch(url);
          if (resp.ok) {
            await cache.put(url, resp);
          }
        }
        setJuzScanProgress(Math.round(((p - startPage + 1) / total) * 100));
      }
      const nextMap = await markJuzScansOffline(prefs.edition, juzNumber);
      setOfflineScannedJuz(nextMap);
    } catch {
      setAudioError('Unable to save Para pages offline. Check connection and try again.');
    } finally {
      setDownloadingJuzScans(null);
      setJuzScanProgress(0);
    }
  };

  // Sync handlers
  const handleCreateSyncCode = async (customCode?: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await createOrLinkSyncProfile(customCode);
      setSyncCode(data.syncCode);
      setBookmarks(data.bookmarks);
      setLastSyncedAt(Date.now());
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Unable to create sync code');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLinkSyncCode = async (code: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await pullSyncProfile(code);
      setSyncCode(data.syncCode);
      setBookmarks(data.bookmarks);
      if (data.readingState) setReadingState(data.readingState);
      if (data.preferences) setPrefs(normalizePrefs(data.preferences));
      setLastSyncedAt(Date.now());
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Unable to link sync code');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    if (!syncCode) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await pushAndMergeSync(syncCode);
      setBookmarks(data.bookmarks);
      if (data.readingState) setReadingState(data.readingState);
      if (data.preferences) setPrefs(normalizePrefs(data.preferences));
      setLastSyncedAt(Date.now());
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectSync = async () => {
    await saveSyncCode(null);
    setSyncCode(null);
    setSyncError(null);
  };

  const handleExportBackup = async () => {
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      readingState,
      preferences: prefs,
      bookmarks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noor-mushaf-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.bookmarks)) {
        await putManyBookmarks(parsed.bookmarks);
        setBookmarks(await getAllBookmarksRaw());
      }
      if (parsed.readingState) {
        await saveReadingState(parsed.readingState);
        setReadingState(parsed.readingState);
      }
      if (parsed.preferences) {
        const normalized = normalizePrefs(parsed.preferences);
        await savePreferences(normalized);
        setPrefs(normalized);
      }
      scheduleSyncPush();
    } catch {
      setSyncError('Invalid backup JSON file.');
    }
  };

  // Touch pinch-to-zoom & horizontal swipe handlers on Mushaf canvas
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.dist = Math.hypot(dx, dy);
      touchStartRef.current.startZoom = prefs.zoom;
    } else if (e.touches.length === 1) {
      touchStartRef.current.x = e.touches[0].clientX;
      touchStartRef.current.y = e.touches[0].clientY;
      touchStartRef.current.time = Date.now();
      touchStartRef.current.dist = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current.dist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const ratio = newDist / touchStartRef.current.dist;
      const nextZoom = Math.max(75, Math.min(220, Math.round((touchStartRef.current.startZoom * ratio) / 5) * 5));
      setPrefs((prev) => ({...prev, zoom: nextZoom}));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current.dist !== null) {
      // Save zoom after pinch completes
      savePreferences({...prefs, updatedAt: Date.now()});
      touchStartRef.current.dist = null;
      return;
    }
    if (e.changedTouches.length === 1 && prefs.zoom <= 115) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;
      // Quick horizontal swipe (> 65px, mostly horizontal)
      if (dt < 450 && Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        // RTL Mushaf swipe: swipe right -> next page, swipe left -> prev page
        if (dx > 0) goNextPage();
        else goPrevPage();
      }
    }
  };

  const playingAyahLoc = playingGlobalAyah ? mushaf?.globalAyahToLoc.get(playingGlobalAyah) : undefined;
  const activeBookmarkForSelected = selectedAyah
    ? bookmarksMap.get(`${selectedAyah.surahNumber}:${selectedAyah.n}`)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#1A1916] dark:bg-[#0C0F0E] dark:text-[#EDE8DC] transition-colors duration-200">
      {/* Compact Sticky Top Bar (48px) */}
      <header className="sticky top-0 z-30 h-12 pt-safe bg-[#FAF7F0]/92 dark:bg-[#0C0F0E]/92 backdrop-blur-md border-b border-[#E6DEC8] dark:border-[#222B27] px-2 sm:px-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => setIndexOpen(true)}
            aria-label="Open Quran index"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#1A1916] dark:text-[#EDE8DC] hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIndexOpen(true)}
            className="flex items-center gap-2 min-w-0 text-left px-1.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span className="font-display text-sm font-semibold tracking-tight truncate whitespace-nowrap">
              {currentSurahObj ? currentSurahObj.en : 'Noor Mushaf'}
            </span>
            {currentPageObj && (
              <span className="hidden sm:inline text-xs text-[#6B6556] dark:text-[#9D9788] whitespace-nowrap">
                · Para {currentPageObj.juz} · p.{currentPageNum}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleSwitchEdition(prefs.edition === 'urdu13' ? 'taj16' : 'urdu13')}
            title="Switch Scanned Mushaf Edition (13-Line Indo-Pak / 16-Line Taj Company)"
            className="min-h-[36px] px-2 rounded-lg border border-[#D8CEB6] dark:border-[#2C3732] text-[11px] font-medium text-[#0F6B4E] dark:text-[#D4AF37] hover:bg-[#EFE9DA] dark:hover:bg-[#1E2623] transition-colors whitespace-nowrap"
          >
            {MUSHAF_EDITIONS.find((e) => e.id === prefs.edition)?.shortLabel ?? '13-Line'}
          </button>

          <PWAInstallButton compact />

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search Quran"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#4E4A40] dark:text-[#C5BFB0] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setBookmarksOpen(true)}
            aria-label="Bookmarks"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#4E4A40] dark:text-[#C5BFB0] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => updatePrefs({nightMode: !prefs.nightMode})}
            aria-label="Toggle night mode"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#4E4A40] dark:text-[#C5BFB0] hover:bg-black/5 dark:hover:bg-white/5"
          >
            {prefs.nightMode ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Reader settings and sync"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#4E4A40] dark:text-[#C5BFB0] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Mushaf Reading Viewport */}
      <main
        className="flex-1 flex flex-col items-center justify-start px-2 sm:px-6 pt-3 pb-24 overflow-x-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!isOnline && (
          <div className="mb-2.5 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Mode — Reading from local database</span>
          </div>
        )}

        {audioError && (
          <div className="mb-2.5 text-xs text-[#A63A50] dark:text-[#E5738A] text-center px-3">{audioError}</div>
        )}

        {loadError ? (
          <div className="my-12 max-w-md rounded-2xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] p-6 text-center space-y-3">
            <BookOpen className="w-8 h-8 mx-auto text-[#0F6B4E] dark:text-[#D4AF37]" />
            <p className="text-sm text-[#1A1916] dark:text-[#EDE8DC]">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[42px] px-4 rounded-xl bg-[#0F6B4E] text-white text-xs font-medium"
            >
              Retry
            </button>
          </div>
        ) : !mushaf ? (
          <div className="w-full max-w-2xl rounded-2xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] p-8 sm:p-12 text-center space-y-3 my-4">
            <div className="font-quran text-3xl text-[#0F6B4E] dark:text-[#D4AF37]" dir="rtl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
            <p className="text-sm text-[#6B6556] dark:text-[#9D9788]">
              Loading {prefs.edition === 'taj16' ? '16-Line Taj Company' : '13-Line Urdu'} Mushaf…
            </p>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-3">
            {/* Desktop Next Page (Left side for RTL Quran book) */}
            <button
              type="button"
              onClick={goNextPage}
              disabled={currentPageNum >= totalPages}
              aria-label="Next page"
              className="hidden lg:flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-[#E6DEC8] dark:border-[#252E2A] bg-[#FFFDF8] dark:bg-[#141917] text-[#4E4A40] dark:text-[#C5BFB0] hover:bg-[#EFE9DA] dark:hover:bg-[#1E2623] disabled:opacity-30 shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              className={`w-full ${
                prefs.viewMode === 'spread' && visiblePages.length === 2
                  ? 'max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 items-start'
                  : 'max-w-2xl'
              }`}
              dir={prefs.viewMode === 'spread' ? 'rtl' : 'ltr'}
            >
              {visiblePages.map((page) => (
                <div key={page.pageNumber} dir="ltr" className="w-full">
                  <MushafPageCard
                    page={page}
                    edition={prefs.edition}
                    surahMap={surahMap}
                    readingMode={prefs.readingMode}
                    zoom={prefs.zoom}
                    selectedAyahKey={selectedAyah ? `${selectedAyah.surahNumber}:${selectedAyah.n}` : null}
                    playingGlobalAyah={playingGlobalAyah}
                    bookmarksMap={bookmarksMap}
                    showUrduInMushaf={prefs.showUrduInMushaf}
                    onSelectAyah={(ayah) => {
                      setSelectedAyah((prev) =>
                        prev?.g === ayah.g ? null : ayah
                      );
                    }}
                    onPlayAyah={(ayah) => playGlobalAyah(ayah.g)}
                    onToggleBookmark={handleToggleQuickBookmark}
                    onDoubleTapZoom={() => updatePrefs({zoom: prefs.zoom > 110 ? 100 : 145})}
                  />
                </div>
              ))}
            </div>

            {/* Desktop Previous Page (Right side for RTL Quran book) */}
            <button
              type="button"
              onClick={goPrevPage}
              disabled={currentPageNum <= 1}
              aria-label="Previous page"
              className="hidden lg:flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-[#E6DEC8] dark:border-[#252E2A] bg-[#FFFDF8] dark:bg-[#141917] text-[#4E4A40] dark:text-[#C5BFB0] hover:bg-[#EFE9DA] dark:hover:bg-[#1E2623] disabled:opacity-30 shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Selected Ayah Urdu & Action Sheet */}
      <AyahActionSheet
        ayah={selectedAyah}
        pageNumber={currentPageNum}
        bookmark={activeBookmarkForSelected}
        isPlayingThis={Boolean(selectedAyah && playingGlobalAyah === selectedAyah.g && isAudioPlaying)}
        onClose={() => setSelectedAyah(null)}
        onPlay={(ayah) => playGlobalAyah(ayah.g)}
        onSaveBookmark={handleSaveBookmark}
        onDeleteBookmark={handleDeleteBookmark}
      />

      {/* Compact Sticky Bottom Thumb Control Bar (56px) */}
      <footer className="fixed bottom-0 inset-x-0 z-30 h-14 pb-safe bg-[#FAF7F0]/95 dark:bg-[#0C0F0E]/95 backdrop-blur-md border-t border-[#E6DEC8] dark:border-[#222B27] px-2 sm:px-5 flex items-center justify-between gap-2">
        {/* Audio Play/Stop Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isAudioPlaying ? 'Pause recitation' : 'Play recitation'}
            className="min-h-[42px] min-w-[42px] px-2.5 rounded-xl bg-[#0F6B4E] text-white dark:bg-[#2D8A68] flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-[#0B543D] transition-colors"
          >
            {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {playingAyahLoc ? (
              <span className="tabular-nums hidden sm:inline">
                {playingAyahLoc.surah}:{playingAyahLoc.ayah}
              </span>
            ) : (
              <span className="hidden sm:inline">Recite</span>
            )}
          </button>

          {playingGlobalAyah !== null && (
            <button
              type="button"
              onClick={stopAudio}
              aria-label="Stop audio"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5E5A4F] dark:text-[#A8A395] hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Square className="w-3.5 h-3.5" fill="currentColor" />
            </button>
          )}
        </div>

        {/* Center RTL Page Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goNextPage}
            disabled={currentPageNum >= totalPages}
            aria-label="Next Mushaf page"
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-[#1A1916] dark:text-[#EDE8DC] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIndexOpen(true)}
            className="min-h-[38px] px-2.5 rounded-lg text-xs font-medium tabular-nums text-[#1A1916] dark:text-[#EDE8DC] hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap"
          >
            <span className="font-urdu text-sm ml-1" dir="rtl">
              {toArabicDigits(currentPageNum)}
            </span>{' '}
            <span className="text-[#6B6556] dark:text-[#9D9788]">/ {totalPages}</span>
          </button>

          <button
            type="button"
            onClick={goPrevPage}
            disabled={currentPageNum <= 1}
            aria-label="Previous Mushaf page"
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-[#1A1916] dark:text-[#EDE8DC] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Quick Zoom & 1-Page / 2-Page Toggle */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => updatePrefs({zoom: Math.max(75, prefs.zoom - 10)})}
            aria-label="Zoom out"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#4E4A40] dark:text-[#C5BFB0] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => updatePrefs({zoom: 100})}
            aria-label="Reset zoom"
            className="hidden sm:inline-flex min-h-[36px] px-1.5 items-center justify-center rounded-lg text-xs tabular-nums text-[#5E5A4F] dark:text-[#A8A395] hover:bg-black/5 dark:hover:bg-white/5"
          >
            {prefs.zoom}%
          </button>

          <button
            type="button"
            onClick={() => updatePrefs({zoom: Math.min(220, prefs.zoom + 10)})}
            aria-label="Zoom in"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#4E4A40] dark:text-[#C5BFB0] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => updatePrefs({viewMode: prefs.viewMode === 'single' ? 'spread' : 'single'})}
            aria-label={prefs.viewMode === 'single' ? 'Switch to 2-page spread' : 'Switch to 1-page view'}
            title={prefs.viewMode === 'single' ? 'Switch to 2-Page Spread' : 'Switch to 1-Page View'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#0F6B4E] dark:text-[#D4AF37] hover:bg-black/5 dark:hover:bg-white/5"
          >
            {prefs.viewMode === 'single' ? <Columns2 className="w-4 h-4" /> : <SinglePageIcon className="w-4 h-4" />}
          </button>
        </div>
      </footer>

      {/* Drawers & Modals */}
      {mushaf && (
        <>
          <IndexDrawer
            open={indexOpen}
            onClose={() => setIndexOpen(false)}
            edition={prefs.edition}
            onSwitchEdition={handleSwitchEdition}
            surahs={mushaf.surahs}
            juzList={mushaf.juzList}
            currentPage={currentPageNum}
            totalPages={totalPages}
            onJumpToPage={(p) => goToPage(p)}
          />

          <SearchModal
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            allAyahs={allAyahsList}
            onJumpToAyah={(page, ayah) => {
              goToPage(page, {surah: ayah.surahNumber, ayah: ayah.n});
              setSelectedAyah(ayah);
            }}
            onPlayAyah={(page, ayah) => {
              goToPage(page, {surah: ayah.surahNumber, ayah: ayah.n});
              setSelectedAyah(ayah);
              playGlobalAyah(ayah.g);
            }}
          />

          <BookmarksSheet
            open={bookmarksOpen}
            onClose={() => setBookmarksOpen(false)}
            bookmarks={bookmarks}
            readingState={readingState}
            surahMap={surahMap}
            ayahLookup={mushaf.ayahLookup}
            onJumpToBookmark={(page, surah, ayah) => {
              goToPage(page, {surah, ayah});
              const entry = mushaf.ayahLookup.get(`${surah}:${ayah}`);
              if (entry) setSelectedAyah(entry.ayah);
            }}
            onDeleteBookmark={handleDeleteBookmark}
          />

          <SettingsSyncSheet
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onSwitchEdition={handleSwitchEdition}
            playbackRate={playbackRate}
            onChangePlaybackRate={setPlaybackRate}
            repeatMode={repeatMode}
            onChangeRepeatMode={setRepeatMode}
            currentSurah={currentSurahObj}
            currentJuz={currentPageObj?.juz ?? 1}
            offlineAudioMap={offlineAudioMap}
            offlineScannedJuz={offlineScannedJuz}
            downloadingSurah={downloadingSurah}
            downloadProgress={downloadProgress}
            downloadingJuzScans={downloadingJuzScans}
            juzScanProgress={juzScanProgress}
            onDownloadSurahAudio={handleDownloadSurahAudio}
            onDownloadJuzScans={handleDownloadJuzScans}
            syncCode={syncCode}
            lastSyncedAt={lastSyncedAt}
            isSyncing={isSyncing}
            syncError={syncError}
            isOnline={isOnline}
            onCreateSyncCode={handleCreateSyncCode}
            onLinkSyncCode={handleLinkSyncCode}
            onSyncNow={handleSyncNow}
            onDisconnectSync={handleDisconnectSync}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        </>
      )}
    </div>
  );
}
