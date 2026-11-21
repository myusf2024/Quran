import React from 'react';
import {Bookmark, BookOpen, Trash2, X} from 'lucide-react';
import type {BookmarkItem, MushafAyah, ReadingState, SurahSummary} from '../types/quran';

interface BookmarksSheetProps {
  open: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  readingState: ReadingState;
  surahMap: Map<number, SurahSummary>;
  ayahLookup: Map<string, {page: number; ayah: MushafAyah}>;
  onJumpToBookmark: (page: number, surah: number, ayah: number) => void;
  onDeleteBookmark: (id: string) => void;
}

const DOT_COLOR: Record<BookmarkItem['color'], string> = {
  emerald: 'bg-[#0F6B4E] dark:bg-[#34A87F]',
  gold: 'bg-[#B8860B] dark:bg-[#D4AF37]',
  sapphire: 'bg-[#1D5F8A] dark:bg-[#5DA9E9]',
  rose: 'bg-[#A63A50] dark:bg-[#E5738A]',
};

export const BookmarksSheet: React.FC<BookmarksSheetProps> = ({
  open,
  onClose,
  bookmarks,
  readingState,
  surahMap,
  ayahLookup,
  onJumpToBookmark,
  onDeleteBookmark,
}) => {
  if (!open) return null;

  const activeBookmarks = bookmarks.filter((b) => !b.deleted);
  const lastSurah = surahMap.get(readingState.lastSurah);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-sm bg-[#FAF7F0] dark:bg-[#0E1311] border-l border-[#E6DEC8] dark:border-[#252E2A] h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6DEC8] dark:border-[#252E2A]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#0F6B4E] dark:text-[#D4AF37]" />
            <h2 className="font-display text-base font-semibold text-[#1A1916] dark:text-[#EDE8DC]">
              Bookmarks
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bookmarks"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#5E5A4F] dark:text-[#A8A395] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-[#E6DEC8] dark:border-[#252E2A]">
          <button
            type="button"
            onClick={() => {
              onJumpToBookmark(readingState.lastPage, readingState.lastSurah, readingState.lastAyah);
              onClose();
            }}
            className="w-full rounded-xl bg-[#FFFDF8] dark:bg-[#141917] border border-[#DFD4B8] dark:border-[#2A3530] p-3.5 text-left hover:bg-[#EFE9DA]/50 dark:hover:bg-[#1A221F] transition-colors flex items-center justify-between gap-3"
          >
            <div>
              <div className="text-xs font-medium text-[#0F6B4E] dark:text-[#D4AF37]">Last Read Position</div>
              <div className="mt-0.5 text-sm font-semibold text-[#1A1916] dark:text-[#EDE8DC]">
                {lastSurah?.en ?? `Surah ${readingState.lastSurah}`} · Ayah {readingState.lastAyah}
              </div>
              <div className="text-xs text-[#6B6556] dark:text-[#9D9788] tabular-nums">
                Page {readingState.lastPage}
              </div>
            </div>
            <BookOpen className="w-5 h-5 text-[#0F6B4E] dark:text-[#D4AF37] shrink-0" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#EFE9DA] dark:divide-[#1E2623]">
          {activeBookmarks.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6B6556] dark:text-[#9D9788] space-y-1.5">
              <p>No bookmarked verses yet.</p>
              <p className="text-xs">Tap any Ayah while reading to save a bookmark with an optional note.</p>
            </div>
          ) : (
            activeBookmarks.map((bm) => {
              const surah = surahMap.get(bm.surah);
              const entry = ayahLookup.get(`${bm.surah}:${bm.ayah}`);
              return (
                <div
                  key={bm.id}
                  onClick={() => {
                    onJumpToBookmark(bm.page, bm.surah, bm.ayah);
                    onClose();
                  }}
                  className="p-4 hover:bg-[#EFE9DA]/60 dark:hover:bg-[#18201D] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLOR[bm.color]}`} />
                      <span className="text-sm font-medium text-[#1A1916] dark:text-[#EDE8DC] truncate">
                        {surah?.en ?? `Surah ${bm.surah}`} · {bm.surah}:{bm.ayah}
                      </span>
                      <span className="text-xs text-[#6B6556] dark:text-[#9D9788] tabular-nums shrink-0">
                        p.{bm.page}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBookmark(bm.id);
                      }}
                      aria-label="Delete bookmark"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[#8A8476] hover:text-[#A63A50] dark:hover:text-[#E5738A] hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {bm.note && (
                    <p className="mt-1.5 text-xs font-medium text-[#0F6B4E] dark:text-[#D4AF37]">{bm.note}</p>
                  )}

                  {entry && (
                    <p dir="rtl" className="mt-1.5 font-urdu text-xs text-[#4E4A40] dark:text-[#BEB8A8] line-clamp-2">
                      {entry.ayah.u}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
