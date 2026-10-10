import { readJSON, writeJSON } from '../storage';
import type { LikeService } from '../types';

const KEY = 'liked';

export function createMockLikeService(): LikeService {
  let liked: Set<string> | null = null;
  const load = async () => (liked ??= new Set(await readJSON<string[]>(KEY, [])));

  return {
    async getLikedIds() {
      return [...(await load())];
    },
    async setLiked(videoId, value) {
      const set = await load();
      if (value) set.add(videoId);
      else set.delete(videoId);
      await writeJSON(KEY, [...set]);
    },
  };
}
