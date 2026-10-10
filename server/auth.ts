import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';
import type { Account } from '@/types/models';
import { pool } from './db';

const secretValue = process.env.JWT_SECRET;
if (!secretValue && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is not set');
const secret = new TextEncoder().encode(secretValue ?? 'dev-only-secret-change-me');

export interface UserRow {
  id: string;
  name: string;
  handle: string;
  email: string;
  password_hash: string;
  verified: boolean;
  avatar_color: string;
  created_at: Date;
}

// Admins are configured on the server: ADMIN_EMAILS=a@x.com,b@y.com
const ADMINS = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);
export const isAdmin = (u?: UserRow | null) => !!u && ADMINS.has(u.email.toLowerCase());

export const toAccount = (u: UserRow): Account => ({
  id: u.id,
  name: u.name,
  handle: u.handle,
  email: u.email,
  createdAt: u.created_at.toISOString(),
  isAdmin: isAdmin(u),
});

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export const issueToken = (userId: string) =>
  new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime('30d').sign(secret);

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserRow;
  }
}

/** Attaches req.user when a valid Bearer token is present. Never rejects. */
export async function readUser(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const { payload } = await jwtVerify(header.slice(7), secret);
      const { rows } = await pool.query<UserRow>('select * from users where id = $1', [payload.sub]);
      req.user = rows[0];
    } catch {
      // Bad or expired token: treat as signed out.
    }
  }
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Please log in again.' });
    return;
  }
  next();
}
