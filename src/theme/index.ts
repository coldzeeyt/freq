// One warm neutral palette and a single signal color, like printed hardware.
export const colors = {
  bg: '#0E0D0B',
  surface: '#171613',
  surfaceRaised: '#211F1B',
  line: 'rgba(237,230,214,0.12)',
  lineStrong: 'rgba(237,230,214,0.24)',
  text: '#EDE6D6',
  textDim: 'rgba(237,230,214,0.64)',
  textFaint: 'rgba(237,230,214,0.4)',
  /** Tuning-needle orange. Used sparingly: needle, active station, primary action. */
  signal: '#FF5A1F',
  signalInk: '#1C0D05',
  like: '#FF5A1F',
  danger: '#E5484D',
  scrim: 'rgba(14,13,11,0.72)',
};

export const fonts = {
  body: 'Archivo_400Regular',
  bodyMedium: 'Archivo_500Medium',
  bodyBold: 'Archivo_700Bold',
  heavy: 'Archivo_800ExtraBold',
  narrow: 'ArchivoNarrow_500Medium',
  narrowBold: 'ArchivoNarrow_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
};

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };

/** Browsers draw a focus ring on inputs; our inputs have their own borders. */
export const noWebOutline = { outlineStyle: 'none' } as unknown as Record<string, never>;
