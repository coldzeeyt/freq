/**
 * Freq goes On Air once a day at a random local time between 10:00 and 20:59.
 * The time comes from the date itself, so the server and every phone agree on it
 * without talking, and phones can schedule tomorrow's reminder ahead of time.
 */
export const WINDOW_MS = 2 * 60_000;
const EARLIEST = 10 * 60; // 10:00
const SPAN = 11 * 60; // until 20:59

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** tzOffset is Date#getTimezoneOffset(): minutes *behind* UTC (e.g. 300 for New York in winter). */
export function localDay(now: number, tzOffset: number): string {
  return new Date(now - tzOffset * 60_000).toISOString().slice(0, 10);
}

export function momentFor(day: string, tzOffset: number) {
  const minute = EARLIEST + (hash(`freq-on-air:${day}`) % SPAN);
  const startsAt = Date.parse(`${day}T00:00:00Z`) + minute * 60_000 + tzOffset * 60_000;
  return { day, startsAt, endsAt: startsAt + WINDOW_MS };
}

export function todaysMoment(now: number, tzOffset: number) {
  return momentFor(localDay(now, tzOffset), tzOffset);
}

/** The next few On Air times from now, for scheduling reminders. */
export function upcomingMoments(now: number, tzOffset: number, days = 7) {
  const out: { day: string; startsAt: number }[] = [];
  for (let i = 0; out.length < days && i < days + 2; i++) {
    const m = momentFor(localDay(now + i * 86_400_000, tzOffset), tzOffset);
    if (m.startsAt > now) out.push(m);
  }
  return out;
}

export type OnAirPhase = 'waiting' | 'live' | 'late';

export function phaseOf(now: number, m: { startsAt: number; endsAt: number }): OnAirPhase {
  if (now < m.startsAt) return 'waiting';
  return now <= m.endsAt ? 'live' : 'late';
}
