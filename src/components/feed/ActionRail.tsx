import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useToast } from '@/components/ui/Toast';
import { getStation } from '@/data/stations';
import { compactCount } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts } from '@/theme';
import type { Video } from '@/types/models';

export function ActionRail({ video }: { video: Video }) {
  const { likedIds, toggleLike } = useFreq();
  const toast = useToast();
  const liked = likedIds.has(video.id);
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.get() }] }));

  const onLike = () => {
    const nowLiked = toggleLike(video);
    haptics.like();
    heartScale.set(withSequence(withTiming(nowLiked ? 1.3 : 0.85, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 300 })));
  };

  const onShare = async () => {
    haptics.tap();
    services.signals.record({ type: 'share', videoId: video.id }, video);
    const station = getStation(video.stationId);
    const message = `${video.caption} (@${video.creator.handle} on ${station.frequency.toFixed(1)} ${station.name}, Freq)`;
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
      <Pressable onPress={onLike} style={styles.item} hitSlop={8} accessibilityLabel={liked ? 'Unlike' : 'Like'}>
        <Animated.View style={heartStyle}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={27} color={liked ? colors.like : colors.text} style={styles.shadow} />
        </Animated.View>
        <Text style={styles.count}>{compactCount(video.likes + (liked ? 1 : 0))}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          haptics.tap();
          router.push({ pathname: '/comments/[videoId]', params: { videoId: video.id } });
        }}
        style={styles.item}
        hitSlop={8}
        accessibilityLabel="Comments"
      >
        <Ionicons name="chatbubble-outline" size={24} color={colors.text} style={styles.shadow} />
        <Text style={styles.count}>{compactCount(video.comments)}</Text>
      </Pressable>
      <Pressable onPress={onShare} style={styles.item} hitSlop={8} accessibilityLabel="Share">
        <Ionicons name="arrow-redo-outline" size={25} color={colors.text} style={styles.shadow} />
        <Text style={styles.count}>{compactCount(video.shares)}</Text>
      </Pressable>
    </View>
  );
}

const textShadow = { textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  rail: { alignItems: 'center', gap: 20 },
  item: { alignItems: 'center', gap: 2 },
  count: { color: colors.textDim, fontFamily: fonts.narrow, fontSize: 12, ...textShadow },
  shadow: textShadow,
});
