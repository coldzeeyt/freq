import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { colors, radius } from '@/theme';

export function HumanOnlyToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const t = useDerivedValue(() => withTiming(value ? 1 : 0, { duration: 180 }));
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], ['rgba(255,255,255,0.18)', colors.human]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * 14 }] }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.pill, value && styles.pillOn]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Human only"
      hitSlop={6}
    >
      <Ionicons name="finger-print" size={15} color={value ? colors.human : colors.textDim} />
      <Text style={[styles.label, value && styles.labelOn]}>HUMAN ONLY</Text>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 38,
    paddingLeft: 11,
    paddingRight: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillOn: { backgroundColor: 'rgba(8,28,16,0.7)', borderColor: 'rgba(74,222,128,0.45)' },
  label: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  labelOn: { color: colors.human },
  track: { width: 32, height: 18, borderRadius: 9, padding: 2 },
  thumb: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff' },
});
