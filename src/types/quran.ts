export interface RawAyah {
  g: number; // global ayah number 1..6236
  n: number; // ayah number in surah
  t: string; // uthmani arabic text
  c: string; // clean arabic text (no diacritics, for search)
  u: string; // urdu translation (Fateh Muhammad Jalandhari)
  j: number; // juz 1..30
  p: number; // madani page 1..604
  r: number; // ruku
  h: number; // hizbQuarter
  sj: boolean; // sajdah
}

export interface RawSurah {
  n: number; // 1..114
  ar: string; // Arabic name
  en: string; // English transliterated name
  enT: string; // English meaning
  rev: 'M' | 'D'; // Meccan or Medinan
  ayahs: RawAyah[];
}

export interface MushafAyah extends RawAyah {
  surahNumber: number;
  surahAr: string;
  surahEn: string;
  displayArabic: string; // stripped of leading bismillah for surahs 2..114 (except 9)
  isSurahStart: boolean;
  hasBismillah: boolean;
  isRukuEnd?: boolean;
}

export interface MushafPage {
  pageNumber: number; // 1..N (13-line Mushaf page)
  juz: number;
  primarySurah: number;
  surahsOnPage: number[];
  items: MushafAyah[];
}

export interface SurahSummary {
  n: number;
  ar: string;
  en: string;
  enT: string;
  rev: 'M' | 'D';
  ayahCount: number;
  startPage: number;
  startJuz: number;
}

export interface JuzSummary {
  juz: number;
  urduName: string;
  arabicName: string;
  startPage: number;
  startSurah: number;
  startAyah: number;
}

export interface BookmarkItem {
  id: string;
  surah: number;
  ayah: number;
  page: number;
  note: string;
  color: 'emerald' | 'gold' | 'sapphire' | 'rose';
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface ReadingState {
  lastPage: number;
  lastSurah: number;
  lastAyah: number;
  updatedAt: number;
}

export type MushafEditionId = 'urdu13' | 'taj16';

export interface UserPreferences {
  nightMode: boolean;
  viewMode: 'single' | 'spread';
  readingMode: 'scanned' | 'mushaf' | 'verse';
  edition: MushafEditionId;
  zoom: number;
  reciter: string;
  showUrduInMushaf: boolean;
  updatedAt: number;
}

export interface SyncProfilePayload {
  syncCode: string;
  updatedAt: number;
  readingState: ReadingState | null;
  preferences: UserPreferences | null;
  bookmarks: BookmarkItem[];
}
