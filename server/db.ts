import pg from 'pg';

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
-- Vault videos are permanent: no one can delete them, admins included.
alter table videos add column if not exists permanent boolean not null default false;

create table if not exists likes (
  user_id uuid not null references users(id) on delete cascade,
  video_id text not null references videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  author jsonb not null,
  station_id text not null,
  title text not null,
  body text not null default '',
  score integer not null default 1,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_station_idx on posts (station_id, created_at desc);

-- Comments hang off a board post or a video. Deleted ones keep their row so replies stay threaded.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  author jsonb,
  target_type text not null check (target_type in ('post', 'video')),
  target_id text not null,
  parent_id uuid references comments(id) on delete cascade,
  body text not null,
  deleted boolean not null default false,
  score integer not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists comments_target_idx on comments (target_type, target_id);

create table if not exists votes (
  user_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  primary key (user_id, target_type, target_id)
);

create table if not exists moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  author jsonb not null,
  day text not null,
  back_uri text not null,
  front_uri text not null,
  caption text not null default '',
  late boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, day)
);
create index if not exists moments_day_idx on moments (day);

create table if not exists taste_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);
`;

export async function migrate() {
  await pool.query(SCHEMA);
  // Freq used to ship with sample clips; the catalogue is now only what people post.
  const removed = await pool.query("delete from videos where id like 'mock-%'");
  if (removed.rowCount) console.log(`removed ${removed.rowCount} sample videos`);
}
