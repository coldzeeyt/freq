import { Platform } from 'react-native';

export const colors = {
  bg: '#07070A',
  surface: '#111116',
  surfaceRaised: '#1A1A21',
  border: 'rgba(255,255,255,0.08)',
  text: '#F5F5F7',
  textDim: 'rgba(245,245,247,0.62)',
  textFaint: 'rgba(245,245,247,0.38)',
  // The retro tuner glow.
  glow: '#FFB547',
  glowSoft: 'rgba(255,181,71,0.18)',
  glowDeep: '#FF7A1A',
  human: '#4ADE80',
  humanSoft: 'rgba(74,222,128,0.16)',
  like: '#FF3B5C',
  danger: '#FF453A',
};

export const fonts = {
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  }),
};

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };
