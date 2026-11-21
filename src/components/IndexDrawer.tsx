import React, {useMemo, useState} from 'react';
import {BookOpen, Search, X} from 'lucide-react';
import type {JuzSummary, MushafEditionId, SurahSummary} from '../types/quran';
import {MUSHAF_EDITIONS, toArabicDigits} from '../lib/mushaf13';

interface IndexDrawerProps {
  open: boolean;
  onClose: () => void;
  edition: MushafEditionId;
  onSwitchEdition: (edition: MushafEditionId) => void;
  surahs: SurahSummary[];
  juzList: JuzSummary[];
  currentPage: number;
  totalPages: number;
  onJumpToPage: (page: number) => void;
}

export const IndexDrawer: React.FC<IndexDrawerProps> = ({
  open,
  onClose,
  edition,
  onSwitchEdition,
  surahs,
  juzList,
  currentPage,
  totalPages,
  onJumpToPage,
}) => {
  const [tab, setTab] = useState<'surah' | 'juz' | 'page'>('surah');
  const [filter, setFilter] = useState('');
  const [pageInput, setPageInput] = useState(String(currentPage));
  const activeEdition = MUSHAF_EDITIONS.find((e) => e.id === edition) ?? MUSHAF_EDITIONS[0];

  React.useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage, open]);

  const filteredSurahs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        s.en.toLowerCase().includes(q) ||
        s.enT.toLowerCase().includes(q) ||
        s.ar.includes(filter.trim()) ||
        String(s.n) === q
    );
  }, [filter, surahs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-sm bg-[#FAF7F0] dark:bg-[#0E1311] border-r border-[#E6DEC8] dark:border-[#252E2A] h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6DEC8] dark:border-[#252E2A]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0F6B4E] dark:text-[#D4AF37]" />
            <h2 className="font-display text-base font-semibold text-[#1A1916] dark:text-[#EDE8DC]">Quran Index</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close index"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#5E5A4F] dark:text-[#A8A395] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mushaf Edition Switcher + Segmented Tabs */}
        <div className="p-3 border-b border-[#E6DEC8] dark:border-[#252E2A] space-y-2">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EFE9DA] dark:bg-[#18201D]">
            {MUSHAF_EDITIONS.map((ed) => {
              const active = edition === ed.id;
              return (
                <button
                  key={ed.id}
                  type="button"
                  onClick={() => onSwitchEdition(ed.id)}
                  className={`min-h-[36px] px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#0F6B4E] text-white dark:bg-[#D4AF37] dark:text-[#0C0F0E] shadow-sm'
                      : 'text-[#5E5A4F] dark:text-[#9D9788]'
                  }`}
                >
                  {ed.shortLabel} ({ed.totalPages}p)
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EFE9DA] dark:bg-[#18201D]">
            <button
              type="button"
              onClick={() => setTab('surah')}
              className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                tab === 'surah'
                  ? 'bg-[#FFFDF8] dark:bg-[#25302B] text-[#1A1916] dark:text-[#EDE8DC] shadow-sm'
                  : 'text-[#5E5A4F] dark:text-[#9D9788]'
              }`}
            >
              Surahs (114)
            </button>
            <button
              type="button"
              onClick={() => setTab('juz')}
              className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                tab === 'juz'
                  ? 'bg-[#FFFDF8] dark:bg-[#25302B] text-[#1A1916] dark:text-[#EDE8DC] shadow-sm'
                  : 'text-[#5E5A4F] dark:text-[#9D9788]'
              }`}
            >
              Para / Juz (30)
            </button>
            <button
              type="button"
              onClick={() => setTab('page')}
              className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                tab === 'page'
                  ? 'bg-[#FFFDF8] dark:bg-[#25302B] text-[#1A1916] dark:text-[#EDE8DC] shadow-sm'
                  : 'text-[#5E5A4F] dark:text-[#9D9788]'
              }`}
            >
              Go to Page
            </button>
          </div>
        </div>

        {tab === 'surah' && (
          <>
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7C7667]" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter Surah name or number..."
                  className="w-full min-h-[42px] pl-9 pr-3 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] bg-[#FFFDF8] dark:bg-[#141917] text-sm text-[#1A1916] dark:text-[#EDE8DC] focus:outline-none focus:ring-2 focus:ring-[#0F6B4E]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#EFE9DA] dark:divide-[#1E2623]">
              {filteredSurahs.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => {
                    onJumpToPage(s.startPage);
                    onClose();
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#EFE9DA]/60 dark:hover:bg-[#18201D] transition-colors min-h-[58px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[#EFE9DA] dark:bg-[#1C2521] text-xs font-semibold tabular-nums flex items-center justify-center text-[#0F6B4E] dark:text-[#D4AF37] shrink-0">
                      {s.n}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1A1916] dark:text-[#EDE8DC] truncate">{s.en}</div>
                      <div className="text-xs text-[#6B6556] dark:text-[#9D9788] truncate">
                        {s.enT} · {s.ayahCount} Ayahs · p.{s.startPage}
                      </div>
                    </div>
                  </div>
                  <div className="font-quran text-lg text-[#0B3B2E] dark:text-[#E5C76B] shrink-0" dir="rtl">
                    {s.ar}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'juz' && (
          <div className="flex-1 overflow-y-auto divide-y divide-[#EFE9DA] dark:divide-[#1E2623]">
            {juzList.map((j) => (
              <button
                key={j.juz}
                type="button"
                onClick={() => {
                  onJumpToPage(j.startPage);
                  onClose();
                }}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#EFE9DA]/60 dark:hover:bg-[#18201D] transition-colors min-h-[58px]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#EFE9DA] dark:bg-[#1C2521] text-xs font-semibold tabular-nums flex items-center justify-center text-[#0F6B4E] dark:text-[#D4AF37]">
                    {j.juz}
                  </span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-[#1A1916] dark:text-[#EDE8DC]">Para {j.juz}</div>
                    <div className="text-xs text-[#6B6556] dark:text-[#9D9788] tabular-nums">
                      Page {j.startPage} · Surah {j.startSurah}:{j.startAyah}
                    </div>
                  </div>
                </div>
                <div className="font-urdu text-base text-[#0B3B2E] dark:text-[#E5C76B]" dir="rtl">
                  پاره {toArabicDigits(j.juz)} — {j.urduName}
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'page' && (
          <div className="p-4 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const num = Math.max(1, Math.min(totalPages, Number(pageInput) || 1));
                onJumpToPage(num);
                onClose();
              }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium text-[#1A1916] dark:text-[#EDE8DC]">
                Enter {activeEdition.name} Page (1 – {totalPages})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] bg-[#FFFDF8] dark:bg-[#141917] px-3 text-base tabular-nums text-[#1A1916] dark:text-[#EDE8DC] focus:outline-none focus:ring-2 focus:ring-[#0F6B4E]"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-[#0F6B4E] text-white text-sm font-medium hover:bg-[#0B543D]"
                >
                  Open
                </button>
              </div>
            </form>

            <div>
              <input
                type="range"
                min={1}
                max={totalPages}
                value={Number(pageInput) || currentPage}
                onChange={(e) => {
                  setPageInput(e.target.value);
                  onJumpToPage(Number(e.target.value));
                }}
                className="w-full accent-[#0F6B4E] dark:accent-[#D4AF37]"
              />
              <div className="mt-1 flex justify-between text-xs text-[#6B6556] dark:text-[#9D9788] tabular-nums">
                <span>Page 1</span>
                <span>Current: {pageInput}</span>
                <span>Page {totalPages}</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
