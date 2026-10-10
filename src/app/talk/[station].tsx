import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PostCard } from '@/components/talk/PostCard';
import { useToast } from '@/components/ui/Toast';
import { getStation, STATIONS, stationIndex } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { colors, fonts, radius } from '@/theme';
import type { BoardPost, BoardSort } from '@/types/models';

const SORTS: { key: BoardSort; label: string }[] = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
];

/** A station's Talk board: Reddit-style posts, voted and sorted. */
export default function Board() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ station: string }>();
  const [stationId, setStationId] = useState(STATIONS.some((s) => s.id === params.station) ? params.station : 'all');
  const [sort, setSort] = useState<BoardSort>('hot');
  // Posts are tagged with what they were loaded for, so switching station/sort shows a spinner.
  const [loaded, setLoaded] = useState<{ key: string; posts: BoardPost[] } | null>(null);
  const key = `${stationId}:${sort}`;
  const posts = loaded?.key === key ? loaded.posts : null;
  const [refreshing, setRefreshing] = useState(false);
  const station = getStation(stationId);

  const load = useCallback(async () => {
    const k = `${stationId}:${sort}`;
    try {
      setLoaded({ key: k, posts: await services.talk.listPosts(stationId, sort) });
    } catch (e) {
      setLoaded({ key: k, posts: [] });
      toast((e as Error).message);
    }
  }, [stationId, sort, toast]);

  // Reload when coming back from a post or the composer.
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      load();
    }, [load]),
  );
  useEffect(() => {
    let cancelled = false;
    services.talk
      .listPosts(stationId, sort)
      .then((list) => !cancelled && setLoaded({ key: `${stationId}:${sort}`, posts: list }))
      .catch((e: Error) => {
        if (cancelled) return;
        setLoaded({ key: `${stationId}:${sort}`, posts: [] });
        toast(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId, sort, toast]);

  const step = (dir: number) => {
    haptics.detent();
    setStationId(STATIONS[(stationIndex(stationId) + dir + STATIONS.length) % STATIONS.length].id);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} style={styles.headerBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.tuner}>
          <Pressable onPress={() => step(-1)} hitSlop={10} accessibilityLabel="Previous station">
            <Ionicons name="chevron-back-circle-outline" size={22} color={colors.textDim} />
          </Pressable>
          <Animated.View key={stationId} entering={FadeIn.duration(180)} style={styles.titleBox}>
            <Text style={styles.freq}>{station.frequency.toFixed(1)}</Text>
            <Text style={styles.title}>{station.name} Talk</Text>
          </Animated.View>
          <Pressable onPress={() => step(1)} hitSlop={10} accessibilityLabel="Next station">
            <Ionicons name="chevron-forward-circle-outline" size={22} color={colors.textDim} />
          </Pressable>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <SortTabs value={sort} onChange={(s) => { haptics.tap(); setSort(s); }} />

      {posts === null ? (
        <ActivityIndicator style={styles.center} color={colors.text} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item, index }) => (
            <PostCard
              post={item}
              index={index}
              showStation={stationId === 'all'}
              onOpen={() => router.push({ pathname: '/talk/post/[id]', params: { id: item.id } })}
              onError={toast}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 96 }]}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.text} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={
            <Animated.View entering={FadeIn} style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={34} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>No one’s called in yet.</Text>
              <Text style={styles.emptyText}>
                {stationId === 'all' ? 'Pick a station and start the first thread.' : `Start the first thread on ${station.frequency.toFixed(1)} ${station.name}.`}
              </Text>
            </Animated.View>
          }
        />
      )}

      <Pressable
        onPress={() => {
          haptics.tap();
          router.push({ pathname: '/talk/new', params: { station: stationId } });
        }}
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 20 }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="New post"
      >
        <Ionicons name="create-outline" size={18} color={colors.signalInk} />
        <Text style={styles.fabText}>New post</Text>
      </Pressable>
    </View>
  );
}

function SortTabs({ value, onChange }: { value: BoardSort; onChange: (s: BoardSort) => void }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const tabW = width / SORTS.length;
  useEffect(() => {
    x.set(withSpring(SORTS.findIndex((s) => s.key === value) * tabW, { damping: 20, stiffness: 240 }));
  }, [value, tabW, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return (
    <View style={styles.tabs} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {SORTS.map((s) => (
        <Pressable key={s.key} onPress={() => onChange(s.key)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: value === s.key }}>
          <Text style={[styles.tabText, value === s.key && styles.tabTextOn]}>{s.label}</Text>
        </Pressable>
      ))}
      {width > 0 && <Animated.View style={[styles.tabIndicator, { width: tabW }, indicator]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tuner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  titleBox: { alignItems: 'center', minWidth: 150 },
  freq: { color: colors.signal, fontFamily: fonts.mono, fontSize: 11 },
  title: { color: colors.text, fontFamily: fonts.heavy, fontSize: 18, letterSpacing: -0.3 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabText: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 14 },
  tabTextOn: { color: colors.text },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, height: 2, backgroundColor: colors.signal },
  list: { flexGrow: 1 },
  center: { flex: 1 },
  empty: { alignItems: 'center', gap: 6, paddingTop: 90, paddingHorizontal: 40 },
  emptyTitle: { color: colors.text, fontFamily: fonts.heavy, fontSize: 20 },
  emptyText: { color: colors.textDim, fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.signal,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: colors.signalInk, fontFamily: fonts.bodyBold, fontSize: 15 },
  pressed: { transform: [{ scale: 0.96 }] },
});
