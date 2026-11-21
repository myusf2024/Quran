import React, {useEffect, useRef, useState} from 'react';
import {Bookmark, ChevronDown, ChevronUp, Play, RefreshCw, Volume2} from 'lucide-react';
import type {BookmarkItem, MushafAyah, MushafEditionId, MushafPage, SurahSummary} from '../types/quran';
import {getDirectArchiveScanUrl, getScannedPageUrl, JUZ_NAMES, MUSHAF_EDITIONS, toArabicDigits} from '../lib/mushaf13';

interface ScannedMushafPageProps {
  page: MushafPage;
  edition: MushafEditionId;
  surahMap: Map<number, SurahSummary>;
  zoom: number;
  selectedAyahKey: string | null;
  playingGlobalAyah: number | null;
  bookmarksMap: Map<string, BookmarkItem>;
  showUrduInMushaf: boolean;
  onSelectAyah: (ayah: MushafAyah) => void;
  onPlayAyah: (ayah: MushafAyah) => void;
  onToggleBookmark: (ayah: MushafAyah) => void;
  onDoubleTapZoom: () => void;
}

export const ScannedMushafPage: React.FC<ScannedMushafPageProps> = ({
  page,
  edition,
  surahMap,
  zoom,
  selectedAyahKey,
  playingGlobalAyah,
  bookmarksMap,
  showUrduInMushaf,
  onSelectAyah,
  onPlayAyah,
  onToggleBookmark,
  onDoubleTapZoom,
}) => {
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retrySeed, setRetrySeed] = useState(0);
  const [useDirectFallback, setUseDirectFallback] = useState(false);
  const [versesOpen, setVersesOpen] = useState(showUrduInMushaf);
  const lastTapRef = useRef(0);

  useEffect(() => {
    setImgStatus('loading');
    setUseDirectFallback(false);
  }, [edition, page.pageNumber, retrySeed]);

  useEffect(() => {
    setVersesOpen(showUrduInMushaf);
  }, [showUrduInMushaf]);

  const primarySurah = surahMap.get(page.primarySurah);
  const juzMeta = JUZ_NAMES.find((j) => j.juz === page.juz);
  const editionMeta = MUSHAF_EDITIONS.find((e) => e.id === edition);
  const scanUrl = useDirectFallback
    ? getDirectArchiveScanUrl(edition, page.pageNumber)
    : `${getScannedPageUrl(edition, page.pageNumber)}${retrySeed > 0 ? `?r=${retrySeed}` : ''}`;

  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      onDoubleTapZoom();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <article className="w-full rounded-xl bg-[#FFFDF8] dark:bg-[#121614] border border-[#E6DEC8] dark:border-[#252E2A] shadow-sm overflow-hidden">
      {/* Subtle Top Page Context Strip */}
      <header
        dir="rtl"
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#ECE5D3] dark:border-[#222B27] text-xs text-[#5E5A4F] dark:text-[#A8A395]"
      >
        <div className="flex items-center gap-1.5 font-urdu truncate">
          <span className="text-[#0F6B4E] dark:text-[#D4AF37] font-semibold">پاره {toArabicDigits(page.juz)}</span>
          <span aria-hidden="true">·</span>
          <span>{juzMeta?.urdu}</span>
        </div>
        <div className="flex items-center gap-2 font-sans text-xs shrink-0" dir="ltr">
          <span className="font-medium text-[#1A1916] dark:text-[#EDE8DC]">{primarySurah?.en}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">p.{page.pageNumber}</span>
        </div>
      </header>

      {/* Scrollable / Pannable Scanned Mushaf Image Frame */}
      <div
        className="w-full overflow-auto bg-[#F4EFE3] dark:bg-[#0D110F] flex justify-center"
        onClick={handleImageTap}
      >
        <div
          className="relative transition-[width] duration-150 ease-out"
          style={{
            width: zoom === 100 ? '100%' : `${zoom}%`,
            minWidth: zoom > 100 ? `${zoom}%` : '100%',
          }}
        >
          {imgStatus === 'loading' && (
            <div className="w-full aspect-[1241/1755] flex flex-col items-center justify-center gap-2 text-xs text-[#6B6556] dark:text-[#9D9788] bg-[#FAF7F0] dark:bg-[#141917]">
              <div className="font-quran text-2xl text-[#0F6B4E] dark:text-[#D4AF37]" dir="rtl">
                {primarySurah?.ar}
              </div>
              <span>
                Loading {editionMeta?.shortLabel ?? '13-Line'} scanned page {page.pageNumber}…
              </span>
            </div>
          )}

          {imgStatus === 'error' ? (
            <div className="w-full aspect-[1241/1755] flex flex-col items-center justify-center gap-3 p-6 text-center bg-[#FAF7F0] dark:bg-[#141917]">
              <p className="text-sm text-[#5E5A4F] dark:text-[#A8A395]">
                Scanned page {page.pageNumber} could not be loaded offline.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRetrySeed((s) => s + 1);
                }}
                className="min-h-[42px] px-4 rounded-xl bg-[#0F6B4E] text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Page Scan</span>
              </button>
            </div>
          ) : (
            <img
              src={scanUrl}
              alt={`Quran 13-Line Indo-Pak Mushaf Page ${page.pageNumber} — ${primarySurah?.en ?? ''}`}
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              onLoad={() => setImgStatus('loaded')}
              onError={() => {
                if (!useDirectFallback && navigator.onLine) {
                  setUseDirectFallback(true);
                } else {
                  setImgStatus('error');
                }
              }}
              className={`w-full h-auto block select-none transition-opacity duration-150 ${
                imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0 absolute inset-0'
              } dark:invert-[0.92] dark:hue-rotate-180 dark:contrast-105`}
            />
          )}
        </div>
      </div>

      {/* Collapsible Interactive Verses & Urdu Tarjuma Drawer for this Scanned Page */}
      <div className="border-t border-[#ECE5D3] dark:border-[#222B27] bg-[#FAF7F0] dark:bg-[#101513]">
        <button
          type="button"
          onClick={() => setVersesOpen((v) => !v)}
          className="w-full min-h-[42px] px-3.5 py-2 flex items-center justify-between gap-2 text-xs font-medium text-[#4E4A40] dark:text-[#BEB8A8] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <span>
            Verses &amp; Urdu Tarjuma on Page {page.pageNumber} ({page.items.length})
          </span>
          {versesOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </button>

        {versesOpen && (
          <div className="divide-y divide-[#ECE5D3] dark:divide-[#1F2723] max-h-72 overflow-y-auto px-3 pb-3">
            {page.items.map((ayah) => {
              const key = `${ayah.surahNumber}:${ayah.n}`;
              const isSelected = selectedAyahKey === key;
              const isPlaying = playingGlobalAyah === ayah.g;
              const bookmark = bookmarksMap.get(key);

              return (
                <div
                  key={key}
                  onClick={() => onSelectAyah(ayah)}
                  className={`py-2.5 px-2 rounded-lg cursor-pointer transition-colors ${
                    isPlaying
                      ? 'bg-[#0F6B4E]/12 dark:bg-[#D4AF37]/15'
                      : isSelected
                        ? 'bg-[#0F6B4E]/8 dark:bg-[#34A87F]/12'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-medium tabular-nums text-[#0F6B4E] dark:text-[#D4AF37]">
                      {ayah.surahEn} · {ayah.surahNumber}:{ayah.n}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayAyah(ayah);
                        }}
                        aria-label={`Play Ayah ${ayah.surahNumber}:${ayah.n}`}
                        className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-md text-[#0F6B4E] dark:text-[#34A87F] hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        {isPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(ayah);
                        }}
                        aria-label={`Bookmark Ayah ${ayah.surahNumber}:${ayah.n}`}
                        className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 ${
                          bookmark ? 'text-[#0F6B4E] dark:text-[#D4AF37]' : 'text-[#7C7667] dark:text-[#8E897C]'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" fill={bookmark ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                  <p dir="rtl" className="font-urdu text-sm text-[#2A2822] dark:text-[#D4CEC0]">
                    {ayah.u}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};
