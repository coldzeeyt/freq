import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { DEFAULT_PINNED, STATIONS } from '@/data/stations';
import { services } from '@/services';
import type { Preferences, StationId, Video } from '@/types/models';

export const MAX_PINNED = 8;

const DEFAULT_PREFS: Preferences = {
  stationId: 'all',
  humanOnly: false,
  pinned: DEFAULT_PINNED,
  // Browsers block autoplay with sound until the user interacts, so start muted on web.
  muted: Platform.OS === 'web',
};

interface FreqContextValue extends Preferences {
  hydrated: boolean;
  setStation: (id: StationId) => void;
  setHumanOnly: (on: boolean) => void;
  setMuted: (muted: boolean) => void;
  /** Returns false when the bar is already full. */
  togglePin: (id: StationId) => boolean;
  likedIds: ReadonlySet<string>;
  toggleLike: (video: Video) => boolean;
}

const FreqContext = createContext<FreqContextValue | null>(null);
const known = new Set(STATIONS.map((s) => s.id));

export function FreqProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([services.preferences.load(), services.likes.getLikedIds()]).then(([saved, liked]) => {
      setPrefs((p) => ({
        ...p,
        ...saved,
        stationId: saved.stationId && known.has(saved.stationId) ? saved.stationId : p.stationId,
        pinned: (saved.pinned ?? p.pinned).filter((id) => known.has(id)),
        muted: Platform.OS === 'web' ? true : (saved.muted ?? p.muted),
      }));
      setLikedIds(new Set(liked));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) services.preferences.save(prefs);
  }, [prefs, hydrated]);

  const update = useCallback((patch: Partial<Preferences>) => setPrefs((p) => ({ ...p, ...patch })), []);

  const togglePin = useCallback(
    (id: StationId) => {
      const has = prefs.pinned.includes(id);
      if (!has && prefs.pinned.length >= MAX_PINNED) return false;
      update({ pinned: has ? prefs.pinned.filter((p) => p !== id) : [...prefs.pinned, id] });
      return true;
    },
    [prefs.pinned, update],
  );

  const toggleLike = useCallback(
    (video: Video) => {
      const next = !likedIds.has(video.id);
      setLikedIds((prev) => {
        const s = new Set(prev);
        if (next) s.add(video.id);
        else s.delete(video.id);
        return s;
      });
      services.likes.setLiked(video.id, next);
      services.signals.record({ type: 'like', videoId: video.id, liked: next }, video);
      return next;
    },
    [likedIds],
  );

  const value = useMemo<FreqContextValue>(
    () => ({
      ...prefs,
      hydrated,
      setStation: (stationId) => update({ stationId }),
      setHumanOnly: (humanOnly) => update({ humanOnly }),
      setMuted: (muted) => update({ muted }),
      togglePin,
      likedIds,
      toggleLike,
    }),
    [prefs, hydrated, update, togglePin, likedIds, toggleLike],
  );

  return <FreqContext.Provider value={value}>{children}</FreqContext.Provider>;
}

export function useFreq() {
  const ctx = useContext(FreqContext);
  if (!ctx) throw new Error('useFreq must be used inside <FreqProvider>');
  return ctx;
}
