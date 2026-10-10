import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getStation } from '@/data/stations';
import { colors, fonts } from '@/theme';
import type { StationId } from '@/types/models';

interface Props {
  pinned: StationId[];
  current: StationId;
  /** Shown while the dial is mid-turn so the bar follows along. */
  previewing: StationId | null;
  onSelect: (id: StationId) => void;
  onMore: () => void;
  bottomInset: number;
}

const SPRING = { damping: 22, stiffness: 260, mass: 0.7 };

export function StationBar({ pinned, current, previewing, onSelect, onMore, bottomInset }: Props) {
  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const scroller = useRef<ScrollView>(null);
  const [, force] = useState(0);
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const visible = useSharedValue(0);
  const shown = previewing ?? current;
  const offBar = !pinned.includes(shown);

  useEffect(() => {
    const l = layouts.current[shown];
    if (!l) {
      visible.set(withSpring(0, SPRING));
      return;
    }
    x.set(withSpring(l.x + 12, SPRING));
    w.set(withSpring(l.width - 24, SPRING));
    visible.set(withSpring(1, SPRING));
    scroller.current?.scrollTo({ x: Math.max(0, l.x - 60), animated: true });
  }, [shown, pinned, x, w, visible]);

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { scaleY: visible.get() }],
    width: w.get(),
    opacity: visible.get(),
  }));

  return (
    <View style={[styles.bar, { paddingBottom: bottomInset }]}>
      <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.row}>
          {pinned.map((id) => {
            const station = getStation(id);
            const active = id === shown;
            return (
              <Pressable
                key={id}
                onPress={() => onSelect(id)}
                onLayout={(e) => {
                  layouts.current[id] = e.nativeEvent.layout;
                  if (id === shown) force((n) => n + 1);
                }}
                style={styles.tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${station.name}, ${station.frequency}`}
              >
                <Text style={[styles.freq, active && styles.freqActive]}>{station.frequency.toFixed(1)}</Text>
                <Text style={[styles.name, active && styles.nameActive]}>{station.name}</Text>
              </Pressable>
            );
          })}
          <Animated.View style={[styles.indicator, indicator]} pointerEvents="none" />
        </View>
      </ScrollView>
      <Pressable onPress={onMore} style={styles.more} accessibilityRole="button" accessibilityLabel="More stations">
        <Ionicons name="apps-outline" size={17} color={offBar ? colors.signal : colors.text} />
        <Text style={[styles.moreText, offBar && { color: colors.signal }]}>{offBar ? getStation(shown).name : 'More'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  scroll: { flex: 1 },
  row: { flexDirection: 'row', paddingHorizontal: 4 },
  tab: { paddingHorizontal: 12, paddingTop: 9, paddingBottom: 10, alignItems: 'flex-start' },
  freq: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 9, marginBottom: 1 },
  freqActive: { color: colors.signal },
  name: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 14 },
  nameActive: { color: colors.text },
  indicator: { position: 'absolute', left: 0, bottom: 0, height: 2, backgroundColor: colors.signal },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.line,
    maxWidth: 130,
  },
  moreText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 14 },
});
