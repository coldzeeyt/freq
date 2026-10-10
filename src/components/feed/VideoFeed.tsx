import { Ionicons } from '@expo/vector-icons';
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
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme';
import type { Video } from '@/types/models';
import { VideoCard } from './VideoCard';

interface Props {
  videos: Video[] | null;
  /** Changing this resets the feed to the top (e.g. a new station). */
  feedKey: string;
  muted: boolean;
  holdPlayback: boolean;
  bottomInset: number;
  showStation: boolean;
  emptyMessage: string;
}

export function VideoFeed({ videos, feedKey, muted, holdPlayback, bottomInset, showStation, emptyMessage }: Props) {
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Video>>(null);
  const activeRef = useRef(0);
  const [prevKey, setPrevKey] = useState(feedKey);
  // A new station/filter starts at the top.
  if (prevKey !== feedKey) {
    setPrevKey(feedKey);
    setActiveIndex(0);
  }
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

  // Arrow keys / j,k for testing in a desktop browser.
  useEffect(() => {
    if (Platform.OS !== 'web' || !videos?.length) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
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
        <ActivityIndicator style={styles.center} color={colors.glow} />
      ) : videos.length === 0 ? (
        <View style={[styles.center, styles.empty]}>
          <Ionicons name="radio-outline" size={44} color={colors.textFaint} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          key={feedKey}
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
              bottomInset={bottomInset}
              showStation={showStation}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { gap: 12, paddingHorizontal: 40 },
  emptyText: { color: colors.textDim, fontSize: 15, textAlign: 'center', lineHeight: 21 },
});
