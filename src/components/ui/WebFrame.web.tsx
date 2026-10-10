import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, fonts } from '@/theme';

const PHONE_WIDTH = 420;

/** On a desktop browser, present the app as a phone-width column with a little context beside it. */
export function WebFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  if (width < 760) return <View style={styles.full}>{children}</View>;

  const phoneHeight = Math.min(height - 48, 900);
  return (
    <View style={styles.page}>
      <View style={styles.side}>
        <Text style={styles.wordmark}>freq</Text>
        <Text style={styles.lede}>Short videos, tuned like a radio. Spin the dial to pick a station, and switch on Human only to filter out AI and unverified videos.</Text>
        <View style={styles.keys}>
          <Key k="↑ ↓" label="next / previous video" />
          <Key k="scroll" label="over the dial to tune" />
          <Key k="click" label="right / left side of the dial" />
          <Key k="← →" label="tune one station" />
          <Key k="2× click" label="like" />
        </View>
      </View>
      <View style={[styles.phone, { height: phoneHeight }]}>{children}</View>
    </View>
  );
}

function Key({ k, label }: { k: string; label: string }) {
  return (
    <View style={styles.keyRow}>
      <Text style={styles.key}>{k}</Text>
      <Text style={styles.keyLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  page: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 72,
    backgroundColor: '#0A0908',
  },
  side: { width: 300, gap: 18 },
  wordmark: { color: colors.text, fontFamily: fonts.heavy, fontSize: 64, letterSpacing: -3, lineHeight: 64 },
  lede: { color: colors.textDim, fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  keys: { gap: 8, marginTop: 8 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  key: {
    minWidth: 64,
    textAlign: 'center',
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 12,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    borderRadius: 4,
  },
  keyLabel: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 13 },
  phone: {
    width: PHONE_WIDTH,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
});
