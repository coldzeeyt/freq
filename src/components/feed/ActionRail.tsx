import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useToast } from '@/components/ui/Toast';
import { getStation } from '@/data/stations';
import { compactCount } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts } from '@/theme';
import type { Video } from '@/types/models';

export function ActionRail({ video }: { video: Video }) {
  const { likedIds, toggleLike, me, isAdmin } = useFreq();
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const canDelete = !video.permanent && (video.creator.id === me.id || isAdmin);
  const showMore = canDelete || video.permanent;
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
      {showMore && (
        <View>
          <Pressable
            onPress={() => {
              haptics.tap();
              setMenu((m) => !m);
              setConfirm(false);
            }}
            hitSlop={8}
            style={styles.item}
            accessibilityLabel="More"
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} style={styles.shadow} />
          </Pressable>
          {menu && (
            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(120)} style={styles.menu}>
              {video.permanent ? (
                <View style={styles.menuRow}>
                  <Ionicons name="lock-closed" size={14} color={colors.textDim} />
                  <Text style={styles.menuDim}>Locked in the Vault. Can’t be deleted.</Text>
                </View>
              ) : (
                <Pressable
                  onPress={async () => {
                    if (!confirm) {
                      haptics.warning();
                      setConfirm(true);
                      return;
                    }
                    try {
                      await services.videos.deleteVideo(video.id);
                      haptics.success();
                      toast('Video deleted');
                    } catch (e) {
                      toast((e as Error).message);
                    }
                    setMenu(false);
                  }}
                  style={styles.menuRow}
                  accessibilityLabel={confirm ? 'Confirm delete' : 'Delete video'}
                >
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  <Text style={styles.menuDanger}>
                    {confirm ? 'Tap again to delete' : video.creator.id === me.id ? 'Delete video' : 'Delete (admin)'}
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}

const textShadow = { textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  rail: { alignItems: 'center', gap: 20 },
  item: { alignItems: 'center', gap: 2 },
  count: { color: colors.textDim, fontFamily: fonts.narrow, fontSize: 12, ...textShadow },
  shadow: textShadow,
  menu: {
    position: 'absolute',
    right: 34,
    bottom: -4,
    minWidth: 190,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(23,22,19,0.97)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  menuDanger: { color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 14 },
  menuDim: { flex: 1, color: colors.textDim, fontFamily: fonts.body, fontSize: 13 },
});
