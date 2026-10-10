import { MOCK_VIDEOS } from '@/data/mockVideos';
import { ME } from '@/data/mockCreators';
import { isHumanMade } from '@/lib/human';
import type { Video } from '@/types/models';
import { readJSON, writeJSON } from '../storage';
import type { VideoService } from '../types';

const POSTS_KEY = 'my-posts';

export function createMockVideoService(): VideoService {
  const listeners = new Set<() => void>();
  let myPosts: Video[] | null = null;

  async function loadMyPosts(): Promise<Video[]> {
    // blob: URLs (web recordings) die with the page, so drop them from earlier sessions.
    myPosts ??= (await readJSON<Video[]>(POSTS_KEY, [])).filter((v) => !v.uri.startsWith('blob:'));
    return myPosts;
  }

  return {
    async listVideos({ stationId, humanOnly }) {
      const all = [...(await loadMyPosts()), ...MOCK_VIDEOS];
      return all.filter(
        (v) => (stationId === 'all' || v.stationId === stationId) && (!humanOnly || isHumanMade(v)),
      );
    },

    async createVideo(input) {
      const posts = await loadMyPosts();
      const video: Video = {
        id: `local-${Date.now()}`,
        uri: input.localUri,
        stationId: input.stationId,
        caption: input.caption.trim(),
        creator: ME,
        origin: input.origin,
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
