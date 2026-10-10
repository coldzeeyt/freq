import type { Station, StationId } from '@/types/models';

const s = (id: string, name: string, frequency: number, group: Station['group'], keywords: string) => ({
  id,
  name,
  frequency,
  group,
  keywords: keywords.split(' '),
});

/** Ordered around the dial by ascending frequency. */
export const STATIONS: Station[] = [
  s('all', 'All', 88.1, null, ''),
  s('music', 'Music', 88.9, 'Entertainment', 'music song guitar piano dj beat beats band concert singing singer cover remix lofi producer vinyl rap'),
  s('dance', 'Dance', 89.7, 'Entertainment', 'dance dancing dancer choreo choreography ballet breakdance hiphop moves salsa tutorial'),
  s('nightlife', 'Nightlife', 90.5, 'Entertainment', 'party club nightclub bar cocktail drinks rave festival nightout night bartender'),
  s('gaming', 'Gaming', 91.3, 'Entertainment', 'gaming game gamer games esports twitch stream streamer controller vr console pc minecraft fortnite ranked speedrun'),
  s('sports', 'Sports', 92.1, 'Outside', 'sports sport soccer football basketball tennis goal boxing match athlete baseball hockey golf'),
  s('skate', 'Skate', 92.9, 'Outside', 'skate skateboard skateboarding skater surf surfing bmx snowboard extreme kickflip ramp longboard'),
  s('fitness', 'Fitness', 93.7, 'Lifestyle', 'fitness gym workout training lift lifting run running cardio hiit muscle gains pushups'),
  s('wellness', 'Wellness', 94.5, 'Lifestyle', 'yoga meditation wellness mindfulness breathing calm selfcare mental health sleep stretch'),
  s('food', 'Food', 95.3, 'Lifestyle', 'food cooking recipe chef kitchen baking eat eating pasta dinner breakfast foodie grill vegan snack'),
  s('fashion', 'Fashion', 96.1, 'Culture', 'fashion outfit style ootd fit streetwear vintage thrift clothes model runway'),
  s('beauty', 'Beauty', 96.9, 'Culture', 'beauty makeup skincare hair nails cosmetics glam lipstick grwm'),
  s('art', 'Art', 97.7, 'Culture', 'art artist painting paint drawing draw sketch illustration design sculpture canvas brush'),
  s('books', 'Books', 98.5, 'Knowledge', 'books book reading read booktok novel library author writing poetry'),
  s('tech', 'Tech', 99.3, 'Knowledge', 'tech technology code coding programming developer software computer laptop phone gadget ai setup app'),
  s('science', 'Science', 100.1, 'Knowledge', 'science lab experiment chemistry physics biology microscope research stem facts'),
  s('space', 'Space', 100.9, 'Knowledge', 'space stars galaxy planet nasa astronomy universe nebula moon rocket telescope'),
  s('money', 'Money', 101.7, 'Knowledge', 'money finance investing stocks budget business crypto cash saving entrepreneur economy'),
  s('pets', 'Pets', 102.5, 'Lifestyle', 'pets pet dog dogs puppy cat cats kitten animal animals corgi'),
  s('family', 'Family', 103.3, 'Lifestyle', 'family kids kid parenting baby mom dad toddler children lego'),
  s('comedy', 'Comedy', 104.3, 'Entertainment', 'comedy funny joke jokes meme memes prank skit lol humor standup relatable'),
  s('cars', 'Cars', 105.1, 'Outside', 'cars car driving drive racing motorsport supercar engine roadtrip traffic'),
  s('travel', 'Travel', 105.9, 'Outside', 'travel trip vacation beach adventure explore wanderlust city tourism hotel flight'),
  s('nature', 'Nature', 106.7, 'Outside', 'nature forest flowers waterfall mountains hiking outdoors wildlife ocean trees garden'),
  s('weather', 'Weather', 107.5, 'Outside', 'weather rain storm thunder lightning clouds snow sunset sunrise wind'),
];

export const POSTABLE_STATIONS = STATIONS.filter((st) => st.id !== 'all');

export const STATION_GROUPS = ['Entertainment', 'Lifestyle', 'Culture', 'Knowledge', 'Outside'] as const;

export const DEFAULT_PINNED: StationId[] = ['all', 'comedy', 'music', 'gaming', 'sports', 'food', 'pets'];

export const FREQ_MIN = 87.5;
export const FREQ_MAX = 108.5;

export function getStation(id: StationId): Station {
  return STATIONS.find((st) => st.id === id) ?? STATIONS[0];
}

export function stationIndex(id: StationId): number {
  return Math.max(0, STATIONS.findIndex((st) => st.id === id));
}

export function formatFrequency(station: Station): string {
  return station.frequency.toFixed(1);
}
