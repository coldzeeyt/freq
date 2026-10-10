import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BandDisplay } from '@/components/dial/BandDisplay';
import { StaticOverlay } from '@/components/dial/StaticOverlay';
import { TuningDial } from '@/components/dial/TuningDial';
import { OnAirButton } from '@/components/onair/OnAirButton';
import { VideoFeed } from '@/components/feed/VideoFeed';
import { Avatar } from '@/components/ui/Avatar';
import { HumanOnlyToggle } from '@/components/ui/HumanOnlyToggle';
import { useToast } from '@/components/ui/Toast';
import { getStation, STATIONS, stationIndex } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { useFreq } from '@/state/FreqProvider';
import { useStationFeed } from '@/state/useStationFeed';
import { useTuner } from '@/state/useTuner';
import { colors, fonts } from '@/theme';

const DIAL = 80;
const DIAL_MARGIN = 10;

export default function FeedScreen() {
  const { stationId, humanOnly, muted, hydrated, account, me, setStation, setMuted, setHumanOnly } = useFreq();
  const { videos, error: feedError, retry: retryFeed } = useStationFeed(stationId, humanOnly);
  const tuner = useTuner(stationId, setStation);
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const station = getStation(stationId);
  const displayed = tuner.previewIndex !== null ? STATIONS[tuner.previewIndex] : station;

  // ← / → turn the dial on desktop browsers.
  const { tuneTo } = tuner;
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || !focused) return;
      const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!delta) return;
      e.preventDefault();
      const i = (stationIndex(stationId) + delta + STATIONS.length) % STATIONS.length;
      tuneTo(STATIONS[i].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stationId, tuneTo, focused]);

  const toggleHumanOnly = (on: boolean) => {
    haptics.toggle();
    setHumanOnly(on);
    toast(on ? 'Human only: camera recordings and verified creators' : 'Showing everything');
  };

  if (hydrated && !account) return <Redirect href="/welcome" />;

  return (
    <View style={styles.screen}>
      <View style={styles.stage}>
        <VideoFeed
          videos={hydrated ? videos : null}
          feedKey={`${stationId}-${humanOnly}`}
          muted={muted}
          holdPlayback={tuner.tuning || !focused}
          railBottom={DIAL + DIAL_MARGIN * 2 + insets.bottom + 4}
          infoRight={DIAL + DIAL_MARGIN * 2}
          infoBottom={insets.bottom + 18}
          showStation={stationId === 'all'}
          emptyTitle={feedError ? 'No signal.' : 'There aren’t enough videos on Freq yet.'}
          emptyMessage={
            feedError
              ? feedError
              : stationId === 'all'
                ? 'Be one of the first to go on air. Record one now!'
                : `Be the first on ${station.frequency.toFixed(1)} ${station.name}. Record one now!`
          }
          emptyAction={
            feedError
              ? { label: 'Try again', icon: 'refresh', onPress: retryFeed }
              : {
                  label: 'Record one now',
                  icon: 'radio-button-on',
                  onPress: () => {
                    haptics.tap();
                    router.push({ pathname: '/post', params: { start: 'record' } });
                  },
                }
          }
        />

        <StaticOverlay level={tuner.staticLevel} visible={tuner.staticVisible} />

        <LinearGradient
          colors={['rgba(14,13,11,0.6)', 'rgba(14,13,11,0.2)', 'rgba(14,13,11,0)']}
          style={[styles.topScrim, { height: insets.top + 110 }]}
          pointerEvents="none"
        />

        <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <Text style={styles.wordmark}>freq</Text>
              <View style={styles.led} />
            </View>
            <View style={styles.topActions}>
              <HumanOnlyToggle value={humanOnly} onChange={toggleHumanOnly} />
              <OnAirButton />
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push('/post');
                }}
                style={styles.postButton}
                hitSlop={8}
                accessibilityLabel="New post"
              >
                <Ionicons name="add" size={20} color={colors.signalInk} />
              </Pressable>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push('/me');
                }}
                hitSlop={8}
                accessibilityLabel="Your account"
              >
                <Avatar creator={me} size={30} />
              </Pressable>
            </View>
          </View>
          <BandDisplay
            station={displayed}
            tuning={tuner.tuning}
            bandOnlyWhileTuning
            trailing={
              <View style={styles.readoutActions}>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push({ pathname: '/talk/[station]', params: { station: stationId } });
                }}
                hitSlop={10}
                style={styles.talk}
                accessibilityLabel={`${station.name} Talk`}
              >
                <Ionicons name="chatbubbles-outline" size={16} color={colors.text} />
                <Text style={styles.talkText}>Talk</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  setMuted(!muted);
                }}
                hitSlop={12}
                style={styles.mute}
                accessibilityLabel={muted ? 'Unmute' : 'Mute'}
              >
                {muted && Platform.OS === 'web' && (
                  <Animated.Text entering={FadeIn.delay(800)} style={styles.soundHintText}>
                    sound off
                  </Animated.Text>
                )}
                <Ionicons name={muted ? 'volume-mute-outline' : 'volume-high-outline'} size={18} color={colors.textDim} />
              </Pressable>
              </View>
            }
          />
        </View>

        <View style={[styles.dial, { bottom: DIAL_MARGIN + insets.bottom }]}>
          <TuningDial
            count={STATIONS.length}
            index={stationIndex(stationId)}
            litIndex={tuner.previewIndex ?? stationIndex(stationId)}
            size={DIAL}
            onTuneStart={tuner.onTuneStart}
            onDetent={tuner.onDetent}
            onTuneEnd={tuner.onTuneEnd}
          />
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  stage: { flex: 1 },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  wordmark: { color: colors.text, fontFamily: fonts.heavy, fontSize: 24, letterSpacing: -1 },
  led: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.signal, marginTop: 6 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.signal,
  },
  mute: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readoutActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  talk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: 'rgba(14,13,11,0.35)',
  },
  talkText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 12 },
  soundHintText: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 10 },
  dial: { position: 'absolute', right: DIAL_MARGIN },
});
