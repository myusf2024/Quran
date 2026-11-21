import type {JuzSummary, MushafAyah, MushafEditionId, MushafPage, RawSurah, SurahSummary} from '../types/quran';

export const BISMILLAH_TEXT = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

export const JUZ_NAMES: Array<{juz: number; arabic: string; urdu: string}> = [
  {juz: 1, arabic: 'آلم', urdu: 'الم'},
  {juz: 2, arabic: 'سَيَقُولُ', urdu: 'سیقول'},
  {juz: 3, arabic: 'تِلْكَ ٱلرُّسُلُ', urdu: 'تلك الرسل'},
  {juz: 4, arabic: 'لَنْ تَنَالُوا', urdu: 'لن تنالوا'},
  {juz: 5, arabic: 'وَٱلْمُحْصَنَاتُ', urdu: 'والمحصنات'},
  {juz: 6, arabic: 'لَا يُحِبُّ ٱللَّهُ', urdu: 'لا يحب الله'},
  {juz: 7, arabic: 'وَإِذَا سَمِعُوا', urdu: 'واذا سمعوا'},
  {juz: 8, arabic: 'وَلَوْ أَنَّنَا', urdu: 'ولو اننا'},
  {juz: 9, arabic: 'قَالَ ٱلْمَلَأُ', urdu: 'قال الملأ'},
  {juz: 10, arabic: 'وَٱعْلَمُوا', urdu: 'واعلموا'},
  {juz: 11, arabic: 'يَعْتَذِرُونَ', urdu: 'يعتذرون'},
  {juz: 12, arabic: 'وَمَا مِنْ دَآبَّةٍ', urdu: 'وما من دابة'},
  {juz: 13, arabic: 'وَمَا أُبَرِّئُ', urdu: 'وما ابرئ'},
  {juz: 14, arabic: 'رُبَمَا', urdu: 'ربما'},
  {juz: 15, arabic: 'سُبْحَانَ ٱلَّذِى', urdu: 'سبحان الذي'},
  {juz: 16, arabic: 'قَالَ أَلَمْ', urdu: 'قال الم'},
  {juz: 17, arabic: 'ٱقْتَرَبَ لِلنَّاسِ', urdu: 'اقترب للناس'},
  {juz: 18, arabic: 'قَدْ أَفْلَحَ', urdu: 'قد افلح'},
  {juz: 19, arabic: 'وَقَالَ ٱلَّذِينَ', urdu: 'وقال الذين'},
  {juz: 20, arabic: 'أَمَّنْ خَلَقَ', urdu: 'امّن خلق'},
  {juz: 21, arabic: 'ٱتْلُ مَا أُوحِىَ', urdu: 'اتل ما اوحي'},
  {juz: 22, arabic: 'وَمَنْ يَقْنُتْ', urdu: 'ومن يقنت'},
  {juz: 23, arabic: 'وَمَا لِىَ', urdu: 'وما لي'},
  {juz: 24, arabic: 'فَمَنْ أَظْلَمُ', urdu: 'فمن اظلم'},
  {juz: 25, arabic: 'إِلَيْهِ يُرَدُّ', urdu: 'اليه يرد'},
  {juz: 26, arabic: 'حم', urdu: 'حم'},
  {juz: 27, arabic: 'قَالَ فَمَا خَطْبُكُمْ', urdu: 'قال فما خطبكم'},
  {juz: 28, arabic: 'قَدْ سَمِعَ ٱللَّهُ', urdu: 'قد سمع الله'},
  {juz: 29, arabic: 'تَبَارَكَ ٱلَّذِى', urdu: 'تبارك الذي'},
  {juz: 30, arabic: 'عَمَّ', urdu: 'عمّ'},
];

export interface ReciterOption {
  id: string;
  name: string;
  urduLabel: string;
  style: string;
  bitrate: number;
  language: 'ar' | 'ur';
  source?: 'islamic' | 'everyayah';
  everyAyahFolder?: string;
}

