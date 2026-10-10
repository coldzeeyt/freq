import { POSTABLE_STATIONS } from '@/data/stations';
import type { Station } from '@/types/models';

/** "#Cooking!" -> "cooking" */
export function normalizeTag(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Pull #hashtags out of a caption. */
export function hashtagsIn(text: string): string[] {
  return (text.match(/#[\p{L}\p{N}_]+/gu) ?? []).map(normalizeTag).filter(Boolean);
}

function variants(tag: string): string[] {
  const out = [tag];
  if (tag.endsWith('ies')) out.push(tag.slice(0, -3) + 'y');
  if (tag.endsWith('es')) out.push(tag.slice(0, -2));
  if (tag.endsWith('s')) out.push(tag.slice(0, -1));
  if (tag.endsWith('ing')) out.push(tag.slice(0, -3));
  return out;
}

export interface StationMatch {
  station: Station;
  score: number;
  matched: string[];
}

/**
 * Scores every station against the tags. An exact keyword hit is worth 3,
 * a plural/verb variant 2, and a tag that merely contains a keyword (e.g.
 * "dogsofinstagram") 1. Earlier tags weigh a little more, since people
 * usually lead with what the video is about.
 */
export function routeTags(rawTags: string[]): StationMatch[] {
  const tags = [...new Set(rawTags.map(normalizeTag).filter(Boolean))];
  const results: StationMatch[] = [];

  for (const station of POSTABLE_STATIONS) {
    let score = 0;
    const matched: string[] = [];
    tags.forEach((tag, i) => {
      const position = 1 + 0.5 / (i + 1);
      let best = 0;
      for (const kw of station.keywords) {
        if (tag === kw) best = Math.max(best, 3);
        else if (variants(tag).includes(kw)) best = Math.max(best, 2);
        else if (kw.length >= 4 && tag.includes(kw)) best = Math.max(best, 1);
      }
      if (best) {
        score += best * position;
        matched.push(tag);
      }
    });
    if (score > 0) results.push({ station, score, matched });
  }

  return results.sort((a, b) => b.score - a.score);
}
