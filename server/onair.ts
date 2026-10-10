import { Router, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { phaseOf, todaysMoment } from '@/lib/onAir';
import type { Creator, Moment, OnAirToday } from '@/types/models';
import { requireUser } from './auth';
import { pool } from './db';

interface MomentRow {
  id: string;
  author: Creator;
  day: string;
  back_uri: string;
  front_uri: string;
  caption: string;
  late: boolean;
  created_at: Date;
}

export function createOnAir(mediaDir: string, origin: (req: Request) => string, removeMedia: (uri: string) => void) {
  const router = Router();
  const abs = (req: Request, uri: string) => (uri.startsWith('/') ? origin(req) + uri : uri);
  const toMoment = (req: Request, r: MomentRow): Moment => ({
    id: r.id,
    author: r.author,
    day: r.day,
    backUri: abs(req, r.back_uri),
    frontUri: abs(req, r.front_uri),
    caption: r.caption,
    late: r.late,
    createdAt: r.created_at.toISOString(),
  });

  const tzOf = (req: Request) => {
    const tz = Number(req.query.tz ?? req.body?.tz);
    return Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? Math.round(tz) : 0;
  };
  // Local testing only: FREQ_ONAIR_LIVE=1 makes every day's window open right now.
  const nowMoment = (tz: number) => {
    const now = Date.now();
    const m = todaysMoment(now, tz);
    return process.env.FREQ_ONAIR_LIVE === '1' && process.env.NODE_ENV !== 'production'
      ? { ...m, startsAt: now - 30_000, endsAt: now + 90_000 }
      : m;
  };

  const route =
    (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: (e?: unknown) => void) =>
      fn(req, res).catch(next);

  router.get('/onair', requireUser, route(async (req, res) => {
    const m = nowMoment(tzOf(req));
    const { rows } = await pool.query<MomentRow>('select * from moments where day = $1 order by created_at asc', [m.day]);
    const mineRow = rows.find((r) => r.author.id === req.user!.id);
    const others = rows.filter((r) => r !== mineRow);
    const today: OnAirToday = {
      day: m.day,
      startsAt: new Date(m.startsAt).toISOString(),
      endsAt: new Date(m.endsAt).toISOString(),
      mine: mineRow ? toMoment(req, mineRow) : null,
      // BeReal's rule: you see everyone else's only once you've shared yours.
      moments: mineRow ? others.reverse().map((r) => toMoment(req, r)) : [],
      othersCount: others.length,
    };
    res.json(today);
  }));

  const upload = multer({
    storage: multer.diskStorage({
      destination: mediaDir,
      filename: (_req, file, cb) => cb(null, `onair-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.fieldname}.jpg`),
    }),
    limits: { fileSize: 15 * 1024 * 1024, files: 2 },
    fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype) || file.mimetype === 'application/octet-stream'),
  });

  router.post(
    '/onair',
    requireUser,
    upload.fields([
      { name: 'back', maxCount: 1 },
      { name: 'front', maxCount: 1 },
    ]),
    route(async (req, res) => {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const back = files?.back?.[0];
      const front = files?.front?.[0];
      const cleanup = () => [back, front].forEach((f) => f && fs.rmSync(f.path, { force: true }));
      if (!back || !front) {
        cleanup();
        return void res.status(400).json({ error: 'Both photos are needed.' });
      }
      const m = nowMoment(tzOf(req));
      const phase = phaseOf(Date.now(), m);
      if (phase === 'waiting') {
        cleanup();
        return void res.status(400).json({ error: 'Freq isn’t on air yet today. We’ll let you know.' });
      }
      const caption = String(req.body?.caption ?? '').trim().slice(0, 120);
      const u = req.user!;
      const author: Creator = { id: u.id, name: u.name, handle: u.handle, verified: u.verified, avatarColor: u.avatar_color };
      const { rows } = await pool.query<MomentRow>(
        `insert into moments (user_id, author, day, back_uri, front_uri, caption, late)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (user_id, day) do nothing returning *`,
        [u.id, author, m.day, `/media/${path.basename(back.path)}`, `/media/${path.basename(front.path)}`, caption, phase === 'late'],
      );
      if (!rows[0]) {
        cleanup();
        return void res.status(409).json({ error: 'You’ve already been on air today.' });
      }
      res.status(201).json({ moment: toMoment(req, rows[0]) });
    }),
  );

  router.post('/onair/delete', requireUser, route(async (req, res) => {
    const { rows } = await pool.query<{ back_uri: string; front_uri: string }>(
      'delete from moments where user_id = $1 and day = $2 returning back_uri, front_uri',
      [req.user!.id, nowMoment(tzOf(req)).day],
    );
    rows.forEach((r) => {
      removeMedia(r.back_uri);
      removeMedia(r.front_uri);
    });
    res.json({ ok: true });
  }));

  return router;
}
