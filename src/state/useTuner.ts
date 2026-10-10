import { useCallback, useRef, useState } from 'react';
import { useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { STATIONS, stationIndex } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { useTuningSounds } from '@/lib/useTuningSounds';
import type { StationId } from '@/types/models';

const STATIC_PEAK = 0.82;
const FADE_MS = 380;

/**
 * Choreographs a station change: visual static fades in while the dial turns, each
 * detent clicks + ticks a haptic, and the station locks in with a firmer bump.
 */
export function useTuner(stationId: StationId, setStation: (id: StationId) => void) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [staticVisible, setStaticVisible] = useState(false);
  const staticLevel = useSharedValue(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sounds = useTuningSounds(true);

  const showStatic = useCallback(() => {
    clearTimeout(hideTimer.current);
    setStaticVisible(true);
  }, []);

  const fadeStatic = useCallback(
    (delay = 120) => {
      staticLevel.set(withDelay(delay, withTiming(0, { duration: FADE_MS })));
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setStaticVisible(false), delay + FADE_MS + 40);
    },
    [staticLevel],
  );

  const onTuneStart = useCallback(() => {
    showStatic();
    staticLevel.set(withTiming(STATIC_PEAK, { duration: 140 }));
    setPreviewIndex(stationIndex(stationId));
  }, [showStatic, staticLevel, stationId]);

  const onDetent = useCallback(
    (index: number) => {
      setPreviewIndex(index);
      haptics.detent();
      sounds.playClick();
    },
    [sounds],
  );

  const onTuneEnd = useCallback(
    (index: number) => {
      const next = STATIONS[index].id;
      setPreviewIndex(null);
      if (next !== stationId) {
        haptics.lockIn();
        setStation(next);
      }
      fadeStatic(next !== stationId ? 160 : 0);
    },
    [stationId, setStation, fadeStatic],
  );

  /** Jump straight to a station (presets) with a short burst of static. */
  const tuneTo = useCallback(
    (id: StationId) => {
      if (id === stationId) {
        haptics.tap();
        return;
      }
      showStatic();
      staticLevel.set(withSequence(withTiming(STATIC_PEAK, { duration: 90 }), withTiming(STATIC_PEAK, { duration: 160 })));
        sounds.playClick();
      haptics.lockIn();
      setStation(id);
      fadeStatic(250);
    },
    [stationId, showStatic, staticLevel, sounds, setStation, fadeStatic],
  );

  return {
    previewIndex,
    tuning: previewIndex !== null,
    staticLevel,
    staticVisible,
    onTuneStart,
    onDetent,
    onTuneEnd,
    tuneTo,
  };
}
