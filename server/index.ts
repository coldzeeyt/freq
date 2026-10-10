import express, { type Request } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { POSTABLE_STATIONS, STATIONS } from '@/data/stations';
import { normalizeTag } from '@/lib/tagRouting';
import { applyEvent, emptyProfile, type TasteProfile } from '@/services/ranking/profile';
import { rankFeed } from '@/services/ranking/rank';
import { isHumanMade } from '@/lib/human';
import type { Creator, Video, WatchEvent } from '@/types/models';
import { checkPassword, hashPassword, issueToken, readUser, requireUser, toAccount, type UserRow } from './auth';
import { migrate, pool } from './db';
import { createOnAir } from './onair';
import { talk } from './talk';

const PORT = Number(process.env.PORT ?? 3000);
const ROOT = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT, 'dist');
const MEDIA_DIR = process.env.MEDIA_DIR ?? path.join(ROOT, '.media');
fs.mkdirSync(MEDIA_DIR, { recursive: true });

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '100kb' }));

// The web build is served from this same origin; this lets the Expo dev server and native apps call the API too.
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Freq-Session');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use('/api', readUser);

const known = new Set(STATIONS.map((s) => s.id));
const postable = new Set(POSTABLE_STATIONS.map((s) => s.id));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[a-z0-9._]{3,20}$/;

function removeMedia(uri: string) {
  if (!uri.startsWith('/media/')) return;
  fs.rmSync(path.join(MEDIA_DIR, path.basename(uri)), { force: true });
}

const origin = (req: Request) => `${req.protocol}://${req.get('host')}`;

interface VideoRow {
  id: string;
  creator: Creator;
  uri: string;
  thumbnail: string | null;
  station_id: string;
  tags: string[];
  caption: string;
  origin: 'camera' | 'upload';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  created_at: Date;
}

const toVideo = (r: VideoRow, base: string): Video => ({
  id: r.id,
  // Uploaded files are stored as /media/... paths; hand clients a full URL.
  uri: r.uri.startsWith('/') ? base + r.uri : r.uri,
  thumbnail: r.thumbnail ?? undefined,
  stationId: r.station_id,
  tags: r.tags,
  caption: r.caption,
  creator: r.creator,
  origin: r.origin,
  views: r.views,
  likes: r.likes,
  comments: r.comments,
  shares: r.shares,
  createdAt: r.created_at.toISOString(),
});

const creatorFor = (u: UserRow): Creator => ({
  id: u.id,
  name: u.name,
  handle: u.handle,
  verified: u.verified,
  avatarColor: u.avatar_color,
});

async function loadProfile(userId: string): Promise<TasteProfile> {
  const { rows } = await pool.query('select profile from taste_profiles where user_id = $1', [userId]);
  return rows[0]?.profile ?? emptyProfile();
}

/** Applies one interaction to the user's taste profile, inside a row lock. */
async function learn(userId: string, event: WatchEvent, video: Video) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query('select profile from taste_profiles where user_id = $1 for update', [userId]);
    const next = applyEvent(rows[0]?.profile ?? emptyProfile(), event, video);
    await client.query(
      `insert into taste_profiles (user_id, profile, updated_at) values ($1, $2, now())
       on conflict (user_id) do update set profile = excluded.profile, updated_at = now()`,
      [userId, next],
    );
    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

async function getVideo(id: string, base: string) {
  const { rows } = await pool.query<VideoRow>('select * from videos where id = $1', [id]);
  return rows[0] ? toVideo(rows[0], base) : null;
}

const route =
  (fn: (req: Request, res: express.Response) => Promise<void>) => (req: Request, res: express.Response, next: express.NextFunction) =>
    fn(req, res).catch(next);

app.get('/api/health', route(async (_req, res) => {
  await pool.query('select 1');
  res.json({ ok: true });
}));

// --- Accounts ---------------------------------------------------------------

app.post('/api/auth/signup', route(async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const handle = String(req.body?.handle ?? '').trim().replace(/^@/, '').toLowerCase();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!name || name.length > 60) return void res.status(400).json({ error: 'What should we call you?' });
  if (!HANDLE.test(handle)) return void res.status(400).json({ error: 'Usernames are 3 to 20 letters, numbers, dots or underscores.' });
  if (!EMAIL.test(email)) return void res.status(400).json({ error: 'That email doesn’t look right.' });
  if (password.length < 8) return void res.status(400).json({ error: 'Passwords need at least 8 characters.' });

  const taken = await pool.query('select email, handle from users where email = $1 or handle = $2', [email, handle]);
  if (taken.rows.some((r) => r.email === email)) return void res.status(409).json({ error: 'There’s already an account with that email. Try logging in.' });
  if (taken.rows.length) return void res.status(409).json({ error: `@${handle} is taken. Try another username.` });

  const { rows } = await pool.query<UserRow>(
    'insert into users (name, handle, email, password_hash) values ($1, $2, $3, $4) returning *',
    [name, handle, email, await hashPassword(password)],
  );
  res.status(201).json({ token: await issueToken(rows[0].id), account: toAccount(rows[0]) });
}));

