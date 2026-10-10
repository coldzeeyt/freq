import type { Account, Creator, NewAccountInput, NewVideoInput, Preferences, StationId, Video, WatchEvent } from '@/types/models';
import type { TasteProfile } from './ranking/profile';

/**
 * The seam between the app and its data. The app only talks to these
 * interfaces, so swapping the mock for a real backend (e.g. Supabase) means
 * writing new implementations and changing `services/index.ts`.
 */
export interface VideoService {
  /** A ranked feed for one station. */
  getFeed(query: { stationId: StationId; humanOnly: boolean }): Promise<Video[]>;
  createVideo(input: NewVideoInput, author: Creator): Promise<Video>;
  /** Fires whenever the catalogue changes (e.g. after a post). */
  subscribe(listener: () => void): () => void;
}

export interface LikeService {
  getLikedIds(): Promise<string[]>;
  setLiked(videoId: string, liked: boolean): Promise<void>;
}

/** Sign-up / sign-in. Swap for Supabase Auth later. */
export interface AuthService {
  currentAccount(): Promise<Account | null>;
  createAccount(input: NewAccountInput): Promise<Account>;
  signIn(email: string, password: string): Promise<Account>;
  signOut(): Promise<void>;
}

/** Collects interactions and exposes the taste profile the ranking uses. */
export interface SignalService {
  record(event: WatchEvent, video: Video): Promise<void>;
  getProfile(): Promise<TasteProfile>;
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
  auth: AuthService;
  videos: VideoService;
  likes: LikeService;
  signals: SignalService;
  preferences: PreferencesService;
  media: MediaStore;
}
