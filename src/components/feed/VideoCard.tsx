import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, useAnimatedStyle, useSharedValue, ZoomIn } from 'react-native-reanimated';
import { getStation } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { isHumanMade } from '@/lib/human';
import { colors } from '@/theme';
import type { Video } from '@/types/models';
import { ActionRail } from './ActionRail';
import { HumanBadge } from './HumanBadge';

interface Props {
  video: Video;
  height: number;
  isActive: boolean;
  /** Only cards near the active one hold a video player. */
  shouldLoad: boolean;
  muted: boolean;
  /** Paused from outside, e.g. while the dial is tuning. */
  holdPlayback: boolean;
  /** Space reserved at the bottom for the tuner console. */
  bottomInset: number;
  showStation: boolean;
}

export const VideoCard = memo(function VideoCard(props: Props) {
  const { video, height, isActive, shouldLoad, bottomInset, showStation } = props;
  const [userPaused, setUserPaused] = useState(false);
  const [wasActive, setWasActive] = useState(isActive);
  // Leaving a card clears its manual pause (state adjusted during render, not in an effect).
  if (wasActive !== isActive) {
    setWasActive(isActive);
    if (!isActive) setUserPaused(false);
  }

  const station = getStation(video.stationId);

  return (
    <View style={[styles.card, { height }]}>
      {shouldLoad ? (
        <VideoSurface {...props} playing={isActive && !userPaused && !props.holdPlayback} />
      ) : (
        <View style={styles.placeholder} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.82)']}
        locations={[0.45, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          haptics.tap();
          setUserPaused((p) => !p);
        }}
        accessibilityRole="button"
        accessibilityLabel={userPaused ? 'Play video' : 'Pause video'}
      >
        {userPaused && isActive && (
          <Animated.View entering={ZoomIn.duration(160)} exiting={FadeOut.duration(160)} style={styles.pauseIcon}>
            <Ionicons name="play" size={64} color="rgba(255,255,255,0.9)" />
          </Animated.View>
        )}
      </Pressable>

      <View style={[styles.overlay, { bottom: bottomInset + 12 }]} pointerEvents="box-none">
        <View style={styles.info} pointerEvents="none">
          <View style={styles.creatorRow}>
            <Text style={styles.handle}>{video.creator.handle}</Text>
            {isHumanMade(video) && <HumanBadge />}
          </View>
          <Text style={styles.caption} numberOfLines={2}>
            {video.caption}
          </Text>
          {showStation && (
            <Text style={[styles.stationTag, { color: station.color }]}>
              {station.frequency.toFixed(1)} {station.name.toUpperCase()}
            </Text>
          )}
        </View>
        <ActionRail video={video} />
      </View>
    </View>
  );
});

function VideoSurface({ video, muted, playing, isActive }: Props & { playing: boolean }) {
  const player = useVideoPlayer(video.uri, (p) => {
    p.loop = true;
    p.muted = muted;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    // expo-video players are configured imperatively.
    // eslint-disable-next-line react-hooks/immutability
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [player, playing]);

  // Start from the top each time you come back to a video.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    if (!isActive) player.currentTime = 0;
  }, [player, isActive]);

  return (
    <>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        playsInline
      />
      {status === 'loading' && <ActivityIndicator style={styles.spinner} color={colors.glow} />}
      {status === 'error' && (
        <View style={styles.errorBox} pointerEvents="none">
          <Ionicons name="radio-outline" size={28} color={colors.textDim} />
          <Text style={styles.errorText}>Signal lost — couldn’t load this video</Text>
        </View>
      )}
      {isActive && <ProgressBar player={player} />}
    </>
  );
}

function ProgressBar({ player }: { player: VideoPlayer }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    player.timeUpdateEventInterval = 0.25;
  }, [player]);
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    progress.set(player.duration > 0 ? currentTime / player.duration : 0);
  });
  const style = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return (
    <View style={styles.progressTrack} pointerEvents="none">
      <Animated.View style={[styles.progressFill, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: '#000', overflow: 'hidden' },
  // Explicit size: on web this is a raw <video>, which ignores top/bottom stretching.
  video: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  placeholder: { ...StyleSheet.absoluteFill, backgroundColor: '#0B0B0F' },
  spinner: { position: 'absolute', top: '45%', alignSelf: 'center' },
  errorBox: { position: 'absolute', top: '42%', alignSelf: 'center', alignItems: 'center', gap: 8 },
  errorText: { color: colors.textDim, fontSize: 13 },
  pauseIcon: { position: 'absolute', top: '42%', alignSelf: 'center' },
  overlay: {
    position: 'absolute',
    left: 16,
    right: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  info: { flex: 1, gap: 6, paddingBottom: 4 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  caption: { color: 'rgba(255,255,255,0.92)', fontSize: 14, lineHeight: 19 },
  stationTag: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { height: 2, backgroundColor: colors.glow },
});
