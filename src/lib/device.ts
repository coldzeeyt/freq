import { Platform } from 'react-native';

/** True on phones/tablets (native, or a touch-screen browser). Mouse wording vs touch wording. */
export const isTouchScreen =
  Platform.OS !== 'web' || (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
