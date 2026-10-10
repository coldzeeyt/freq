import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, fonts } from '@/theme';

const PULL = 80;

/**
 * Browsers don't give scroll views a pull-to-refresh, so watch touches (and the
 * mouse wheel) on the feed: pulling down / scrolling up while at the very top refreshes.
 */
export function usePullToRefresh(getNode: () => HTMLElement | null, enabled: boolean, refreshing: boolean, onRefresh: () => void) {
  const [pull, setPull] = useState(0);

  useEffect(() => {
    const node = getNode();
    if (!node || !enabled) return;
    let startY: number | null = null;
    let current = 0;
    let wheel = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;

    const atTop = () => node.scrollTop <= 0;
    const onStart = (e: TouchEvent) => {
      startY = atTop() ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      current = Math.max(0, e.touches[0].clientY - startY);
      setPull(Math.min(current, PULL * 1.5));
    };
    const onEnd = () => {
      if (startY !== null && current >= PULL) onRefresh();
      startY = null;
      current = 0;
      setPull(0);
    };
    const onWheel = (e: WheelEvent) => {
      if (!atTop() || e.deltaY >= 0) return;
      wheel += -e.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => (wheel = 0), 500);
      if (wheel > 220) {
        wheel = 0;
        onRefresh();
      }
    };
    node.addEventListener('touchstart', onStart, { passive: true });
    node.addEventListener('touchmove', onMove, { passive: true });
    node.addEventListener('touchend', onEnd);
    node.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      node.removeEventListener('touchstart', onStart);
      node.removeEventListener('touchmove', onMove);
      node.removeEventListener('touchend', onEnd);
      node.removeEventListener('wheel', onWheel);
      clearTimeout(wheelTimer);
    };
  }, [getNode, enabled, onRefresh]);

  const indicator =
    refreshing || pull > 10 ? (
      <Animated.View
        entering={FadeIn.duration(120)}
        exiting={FadeOut.duration(160)}
        pointerEvents="none"
        style={[styles.pill, { transform: [{ translateY: refreshing ? 0 : Math.min(pull, PULL) / 2 - 20 }] }]}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={colors.bg} />
        ) : (
          <Ionicons name={pull >= PULL ? 'refresh' : 'arrow-down'} size={14} color={colors.bg} />
        )}
        <Text style={styles.text}>{refreshing ? 'Refreshing' : pull >= PULL ? 'Release to refresh' : 'Pull to refresh'}</Text>
      </Animated.View>
    ) : null;

  return { indicator, nativeRefreshControl: undefined };
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 130,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.text,
  },
  text: { color: colors.bg, fontFamily: fonts.bodyMedium, fontSize: 13 },
});

