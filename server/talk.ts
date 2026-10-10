import { Router, type Request, type Response } from 'express';
import { POSTABLE_STATIONS, STATIONS } from '@/data/stations';
import { hotScore } from '@/lib/hot';
import type { BoardPost, BoardSort, Comment, Creator, Vote } from '@/types/models';
import { requireUser, type UserRow } from './auth';
import { pool } from './db';

const known = new Set(STATIONS.map((s) => s.id));
const postable = new Set(POSTABLE_STATIONS.map((s) => s.id));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const authorFor = (u: UserRow): Creator => ({
  id: u.id,
  name: u.name,
  handle: u.handle,
  verified: u.verified,
  avatarColor: u.avatar_color,
});

interface PostRow {
  id: string;
  author: Creator;
  station_id: string;
  title: string;
  body: string;
  score: number;
  comment_count: number;
  created_at: Date;
  my_vote: number | null;
}

interface CommentRow {
  id: string;
  parent_id: string | null;
  author: Creator | null;
  body: string;
  deleted: boolean;
  score: number;
  created_at: Date;
  my_vote: number | null;
}

const toPost = (r: PostRow): BoardPost => ({
  id: r.id,
  stationId: r.station_id,
  title: r.title,
  body: r.body,
  author: r.author,
  score: r.score,
  myVote: (r.my_vote ?? 0) as Vote,
  commentCount: r.comment_count,
  createdAt: r.created_at.toISOString(),
});

const toComment = (r: CommentRow): Comment => ({
  id: r.id,
  parentId: r.parent_id,
  body: r.deleted ? '' : r.body,
  author: r.deleted ? null : r.author,
  deleted: r.deleted,
  score: r.score,
  myVote: (r.my_vote ?? 0) as Vote,
  createdAt: r.created_at.toISOString(),
});

const route =
  (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: (e?: unknown) => void) =>
    fn(req, res).catch(next);

const POST_SELECT = `
  select p.*, v.value as my_vote from posts p
  left join votes v on v.target_type = 'post' and v.target_id = p.id and v.user_id = $1`;

export const talk = Router();

// --- Boards -------------------------------------------------------------------

