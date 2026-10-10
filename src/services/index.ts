import { createApiAuth, createApiLikes, createApiMediaStore, createApiSignals, createApiTalk, createApiVideos } from './api/services';
import { createLocalAuth } from './mock/localAuth';
import { createLocalMediaStore } from './mock/localMediaStore';
import { createLocalPreferences } from './mock/localPreferences';
import { createLocalSignals } from './mock/localSignals';
import { createLocalTalk } from './mock/localTalk';
import { createMockLikeService } from './mock/mockLikeService';
import { createMockVideoService } from './mock/mockVideoService';
import type { Services } from './types';

/** Set EXPO_PUBLIC_BACKEND=mock to run fully offline with on-device data. */
const useMock = process.env.EXPO_PUBLIC_BACKEND === 'mock';

function mockServices(): Services {
  const signals = createLocalSignals();
  const auth = createLocalAuth();
  return {
    auth,
    videos: createMockVideoService(signals),
    likes: createMockLikeService(),
    signals,
    talk: createLocalTalk(async () => {
      const a = await auth.currentAccount();
      return { id: a?.id ?? 'me', name: a?.name ?? 'You', handle: a?.handle ?? 'you', verified: false, avatarColor: '#EDE6D6' };
    }),
    preferences: createLocalPreferences(),
    media: createLocalMediaStore(),
  };
}

function apiServices(): Services {
  return {
    auth: createApiAuth(),
    videos: createApiVideos(),
    likes: createApiLikes(),
    signals: createApiSignals(),
    talk: createApiTalk(),
    // Station and Human only stay on the device.
    preferences: createLocalPreferences(),
    media: createApiMediaStore(),
  };
}

export const services: Services = useMock ? mockServices() : apiServices();
export const backend = useMock ? 'device' : 'server';

export type * from './types';
