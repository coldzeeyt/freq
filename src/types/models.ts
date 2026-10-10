export type StationId =
  | 'all'
  | 'comedy'
  | 'gaming'
  | 'music'
  | 'sports'
  | 'food'
  | 'tech'
  | 'art'
  | 'fitness'
  | 'pets'
  | 'fashion'
  | 'science'
  | 'travel';

export interface Station {
  id: StationId;
  name: string;
  /** FM-style frequency shown on the tuner, e.g. 104.3 */
  frequency: number;
  /** Accent color used for the station's on-air styling. */
  color: string;
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
  stationId: Exclude<StationId, 'all'>;
  caption: string;
  creator: Creator;
  origin: VideoOrigin;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

export interface NewVideoInput {
  localUri: string;
  stationId: Exclude<StationId, 'all'>;
  caption: string;
  origin: VideoOrigin;
}

export type PresetSlots = (StationId | null)[];

export interface Preferences {
  stationId: StationId;
  humanOnly: boolean;
  presets: PresetSlots;
  muted: boolean;
}
