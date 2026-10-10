import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { services } from '@/services';
import type { Preferences, PresetSlots, StationId } from '@/types/models';

export const PRESET_COUNT = 5;

const DEFAULT_PREFS: Preferences = {
  stationId: 'all',
  humanOnly: false,
  presets: Array<StationId | null>(PRESET_COUNT).fill(null),
  // Browsers block autoplay with sound until the user interacts, so start muted on web.
  muted: Platform.OS === 'web',
};

interface FreqContextValue extends Preferences {
  hydrated: boolean;
  setStation: (id: StationId) => void;
  setHumanOnly: (on: boolean) => void;
  setMuted: (muted: boolean) => void;
  savePreset: (slot: number, id: StationId) => void;
  likedIds: ReadonlySet<string>;
  toggleLike: (videoId: string) => boolean;
}

const FreqContext = createContext<FreqContextValue | null>(null);

export function FreqProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([services.preferences.load(), services.likes.getLikedIds()]).then(([saved, liked]) => {
      setPrefs((p) => {
        const presets = [...(saved.presets ?? p.presets)];
        presets.length = PRESET_COUNT;
        return {
          ...p,
          ...saved,
          muted: Platform.OS === 'web' ? true : (saved.muted ?? p.muted),
          presets: Array.from(presets, (s) => s ?? null),
        };
      });
      setLikedIds(new Set(liked));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) services.preferences.save(prefs);
  }, [prefs, hydrated]);

  const update = useCallback((patch: Partial<Preferences>) => setPrefs((p) => ({ ...p, ...patch })), []);

  const savePreset = useCallback((slot: number, id: StationId) => {
    setPrefs((p) => {
      const presets: PresetSlots = [...p.presets];
      presets[slot] = id;
      return { ...p, presets };
    });
  }, []);

  const toggleLike = useCallback(
    (videoId: string) => {
      const next = !likedIds.has(videoId);
      setLikedIds((prev) => {
        const s = new Set(prev);
        if (next) s.add(videoId);
        else s.delete(videoId);
        return s;
      });
      services.likes.setLiked(videoId, next);
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
      savePreset,
      likedIds,
      toggleLike,
    }),
    [prefs, hydrated, update, savePreset, likedIds, toggleLike],
  );

  return <FreqContext.Provider value={value}>{children}</FreqContext.Provider>;
}

export function useFreq() {
  const ctx = useContext(FreqContext);
  if (!ctx) throw new Error('useFreq must be used inside <FreqProvider>');
  return ctx;
}