app.post('/api/auth/login', route(async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const { rows } = await pool.query<UserRow>('select * from users where email = $1', [email]);
  if (!rows[0] || !(await checkPassword(password, rows[0].password_hash))) {
    return void res.status(401).json({ error: 'That email and password don’t match.' });
  }
  res.json({ token: await issueToken(rows[0].id), account: toAccount(rows[0]) });
}));

/** Deletes the account, its posts (and their files), likes and taste profile. */
app.post('/api/auth/delete', requireUser, route(async (req, res) => {
  const { rows } = await pool.query<{ uri: string }>(
    `select uri from videos where user_id = $1
     union all select back_uri from moments where user_id = $1
     union all select front_uri from moments where user_id = $1`,
    [req.user!.id],
  );
  await pool.query(`update comments set deleted = true, body = '', author = null where user_id = $1`, [req.user!.id]);
  await pool.query('delete from users where id = $1', [req.user!.id]);
  rows.forEach((r) => removeMedia(r.uri));
  res.json({ ok: true });
}));

app.get('/api/auth/me', requireUser, route(async (req, res) => {
  res.json({ account: toAccount(req.user!), creator: creatorFor(req.user!) });
}));

// --- Feed -------------------------------------------------------------------

app.get('/api/feed', route(async (req, res) => {
  const stationId = String(req.query.station ?? 'all');
  if (!known.has(stationId)) return void res.status(400).json({ error: 'Unknown station.' });
  const humanOnly = req.query.humanOnly === '1';
  const seed = Number.parseInt(String(req.get('x-freq-session') ?? ''), 10) || 0;

  const { rows } = await pool.query<VideoRow>(
    stationId === 'all' ? 'select * from videos' : 'select * from videos where station_id = $1',
    stationId === 'all' ? [] : [stationId],
  );
  let pool_ = rows.map((r) => toVideo(r, origin(req)));
  if (humanOnly) pool_ = pool_.filter(isHumanMade);

  const profile = req.user ? await loadProfile(req.user.id) : emptyProfile();
  const ranked = rankFeed(pool_, profile, { stationId, seed, viewerId: req.user?.id });
  res.json({ videos: ranked.slice(0, 100) });
}));

// --- Posting ----------------------------------------------------------------

