import type { MediaStore } from '../types';

// Web: recordings and picks are blob: URLs that only live for this browser session.
// A real backend upload replaces this.
export function createLocalMediaStore(): MediaStore {
  return {
    async persist(localUri) {
      return localUri;
    },
  };
}
