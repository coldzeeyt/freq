import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme';

/** A small label-maker style tag. */
export function HumanBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <View style={[styles.badge, size === 'md' && styles.md]} accessibilityLabel="Human-made video">
      <View style={styles.dot} />
      <Text style={[styles.text, size === 'md' && styles.textMd]}>HUMAN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 5,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(237,230,214,0.7)',
  },
  md: { height: 20, paddingHorizontal: 7 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.text },
  text: { color: colors.text, fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 0.8 },
  textMd: { fontSize: 11 },
});
