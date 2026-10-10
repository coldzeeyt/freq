import type { Preferences } from '@/types/models';
import { readJSON, writeJSON } from '../storage';
import type { PreferencesService } from '../types';

const KEY = 'prefs';

// Preferences are device-local even once a backend exists.
export function createLocalPreferences(): PreferencesService {
  return {
    load: () => readJSON<Partial<Preferences>>(KEY, {}),
    save: (prefs) => writeJSON(KEY, prefs),
  };
}
