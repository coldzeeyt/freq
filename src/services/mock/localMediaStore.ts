import { Directory, File, Paths } from 'expo-file-system';
import type { MediaStore } from '../types';

// Native: copy camera/picker output out of the cache into the documents dir so it survives.
export function createLocalMediaStore(): MediaStore {
  return {
    async persist(localUri) {
      const dir = new Directory(Paths.document, 'videos');
      if (!dir.exists) dir.create({ intermediates: true });
      const ext = localUri.split('?')[0].split('.').pop() || 'mp4';
      const target = new File(dir, `${Date.now()}.${ext}`);
      await new File(localUri).copy(target);
      return target.uri;
    },
  };
}
