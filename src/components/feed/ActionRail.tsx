import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { getStation } from '@/data/stations';
import { compactCount } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useFreq } from '@/state/FreqProvider';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/theme';
import type { Video } from '@/types/models';

export function ActionRail({ video }: { video: Video }) {
  const { likedIds, toggleLike } = useFreq();
  const toast = useToast();
  const liked = likedIds.has(video.id);
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const onLike = () => {
    const nowLiked = toggleLike(video.id);
    haptics.like();
    heartScale.value = withSequence(withSpring(nowLiked ? 1.35 : 0.8, { duration: 140 }), withSpring(1));
  };

  const onShare = async () => {
    haptics.tap();
    const station = getStation(video.stationId);
    const message = `${video.caption} — ${video.creator.handle} on Freq ${station.frequency.toFixed(1)} ${station.name}`;
    try {
      if (Platform.OS === 'web' && !navigator.share) {
        await navigator.clipboard.writeText(`${message}\n${video.uri}`);
        toast('Link copied');
      } else {
        await Share.share({ message: `${message}\n${video.uri}`, url: video.uri });
      }
    } catch {}
  };

  return (
    <View style={styles.rail}>
      <View style={styles.item}>
        <Avatar creator={video.creator} size={46} />
      </View>
      <Pressable onPress={onLike} style={styles.item} hitSlop={8} accessibilityLabel={liked ? 'Unlike' : 'Like'}>
        <Animated.View style={heartStyle}>
          <Ionicons name="heart" size={34} color={liked ? colors.like : '#fff'} style={styles.shadow} />
        </Animated.View>
        <Text style={styles.count}>{compactCount(video.likes + (liked ? 1 : 0))}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          haptics.tap();
          toast('Comments are coming soon');
        }}
        style={styles.item}
        hitSlop={8}
        accessibilityLabel="Comments"
      >
        <Ionicons name="chatbubble-ellipses" size={31} color="#fff" style={styles.shadow} />
        <Text style={styles.count}>{compactCount(video.comments)}</Text>
      </Pressable>
      <Pressable onPress={onShare} style={styles.item} hitSlop={8} accessibilityLabel="Share">
        <Ionicons name="arrow-redo" size={31} color="#fff" style={styles.shadow} />
        <Text style={styles.count}>{compactCount(video.shares)}</Text>
      </Pressable>
    </View>
  );
}

const textShadow = { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  rail: { alignItems: 'center', gap: 18 },
  item: { alignItems: 'center', gap: 3 },
  count: { color: '#fff', fontSize: 12, fontWeight: '700', ...textShadow },
  shadow: textShadow,
});