talk.get('/boards/:station/posts', route(async (req, res) => {
  const station = String(req.params.station);
  if (!known.has(station)) return void res.status(400).json({ error: 'Unknown station.' });
  const sort = (['hot', 'new', 'top'].includes(String(req.query.sort)) ? req.query.sort : 'hot') as BoardSort;
  const { rows } = await pool.query<PostRow>(
    `${POST_SELECT} ${station === 'all' ? '' : 'where p.station_id = $2'} order by p.created_at desc limit 300`,
    station === 'all' ? [req.user?.id ?? null] : [req.user?.id ?? null, station],
  );
  const posts = rows.map(toPost);
  if (sort === 'top') posts.sort((a, b) => b.score - a.score || Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (sort === 'hot') posts.sort((a, b) => hotScore(b.score, b.createdAt) - hotScore(a.score, a.createdAt));
  res.json({ posts: posts.slice(0, 100) });
}));

talk.post('/boards/:station/posts', requireUser, route(async (req, res) => {
  const station = String(req.params.station);
  if (!postable.has(station)) return void res.status(400).json({ error: 'Pick a station for your post.' });
  const title = String(req.body?.title ?? '').trim();
  const body = String(req.body?.body ?? '').trim();
  if (title.length < 3) return void res.status(400).json({ error: 'Give it a title.' });
  if (title.length > 140) return void res.status(400).json({ error: 'Titles are 140 characters max.' });
  if (body.length > 4000) return void res.status(400).json({ error: 'Posts are 4000 characters max.' });

  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query<PostRow>(
      `insert into posts (user_id, author, station_id, title, body) values ($1, $2, $3, $4, $5)
       returning *, 1 as my_vote`,
      [req.user!.id, authorFor(req.user!), station, title, body],
    );
    // Like Reddit, you start out upvoting your own post.
    await client.query(`insert into votes (user_id, target_type, target_id, value) values ($1, 'post', $2, 1)`, [req.user!.id, rows[0].id]);
    await client.query('commit');
    res.status(201).json({ post: toPost(rows[0]) });
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}));

talk.get('/posts/:id', route(async (req, res) => {
  const id = String(req.params.id);
  if (!UUID.test(id)) return void res.status(404).json({ error: 'That post is gone.' });
  const { rows } = await pool.query<PostRow>(`${POST_SELECT} where p.id = $2`, [req.user?.id ?? null, id]);
  if (!rows[0]) return void res.status(404).json({ error: 'That post is gone.' });
  res.json({ post: toPost(rows[0]), comments: await listComments('post', id, req.user?.id) });
}));

talk.post('/posts/:id/delete', requireUser, route(async (req, res) => {
  const id = String(req.params.id);
  if (!UUID.test(id)) return void res.status(404).json({ error: 'That post is gone.' });
  const { rowCount } = await pool.query('delete from posts where id = $1 and user_id = $2', [id, req.user!.id]);
  if (!rowCount) return void res.status(404).json({ error: 'That isn’t your post.' });
  await pool.query(`delete from comments where target_type = 'post' and target_id = $1`, [id]);
  res.json({ ok: true });
}));

// --- Comments (on posts and videos) -------------------------------------------

async function listComments(type: 'post' | 'video', id: string, userId?: string) {
  const { rows } = await pool.query<CommentRow>(
    `select c.*, v.value as my_vote from comments c
     left join votes v on v.target_type = 'comment' and v.target_id = c.id and v.user_id = $3
     where c.target_type = $1 and c.target_id = $2
     order by c.created_at asc`,
    [type, id, userId ?? null],
  );
  return rows.map(toComment);
}

async function targetExists(type: 'post' | 'video', id: string) {
  if (type === 'post' && !UUID.test(id)) return false;
  const { rowCount } = await pool.query(`select 1 from ${type === 'post' ? 'posts' : 'videos'} where id = $1`, [id]);
  return !!rowCount;
}

const getComments = (type: 'post' | 'video') => route(async (req, res) => {
  const t = { type, id: String(req.params.id) };
  if (!(await targetExists(t.type, t.id))) return void res.status(404).json({ error: 'Not found.' });
  res.json({ comments: await listComments(t.type, t.id, req.user?.id) });
});

const addComment = (type: 'post' | 'video') => route(async (req, res) => {
  const t = { type, id: String(req.params.id) };
  const body = String(req.body?.body ?? '').trim();
  const parentId = req.body?.parentId ? String(req.body.parentId) : null;
  if (!body) return void res.status(400).json({ error: 'Say something first.' });
  if (body.length > 2000) return void res.status(400).json({ error: 'Comments are 2000 characters max.' });
  if (!(await targetExists(t.type, t.id))) return void res.status(404).json({ error: 'That thread is gone.' });
  if (parentId) {
    const parent = UUID.test(parentId)
      ? await pool.query('select 1 from comments where id = $1 and target_type = $2 and target_id = $3', [parentId, t.type, t.id])
      : { rowCount: 0 };
    if (!parent.rowCount) return void res.status(400).json({ error: 'That reply lost its parent.' });
  }

  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query<CommentRow>(
      `insert into comments (user_id, author, target_type, target_id, parent_id, body)
       values ($1, $2, $3, $4, $5, $6) returning *, 1 as my_vote`,
      [req.user!.id, authorFor(req.user!), t.type, t.id, parentId, body],
    );
    await client.query(`insert into votes (user_id, target_type, target_id, value) values ($1, 'comment', $2, 1)`, [req.user!.id, rows[0].id]);
    await client.query(
      t.type === 'post'
        ? 'update posts set comment_count = comment_count + 1 where id = $1'
        : 'update videos set comments = comments + 1 where id = $1',
      [t.id],
    );
    await client.query('commit');
    res.status(201).json({ comment: toComment(rows[0]) });
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
});

talk.get('/posts/:id/comments', getComments('post'));
talk.get('/videos/:id/comments', getComments('video'));
talk.post('/posts/:id/comments', requireUser, addComment('post'));
talk.post('/videos/:id/comments', requireUser, addComment('video'));

talk.post('/comments/:id/delete', requireUser, route(async (req, res) => {
  const id = String(req.params.id);
  const { rows } = UUID.test(id)
    ? await pool.query<{ target_type: string; target_id: string }>(
        `update comments set deleted = true, body = '' where id = $1 and user_id = $2 and not deleted returning target_type, target_id`,
        [id, req.user!.id],
      )
    : { rows: [] };
  if (!rows[0]) return void res.status(404).json({ error: 'That isn’t your comment.' });
  await pool.query(
    rows[0].target_type === 'post'
      ? 'update posts set comment_count = greatest(0, comment_count - 1) where id = $1'
      : 'update videos set comments = greatest(0, comments - 1) where id = $1',
    [rows[0].target_id],
  );
  res.json({ ok: true });
}));

// --- Votes --------------------------------------------------------------------

talk.post('/vote', requireUser, route(async (req, res) => {
  const type = req.body?.targetType;
  const id = String(req.body?.targetId ?? '');
  const value = Number(req.body?.value);
  if ((type !== 'post' && type !== 'comment') || !UUID.test(id) || ![-1, 0, 1].includes(value)) {
    return void res.status(400).json({ error: 'Bad vote.' });
  }
  const table = type === 'post' ? 'posts' : 'comments';
  const client = await pool.connect();
  try {
    await client.query('begin');
    const exists = await client.query(`select 1 from ${table} where id = $1 for update`, [id]);
    if (!exists.rowCount) {
      await client.query('rollback');
      return void res.status(404).json({ error: 'Not found.' });
    }
    const prev = await client.query<{ value: number }>(
      'select value from votes where user_id = $1 and target_type = $2 and target_id = $3',
      [req.user!.id, type, id],
    );
    const before = prev.rows[0]?.value ?? 0;
    if (value === 0) {
      await client.query('delete from votes where user_id = $1 and target_type = $2 and target_id = $3', [req.user!.id, type, id]);
    } else {
      await client.query(
        `insert into votes (user_id, target_type, target_id, value) values ($1, $2, $3, $4)
         on conflict (user_id, target_type, target_id) do update set value = excluded.value`,
        [req.user!.id, type, id, value],
      );
    }
    const { rows } = await client.query<{ score: number }>(`update ${table} set score = score + $2 where id = $1 returning score`, [
      id,
      value - before,
    ]);
    await client.query('commit');
    res.json({ score: rows[0].score, myVote: value });
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}));
