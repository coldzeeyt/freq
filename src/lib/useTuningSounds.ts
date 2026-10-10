import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';

const CLICK = require('../../assets/sounds/click.wav');
const STATIC = require('../../assets/sounds/static.wav');

/** Detent click + radio static for the dial. */
export function useTuningSounds(enabled: boolean) {
  const click = useAudioPlayer(CLICK);
  const hiss = useAudioPlayer(STATIC);
  const hissing = useRef(false);

  useEffect(() => {
    // Mix with (not interrupt) the feed's video audio, and play even with the iOS silent switch.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    hiss.loop = true;
    hiss.volume = 0.35;
    click.volume = 0.8;
  }, [click, hiss]);

  const playClick = useCallback(() => {
    if (!enabled) return;
    try {
      click.seekTo(0);
      click.play();
    } catch {}
  }, [click, enabled]);

  const startStatic = useCallback(() => {
    if (!enabled || hissing.current) return;
    hissing.current = true;
    try {
      hiss.seekTo(Math.random() * 0.8);
      hiss.play();
    } catch {}
  }, [hiss, enabled]);

  const stopStatic = useCallback(() => {
    if (!hissing.current) return;
    hissing.current = false;
    try {
      hiss.pause();
    } catch {}
  }, [hiss]);

  return { playClick, startStatic, stopStatic };
}
