import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
fs.mkdirSync(DATA_DIR, {recursive: true});

const DB_PATH = path.join(DATA_DIR, 'quran_sync.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS sync_profiles (
    sync_code TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    reading_state_json TEXT,
    preferences_json TEXT
  );
  CREATE TABLE IF NOT EXISTS sync_bookmarks (
    sync_code TEXT NOT NULL,
    bookmark_id TEXT NOT NULL,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    page INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'emerald',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (sync_code, bookmark_id),
    FOREIGN KEY (sync_code) REFERENCES sync_profiles(sync_code) ON DELETE CASCADE
  );
`);

interface SyncBookmark {
  id: string;
  surah: number;
  ayah: number;
  page: number;
  note: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

interface ReadingState {
  lastPage: number;
  lastSurah: number;
  lastAyah: number;
  updatedAt: number;
}

interface PreferencesState {
  nightMode: boolean;
  viewMode: 'single' | 'spread';
  readingMode: 'scanned' | 'mushaf' | 'verse';
  edition?: 'urdu13' | 'taj16';
  zoom: number;
  reciter: string;
  showUrduInMushaf: boolean;
  updatedAt: number;
}

function normalizeSyncCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (cleaned.length < 4 || cleaned.length > 24) return null;
  return cleaned;
}

function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `NOOR-${suffix}`;
}

function readProfileState(syncCode: string) {
  const profile = db
    .prepare('SELECT sync_code, created_at, updated_at, reading_state_json, preferences_json FROM sync_profiles WHERE sync_code = ?')
    .get(syncCode) as
    | {
        sync_code: string;
        created_at: number;
        updated_at: number;
        reading_state_json: string | null;
        preferences_json: string | null;
      }
    | undefined;

  if (!profile) return null;

  const rows = db
    .prepare(
      'SELECT bookmark_id, surah, ayah, page, note, color, created_at, updated_at, deleted FROM sync_bookmarks WHERE sync_code = ? ORDER BY updated_at DESC'
    )
    .all(syncCode) as Array<{
    bookmark_id: string;
    surah: number;
    ayah: number;
    page: number;
    note: string;
    color: string;
    created_at: number;
    updated_at: number;
    deleted: number;
  }>;

  const bookmarks: SyncBookmark[] = rows.map((r) => ({
    id: r.bookmark_id,
    surah: r.surah,
    ayah: r.ayah,
    page: r.page,
    note: r.note,
    color: r.color,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deleted: r.deleted === 1,
  }));

  return {
    syncCode: profile.sync_code,
    updatedAt: profile.updated_at,
    readingState: profile.reading_state_json ? (JSON.parse(profile.reading_state_json) as ReadingState) : null,
    preferences: profile.preferences_json ? (JSON.parse(profile.preferences_json) as PreferencesState) : null,
    bookmarks,
  };
}

function mergeIntoDatabase(
  syncCode: string,
  payload: {
    bookmarks?: SyncBookmark[];
    readingState?: ReadingState | null;
    preferences?: PreferencesState | null;
  }
) {
  const now = Date.now();
  const existingProfile = db
    .prepare('SELECT reading_state_json, preferences_json FROM sync_profiles WHERE sync_code = ?')
    .get(syncCode) as {reading_state_json: string | null; preferences_json: string | null} | undefined;

  if (!existingProfile) {
    db.prepare(
      'INSERT INTO sync_profiles (sync_code, created_at, updated_at, reading_state_json, preferences_json) VALUES (?, ?, ?, ?, ?)'
    ).run(
      syncCode,
      now,
      now,
      payload.readingState ? JSON.stringify(payload.readingState) : null,
      payload.preferences ? JSON.stringify(payload.preferences) : null
    );
  } else {
    let nextReading = existingProfile.reading_state_json
      ? (JSON.parse(existingProfile.reading_state_json) as ReadingState)
      : null;
    if (payload.readingState && (!nextReading || payload.readingState.updatedAt >= nextReading.updatedAt)) {
      nextReading = payload.readingState;
    }

    let nextPrefs = existingProfile.preferences_json
      ? (JSON.parse(existingProfile.preferences_json) as PreferencesState)
      : null;
    if (payload.preferences && (!nextPrefs || payload.preferences.updatedAt >= nextPrefs.updatedAt)) {
      nextPrefs = payload.preferences;
    }

    db.prepare('UPDATE sync_profiles SET updated_at = ?, reading_state_json = ?, preferences_json = ? WHERE sync_code = ?').run(
      now,
      nextReading ? JSON.stringify(nextReading) : null,
      nextPrefs ? JSON.stringify(nextPrefs) : null,
      syncCode
    );
  }

  if (Array.isArray(payload.bookmarks)) {
    const selectBm = db.prepare('SELECT updated_at FROM sync_bookmarks WHERE sync_code = ? AND bookmark_id = ?');
    const upsertBm = db.prepare(`
      INSERT INTO sync_bookmarks (sync_code, bookmark_id, surah, ayah, page, note, color, created_at, updated_at, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_code, bookmark_id) DO UPDATE SET
        surah = excluded.surah,
        ayah = excluded.ayah,
        page = excluded.page,
        note = excluded.note,
        color = excluded.color,
        updated_at = excluded.updated_at,
        deleted = excluded.deleted
    `);

    for (const bm of payload.bookmarks.slice(0, 500)) {
      if (!bm || typeof bm.id !== 'string' || bm.id.length > 100) continue;
      const surah = Number(bm.surah);
      const ayah = Number(bm.ayah);
      const page = Number(bm.page);
      if (!Number.isFinite(surah) || surah < 1 || surah > 114) continue;
      if (!Number.isFinite(ayah) || ayah < 1 || ayah > 286) continue;
      if (!Number.isFinite(page) || page < 1 || page > 1200) continue;

      const existingBm = selectBm.get(syncCode, bm.id) as {updated_at: number} | undefined;
      const incomingUpdatedAt = Number(bm.updatedAt) || now;
      if (!existingBm || incomingUpdatedAt >= existingBm.updated_at) {
        const note = typeof bm.note === 'string' ? bm.note.slice(0, 300) : '';
        const color = typeof bm.color === 'string' ? bm.color.slice(0, 24) : 'emerald';
        const createdAt = Number(bm.createdAt) || incomingUpdatedAt;
        const deleted = bm.deleted ? 1 : 0;
        upsertBm.run(syncCode, bm.id, surah, ayah, page, note, color, createdAt, incomingUpdatedAt, deleted);
      }
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '1mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({ok: true, database: 'sqlite'});
  });

  const SCANS_CACHE_DIR = path.join(DATA_DIR, 'mushaf_scans');
  fs.mkdirSync(SCANS_CACHE_DIR, {recursive: true});

  async function handleScanRequest(edition: string, pageParam: string, res: express.Response) {
    const ed = edition === 'taj16' ? 'taj16' : edition === 'urdu13' ? 'urdu13' : null;
    if (!ed) {
      res.status(400).json({error: 'Unknown Mushaf edition.'});
      return;
    }
    const maxPages = ed === 'taj16' ? 548 : 847;
    const pageNum = Number(pageParam);
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > maxPages) {
      res.status(400).json({error: `Page number must be between 1 and ${maxPages}.`});
      return;
    }

    const leafNum = ed === 'taj16' ? pageNum + 1 : pageNum + 2;
    const leafStr = String(leafNum).padStart(4, '0');
    const edCacheDir = path.join(SCANS_CACHE_DIR, ed);
    fs.mkdirSync(edCacheDir, {recursive: true});
    const cachedFile = path.join(edCacheDir, `${leafStr}.jpg`);

    try {
      if (fs.existsSync(cachedFile)) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        fs.createReadStream(cachedFile).pipe(res);
        return;
      }

      const upstreamUrl =
        ed === 'taj16'
          ? `https://ia801403.us.archive.org/BookReader/BookReaderImages.php` +
            `?zip=/0/items/al-quran-16-lines-taj-company/AL%20QURAN%2016%20LINES%20TAJ%20COMPANY_jp2.zip` +
            `&file=AL%20QURAN%2016%20LINES%20TAJ%20COMPANY_jp2/AL%20QURAN%2016%20LINES%20TAJ%20COMPANY_${leafStr}.jp2` +
            `&id=al-quran-16-lines-taj-company&scale=2&rotate=0`
          : `https://ia800802.us.archive.org/BookReader/BookReaderImages.php` +
            `?zip=/32/items/qip13/Complete%20Quraan%2013%20Line%20IP%20Org_jp2.zip` +
            `&file=Complete%20Quraan%2013%20Line%20IP%20Org_jp2/Complete%20Quraan%2013%20Line%20IP%20Org_${leafStr}.jp2` +
            `&id=qip13&scale=2&rotate=0`;

      const upstream = await fetch(upstreamUrl);
      if (!upstream.ok) {
        res.status(502).json({error: 'Unable to fetch scanned Mushaf page.'});
        return;
      }

      const arrBuf = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrBuf);
      const tmpFile = `${cachedFile}.tmp-${Date.now()}`;
      fs.writeFileSync(tmpFile, buffer);
      fs.renameSync(tmpFile, cachedFile);

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (err) {
      console.error('Scanned page fetch error:', err);
      res.status(500).json({error: 'Error loading scanned Mushaf page.'});
    }
  }

  app.get('/api/mushaf-scan/:edition/:page', (req, res) => {
    void handleScanRequest(req.params.edition, req.params.page, res);
  });

  app.get('/api/mushaf-scan/:page', (req, res) => {
    void handleScanRequest('urdu13', req.params.page, res);
  });

  app.post('/api/sync/create', (req, res) => {
    try {
      const requestedCode = normalizeSyncCode(req.body?.syncCode);
      let syncCode = requestedCode;
      if (!syncCode) {
        for (let i = 0; i < 10; i++) {
          const candidate = generateSyncCode();
          const exists = db.prepare('SELECT 1 FROM sync_profiles WHERE sync_code = ?').get(candidate);
          if (!exists) {
            syncCode = candidate;
            break;
          }
        }
      }
      if (!syncCode) {
        res.status(500).json({error: 'Unable to allocate sync code.'});
        return;
      }

      mergeIntoDatabase(syncCode, {
        bookmarks: req.body?.bookmarks,
        readingState: req.body?.readingState,
        preferences: req.body?.preferences,
      });

      const state = readProfileState(syncCode);
      res.json(state);
    } catch (err) {
      console.error('Sync create error:', err);
      res.status(500).json({error: 'Local database sync error.'});
    }
  });

  app.get('/api/sync/pull', (req, res) => {
    try {
      const syncCode = normalizeSyncCode(req.query.code);
      if (!syncCode) {
        res.status(400).json({error: 'Invalid sync code format (4-24 letters/numbers).'});
        return;
      }
      const state = readProfileState(syncCode);
      if (!state) {
        res.status(404).json({error: 'Sync profile not found. Create a new profile or check your code.'});
        return;
      }
      res.json(state);
    } catch (err) {
      console.error('Sync pull error:', err);
      res.status(500).json({error: 'Unable to pull from local database.'});
    }
  });

  app.post('/api/sync/push', (req, res) => {
    try {
      const syncCode = normalizeSyncCode(req.body?.syncCode);
      if (!syncCode) {
        res.status(400).json({error: 'Invalid sync code.'});
        return;
      }
      mergeIntoDatabase(syncCode, {
        bookmarks: req.body?.bookmarks,
        readingState: req.body?.readingState,
        preferences: req.body?.preferences,
      });
      const state = readProfileState(syncCode);
      res.json(state);
    } catch (err) {
      console.error('Sync push error:', err);
      res.status(500).json({error: 'Unable to push to local database.'});
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        setHeaders(res, filePath) {
          if (filePath.endsWith('.webmanifest')) {
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Noor Mushaf server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
