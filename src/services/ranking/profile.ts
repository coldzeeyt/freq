import type { Video, WatchEvent } from '@/types/models';

export interface SeenEntry {
  count: number;
  lastAt: number;
  /** Best watch-through ratio so far (can exceed 1 on rewatches). */
  completion: number;
  skipped: boolean;
}

/** What Freq has learned about one viewer. Affinities are roughly -10..10. */
export interface TasteProfile {
  tags: Record<string, number>;
  creators: Record<string, number>;
  stations: Record<string, number>;
  seen: Record<string, SeenEntry>;
  updatedAt: number;
}

export const emptyProfile = (): TasteProfile => ({ tags: {}, creators: {}, stations: {}, seen: {}, updatedAt: Date.now() });

/** Interests fade: an affinity halves after three days without reinforcement. */
const HALF_LIFE_MS = 3 * 24 * 3_600_000;
const CLAMP = 10;

function decayMap(map: Record<string, number>, factor: number) {
  for (const k of Object.keys(map)) {
    map[k] *= factor;
    if (Math.abs(map[k]) < 0.01) delete map[k];
  }
}

function bump(map: Record<string, number>, key: string, delta: number) {
  map[key] = Math.max(-CLAMP, Math.min(CLAMP, (map[key] ?? 0) + delta));
}

/** Turns one interaction into a signed interest signal. */
export function signalFor(event: WatchEvent): number {
  switch (event.type) {
    case 'like':
      return event.liked ? 2 : -2;
    case 'share':
      return 2.5;
    case 'watch': {
      if (event.durationMs <= 0) return 0;
      const ratio = event.watchedMs / event.durationMs;
      // Swiped away almost immediately: a clear "not for me".
      if (event.watchedMs < 1500 && ratio < 0.25) return -0.8;
      // Watched it through, maybe more than once.
      if (ratio >= 0.9) return 1 + Math.min(1.5, (ratio - 1) * 0.75);
      return (ratio - 0.35) * 1.2;
    }
  }
}

export function applyEvent(profile: TasteProfile, event: WatchEvent, video: Video, now = Date.now()): TasteProfile {
  const next: TasteProfile = {
    tags: { ...profile.tags },
    creators: { ...profile.creators },
    stations: { ...profile.stations },
    seen: { ...profile.seen },
    updatedAt: now,
  };
  const factor = Math.pow(0.5, (now - profile.updatedAt) / HALF_LIFE_MS);
  if (factor < 0.999) {
    decayMap(next.tags, factor);
    decayMap(next.creators, factor);
    decayMap(next.stations, factor);
  }

  const signal = signalFor(event);
  if (signal !== 0) {
    // Spread the signal across tags so heavily tagged videos don't dominate.
    const perTag = signal / Math.sqrt(Math.max(1, video.tags.length));
    video.tags.forEach((t) => bump(next.tags, t, perTag));
    bump(next.creators, video.creator.id, signal * 0.8);
    bump(next.stations, video.stationId, signal * 0.5);
  }

  if (event.type === 'watch') {
    const prev = next.seen[video.id];
    const ratio = event.durationMs > 0 ? event.watchedMs / event.durationMs : 0;
    next.seen[video.id] = {
      count: (prev?.count ?? 0) + 1,
      lastAt: now,
      completion: Math.max(prev?.completion ?? 0, ratio),
      skipped: event.watchedMs < 1500 && ratio < 0.25,
    };
  }
  return next;
}
