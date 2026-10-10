import { MOCK_VIDEOS } from '@/data/mockVideos';
import { isHumanMade } from '@/lib/human';
import { normalizeTag } from '@/lib/tagRouting';
import type { StationId, Video } from '@/types/models';
import { rankFeed } from '../ranking/rank';
import { readJSON, writeJSON } from '../storage';
import type { SignalService, VideoService } from '../types';

const POSTS_KEY = 'my-posts-v2';
const SESSION_SEED = Math.floor(Math.random() * 1e9);

export function createMockVideoService(signals: SignalService): VideoService {
  const listeners = new Set<() => void>();
  let myPosts: Video[] | null = null;

  async function loadMyPosts(): Promise<Video[]> {
    // blob: URLs (web recordings) die with the page, so drop them from earlier sessions.
    myPosts ??= (await readJSON<Video[]>(POSTS_KEY, [])).filter((v) => !v.uri.startsWith('blob:'));
    return myPosts;
  }

  async function candidates(stationId: StationId, humanOnly: boolean) {
    const all = [...(await loadMyPosts()), ...MOCK_VIDEOS];
    return all.filter((v) => (stationId === 'all' || v.stationId === stationId) && (!humanOnly || isHumanMade(v)));
  }

  return {
    async getFeed({ stationId, humanOnly }) {
      const [pool, profile] = await Promise.all([candidates(stationId, humanOnly), signals.getProfile()]);
      return rankFeed(pool, profile, { stationId, seed: SESSION_SEED, viewerId: 'me' });
    },

    async createVideo(input, author) {
      const posts = await loadMyPosts();
      const video: Video = {
        id: `local-${Date.now()}`,
        uri: input.localUri,
        stationId: input.stationId,
        tags: [...new Set(input.tags.map(normalizeTag).filter(Boolean))],
        caption: input.caption.trim(),
        creator: author,
        origin: input.origin,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
      };
      myPosts = [video, ...posts];
      await writeJSON(POSTS_KEY, myPosts);
      listeners.forEach((l) => l());
      return video;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