export const RECITERS: ReciterOption[] = [
  {
    id: 'ar.alafasy',
    name: 'Mishary Rashid Alafasy',
    urduLabel: 'مشارى راشد العفاسي',
    style: 'Murattal',
    bitrate: 128,
    language: 'ar',
  },
  {
    id: 'ar.hudhaify',
    name: 'Ali Abdur-Rahman Al-Hudhaify',
    urduLabel: 'علی عبدالرحمٰن الحذیفی',
    style: 'Madinah',
    bitrate: 128,
    language: 'ar',
  },
  {
    id: 'ar.abdullahmatrood',
    name: 'Abdullah Al-Matrood',
    urduLabel: 'عبداللہ المطرود',
    style: 'Murattal',
    bitrate: 128,
    language: 'ar',
    source: 'everyayah',
    everyAyahFolder: 'Abdullah_Matroud_128kbps',
  },
  {
    id: 'ar.abdurrahmaansudais',
    name: 'Abdurrahmaan As-Sudais',
    urduLabel: 'عبدالرحمٰن السدیس',
    style: 'Haramain',
    bitrate: 192,
    language: 'ar',
  },
  {
    id: 'ar.saoodshuraym',
    name: 'Saood Ash-Shuraym',
    urduLabel: 'سعود الشریم',
    style: 'Haramain',
    bitrate: 64,
    language: 'ar',
  },
  {
    id: 'ar.husary',
    name: 'Mahmoud Khalil Al-Husary',
    urduLabel: 'محمود خلیل الحصری',
    style: 'Tajweed Classic',
    bitrate: 128,
    language: 'ar',
  },
  {
    id: 'ar.abdulsamad',
    name: 'Abdul Basit Abdul Samad',
    urduLabel: 'عبدالباسط عبدالصمد',
    style: 'Murattal',
    bitrate: 64,
    language: 'ar',
  },
  {
    id: 'ar.minshawi',
    name: 'Muhammad Siddiq Al-Minshawi',
    urduLabel: 'محمد صدیق المنشاوی',
    style: 'Murattal',
    bitrate: 128,
    language: 'ar',
  },
  {
    id: 'ar.mahermuaiqly',
    name: 'Maher Al Muaiqly',
    urduLabel: 'ماہر المعیقلی',
    style: 'Murattal',
    bitrate: 128,
    language: 'ar',
  },
  {
    id: 'ar.muhammadayyoub',
    name: 'Muhammad Ayyub',
    urduLabel: 'محمد ایوب',
    style: 'Madinah',
    bitrate: 128,
    language: 'ar',
  },
  {
    id: 'ar.yasseraldossari',
    name: 'Yasser Al-Dosari',
    urduLabel: 'یاسر الدوسری',
    style: 'Haramain',
    bitrate: 128,
    language: 'ar',
    source: 'everyayah',
    everyAyahFolder: 'Yasser_Ad-Dussary_128kbps',
  },
  {
    id: 'ar.nasseralqatami',
    name: 'Nasser Al-Qatami',
    urduLabel: 'ناصر القطامی',
    style: 'Murattal',
    bitrate: 128,
    language: 'ar',
    source: 'everyayah',
    everyAyahFolder: 'Nasser_Alqatami_128kbps',
  },
  {
    id: 'ar.ahmedajamy',
    name: 'Ahmed Al-Ajmy',
    urduLabel: 'احمد العجمی',
    style: 'Murattal',
    bitrate: 128,
    language: 'ar',
  },
  {
    id: 'ur.khan',
    name: 'Urdu Tarjuma (Shamshad Ali Khan)',
    urduLabel: 'اردو ترجمہ آڈیو',
    style: 'Urdu Audio',
    bitrate: 64,
    language: 'ur',
  },
];

export function toArabicDigits(num: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((d) => digits[Number(d)] ?? d)
    .join('');
}

export function normalizeArabicForSearch(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\uFEFF]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

