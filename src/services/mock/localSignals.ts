import { applyEvent, emptyProfile, type TasteProfile } from '../ranking/profile';
import { readJSON, writeJSON } from '../storage';
import type { SignalService } from '../types';

const KEY = 'taste';

// The taste profile lives on the device for now. With a backend, events
// would be sent to the server and ranking would happen there.
export function createLocalSignals(): SignalService {
  let profile: TasteProfile | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const load = async () => (profile ??= await readJSON<TasteProfile>(KEY, emptyProfile()));

  return {
    getProfile: load,
    async record(event, video) {
      profile = applyEvent(await load(), event, video);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => writeJSON(KEY, profile), 400);
    },
  };
}
