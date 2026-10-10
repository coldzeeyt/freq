import type { Video, VideoOrigin } from '@/types/models';
import { CREATORS } from './mockCreators';

// Free stock clips from Mixkit (https://mixkit.co/license/#videoFree).
const clip = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
const thumb = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-thumb-360-0.jpg`;

type Row = [station: string, clipId: number, creator: keyof typeof CREATORS, origin: VideoOrigin, caption: string, tags: string];

// Every station mixes camera recordings, verified uploads and unverified uploads
// (clipfactory / trendloop are the reposted-content accounts).
const ROWS: Row[] = [
  ['comedy', 49058, 'gus', 'camera', 'he has never once paid rent', 'comedy cats funny'],
  ['comedy', 4103, 'nina', 'upload', 'asked for a hat, got a cat', 'funny cat relatable'],
  ['comedy', 4872, 'gus', 'camera', 'when the meeting could have been an email', 'comedy work relatable skit'],
  ['comedy', 8579, 'viral', 'upload', 'Top 10 funniest baby moments (#7 is crazy)', 'funny baby viral'],
  ['comedy', 44877, 'mara', 'upload', 'office party nobody asked for', 'comedy dance skit'],

  ['gaming', 43532, 'devon', 'camera', 'ranked, day 4. send snacks', 'gaming ranked pc'],
  ['gaming', 43535, 'devon', 'upload', 'she carried the whole lobby', 'gaming esports squad'],
  ['gaming', 40464, 'lena', 'upload', 'first time in vr. fell over twice', 'vr gaming firsttime'],
  ['gaming', 45735, 'ai', 'upload', 'GAMER RAGE COMPILATION 2026', 'gaming rage compilation'],
  ['gaming', 23501, 'kira', 'camera', 'controller > keyboard. come at me', 'gaming controller console'],

  ['music', 46893, 'ayo', 'camera', 'living room set got out of hand', 'music party dj'],
  ['music', 33936, 'ayo', 'upload', 'late keys, no metronome', 'piano music'],
  ['music', 830, 'ai', 'upload', 'lofi beats to study to [1 hour]', 'lofi beats music'],
  ['music', 42824, 'mara', 'camera', 'new riff, no name yet', 'guitar music riff'],
  ['music', 40369, 'devon', 'upload', 'rehearsal before saturday', 'music band rehearsal'],

  ['sports', 42541, 'jules', 'camera', '200 touches without dropping it', 'soccer football skills'],
  ['sports', 2915, 'devon', 'upload', 'bicycle kick attempt #38', 'soccer football'],
  ['sports', 43483, 'viral', 'upload', 'INSANE 1v1 skills', 'soccer viral skills'],
  ['sports', 40969, 'jules', 'upload', 'sparring footage from tuesday', 'boxing sport training'],
  ['sports', 43499, 'omar', 'camera', 'sunday league goal of the season?', 'soccer goal'],

  ['food', 12171, 'theo', 'camera', 'nonna would approve of this much parmesan', 'pasta cooking food'],
  ['food', 10428, 'theo', 'upload', 'fresh squeezed, every morning', 'breakfast juice food'],
  ['food', 40534, 'lena', 'camera', 'knife skills: still learning', 'cooking kitchen'],
  ['food', 4678, 'ai', 'upload', '5 grilling hacks chefs hide from you', 'grill food hacks'],
  ['food', 49231, 'mara', 'upload', 'stir fry in four minutes flat', 'recipe cooking vegan'],

  ['tech', 41183, 'kira', 'camera', 'desk setup tour, finally clean', 'setup tech laptop'],
  ['tech', 43270, 'kira', 'upload', 'the one shortcut I use every day', 'phone tech tips'],
  ['tech', 46635, 'ai', 'upload', 'Will AI replace programmers? (explained)', 'ai coding tech'],
  ['tech', 99786, 'ravi', 'upload', 'renders for a phone that folds twice', 'gadget tech design'],
  ['tech', 50748, 'lena', 'upload', 'terminal appreciation post', 'coding programming'],

  ['art', 5202, 'mara', 'camera', 'one brush, one breath, one line', 'art painting brush'],
  ['art', 43446, 'zoe', 'upload', 'detail pass on the commission', 'painting artist'],
  ['art', 43445, 'mara', 'upload', 'mixing the exact dusk orange', 'painting art'],
  ['art', 785, 'ai', 'upload', 'Satisfying digital art timelapse', 'art drawing satisfying'],
  ['art', 45710, 'gus', 'camera', 'explaining my art to my parents', 'art drawing funny'],

  ['fitness', 52079, 'jules', 'camera', 'battle ropes finisher. 30 on, 30 off', 'workout gym hiit'],
  ['fitness', 23056, 'devon', 'upload', 'jump rope, month two', 'fitness cardio'],
  ['fitness', 40246, 'jules', 'upload', 'box jumps: start lower than you think', 'workout fitness'],
  ['fitness', 23450, 'viral', 'upload', 'six pack in 7 days (real)', 'gym fitness viral'],
  ['fitness', 608, 'omar', 'camera', 'city run at dusk, 8k done', 'running run'],

  ['pets', 1548, 'nina', 'camera', 'zoomies are over. panting has begun', 'dog pets'],
  ['pets', 42736, 'nina', 'upload', 'sunday lawn cuddles', 'dog pets'],
  ['pets', 1545, 'lena', 'camera', 'those eyes', 'cat pets'],
  ['pets', 45868, 'ai', 'upload', 'Cutest corgi moments compilation', 'corgi dog compilation'],
  ['pets', 1494, 'omar', 'upload', 'river fetch champion', 'dog pets'],

  ['fashion', 44556, 'zoe', 'camera', 'vintage fit, vintage ride', 'vintage outfit fashion'],
  ['fashion', 44542, 'zoe', 'upload', 'leather and chrome', 'fashion style'],
  ['fashion', 51275, 'mara', 'upload', 'all white, all motion', 'fashion outfit'],
  ['fashion', 52278, 'viral', 'upload', 'outfits you NEED this fall', 'fashion ootd trend'],
  ['fashion', 44551, 'lena', 'camera', 'mirror check before the shoot', 'style model'],

  ['science', 10418, 'ravi', 'upload', 'simulating a supernova shockwave', 'physics science simulation'],
  ['science', 4773, 'ravi', 'camera', 'pond water at 400x', 'microscope biology science'],
  ['science', 4719, 'lena', 'upload', 'titration day', 'chemistry lab'],
  ['science', 4369, 'ai', 'upload', 'Mind-blowing science facts #12', 'science facts'],
  ['science', 47048, 'kira', 'upload', 'what is actually on a circuit board', 'science electronics'],

  ['travel', 51792, 'omar', 'camera', 'nothing but road for 200 miles', 'roadtrip travel desert'],
  ['travel', 1191, 'omar', 'upload', 'sunset check-in from the coast', 'travel beach'],
  ['travel', 51500, 'lena', 'upload', 'over the bay this morning', 'beach travel drone'],
  ['travel', 41576, 'ai', 'upload', 'Most beautiful roads in the world', 'travel roads'],
  ['travel', 4646, 'zoe', 'camera', 'venice at night', 'travel city venice'],

  ['dance', 1038, 'jules', 'camera', 'one take, lights off', 'dance dancer'],
  ['dance', 33899, 'priya', 'upload', 'smoke machine finally arrived', 'dance dancing'],
  ['dance', 51295, 'devon', 'upload', 'crew choreo, street edition', 'choreography dance'],
  ['dance', 452, 'viral', 'upload', 'breakdance skills that broke the internet', 'breakdance viral'],
  ['dance', 51757, 'mara', 'upload', 'silhouette study', 'dance art'],

  ['nature', 1186, 'omar', 'camera', 'first ones out this spring', 'flowers nature spring'],
  ['nature', 40657, 'lena', 'upload', 'this meadow at 2pm', 'nature meadow'],
  ['nature', 2213, 'omar', 'upload', 'found it on the way down', 'waterfall hiking forest'],
  ['nature', 4075, 'ai', 'upload', '1 hour relaxing nature sounds', 'nature relaxing'],
  ['nature', 50847, 'ines', 'camera', 'morning walk, phone on silent', 'forest nature'],

  ['cars', 34562, 'hal', 'camera', 'the avenue at 1am', 'cars night driving'],
  ['cars', 35540, 'hal', 'upload', 'sunset pull on the coast road', 'supercar driving'],
  ['cars', 64, 'devon', 'upload', 'first time hitting 100', 'car driving'],
  ['cars', 52427, 'viral', 'upload', 'Dream cars you will never afford', 'supercar cars'],
  ['cars', 74, 'hal', 'camera', 'finally finished the paint', 'car garage'],

  ['beauty', 40556, 'priya', 'camera', 'bridal trial, take two', 'makeup beauty bridal'],
  ['beauty', 34424, 'priya', 'upload', 'gold leaf look, start to finish', 'makeup glam'],
  ['beauty', 39875, 'zoe', 'upload', 'silver, for the winter shoot', 'makeup beauty'],
  ['beauty', 34427, 'viral', 'upload', 'Celebrity makeup secrets revealed', 'beauty makeup'],
  ['beauty', 39874, 'lena', 'camera', 'cold light, warm skin', 'beauty skincare'],

  ['skate', 21363, 'sam', 'camera', 'park session after work', 'skate skateboard'],
  ['skate', 34389, 'sam', 'upload', 'finally landed it on the quarter', 'skateboarding ramp'],
  ['skate', 48684, 'omar', 'upload', 'empty road, no cars, no rules', 'longboard skate'],
  ['skate', 1366, 'viral', 'upload', 'Craziest vert ramp tricks', 'skate ramp viral'],
  ['skate', 36498, 'sam', 'camera', 'under the bridge, slide practice', 'skater skate'],

  ['family', 39767, 'ines', 'camera', 'sunday walk with everyone', 'family kids'],
  ['family', 42196, 'nina', 'upload', 'three hours of lego, zero help wanted', 'lego kids'],
  ['family', 42167, 'mara', 'camera', 'she is the architect, I am the intern', 'lego family'],
  ['family', 33784, 'viral', 'upload', 'Parenting hacks that actually work', 'parenting family'],
  ['family', 26716, 'omar', 'upload', 'last night of the trip', 'family beach'],

  ['books', 4950, 'ines', 'camera', 'pajamas, tea, 200 pages to go', 'books reading'],
  ['books', 13809, 'ines', 'upload', 'the chapter that wrecked me', 'booktok novel'],
  ['books', 1724, 'kira', 'upload', 'currently reading', 'reading books'],
  ['books', 50726, 'ai', 'upload', '10 books every genius has read', 'books library'],
  ['books', 3819, 'lena', 'camera', 'secondhand find, someone left notes in it', 'book reading'],

  ['wellness', 5057, 'jules', 'camera', 'headstand progress, week 6', 'yoga wellness'],
  ['wellness', 43798, 'ines', 'upload', 'five minutes, no phone', 'meditation calm'],
  ['wellness', 32634, 'priya', 'camera', 'singing bowl before bed', 'meditation sleep'],
  ['wellness', 4420, 'viral', 'upload', 'Sunset yoga for instant calm', 'yoga wellness'],
  ['wellness', 43737, 'jules', 'upload', 'class tonight, everyone came', 'yoga stretch'],

  ['nightlife', 8709, 'theo', 'camera', 'friday shift, first pour', 'bartender bar'],
  ['nightlife', 4344, 'devon', 'upload', 'club was packed', 'nightclub party'],
  ['nightlife', 4188, 'viral', 'upload', 'BEST festival drops 2026', 'festival rave'],
  ['nightlife', 4127, 'ayo', 'camera', 'warmup set, vinyl only', 'nightclub party dj'],
  ['nightlife', 48636, 'zoe', 'upload', 'to the people who stayed until close', 'party nightout'],

  ['money', 18296, 'hal', 'upload', 'counted tips for the month', 'cash money'],
  ['money', 45703, 'viral', 'upload', 'How I made 10k in 30 days', 'money business'],
  ['money', 23524, 'kira', 'camera', 'envelope budgeting, month one', 'budget saving money'],
  ['money', 47012, 'ai', 'upload', 'Stocks to watch this week', 'stocks investing'],
  ['money', 24354, 'ines', 'camera', 'paid off the card today', 'money finance'],

  ['space', 39770, 'omar', 'camera', 'no light pollution out here', 'stars astronomy'],
  ['space', 29351, 'ravi', 'upload', 'earth rotation, real speed', 'planet space'],
  ['space', 14185, 'ravi', 'upload', 'stacked 4 hours for this nebula', 'nebula telescope'],
  ['space', 45020, 'ai', 'upload', 'What happens inside a black hole', 'space universe'],
  ['space', 46119, 'lena', 'camera', 'desert sky, 3am', 'stars space'],

  ['weather', 21584, 'lena', 'camera', 'clouds doing their thing', 'clouds wind'],
  ['weather', 2846, 'ines', 'upload', 'rainy day reading weather', 'rain weather'],
  ['weather', 4331, 'hal', 'camera', 'drive home in the downpour', 'rain storm'],
  ['weather', 47948, 'viral', 'upload', 'Craziest lightning caught on camera', 'lightning storm'],
  ['weather', 6890, 'omar', 'upload', 'rainforest, mid storm', 'rain forest weather'],
];

// Deterministic pseudo-random numbers so counts stay stable between reloads.
function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const MOCK_VIDEOS: Video[] = ROWS.map(([stationId, clipId, creatorId, origin, caption, tags], i) => {
  const views = Math.floor(2000 + seeded(i + 1) ** 2 * 900_000);
  const likeRate = 0.02 + seeded(i + 301) * 0.12;
  return {
    id: `mock-${clipId}`,
    uri: clip(clipId),
    thumbnail: thumb(clipId),
    stationId,
    tags: tags.split(' '),
    caption,
    creator: CREATORS[creatorId],
    origin,
    views,
    likes: Math.floor(views * likeRate),
    comments: Math.floor(views * likeRate * (0.02 + seeded(i + 101) * 0.08)),
    shares: Math.floor(views * likeRate * (0.01 + seeded(i + 201) * 0.06)),
    // Spread over the last ~3 weeks.
    createdAt: new Date(Date.UTC(2026, 9, 10) - Math.floor(seeded(i + 401) * 21 * 24) * 3_600_000).toISOString(),
  };
});
