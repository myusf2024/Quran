import React from 'react';
import {Bookmark, Play, Volume2} from 'lucide-react';
import type {BookmarkItem, MushafAyah, MushafEditionId, MushafPage, SurahSummary} from '../types/quran';
import {BISMILLAH_TEXT, JUZ_NAMES, toArabicDigits} from '../lib/mushaf13';
import {ScannedMushafPage} from './ScannedMushafPage';

interface MushafPageCardProps {
  page: MushafPage;
  edition: MushafEditionId;
  surahMap: Map<number, SurahSummary>;
  readingMode: 'scanned' | 'mushaf' | 'verse';
  zoom: number;
  selectedAyahKey: string | null;
  playingGlobalAyah: number | null;
  bookmarksMap: Map<string, BookmarkItem>;
  showUrduInMushaf: boolean;
  onSelectAyah: (ayah: MushafAyah) => void;
  onPlayAyah: (ayah: MushafAyah) => void;
  onToggleBookmark: (ayah: MushafAyah) => void;
  onDoubleTapZoom?: () => void;
}

const BOOKMARK_DOT_CLASSES: Record<BookmarkItem['color'], string> = {
  emerald: 'text-[#0F6B4E] dark:text-[#34A87F]',
  gold: 'text-[#B8860B] dark:text-[#D4AF37]',
  sapphire: 'text-[#1D5F8A] dark:text-[#5DA9E9]',
  rose: 'text-[#A63A50] dark:text-[#E5738A]',
};

