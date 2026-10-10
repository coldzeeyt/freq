import { createLocalMediaStore } from './mock/localMediaStore';
import { createLocalPreferences } from './mock/localPreferences';
import { createMockLikeService } from './mock/mockLikeService';
import { createMockVideoService } from './mock/mockVideoService';
import type { Services } from './types';

// Swap these factories for backend-backed ones (e.g. services/supabase/*) later.
export const services: Services = {
  videos: createMockVideoService(),
  likes: createMockLikeService(),
  preferences: createLocalPreferences(),
  media: createLocalMediaStore(),
};

export type * from './types';
