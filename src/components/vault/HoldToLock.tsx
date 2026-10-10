import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { colors, fonts, radius } from '@/theme';

const HOLD_MS = 1800;

/** Press and hold until it fills: there's no undo for the Vault, so it shouldn't be a tap. */
export function HoldToLock({ onLocked, busy, label = 'Hold to lock it in forever' }: { onLocked: () => void; busy?: boolean; label?: string }) {
  const fill = useSharedValue(0);
  const ticks = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const done = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [holding, setHolding] = useState(false);

  const stop = () => {
    clearInterval(ticks.current);
    clearTimeout(done.current);
    setHolding(false);
  };

  const start = () => {
    if (busy) return;
    setHolding(true);
    fill.set(withTiming(1, { duration: HOLD_MS, easing: Easing.linear }));
    let n = 0;
    // Haptics get heavier as the door closes.
    ticks.current = setInterval(() => {
      n += 1;
      if (n < 4) haptics.detent();
      else if (n < 7) haptics.tap();
      else haptics.like();
    }, HOLD_MS / 9);
    done.current = setTimeout(() => {
      stop();
      haptics.heavy();
      setTimeout(() => haptics.success(), 120);
      onLocked();
    }, HOLD_MS);
  };

  const release = () => {
    if (!holding) return;
    stop();
    cancelAnimation(fill);
    fill.set(withTiming(0, { duration: 250 }));
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));
  const lockStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${(1 - fill.get()) * -25}deg` }, { scale: 1 + fill.get() * 0.15 }] }));

  return (
    <Pressable onPressIn={start} onPressOut={release} disabled={busy} style={styles.button} accessibilityRole="button" accessibilityLabel={label}>
      <Animated.View style={[styles.fill, fillStyle]} />
      <View style={styles.row}>
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Animated.View style={lockStyle}>
            <Ionicons name={holding ? 'lock-closed' : 'lock-open-outline'} size={18} color={colors.text} />
          </Animated.View>
        )}
        <Text style={styles.text}>{busy ? 'Locking in…' : holding ? 'Keep holding…' : label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.text,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(237,230,214,0.22)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  text: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
});
