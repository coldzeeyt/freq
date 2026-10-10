import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { colors, fonts } from '@/theme';

export function HumanOnlyToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const t = useDerivedValue(() => withSpring(value ? 1 : 0, { damping: 18, stiffness: 260 }));
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.get(), [0, 1], ['rgba(237,230,214,0.16)', colors.text]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: t.get() * 12 }],
    backgroundColor: interpolateColor(t.get(), [0, 1], [colors.text, colors.bg]),
  }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={styles.wrap}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Human only"
      hitSlop={8}
    >
      <Text style={[styles.label, value && styles.labelOn]}>Human only</Text>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 34, paddingHorizontal: 4 },
  label: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 13 },
  labelOn: { color: colors.text },
  track: { width: 28, height: 16, borderRadius: 8, padding: 2 },
  thumb: { width: 12, height: 12, borderRadius: 6 },
});
