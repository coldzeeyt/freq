import { phaseOf, todaysMoment } from '@/lib/onAir';
import type { Creator, Moment } from '@/types/models';
import { readJSON, writeJSON } from '../storage';
import type { OnAirService } from '../types';

const KEY = 'onair';

/** Offline On Air: only your own moments, stored on this device. */
export function createLocalOnAir(me: () => Promise<Creator>): OnAirService {
  const tz = () => new Date().getTimezoneOffset();
  return {
    async today() {
      const m = todaysMoment(Date.now(), tz());
      const mine = (await readJSON<Moment[]>(KEY, [])).find((x) => x.day === m.day) ?? null;
      return { day: m.day, startsAt: new Date(m.startsAt).toISOString(), endsAt: new Date(m.endsAt).toISOString(), mine, moments: [], othersCount: 0 };
    },
    async post(backUri, frontUri, caption) {
      const m = todaysMoment(Date.now(), tz());
      const phase = phaseOf(Date.now(), m);
      if (phase === 'waiting') throw new Error('Freq isn’t on air yet today.');
      const all = await readJSON<Moment[]>(KEY, []);
      const moment: Moment = {
        id: `m-${Date.now()}`,
        author: await me(),
        day: m.day,
        backUri,
        frontUri,
        caption: caption.trim(),
        late: phase === 'late',
        createdAt: new Date().toISOString(),
      };
      await writeJSON(KEY, [...all.filter((x) => x.day !== m.day), moment]);
      return moment;
    },
    async remove() {
      const day = todaysMoment(Date.now(), tz()).day;
      await writeJSON(KEY, (await readJSON<Moment[]>(KEY, [])).filter((x) => x.day !== day));
    },
  };
}
