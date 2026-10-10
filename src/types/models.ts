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
  muted: boolean;
}

export interface Account {
  id: string;
  name: string;
  handle: string;
  email: string;
  createdAt: string;
}

export interface NewAccountInput {
  name: string;
  handle: string;
  email: string;
  password: string;
}

/** What the ranking learns from. */
export type WatchEvent =
  | { type: 'watch'; videoId: string; watchedMs: number; durationMs: number }
  | { type: 'like'; videoId: string; liked: boolean }
  | { type: 'share'; videoId: string };

// --- Talk (Reddit-style boards and threaded comments) ---------------------

export type Vote = -1 | 0 | 1;
export type BoardSort = 'hot' | 'new' | 'top';
export type CommentTarget = { type: 'post' | 'video'; id: string };
export type VoteTarget = { type: 'post' | 'comment'; id: string };

export interface BoardPost {
  id: string;
  stationId: StationId;
  title: string;
  body: string;
  author: Creator;
  score: number;
  myVote: Vote;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  parentId: string | null;
  /** Empty when deleted; the comment stays so its replies keep their place. */
  body: string;
  author: Creator | null;
  deleted: boolean;
  score: number;
  myVote: Vote;
  createdAt: string;
}

// --- On Air (a daily, two-minute, both-cameras moment) -----------------------

export interface Moment {
  id: string;
  author: Creator;
  day: string;
  backUri: string;
  frontUri: string;
  caption: string;
  /** Posted after the two-minute window closed. */
  late: boolean;
  createdAt: string;
}

export interface OnAirToday {
  day: string;
  startsAt: string;
  endsAt: string;
  mine: Moment | null;
  /** Everyone else's moments today. Empty until you've posted yours. */
  moments: Moment[];
  /** How many other people have posted today (shown while the feed is locked). */
  othersCount: number;
}
