import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { getStation } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { isHumanMade } from '@/lib/human';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts } from '@/theme';
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
  /** The dial sits bottom-right: the rail stacks above it, the caption beside it. */
  railBottom: number;
  infoRight: number;
  showStation: boolean;
  onDuration: (videoId: string, seconds: number) => void;
}

export const VideoCard = memo(function VideoCard(props: Props) {
  const { video, height, isActive, shouldLoad, railBottom, infoRight, showStation } = props;
  const { likedIds, toggleLike } = useFreq();
  const [userPaused, setUserPaused] = useState(false);
  const [wasActive, setWasActive] = useState(isActive);
  // Leaving a card clears its manual pause (state adjusted during render, not in an effect).
  if (wasActive !== isActive) {
    setWasActive(isActive);
    if (!isActive) setUserPaused(false);
  }

  // Double-tap heart burst at the tap point.
  const burst = useSharedValue(0);
  const [burstAt, setBurstAt] = useState({ x: 0, y: 0, key: 0 });
  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.get() > 0 ? Math.min(1, burst.get() * 1.4) : 0,
    transform: [{ scale: 0.6 + burst.get() * 0.6 }, { rotate: `${(burstAt.key % 2 ? -1 : 1) * 12}deg` }],
  }));

  const onDoubleTap = (x: number, y: number) => {
    if (!likedIds.has(video.id)) toggleLike(video);
    haptics.like();
    setBurstAt((b) => ({ x, y, key: b.key + 1 }));
    burst.set(withSequence(withSpring(1, { damping: 7, stiffness: 320 }), withDelay(350, withTiming(0, { duration: 260 }))));
  };

  const onSingleTap = () => {
    haptics.tap();
    setUserPaused((p) => !p);
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(240)
    .onEnd((e, ok) => {
      if (ok) scheduleOnRN(onDoubleTap, e.x, e.y);
    });
  const singleTap = Gesture.Tap().onEnd((_e, ok) => {
    if (ok) scheduleOnRN(onSingleTap);
  });
  const taps = Gesture.Exclusive(doubleTap, singleTap);

  const station = getStation(video.stationId);

  return (
    <View style={[styles.card, { height }]}>
      {video.thumbnail && <Image source={{ uri: video.thumbnail }} style={styles.media} blurRadius={shouldLoad ? 0 : 8} />}
      {shouldLoad && <VideoSurface {...props} playing={isActive && !userPaused && !props.holdPlayback} />}

      <LinearGradient
        colors={['rgba(14,13,11,0)', 'rgba(14,13,11,0.35)', 'rgba(14,13,11,0.85)']}
        locations={[0.5, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <GestureDetector gesture={taps}>
        <View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="button"
          accessibilityLabel={userPaused ? 'Play video' : 'Pause video'}
          accessibilityHint="Double tap to like"
        >
          {userPaused && isActive && (
            <Animated.View entering={ZoomIn.duration(140)} exiting={FadeOut.duration(140)} style={styles.pauseIcon}>
              <Ionicons name="play" size={56} color="rgba(237,230,214,0.85)" />
            </Animated.View>
          )}
          <Animated.View
            pointerEvents="none"
            style={[styles.burst, { left: burstAt.x - 48, top: burstAt.y - 48 }, burstStyle]}
          >
            <Ionicons name="heart" size={96} color={colors.like} />
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={[styles.info, { right: infoRight }]} pointerEvents="none">
        {showStation && (
          <Text style={styles.stationTag}>
            {station.frequency.toFixed(1)} {station.name}
          </Text>
        )}
        <View style={styles.creatorRow}>
          <Text style={styles.handle}>@{video.creator.handle}</Text>
          {isHumanMade(video) && <HumanBadge />}
        </View>
        {!!video.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {video.caption}
          </Text>
        )}
        {video.tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {video.tags.map((t) => `#${t}`).join('  ')}
          </Text>
        )}
      </View>

      <View style={[styles.rail, { bottom: railBottom }]} pointerEvents="box-none">
        <ActionRail video={video} />
      </View>
    </View>
  );
});

function VideoSurface({ video, muted, playing, isActive, onDuration }: Props & { playing: boolean }) {
  const player = useVideoPlayer(video.uri, (p) => {
    p.loop = true;
    p.muted = muted;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [firstFrame, setFirstFrame] = useState(false);

  useEffect(() => {
    // expo-video players are configured imperatively.
    // eslint-disable-next-line react-hooks/immutability
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [player, playing]);

  useEffect(() => {
    if (status === 'readyToPlay' && player.duration > 0) onDuration(video.id, player.duration);
  }, [status, player, video.id, onDuration]);

  // Start from the top each time you come back to a video.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    if (!isActive) player.currentTime = 0;
  }, [player, isActive]);

  return (
    <>
      <Animated.View style={[styles.media, { opacity: firstFrame ? 1 : 0 }]}>
        <VideoView
          player={player}
          style={styles.media}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          playsInline
          onFirstFrameRender={() => setFirstFrame(true)}
        />
      </Animated.View>
      {status === 'loading' && isActive && <ActivityIndicator style={styles.spinner} color={colors.text} />}
      {status === 'error' && (
        <View style={styles.errorBox} pointerEvents="none">
          <Text style={styles.errorText}>No signal. This video didn’t load.</Text>
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

const shadow = { textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: colors.bg, overflow: 'hidden' },
  // Explicit size: on web the video is a raw <video>, which ignores top/bottom stretching.
  media: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  spinner: { position: 'absolute', top: '46%', alignSelf: 'center' },
  errorBox: { position: 'absolute', top: '46%', alignSelf: 'center' },
  errorText: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 12 },
  pauseIcon: { position: 'absolute', top: '43%', alignSelf: 'center' },
  burst: { position: 'absolute', width: 96, height: 96 },
  info: { position: 'absolute', left: 16, bottom: 16, gap: 5 },
  stationTag: { color: colors.signal, fontFamily: fonts.mono, fontSize: 11, ...shadow },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15, ...shadow },
  caption: { color: colors.text, fontFamily: fonts.body, fontSize: 14, lineHeight: 19, ...shadow },
  tags: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 11, ...shadow },
  rail: { position: 'absolute', right: 10 },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: 'rgba(237,230,214,0.12)' },
  progressFill: { height: 2, backgroundColor: colors.text },
});
