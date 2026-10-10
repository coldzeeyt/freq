import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';

const CLICK = require('../../assets/sounds/click.wav');

/** The dial's detent click. (Tuning is otherwise silent: the static is visual only.) */
export function useTuningSounds(enabled: boolean) {
  const click = useAudioPlayer(CLICK);

  useEffect(() => {
    // Mix with (not interrupt) the feed's video audio, and play even with the iOS silent switch.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    // eslint-disable-next-line react-hooks/immutability -- expo-audio players are configured imperatively
    click.volume = 0.8;
  }, [click]);

  const playClick = useCallback(() => {
    if (!enabled) return;
    try {
      click.seekTo(0);
      click.play();
    } catch {}
  }, [click, enabled]);

  return { playClick };
}
