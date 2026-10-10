import { isHumanMade } from '@/lib/human';
import type { StationId, Video } from '@/types/models';
import type { TasteProfile } from './profile';

export interface RankOptions {
  stationId: StationId;
  /** Changes once per app session, so order is stable while browsing. */
  seed: number;
  now?: number;
  /** The viewer's own id: their fresh posts are pinned near the top. */
  viewerId?: string;
}

export interface ScoredVideo {
  video: Video;
  score: number;
  parts: { quality: number; freshness: number; affinity: number; explore: number; original: number; seenFactor: number };
}

const WEIGHTS = { quality: 0.3, freshness: 0.13, affinity: 0.38, explore: 0.12, original: 0.07 };
/** Bayesian prior: a video needs this many views before its own rate dominates. */
const PRIOR_VIEWS = 4000;

function hash01(seed: number, s: string) {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

const engagement = (v: Video) => v.likes + 3 * v.comments + 5 * v.shares;

export function scoreVideos(videos: Video[], profile: TasteProfile, opts: RankOptions): ScoredVideo[] {
  const now = opts.now ?? Date.now();
  const totalViews = videos.reduce((n, v) => n + v.views, 0) || 1;
  const globalRate = videos.reduce((n, v) => n + engagement(v), 0) / totalViews;

  const rates = videos.map((v) => (engagement(v) + PRIOR_VIEWS * globalRate) / (v.views + PRIOR_VIEWS));
  const maxRate = Math.max(...rates, 1e-9);

  return videos.map((video, i) => {
    // Engagement rate (smoothed) plus a little raw reach.
    const quality = 0.8 * (rates[i] / maxRate) + 0.2 * Math.min(1, Math.log10(video.views + 1) / 6);

    const ageHours = Math.max(0, (now - Date.parse(video.createdAt)) / 3_600_000);
    const freshness = Math.pow(0.5, ageHours / 72);

    const tagAff = video.tags.length
      ? video.tags.reduce((n, t) => n + (profile.tags[t] ?? 0), 0) / Math.sqrt(video.tags.length)
      : 0;
    const creatorAff = profile.creators[video.creator.id] ?? 0;
    const stationAff = opts.stationId === 'all' ? (profile.stations[video.stationId] ?? 0) : 0;
    const rawAff = tagAff + 0.6 * creatorAff + 0.5 * stationAff;
    const affinity = (Math.tanh(rawAff / 3) + 1) / 2; // 0.5 = no opinion yet

    const explore = hash01(opts.seed, video.id);
    // Freq leans toward originals: camera recordings and verified creators.
    const original = isHumanMade(video) ? 1 : 0;

    const seen = profile.seen[video.id];
    let seenFactor = 1;
    if (seen) {
      if (seen.skipped) seenFactor = 0.12;
      else if (seen.completion >= 0.9) seenFactor = 0.3;
      else seenFactor = 0.55;
    }

    let score =
      (WEIGHTS.quality * quality +
        WEIGHTS.freshness * freshness +
        WEIGHTS.affinity * affinity +
        WEIGHTS.explore * explore +
        WEIGHTS.original * original) *
      seenFactor;

    // Your own post from the last few hours shows up first so you can see it air.
    if (opts.viewerId && video.creator.id === opts.viewerId && ageHours < 6 && !seen) score += 1;

    return { video, score, parts: { quality, freshness, affinity, explore, original, seenFactor } };
  });
}

/**
 * Greedy re-rank for variety: the next slot goes to the best video after
 * penalties for repeating a recent creator (and, on All, a recent station).
 */
export function diversify(scored: ScoredVideo[], stationId: StationId): Video[] {
  const pool = [...scored];
  const out: Video[] = [];
  while (pool.length) {
    const recent = out.slice(-3);
    let bestIdx = 0;
    let best = -Infinity;
    pool.forEach((s, i) => {
      let adj = s.score;
      if (recent.some((r) => r.creator.id === s.video.creator.id)) adj -= 0.18;
      if (stationId === 'all') {
        if (out.at(-1)?.stationId === s.video.stationId) adj -= 0.15;
        else if (recent.some((r) => r.stationId === s.video.stationId)) adj -= 0.06;
      }
      if (adj > best) {
        best = adj;
        bestIdx = i;
      }
    });
    out.push(pool.splice(bestIdx, 1)[0].video);
  }
  return out;
}

export function rankFeed(videos: Video[], profile: TasteProfile, opts: RankOptions): Video[] {
  return diversify(
    scoreVideos(videos, profile, opts).sort((a, b) => b.score - a.score),
    opts.stationId,
  );
}

