import React, {useMemo, useState} from 'react';
import {Play, Search, X} from 'lucide-react';
import type {MushafAyah} from '../types/quran';
import {normalizeArabicForSearch} from '../lib/mushaf13';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  allAyahs: Array<{page: number; ayah: MushafAyah}>;
  onJumpToAyah: (page: number, ayah: MushafAyah) => void;
  onPlayAyah: (page: number, ayah: MushafAyah) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onClose,
  allAyahs,
  onJumpToAyah,
  onPlayAyah,
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    const normAr = normalizeArabicForSearch(trimmed);
    const lower = trimmed.toLowerCase();

    const matches: Array<{page: number; ayah: MushafAyah}> = [];
    for (let i = 0; i < allAyahs.length; i++) {
      const entry = allAyahs[i];
      const a = entry.ayah;
      const ref = `${a.surahNumber}:${a.n}`;
      if (
        ref === trimmed ||
        a.surahEn.toLowerCase().includes(lower) ||
        a.u.includes(trimmed) ||
        (normAr.length >= 2 && a.c.includes(normAr)) ||
        a.displayArabic.includes(trimmed)
      ) {
        matches.push(entry);
        if (matches.length >= 60) break;
      }
    }
    return matches;
  }, [allAyahs, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-16">
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[82vh] rounded-2xl bg-[#FAF7F0] dark:bg-[#0E1311] border border-[#E6DEC8] dark:border-[#252E2A] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[#E6DEC8] dark:border-[#252E2A] flex items-center gap-2">
          <Search className="w-5 h-5 text-[#0F6B4E] dark:text-[#D4AF37] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Arabic, Urdu (اردو), Surah name, or 2:255..."
            className="flex-1 min-h-[42px] bg-transparent text-sm sm:text-base text-[#1A1916] dark:text-[#EDE8DC] placeholder:text-[#8A8476] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5E5A4F] dark:text-[#A8A395] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#EFE9DA] dark:divide-[#1E2623]">
          {query.trim().length < 2 ? (
            <div className="p-8 text-center text-sm text-[#6B6556] dark:text-[#9D9788] space-y-2">
              <p>Search offline across all 6,236 verses in Arabic and Urdu.</p>
              <p className="text-xs">Try &quot;رحمن&quot;, &quot;نماز&quot;, &quot;2:255&quot;, or &quot;Yasin&quot;.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6B6556] dark:text-[#9D9788]">
              No matching verses found for &quot;{query}&quot;.
            </div>
          ) : (
            results.map(({page, ayah}) => (
              <div
                key={`sr-${ayah.g}`}
                onClick={() => {
                  onJumpToAyah(page, ayah);
                  onClose();
                }}
                className="p-4 hover:bg-[#EFE9DA]/60 dark:hover:bg-[#18201D] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium text-[#0F6B4E] dark:text-[#D4AF37] tabular-nums">
                    {ayah.surahEn} · {ayah.surahNumber}:{ayah.n} · Page {page}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayAyah(page, ayah);
                      onClose();
                    }}
                    aria-label="Play verse"
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#0F6B4E] dark:text-[#34A87F] hover:bg-[#0F6B4E]/10"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
                <p dir="rtl" className="font-quran text-xl text-[#1A1916] dark:text-[#EDE8DC] leading-loose">
                  {ayah.displayArabic}
                </p>
                <p dir="rtl" className="mt-1.5 font-urdu text-sm text-[#4E4A40] dark:text-[#C5BFB0]">
                  {ayah.u}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
