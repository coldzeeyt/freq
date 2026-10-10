import pg from 'pg';
import { MOCK_VIDEOS } from '@/data/mockVideos';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

export const pool = new pg.Pool({
  connectionString: url,
  // Railway's private network doesn't use TLS; public proxies do.
  ssl: /sslmode=require|proxy\.rlwy\.net/.test(url) ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

const SCHEMA = `
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text not null unique,
  email text not null unique,
  password_hash text not null,
  verified boolean not null default false,
  avatar_color text not null default '#EDE6D6',
  created_at timestamptz not null default now()
);

create table if not exists videos (
  id text primary key,
  user_id uuid references users(id) on delete cascade,
  creator jsonb not null,
  uri text not null,
  thumbnail text,
  station_id text not null,
  tags text[] not null default '{}',
  caption text not null default '',
  origin text not null check (origin in ('camera', 'upload')),
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists videos_station_idx on videos (station_id);

create table if not exists likes (
  user_id uuid not null references users(id) on delete cascade,
  video_id text not null references videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists taste_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);
`;

export async function migrate() {
  await pool.query(SCHEMA);
  const { rows } = await pool.query('select count(*)::int as n from videos');
  if (rows[0].n > 0) return;
  // First boot: load the starter catalogue so every station has something on air.
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const v of MOCK_VIDEOS) {
      await client.query(
        `insert into videos (id, creator, uri, thumbnail, station_id, tags, caption, origin, views, likes, comments, shares, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now() - ($13 || ' hours')::interval)`,
        [
          v.id,
          v.creator,
          v.uri,
          v.thumbnail ?? null,
          v.stationId,
          v.tags,
          v.caption,
          v.origin,
          v.views,
          v.likes,
          v.comments,
          v.shares,
          // Keep the catalogue's relative ages, anchored to now.
          String(Math.round((Date.UTC(2026, 9, 10) - Date.parse(v.createdAt)) / 3_600_000)),
        ],
      );
    }
    await client.query('commit');
    console.log(`seeded ${MOCK_VIDEOS.length} videos`);
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}
