import type { NewVideoInput, Preferences, StationId, Video } from '@/types/models';

/**
 * The seam between the app and its data. The app only talks to these
 * interfaces, so swapping the mock for a real backend (e.g. Supabase) means
 * writing new implementations and changing `services/index.ts`.
 */
export interface VideoService {
  listVideos(query: { stationId: StationId; humanOnly: boolean }): Promise<Video[]>;
  createVideo(input: NewVideoInput): Promise<Video>;
  /** Fires whenever the catalogue changes (e.g. after a post). */
  subscribe(listener: () => void): () => void;
}

export interface LikeService {
  getLikedIds(): Promise<string[]>;
  setLiked(videoId: string, liked: boolean): Promise<void>;
}

export interface PreferencesService {
  load(): Promise<Partial<Preferences>>;
  save(prefs: Preferences): Promise<void>;
}

/** Moves a just-recorded/picked file somewhere durable and returns its URI. */
export interface MediaStore {
  persist(localUri: string): Promise<string>;
}

export interface Services {
  videos: VideoService;
  likes: LikeService;
  preferences: PreferencesService;
  media: MediaStore;
}