function stripLeadingBismillah(text: string, surahNumber: number, ayahNumber: number): string {
  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (surahNumber !== 1 && surahNumber !== 9 && ayahNumber === 1) {
    if (cleaned.startsWith(BISMILLAH_TEXT)) {
      return cleaned.slice(BISMILLAH_TEXT.length).trim();
    }
  }
  return cleaned;
}

export function getAudioUrl(
  reciterId: string,
  globalAyahNumber: number,
  surahNumber?: number,
  ayahNumber?: number
): string {
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  if (reciter.source === 'everyayah' && reciter.everyAyahFolder && surahNumber && ayahNumber) {
    const s = String(surahNumber).padStart(3, '0');
    const a = String(ayahNumber).padStart(3, '0');
    return `https://everyayah.com/data/${reciter.everyAyahFolder}/${s}${a}.mp3`;
  }
  return `https://cdn.islamic.network/quran/audio/${reciter.bitrate}/${reciter.id}/${globalAyahNumber}.mp3`;
}

export interface BuiltMushafIndex {
  pages: MushafPage[];
  surahs: SurahSummary[];
  juzList: JuzSummary[];
  ayahLookup: Map<string, {page: number; ayah: MushafAyah}>;
  globalAyahToLoc: Map<number, {surah: number; ayah: number; page: number}>;
}

export interface MushafEditionMeta {
  id: MushafEditionId;
  name: string;
  shortLabel: string;
  urduLabel: string;
  linesPerPage: number;
  totalPages: number;
  publisher: string;
}

export const MUSHAF_EDITIONS: MushafEditionMeta[] = [
  {
    id: 'urdu13',
    name: '13-Line Indo-Pak',
    shortLabel: '13-Line',
    urduLabel: '۱۳ سطری مصحف',
    linesPerPage: 13,
    totalPages: 847,
    publisher: 'Nurul Huda Print',
  },
  {
    id: 'taj16',
    name: '16-Line Taj Company',
    shortLabel: 'Taj 16-Line',
    urduLabel: 'تاج کمپنی ۱۶ سطری',
    linesPerPage: 16,
    totalPages: 548,
    publisher: 'Taj Company Ltd.',
  },
];

/**
 * Exact page count per Juz (1..30) in the 847-page 13-Line Indo-Pak Scanned Mushaf (qip13).
 * Page 1 (leaf 0003) is Surah Al-Fatihah; Page 847 (leaf 0849) is Surah An-Nas.
 */
export const JUZ_SCAN_PAGE_COUNTS = [
  27, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 26,
  28, 26, 28, 26, 30, 30, 30, 30, 32, 30,
] as const;

export function getScannedPageUrl(edition: MushafEditionId, pageNumber: number): string {
  return `/api/mushaf-scan/${edition}/${pageNumber}`;
}

export function getDirectArchiveScanUrl(edition: MushafEditionId, pageNumber: number): string {
  const leafNum = edition === 'taj16' ? pageNumber + 1 : pageNumber + 2;
  const leafStr = String(leafNum).padStart(4, '0');
  if (edition === 'taj16') {
    return (
      `https://ia801403.us.archive.org/BookReader/BookReaderImages.php` +
      `?zip=/0/items/al-quran-16-lines-taj-company/AL%20QURAN%2016%20LINES%20TAJ%20COMPANY_jp2.zip` +
      `&file=AL%20QURAN%2016%20LINES%20TAJ%20COMPANY_jp2/AL%20QURAN%2016%20LINES%20TAJ%20COMPANY_${leafStr}.jp2` +
      `&id=al-quran-16-lines-taj-company&scale=2&rotate=0`
    );
  }
  return (
    `https://ia800802.us.archive.org/BookReader/BookReaderImages.php` +
    `?zip=/32/items/qip13/Complete%20Quraan%2013%20Line%20IP%20Org_jp2.zip` +
    `&file=Complete%20Quraan%2013%20Line%20IP%20Org_jp2/Complete%20Quraan%2013%20Line%20IP%20Org_${leafStr}.jp2` +
    `&id=qip13&scale=2&rotate=0`
  );
}