const upload = multer({
  storage: multer.diskStorage({
    destination: MEDIA_DIR,
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.mp4').toLowerCase().replace(/[^.a-z0-9]/g, '');
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 150 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, /^video\//.test(file.mimetype) || file.mimetype === 'application/octet-stream'),
});

app.post('/api/videos', requireUser, upload.single('video'), route(async (req, res) => {
  const file = req.file;
  if (!file) return void res.status(400).json({ error: 'No video was attached.' });
  const stationId = String(req.body.stationId ?? '');
  if (!postable.has(stationId)) {
    fs.rmSync(file.path, { force: true });
    return void res.status(400).json({ error: 'Pick a station.' });
  }
  let tags: string[] = [];
  try {
    tags = (JSON.parse(String(req.body.tags ?? '[]')) as unknown[]).map((t) => normalizeTag(String(t))).filter(Boolean).slice(0, 12);
  } catch {}
  const caption = String(req.body.caption ?? '').trim().slice(0, 150);
  // NOTE: the client says whether this came from the in-app camera. A determined user could fake it;
  // a stricter version would issue one-time recording tokens to the camera screen.
  const videoOrigin = req.body.origin === 'camera' ? 'camera' : 'upload';

  const id = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { rows } = await pool.query<VideoRow>(
    `insert into videos (id, user_id, creator, uri, station_id, tags, caption, origin)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
    [id, req.user!.id, creatorFor(req.user!), `/media/${file.filename}`, stationId, [...new Set(tags)], caption, videoOrigin],
  );
  res.status(201).json({ video: toVideo(rows[0], origin(req)) });
}));

app.post('/api/videos/:id/delete', requireUser, route(async (req, res) => {
  const { rows } = await pool.query<{ uri: string }>('delete from videos where id = $1 and user_id = $2 returning uri', [
    String(req.params.id),
    req.user!.id,
  ]);
  if (!rows[0]) return void res.status(404).json({ error: 'That isn’t your video.' });
  removeMedia(rows[0].uri);
  await pool.query(`delete from comments where target_type = 'video' and target_id = $1`, [String(req.params.id)]);
  res.json({ ok: true });
}));

// --- Likes & signals ----------------------------------------------------------

app.get('/api/likes', requireUser, route(async (req, res) => {
  const { rows } = await pool.query('select video_id from likes where user_id = $1', [req.user!.id]);
  res.json({ ids: rows.map((r) => r.video_id) });
}));

app.post('/api/videos/:id/like', requireUser, route(async (req, res) => {
  const video = await getVideo(String(req.params.id), origin(req));
  if (!video) return void res.status(404).json({ error: 'That video is gone.' });
  const liked = req.body?.liked === true;
  const changed = liked
    ? await pool.query('insert into likes (user_id, video_id) values ($1, $2) on conflict do nothing', [req.user!.id, video.id])
    : await pool.query('delete from likes where user_id = $1 and video_id = $2', [req.user!.id, video.id]);
  if (changed.rowCount) {
    await pool.query(`update videos set likes = greatest(0, likes + $2) where id = $1`, [video.id, liked ? 1 : -1]);
    await learn(req.user!.id, { type: 'like', videoId: video.id, liked }, video);
  }
  res.json({ ok: true });
}));

app.post('/api/events', route(async (req, res) => {
  const type = req.body?.type;
  const video = await getVideo(String(req.body?.videoId ?? ''), origin(req));
  if (!video || (type !== 'watch' && type !== 'share')) return void res.status(400).json({ error: 'Bad event.' });

  let event: WatchEvent;
  if (type === 'watch') {
    const watchedMs = Math.max(0, Math.min(10 * 60_000, Number(req.body.watchedMs) || 0));
    const durationMs = Math.max(0, Math.min(10 * 60_000, Number(req.body.durationMs) || 0));
    event = { type, videoId: video.id, watchedMs, durationMs };
    await pool.query('update videos set views = views + 1 where id = $1', [video.id]);
  } else {
    event = { type, videoId: video.id };
    await pool.query('update videos set shares = shares + 1 where id = $1', [video.id]);
  }
  if (req.user) await learn(req.user.id, event, video);
  res.json({ ok: true });
}));

app.use('/api', talk);
app.use('/api', createOnAir(MEDIA_DIR, origin, removeMedia));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// --- Files & the web app -----------------------------------------------------

app.use('/media', express.static(MEDIA_DIR, { maxAge: '30d', immutable: true }));
// A missing file is a 404, not the web app shell.
app.use('/media', (_req, res) => {
  res.sendStatus(404);
});
// Tags that make "Add to Home Screen" open Freq full-screen like an app, with its own icon,
// no browser bars, no pinch-zoom and no rubber-band page scrolling.
const APP_HEAD = `
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0E0D0B">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Freq">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>
  html, body { background: #0E0D0B; overscroll-behavior: none; }
  * { -webkit-tap-highlight-color: transparent; }
  body { -webkit-touch-callout: none; }
</style>
<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));</script>
`;

function appShell() {
  const html = fs.readFileSync(path.join(WEB_DIR, 'index.html'), 'utf8');
  return html
    .replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">')
    .replace(/<title>[^<]*<\/title>/, '<title>Freq</title>')
    .replace('</head>', `${APP_HEAD}</head>`);
}

if (fs.existsSync(WEB_DIR)) {
  const shell = appShell();
  const sendShell = (_req: Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.type('html').send(shell);
  };
  app.get('/', sendShell);
  app.get('/index.html', sendShell);
  app.get('/sw.js', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(WEB_DIR, 'sw.js'));
  });
  app.use(express.static(WEB_DIR, { index: false, maxAge: '1h' }));
  // Single-page app: every other path gets the shell.
  app.get('/{*path}', sendShell);
}

app.use((err: Error, _req: Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const tooBig = (err as { code?: string }).code === 'LIMIT_FILE_SIZE';
  res.status(tooBig ? 413 : 500).json({ error: tooBig ? 'That video is too big (150 MB max).' : 'Something went wrong on our end.' });
});

migrate()
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`freq server on :${PORT}`)))
  .catch((e) => {
    console.error('failed to start', e);
    process.exit(1);
  });
