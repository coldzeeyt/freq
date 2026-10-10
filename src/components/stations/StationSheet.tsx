import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { MOCK_VIDEOS } from '@/data/mockVideos';
import { POSTABLE_STATIONS, STATION_GROUPS, STATIONS } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { MAX_PINNED } from '@/state/FreqProvider';
import { colors, fonts, noWebOutline, radius } from '@/theme';
import type { Station, StationId } from '@/types/models';

interface Props {
  open: boolean;
  current: StationId;
  pinned: StationId[];
  counts: Record<StationId, number>;
  onClose: () => void;
  onSelect: (id: StationId) => void;
  onTogglePin: (id: StationId) => void;
}

// One representative still per station for the cards.
const COVER: Record<string, string | undefined> = {};
for (const v of MOCK_VIDEOS) COVER[v.stationId] ??= v.thumbnail;

export function StationSheet({ open, current, pinned, counts, onClose, onSelect, onTogglePin }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.min(height * 0.86, 760);
  const y = useSharedValue(sheetHeight);
  const [mounted, setMounted] = useState(open);
  const [query, setQuery] = useState('');

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) y.set(withSpring(0, { damping: 26, stiffness: 240, mass: 0.9 }));
    else y.set(withTiming(sheetHeight, { duration: 220 }, (done) => done && scheduleOnRN(setMounted, false)));
  }, [open, sheetHeight, y]);

  const drag = Gesture.Pan()
    .onUpdate((e) => y.set(Math.max(0, e.translationY)))
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) scheduleOnRN(onClose);
      else y.set(withSpring(0, { damping: 26, stiffness: 240 }));
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: 1 - y.get() / sheetHeight }));

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      POSTABLE_STATIONS.filter(
        (s) => !q || s.name.toLowerCase().includes(q) || s.keywords.some((k) => k.startsWith(q)) || s.frequency.toFixed(1).startsWith(q),
      ),
    [q],
  );

  if (!mounted) return null;

  const pick = (id: StationId) => {
    onSelect(id);
    onClose();
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close stations" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height: sheetHeight }, sheetStyle]}>
        <GestureDetector gesture={drag}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Stations</Text>
              <Text style={styles.subtitle}>
                {pinned.length}/{MAX_PINNED} pinned
              </Text>
            </View>
          </View>
        </GestureDetector>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={15} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search stations or topics"
            placeholderTextColor={colors.textFaint}
            style={[styles.search, noWebOutline]}
            autoCorrect={false}
          />
        </View>

        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
          {!q && (
            <>
              <Text style={styles.section}>Pinned to your bar</Text>
              <View style={styles.pinnedRow}>
                {pinned.map((id, i) => {
                  const s = STATIONS.find((st) => st.id === id)!;
                  return (
                    <Animated.View key={id} entering={FadeIn.delay(i * 20)}>
                      <Pressable
                        onPress={() => pick(id)}
                        onLongPress={() => id !== 'all' && onTogglePin(id)}
                        style={[styles.pinChip, id === current && styles.pinChipActive]}
                      >
                        <Text style={styles.pinFreq}>{s.frequency.toFixed(1)}</Text>
                        <Text style={styles.pinName}>{s.name}</Text>
                        {id !== 'all' && (
                          <Pressable hitSlop={8} onPress={() => onTogglePin(id)} accessibilityLabel={`Unpin ${s.name}`}>
                            <Ionicons name="close" size={13} color={colors.textFaint} />
                          </Pressable>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </>
          )}

          {(q ? ([null] as const) : STATION_GROUPS).map((group) => {
            const list = matches.filter((s) => !group || s.group === group);
            if (!list.length) return null;
            return (
              <View key={group ?? 'results'}>
                <Text style={styles.section}>{group ?? `${list.length} match${list.length === 1 ? '' : 'es'}`}</Text>
                <View style={styles.grid}>
                  {list.map((s, i) => (
                    <StationCard
                      key={s.id}
                      station={s}
                      index={i}
                      active={s.id === current}
                      pinned={pinned.includes(s.id)}
                      count={counts[s.id] ?? 0}
                      onPress={() => pick(s.id)}
                      onPin={() => onTogglePin(s.id)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
          {!!q && !matches.length && <Text style={styles.empty}>Nothing on that frequency.</Text>}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function StationCard(props: {
  station: Station;
  index: number;
  active: boolean;
  pinned: boolean;
  count: number;
  onPress: () => void;
  onPin: () => void;
}) {
  const { station, active, pinned, count } = props;
  const cover = COVER[station.id];
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(props.index, 8) * 30).duration(260)} style={styles.cardWrap}>
      <Pressable
        onPress={props.onPress}
        style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.cardPressed]}
        accessibilityLabel={`${station.name}, ${station.frequency}`}
      >
        {cover && <Image source={{ uri: cover }} style={styles.cover} />}
        <View style={styles.coverShade} />
        <View style={styles.cardTop}>
          <Text style={[styles.cardFreq, active && { color: colors.signal }]}>{station.frequency.toFixed(1)}</Text>
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptics.tap();
              props.onPin();
            }}
            accessibilityLabel={pinned ? `Unpin ${station.name}` : `Pin ${station.name}`}
          >
            <Ionicons name={pinned ? 'bookmark' : 'bookmark-outline'} size={16} color={pinned ? colors.signal : colors.text} />
          </Pressable>
        </View>
        <View>
          <Text style={styles.cardName}>{station.name}</Text>
          <Text style={styles.cardMeta}>
            {count} video{count === 1 ? '' : 's'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  handleArea: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 10 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { color: colors.text, fontFamily: fonts.heavy, fontSize: 22, letterSpacing: -0.3 },
  subtitle: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  search: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 15, height: 40 },
  body: { paddingHorizontal: 16 },
  section: {
    color: colors.textFaint,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 20,
    marginBottom: 10,
  },
  pinnedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 8,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  pinChipActive: { borderColor: colors.signal },
  pinFreq: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 10 },
  pinName: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardWrap: { width: '48.8%' },
  card: {
    height: 104,
    borderRadius: radius.md,
    overflow: 'hidden',
    padding: 10,
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  cardActive: { borderColor: colors.signal, borderWidth: 1 },
  cardPressed: { transform: [{ scale: 0.97 }] },
  cover: { ...StyleSheet.absoluteFill, opacity: 0.55 },
  coverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(14,13,11,0.35)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFreq: { color: colors.text, fontFamily: fonts.mono, fontSize: 11 },
  cardName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16 },
  cardMeta: { color: colors.textDim, fontFamily: fonts.body, fontSize: 12 },
  empty: { color: colors.textDim, fontFamily: fonts.body, textAlign: 'center', marginTop: 40 },
});
