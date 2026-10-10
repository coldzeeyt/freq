export type StationId = string;

export type StationGroup = 'Entertainment' | 'Lifestyle' | 'Knowledge' | 'Outside' | 'Culture';

export interface Station {
  id: StationId;
  name: string;
  /** FM-style frequency shown on the tuner, e.g. 104.3 */
  frequency: number;
  group: StationGroup | null;
  /** Keywords that route a tagged video onto this station. */
  keywords: string[];
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  /** Verified creators' uploads count as human-made. */
  verified: boolean;
  avatarColor: string;
  avatarUrl?: string;
}

/** How a video got into Freq. Camera = recorded with the in-app camera. */
export type VideoOrigin = 'camera' | 'upload';

export interface Video {
  id: string;
  uri: string;
  thumbnail?: string;
  /** Primary station, picked from the tags at post time. */
  stationId: StationId;
  tags: string[];
  caption: string;
  creator: Creator;
  origin: VideoOrigin;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

export interface NewVideoInput {
  localUri: string;
  stationId: StationId;
  tags: string[];
  caption: string;
  origin: VideoOrigin;
}

export interface Preferences {
  stationId: StationId;
  humanOnly: boolean;
  /** Stations shown in the bottom bar, in order. */
  pinned: StationId[];
  muted: boolean;
}

/** What the ranking learns from. */
export type WatchEvent =
  | { type: 'watch'; videoId: string; watchedMs: number; durationMs: number }
  | { type: 'like'; videoId: string; liked: boolean }
  | { type: 'share'; videoId: string };
