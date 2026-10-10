import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/lib/haptics';
import { clock, useOnAirClock } from '@/state/useOnAirClock';
import { colors, fonts } from '@/theme';

export const TABS = ['Radio', 'Talk', 'On Air', 'Vault', 'You'] as const;
export const ON_AIR_TAB = 2;
export const HEADER_HEIGHT = 46;

interface Props {
  page: number;
  position: SharedValue<number>;
  onSelect: (page: number) => void;
  onPost: () => void;
  /** Over video (Radio, Vault) the header floats on a scrim instead of a solid bar. */
  overVideo: boolean;
}

/** Tab labels across the top, with an underline that follows your swipe. */
export function TabHeader({ page, position, onSelect, onPost, overVideo }: Props) {
  const insets = useSafeAreaInsets();
  const { phase, secondsLeft } = useOnAirClock();
  const [layouts, setLayouts] = useState<{ x: number; width: number }[]>([]);
  const ready = layouts.length === TABS.length && layouts.every(Boolean);

  const underline = useAnimatedStyle(() => {
    if (!ready) return { opacity: 0 };
    const idx = TABS.map((_, i) => i);
    return {
      opacity: 1,
      width: interpolate(position.get(), idx, layouts.map((l) => l.width), 'clamp'),
      transform: [{ translateX: interpolate(position.get(), idx, layouts.map((l) => l.x), 'clamp') }],
    };
  });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 4 }]} pointerEvents="box-none">
      {overVideo ? (
        <LinearGradient
          colors={['rgba(14,13,11,0.7)', 'rgba(14,13,11,0)']}
          style={[StyleSheet.absoluteFill, { height: insets.top + HEADER_HEIGHT + 30 }]}
          pointerEvents="none"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.solid]} pointerEvents="none" />
      )}
      <View style={styles.row}>
        <View style={styles.tabs}>
          {TABS.map((label, i) => {
            const live = i === ON_AIR_TAB && phase === 'live';
            return (
              <Pressable
                key={label}
                onPress={() => {
                  haptics.tap();
                  onSelect(i);
                }}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  setLayouts((prev) => {
                    const next = [...prev];
                    next[i] = { x, width };
                    return next;
                  });
                }}
                style={styles.tab}
                hitSlop={6}
                accessibilityRole="tab"
                accessibilityState={{ selected: page === i }}
                accessibilityLabel={live ? `On Air, live, ${secondsLeft} seconds left` : label}
              >
                <Text style={[styles.label, page === i && styles.labelOn, live && styles.labelLive]}>
                  {live ? `On Air ${clock(secondsLeft)}` : label}
                </Text>
                {live && <View style={styles.liveDot} />}
              </Pressable>
            );
          })}
          <Animated.View style={[styles.underline, underline]} pointerEvents="none" />
        </View>
        <Pressable onPress={onPost} style={styles.post} hitSlop={8} accessibilityLabel="New post">
          <Ionicons name="add" size={20} color={colors.signalInk} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12 },
  solid: { backgroundColor: colors.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  row: { height: HEADER_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabs: { flexDirection: 'row', alignItems: 'center', height: '100%' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, height: '100%' },
  label: {
    color: colors.textDim,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 4,
  },
  labelOn: { color: colors.text },
  labelLive: { color: colors.signal },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.signal },
  underline: { position: 'absolute', left: 0, bottom: 6, height: 2, borderRadius: 1, backgroundColor: colors.signal },
  post: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.signal },
});
