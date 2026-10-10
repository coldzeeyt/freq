import * as Haptics from 'expo-haptics';

// One place for every haptic in the app, so the "feel" stays consistent.
// expo-haptics falls back to the Vibration API on web; failures are never fatal.
const safe = (p: Promise<void>) => p.catch(() => {});

export const haptics = {
  /** Dial passes a station detent. */
  detent: () => safe(Haptics.selectionAsync()),
  /** Dial settles on a station. */
  lockIn: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),
  /** Swiped to another video. */
  page: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  tap: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  like: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  toggle: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