export function getJuzPageRange(
  edition: MushafEditionId,
  juz: number,
  juzList?: JuzSummary[]
): {startPage: number; endPage: number} {
  if (edition === 'taj16' && juzList && juzList.length === 30) {
    const cur = juzList[juz - 1];
    const next = juzList[juz];
    const startPage = cur?.startPage ?? 1;
    const endPage = next ? Math.max(startPage, next.startPage - 1) : 548;
    return {startPage, endPage};
  }
  let start = 1;
  for (let i = 0; i < juz - 1; i++) {
    start += JUZ_SCAN_PAGE_COUNTS[i] ?? 28;
  }
  const count = JUZ_SCAN_PAGE_COUNTS[juz - 1] ?? 28;
  return {startPage: start, endPage: start + count - 1};
}

/**
 * Builds deterministic scanned Mushaf pagination aligned with either:
 * - 'urdu13': 847 pages (per-Juz exact page counts)
 * - 'taj16': 548 pages (Taj Company 16-Line: Page 1 Al-Fatihah, Pages 2..548 Surahs 2..114)
 */
export function build13LineMushaf(rawSurahs: RawSurah[], edition: MushafEditionId = 'urdu13'): BuiltMushafIndex {
  const pages: MushafPage[] = [];
  const surahStartPage = new Map<number, number>();
  const juzStart = new Map<number, {page: number; surah: number; ayah: number}>();
  const ayahLookup = new Map<string, {page: number; ayah: MushafAyah}>();
  const globalAyahToLoc = new Map<number, {surah: number; ayah: number; page: number}>();

  const allItems: MushafAyah[] = [];
  const ayahsByJuz: MushafAyah[][] = Array.from({length: 30}, () => []);
  for (let si = 0; si < rawSurahs.length; si++) {
    const surah = rawSurahs[si];
    for (let ai = 0; ai < surah.ayahs.length; ai++) {
      const raw = surah.ayahs[ai];
      const nextRaw = surah.ayahs[ai + 1];
      const isRukuEnd = !nextRaw || nextRaw.r !== raw.r;
      const hasBismillah = surah.n !== 1 && surah.n !== 9 && raw.n === 1;
      const item: MushafAyah = {
        ...raw,
        surahNumber: surah.n,
        surahAr: surah.ar,
        surahEn: surah.en,
        displayArabic: stripLeadingBismillah(raw.t, surah.n, raw.n),
        isSurahStart: raw.n === 1,
        hasBismillah,
        isRukuEnd,
      };
      allItems.push(item);
      const juzIdx = Math.max(0, Math.min(29, raw.j - 1));
      ayahsByJuz[juzIdx].push(item);
    }
  }

  let pageNumber = 1;

  if (edition === 'taj16') {
    const fatihah = allItems.filter((a) => a.surahNumber === 1);
    pages.push({
      pageNumber: pageNumber++,
      juz: 1,
      primarySurah: 1,
      surahsOnPage: [1],
      items: fatihah,
    });
    const rest = allItems.filter((a) => a.surahNumber !== 1);
    const chunks = partitionAyahsAcrossPages(rest, 547);
    for (const chunk of chunks) {
      pages.push({
        pageNumber: pageNumber++,
        juz: chunk[0].j,
        primarySurah: chunk[0].surahNumber,
        surahsOnPage: Array.from(new Set(chunk.map((c) => c.surahNumber))),
        items: chunk,
      });
    }
  } else {
    for (let j = 0; j < 30; j++) {
      const juzItems = ayahsByJuz[j];
      const targetPages = JUZ_SCAN_PAGE_COUNTS[j];

      if (j === 0) {
        const fatihah = juzItems.filter((a) => a.surahNumber === 1);
        pages.push({
          pageNumber: pageNumber++,
          juz: 1,
          primarySurah: 1,
          surahsOnPage: [1],
          items: fatihah,
        });

        const restJuz1 = juzItems.filter((a) => a.surahNumber !== 1);
        const chunks = partitionAyahsAcrossPages(restJuz1, targetPages - 1);
        for (const chunk of chunks) {
          pages.push({
            pageNumber: pageNumber++,
            juz: 1,
            primarySurah: chunk[0].surahNumber,
            surahsOnPage: Array.from(new Set(chunk.map((c) => c.surahNumber))),
            items: chunk,
          });
        }
      } else {
        const chunks = partitionAyahsAcrossPages(juzItems, targetPages);
        for (const chunk of chunks) {
          pages.push({
            pageNumber: pageNumber++,
            juz: j + 1,
            primarySurah: chunk[0].surahNumber,
            surahsOnPage: Array.from(new Set(chunk.map((c) => c.surahNumber))),
            items: chunk,
          });
        }
      }
    }
  }

  // Build lookups & summaries
  for (const p of pages) {
    for (const item of p.items) {
      const key = `${item.surahNumber}:${item.n}`;
      ayahLookup.set(key, {page: p.pageNumber, ayah: item});
      globalAyahToLoc.set(item.g, {surah: item.surahNumber, ayah: item.n, page: p.pageNumber});
      if (!surahStartPage.has(item.surahNumber)) {
        surahStartPage.set(item.surahNumber, p.pageNumber);
      }
      if (!juzStart.has(item.j)) {
        juzStart.set(item.j, {page: p.pageNumber, surah: item.surahNumber, ayah: item.n});
      }
    }
  }

  const surahs: SurahSummary[] = rawSurahs.map((s) => ({
    n: s.n,
    ar: s.ar,
    en: s.en,
    enT: s.enT,
    rev: s.rev,
    ayahCount: s.ayahs.length,
    startPage: surahStartPage.get(s.n) ?? 1,
    startJuz: s.ayahs[0]?.j ?? 1,
  }));

  const juzList: JuzSummary[] = JUZ_NAMES.map((j) => {
    const start = juzStart.get(j.juz) ?? {page: 1, surah: 1, ayah: 1};
    return {
      juz: j.juz,
      urduName: j.urdu,
      arabicName: j.arabic,
      startPage: start.page,
      startSurah: start.surah,
      startAyah: start.ayah,
    };
  });

  return {
    pages,
    surahs,
    juzList,
    ayahLookup,
    globalAyahToLoc,
  };
}

