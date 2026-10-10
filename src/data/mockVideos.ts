import type { Video, VideoOrigin } from '@/types/models';
import { CREATORS } from './mockCreators';

// Free stock clips from Mixkit (https://mixkit.co/license/#videoFree).
const mixkit = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;

type Row = [
  stationId: Video['stationId'],
  clipId: number,
  creatorId: keyof typeof CREATORS,
  origin: VideoOrigin,
  caption: string,
];

// Each station mixes camera recordings, verified uploads and unverified uploads
// so the Human Only toggle visibly changes every feed.
const ROWS: Row[] = [
  ['comedy', 49058, 'gus', 'camera', 'he knows he looks good 😎 #catsofinstagram'],
  ['comedy', 4103, 'nina', 'upload', 'found my cat in the hat. literally.'],
  ['comedy', 4872, 'gus', 'camera', 'when the meeting could have been an email'],
  ['comedy', 8579, 'ai', 'upload', 'Top 10 funniest baby moments (you won\'t believe #7)'],
  ['comedy', 44877, 'mara', 'upload', 'the office party nobody asked for'],

  ['gaming', 43532, 'devon', 'camera', 'ranked grind day 4. send snacks'],
  ['gaming', 43535, 'devon', 'upload', 'she carried the whole squad, no cap'],
  ['gaming', 40464, 'lena', 'upload', 'first time in VR and I already fell over twice'],
  ['gaming', 45735, 'ai', 'upload', 'GAMER RAGE COMPILATION 2026'],
  ['gaming', 23501, 'kira', 'camera', 'controller > keyboard. fight me.'],

  ['music', 46893, 'ayo', 'camera', 'living room set turned into a full party'],
  ['music', 33936, 'ayo', 'upload', 'late night keys session 🎹'],
  ['music', 830, 'ai', 'upload', 'Relaxing lofi DJ beats to study to'],
  ['music', 42824, 'mara', 'camera', 'new riff, no name yet. suggestions?'],
  ['music', 40369, 'devon', 'upload', 'crew rehearsal before Saturday'],

  ['sports', 42541, 'jules', 'camera', '200 touches without dropping it'],
  ['sports', 2915, 'devon', 'upload', 'bicycle kick attempt #38. getting closer'],
  ['sports', 43483, 'ai', 'upload', 'Insane 1v1 skills you need to see'],
  ['sports', 40969, 'jules', 'upload', 'sparring footage from last night'],
  ['sports', 43499, 'omar', 'camera', 'sunday league goal of the season?'],

  ['food', 12171, 'theo', 'camera', 'nonna would approve of this much parmesan'],
  ['food', 10428, 'theo', 'upload', 'fresh squeezed every morning ☀️'],
  ['food', 40534, 'lena', 'camera', 'knife skills: still learning'],
  ['food', 4678, 'ai', 'upload', '5 grilling hacks chefs don\'t want you to know'],
  ['food', 49231, 'mara', 'upload', 'veg stir fry in 4 minutes flat'],

  ['tech', 41183, 'kira', 'camera', 'desk setup tour, finally clean'],
  ['tech', 43270, 'kira', 'upload', 'the one shortcut I use every single day'],
  ['tech', 46635, 'ai', 'upload', 'AI will replace programmers?? (explained)'],
  ['tech', 99786, 'ravi', 'upload', 'concept renders for a phone that folds twice'],
  ['tech', 50748, 'lena', 'upload', 'terminal aesthetics appreciation post'],

  ['art', 5202, 'mara', 'camera', 'one brush, one breath, one line'],
  ['art', 43446, 'zoe', 'upload', 'detail pass on the commission'],
  ['art', 43445, 'mara', 'upload', 'mixing that perfect dusk orange'],
  ['art', 785, 'ai', 'upload', 'Satisfying digital art timelapse'],
  ['art', 45710, 'gus', 'camera', 'me explaining my art to my parents'],

  ['fitness', 52079, 'jules', 'camera', 'battle ropes finisher. 30 on, 30 off'],
  ['fitness', 23056, 'devon', 'upload', 'jump rope progress, month 2'],
  ['fitness', 40246, 'jules', 'upload', 'box jumps: start lower than you think'],
  ['fitness', 23450, 'ai', 'upload', 'Get a six pack in 7 days (real)'],
  ['fitness', 608, 'omar', 'camera', 'city run at dusk, 8k done'],

  ['pets', 1548, 'nina', 'camera', 'post-walk zoomies have ended. now: panting'],
  ['pets', 42736, 'nina', 'upload', 'sunday lawn cuddles'],
  ['pets', 1545, 'lena', 'camera', 'those eyes though 💙'],
  ['pets', 45868, 'ai', 'upload', 'Cutest corgi moments compilation'],
  ['pets', 1494, 'omar', 'upload', 'river fetch champion'],

  ['fashion', 44556, 'zoe', 'camera', 'vintage fit, vintage ride'],
  ['fashion', 44542, 'zoe', 'upload', 'leather + chrome. that\'s the post'],
  ['fashion', 51275, 'mara', 'upload', 'all white, all motion'],
  ['fashion', 52278, 'ai', 'upload', 'Trending outfits you need this fall'],
  ['fashion', 44551, 'lena', 'camera', 'mirror check before the shoot'],

  ['science', 10418, 'ravi', 'upload', 'simulating a supernova shockwave'],
  ['science', 4773, 'ravi', 'camera', 'what pond water looks like at 400x'],
  ['science', 4719, 'lena', 'upload', 'titration day in the lab'],
  ['science', 4369, 'ai', 'upload', 'Mind-blowing science facts #12'],
  ['science', 18791, 'kira', 'upload', 'how wormholes (might) work'],

  ['travel', 51792, 'omar', 'camera', 'nothing but road for 200 miles'],
  ['travel', 1191, 'omar', 'upload', 'sunset check-in from the coast'],
  ['travel', 51500, 'lena', 'upload', 'drone over the bay this morning'],
  ['travel', 41576, 'ai', 'upload', 'Most beautiful roads in the world'],
  ['travel', 4646, 'zoe', 'camera', 'venice at night hits different'],
];

// Deterministic pseudo-random counts so numbers stay stable between reloads.
function seeded(n: number, min: number, max: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return Math.floor(min + (x - Math.floor(x)) * (max - min));
}

export const MOCK_VIDEOS: Video[] = ROWS.map(([stationId, clipId, creatorId, origin, caption], i) => ({
  id: `mock-${clipId}`,
  uri: mixkit(clipId),
  stationId,
  caption,
  creator: CREATORS[creatorId],
  origin,
  likes: seeded(i + 1, 120, 98000),
  comments: seeded(i + 101, 4, 2400),
  shares: seeded(i + 201, 1, 900),
  createdAt: new Date(Date.UTC(2026, 9, 1) - i * 3_600_000).toISOString(),
}));
