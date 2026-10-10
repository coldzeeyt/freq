import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme';

/** Rings broadcasting out from a point, like a transmitter. */
export function RadioWaves({ size = 320, rings = 4 }: { size?: number; rings?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]} pointerEvents="none">
      {Array.from({ length: rings }, (_, i) => (
        <Ring key={i} size={size} delay={(i * 2800) / rings} />
      ))}
    </View>
  );
}

function Ring({ size, delay }: { size: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 2800, easing: Easing.out(Easing.quad) }), -1, false)));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - t.get()) * 0.5,
    transform: [{ scale: 0.15 + t.get() * 0.85 }],
  }));
  return <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, style]} />;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: colors.signal },
});
