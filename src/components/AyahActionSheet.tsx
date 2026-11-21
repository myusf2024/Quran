import React, {useState} from 'react';
import {Bookmark, Check, Copy, Play, Volume2, X} from 'lucide-react';
import type {BookmarkItem, MushafAyah} from '../types/quran';

interface AyahActionSheetProps {
  ayah: MushafAyah | null;
  pageNumber: number;
  bookmark: BookmarkItem | undefined;
  isPlayingThis: boolean;
  onClose: () => void;
  onPlay: (ayah: MushafAyah) => void;
  onSaveBookmark: (ayah: MushafAyah, page: number, note: string, color: BookmarkItem['color']) => void;
  onDeleteBookmark: (id: string) => void;
}

const COLOR_OPTIONS: Array<{id: BookmarkItem['color']; label: string; dotClass: string}> = [
  {id: 'emerald', label: 'Emerald', dotClass: 'bg-[#0F6B4E] dark:bg-[#34A87F]'},
  {id: 'gold', label: 'Gold', dotClass: 'bg-[#B8860B] dark:bg-[#D4AF37]'},
  {id: 'sapphire', label: 'Blue', dotClass: 'bg-[#1D5F8A] dark:bg-[#5DA9E9]'},
  {id: 'rose', label: 'Rose', dotClass: 'bg-[#A63A50] dark:bg-[#E5738A]'},
];

export const AyahActionSheet: React.FC<AyahActionSheetProps> = ({
  ayah,
  pageNumber,
  bookmark,
  isPlayingThis,
  onClose,
  onPlay,
  onSaveBookmark,
  onDeleteBookmark,
}) => {
  const [copied, setCopied] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(bookmark?.note ?? '');
  const [color, setColor] = useState<BookmarkItem['color']>(bookmark?.color ?? 'emerald');

  React.useEffect(() => {
    setNote(bookmark?.note ?? '');
    setColor(bookmark?.color ?? 'emerald');
    setEditingNote(false);
  }, [ayah?.g, bookmark?.note, bookmark?.color]);

  if (!ayah) return null;

  const handleCopy = async () => {
    const text = `${ayah.displayArabic}\n\n${ayah.u}\n— Quran ${ayah.surahEn} (${ayah.surahNumber}:${ayah.n})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-3 sm:px-6 pointer-events-none flex justify-center">
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-[#FFFDF8]/96 dark:bg-[#141917]/96 backdrop-blur-md border border-[#DFD4B8] dark:border-[#2A3530] shadow-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#5E5A4F] dark:text-[#A8A395]">
              <span className="font-semibold text-[#0F6B4E] dark:text-[#D4AF37]">{ayah.surahEn}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Ayah {ayah.surahNumber}:{ayah.n}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Page {pageNumber}</span>
            </div>
            <p dir="rtl" className="mt-2 font-urdu text-sm sm:text-base text-[#1A1916] dark:text-[#EDE8DC]">
              {ayah.u}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close verse panel"
            className="min-h-[40px] min-w-[40px] shrink-0 flex items-center justify-center rounded-lg text-[#5E5A4F] dark:text-[#A8A395] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {editingNote && (
          <div className="mt-3 pt-3 border-t border-[#ECE5D3] dark:border-[#232C28] space-y-2.5">
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setColor(opt.id)}
                  className={`min-h-[36px] px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                    color === opt.id
                      ? 'border-[#0F6B4E] dark:border-[#D4AF37] bg-[#FAF5E8] dark:bg-[#1E2623]'
                      : 'border-transparent bg-black/5 dark:bg-white/5'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.dotClass}`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (e.g. Daily Wird, Dua)..."
                maxLength={200}
                className="flex-1 min-h-[40px] rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] bg-white dark:bg-[#0C0F0E] px-3 text-sm text-[#1A1916] dark:text-[#EDE8DC] focus:outline-none focus:ring-2 focus:ring-[#0F6B4E]"
              />
              <button
                type="button"
                onClick={() => {
                  onSaveBookmark(ayah, pageNumber, note.trim(), color);
                  setEditingNote(false);
                }}
                className="min-h-[40px] px-4 rounded-xl bg-[#0F6B4E] text-white text-xs font-medium hover:bg-[#0B543D] whitespace-nowrap"
              >
                Save
              </button>
              {bookmark && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteBookmark(bookmark.id);
                    setEditingNote(false);
                  }}
                  className="min-h-[40px] px-3 rounded-xl border border-[#E5B8B8] dark:border-[#5C2B2B] text-[#A63A50] dark:text-[#E5738A] text-xs font-medium whitespace-nowrap"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 pt-2.5 border-t border-[#ECE5D3] dark:border-[#232C28] flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => onPlay(ayah)}
            className="min-h-[40px] px-3.5 rounded-xl bg-[#0F6B4E] text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#0B543D] dark:bg-[#2D8A68] whitespace-nowrap shrink-0"
          >
            {isPlayingThis ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlayingThis ? 'Playing' : 'Listen'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!bookmark) {
                onSaveBookmark(ayah, pageNumber, '', color);
              }
              setEditingNote((v) => !v);
            }}
            className="min-h-[40px] px-3.5 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] text-[#1A1916] dark:text-[#EDE8DC] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap shrink-0"
          >
            <Bookmark className="w-4 h-4 text-[#0F6B4E] dark:text-[#D4AF37]" fill={bookmark ? 'currentColor' : 'none'} />
            <span>{bookmark ? 'Edit Bookmark' : 'Bookmark'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[40px] px-3.5 rounded-xl border border-[#DFD4B8] dark:border-[#2C3631] text-[#1A1916] dark:text-[#EDE8DC] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-[#0F6B4E]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
