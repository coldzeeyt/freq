import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { colors, fonts } from '@/theme';
import type { Video } from '@/types/models';
import { VideoCard } from './VideoCard';

interface Props {
  videos: Video[] | null;
  /** Changing this resets the feed to the top (e.g. a new station). */
  feedKey: string;
  muted: boolean;
  holdPlayback: boolean;
  railBottom: number;
  infoRight: number;
  infoBottom: number;
  showStation: boolean;
  emptyMessage: string;
}

export function VideoFeed({ videos, feedKey, muted, holdPlayback, railBottom, infoRight, infoBottom, showStation, emptyMessage }: Props) {
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Video>>(null);
  const activeRef = useRef(0);
  const [prevKey, setPrevKey] = useState(feedKey);
  if (prevKey !== feedKey) {
    setPrevKey(feedKey);
    setActiveIndex(0);
  }

  // Watch-time tracking: how long each video stayed on screen, against its length.
  const durations = useRef<Record<string, number>>({});
  const watchStart = useRef<{ video: Video; at: number } | null>(null);
  const onDuration = useCallback((id: string, seconds: number) => {
    durations.current[id] = seconds;
  }, []);

  const flushWatch = useCallback(() => {
    const w = watchStart.current;
    watchStart.current = null;
    if (!w) return;
    const durationMs = (durations.current[w.video.id] ?? 0) * 1000;
    if (durationMs > 0) {
      services.signals.record({ type: 'watch', videoId: w.video.id, watchedMs: Date.now() - w.at, durationMs }, w.video);
    }
  }, []);

  const current = videos?.[activeIndex];
  const playing = !!current && !holdPlayback;
  useEffect(() => {
    if (!current || !playing) return;
    watchStart.current = { video: current, at: Date.now() };
    return flushWatch;
  }, [current, playing, flushWatch]);

  useEffect(() => {
    activeRef.current = 0;
  }, [feedKey]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!height) return;
      const index = Math.round(e.nativeEvent.contentOffset.y / height);
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActiveIndex(index);
        haptics.page();
      }
    },
    [height],
  );

  // Arrow keys / j,k for desktop browsers.
  useEffect(() => {
    if (Platform.OS !== 'web' || !videos?.length) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const delta = e.key === 'ArrowDown' || e.key === 'j' ? 1 : e.key === 'ArrowUp' || e.key === 'k' ? -1 : 0;
      if (!delta) return;
      e.preventDefault();
      const next = Math.min(videos.length - 1, Math.max(0, activeRef.current + delta));
      listRef.current?.scrollToIndex({ index: next, animated: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [videos]);

  return (
    <View style={styles.container} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {videos === null || !height ? (
        <ActivityIndicator style={styles.center} color={colors.text} />
      ) : videos.length === 0 ? (
        <Animated.View entering={FadeIn} style={[styles.center, styles.empty]}>
          <Text style={styles.emptyTitle}>Dead air.</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </Animated.View>
      ) : (
        <Animated.View key={feedKey} entering={FadeIn.duration(280)} style={styles.container}>
          <FlatList
            ref={listRef}
            data={videos}
            keyExtractor={(v) => v.id}
            renderItem={({ item, index }) => (
              <VideoCard
                video={item}
                height={height}
                isActive={index === activeIndex}
                shouldLoad={Math.abs(index - activeIndex) <= 1}
                muted={muted}
                holdPlayback={holdPlayback}
                railBottom={railBottom}
                infoRight={infoRight}
                infoBottom={infoBottom}
                showStation={showStation}
                onDuration={onDuration}
              />
            )}
            extraData={`${activeIndex}-${muted}-${holdPlayback}-${showStation}`}
            getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
            pagingEnabled
            snapToInterval={height}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            windowSize={3}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            removeClippedSubviews={Platform.OS !== 'web'}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { gap: 8, paddingHorizontal: 44 },
  emptyTitle: { color: colors.text, fontFamily: fonts.heavy, fontSize: 22 },
  emptyText: { color: colors.textDim, fontFamily: fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
