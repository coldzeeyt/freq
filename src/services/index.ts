import { createLocalMediaStore } from './mock/localMediaStore';
import { createLocalPreferences } from './mock/localPreferences';
import { createLocalSignals } from './mock/localSignals';
import { createMockLikeService } from './mock/mockLikeService';
import { createMockVideoService } from './mock/mockVideoService';
import type { Services } from './types';

// Swap these factories for backend-backed ones (e.g. services/supabase/*) later.
const signals = createLocalSignals();

export const services: Services = {
  videos: createMockVideoService(signals),
  signals,
  likes: createMockLikeService(),
  preferences: createLocalPreferences(),
  media: createLocalMediaStore(),
};

export type * from './types';