function partitionAyahsAcrossPages(items: MushafAyah[], pageCount: number): MushafAyah[][] {
  if (items.length === 0 || pageCount <= 0) return [];
  const weights = items.map(
    (item) =>
      Math.max(12, item.c.length) +
      5 +
      (item.isSurahStart ? 70 : 0) +
      (item.hasBismillah ? 35 : 0)
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const result: MushafAyah[][] = [];
  let cursor = 0;
  let remainingWeight = totalWeight;

  for (let p = 0; p < pageCount; p++) {
    const remainingPages = pageCount - p;
    if (remainingPages === 1) {
      result.push(items.slice(cursor));
      break;
    }
    const targetForThisPage = remainingWeight / remainingPages;
    const minLeftForRest = remainingPages - 1;
    const chunk: MushafAyah[] = [];
    let chunkWeight = 0;

    while (cursor < items.length - minLeftForRest) {
      const w = weights[cursor];
      if (chunk.length > 0 && chunkWeight + w * 0.55 > targetForThisPage) {
        break;
      }
      chunk.push(items[cursor]);
      chunkWeight += w;
      remainingWeight -= w;
      cursor++;
    }
    if (chunk.length === 0 && cursor < items.length) {
      chunk.push(items[cursor]);
      remainingWeight -= weights[cursor];
      cursor++;
    }
    result.push(chunk);
  }
  return result;
}
