import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { clock, useOnAirClock } from '@/state/useOnAirClock';
import { colors, fonts } from '@/theme';

/** Top-bar entry to On Air. Lights up and counts down while the daily window is open. */
export function OnAirButton() {
  const { phase, secondsLeft } = useOnAirClock();
  const live = phase === 'live';
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(live ? withRepeat(withSequence(withTiming(0.55, { duration: 650 }), withTiming(1, { duration: 650 })), -1) : 1);
  }, [live, pulse]);
  const dot = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        router.push('/onair');
      }}
      hitSlop={8}
      style={[styles.base, live && styles.live]}
      accessibilityLabel={live ? `On Air now, ${secondsLeft} seconds left` : 'On Air'}
    >
      {live ? (
        <Animated.View entering={FadeIn} style={styles.row}>
          <Animated.View style={[styles.dot, dot]} />
          <Text style={styles.liveText}>ON AIR {clock(secondsLeft)}</Text>
        </Animated.View>
      ) : (
        <Ionicons name="aperture-outline" size={18} color={colors.text} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 30,
    minWidth: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: 'rgba(14,13,11,0.35)',
  },
  live: { backgroundColor: colors.signal, borderColor: colors.signal, paddingHorizontal: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.signalInk },
  liveText: { color: colors.signalInk, fontFamily: fonts.monoMedium, fontSize: 11 },
});
