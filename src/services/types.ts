import type {
  Account,
  BoardPost,
  BoardSort,
  Comment,
  CommentTarget,
  Creator,
  NewAccountInput,
  NewVideoInput,
  Moment,
  OnAirToday,
  Preferences,
  StationId,
  Video,
  Vote,
  VoteTarget,
  WatchEvent,
} from '@/types/models';
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
  /** Permanently deletes the account and everything it posted. */
  deleteAccount(): Promise<void>;
}

/** Reddit-style boards per station, plus threaded comments on posts and videos. */
export interface TalkService {
  listPosts(stationId: StationId, sort: BoardSort): Promise<BoardPost[]>;
  getPost(id: string): Promise<{ post: BoardPost; comments: Comment[] }>;
  createPost(stationId: StationId, title: string, body: string): Promise<BoardPost>;
  deletePost(id: string): Promise<void>;
  listComments(target: CommentTarget): Promise<Comment[]>;
  addComment(target: CommentTarget, body: string, parentId: string | null): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  /** Returns the new score. */
  vote(target: VoteTarget, value: Vote): Promise<number>;
}

/** The daily, two-minute, both-cameras moment. */
export interface OnAirService {
  today(): Promise<OnAirToday>;
  /** Local file/blob URIs for the two photos. */
  post(backUri: string, frontUri: string, caption: string): Promise<Moment>;
  /** Removes today's moment so you can take it again. */
  remove(): Promise<void>;
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
  talk: TalkService;
  onAir: OnAirService;
  preferences: PreferencesService;
  media: MediaStore;
}