export const MushafPageCard: React.FC<MushafPageCardProps> = ({
  page,
  edition,
  surahMap,
  readingMode,
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
  if (readingMode === 'scanned') {
    return (
      <ScannedMushafPage
        page={page}
        edition={edition}
        surahMap={surahMap}
        zoom={zoom}
        selectedAyahKey={selectedAyahKey}
        playingGlobalAyah={playingGlobalAyah}
        bookmarksMap={bookmarksMap}
        showUrduInMushaf={showUrduInMushaf}
        onSelectAyah={onSelectAyah}
        onPlayAyah={onPlayAyah}
        onToggleBookmark={onToggleBookmark}
        onDoubleTapZoom={onDoubleTapZoom ?? (() => {})}
      />
    );
  }

  const primarySurah = surahMap.get(page.primarySurah);
  const juzMeta = JUZ_NAMES.find((j) => j.juz === page.juz);
  const scaleFactor = zoom / 100;

  if (readingMode === 'verse') {
    return (
      <article className="w-full rounded-2xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#E6DEC8] dark:border-[#252E2A] shadow-sm p-4 sm:p-6">
        {/* Page Header Metadata */}
        <header className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-[#ECE5D3] dark:border-[#232C28] text-xs text-[#5E5A4F] dark:text-[#A8A395]">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-[#1A1916] dark:text-[#EDE8DC]">{primarySurah?.en}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Page {page.pageNumber}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0" dir="rtl">
            <span className="font-urdu text-sm text-[#0F6B4E] dark:text-[#D4AF37]">
              پاره {toArabicDigits(page.juz)} ({juzMeta?.urdu})
            </span>
          </div>
        </header>

        <div className="divide-y divide-[#EFE9DA] dark:divide-[#202825]">
          {page.items.map((ayah) => {
            const key = `${ayah.surahNumber}:${ayah.n}`;
            const isSelected = selectedAyahKey === key;
            const isPlaying = playingGlobalAyah === ayah.g;
            const bookmark = bookmarksMap.get(key);

            return (
              <div key={key} className="py-4 first:pt-1 last:pb-1">
                {ayah.isSurahStart && (
                  <div className="mb-4 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] bg-[#FAF5E8] dark:bg-[#19201D] px-4 py-3 text-center">
                    <div className="font-quran text-2xl text-[#0B3B2E] dark:text-[#E5C76B]" dir="rtl">
                      {ayah.surahAr}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-2 text-xs text-[#5E5A4F] dark:text-[#A8A395]">
                      <span>{ayah.surahEn}</span>
                      <span aria-hidden="true">·</span>
                      <span>{surahMap.get(ayah.surahNumber)?.rev === 'M' ? 'Meccan' : 'Medinan'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{surahMap.get(ayah.surahNumber)?.ayahCount} Ayahs</span>
                    </div>
                    {ayah.hasBismillah && (
                      <div className="mt-2 pt-2 border-t border-[#E6DEC8] dark:border-[#252E2A] font-quran text-xl text-[#1A1916] dark:text-[#EDE8DC]" dir="rtl">
                        {BISMILLAH_TEXT}
                      </div>
                    )}
                  </div>
                )}

                <div
                  onClick={() => onSelectAyah(ayah)}
                  className={`rounded-xl p-3 transition-colors cursor-pointer ${
                    isPlaying
                      ? 'bg-[#0F6B4E]/10 dark:bg-[#D4AF37]/15'
                      : isSelected
                        ? 'bg-[#0F6B4E]/6 dark:bg-[#34A87F]/10'
                        : 'hover:bg-[#FAF7F0] dark:hover:bg-[#19201D]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium tabular-nums text-[#5E5A4F] dark:text-[#9D9788]">
                      {ayah.surahNumber}:{ayah.n}
                      {ayah.sj ? ' · Sajdah ۩' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayAyah(ayah);
                        }}
                        aria-label={`Play Ayah ${ayah.surahNumber}:${ayah.n}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#0F6B4E] dark:text-[#34A87F] hover:bg-[#0F6B4E]/10 dark:hover:bg-[#34A87F]/15 transition-colors"
                      >
                        {isPlaying ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(ayah);
                        }}
                        aria-label={`Bookmark Ayah ${ayah.surahNumber}:${ayah.n}`}
                        className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                          bookmark ? BOOKMARK_DOT_CLASSES[bookmark.color] : 'text-[#7C7667] dark:text-[#8E897C]'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" fill={bookmark ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>

                  <p
                    dir="rtl"
                    className="font-quran text-right text-[#1A1916] dark:text-[#EDE8DC] leading-[2.2]"
                    style={{fontSize: `${Math.round(25 * scaleFactor)}px`}}
                  >
                    {ayah.displayArabic}{' '}
                    <span className="inline-block text-[#0F6B4E] dark:text-[#D4AF37] text-[0.82em] mx-1">
                      ﴿{toArabicDigits(ayah.n)}﴾
                    </span>
                  </p>

                  <p
                    dir="rtl"
                    className="mt-3 font-urdu text-right text-[#3B3830] dark:text-[#CEC8B8]"
                    style={{fontSize: `${Math.round(16 * Math.max(0.85, Math.min(1.4, scaleFactor)))}px`}}
                  >
                    {ayah.u}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    );
  }

  // Classic 13-Line Urdu Mushaf Page Layout
  return (
    <article className="w-full rounded-xl bg-[#FFFDF8] dark:bg-[#141917] mushaf-frame px-4 py-4 sm:px-7 sm:py-6 shadow-sm">
      {/* Top Mushaf Margin Bar */}
      <header
        dir="rtl"
        className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b border-[#E5DCC5] dark:border-[#26302B] text-[#4E4A40] dark:text-[#B5AF9E]"
      >
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-urdu truncate">
          <span className="text-[#0F6B4E] dark:text-[#D4AF37] font-semibold">پاره {toArabicDigits(page.juz)}</span>
          <span aria-hidden="true">·</span>
          <span>{juzMeta?.urdu}</span>
        </div>
        <div className="text-xs sm:text-sm font-quran text-[#1A1916] dark:text-[#EDE8DC] truncate">
          {primarySurah?.ar}
        </div>
      </header>

      {/* 13-Line Mushaf Calligraphic Body */}
      <div
        dir="rtl"
        className={`font-quran text-[#1A1916] dark:text-[#EDE8DC] dark:tracking-[0.01em] ${
          page.pageNumber === 1 ? 'text-center py-4 sm:py-8' : 'text-justify'
        }`}
        style={{
          fontSize: `${Math.round(22.5 * scaleFactor)}px`,
          lineHeight: page.pageNumber === 1 ? 2.45 : 2.18,
          textAlignLast: page.pageNumber === 1 ? 'center' : 'center',
        }}
      >
        {page.items.map((ayah) => {
          const key = `${ayah.surahNumber}:${ayah.n}`;
          const isSelected = selectedAyahKey === key;
          const isPlaying = playingGlobalAyah === ayah.g;
          const bookmark = bookmarksMap.get(key);

          return (
            <React.Fragment key={key}>
              {ayah.isSurahStart && (
                <div className="my-3 first:mt-0 rounded-lg border border-[#D8CCA9] dark:border-[#2F3B35] bg-[#FAF4E4] dark:bg-[#1A221F] px-3 py-2 text-center select-none">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-sans text-[#6B6556] dark:text-[#9D9788]" dir="ltr">
                    <span className="tabular-nums">
                      {surahMap.get(ayah.surahNumber)?.rev === 'M' ? 'Meccan' : 'Medinan'}
                    </span>
                    <span className="font-quran text-lg sm:text-xl text-[#0B3B2E] dark:text-[#E5C76B]" dir="rtl">
                      {ayah.surahAr}
                    </span>
                    <span className="tabular-nums">{surahMap.get(ayah.surahNumber)?.ayahCount} Ayahs</span>
                  </div>
                  {ayah.hasBismillah && (
                    <div
                      className="mt-1.5 pt-1.5 border-t border-[#E6DEC8] dark:border-[#28332E] font-quran text-[#1A1916] dark:text-[#EDE8DC]"
                      style={{fontSize: `${Math.round(20 * scaleFactor)}px`, lineHeight: 1.9}}
                    >
                      {BISMILLAH_TEXT}
                    </div>
                  )}
                </div>
              )}

              <span
                role="button"
                tabIndex={0}
                onClick={() => onSelectAyah(ayah)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectAyah(ayah);
                  }
                }}
                className={`inline rounded-md px-0.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B4E] dark:focus-visible:ring-[#D4AF37] ${
                  isPlaying
                    ? 'bg-[#0F6B4E]/18 dark:bg-[#D4AF37]/25'
                    : isSelected
                      ? 'bg-[#0F6B4E]/10 dark:bg-[#34A87F]/18'
                      : 'hover:bg-[#E8DFC5]/50 dark:hover:bg-white/5'
                }`}
              >
                {ayah.displayArabic}
                <span
                  className={`inline-block mx-1 select-none text-[0.86em] ${
                    bookmark
                      ? `${BOOKMARK_DOT_CLASSES[bookmark.color]} font-bold`
                      : 'text-[#0F6B4E] dark:text-[#D4AF37]'
                  }`}
                  title={bookmark ? `Bookmarked: ${bookmark.note || 'Saved'}` : `Ayah ${ayah.n}`}
                >
                  ﴿{toArabicDigits(ayah.n)}﴾{bookmark ? '•' : ''}
                </span>
                {ayah.sj && (
                  <span className="inline-block text-[#A63A50] dark:text-[#E5738A] text-[0.75em] mx-0.5" title="Sajdah">
                    ۩
                  </span>
                )}
                {ayah.isRukuEnd && (
                  <span
                    className="inline-block text-[0.68em] text-[#7D6B3E] dark:text-[#B89E54] border border-[#D4C393] dark:border-[#49422B] rounded px-1 mx-0.5 leading-tight align-middle"
                    title={`Ruku ${ayah.r}`}
                  >
                    ع
                  </span>
                )}
              </span>{' '}
              {page.pageNumber === 1 && <br />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Optional Urdu Translation Summary below Mushaf page */}
      {showUrduInMushaf && (
        <div className="mt-5 pt-4 border-t border-[#E5DCC5] dark:border-[#26302B] space-y-2.5" dir="rtl">
          <div className="text-xs font-sans text-[#6B6556] dark:text-[#9D9788] flex items-center justify-between" dir="ltr">
            <span>Urdu Translation · Fateh Muhammad Jalandhari</span>
            <span className="tabular-nums">{page.items.length} Ayahs</span>
          </div>
          {page.items.map((ayah) => (
            <p
              key={`ur-${ayah.surahNumber}:${ayah.n}`}
              onClick={() => onSelectAyah(ayah)}
              className="font-urdu text-sm sm:text-base text-[#36332B] dark:text-[#D2CCBC] cursor-pointer hover:text-[#0F6B4E] dark:hover:text-[#E5C76B] transition-colors"
            >
              <span className="font-sans text-xs tabular-nums text-[#0F6B4E] dark:text-[#D4AF37] ml-1.5">
                ({ayah.surahNumber}:{ayah.n})
              </span>
              {ayah.u}
            </p>
          ))}
        </div>
      )}

      {/* Bottom Mushaf Page Footer */}
      <footer className="mt-4 pt-2.5 border-t border-[#E5DCC5] dark:border-[#26302B] flex items-center justify-between text-xs text-[#6B6556] dark:text-[#9D9788]">
        <span className="tabular-nums">{primarySurah?.en}</span>
        <span className="font-quran text-base text-[#1A1916] dark:text-[#EDE8DC] tabular-nums">
          {toArabicDigits(page.pageNumber)}
        </span>
        <span className="tabular-nums">Page {page.pageNumber}</span>
      </footer>
    </article>
  );
};
