import { createApiAuth, createApiLikes, createApiMediaStore, createApiSignals, createApiVideos } from './api/services';
import { createLocalAuth } from './mock/localAuth';
import { createLocalMediaStore } from './mock/localMediaStore';
import { createLocalPreferences } from './mock/localPreferences';
import { createLocalSignals } from './mock/localSignals';
import { createMockLikeService } from './mock/mockLikeService';
import { createMockVideoService } from './mock/mockVideoService';
import type { Services } from './types';

/** Set EXPO_PUBLIC_BACKEND=mock to run fully offline with on-device data. */
const useMock = process.env.EXPO_PUBLIC_BACKEND === 'mock';

function mockServices(): Services {
  const signals = createLocalSignals();
  return {
    auth: createLocalAuth(),
    videos: createMockVideoService(signals),
    likes: createMockLikeService(),
    signals,
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
    // Station and Human only stay on the device.
    preferences: createLocalPreferences(),
    media: createApiMediaStore(),
  };
}

export const services: Services = useMock ? mockServices() : apiServices();
export const backend = useMock ? 'device' : 'server';

export type * from './types';
