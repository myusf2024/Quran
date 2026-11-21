import React, {useRef, useState} from 'react';
import {
  Check,
  CloudOff,
  Download,
  HardDriveDownload,
  Moon,
  RefreshCw,
  Sun,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import type {MushafEditionId, SurahSummary, UserPreferences} from '../types/quran';
import {MUSHAF_EDITIONS, RECITERS} from '../lib/mushaf13';
import {PWAInstallButton} from './PWAInstallButton';

interface SettingsSyncSheetProps {
  open: boolean;
  onClose: () => void;
  prefs: UserPreferences;
  onUpdatePrefs: (patch: Partial<UserPreferences>) => void;
  onSwitchEdition: (edition: MushafEditionId) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  repeatMode: 'off' | 'ayah' | 'page';
  onChangeRepeatMode: (mode: 'off' | 'ayah' | 'page') => void;
  currentSurah: SurahSummary | undefined;
  currentJuz: number;
  offlineAudioMap: Record<string, number[]>;
  offlineScannedJuz: Record<string, number[]>;
  downloadingSurah: number | null;
  downloadProgress: number;
  downloadingJuzScans: number | null;
  juzScanProgress: number;
  onDownloadSurahAudio: (surahNumber: number) => void;
  onDownloadJuzScans: (juz: number) => void;
  syncCode: string | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  syncError: string | null;
  isOnline: boolean;
  onCreateSyncCode: (customCode?: string) => Promise<void>;
  onLinkSyncCode: (code: string) => Promise<void>;
  onSyncNow: () => Promise<void>;
  onDisconnectSync: () => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (file: File) => Promise<void>;
}

export const SettingsSyncSheet: React.FC<SettingsSyncSheetProps> = ({
  open,
  onClose,
  prefs,
  onUpdatePrefs,
  onSwitchEdition,
  playbackRate,
  onChangePlaybackRate,
  repeatMode,
  onChangeRepeatMode,
  currentSurah,
  currentJuz,
  offlineAudioMap,
  offlineScannedJuz,
  downloadingSurah,
  downloadProgress,
  downloadingJuzScans,
  juzScanProgress,
  onDownloadSurahAudio,
  onDownloadJuzScans,
  syncCode,
  lastSyncedAt,
  isSyncing,
  syncError,
  isOnline,
  onCreateSyncCode,
  onLinkSyncCode,
  onSyncNow,
  onDisconnectSync,
  onExportBackup,
  onImportBackup,
}) => {
  const [linkInput, setLinkInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const cachedSurahsForReciter = offlineAudioMap[prefs.reciter] ?? [];
  const isCurrentSurahCached = currentSurah ? cachedSurahsForReciter.includes(currentSurah.n) : false;
  const cachedJuzForEdition = offlineScannedJuz[prefs.edition] ?? [];
  const activeEditionMeta = MUSHAF_EDITIONS.find((e) => e.id === prefs.edition) ?? MUSHAF_EDITIONS[0];

  const handleCopyCode = async () => {
    if (!syncCode) return;
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-md bg-[#FAF7F0] dark:bg-[#0E1311] border-l border-[#E6DEC8] dark:border-[#252E2A] h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6DEC8] dark:border-[#252E2A]">
          <h2 className="font-display text-base font-semibold text-[#1A1916] dark:text-[#EDE8DC]">
            Reader, Audio &amp; Local Sync
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#5E5A4F] dark:text-[#A8A395] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Install App */}
          <PWAInstallButton />

          {/* Scanned Mushaf Edition Switcher */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-[#5E5A4F] dark:text-[#A8A395]">
              Scanned Mushaf Edition
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {MUSHAF_EDITIONS.map((ed) => {
                const active = prefs.edition === ed.id;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => onSwitchEdition(ed.id)}
                    className={`rounded-xl p-3 text-left border transition-colors ${
                      active
                        ? 'bg-[#0F6B4E]/10 dark:bg-[#D4AF37]/15 border-[#0F6B4E] dark:border-[#D4AF37]'
                        : 'bg-[#FFFDF8] dark:bg-[#141917] border-[#E6DEC8] dark:border-[#252E2A] hover:bg-[#EFE9DA]/60 dark:hover:bg-[#1C2420]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#1A1916] dark:text-[#EDE8DC]">
                        {ed.name}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-[#0F6B4E] dark:text-[#D4AF37] shrink-0" />}
                    </div>
                    <div className="mt-1 font-urdu text-sm text-[#0F6B4E] dark:text-[#D4AF37]" dir="rtl">
                      {ed.urduLabel}
                    </div>
                    <div className="mt-1 text-[11px] text-[#6B6556] dark:text-[#9D9788] tabular-nums">
                      {ed.totalPages} pages · {ed.publisher}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Reading Appearance */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-[#5E5A4F] dark:text-[#A8A395]">
              Display &amp; Layout
            </h3>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] p-3">
              <div>
                <div className="text-sm font-medium text-[#1A1916] dark:text-[#EDE8DC]">Night Mode</div>
                <div className="text-xs text-[#6B6556] dark:text-[#9D9788]">Low-glare dark canvas for night reading</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePrefs({nightMode: !prefs.nightMode})}
                className="min-h-[42px] px-3.5 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] inline-flex items-center gap-2 text-xs font-medium text-[#1A1916] dark:text-[#EDE8DC] hover:bg-black/5 dark:hover:bg-white/5"
              >
                {prefs.nightMode ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-[#0F6B4E]" />}
                <span>{prefs.nightMode ? 'Day' : 'Night'}</span>
              </button>
            </div>

            <div className="rounded-xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A1916] dark:text-[#EDE8DC]">Page View</span>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#EFE9DA] dark:bg-[#1C2420]">
                  <button
                    type="button"
                    onClick={() => onUpdatePrefs({viewMode: 'single'})}
                    className={`min-h-[34px] px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      prefs.viewMode === 'single'
                        ? 'bg-[#FFFDF8] dark:bg-[#27332D] text-[#1A1916] dark:text-[#EDE8DC] shadow-sm'
                        : 'text-[#5E5A4F] dark:text-[#9D9788]'
                    }`}
                  >
                    1-Page View
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePrefs({viewMode: 'spread'})}
                    className={`min-h-[34px] px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      prefs.viewMode === 'spread'
                        ? 'bg-[#FFFDF8] dark:bg-[#27332D] text-[#1A1916] dark:text-[#EDE8DC] shadow-sm'
                        : 'text-[#5E5A4F] dark:text-[#9D9788]'
                    }`}
                  >
                    2-Page Spread
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#EFE9DA] dark:border-[#202825]">
                <span className="text-sm font-medium text-[#1A1916] dark:text-[#EDE8DC] block">Reading Style</span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#EFE9DA] dark:bg-[#1C2420]">
                  <button
                    type="button"
                    onClick={() => onUpdatePrefs({readingMode: 'scanned'})}
                    className={`min-h-[34px] px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      prefs.readingMode === 'scanned'
                        ? 'bg-[#FFFDF8] dark:bg-[#27332D] text-[#1A1916] dark:text-[#EDE8DC] shadow-sm'
                        : 'text-[#5E5A4F] dark:text-[#9D9788]'
                    }`}
                  >
                    Scanned Mushaf
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePrefs({readingMode: 'mushaf'})}
                    className={`min-h-[34px] px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      prefs.readingMode === 'mushaf'
                        ? 'bg-[#FFFDF8] dark:bg-[#27332D] text-[#1A1916] dark:text-[#EDE8DC] shadow-sm'
                        : 'text-[#5E5A4F] dark:text-[#9D9788]'
                    }`}
                  >
                    Digital Text
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePrefs({readingMode: 'verse'})}
                    className={`min-h-[34px] px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      prefs.readingMode === 'verse'
                        ? 'bg-[#FFFDF8] dark:bg-[#27332D] text-[#1A1916] dark:text-[#EDE8DC] shadow-sm'
                        : 'text-[#5E5A4F] dark:text-[#9D9788]'
                    }`}
                  >
                    Verse + Urdu
                  </button>
                </div>
              </div>

              {(prefs.readingMode === 'mushaf' || prefs.readingMode === 'scanned') && (
                <label className="flex items-center justify-between pt-2 border-t border-[#EFE9DA] dark:border-[#202825] cursor-pointer">
                  <span className="text-sm text-[#1A1916] dark:text-[#EDE8DC]">
                    Expand Urdu translation below page
                  </span>
                  <input
                    type="checkbox"
                    checked={prefs.showUrduInMushaf}
                    onChange={(e) => onUpdatePrefs({showUrduInMushaf: e.target.checked})}
                    className="w-4 h-4 accent-[#0F6B4E] dark:accent-[#D4AF37]"
                  />
                </label>
              )}

              <div className="pt-2 border-t border-[#EFE9DA] dark:border-[#202825]">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-[#1A1916] dark:text-[#EDE8DC]">Zoom Level</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-xs text-[#6B6556] dark:text-[#9D9788]">{prefs.zoom}%</span>
                    <button
                      type="button"
                      onClick={() => onUpdatePrefs({zoom: 100})}
                      className="text-xs text-[#0F6B4E] dark:text-[#D4AF37] underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={75}
                  max={220}
                  step={5}
                  value={prefs.zoom}
                  onChange={(e) => onUpdatePrefs({zoom: Number(e.target.value)})}
                  className="w-full accent-[#0F6B4E] dark:accent-[#D4AF37]"
                />
              </div>
            </div>
          </section>

          {/* Audio Recitation & Offline Cache */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-[#5E5A4F] dark:text-[#A8A395]">
              Recitation &amp; Offline Audio
            </h3>

            <div className="rounded-xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] p-3 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#5E5A4F] dark:text-[#A8A395] flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Reciter / Urdu Audio</span>
                </label>
                <select
                  value={prefs.reciter}
                  onChange={(e) => onUpdatePrefs({reciter: e.target.value})}
                  className="w-full min-h-[42px] rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] bg-[#FAF7F0] dark:bg-[#0E1311] px-3 text-sm text-[#1A1916] dark:text-[#EDE8DC] focus:outline-none focus:ring-2 focus:ring-[#0F6B4E]"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.style})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EFE9DA] dark:border-[#202825]">
                <span className="text-sm text-[#1A1916] dark:text-[#EDE8DC]">Speed</span>
                <div className="flex gap-1">
                  {[0.75, 1, 1.25, 1.5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onChangePlaybackRate(r)}
                      className={`min-h-[34px] px-2.5 rounded-lg text-xs font-medium tabular-nums ${
                        playbackRate === r
                          ? 'bg-[#0F6B4E] text-white dark:bg-[#D4AF37] dark:text-[#0C0F0E]'
                          : 'bg-[#EFE9DA] dark:bg-[#1C2420] text-[#5E5A4F] dark:text-[#A8A395]'
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EFE9DA] dark:border-[#202825]">
                <span className="text-sm text-[#1A1916] dark:text-[#EDE8DC]">Repeat</span>
                <div className="flex gap-1">
                  {(
                    [
                      {id: 'off', label: 'Off'},
                      {id: 'ayah', label: 'Ayah'},
                      {id: 'page', label: 'Page'},
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onChangeRepeatMode(m.id)}
                      className={`min-h-[34px] px-2.5 rounded-lg text-xs font-medium ${
                        repeatMode === m.id
                          ? 'bg-[#0F6B4E] text-white dark:bg-[#D4AF37] dark:text-[#0C0F0E]'
                          : 'bg-[#EFE9DA] dark:bg-[#1C2420] text-[#5E5A4F] dark:text-[#A8A395]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {currentSurah && (
                <div className="pt-2 border-t border-[#EFE9DA] dark:border-[#202825] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#1A1916] dark:text-[#EDE8DC] truncate">
                      Offline Audio: {currentSurah.en}
                    </div>
                    <div className="text-[11px] text-[#6B6556] dark:text-[#9D9788] tabular-nums">
                      {cachedSurahsForReciter.length} Surahs saved offline for this reciter
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingSurah !== null}
                    onClick={() => onDownloadSurahAudio(currentSurah.n)}
                    className="min-h-[38px] px-3 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] text-xs font-medium inline-flex items-center gap-1.5 text-[#0F6B4E] dark:text-[#D4AF37] hover:bg-black/5 dark:hover:bg-white/5 shrink-0 disabled:opacity-50"
                  >
                    <HardDriveDownload className="w-4 h-4" />
                    <span>
                      {downloadingSurah === currentSurah.n
                        ? `${downloadProgress}%`
                        : isCurrentSurahCached
                          ? 'Saved'
                          : 'Save Surah'}
                    </span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-[#EFE9DA] dark:border-[#202825] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#1A1916] dark:text-[#EDE8DC] truncate">
                    Offline {activeEditionMeta.shortLabel} Scans: Para {currentJuz}
                  </div>
                  <div className="text-[11px] text-[#6B6556] dark:text-[#9D9788] tabular-nums">
                    {cachedJuzForEdition.length} of 30 Paras cached on device
                  </div>
                </div>
                <button
                  type="button"
                  disabled={downloadingJuzScans !== null}
                  onClick={() => onDownloadJuzScans(currentJuz)}
                  className="min-h-[38px] px-3 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] text-xs font-medium inline-flex items-center gap-1.5 text-[#0F6B4E] dark:text-[#D4AF37] hover:bg-black/5 dark:hover:bg-white/5 shrink-0 disabled:opacity-50"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  <span>
                    {downloadingJuzScans === currentJuz
                      ? `${juzScanProgress}%`
                      : cachedJuzForEdition.includes(currentJuz)
                        ? 'Saved'
                        : 'Save Para'}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Local Database Cross-Platform Sync */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-[#5E5A4F] dark:text-[#A8A395]">
                Local Database Synchronization
              </h3>
              {!isOnline && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                  <CloudOff className="w-3.5 h-3.5" />
                  Offline
                </span>
              )}
            </div>

            <div className="rounded-xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] p-3.5 space-y-3">
              <p className="text-xs text-[#6B6556] dark:text-[#9D9788] leading-relaxed">
                Your Quran text, bookmarks, and reading progress live locally in IndexedDB for offline access, and sync
                across Android &amp; Desktop via the local SQLite database using a Sync Code.
              </p>

              {syncCode ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-[#FAF5E8] dark:bg-[#1A221F] border border-[#DFD4B8] dark:border-[#2C3631] px-3 py-2.5">
                    <div>
                      <div className="text-[11px] text-[#6B6556] dark:text-[#9D9788]">Active Sync Code</div>
                      <div className="font-mono text-base font-semibold tracking-wider text-[#0F6B4E] dark:text-[#D4AF37]">
                        {syncCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="min-h-[36px] px-3 rounded-lg bg-[#FFFDF8] dark:bg-[#25302B] border border-[#DFD4B8] dark:border-[#324039] text-xs font-medium inline-flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-[#0F6B4E]" /> : null}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6B6556] dark:text-[#9D9788]">
                    <span>
                      {lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Ready to sync'}
                    </span>
                    <button
                      type="button"
                      onClick={onDisconnectSync}
                      className="text-[#A63A50] dark:text-[#E5738A] hover:underline"
                    >
                      Unlink
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncing || !isOnline}
                    onClick={onSyncNow}
                    className="w-full min-h-[42px] rounded-xl bg-[#0F6B4E] text-white text-xs font-medium inline-flex items-center justify-center gap-2 hover:bg-[#0B543D] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={isSyncing || !isOnline}
                    onClick={() => onCreateSyncCode()}
                    className="w-full min-h-[42px] rounded-xl bg-[#0F6B4E] text-white text-xs font-medium hover:bg-[#0B543D] disabled:opacity-50"
                  >
                    Generate New Sync Code
                  </button>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (linkInput.trim()) onLinkSyncCode(linkInput.trim());
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value.toUpperCase())}
                      placeholder="Enter Sync Code (e.g. NOOR-XXXXXX)"
                      className="flex-1 min-h-[40px] rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] bg-white dark:bg-[#0C0F0E] px-3 text-xs font-mono uppercase text-[#1A1916] dark:text-[#EDE8DC] focus:outline-none focus:ring-2 focus:ring-[#0F6B4E]"
                    />
                    <button
                      type="submit"
                      disabled={!linkInput.trim() || isSyncing || !isOnline}
                      className="min-h-[40px] px-4 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
                    >
                      Link
                    </button>
                  </form>
                </div>
              )}

              {syncError && <p className="text-xs text-[#A63A50] dark:text-[#E5738A]">{syncError}</p>}

              <div className="pt-2 border-t border-[#EFE9DA] dark:border-[#202825] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="min-h-[40px] px-3 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[40px] px-3 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImportBackup(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};
