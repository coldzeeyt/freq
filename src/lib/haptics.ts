import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// One place for every haptic in the app, so the "feel" stays consistent.
// On web, expo-haptics uses the Vibration API (Android browsers) or the iOS 18+
// Safari switch trick; desktop browsers have no way to vibrate.
const listeners = new Set<(kind: HapticKind) => void>();

const fire = (kind: HapticKind, p: Promise<void>) => {
  listeners.forEach((l) => l(kind));
  return p.catch(() => {});
};

export type HapticKind = 'detent' | 'lockIn' | 'page' | 'tap' | 'like' | 'toggle' | 'heavy' | 'success' | 'warning';

export const haptics: Record<HapticKind, () => Promise<void>> = {
  /** Dial passes a station detent. */
  detent: () => fire('detent', Haptics.selectionAsync()),
  /** Dial settles on a station. */
  lockIn: () => fire('lockIn', Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),
  /** Swiped to another video. */
  page: () => fire('page', Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  tap: () => fire('tap', Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  like: () => fire('like', Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  toggle: () => fire('toggle', Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => fire('heavy', Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: () => fire('success', Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => fire('warning', Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

/** Lets UI mirror haptics visually (useful where the device can't vibrate). */
export function onHaptic(listener: (kind: HapticKind) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type HapticSupport =
  | { level: 'full'; label: string; detail: string }
  | { level: 'partial'; label: string; detail: string }
  | { level: 'none'; label: string; detail: string };

/** iPhone/iPad Safari: haptics only get through during an actual touch. */
export const isIOSWeb =
  Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

/** What this device/browser can actually do, in plain words. */
export function hapticSupport(): HapticSupport {
  if (Platform.OS !== 'web') {
    return {
      level: 'full',
      label: 'Haptics on',
      detail: 'If you feel nothing, check that System Haptics is on in your phone’s settings.',
    };
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    return touch
      ? { level: 'full', label: 'Vibration on', detail: 'This browser can vibrate your phone. Battery saver can block it.' }
      : {
          level: 'none',
          label: 'No vibration on computers',
          detail: 'Desktop browsers have no vibration hardware to use. Open Freq on your phone to feel the dial.',
        };
  }
  if (isIOSWeb) {
    return {
      level: 'partial',
      label: 'Limited on iPhone',
      detail:
        'Safari on iOS 18+ allows light taps only, and may skip some while you drag. Turn on System Haptics in Settings > Sounds & Haptics. For the full feel, use the app in Expo Go.',
    };
  }
  return {
    level: 'none',
    label: 'No vibration in this browser',
    detail: 'Computers can’t vibrate from a web page. Open Freq on your phone to feel the dial.',
  };
}
